"use client";
// ─── El video del anfitrión, dentro de la página ──────────────────────────────
//
// Lo usan el muro y la invitación a distancia. Igual que la transmisión: el
// reproductor de YouTube, TikTok o Facebook no se carga hasta que la persona
// toca «Ver» (pesa varios megas y muchos abren el muro con datos del celular),
// y al tocarlo se avisa al muro para que pause su música.
// Los cortos (Shorts, TikTok, reels) se ven verticales. Un archivo propio va en
// el reproductor del navegador; un enlace que no se puede incrustar, con un
// botón que lo abre.

import { useState } from "react";
import { videoDe, type VideoEnlace } from "@/lib/transmision";

type Props = {
  enlace: string;
  titulo?: string | null;
  /** El título arriba del video (en la carta a distancia ya lo dice la sección) */
  cabecera?: boolean;
};

// Que arranque solo al tocar «Ver» (cada reproductor lo pide a su manera)
function conAutoplay(v: VideoEnlace): string {
  const e = v.embed!;
  const sep = e.includes("?") ? "&" : "?";
  if (v.plataforma === "youtube" || v.plataforma === "vimeo" || v.plataforma === "tiktok") return `${e}${sep}autoplay=1`;
  if (v.plataforma === "facebook") return `${e}${sep}autoplay=true`;
  return e; // Drive e Instagram no tienen
}

export default function VideoIncrustado({ enlace, titulo, cabecera = true }: Props) {
  const v = videoDe(enlace);
  const [viendo, setViendo] = useState(false);
  if (!v) return null;
  const nombre = titulo?.trim() || "Un video del gran día";
  const forma = v.plataforma === "instagram" ? " insta" : v.vertical ? " vertical" : "";

  return (
    <div className="vi-caja">
      <style>{ESTILOS}</style>
      {cabecera && (v.embed || v.archivo) && (
        <div className="vi-cab">
          <span className="vi-chip">Video</span>
          <span className="vi-titulo">{nombre}</span>
        </div>
      )}
      {v.archivo ? (
        <div className="vi-video archivo">
          {/* Al sonar, la música del muro baja sola (escucha el "play" de la página) */}
          <video src={v.archivo} controls playsInline preload="metadata" aria-label={nombre} />
        </div>
      ) : v.embed ? (
        <div className={`vi-video${forma}`}>
          {viendo ? (
            <iframe
              src={conAutoplay(v)}
              title={nombre}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <button
              type="button"
              className="vi-portada"
              // Avisa al muro: la música de fondo se pausa (un iframe no dice cuándo suena)
              onClick={() => { setViendo(true); window.dispatchEvent(new Event("evorix:transmision")); }}
              aria-label={`Ver ${nombre}`}
            >
              {v.miniatura && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="vi-miniatura" src={v.miniatura} alt="" loading="lazy" />
              )}
              <span className="vi-play" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
              </span>
              <span className="vi-portada-txt">Tocá para ver el video</span>
            </button>
          )}
        </div>
      ) : (
        <a className="vi-solo-enlace" href={v.ver} target="_blank" rel="noopener noreferrer">
          <span className="vi-play chico" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
          </span>
          <span>{nombre}<small>{v.nombre === "el video" ? "Tocá para verlo" : `Tocá para verlo en ${v.nombre}`}</small></span>
        </a>
      )}

      {(v.embed || v.archivo) && v.plataforma !== "archivo" && (
        <a className="vi-abrir" href={v.ver} target="_blank" rel="noopener noreferrer">
          Abrir en {v.nombre}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
        </a>
      )}
    </div>
  );
}

const ESTILOS = `
.vi-caja{background:#fff;border:1px solid rgba(15,23,42,.10);border-radius:18px;padding:12px;box-shadow:0 10px 28px -18px rgba(15,23,42,.35)}
.vi-cab{display:flex;align-items:center;gap:10px;margin:2px 2px 10px;flex-wrap:wrap}
.vi-chip{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:4px 10px;border-radius:999px;background:#F1F5F9;color:#475569}
.vi-titulo{font-size:15px;font-weight:700;color:#0F172A;line-height:1.3}
.vi-video{position:relative;width:100%;aspect-ratio:16/9;border-radius:12px;overflow:hidden;background:#0F172A}
.vi-video.vertical{width:min(100%,340px);aspect-ratio:9/16;margin:0 auto}
.vi-video.insta{width:min(100%,340px);aspect-ratio:9/19;margin:0 auto;background:#fff}
.vi-video.archivo{aspect-ratio:auto;display:flex;justify-content:center}
.vi-video.archivo video{display:block;width:100%;max-height:70vh;background:#0F172A}
.vi-video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.vi-portada{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;border:none;cursor:pointer;color:#fff;padding:0;
  background:radial-gradient(circle at 50% 40%,#334155 0%,#0F172A 75%)}
.vi-miniatura{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.85}
.vi-play{position:relative;display:flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.94);color:#0F172A;
  box-shadow:0 8px 24px rgba(0,0,0,.40);padding-left:3px}
.vi-play.chico{width:44px;height:44px;flex:0 0 auto;background:#0F172A;color:#fff}
.vi-portada-txt{position:relative;font-size:13.5px;font-weight:700;text-shadow:0 1px 8px rgba(0,0,0,.6)}
.vi-solo-enlace{display:flex;align-items:center;gap:12px;padding:6px 4px;text-decoration:none;color:#0F172A;font-size:15px;font-weight:700;line-height:1.3}
.vi-solo-enlace small{display:block;font-size:12.5px;font-weight:600;color:#64748B;margin-top:2px}
.vi-abrir{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:10px;padding:10px;border-radius:12px;border:1.5px solid rgba(15,23,42,.12);
  font-size:13px;font-weight:700;color:#0F172A;text-decoration:none;background:#F8FAFC}
`;
