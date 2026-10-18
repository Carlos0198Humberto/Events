"use client";
// ─── Galería del muro: tarjetas + visor ───────────────────────────────────────
//
// Cada foto es una tarjeta: la foto con su lugar reservado (ancho/alto, nada
// salta mientras carga), quién la subió, cuándo, sus reacciones y, si tiene,
// lo que escribió. La grilla usa miniaturas (thumb_url, ~80 KB).
//
// El visor muestra la foto sobre ella misma difuminada (como las historias),
// la miniatura al instante y la completa encima apenas llega. Doble toque =
// «Me encanta», con el corazón que late. Reacciones y comentarios se guardan
// en la base.
//
// Las reacciones son íconos propios, no emojis: un emoji se dibuja distinto en
// cada teléfono. En la base se siguen guardando ❤️ 🔥 😍 (la tabla tiene un
// CHECK con esos valores); acá solo cambia cómo se ven.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export type FotoMuro = {
  id: string;
  url: string;
  thumb_url?: string | null;
  ancho?: number | null;
  alto?: number | null;
  path?: string | null;
  created_at: string;
  invitado_id: string;
  caption: string | null;
  /** El reto que cumple (supabase-retos-muro.sql): 'protagonista' | 'pastel' | null */
  reto?: string | null;
  invitados: { nombre: string } | null;
};

export type TemaMuro = {
  acento: string;      // botones, avatares
  tinta: string;       // títulos
  suave: string;       // fondos suaves
  borde: string;
  destaque: string;    // detalle (dorado en graduación)
  esqueleto: string;   // fondo mientras carga
};

// La tabla reacciones acepta estos emojis (CHECK en la base): son la clave que
// se guarda; el dibujo es propio
export const REACCIONES_MURO = [
  { emoji: "❤️", label: "Me encanta" },
  { emoji: "🔥", label: "¡Qué chivo!" },
  { emoji: "😍", label: "Foto de lujo" },
] as const;

export type ReaccionFila = { foto_id: string; invitado_id: string; emoji: string };

// ─── Íconos de las reacciones ─────────────────────────────────────────────────
const DIBUJO_REACCION: Record<string, { de: string; a: string; icono: ReactNode }> = {
  "❤️": {
    de: "#FF7A95", a: "#E11D48",
    icono: <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" fill="#fff" />,
  },
  "🔥": {
    de: "#FFC857", a: "#F45B19",
    icono: <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5Z" fill="#fff" />,
  },
  "😍": {
    de: "#F6DD93", a: "#B8862B",
    icono: (
      <>
        <path d="M9.94 15.5a2 2 0 0 0-1.44-1.44l-6.13-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.13a.5.5 0 0 1 .96 0l1.58 6.13a2 2 0 0 0 1.44 1.44l6.13 1.58a.5.5 0 0 1 0 .96l-6.13 1.58a2 2 0 0 0-1.44 1.44l-1.58 6.13a.5.5 0 0 1-.96 0Z" fill="#fff" />
        <path d="M20 3v4M22 5h-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  },
};

export function IconoReaccionMuro({ emoji, size = 28 }: { emoji: string; size?: number }) {
  const d = DIBUJO_REACCION[emoji] ?? DIBUJO_REACCION["❤️"];
  return (
    <span
      className="irm"
      aria-hidden="true"
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.34), background: `linear-gradient(140deg, ${d.de}, ${d.a})` }}
    >
      <svg width={Math.round(size * 0.6)} height={Math.round(size * 0.6)} viewBox="0 0 24 24">{d.icono}</svg>
    </span>
  );
}

export function miniatura(f: FotoMuro) {
  return f.thumb_url || f.url;
}

