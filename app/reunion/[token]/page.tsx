"use client";
// ─── La invitación a una reunión del día (lo que abre el invitado) ────────────
//
// Su tarjeta, el día, la hora y el lugar (con «Cómo llegar»), la nota del
// organizador y la pregunta «¿Vas a ir?». Si tiene más de un lugar, elige
// cuántos van. Lee y responde por las funciones de supabase-reuniones.sql, que
// solo funcionan con su token.

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { datosTarjetaReunion } from "@/lib/reuniones";
import type { InvitacionReunion } from "@/lib/reunionServidor";
import { familiaDe, fechaLarga, horaCorta, motivoCelebracion } from "@/lib/tarjetaInvitacion";
import { nombreDePila, saludo, tratoDe } from "@/lib/tratoInvitado";
import { IcoCalendario, IcoCheck, IcoPersonas, IcoUbicacion } from "@/app/components/Iconos";

type Estado = InvitacionReunion["invitado"]["estado"];

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function ReunionInvitado() {
  const { token } = useParams<{ token: string }>();
  const [datos, setDatos] = useState<InvitacionReunion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [tarjeta, setTarjeta] = useState<string | null>(null);
  const [cuantos, setCuantos] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  // «Cambiar mi respuesta» vuelve a mostrar la pregunta
  const [cambiando, setCambiando] = useState(false);

  useEffect(() => {
    let vivo = true;
    supabase.rpc("reunion_por_token", { p_token: token }).then(({ data }) => {
      if (!vivo) return;
      const r = data as InvitacionReunion | null;
      if (r?.reunion) {
        setDatos(r);
        setCuantos(r.invitado.personas_confirmadas || r.invitado.num_personas || 1);
      }
      setCargando(false);
    });
    return () => { vivo = false; };
  }, [token]);

  // La tarjeta, la misma que le llegó por WhatsApp
  useEffect(() => {
    if (!datos) return;
    let url: string | null = null;
    let vivo = true;
    (async () => {
      try {
        const { generarTarjetaPNG } = await import("@/lib/tarjetaCanvas");
        const trato = tratoDe(datos.invitado.nombre, token);
        const blob = await generarTarjetaPNG(datosTarjetaReunion(datos.evento, datos.reunion, datos.invitado.nombre, trato));
        if (!vivo || !blob) return;
        url = URL.createObjectURL(blob);
        setTarjeta(url);
      } catch { /* sin tarjeta, queda la página */ }
    })();
    return () => { vivo = false; if (url) URL.revokeObjectURL(url); };
  }, [datos, token]);

  async function responder(estado: "confirmado" | "rechazado") {
    if (!datos) return;
    setEnviando(true);
    setError("");
    const { error: e } = await supabase.rpc("responder_reunion", { p_token: token, p_estado: estado, p_personas: estado === "confirmado" ? cuantos : null });
    setEnviando(false);
    if (e) { setError("No se pudo guardar tu respuesta. Revisá tu conexión y probá de nuevo."); return; }
    const van = estado === "confirmado" ? Math.min(Math.max(cuantos, 1), datos.invitado.num_personas) : 0;
    setDatos({ ...datos, invitado: { ...datos.invitado, estado: estado as Estado, personas_confirmadas: van } });
    setCambiando(false);
  }

  if (cargando) {
    return (
      <main className="ri">
        <style>{ESTILOS}</style>
        <div className="ri-cargando" aria-label="Cargando tu invitación" />
      </main>
    );
  }

  if (!datos) {
    return (
      <main className="ri">
        <style>{ESTILOS}</style>
        <section className="ri-caja ri-centro">
          <h1 className="ri-titulo">Esta invitación no existe</h1>
          <p className="ri-sub">Puede que el enlace esté incompleto. Pedile a quien te invitó que te lo mande de nuevo.</p>
        </section>
      </main>
    );
  }

  const { invitado, reunion, evento } = datos;
  const trato = tratoDe(invitado.nombre, token);
  const plural = trato === "plural";
  const cupo = Math.max(1, invitado.num_personas || 1);
  const preguntar = invitado.estado === "pendiente" || cambiando;
  const donde = [reunion.lugar, reunion.direccion].filter(Boolean).join(", ");
  const mapa = donde ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(donde)}` : null;
  const firma = familiaDe(evento) || evento.anfitriones?.trim();

  return (
    <main className="ri">
      <style>{ESTILOS}</style>

      <div className="ri-tarjeta" aria-hidden={!tarjeta}>
        {tarjeta
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={tarjeta} alt={`Invitación a ${reunion.nombre}`} />
          : <div className="ri-tarjeta-vacia" />}
      </div>

      <section className="ri-caja">
        <p className="ri-saludo">{saludo(nombreDePila(invitado.nombre), trato)},</p>
        <h1 className="ri-titulo">{reunion.nombre}</h1>
        <p className="ri-sub">Para celebrar {motivoCelebracion(evento)}</p>

        <div className="ri-datos">
          {reunion.fecha && (
            <p><span className="ri-ico"><IcoCalendario size={18} /></span>
              <span>{mayuscula(fechaLarga(reunion.fecha))}{reunion.hora && <small>{horaCorta(reunion.hora)}</small>}</span></p>
          )}
          {donde && (
            <p><span className="ri-ico"><IcoUbicacion size={18} /></span>
              <span>{reunion.lugar}{reunion.direccion && <small>{reunion.direccion}</small>}
                {mapa && <a className="ri-mapa" href={mapa} target="_blank" rel="noopener noreferrer">Cómo llegar</a>}</span></p>
          )}
          {cupo > 1 && (
            <p><span className="ri-ico"><IcoPersonas size={18} /></span><span>{cupo} lugares para {plural ? "ustedes" : "vos y los tuyos"}</span></p>
          )}
        </div>

        {reunion.nota && <p className="ri-nota">{reunion.nota}</p>}
      </section>

      <section className="ri-caja ri-responder" aria-live="polite">
        {preguntar ? (
          <>
            <h2>{plural ? "¿Van a ir?" : "¿Vas a ir?"}</h2>
            {cupo > 1 && (
              <div className="ri-cuantos">
                <span>¿Cuántos van?</span>
                <div className="ri-paso">
                  <button type="button" onClick={() => setCuantos((n) => Math.max(1, n - 1))} disabled={cuantos <= 1} aria-label="Uno menos">−</button>
                  <b>{cuantos}</b>
                  <button type="button" onClick={() => setCuantos((n) => Math.min(cupo, n + 1))} disabled={cuantos >= cupo} aria-label="Uno más">+</button>
                </div>
              </div>
            )}
            <div className="ri-botones">
              <button type="button" className="ri-si" disabled={enviando} onClick={() => responder("confirmado")}>
                {enviando ? "Guardando…" : plural ? "Sí, vamos" : "Sí, voy"}
              </button>
              <button type="button" className="ri-no" disabled={enviando} onClick={() => responder("rechazado")}>
                {plural ? "No podremos" : "No podré"}
              </button>
            </div>
            {error && <p className="ri-error">{error}</p>}
          </>
        ) : invitado.estado === "confirmado" ? (
          <>
            <span className="ri-ok"><IcoCheck size={22} strokeWidth={2.4} /></span>
            <h2>{plural ? "¡Los esperamos!" : "¡Te esperamos!"}</h2>
            <p className="ri-sub">
              {(invitado.personas_confirmadas ?? 1) > 1 ? `Van ${invitado.personas_confirmadas}.` : "Confirmaste que vas."}
            </p>
            <button type="button" className="ri-cambiar" onClick={() => setCambiando(true)}>Cambiar mi respuesta</button>
          </>
        ) : (
          <>
            <h2>Gracias por avisar</h2>
            <p className="ri-sub">{plural ? "Los vamos a extrañar." : "Te vamos a extrañar."}</p>
            <button type="button" className="ri-cambiar" onClick={() => setCambiando(true)}>Cambiar mi respuesta</button>
          </>
        )}
      </section>

      {firma && <p className="ri-firma">Con cariño, {firma}</p>}
    </main>
  );
}

const ESTILOS = `
@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:wght@500;600&family=EB+Garamond:ital@0;1&display=swap');
.ri{min-height:100dvh;padding:18px 16px 40px;background:radial-gradient(ellipse 90% 40% at 50% 0%,rgba(184,149,74,.12),transparent 70%),linear-gradient(180deg,#FFFFFF 0%,#F2F4F9 100%);
  color:#172036;font-family:'DM Sans',system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;gap:14px}
.ri-cargando{width:34px;height:34px;margin-top:40vh;border-radius:50%;border:3px solid rgba(23,32,54,.12);border-top-color:#B8954A;animation:riGira .8s linear infinite}
@keyframes riGira{to{transform:rotate(360deg)}}
.ri-tarjeta{width:min(100%,420px);border-radius:16px;overflow:hidden;box-shadow:0 24px 50px -24px rgba(10,15,36,.55);background:#0A0F24}
.ri-tarjeta img{display:block;width:100%;height:auto}
.ri-tarjeta-vacia{aspect-ratio:4/5}
.ri-caja{width:min(100%,420px);background:#FFFFFF;border:1px solid rgba(23,32,54,.08);border-radius:18px;padding:20px 18px;box-shadow:0 10px 30px -22px rgba(10,15,36,.4)}
.ri-centro{margin-top:30vh;text-align:center}
.ri-saludo{font-family:'Great Vibes',cursive;font-size:30px;line-height:1.1;color:#B8954A}
.ri-titulo{font-family:'Playfair Display',Georgia,serif;font-size:26px;font-weight:600;line-height:1.2;margin-top:4px}
.ri-sub{font-size:14px;color:#5B6378;margin-top:4px;line-height:1.45}
.ri-datos{display:flex;flex-direction:column;gap:12px;margin-top:16px;padding-top:14px;border-top:1px solid rgba(23,32,54,.08)}
.ri-datos p{display:flex;gap:12px;align-items:flex-start;font-size:15px;font-weight:600;line-height:1.35}
.ri-datos small{display:block;font-size:13.5px;font-weight:500;color:#5B6378;margin-top:2px}
.ri-ico{flex:0 0 auto;width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:rgba(184,149,74,.12);color:#8A6A2C}
.ri-mapa{display:inline-block;margin-top:6px;font-size:13px;font-weight:700;color:#1E3A5F;text-decoration:underline;text-underline-offset:2px}
.ri-nota{margin-top:16px;font-family:'EB Garamond',Georgia,serif;font-style:italic;font-size:18px;line-height:1.55;color:#33405C;text-align:justify;hyphens:auto}
.ri-responder{text-align:center}
.ri-responder h2{font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:600}
.ri-cuantos{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:14px 0 4px;padding:10px 12px;border-radius:14px;background:#F6F7FB;font-size:14px;font-weight:600}
.ri-paso{display:flex;align-items:center;gap:14px}
.ri-paso button{width:36px;height:36px;border-radius:50%;border:1.5px solid rgba(23,32,54,.15);background:#fff;font-size:20px;font-weight:700;color:#172036;cursor:pointer}
.ri-paso button:disabled{opacity:.35;cursor:default}
.ri-paso b{min-width:20px;font-size:18px}
.ri-botones{display:flex;flex-direction:column;gap:10px;margin-top:14px}
.ri-si,.ri-no{padding:15px;border-radius:14px;font-size:15.5px;font-weight:700;cursor:pointer;font-family:inherit}
.ri-si{border:none;background:#152039;color:#fff;box-shadow:0 10px 24px -12px rgba(21,32,57,.7)}
.ri-no{border:1.5px solid rgba(23,32,54,.15);background:#fff;color:#172036}
.ri-si:disabled,.ri-no:disabled{opacity:.6;cursor:wait}
.ri-error{margin-top:10px;font-size:13px;font-weight:600;color:#B91C1C}
.ri-ok{display:inline-flex;width:46px;height:46px;border-radius:50%;align-items:center;justify-content:center;background:#16A34A;color:#fff;margin-bottom:8px}
.ri-cambiar{margin-top:12px;padding:4px;border:none;background:none;font-size:13px;font-weight:700;color:#1E3A5F;text-decoration:underline;text-underline-offset:2px;cursor:pointer;font-family:inherit}
.ri-firma{font-family:'Great Vibes',cursive;font-size:26px;color:#B8954A;margin-top:6px;text-align:center}
@media (prefers-reduced-motion:reduce){.ri-cargando{animation:none}}
`;
