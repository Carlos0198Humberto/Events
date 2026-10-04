// ─── Datos de la tarjeta desde el servidor (vista previa de WhatsApp) ─────────
//
// Se consulta Supabase por REST con la clave pública, igual que la página de
// confirmación en el navegador: solo lectura del invitado por su token y de
// su evento. Si el token no existe, se devuelve una tarjeta genérica sin
// datos personales.

import { armarDatosTarjeta, type DatosTarjeta, type EventoTarjeta } from "@/lib/tarjetaInvitacion";

const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLAVE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function rest<T>(ruta: string): Promise<T | null> {
  if (!URL_SB || !CLAVE) return null;
  try {
    const res = await fetch(`${URL_SB}/rest/v1/${ruta}`, {
      headers: { apikey: CLAVE, Authorization: `Bearer ${CLAVE}`, Accept: "application/json" },
      // La invitación cambia poco: diez minutos de caché alcanzan
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function datosPorToken(token: string): Promise<{ datos: DatosTarjeta; encontrado: boolean }> {
  const generica = armarDatosTarjeta({ nombre: "Tu invitación", tipo: "otro" }, "");
  if (!/^[\w-]{6,80}$/.test(token)) return { datos: generica, encontrado: false };

  const invitados = await rest<{ nombre: string; evento_id: string }[]>(
    `invitados?token=eq.${encodeURIComponent(token)}&select=nombre,evento_id&limit=1`,
  );
  const inv = invitados?.[0];
  if (!inv) return { datos: generica, encontrado: false };

  // Con el versículo (columnas de supabase-envios.sql); si todavía no existen,
  // PostgREST responde error y se pide sin ellas
  const base = `eventos?id=eq.${encodeURIComponent(inv.evento_id)}&limit=1&select=nombre,tipo,anfitriones,fecha,hora,lugar`;
  const eventos = (await rest<EventoTarjeta[]>(`${base},versiculo_texto,versiculo_cita`)) ?? (await rest<EventoTarjeta[]>(base));
  const ev = eventos?.[0];
  if (!ev) return { datos: generica, encontrado: false };
  return { datos: armarDatosTarjeta(ev, inv.nombre), encontrado: true };
}