function tiempoRelativo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "Recién";
  if (s < 3600) return `Hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `Hace ${Math.floor(s / 3600)} h`;
  return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short" });
}

function Inicial({ nombre, size, fondo }: { nombre: string; size: number; fondo: string }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0, background: fondo, color: "#FFFFFF",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.42, fontWeight: 700, lineHeight: 1, boxShadow: "0 0 0 2px rgba(255,255,255,.9)",
    }}>
      {(nombre || "?").trim().charAt(0).toUpperCase()}
    </span>
  );
}

// ─── Tarjeta de la grilla: una polaroid ───────────────────────────────────────
// Marco blanco, apenas inclinada (cada foto siempre igual: el giro sale de su
// id), con un trozo de cinta arriba y lo que escribió el invitado a mano
// debajo. Si cumple un reto, lo dice al pie.
const GIROS = [-2.2, 1.6, -1.1, 2, -0.6, 1.2, -1.7, 0.8];
function giroDe(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return GIROS[h % GIROS.length];
}

export function MiniaturaFoto({ foto, nueva, totalReacciones, emojis, tema, reto, onAbrir }: {
  foto: FotoMuro;
  nueva: boolean;
  totalReacciones: number;
  /** Reacciones que recibió la foto, la más usada primero (se muestran hasta tres) */
  emojis?: string[];
  tema: TemaMuro;
  /** El reto que cumple esta foto (nombre e ícono), si es de un reto */
  reto?: { nombre: string; icono: ReactNode } | null;
  onAbrir: () => void;
}) {
  const [lista, setLista] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  // Si la foto ya estaba en memoria (el círculo del reto muestra la misma), su
  // «load» llega antes de que React escuche y la foto quedaba invisible:
  // decode() se resuelve igual, haya pasado o no el evento
  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    if (el.complete && el.naturalWidth > 0) { setLista(true); return; }
    let vivo = true;
    el.decode?.().then(() => { if (vivo) setLista(true); }).catch(() => {});
    return () => { vivo = false; };
  }, [foto.id]);
  const nombre = foto.invitados?.nombre ?? "Invitado";
  const pila = nombre.split(" ")[0];
  // Con medidas reales se reserva el lugar exacto; sin ellas (fotos viejas), un 4:5 recortado
  const proporcion = foto.ancho && foto.alto ? `${foto.ancho} / ${foto.alto}` : "4 / 5";
  return (
    <button className="mf" onClick={onAbrir} aria-label={`Foto de ${nombre}`} style={{ borderColor: tema.borde, ["--giro" as string]: `${giroDe(foto.id)}deg` }}>
      <span className="mf-cinta" aria-hidden="true" style={{ background: tema.destaque }} />
      <span className="mf-foto" style={{ aspectRatio: proporcion, background: tema.esqueleto }}>
        <img
          src={miniatura(foto)}
          alt=""
          loading="lazy"
          decoding="async"
          className={lista ? "lista" : undefined}
          onLoad={() => setLista(true)}
          // Si la miniatura no está (borrada del storage), se cae a la original
          onError={(e) => { const img = e.currentTarget; if (img.src !== foto.url) img.src = foto.url; }}
          ref={imgRef}
        />
        {!lista && <span className="mf-brillo" aria-hidden="true" />}
        {nueva && <span className="mf-nueva" style={{ background: tema.destaque, color: tema.tinta }}>Nueva</span>}
        {totalReacciones > 0 && (
          <span className="mf-reac" aria-label={`${totalReacciones} reacciones`}>
            <span className="mf-reac-iconos">
              {(emojis?.length ? emojis.slice(0, 3) : ["❤️"]).map((e) => <IconoReaccionMuro key={e} emoji={e} size={18} />)}
            </span>
            {totalReacciones}
          </span>
        )}
      </span>
      <span className="mf-pie">
        {foto.caption && <span className="mf-frase" style={{ color: tema.tinta }}>{foto.caption}</span>}
        {reto && (
          <span className="mf-reto" style={{ color: tema.acento }}>
            {reto.icono}{reto.nombre}
          </span>
        )}
        <span className="mf-meta">
          <Inicial nombre={nombre} size={18} fondo={tema.acento} />
          <b style={{ color: tema.tinta }}>{pila}</b>
          <span aria-hidden="true">·</span>
          <span>{tiempoRelativo(foto.created_at)}</span>
        </span>
      </span>
    </button>
  );
}

// ─── Visor a pantalla completa ────────────────────────────────────────────────
export function VisorFoto({
  fotos, indice, onCambiar, onCerrar, esOrg, onEliminar, onDescargar,
  invitadoId, invitadoNombre, eventoId, reacciones, onReaccionar, tema, nombreAnfitrion, retoDe,
}: {
  fotos: FotoMuro[];
  indice: number;
  onCambiar: (i: number) => void;
  onCerrar: () => void;
  esOrg: boolean;
  onEliminar: (id: string) => void;
  onDescargar: (f: FotoMuro) => void;
  invitadoId: string | null;
  invitadoNombre: string;
  /** Con quién firma el anfitrión sus comentarios (comenta sin enlace de invitado) */
  nombreAnfitrion?: string;
  eventoId: string;
  reacciones: ReaccionFila[];
  onReaccionar: (fotoId: string, emoji: string) => Promise<string | null>;
  tema: TemaMuro;
  /** El reto que cumple la foto (nombre e ícono), si es de un reto */
  retoDe?: (f: FotoMuro) => { nombre: string; icono: ReactNode } | null;
}) {
  const foto = fotos[indice];
  const reto = retoDe?.(foto) ?? null;
  const [completaLista, setCompletaLista] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [comentarios, setComentarios] = useState<{ id: string; nombre_autor: string; texto: string; created_at: string }[]>([]);
  const [comentariosOk, setComentariosOk] = useState(true);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  // El corazón que late con el doble toque, y la reacción que "salta" al tocarla
  const [latido, setLatido] = useState(0);
  const [salto, setSalto] = useState<string | null>(null);
  const toque = useRef<number | null>(null);
  const ultimoToque = useRef(0);

  const hayAnterior = indice > 0;
  const haySiguiente = indice < fotos.length - 1;

  // Teclado y bloqueo del scroll de fondo
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "Escape") onCerrar();
      if (e.key === "ArrowLeft" && hayAnterior) onCambiar(indice - 1);
      if (e.key === "ArrowRight" && haySiguiente) onCambiar(indice + 1);
    };
    window.addEventListener("keydown", fn);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", fn); document.body.style.overflow = overflow; };
  }, [indice, hayAnterior, haySiguiente, onCambiar, onCerrar]);

  // Al cambiar de foto: comentarios de esa foto y precarga de las vecinas
  useEffect(() => {
    setCompletaLista(false);
    setAviso(null);
    let vivo = true;
    supabase.from("comentarios_fotos").select("id,nombre_autor,texto,created_at")
      .eq("foto_id", foto.id).order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!vivo) return;
        if (error) { setComentariosOk(false); return; } // falta supabase-muro.sql
        setComentariosOk(true);
        setComentarios(data ?? []);
      });
    [fotos[indice - 1], fotos[indice + 1]].forEach((v) => { if (v) { const im = new Image(); im.src = miniatura(v); } });
    return () => { vivo = false; };
  // Solo al cambiar de foto: la lista llega como array nuevo en cada render del
  // muro y, si fuera dependencia, cada reacción borraría el aviso y la foto completa.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foto.id]);

  const puedeComentar = !!invitadoId || esOrg;
  const deEsta = reacciones.filter(r => r.foto_id === foto.id);
  const mia = invitadoId ? deEsta.find(r => r.invitado_id === invitadoId)?.emoji ?? null : null;
  const nombre = foto.invitados?.nombre ?? "Invitado";

  async function reaccionar(emoji: string) {
    if (!invitadoId) { setAviso("Abrí el muro desde tu invitación para reaccionar."); return; }
    setSalto(emoji);
    setTimeout(() => setSalto(null), 500);
    const error = await onReaccionar(foto.id, emoji);
    setAviso(error);
  }

  // Doble toque: «Me encanta» (si ya le gustaba, solo late: no la saca)
  function dobleToque() {
    setLatido(Date.now());
    if (invitadoId && mia !== "❤️") reaccionar("❤️");
  }

  async function comentar() {
    const limpio = texto.trim().slice(0, 300);
    // Comenta un invitado con su enlace o el anfitrión (supabase-distancia.sql
    // agregó el permiso para el organizador)
    if (!limpio || !puedeComentar || enviando) return;
    setEnviando(true);
    const { data, error } = await supabase.from("comentarios_fotos")
      .insert({
        foto_id: foto.id, evento_id: eventoId, texto: limpio,
        invitado_id: invitadoId ?? null,
        nombre_autor: invitadoId ? invitadoNombre || "Invitado" : nombreAnfitrion || "Anfitrión",
      })
      .select("id,nombre_autor,texto,created_at").single();
    setEnviando(false);
    if (error || !data) {
      // El anfitrión comenta con el permiso de supabase-distancia.sql
      setAviso(!invitadoId ? "No se pudo publicar. Si no corriste supabase-distancia.sql, hacelo para comentar como anfitrión." : "No se pudo publicar el comentario. Probá de nuevo.");
      return;
    }
    setComentarios(prev => [...prev, data]);
    setTexto("");
  }

  return (
    <div className="vf" role="dialog" aria-label={`Foto de ${nombre}`}>
      {/* La foto misma, difuminada, de fondo */}
      <div key={`amb-${foto.id}`} className="vf-ambiente" style={{ backgroundImage: `url("${miniatura(foto)}")` }} aria-hidden="true" />
      <div className="vf-velo" aria-hidden="true" />

      {/* Barra superior: quién la subió, cuántas van y las acciones */}
      <div className="vf-barra">
        <div className="vf-autor">
          <Inicial nombre={nombre} size={36} fondo={tema.acento} />
          <div style={{ minWidth: 0 }}>
            <div className="vf-autor-nombre">{nombre}</div>
            <div className="vf-autor-cuando">{tiempoRelativo(foto.created_at)} · {indice + 1} de {fotos.length}</div>
          </div>
        </div>
        <div className="vf-acciones">
          <button className="vf-ico" onClick={() => onDescargar(foto)} aria-label="Descargar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          </button>
          {esOrg && (
            <button className="vf-ico vf-peligro" onClick={() => onEliminar(foto.id)} aria-label="Eliminar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
            </button>
          )}
          <button className="vf-ico" onClick={onCerrar} aria-label="Cerrar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
      <div className="vf-progreso" aria-hidden="true"><span style={{ width: `${((indice + 1) / fotos.length) * 100}%`, background: tema.destaque }} /></div>

      <div className="vf-cuerpo">
        {/* Foto: la miniatura al instante, la completa encima apenas llega. Se desliza con el dedo. */}
        <div
          className="vf-escena"
          onTouchStart={(e) => { toque.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            const x0 = toque.current; toque.current = null;
            if (x0 === null) return;
            const dx = e.changedTouches[0].clientX - x0;
            if (dx < -50 && haySiguiente) { onCambiar(indice + 1); return; }
            if (dx > 50 && hayAnterior) { onCambiar(indice - 1); return; }
            if (Math.abs(dx) < 10) {
              const ahora = Date.now();
              if (ahora - ultimoToque.current < 300) { ultimoToque.current = 0; dobleToque(); }
              else ultimoToque.current = ahora;
            }
          }}
          onDoubleClick={dobleToque}
        >
          <div key={`f-${foto.id}`} className="vf-marco">
            <img className="vf-img" src={miniatura(foto)} alt=""
              onError={(e) => { const img = e.currentTarget; if (img.src !== foto.url) img.src = foto.url; }} />
            {foto.thumb_url && (
              <img className={`vf-img vf-completa${completaLista ? " lista" : ""}`} src={foto.url} alt=""
                onLoad={() => setCompletaLista(true)} />
            )}
          </div>
          {foto.thumb_url && !completaLista && <span className="vf-cargando" aria-label="Cargando foto en alta calidad" />}
          {latido > 0 && (
            <span key={latido} className="vf-latido" aria-hidden="true">
              <svg width="110" height="110" viewBox="0 0 24 24"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" fill="#fff" /></svg>
            </span>
          )}
          {hayAnterior && (
            <button className="vf-flecha vf-izq" onClick={() => onCambiar(indice - 1)} aria-label="Anterior">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          )}
          {haySiguiente && (
            <button className="vf-flecha vf-der" onClick={() => onCambiar(indice + 1)} aria-label="Siguiente">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          )}
        </div>

        {/* Panel esmerilado: lo que escribió, reacciones y comentarios */}
        <div className="vf-panel" style={{ borderTopColor: tema.destaque }}>
          {reto && <p className="vf-reto" style={{ color: tema.destaque }}>{reto.icono} Reto: {reto.nombre}</p>}
          {foto.caption && <p className="vf-caption">“{foto.caption}”</p>}

          <div className="vf-reacciones">
            {REACCIONES_MURO.map(r => {
              const n = deEsta.filter(x => x.emoji === r.emoji).length;
              const activa = mia === r.emoji;
              return (
                <button key={r.emoji} className={`vf-reac${activa ? " activa" : ""}${salto === r.emoji ? " salta" : ""}`} onClick={() => reaccionar(r.emoji)}
                  style={activa ? { borderColor: tema.destaque } : undefined}
                  aria-pressed={activa}>
                  <IconoReaccionMuro emoji={r.emoji} size={30} />
                  <span className="vf-reac-txt">{r.label}</span>
                  {n > 0 && <b>{n}</b>}
                </button>
              );
            })}
          </div>
          {!invitadoId && !esOrg && <p className="vf-pista">Abrí el muro desde tu invitación para reaccionar y comentar.</p>}
          {(invitadoId || esOrg) && <p className="vf-pista">Tocá dos veces la foto para darle «Me encanta».</p>}
          {aviso && <p className="vf-aviso">{aviso}</p>}

          {comentariosOk && (
            <div className="vf-comentarios">
              {comentarios.map(c => (
                <div key={c.id} className="vf-com">
                  <Inicial nombre={c.nombre_autor} size={26} fondo={tema.acento} />
                  <div><b>{c.nombre_autor}</b> {c.texto}</div>
                </div>
              ))}
              {puedeComentar && (
                <div className="vf-escribir">
                  <input value={texto} maxLength={300} onChange={e => setTexto(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") comentar(); }}
                    placeholder={comentarios.length ? "Sumá un comentario…" : "Sé el primero en comentar…"} />
                  <button onClick={comentar} disabled={!texto.trim() || enviando} style={{ background: tema.destaque, color: tema.tinta }} aria-label="Publicar comentario">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Estilos de la galería y el visor (se montan una vez) ─────────────────────
export function EstilosGaleria({ tema }: { tema: TemaMuro }) {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap');
      @keyframes mfEntra{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
      @keyframes mfBrillo{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
      @keyframes vfGira{to{transform:rotate(360deg)}}
      @keyframes vfFoto{from{opacity:0;transform:scale(.965)}to{opacity:1;transform:none}}
      @keyframes vfLatido{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}25%{opacity:1;transform:translate(-50%,-50%) scale(1.15)}45%{transform:translate(-50%,-50%) scale(.95)}70%{opacity:1;transform:translate(-50%,-50%) scale(1.05)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.25)}}
      @keyframes irmSalta{0%{transform:scale(1)}35%{transform:scale(1.35) rotate(-8deg)}65%{transform:scale(.92) rotate(4deg)}100%{transform:scale(1)}}
      .irm{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 6px rgba(15,23,42,.18),inset 0 1px 0 rgba(255,255,255,.35)}
      .galeria-cabecera{display:flex;align-items:baseline;justify-content:space-between;margin:4px 2px 10px;font-size:13px;font-weight:700}
      .galeria-orden{font-size:11.5px;font-weight:500;color:#94A3B8}
      .opt-banner{display:flex;align-items:center;gap:12px;background:#FFFFFF;border:1px solid;border-radius:14px;padding:12px 14px;margin-bottom:12px;font-size:12px;color:#64748B;line-height:1.4}
      .opt-banner b{display:block;font-size:13px;margin-bottom:2px}
      .opt-banner button{flex-shrink:0;border:none;border-radius:10px;padding:9px 14px;color:#FFFFFF;font-size:12.5px;font-weight:700;cursor:pointer}
      .opt-banner button:disabled{opacity:.6;cursor:wait}
      .galeria{columns:2;column-gap:12px}
      @media (min-width:640px){.galeria{columns:3}}
      /* Pocas fotos: no se reparten en columnas vacías (una sola foto quedaba
         chiquita en una esquina). Una va centrada y grande; dos, lado a lado. */
      .galeria.galeria-1{columns:1;max-width:420px;margin:0 auto}
      @media (min-width:640px){.galeria.galeria-2{columns:2;max-width:640px;margin:0 auto}}

      /* Polaroid: marco blanco con más papel abajo, apenas inclinada, con un
         trozo de cinta arriba. El giro va en «rotate» (no en transform) para
         no pelear con la animación de entrada ni con el hover. */
      .mf{position:relative;display:block;width:100%;margin:6px 0 18px;padding:8px 8px 0;border:1px solid;border-radius:3px;background:#FFFFFF;cursor:pointer;text-align:left;font-family:inherit;
        break-inside:avoid;rotate:var(--giro,0deg);box-shadow:0 1px 2px rgba(15,23,42,.08),0 14px 24px -16px rgba(15,23,42,.5);animation:mfEntra .45s ease both;
        transition:transform .2s,box-shadow .2s,rotate .25s;-webkit-tap-highlight-color:transparent}
      @media (hover:hover){.mf:hover{rotate:0deg;transform:translateY(-3px);box-shadow:0 1px 2px rgba(15,23,42,.08),0 22px 34px -18px rgba(15,23,42,.55)}}
      .mf:active{transform:scale(.985)}
      .mf-cinta{position:absolute;top:-9px;left:50%;width:62px;height:18px;margin-left:-31px;opacity:.55;rotate:-3deg;z-index:2;border-radius:2px;
        mask:linear-gradient(90deg,transparent 0,#000 4px,#000 calc(100% - 4px),transparent 100%);-webkit-mask:linear-gradient(90deg,transparent 0,#000 4px,#000 calc(100% - 4px),transparent 100%)}
      .mf-foto{position:relative;display:block;width:100%;border-radius:2px;overflow:hidden}
      .mf-foto img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .45s ease,transform .6s ease;display:block}
      .mf-foto img.lista{opacity:1}
      @media (hover:hover){.mf:hover .mf-foto img{transform:scale(1.03)}}
      .mf-brillo{position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,0.45) 50%,transparent 70%);animation:mfBrillo 1.3s ease-in-out infinite}
      .mf-nueva{position:absolute;top:8px;left:8px;padding:3px 9px;border-radius:99px;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;box-shadow:0 2px 8px rgba(0,0,0,0.25)}
      .mf-reac{position:absolute;right:8px;bottom:8px;display:inline-flex;align-items:center;gap:5px;padding:3px 9px 3px 4px;border-radius:99px;
        background:rgba(255,255,255,.92);color:#0F172A;font-size:11.5px;font-weight:800;box-shadow:0 4px 12px rgba(15,23,42,.25)}
      .mf-reac-iconos{display:inline-flex}
      .mf-reac-iconos .irm+.irm{margin-left:-6px}
      .mf-reac-iconos .irm{border:1.5px solid #fff}
      .mf-pie{display:flex;flex-direction:column;align-items:center;gap:4px;padding:9px 4px 11px;text-align:center}
      .mf-frase{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;font-family:'Caveat','Segoe Print','Bradley Hand',cursive;font-size:21px;font-weight:600;line-height:1.05;overflow-wrap:anywhere}
      .mf-reto{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;line-height:1.2}
      .mf-meta{display:inline-flex;align-items:center;gap:5px;max-width:100%;font-size:11px;color:#94A3B8;white-space:nowrap}
      .mf-meta b{font-size:11.5px;font-weight:700;overflow:hidden;text-overflow:ellipsis}
      @media (prefers-reduced-motion: reduce){.mf,.mf-brillo{animation:none}}

      /* Visor: la foto sobre ella misma difuminada */
      .vf{position:fixed;inset:0;z-index:9999;background:#05070D;display:flex;flex-direction:column;overflow:hidden;animation:mfEntra .2s ease both}
      .vf-ambiente{position:absolute;inset:-60px;background-size:cover;background-position:center;filter:blur(38px) saturate(1.35) brightness(.75);transform:scale(1.15);animation:vfFoto .5s ease both}
      .vf-velo{position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,7,13,.55) 0%,rgba(5,7,13,.25) 40%,rgba(5,7,13,.7) 100%)}
      .vf-barra,.vf-progreso,.vf-cuerpo{position:relative;z-index:1}
      .vf-barra{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:max(12px,env(safe-area-inset-top,12px)) 12px 10px;color:#FFFFFF}
      .vf-autor{display:flex;align-items:center;gap:10px;min-width:0}
      .vf-autor-nombre{font-size:14.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 6px rgba(0,0,0,.4)}
      .vf-autor-cuando{font-size:11.5px;opacity:.75;margin-top:1px;font-variant-numeric:tabular-nums}
      .vf-acciones{display:flex;gap:8px;flex-shrink:0}
      .vf-ico{width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,0.12);color:#FFFFFF;display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(8px)}
      .vf-peligro{background:rgba(220,38,38,0.32)}
      .vf-progreso{height:2px;margin:0 12px;border-radius:2px;background:rgba(255,255,255,.18);overflow:hidden}
      .vf-progreso span{display:block;height:100%;border-radius:2px;transition:width .35s ease}
      .vf-cuerpo{flex:1;min-height:0;display:flex;flex-direction:column}
      .vf-escena{position:relative;flex:1;min-height:0;touch-action:pan-y;user-select:none;-webkit-user-select:none}
      .vf-marco{position:absolute;inset:12px 10px;animation:vfFoto .35s ease both}
      .vf-img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block;filter:drop-shadow(0 18px 40px rgba(0,0,0,.55))}
      .vf-completa{opacity:0;transition:opacity .35s ease}
      .vf-completa.lista{opacity:1}
      .vf-cargando{position:absolute;right:18px;bottom:18px;width:18px;height:18px;border-radius:50%;border:2px solid rgba(255,255,255,0.25);border-top-color:#FFFFFF;animation:vfGira .8s linear infinite}
      .vf-latido{position:absolute;left:50%;top:50%;pointer-events:none;filter:drop-shadow(0 6px 22px rgba(225,29,72,.7));animation:vfLatido .9s ease both}
      .vf-flecha{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,0.14);color:#FFFFFF;display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(8px)}
      .vf-izq{left:12px}.vf-der{right:12px}
      @media (hover:none){.vf-flecha{display:none}}
      .vf-panel{background:rgba(12,14,22,.72);backdrop-filter:blur(22px) saturate(1.3);-webkit-backdrop-filter:blur(22px) saturate(1.3);
        border-top:1.5px solid;border-radius:22px 22px 0 0;padding:16px 16px max(16px,env(safe-area-inset-bottom,16px));max-height:44vh;overflow-y:auto;color:#F1F5F9}
      @media (min-width:900px){
        .vf-cuerpo{flex-direction:row}
        .vf-panel{width:380px;max-height:none;border-radius:22px 0 0 0;border-top:none;border-left:1.5px solid ${tema.destaque}}
      }
      .vf-reto{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;margin-bottom:8px}
      .vf-caption{font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:16px;line-height:1.5;color:#FFFFFF;margin-bottom:12px}
      .vf-reacciones{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
      .vf-reac{display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 6px 9px;border-radius:16px;border:1.5px solid rgba(255,255,255,.12);
        background:rgba(255,255,255,.06);color:#E2E8F0;cursor:pointer;font-family:inherit;transition:transform .12s,border-color .15s,background .15s;position:relative}
      .vf-reac:active{transform:scale(.95)}
      .vf-reac.activa{background:rgba(255,255,255,.14)}
      .vf-reac.salta .irm{animation:irmSalta .5s ease}
      .vf-reac-txt{font-size:11.5px;font-weight:700;line-height:1.1;text-align:center}
      .vf-reac b{position:absolute;top:6px;right:8px;min-width:20px;padding:1px 6px;border-radius:99px;background:rgba(255,255,255,.18);color:#fff;font-size:11px}
      .vf-reac.activa b{background:${tema.destaque};color:${tema.tinta}}
      .vf-pista{margin-top:10px;font-size:11.5px;color:rgba(226,232,240,.65);text-align:center}
      .vf-aviso{margin-top:8px;font-size:12px;color:#FCD34D}
      .vf-comentarios{margin-top:14px;border-top:1px solid rgba(255,255,255,.1);padding-top:12px;display:flex;flex-direction:column;gap:10px}
      .vf-com{display:flex;gap:9px;align-items:flex-start;font-size:13.5px;color:#E2E8F0;line-height:1.45}
      .vf-com b{color:#FFFFFF}
      .vf-escribir{display:flex;gap:8px;margin-top:2px}
      .vf-escribir input{flex:1;min-width:0;border:1.5px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);color:#FFFFFF;border-radius:12px;padding:10px 12px;font-size:14px;outline:none;font-family:inherit}
      .vf-escribir input::placeholder{color:rgba(226,232,240,.5)}
      .vf-escribir input:focus{border-color:${tema.destaque}}
      .vf-escribir button{width:42px;border:none;border-radius:12px;display:flex;align-items:center;justify-content:center;cursor:pointer}
      .vf-escribir button:disabled{opacity:.45;cursor:default}
      @media (prefers-reduced-motion: reduce){.vf-ambiente,.vf-marco,.vf-latido,.vf-reac.salta .irm{animation:none}}
    `}</style>
  );
}
