"use client";
// ─── Galería del muro: grilla liviana + visor ─────────────────────────────────
//
// La grilla muestra miniaturas (thumb_url, ~80 KB) en un mosaico de dos
// columnas con el lugar reservado según ancho/alto: nada salta mientras carga.
// El visor muestra la miniatura al instante y la foto completa encima apenas
// llega. Reacciones y comentarios se guardan en la base (antes vivían solo en
// la memoria del navegador y nadie más los veía).

import { useEffect, useRef, useState } from "react";
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

// La tabla reacciones acepta estos emojis (CHECK en la base)
export const REACCIONES_MURO = [
  { emoji: "❤️", label: "Me encanta" },
  { emoji: "🔥", label: "¡Qué chivo!" },
  { emoji: "😍", label: "Foto de lujo" },
] as const;

export type ReaccionFila = { foto_id: string; invitado_id: string; emoji: string };

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
      fontSize: size * 0.42, fontWeight: 700, lineHeight: 1,
    }}>
      {(nombre || "?").trim().charAt(0).toUpperCase()}
    </span>
  );
}

// ─── Mosaico de la grilla ─────────────────────────────────────────────────────
export function MiniaturaFoto({ foto, nueva, totalReacciones, emojis, tema, onAbrir }: {
  foto: FotoMuro;
  nueva: boolean;
  totalReacciones: number;
  /** Emojis que recibió la foto, el más usado primero (se muestran los dos primeros) */
  emojis?: string[];
  tema: TemaMuro;
  onAbrir: () => void;
}) {
  const [lista, setLista] = useState(false);
  const nombre = foto.invitados?.nombre ?? "Invitado";
  // Con medidas reales se reserva el lugar exacto; sin ellas (fotos viejas), un 4:5 recortado
  const proporcion = foto.ancho && foto.alto ? `${foto.ancho} / ${foto.alto}` : "4 / 5";
  return (
    <button className="mf" onClick={onAbrir} aria-label={`Foto de ${nombre}`}
      style={{ aspectRatio: proporcion, background: tema.esqueleto }}>
      <img
        src={miniatura(foto)}
        alt=""
        loading="lazy"
        decoding="async"
        className={lista ? "lista" : undefined}
        onLoad={() => setLista(true)}
        // Si la miniatura no está (borrada del storage), se cae a la original
        onError={(e) => { const img = e.currentTarget; if (img.src !== foto.url) img.src = foto.url; }}
        ref={(el) => { if (el?.complete && el.naturalWidth > 0 && !lista) setLista(true); }}
      />
      {!lista && <span className="mf-brillo" aria-hidden="true" />}
      <span className="mf-velo" aria-hidden="true" />
      {nueva && <span className="mf-nueva" style={{ background: tema.destaque }}>Nueva</span>}
      <span className="mf-pie">
        <Inicial nombre={nombre} size={20} fondo={tema.acento} />
        <span className="mf-autor">{nombre.split(" ")[0]}</span>
        {totalReacciones > 0 && (
          <span className="mf-reac" aria-label={`${totalReacciones} reacciones`}>
            {(emojis?.length ? emojis.slice(0, 2) : ["❤️"]).join("")} {totalReacciones}
          </span>
        )}
      </span>
    </button>
  );
}

