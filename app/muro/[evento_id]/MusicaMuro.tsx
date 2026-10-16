"use client";
// ─── Música de fondo del muro ─────────────────────────────────────────────────
//
// La canción propia del muro (la sube el organizador al editar el evento),
// distinta de la de la invitación. Los navegadores no dejan sonar nada sin
// un gesto: arranca con el primer toque en la página (salvo que la persona la
// haya apagado antes, eso se recuerda). Cualquier audio o video de la página
// que empiece a sonar —un deseo grabado, el video del anfitrión— es una voz: la
// música baja casi a cero y vuelve cuando termina. La transmisión en vivo
// (un iframe, que no avisa cuándo suena) pausa la música.

import { useCallback, useEffect, useRef, useState } from "react";
import { MezclaMusica } from "@/lib/musicaFondo";

const CLAVE = "evorix_muro_musica";

export default function MusicaMuro({ url, nombre, abajo }: { url: string; nombre?: string | null; abajo: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const mezclaRef = useRef<MezclaMusica | null>(null);
  const [sonando, setSonando] = useState(false);
  const [apagada, setApagada] = useState(true); // se lee al montar (localStorage)

  useEffect(() => {
    try { setApagada(localStorage.getItem(CLAVE) === "off"); } catch { setApagada(false); }
  }, []);

  const mezcla = useCallback(() => {
    if (!mezclaRef.current && audioRef.current) mezclaRef.current = new MezclaMusica(audioRef.current);
    return mezclaRef.current;
  }, []);

  const tocar = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    mezcla()?.preparar();
    a.play().then(() => setSonando(true)).catch(() => setSonando(false));
  }, [mezcla]);

  // Primer toque en cualquier parte: arranca (si no la apagó)
  useEffect(() => {
    if (apagada) return;
    const arrancar = (e: Event) => {
      if ((e.target as Element | null)?.closest?.("[data-musica-boton]")) return;
      quitar();
      tocar();
    };
    const quitar = () => {
      document.removeEventListener("click", arrancar, true);
      document.removeEventListener("touchend", arrancar, true);
    };
    document.addEventListener("click", arrancar, true);
    document.addEventListener("touchend", arrancar, true);
    return quitar;
  }, [apagada, tocar]);

  // La voz por encima: otro audio o video que suena baja la música
  useEffect(() => {
    const voces = new Set<EventTarget>();
    const empieza = (e: Event) => {
      if (e.target === audioRef.current) return;
      voces.add(e.target as EventTarget);
      mezcla()?.bajoVoz(true);
    };
    const termina = (e: Event) => {
      if (e.target === audioRef.current) return;
      voces.delete(e.target as EventTarget);
      if (voces.size === 0) mezcla()?.bajoVoz(false);
    };
    const transmision = () => { audioRef.current?.pause(); setSonando(false); };
    document.addEventListener("play", empieza, true);
    document.addEventListener("pause", termina, true);
    document.addEventListener("ended", termina, true);
    window.addEventListener("evorix:transmision", transmision);
    return () => {
      document.removeEventListener("play", empieza, true);
      document.removeEventListener("pause", termina, true);
      document.removeEventListener("ended", termina, true);
      window.removeEventListener("evorix:transmision", transmision);
    };
  }, [mezcla]);

  function alternar() {
    const a = audioRef.current;
    if (!a) return;
    if (sonando) {
      a.pause();
      setSonando(false);
      setApagada(true);
      try { localStorage.setItem(CLAVE, "off"); } catch { /* sin almacenamiento */ }
    } else {
      setApagada(false);
      try { localStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ }
      tocar();
    }
  }

  return (
    <>
      <audio ref={audioRef} src={url} crossOrigin="anonymous" loop playsInline preload="none" style={{ display: "none" }} />
      <button
        type="button"
        data-musica-boton
        className={`mm-boton${sonando ? " sonando" : ""}`}
        style={{ bottom: `calc(${abajo} + 12px)` }}
        onClick={alternar}
        aria-label={sonando ? "Pausar la música" : "Escuchar la música"}
        title={nombre ? `Música: ${nombre}` : "Música"}
      >
        {sonando ? (
          <span className="mm-barras" aria-hidden="true"><i /><i /><i /><i /></span>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
        )}
      </button>
      <style>{`
        .mm-boton{position:fixed;left:12px;z-index:60;width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,255,255,.35);
          display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;
          background:rgba(15,23,42,.62);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
          box-shadow:0 8px 24px rgba(15,23,42,.30);transition:transform .15s;-webkit-tap-highlight-color:transparent}
        .mm-boton:active{transform:scale(.92)}
        .mm-boton.sonando{background:linear-gradient(135deg,rgba(30,58,95,.88),rgba(15,23,42,.88));border-color:rgba(230,207,142,.6)}
        .mm-barras{display:flex;align-items:flex-end;gap:2.5px;height:16px}
        .mm-barras i{display:block;width:3px;border-radius:2px;background:#E6CF8E;animation:mmBarra .9s ease-in-out infinite}
        .mm-barras i:nth-child(2){animation-delay:.2s}.mm-barras i:nth-child(3){animation-delay:.45s}.mm-barras i:nth-child(4){animation-delay:.1s}
        @keyframes mmBarra{0%,100%{height:5px}50%{height:16px}}
        @media (prefers-reduced-motion:reduce){.mm-barras i{animation:none;height:10px}}
      `}</style>
    </>
  );
}
