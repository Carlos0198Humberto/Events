"use client";
// ─── Pre-invitación de graduación: «Reservá la fecha» ─────────────────────────
//
// Primer momento de la graduación. No se confirma nada todavía: queda constancia
// de que la persona está invitada y de la fecha, para que la aparte entre sus
// ocupaciones. La hora, el lugar y la confirmación llegan después, con el mismo
// enlace, cuando el organizador pasa el evento a la etapa de confirmación.
//
// Mismo lenguaje visual que «Confirmado»: cabecera azul marino con el nombre en
// blanco, cuerpo blanco y la fecha en bloque de imprenta, como en la tarjeta.

import { extrasDe, protagonistaDe, textosReserva, type EventoTarjeta } from "@/lib/tarjetaInvitacion";
import { nombreDePila, saludoDeCarta, type Trato } from "@/lib/tratoInvitado";
import { IcoCalendario } from "@/app/components/Iconos";

type Props = {
  evento: EventoTarjeta;
  invitadoNombre: string;
  trato: Trato;
  onAgendar: () => void;
  onGoogleCalendar: () => void;
};

function partesFecha(fecha: string) {
  const [y, m, d] = fecha.split("T")[0].split("-").map((n) => parseInt(n, 10));
  const f = new Date(y, (m || 1) - 1, d || 1);
  const hoy = new Date();
  const faltan = Math.round((f.getTime() - new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime()) / 86400000);
  return {
    semana: f.toLocaleDateString("es", { weekday: "long" }),
    dia: String(f.getDate()),
    mes: f.toLocaleDateString("es", { month: "long" }),
    anio: String(f.getFullYear()),
    faltan,
  };
}

export default function PreInvitacion({ evento, invitadoNombre, trato, onAgendar, onGoogleCalendar }: Props) {
  const p = protagonistaDe(evento);
  const ex = extrasDe(evento);
  const t = textosReserva(evento, trato);
  const f = evento.fecha ? partesFecha(evento.fecha) : null;

  return (
    <div className="pi-wrap">
      <style>{ESTILOS}</style>
      <article className="pi-card">
        <header className="pi-hero" data-guia="pi-inicio">
          <p className="pi-kicker">Pre-invitación · Graduación</p>
          <p className="pi-para">Para {nombreDePila(invitadoNombre)}</p>
          <h1 className="pi-nombre">{p.nombre}</h1>
          {ex.carrera && <p className="pi-carrera">{ex.carrera}</p>}
          {ex.institucion && <p className="pi-institucion">{ex.institucion}</p>}
        </header>

        <div className="pi-cuerpo">
          <p className="pi-saludo">{saludoDeCarta(invitadoNombre, trato)}</p>
          <p className="pi-texto" data-guia="pi-constancia">{t.constancia}</p>

          {f && (
            <div className="pi-fecha" data-guia="pi-fecha" aria-label={`${f.semana} ${f.dia} de ${f.mes} de ${f.anio}`}>
              <span className="pi-mes">{f.mes}</span>
              <div className="pi-fila">
                <span className="pi-lado">{f.semana}</span>
                <span className="pi-dia">{f.dia}</span>
                <span className="pi-lado">{f.anio}</span>
              </div>
              {f.faltan > 0 && <span className="pi-faltan">Faltan {f.faltan} {f.faltan === 1 ? "día" : "días"}</span>}
            </div>
          )}

          <p className="pi-texto">{t.apartar}</p>

          {evento.fecha && (
            <div className="pi-agendar" data-guia="pi-agendar">
              <button type="button" onClick={onAgendar}>
                <IcoCalendario size={18} />
                Agendar en mi calendario
              </button>
              <button type="button" className="pi-google" onClick={onGoogleCalendar}>o abrir directo en Google Calendar</button>
            </div>
          )}

          <p className="pi-despues" data-guia="pi-despues">{t.despues}</p>
          {t.firma && <p className="pi-firma">Con cariño,<strong>{t.firma}</strong></p>}
        </div>
      </article>
    </div>
  );
}

