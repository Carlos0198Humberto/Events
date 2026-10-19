// ─── La reunión desde el servidor (vista previa de WhatsApp) ─────────────────
//
// Igual que lib/tarjetaServidor: REST de Supabase con la clave pública. Las
// tablas de reuniones son solo del organizador; el invitado (y esta vista
// previa) leen por la función reunion_por_token, que exige el token.

import { datosTarjetaReunion, type Reunion } from "@/lib/reuniones";
import { armarDatosTarjeta, type DatosTarjeta, type EventoTarjeta } from "@/lib/tarjetaInvitacion";

const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLAVE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type InvitacionReunion = {
  invitado: { nombre: string; num_personas: number; estado: "pendiente" | "confirmado" | "rechazado"; personas_confirmadas: number | null; token: string };
  reunion: Pick<Reunion, "nombre" | "fecha" | "hora" | "lugar" | "direccion" | "nota" | "color">;
  evento: EventoTarjeta & { id: string };
};

export async function reunionPorToken(token: string): Promise<InvitacionReunion | null> {
  if (!URL_SB || !CLAVE || !/^[A-Za-z0-9]{10,64}$/.test(token)) return null;
  try {
    const res = await fetch(`${URL_SB}/rest/v1/rpc/reunion_por_token`, {
      method: "POST",
      headers: { apikey: CLAVE, Authorization: `Bearer ${CLAVE}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ p_token: token }),
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    const datos = (await res.json()) as InvitacionReunion | null;
    return datos?.reunion ? datos : null;
  } catch {
    return null;
  }
}

export async function datosTarjetaPorTokenReunion(token: string): Promise<{ datos: DatosTarjeta; encontrado: boolean }> {
  const r = await reunionPorToken(token);
  if (!r) return { datos: armarDatosTarjeta({ nombre: "Tu invitación", tipo: "otro" }, ""), encontrado: false };
  return { datos: datosTarjetaReunion(r.evento, r.reunion, r.invitado.nombre, null), encontrado: true };
}
