"use client";
// ─── El espacio del anfitrión en el muro: sus fotos y un video corto ──────────
//
// Las mismas fotos que ven los invitados a distancia (eventos.fotos_anfitrion)
// y el video corto que subió al editar el evento. Aparece arriba de las fotos
// de los invitados solo si el anfitrión lo activó ("Mostrar en el muro").
// Un carrusel horizontal (el video primero) y un visor propio: estas fotos no
// son publicaciones de invitados, así que no llevan reacciones ni comentarios.

import { useEffect, useRef, useState } from "react";

type Item = { tipo: "foto" | "video"; url: string };

export default function GaleriaAnfitrion({ titulo, de, fotos, video, dorado }: {
  /** "Mis fotos de graduación" */
  titulo: string;
  /** "de Carlos" (o null) */
  de: string | null;
  fotos: string[];
  video: string | null;
  /** Detalle del tema (dorado en graduación) */
  dorado: string;
}) {
  const items: Item[] = [...(video ? [{ tipo: "video" as const, url: video }] : []), ...fotos.map((url) => ({ tipo: "foto" as const, url }))];
  const [abierto, setAbierto] = useState<number | null>(null);
  if (!items.length) return null;

  return (
    <section className="ga" aria-label={titulo}>
      <style>{ESTILOS}</style>
      <div className="ga-cab">
        <p className="ga-titulo" style={{ backgroundImage: `linear-gradient(100deg,#8A672C,${dorado} 40%,#8A672C 80%)` }}>{titulo}</p>
        {de && <p className="ga-de">{de}</p>}
      </div>
      <div className="ga-carril">
        {items.map((it, i) => (
          <button key={it.url + i} type="button" className={`ga-item${it.tipo === "video" ? " video" : ""}`} onClick={() => setAbierto(i)}
            aria-label={it.tipo === "video" ? "Ver el video" : `Ver la foto ${i + 1}`}>
            {it.tipo === "video" ? (
              <>
                <video src={`${it.url}#t=0.5`} muted playsInline preload="metadata" />
                <span className="ga-play" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
                </span>
                <span className="ga-etiqueta">Video</span>
              </>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.url} alt="" loading="lazy" decoding="async" />
            )}
          </button>
        ))}
      </div>
      {abierto !== null && (
        <VisorAnfitrion items={items} indice={abierto} onCambiar={setAbierto} onCerrar={() => setAbierto(null)} />
      )}
    </section>
  );
}

function VisorAnfitrion({ items, indice, onCambiar, onCerrar }: { items: Item[]; indice: number; onCambiar: (i: number) => void; onCerrar: () => void }) {
  const it = items[indice];
  const toque = useRef<number | null>(null);
  const hayAnterior = indice > 0;
  const haySiguiente = indice < items.length - 1;

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
      if (e.key === "ArrowLeft" && hayAnterior) onCambiar(indice - 1);
      if (e.key === "ArrowRight" && haySiguiente) onCambiar(indice + 1);
    };
    window.addEventListener("keydown", fn);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", fn); document.body.style.overflow = overflow; };
  }, [indice, hayAnterior, haySiguiente, onCambiar, onCerrar]);

  return (
    <div className="gav" role="dialog" aria-label={it.tipo === "video" ? "Video" : `Foto ${indice + 1} de ${items.length}`}>
      {it.tipo === "foto" && <div key={`a-${indice}`} className="gav-ambiente" style={{ backgroundImage: `url("${it.url}")` }} aria-hidden="true" />}
      <div className="gav-velo" aria-hidden="true" />
      <div className="gav-barra">
        <span className="gav-cuenta">{indice + 1} / {items.length}</span>
        <button type="button" className="gav-ico" onClick={onCerrar} aria-label="Cerrar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>
      <div
        className="gav-escena"
        onTouchStart={(e) => { toque.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const x0 = toque.current; toque.current = null;
          if (x0 === null || it.tipo === "video") return;
          const dx = e.changedTouches[0].clientX - x0;
          if (dx < -50 && haySiguiente) onCambiar(indice + 1);
          if (dx > 50 && hayAnterior) onCambiar(indice - 1);
        }}
      >
        {it.tipo === "video" ? (
          // Al sonar, la música del muro baja sola (escucha el "play" de la página)
          <video key={`v-${indice}`} className="gav-medio" src={it.url} controls autoPlay playsInline />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={`f-${indice}`} className="gav-medio" src={it.url} alt="" />
        )}
        {hayAnterior && (
          <button type="button" className="gav-flecha izq" onClick={() => onCambiar(indice - 1)} aria-label="Anterior">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        )}
        {haySiguiente && (
          <button type="button" className="gav-flecha der" onClick={() => onCambiar(indice + 1)} aria-label="Siguiente">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        )}
      </div>
    </div>
  );
}

const ESTILOS = `
@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
.ga{margin:2px 0 18px}
.ga-cab{text-align:center;margin-bottom:10px}
.ga-titulo{font-family:'Great Vibes',cursive;font-size:30px;line-height:1.1;-webkit-background-clip:text;background-clip:text;color:transparent}
.ga-de{font-family:'Playfair Display',Georgia,serif;font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:#64748B;margin-top:2px}
.ga-carril{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding:4px 2px 10px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.ga-carril::-webkit-scrollbar{display:none}
.ga-item{position:relative;flex:0 0 auto;width:min(62vw,230px);aspect-ratio:4/5;border-radius:18px;overflow:hidden;border:4px solid #fff;padding:0;cursor:pointer;scroll-snap-align:center;
  background:#E7EAF2;box-shadow:0 14px 30px -16px rgba(15,23,42,.55);transition:transform .2s}
.ga-item:active{transform:scale(.97)}
.ga-item img,.ga-item video{width:100%;height:100%;object-fit:cover;display:block}
.ga-item.video{background:#0F172A}
.ga-play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;padding-left:3px;
  background:rgba(255,255,255,.9);color:#0F172A;box-shadow:0 8px 24px rgba(0,0,0,.35)}
.ga-etiqueta{position:absolute;left:10px;bottom:10px;padding:3px 10px;border-radius:99px;background:rgba(15,23,42,.65);color:#fff;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
.gav{position:fixed;inset:0;z-index:9999;background:#05070D;display:flex;flex-direction:column;overflow:hidden}
.gav-ambiente{position:absolute;inset:-60px;background-size:cover;background-position:center;filter:blur(38px) saturate(1.3) brightness(.7);transform:scale(1.15)}
.gav-velo{position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,7,13,.5),rgba(5,7,13,.3) 45%,rgba(5,7,13,.65))}
.gav-barra,.gav-escena{position:relative;z-index:1}
.gav-barra{display:flex;align-items:center;justify-content:space-between;padding:max(12px,env(safe-area-inset-top,12px)) 12px 8px;color:#fff}
.gav-cuenta{font-size:13px;font-weight:700;opacity:.85;font-variant-numeric:tabular-nums}
.gav-ico{width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.12);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer}
.gav-escena{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:10px 10px max(18px,env(safe-area-inset-bottom,18px));touch-action:pan-y}
.gav-medio{max-width:100%;max-height:100%;object-fit:contain;border-radius:10px;filter:drop-shadow(0 18px 40px rgba(0,0,0,.55))}
.gav-flecha{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.14);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer}
.gav-flecha.izq{left:12px}.gav-flecha.der{right:12px}
@media (hover:none){.gav-flecha{display:none}}
`;