// Azul marino, plata y blanco: los colores de toda la graduación
const ESTILOS = `
.pi-wrap{max-width:460px;margin:0 auto;padding:18px 14px 44px;color:#152039}
@keyframes piSube{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.pi-card{background:#FFFFFF;border-radius:22px;overflow:hidden;border:1px solid rgba(21,32,57,0.08);
  box-shadow:0 22px 50px -24px rgba(21,32,57,0.30);animation:piSube .6s ease both}
.pi-hero{position:relative;text-align:center;padding:30px 22px 26px;color:#FFFFFF;
  background:linear-gradient(160deg,#1E2B5E 0%,#141C42 55%,#0A0F24 100%)}
.pi-hero::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.10;
  background-image:radial-gradient(circle,#C9D4EA 1px,transparent 1px);background-size:18px 18px}
.pi-hero>*{position:relative}
.pi-kicker{display:inline-block;font-family:'Cinzel',Georgia,serif;font-size:11px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;
  color:#C9D4EA;border:1px solid rgba(201,212,234,0.40);border-radius:99px;padding:6px 14px}
.pi-para{margin-top:16px;font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:17px;color:#DCE3F2}
.pi-nombre{margin-top:4px;font-family:'Playfair Display',Georgia,serif;font-size:clamp(30px,9vw,40px);font-weight:600;line-height:1.08;text-wrap:balance}
.pi-carrera{margin-top:10px;font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:17px;color:#DCE3F2;text-wrap:balance}
.pi-institucion{margin-top:5px;font-family:'Jost',sans-serif;font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#C9D4EA;text-wrap:balance}
.pi-cuerpo{padding:24px 22px 26px;display:grid;gap:14px}
.pi-saludo{font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:600;color:#152039}
.pi-texto{font-family:'Jost',sans-serif;font-size:16px;line-height:1.6;color:#2B3247;text-wrap:pretty}
.pi-fecha{display:grid;justify-items:center;gap:4px;padding:16px 10px;margin:4px 0;border-top:1px solid rgba(45,67,114,0.18);border-bottom:1px solid rgba(45,67,114,0.18)}
.pi-mes{font-family:'Jost',sans-serif;font-size:13px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:#2D4372}
.pi-fila{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:14px;width:100%}
.pi-lado{font-family:'Jost',sans-serif;font-size:13px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#152039;
  padding:7px 0;border-top:1px solid rgba(45,67,114,0.22);border-bottom:1px solid rgba(45,67,114,0.22);text-align:center}
.pi-dia{font-family:'Playfair Display',Georgia,serif;font-size:64px;font-weight:600;line-height:1;color:#152039}
.pi-faltan{margin-top:6px;font-family:'Jost',sans-serif;font-size:12.5px;color:#596279}
.pi-agendar{display:grid;gap:4px;justify-items:center}
.pi-agendar button:first-child{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:15px;border:none;border-radius:14px;cursor:pointer;
  background:#152039;color:#FFFFFF;font:600 15px 'Jost',sans-serif;box-shadow:0 10px 24px -10px rgba(21,32,57,0.50)}
.pi-agendar button:first-child:active{transform:scale(.98)}
.pi-google{border:none;background:none;cursor:pointer;padding:8px;font:600 12.5px 'Jost',sans-serif;color:#2D4372;text-decoration:underline;text-underline-offset:3px}
.pi-despues{font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:16px;line-height:1.55;color:#3B4258;text-align:center;
  background:#F4F6FA;border-radius:14px;padding:14px 16px}
.pi-firma{text-align:right;font-family:'Jost',sans-serif;font-size:14px;color:#596279;margin-top:4px}
.pi-firma strong{display:block;font-family:'Playfair Display',Georgia,serif;font-size:19px;font-weight:600;color:#152039;margin-top:2px}
.pi-wrap .guia-activa{outline:none;animation:none}
.pi-cuerpo .guia-activa{background:rgba(45,67,114,0.06);border-radius:12px;box-shadow:0 0 0 8px rgba(45,67,114,0.06);transition:background .4s,box-shadow .4s}
@media (prefers-reduced-motion:reduce){.pi-card{animation:none}}
`;