// ─── Visor a pantalla completa ────────────────────────────────────────────────
export function VisorFoto({
  fotos, indice, onCambiar, onCerrar, esOrg, onEliminar, onDescargar,
  invitadoId, invitadoNombre, eventoId, reacciones, onReaccionar, tema, nombreAnfitrion,
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
}) {
  const foto = fotos[indice];
  const [completaLista, setCompletaLista] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [comentarios, setComentarios] = useState<{ id: string; nombre_autor: string; texto: string; created_at: string }[]>([]);
  const [comentariosOk, setComentariosOk] = useState(true);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const toque = useRef<number | null>(null);

  const hayAnterior = indice > 0;
  const haySiguiente = indice < fotos.length - 1;

  // Teclado y bloqueo del scroll de fondo
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
    const error = await onReaccionar(foto.id, emoji);
    setAviso(error);
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
      {/* Barra superior */}
      <div className="vf-barra">
        <button className="vf-ico" onClick={onCerrar} aria-label="Cerrar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <span className="vf-cuenta">{indice + 1} / {fotos.length}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="vf-ico" onClick={() => onDescargar(foto)} aria-label="Descargar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          </button>
          {esOrg && (
            <button className="vf-ico vf-peligro" onClick={() => onEliminar(foto.id)} aria-label="Eliminar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Foto: la miniatura al instante, la completa encima apenas llega. Se desliza con el dedo. */}
      <div
        className="vf-escena"
        onTouchStart={(e) => { toque.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const x0 = toque.current; toque.current = null;
          if (x0 === null) return;
          const dx = e.changedTouches[0].clientX - x0;
          if (dx < -50 && haySiguiente) onCambiar(indice + 1);
          if (dx > 50 && hayAnterior) onCambiar(indice - 1);
        }}
      >
        <img key={`b-${foto.id}`} className="vf-img" src={miniatura(foto)} alt=""
          onError={(e) => { const img = e.currentTarget; if (img.src !== foto.url) img.src = foto.url; }} />
        {foto.thumb_url && (
          <img key={`c-${foto.id}`} className={`vf-img vf-completa${completaLista ? " lista" : ""}`} src={foto.url} alt=""
            onLoad={() => setCompletaLista(true)} />
        )}
        {foto.thumb_url && !completaLista && <span className="vf-cargando" aria-label="Cargando foto en alta calidad" />}
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

      {/* Panel: quién la subió, reacciones y comentarios */}
      <div className="vf-panel">
        <div className="vf-autor">
          <Inicial nombre={nombre} size={34} fondo={tema.acento} />
          <div style={{ minWidth: 0 }}>
            <div className="vf-autor-nombre" style={{ color: tema.tinta }}>{nombre}</div>
            <div className="vf-autor-cuando">{tiempoRelativo(foto.created_at)}</div>
          </div>
        </div>
        {foto.caption && <p className="vf-caption">“{foto.caption}”</p>}

        <div className="vf-reacciones">
          {REACCIONES_MURO.map(r => {
            const n = deEsta.filter(x => x.emoji === r.emoji).length;
            const activa = mia === r.emoji;
            return (
              <button key={r.emoji} className={`vf-reac${activa ? " activa" : ""}`} onClick={() => reaccionar(r.emoji)}
                style={activa ? { borderColor: tema.destaque, background: tema.suave } : undefined}
                aria-pressed={activa}>
                <span style={{ fontSize: 16 }}>{r.emoji}</span>
                <span>{r.label}</span>
                {n > 0 && <b>{n}</b>}
              </button>
            );
          })}
        </div>
        {aviso && <p className="vf-aviso">{aviso}</p>}

        {comentariosOk && (
          <div className="vf-comentarios">
            {comentarios.map(c => (
              <div key={c.id} className="vf-com">
                <b style={{ color: tema.tinta }}>{c.nombre_autor}</b> {c.texto}
              </div>
            ))}
            {puedeComentar ? (
              <div className="vf-escribir">
                <input value={texto} maxLength={300} onChange={e => setTexto(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") comentar(); }}
                  placeholder={comentarios.length ? "Sumá un comentario…" : "Sé el primero en comentar…"} />
                <button onClick={comentar} disabled={!texto.trim() || enviando} style={{ background: tema.acento }} aria-label="Publicar comentario">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </button>
              </div>
            ) : (
              <p className="vf-sin-comentar">Para comentar, abrí el muro desde el enlace de tu invitación.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Estilos de la galería y el visor (se montan una vez) ─────────────────────
export function EstilosGaleria({ tema }: { tema: TemaMuro }) {
  return (
    <style>{`
      @keyframes mfEntra{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
      @keyframes mfBrillo{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
      @keyframes vfGira{to{transform:rotate(360deg)}}
      .galeria-cabecera{display:flex;align-items:baseline;justify-content:space-between;margin:4px 2px 10px;font-size:13px;font-weight:700}
      .galeria-orden{font-size:11.5px;font-weight:500;color:#94A3B8}
      .opt-banner{display:flex;align-items:center;gap:12px;background:#FFFFFF;border:1px solid;border-radius:14px;padding:12px 14px;margin-bottom:12px;font-size:12px;color:#64748B;line-height:1.4}
      .opt-banner b{display:block;font-size:13px;margin-bottom:2px}
      .opt-banner button{flex-shrink:0;border:none;border-radius:10px;padding:9px 14px;color:#FFFFFF;font-size:12.5px;font-weight:700;cursor:pointer}
      .opt-banner button:disabled{opacity:.6;cursor:wait}
      .galeria{columns:2;column-gap:10px}
      @media (min-width:640px){.galeria{columns:3}}
      /* Pocas fotos: no se reparten en columnas vacías (una sola foto quedaba
         chiquita en una esquina). Una va centrada y grande; dos, lado a lado. */
      .galeria.galeria-1{columns:1;max-width:420px;margin:0 auto}
      @media (min-width:640px){.galeria.galeria-2{columns:2;max-width:640px;margin:0 auto}}
      .mf{position:relative;display:block;width:100%;margin:0 0 10px;padding:0;border:none;border-radius:14px;overflow:hidden;cursor:pointer;
        break-inside:avoid;box-shadow:0 2px 10px rgba(15,23,42,0.10);animation:mfEntra .45s ease both;-webkit-tap-highlight-color:transparent}
      .mf img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .45s ease;display:block}
      .mf img.lista{opacity:1}
      .mf:active{transform:scale(.985)}
      .mf-brillo{position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,0.45) 50%,transparent 70%);animation:mfBrillo 1.3s ease-in-out infinite}
      .mf-velo{position:absolute;left:0;right:0;bottom:0;height:42%;background:linear-gradient(to top,rgba(0,0,0,0.55),transparent);pointer-events:none}
      .mf-nueva{position:absolute;top:8px;left:8px;padding:3px 9px;border-radius:99px;color:${tema.tinta};font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;box-shadow:0 2px 8px rgba(0,0,0,0.25)}
      .mf-pie{position:absolute;left:8px;right:8px;bottom:8px;display:flex;align-items:center;gap:6px;color:#FFFFFF;font-size:11.5px;font-weight:600;text-align:left}
      .mf-autor{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 4px rgba(0,0,0,0.5)}
      .mf-reac{flex-shrink:0;background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);border-radius:99px;padding:2px 7px;font-size:10.5px;letter-spacing:-.04em}
      @media (prefers-reduced-motion: reduce){.mf,.mf-brillo{animation:none}}

      .vf{position:fixed;inset:0;z-index:9999;background:#06080F;display:flex;flex-direction:column;animation:mfEntra .2s ease both}
      .vf-barra{display:flex;align-items:center;justify-content:space-between;padding:max(10px,env(safe-area-inset-top,10px)) 12px 8px;color:#FFFFFF}
      .vf-cuenta{font-size:13px;font-weight:600;opacity:.8;font-variant-numeric:tabular-nums}
      .vf-ico{width:40px;height:40px;border-radius:50%;border:none;background:rgba(255,255,255,0.12);color:#FFFFFF;display:flex;align-items:center;justify-content:center;cursor:pointer}
      .vf-peligro{background:rgba(220,38,38,0.25)}
      .vf-escena{position:relative;flex:1;min-height:0;touch-action:pan-y}
      .vf-img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block}
      .vf-completa{opacity:0;transition:opacity .35s ease}
      .vf-completa.lista{opacity:1}
      .vf-cargando{position:absolute;right:14px;bottom:14px;width:18px;height:18px;border-radius:50%;border:2px solid rgba(255,255,255,0.25);border-top-color:#FFFFFF;animation:vfGira .8s linear infinite}
      .vf-flecha{position:absolute;top:50%;transform:translateY(-50%);width:42px;height:42px;border-radius:50%;border:none;background:rgba(255,255,255,0.14);color:#FFFFFF;display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(6px)}
      .vf-izq{left:10px}.vf-der{right:10px}
      @media (hover:none){.vf-flecha{display:none}}
      .vf-panel{background:#FFFFFF;border-radius:20px 20px 0 0;padding:16px 16px max(16px,env(safe-area-inset-bottom,16px));max-height:46vh;overflow-y:auto}
      .vf-autor{display:flex;align-items:center;gap:10px}
      .vf-autor-nombre{font-size:14.5px;font-weight:700}
      .vf-autor-cuando{font-size:11.5px;color:#94A3B8;margin-top:1px}
      .vf-caption{font-size:14px;color:#334155;font-style:italic;line-height:1.5;margin-top:10px}
      .vf-reacciones{display:flex;gap:7px;flex-wrap:wrap;margin-top:14px}
      .vf-reac{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;min-height:40px;border-radius:99px;border:1.5px solid #E2E8F0;background:#F8FAFC;
        font-size:12.5px;font-weight:600;color:#475569;cursor:pointer;transition:transform .12s,border-color .15s,background .15s}
      .vf-reac:active{transform:scale(.95)}
      .vf-reac b{background:#E2E8F0;color:#334155;border-radius:99px;padding:0 6px;font-size:11px}
      .vf-reac.activa{color:${tema.tinta}}
      .vf-reac.activa b{background:${tema.acento};color:#FFFFFF}
      .vf-aviso{margin-top:8px;font-size:12px;color:#B45309}
      .vf-comentarios{margin-top:14px;border-top:1px solid #EEF0F4;padding-top:12px;display:flex;flex-direction:column;gap:8px}
      .vf-com{font-size:13.5px;color:#334155;line-height:1.45}
      .vf-escribir{display:flex;gap:8px;margin-top:4px}
      .vf-escribir input{flex:1;min-width:0;border:1.5px solid #E2E8F0;border-radius:12px;padding:10px 12px;font-size:14px;outline:none;font-family:inherit}
      .vf-escribir input:focus{border-color:${tema.destaque}}
      .vf-escribir button{width:42px;border:none;border-radius:12px;color:#FFFFFF;display:flex;align-items:center;justify-content:center;cursor:pointer}
      .vf-escribir button:disabled{opacity:.45;cursor:default}
      .vf-sin-comentar{font-size:12.5px;color:#64748B;background:#F8FAFC;border:1px dashed #E2E8F0;border-radius:10px;padding:9px 12px;margin-top:2px}
    `}</style>
  );
}
