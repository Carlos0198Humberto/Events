"use client";
// ─── Transmisión en vivo del culto (o de la ceremonia) ────────────────────────
//
// La usan el muro y la invitación a distancia. El reproductor no se carga
// hasta que la persona toca «Ver»: un video de YouTube o Facebook pesa varios
// megas, y muchos invitados abren el muro con datos del celular.
// Si el enlace no se puede incrustar (Zoom, la página de la iglesia en
// Facebook, un canal de YouTube con @nombre) queda el botón que lo abre.

import { useState } from "react";
import { transmisionDe } from "@/lib/transmision";

type Props = {
  enlace: string;
  titulo?: string | null;
  /** Fecha del evento (AAAA-MM-DD): ese día se marca «En vivo» */
  fecha?: string | null;
};

function esHoy(fecha?: string | null) {
  if (!fecha) return false;
  const d = new Date();
  const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return fecha.slice(0, 10) === hoy;
}

export default function TransmisionEnVivo({ enlace, titulo, fecha }: Props) {
  const t = transmisionDe(enlace);
  const [viendo, setViendo] = useState(false);
  if (!t) return null;
  const vivo = esHoy(fecha);
  const nombre = titulo?.trim() || "Transmisión en vivo";

  return (
    <div className="tv-caja">
      <style>{ESTILOS}</style>
      <div className="tv-cab">
        <span className={`tv-estado${vivo ? " vivo" : ""}`}>
          <span className="tv-punto" aria-hidden="true" />
          {vivo ? "En vivo hoy" : "Transmisión"}
        </span>
        <span className="tv-titulo">{nombre}</span>
      </div>

      {t.embed ? (
        <div className="tv-video">
          {viendo ? (
            <iframe
              src={`${t.embed}${t.plataforma === "youtube" ? "&autoplay=1" : "&autoplay=true"}`}
              title={nombre}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <button
              type="button"
              className="tv-portada"
              // Avisa al muro: la música de fondo se pausa (un iframe no dice cuándo suena)
              onClick={() => { setViendo(true); window.dispatchEvent(new Event("evorix:transmision")); }}
              aria-label={`Ver ${nombre}`}
            >
              <span className="tv-play" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
              </span>
              <span className="tv-portada-txt">Tocá para ver la transmisión</span>
            </button>
          )}
        </div>
      ) : null}

      <a className="tv-abrir" href={t.ver} target="_blank" rel="noopener noreferrer">
        {t.embed ? `Abrir en ${t.nombre}` : `Ver ${t.nombre === "la transmisión" ? "la transmisión" : `en ${t.nombre}`}`}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
      </a>
    </div>
  );
}

const ESTILOS = `
.tv-caja{background:#fff;border:1px solid rgba(15,23,42,.10);border-radius:18px;padding:14px;box-shadow:0 10px 28px -18px rgba(15,23,42,.35)}
.tv-cab{display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap}
.tv-estado{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:4px 10px;border-radius:999px;background:#F1F5F9;color:#475569}
.tv-estado.vivo{background:#FEE2E2;color:#B91C1C}
.tv-punto{width:7px;height:7px;border-radius:50%;background:currentColor}
.tv-estado.vivo .tv-punto{animation:tvLatido 1.4s ease-in-out infinite}
@keyframes tvLatido{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.7)}}
.tv-titulo{font-size:15px;font-weight:700;color:#0F172A;line-height:1.3}
.tv-video{position:relative;width:100%;aspect-ratio:16/9;border-radius:12px;overflow:hidden;background:#0F172A}
.tv-video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.tv-portada{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;border:none;cursor:pointer;color:#fff;
  background:radial-gradient(circle at 50% 40%,#334155 0%,#0F172A 75%)}
.tv-play{display:flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:#DC2626;box-shadow:0 8px 24px rgba(220,38,38,.45);padding-left:3px}
.tv-portada-txt{font-size:13.5px;font-weight:600;opacity:.92}
.tv-abrir{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:10px;padding:11px;border-radius:12px;border:1.5px solid rgba(15,23,42,.12);
  font-size:13.5px;font-weight:700;color:#0F172A;text-decoration:none;background:#F8FAFC}
@media (prefers-reduced-motion:reduce){.tv-estado.vivo .tv-punto{animation:none}}
`;
