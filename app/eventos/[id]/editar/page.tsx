"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppLogo } from "@/app/components/AppLogo";
import { achicarImagen } from "@/lib/fotos";
import { CamposDireccion, CamposTarjeta, extrasParaGuardar } from "@/app/components/CamposTarjeta";
import { cartaDistancia, extrasDe, MAX_CARTA, VINCULOS_DISTANCIA, type ExtrasTarjeta, type VinculoDistancia } from "@/lib/tarjetaInvitacion";
import { transmisionDe } from "@/lib/transmision";

type Evento = {
  id: string; nombre: string; tipo: string; anfitriones: string;
  frase_evento?: string | null; mensaje_invitacion?: string | null;
  fecha?: string | null; hora?: string | null; lugar?: string | null;
  maps_url?: string | null; como_llegar?: string | null;
  cupo_personas?: number | null; fecha_limite_confirmacion?: string | null;
  musica_nombre?: string | null; musica_url?: string | null;
  imagen_url?: string | null; foto_lugar_url?: string | null;
  foto_lugar_2_url?: string | null; foto_lugar_3_url?: string | null;
  color_primario?: string | null; color_secundario?: string | null;
  plantilla?: string | null;
  fotos_carrusel?: string[] | null;
  fotos_anfitrion?: string[] | null; // supabase-distancia.sql
  tarjeta?: ExtrasTarjeta | null;
};

const TIPO_LABEL: Record<string, string> = {
  quinceañera:"Quinceañera", boda:"Boda", graduacion:"Graduación",
  cumpleaños:"Cumpleaños", otro:"Evento especial",
};
const PLANTILLAS = [
  { id:"clasica",    label:"Clásica" },
  { id:"romantica",  label:"Romántica" },
  { id:"elegante",   label:"Elegante" },
  { id:"divertida",  label:"Divertida" },
  { id:"moderna",    label:"Moderna" },
];

function normalizarFecha(f?: string | null) { return f ? f.split("T")[0] : ""; }
function normalizarHora(h?: string | null) {
  if (!h) return "";
  const p = h.split(":");
  return p.length >= 2 ? `${p[0].padStart(2,"0")}:${p[1].padStart(2,"0")}` : h;
}

const IconoBack = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Mini uploader de imagen ────────────────────────────────────────────────────
function ImagenUploader({
  label, hint, currentUrl, bucket, path: storagePath, onUploaded,
}: {
  label: string; hint?: string; currentUrl?: string | null;
  bucket: string; path: string; onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [err, setErr] = useState("");

  useEffect(() => { setPreview(currentUrl ?? null); }, [currentUrl]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const original = e.target.files?.[0];
    if (!original) return;
    if (original.size > 20 * 1024 * 1024) { setErr("Máx 20 MB"); return; }
    setErr(""); setSubiendo(true);
    const file = await achicarImagen(original);
    const ext = file.name.split(".").pop() ?? "jpg";
    const fullPath = `${storagePath}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(bucket).upload(fullPath, file, { upsert: true, contentType: file.type });
    if (upErr) { setErr("Error al subir"); setSubiendo(false); return; }
    const { data } = supabase.storage.from(bucket).getPublicUrl(fullPath);
    setPreview(data.publicUrl);
    onUploaded(data.publicUrl);
    setSubiendo(false);
  }

  return (
    <div>
      <label className="field-label">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          border: "2px dashed rgba(79,70,229,0.30)", borderRadius: 14,
          background: "rgba(79,70,229,0.04)", cursor: "pointer",
          overflow: "hidden", minHeight: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" style={{ width:"100%", maxHeight:180, objectFit:"cover", display:"block" }} />
        ) : (
          <div style={{ textAlign:"center", padding:"20px 12px", color:"var(--accent2)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ margin:"0 auto 8px", display:"block" }}>
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
            <span style={{ fontSize:12, fontWeight:600 }}>Toca para subir foto</span>
          </div>
        )}
        {subiendo && (
          <div style={{ position:"absolute", inset:0, background:"rgba(255,255,255,0.75)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"var(--accent)" }}>
            Subiendo...
          </div>
        )}
      </div>
      {hint && <p className="field-hint">{hint}</p>}
      {err && <p style={{ color:"var(--danger)", fontSize:11, marginTop:4 }}>{err}</p>}
      <input ref={inputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFile} />
    </div>
  );
}

/** El nombre del archivo como punto de partida del nombre de la canción */
function nombreDeArchivo(archivo: string): string {
  return archivo.replace(/\.[a-z0-9]+$/i, "").replace(/[_]+/g, " ").trim();
}

// ── Mini uploader de audio ─────────────────────────────────────────────────────
function AudioUploader({
  currentUrl, eventoId, onUploaded, onQuitar, prefijo = "musica", etiqueta = "Archivo de música",
}: {
  currentUrl?: string | null; eventoId: string;
  /** La URL pública y el nombre del archivo que eligió */
  onUploaded: (url: string, archivo: string) => void;
  onQuitar?: () => void;
  prefijo?: string;
  etiqueta?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [nombre, setNombre] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (currentUrl) {
      const parts = currentUrl.split("/");
      setNombre(decodeURIComponent(parts[parts.length - 1]));
    } else setNombre("");
  }, [currentUrl]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { setErr("Máx 20 MB"); return; }
    setErr(""); setSubiendo(true);
    const ext = file.name.split(".").pop() ?? "mp3";
    const path = `${eventoId}/${prefijo}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("musica-eventos").upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { setErr("Error al subir audio"); setSubiendo(false); return; }
    const { data } = supabase.storage.from("musica-eventos").getPublicUrl(path);
    setNombre(file.name);
    onUploaded(data.publicUrl, file.name);
    setSubiendo(false);
    e.target.value = "";
  }

  return (
    <div>
      <label className="field-label">{etiqueta}</label>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <div style={{ flex:1, border:"2px solid var(--border-mid)", borderRadius:11, padding:"10px 12px", background:"var(--accent-soft)", fontSize:13, color: nombre ? "var(--text)" : "var(--text3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {nombre || "Ningún archivo seleccionado"}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          style={{ flexShrink:0, padding:"10px 14px", borderRadius:11, border:"none", background:"var(--accent)", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}
        >
          {subiendo ? "..." : currentUrl ? "Cambiar" : "Subir"}
        </button>
        {currentUrl && onQuitar && !subiendo && (
          <button
            type="button"
            onClick={onQuitar}
            aria-label="Quitar la canción"
            style={{ flexShrink:0, padding:"10px 12px", borderRadius:11, border:"1.5px solid var(--border-mid)", background:"transparent", color:"var(--danger)", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}
          >
            Quitar
          </button>
        )}
      </div>
      {currentUrl && !subiendo && (
        <audio controls src={currentUrl} style={{ width:"100%", marginTop:8, height:36 }} />
      )}
      {err && <p style={{ color:"var(--danger)", fontSize:11, marginTop:4 }}>{err}</p>}
      <p className="field-hint">Formatos: MP3, M4A, WAV · Máx 20 MB</p>
      <input ref={inputRef} type="file" accept="audio/*" style={{ display:"none" }} onChange={handleFile} />
    </div>
  );
}

export default function EditarEvento() {
  const params = useParams();
  const eventoId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState("");

  // Campos básicos
  const [tipo, setTipo] = useState("otro");
  const [nombre, setNombre] = useState("");
  const [anfitriones, setAnfitriones] = useState("");
  const [frase, setFrase] = useState("");
  const [mensajeInvitacion, setMensajeInvitacion] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [lugar, setLugar] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [comoLlegar, setComoLlegar] = useState("");
  const [cupo, setCupo] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  // Apariencia
  const [plantilla, setPlantilla] = useState("clasica");
  const [colorPrimario, setColorPrimario] = useState("#0D9488");
  const [colorSecundario, setColorSecundario] = useState("#5EEAD4");
  // Fotos
  const [imagenUrl, setImagenUrl] = useState<string | null>(null);
  const [mediaLugar, setMediaLugar] = useState<string | null>(null);
  // Carrusel de fotos (graduación): historia del graduado
  const [fotosCarrusel, setFotosCarrusel] = useState<string[]>([]);
  // Fotos del anfitrión para los invitados a distancia (ej. la graduación con los padres)
  const [fotosAnfitrion, setFotosAnfitrion] = useState<string[]>([]);
  const [subiendoAnfitrion, setSubiendoAnfitrion] = useState(false);
  // Video corto del anfitrión para el muro (se sube al storage, la URL va en la tarjeta)
  const [subiendoVideo, setSubiendoVideo] = useState(false);
  const [avisoVideo, setAvisoVideo] = useState("");
  const videoInputRef = useRef<HTMLInputElement>(null);
  // Qué carta a distancia se está editando: la general o la de un vínculo
  const [cartaDe, setCartaDe] = useState<"general" | VinculoDistancia>("general");
  const anfitrionInputRef = useRef<HTMLInputElement>(null);
  const [subiendoCarrusel, setSubiendoCarrusel] = useState(false);
  const carruselInputRef = useRef<HTMLInputElement>(null);
  // Datos propios de la tarjeta (frase de honor, graduando, carrera, familia, dirección…)
  const [extras, setExtras] = useState<ExtrasTarjeta>({});
  // Música
  const [musicaNombre, setMusicaNombre] = useState("");
  const [musicaUrl, setMusicaUrl] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Evorix — Editar evento";
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId]);

  async function cargar() {
    setLoading(true);
    const { data, error: errLoad } = await supabase
      .from("eventos")
      .select("*")
      .eq("id", eventoId)
      .single<Evento>();
    if (errLoad || !data) { setError("No se pudo cargar el evento"); setLoading(false); return; }
    setTipo(data.tipo ?? "otro");
    setNombre(data.nombre ?? "");
    setAnfitriones(data.anfitriones ?? "");
    setFrase(data.frase_evento ?? "");
    setMensajeInvitacion(data.mensaje_invitacion ?? "");
    setFecha(normalizarFecha(data.fecha));
    setHora(normalizarHora(data.hora));
    setLugar(data.lugar ?? "");
    setMapsUrl(data.maps_url ?? "");
    setComoLlegar(data.como_llegar ?? "");
    setCupo(data.cupo_personas != null ? String(data.cupo_personas) : "");
    setFechaLimite(normalizarFecha(data.fecha_limite_confirmacion));
    setMusicaNombre(data.musica_nombre ?? "");
    setMusicaUrl(data.musica_url ?? null);
    setImagenUrl(data.imagen_url ?? null);
    setMediaLugar(data.foto_lugar_url ?? null);
    setFotosCarrusel(Array.isArray(data.fotos_carrusel) ? data.fotos_carrusel : []);
    setFotosAnfitrion(Array.isArray(data.fotos_anfitrion) ? data.fotos_anfitrion.filter((u): u is string => typeof u === "string") : []);
    setColorPrimario(data.color_primario ?? "#0D9488");
    setColorSecundario(data.color_secundario ?? "#5EEAD4");
    setPlantilla(data.plantilla ?? "clasica");
    setExtras(extrasDe(data));
    setLoading(false);
  }

  async function guardar() {
    setError("");
    if (!nombre.trim() || !fecha || !hora || !lugar.trim() || !anfitriones.trim()) {
      setError("Por favor completá todos los campos obligatorios (*)");
      return;
    }
    if (fechaLimite && fechaLimite > fecha) {
      setError("La fecha límite para confirmar tiene que ser antes del evento (o el mismo día).");
      return;
    }
    setGuardando(true);
    const payload: Record<string, unknown> = {
      nombre: nombre.trim(), anfitriones: anfitriones.trim(),
      frase_evento: frase.trim() || null,
      mensaje_invitacion: mensajeInvitacion.trim() || null,
      fecha, hora, lugar: lugar.trim(),
      maps_url: mapsUrl.trim() || null,
      como_llegar: comoLlegar.trim() || null,
      cupo_personas: cupo ? parseInt(cupo) : null,
      fecha_limite_confirmacion: fechaLimite || null,
      musica_nombre: musicaNombre.trim() || null,
      musica_url: musicaUrl,
      imagen_url: imagenUrl,
      foto_lugar_url: mediaLugar,
      color_primario: colorPrimario,
      color_secundario: colorSecundario,
      plantilla,
      fotos_carrusel: fotosCarrusel.length ? fotosCarrusel : null,
      fotos_anfitrion: fotosAnfitrion.length ? fotosAnfitrion : null,
      tarjeta: extrasParaGuardar(extras),
    };
    // Columnas opcionales: si alguna todavía no existe en Supabase, se guarda
    // lo demás y se avisa qué migración falta
    const OPCIONALES: Record<string, string> = {
      fotos_carrusel: "el carrusel necesita supabase-graduacion-extras.sql",
      tarjeta: "los datos de la tarjeta necesitan supabase-tarjeta.sql",
      fotos_anfitrion: "las fotos para invitados a distancia necesitan supabase-distancia.sql",
    };
    const faltan: string[] = [];
    let { error: errUpdate } = await supabase.from("eventos").update(payload).eq("id", eventoId);
    for (let i = 0; errUpdate && i < Object.keys(OPCIONALES).length; i++) {
      const col = Object.keys(OPCIONALES).find((c) => c in payload && new RegExp(c, "i").test(errUpdate!.message || ""));
      if (!col) break;
      delete payload[col];
      faltan.push(OPCIONALES[col]);
      ({ error: errUpdate } = await supabase.from("eventos").update(payload).eq("id", eventoId));
    }
    if (!errUpdate && faltan.length) {
      setError(`Guardado, pero ${faltan.join(" y ")}: ejecutalo en el SQL Editor de Supabase.`);
    }
    setGuardando(false);
    if (errUpdate) { setError("Error al guardar: " + errUpdate.message); return; }
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{font-family:'DM Sans',sans-serif;overflow-x:hidden;-webkit-font-smoothing:antialiased;background:#FAFBFF}
        :root{
          --bg:#FAFBFF;--surface:#FFFFFF;--surface2:#F4F5FB;
          --border:rgba(79,70,229,0.16);--border-mid:rgba(79,70,229,0.28);
          --accent:#4F46E5;--accent2:#3730A3;
          --accent-soft:rgba(79,70,229,0.08);--accent-soft2:rgba(79,70,229,0.16);
          --text:#0F172A;--text2:#475569;--text3:#3730A3;
          --danger:#dc2626;--danger-bg:#fef2f2;--danger-border:#fecaca;
          --success:#16a34a;--success-bg:#f0fdf4;--success-border:#86efac;
          --shadow:0 4px 24px rgba(15,23,42,0.10);--shadow-sm:0 2px 10px rgba(15,23,42,0.07);
          --nav-bg:rgba(255,255,255,0.92);--radius:18px;
        }
        .page{min-height:100vh;background:var(--bg);padding-bottom:60px}
        .glow{position:fixed;pointer-events:none;z-index:0;border-radius:50%;filter:blur(90px)}
        .glow-1{width:320px;height:320px;top:-100px;right:-80px;background:radial-gradient(circle,rgba(79,70,229,0.14) 0%,transparent 70%)}
        .glow-2{width:260px;height:260px;bottom:100px;left:-80px;background:radial-gradient(circle,rgba(94,234,212,0.09) 0%,transparent 70%)}
        .nav{position:sticky;top:env(safe-area-inset-top,0px);z-index:30;min-height:56px;padding:10px 16px;
          display:flex;align-items:center;justify-content:space-between;
          background:var(--nav-bg);backdrop-filter:blur(18px);
          border-bottom:1px solid var(--border);box-shadow:var(--shadow-sm)}
        .nav-left{display:flex;align-items:center;gap:10px;min-width:0}
        .nav-back{width:34px;height:34px;border-radius:10px;background:var(--surface);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--text3);cursor:pointer;transition:all .2s;text-decoration:none;flex-shrink:0}
        .nav-back:hover{color:var(--accent);background:var(--accent-soft2)}
        .nav-brand{display:flex;align-items:center;gap:8px}
        .nav-brand-name{font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:600;color:var(--accent);letter-spacing:-0.5px;white-space:nowrap}
        .nav-brand-sub{font-size:9px;color:var(--text3);font-weight:600;letter-spacing:.4px;text-transform:uppercase;margin-top:1px}
        .content{max-width:480px;margin:0 auto;padding:16px 14px 0;position:relative;z-index:1;display:flex;flex-direction:column;gap:11px}
        .section-card{background:var(--surface);border-radius:var(--radius);padding:16px 14px;border:1px solid var(--border);box-shadow:var(--shadow)}
        .check-fila{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border:1.5px solid var(--border-mid);border-radius:12px;cursor:pointer}
        .musica-bloque{display:flex;flex-direction:column;gap:10px;padding:14px;border:1.5px solid var(--border-mid);border-radius:14px}
        .musica-titulo{font-size:13.5px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:7px}
        .musica-titulo + .field-hint{margin-top:-6px}
        .check-fila input{width:18px;height:18px;margin-top:2px;accent-color:var(--accent);flex-shrink:0}
        .check-fila strong{display:block;font-size:13px;color:var(--text)}
        .check-fila small{display:block;font-size:11.5px;color:var(--text3);line-height:1.45;margin-top:2px}
        .btn-carta{margin-top:8px;padding:8px 14px;border-radius:10px;border:1.5px solid var(--border-mid);background:var(--accent-soft);color:var(--accent2);font:600 12.5px inherit;cursor:pointer}
        .section-title{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:var(--accent2);margin-bottom:13px;display:flex;align-items:center;gap:6px}
        .fields-group{display:flex;flex-direction:column;gap:13px}
        .field-label{font-size:10px;font-weight:700;color:var(--accent2);display:block;margin-bottom:5px;letter-spacing:.2px;text-transform:uppercase}
        .field-input{width:100%;border:2px solid var(--border-mid);border-radius:11px;padding:10px 12px;font-size:14px;background:var(--accent-soft);color:var(--text);outline:none;transition:border-color .2s,box-shadow .2s,background .2s;font-family:'DM Sans',sans-serif;-webkit-appearance:none}
        .field-input::placeholder{color:var(--text3)}
        .field-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(79,70,229,0.10);background:var(--surface)}
        .field-hint{font-size:10px;color:var(--text3);margin-top:4px;padding:0 2px;line-height:1.4}
        .carta-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:2px 0 8px}
        .carta-tab{position:relative;padding:6px 11px;border-radius:999px;border:1.5px solid var(--border-mid,#e2e8f0);background:transparent;font-size:11.5px;font-weight:700;color:var(--text2);cursor:pointer;font-family:inherit}
        .carta-tab.activa{background:var(--accent);border-color:var(--accent);color:#fff}
        .carta-tab-punto{position:absolute;top:2px;right:2px;width:7px;height:7px;border-radius:50%;background:#16a34a;border:1.5px solid #fff}
        .field-textarea{resize:none}
        .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:9px}
        .error-box{background:var(--danger-bg);border:1px solid var(--danger-border);color:var(--danger);font-size:13px;padding:10px 13px;border-radius:11px;display:flex;align-items:center;gap:8px}
        .success-box{background:var(--success-bg);border:1px solid var(--success-border);color:var(--success);font-size:13px;padding:10px 13px;border-radius:11px;display:flex;align-items:center;gap:8px;font-weight:600}
        .btn-submit{width:100%;padding:14px;border-radius:var(--radius);border:none;background:linear-gradient(135deg,var(--accent) 0%,var(--accent2) 100%);color:#fff;font-size:15px;font-weight:800;font-family:'DM Sans',sans-serif;cursor:pointer;box-shadow:0 6px 22px rgba(79,70,229,0.36);transition:transform .2s,box-shadow .2s,opacity .2s;display:flex;align-items:center;justify-content:center;gap:8px;min-height:50px}
        .btn-submit:not(:disabled):hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(79,70,229,0.46)}
        .btn-submit:not(:disabled):active{transform:scale(0.98)}
        .btn-submit:disabled{opacity:.55;cursor:not-allowed}
        .btn-secondary{width:100%;padding:13px;border-radius:var(--radius);border:1.5px solid var(--border-mid);background:var(--surface);color:var(--accent2);font-size:14px;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .2s;text-align:center;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:8px}
        .btn-secondary:hover{background:var(--accent-soft);border-color:var(--accent)}
        .tipo-tag{display:inline-flex;align-items:center;gap:6px;background:var(--accent-soft);border:1px solid var(--border);color:var(--accent2);font-size:10.5px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;padding:5px 10px;border-radius:99px}
        .plantilla-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:4px}
        .plantilla-btn{padding:9px 4px;border-radius:10px;border:2px solid var(--border);background:var(--accent-soft);font-size:11px;font-weight:700;color:var(--text2);cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .18s;text-align:center}
        .plantilla-btn.active{border-color:var(--accent);background:var(--accent);color:#fff}
        .color-row{display:flex;align-items:center;gap:10px}
        .color-swatch{width:38px;height:38px;border-radius:10px;border:2px solid var(--border-mid);cursor:pointer;flex-shrink:0;-webkit-appearance:none;padding:0;background:none}
        .loading-screen{min-height:100vh;display:flex;align-items:center;justify-content:center;color:var(--text3);font-size:14px}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spin{animation:spin .75s linear infinite}
        @media(max-width:360px){.grid-2,.plantilla-grid{grid-template-columns:1fr}}
      `}</style>

      <div className="page">
        <div className="glow glow-1" />
        <div className="glow glow-2" />

        <nav className="nav">
          <div className="nav-left">
            <Link href={`/eventos/${eventoId}/invitados`} className="nav-back" aria-label="Volver">
              <IconoBack />
            </Link>
            <div className="nav-brand">
              <AppLogo size={28} />
              <div>
                <div className="nav-brand-name">Evorix</div>
                <div className="nav-brand-sub">Editar evento</div>
              </div>
            </div>
          </div>
        </nav>

        {loading ? (
          <div className="loading-screen">Cargando...</div>
        ) : (
          <div className="content">
            <div style={{ display:"flex", justifyContent:"center", marginTop:4 }}>
              <span className="tipo-tag">{TIPO_LABEL[tipo] ?? "Evento especial"}</span>
            </div>

            {error && (
              <div className="error-box">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/><path d="M8 5v3M8 10v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                {error}
              </div>
            )}
            {guardado && (
              <div className="success-box">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Cambios guardados correctamente
              </div>
            )}

            {/* ── 1. Información básica ── */}
            <div className="section-card">
              <p className="section-title">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="10" cy="10" r="8"/><path d="M10 9v5M10 7v.5"/></svg>
                Información del evento
              </p>
              <div className="fields-group">
                <div>
                  <label className="field-label">Nombre del evento *</label>
                  <input className="field-input" type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: XV de Sofía" />
                </div>
                <div>
                  <label className="field-label">Anfitriones / Organizadores *</label>
                  <input className="field-input" type="text" value={anfitriones} onChange={e => setAnfitriones(e.target.value)} placeholder="Ej: Familia García" />
                </div>
                <div>
                  <label className="field-label">Frase especial del evento</label>
                  <input className="field-input" type="text" value={frase} onChange={e => setFrase(e.target.value)} placeholder="Ej: Un momento para siempre" />
                </div>
                <div>
                  <label className="field-label">Mensaje para los invitados</label>
                  <textarea className="field-input field-textarea" rows={3} value={mensajeInvitacion} onChange={e => setMensajeInvitacion(e.target.value)} placeholder="Texto que verán al abrir su invitación..." />
                </div>
              </div>
            </div>

            {/* ── 1b. Tarjeta de invitación ── */}
            <div className="section-card">
              <p className="section-title">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="2" width="14" height="16" rx="2"/><path d="M7 7h6M7 10.5h6M8.5 14h3"/></svg>
                Tarjeta de invitación
              </p>
              <CamposTarjeta
                tipo={tipo}
                valor={extras}
                onChange={setExtras}
                evento={{ nombre, anfitriones, fecha, hora, lugar, imagen_url: imagenUrl }}
              />
            </div>

            {/* ── 2. Fecha y lugar ── */}
            <div className="section-card">
              <p className="section-title">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="2" y="3" width="16" height="15" rx="2"/><path d="M2 8h16M7 1v4M13 1v4"/></svg>
                Fecha y lugar
              </p>
              <div className="fields-group">
                <div className="grid-2">
                  <div>
                    <label className="field-label">Fecha *</label>
                    <input className="field-input" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label">Hora *</label>
                    <input className="field-input" type="time" value={hora} onChange={e => setHora(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="field-label">Nombre del lugar *</label>
                  <input className="field-input" type="text" value={lugar} onChange={e => setLugar(e.target.value)} placeholder="Ej: Salón Primavera" />
                </div>
                <CamposDireccion valor={extras} onChange={setExtras} />
                <div>
                  <label className="field-label">Link de Google Maps</label>
                  <input className="field-input" type="url" value={mapsUrl} onChange={e => setMapsUrl(e.target.value)} placeholder="https://maps.google.com/..." />
                  <p className="field-hint">Google Maps → busca el lugar → Compartir → Copiar enlace</p>
                </div>
                <div>
                  <label className="field-label">Cómo llegar</label>
                  <textarea className="field-input field-textarea" rows={2} value={comoLlegar} onChange={e => setComoLlegar(e.target.value)} placeholder="Instrucciones adicionales de acceso..." />
                </div>
              </div>
            </div>

            {/* ── 3. Cupo y confirmación ── */}
            <div className="section-card">
              <p className="section-title">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M13 15c0-2.2-1.3-4-3-4s-3 1.8-3 4M7 7a3 3 0 106 0 3 3 0 00-6 0M16 15c0-1.8-1-3.3-2.5-4M17 6.5a2.5 2.5 0 010 5"/></svg>
                Cupo y confirmación
              </p>
              <div className="fields-group">
                <div>
                  <label className="field-label">Cupo máximo de personas</label>
                  <input className="field-input" type="number" min="1" value={cupo} onChange={e => setCupo(e.target.value)} placeholder="Sin límite" />
                  <p className="field-hint">Dejá vacío si no hay límite. Al llenarse, los invitados no podrán confirmar.</p>
                </div>
                <div>
                  <label className="field-label">Fecha límite para confirmar</label>
                  <input className="field-input" type="date" value={fechaLimite} max={fecha || undefined} onChange={e => setFechaLimite(e.target.value)} />
                  {fechaLimite && fecha && fechaLimite > fecha && (
                    <p className="field-hint" style={{ color: "var(--danger)", fontWeight: 700 }}>Está después del evento: elegí una fecha anterior.</p>
                  )}
                  <p className="field-hint">Después de esta fecha los invitados no podrán confirmar.</p>
                </div>
                <label className="check-fila" htmlFor="entrada-qr">
                  <input
                    id="entrada-qr"
                    type="checkbox"
                    checked={extras.entrada_qr !== false}
                    onChange={(e) => setExtras({ ...extras, entrada_qr: e.target.checked ? undefined : false })}
                  />
                  <span>
                    <strong>Entrada con código QR</strong>
                    <small>Al confirmar, cada invitado recibe una entrada con QR para escanear en la puerta. Sacalo si no vas a escanear entradas: igual ve su confirmación.</small>
                  </span>
                </label>
              </div>
            </div>

            {/* ── 4. Foto de portada ── */}
            <div className="section-card">
              <p className="section-title">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                Foto de portada
              </p>
              <ImagenUploader
                label="Imagen principal de la invitación"
                hint="Se muestra en la pantalla de inicio de la invitación. Recomendado: 800×600 px"
                currentUrl={imagenUrl}
                bucket="eventos"
                path={`${eventoId}/portada`}
                onUploaded={setImagenUrl}
              />
            </div>

            {/* ── 4b. Carrusel "Su historia" (solo graduación) ── */}
            {tipo === "graduacion" && (
              <div className="section-card">
                <p className="section-title">
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="12" height="10" rx="2"/><path d="M16 6h1a1 1 0 011 1v8a1 1 0 01-1 1H7a1 1 0 01-1-1v-1"/></svg>
                  Carrusel &quot;Su historia&quot; 🎓
                </p>
                <p className="field-hint" style={{ marginBottom: 10 }}>
                  Subí varias fotos del graduado (de bebé hasta hoy). Se muestran deslizándose en la invitación. Máximo 8 fotos.
                </p>
                {fotosCarrusel.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 10 }}>
                    {fotosCarrusel.map((url, i) => (
                      <div key={url + i} style={{ position: "relative", aspectRatio: "1", borderRadius: 10, overflow: "hidden", border: "1.5px solid var(--border-mid)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Foto ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        <span style={{ position: "absolute", top: 3, left: 4, fontSize: 9, fontWeight: 800, color: "white", background: "rgba(15,23,42,0.6)", borderRadius: 6, padding: "1px 5px" }}>{i + 1}</span>
                        <button
                          onClick={() => setFotosCarrusel(f => f.filter((_, j) => j !== i))}
                          aria-label="Quitar foto"
                          style={{ position: "absolute", top: 2, right: 2, width: 20, height: 20, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(220,38,38,0.9)", color: "white", fontSize: 11, fontWeight: 800, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
                        >×</button>
                        {i > 0 && (
                          <button
                            onClick={() => setFotosCarrusel(f => { const c = [...f]; [c[i - 1], c[i]] = [c[i], c[i - 1]]; return c; })}
                            aria-label="Mover antes"
                            style={{ position: "absolute", bottom: 2, left: 2, width: 20, height: 20, borderRadius: 6, border: "none", cursor: "pointer", background: "rgba(255,255,255,0.85)", color: "var(--accent2)", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}
                          >‹</button>
                        )}
                        {i < fotosCarrusel.length - 1 && (
                          <button
                            onClick={() => setFotosCarrusel(f => { const c = [...f]; [c[i], c[i + 1]] = [c[i + 1], c[i]]; return c; })}
                            aria-label="Mover después"
                            style={{ position: "absolute", bottom: 2, right: 2, width: 20, height: 20, borderRadius: 6, border: "none", cursor: "pointer", background: "rgba(255,255,255,0.85)", color: "var(--accent2)", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}
                          >›</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {fotosCarrusel.length < 8 && (
                  <button
                    onClick={() => carruselInputRef.current?.click()}
                    disabled={subiendoCarrusel}
                    style={{ width: "100%", border: "2px dashed rgba(79,70,229,0.30)", borderRadius: 12, background: "rgba(79,70,229,0.04)", padding: "14px", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "var(--accent)", fontFamily: "'DM Sans',sans-serif" }}
                  >
                    {subiendoCarrusel ? "Subiendo fotos..." : `+ Agregar fotos (${fotosCarrusel.length}/8)`}
                  </button>
                )}
                <input
                  ref={carruselInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []).slice(0, 8 - fotosCarrusel.length);
                    if (!files.length) return;
                    setSubiendoCarrusel(true);
                    const nuevas: string[] = [];
                    for (const original of files) {
                      if (original.size > 20 * 1024 * 1024) continue;
                      const file = await achicarImagen(original);
                      const ext = file.name.split(".").pop() ?? "jpg";
                      const path = `${eventoId}/carrusel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
                      const { error: upErr } = await supabase.storage.from("eventos").upload(path, file, { upsert: true, contentType: file.type });
                      if (!upErr) {
                        const { data } = supabase.storage.from("eventos").getPublicUrl(path);
                        nuevas.push(data.publicUrl);
                      }
                    }
                    setFotosCarrusel(f => [...f, ...nuevas].slice(0, 8));
                    setSubiendoCarrusel(false);
                    e.target.value = "";
                  }}
                />
                <p className="field-hint" style={{ marginTop: 8 }}>Recordá tocar <strong>Guardar</strong> al final para aplicar los cambios.</p>
              </div>
            )}

            {/* ── 4c. Invitados a distancia: agradecimiento y fotos del anfitrión ── */}
            <div className="section-card">
              <p className="section-title">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h14v10H3z"/><path d="M3 5l7 6 7-6"/></svg>
                Invitados a distancia 💌
              </p>
              <p className="field-hint" style={{ marginBottom: 10 }}>
                Para familiares y amigos que están lejos pero fueron parte del logro. Los marcás en <strong>Invitados</strong>: reciben una
                invitación de agradecimiento (no confirman), ven tus fotos de graduación y las del muro, y te dejan su mensaje.
              </p>
              <div className="fields-group">
                <div>
                  <label className="field-label">Carta de agradecimiento</label>
                  {(() => {
                    // La carta de cada grupo: el campo que se edita y la automática de ese grupo
                    const vinculo = cartaDe === "general" ? null : cartaDe;
                    const campo = vinculo ? (`carta_${vinculo}` as const) : "agradecimiento";
                    const sinPropias = { ...extras, agradecimiento: null, carta_familia: null, carta_amigos: null, carta_hermanos: null };
                    const sugerida = cartaDistancia({ nombre, tipo, anfitriones, tarjeta: sinPropias }, "neutro", vinculo);
                    const valor = extras[campo] ?? "";
                    return (
                      <>
                        <div className="carta-tabs" role="tablist" aria-label="Para quién es la carta">
                          {([{ id: "general" as const, nombre: "General" }, ...VINCULOS_DISTANCIA]).map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              role="tab"
                              aria-selected={cartaDe === v.id}
                              className={`carta-tab${cartaDe === v.id ? " activa" : ""}`}
                              onClick={() => setCartaDe(v.id)}
                            >
                              {v.nombre}
                              {(v.id === "general" ? extras.agradecimiento : extras[`carta_${v.id}`]) && <span className="carta-tab-punto" aria-label="(escrita por vos)" />}
                            </button>
                          ))}
                        </div>
                        <textarea
                          className="field-input field-textarea"
                          rows={valor ? 10 : 4}
                          maxLength={MAX_CARTA}
                          value={valor}
                          onChange={(e) => setExtras({ ...extras, [campo]: e.target.value })}
                          placeholder={sugerida.parrafos[0]}
                        />
                        {!valor && (
                          <button
                            type="button"
                            className="btn-carta"
                            onClick={() => setExtras({ ...extras, [campo]: sugerida.parrafos.slice(0, -1).join("\n") })}
                          >
                            Editar la carta sugerida
                          </button>
                        )}
                        <p className="field-hint">
                          {vinculo
                            ? <>La reciben los invitados a distancia marcados como <strong>{VINCULOS_DISTANCIA.find((x) => x.id === vinculo)?.nombre.toLowerCase()}</strong> (lo elegís en Invitados). Si la dejás vacía va la automática de este grupo; si tampoco hay, la general que escribiste.</>
                            : <>La reciben los invitados a distancia sin grupo, y los de un grupo cuya carta dejaste vacía. Si la dejás vacía, cada uno recibe la carta automática con su nombre.</>}
                          {" "}Cada línea es un párrafo; el saludo con su nombre, la bendición de Números 6:24-26 y tu firma van siempre.
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* ── 4e. Tus fotos de graduación: para los de lejos y, si se activa, para el muro ── */}
            <div className="section-card">
              <p className="section-title">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" /></svg>
                {tipo === "graduacion" ? "Tus fotos de graduación" : "Tus fotos del evento"}
              </p>
              <p className="field-hint" style={{ marginBottom: 10 }}>
                Tus fotos (con la toga, con tu familia…) y un video corto. Las ven siempre los invitados a distancia; si activás la opción, también todos en el <strong>muro</strong>.
              </p>
              <div className="fields-group">
                <label className="check-fila" htmlFor="muro-galeria">
                  <input
                    id="muro-galeria"
                    type="checkbox"
                    checked={extras.muro_galeria === true}
                    onChange={(e) => setExtras({ ...extras, muro_galeria: e.target.checked ? true : undefined })}
                  />
                  <span>
                    <strong>Mostrar en el muro</strong>
                    <small>Arriba de las fotos de los invitados aparece tu espacio: tus fotos y tu video.</small>
                  </span>
                </label>
                <div>
                  <label className="field-label">Fotos ({fotosAnfitrion.length}/20)</label>
                  {fotosAnfitrion.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 10 }}>
                      {fotosAnfitrion.map((url, i) => (
                        <div key={url + i} style={{ position: "relative", aspectRatio: "1", borderRadius: 10, overflow: "hidden", border: "1.5px solid var(--border-mid)" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Foto ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          <button
                            onClick={() => setFotosAnfitrion((f) => f.filter((_, j) => j !== i))}
                            aria-label="Quitar foto"
                            style={{ position: "absolute", top: 2, right: 2, width: 22, height: 22, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(220,38,38,0.9)", color: "white", fontSize: 12, fontWeight: 800, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {fotosAnfitrion.length < 20 && (
                    <button
                      onClick={() => anfitrionInputRef.current?.click()}
                      disabled={subiendoAnfitrion}
                      style={{ width: "100%", border: "2px dashed rgba(79,70,229,0.30)", borderRadius: 12, background: "rgba(79,70,229,0.04)", padding: "14px", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "var(--accent)", fontFamily: "'DM Sans',sans-serif" }}
                    >
                      {subiendoAnfitrion ? "Subiendo fotos..." : "+ Agregar fotos (ej. tu graduación con tus papás)"}
                    </button>
                  )}
                  <input
                    ref={anfitrionInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []).slice(0, 20 - fotosAnfitrion.length);
                      if (!files.length) return;
                      setSubiendoAnfitrion(true);
                      const nuevas: string[] = [];
                      for (const original of files) {
                        if (original.size > 20 * 1024 * 1024) continue;
                        const file = await achicarImagen(original);
                        const ext = file.name.split(".").pop() ?? "jpg";
                        const path = `${eventoId}/anfitrion-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
                        const { error: upErr } = await supabase.storage.from("eventos").upload(path, file, { upsert: true, contentType: file.type });
                        if (!upErr) nuevas.push(supabase.storage.from("eventos").getPublicUrl(path).data.publicUrl);
                      }
                      setFotosAnfitrion((f) => [...f, ...nuevas].slice(0, 20));
                      setSubiendoAnfitrion(false);
                      e.target.value = "";
                    }}
                  />
                </div>
                <div>
                  <label className="field-label">Video corto (opcional)</label>
                  {extras.muro_video ? (
                    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1.5px solid var(--border-mid)", background: "#0F172A" }}>
                      <video src={extras.muro_video} controls playsInline preload="metadata" style={{ display: "block", width: "100%", maxHeight: 260 }} />
                      <button
                        type="button"
                        onClick={() => setExtras({ ...extras, muro_video: null })}
                        style={{ position: "absolute", top: 8, right: 8, border: "none", borderRadius: 999, padding: "6px 12px", cursor: "pointer", background: "rgba(220,38,38,0.92)", color: "white", fontSize: 12, fontWeight: 800 }}
                      >
                        Quitar video
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={subiendoVideo}
                      style={{ width: "100%", border: "2px dashed rgba(79,70,229,0.30)", borderRadius: 12, background: "rgba(79,70,229,0.04)", padding: "14px", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "var(--accent)", fontFamily: "'DM Sans',sans-serif" }}
                    >
                      {subiendoVideo ? "Subiendo el video…" : "+ Subir un video corto (hasta 50 MB)"}
                    </button>
                  )}
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      // El plan gratuito de Supabase no acepta archivos de más de 50 MB
                      if (file.size > 50 * 1024 * 1024) {
                        setAvisoVideo(`El video pesa ${Math.round(file.size / 1024 / 1024)} MB: subí uno de hasta 50 MB (un minuto más o menos).`);
                        return;
                      }
                      setAvisoVideo("");
                      setSubiendoVideo(true);
                      const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
                      const path = `${eventoId}/video-${Date.now()}.${ext}`;
                      const { error: upErr } = await supabase.storage.from("eventos").upload(path, file, { contentType: file.type || "video/mp4" });
                      setSubiendoVideo(false);
                      if (upErr) { setAvisoVideo("No se pudo subir el video. Probá de nuevo o con uno más liviano."); return; }
                      setExtras((ex) => ({ ...ex, muro_video: supabase.storage.from("eventos").getPublicUrl(path).data.publicUrl }));
                    }}
                  />
                  {avisoVideo && <p className="field-hint" style={{ color: "var(--danger)", fontWeight: 700 }}>{avisoVideo}</p>}
                  <p className="field-hint">Un minuto alcanza: un saludo o un resumen del día. Recordá tocar <strong>Guardar</strong> al final.</p>
                </div>
              </div>
            </div>

            {/* ── 4f. Música: la de la invitación y la del muro, cada una por separado ── */}
            <div className="section-card">
              <p className="section-title">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                Música
              </p>
              <p className="field-hint" style={{ marginBottom: 12 }}>
                Dos canciones distintas: una para la <strong>invitación</strong> y otra para el <strong>muro</strong>.
                La voz de la guía y los mensajes grabados siempre se escuchan por encima de la música.
              </p>
              <div className="fields-group">
                {/* La de la invitación (la tarjeta que abre cada invitado) */}
                <div className="musica-bloque">
                  <p className="musica-titulo">Canción de la invitación</p>
                  <p className="field-hint">Suena cuando cada invitado abre su invitación.</p>
                  <AudioUploader
                    eventoId={eventoId}
                    currentUrl={musicaUrl}
                    prefijo="musica"
                    etiqueta="Archivo de la canción"
                    onUploaded={(url, archivo) => {
                      setMusicaUrl(url);
                      setMusicaNombre((n) => (n.trim() ? n : nombreDeArchivo(archivo)));
                    }}
                    onQuitar={() => { setMusicaUrl(null); setMusicaNombre(""); }}
                  />
                  {musicaUrl && (
                    <div>
                      <label className="field-label">Nombre de la canción</label>
                      <input
                        className="field-input"
                        maxLength={120}
                        value={musicaNombre}
                        onChange={(e) => setMusicaNombre(e.target.value)}
                        placeholder="Ej.: Perfect — Ed Sheeran"
                      />
                    </div>
                  )}
                </div>

                {/* La del muro: otra, no la de la invitación (sin canción, el muro queda en silencio) */}
                <div className="musica-bloque">
                  <p className="musica-titulo">Canción del muro</p>
                  <p className="field-hint">
                    Suena de fondo mientras ven las fotos y dejan sus deseos, y se baja sola cuando alguien escucha un mensaje de voz o un video.
                    Si no subís ninguna, el muro queda en silencio.
                  </p>
                  <AudioUploader
                    eventoId={eventoId}
                    currentUrl={extras.muro_musica ?? null}
                    prefijo="muro-musica"
                    etiqueta="Archivo de la canción"
                    onUploaded={(url, archivo) => setExtras((ex) => ({
                      ...ex,
                      muro_musica: url,
                      muro_musica_nombre: ex.muro_musica_nombre?.trim() ? ex.muro_musica_nombre : nombreDeArchivo(archivo),
                    }))}
                    onQuitar={() => setExtras((ex) => ({ ...ex, muro_musica: null, muro_musica_nombre: null }))}
                  />
                  {extras.muro_musica && (
                    <div>
                      <label className="field-label">Nombre de la canción</label>
                      <input
                        className="field-input"
                        maxLength={120}
                        value={extras.muro_musica_nombre ?? ""}
                        onChange={(e) => setExtras({ ...extras, muro_musica_nombre: e.target.value })}
                        placeholder="Ej.: Gracias — Marcos Witt"
                      />
                    </div>
                  )}
                </div>
                <p className="field-hint">Recordá tocar <strong>Guardar</strong> al final para aplicar los cambios.</p>
              </div>
            </div>

            {/* ── 4d. Transmisión en vivo del culto ── */}
            <div className="section-card">
              <p className="section-title">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14" /></svg>
                Transmisión en vivo
              </p>
              <p className="field-hint" style={{ marginBottom: 10 }}>
                Si el culto o la ceremonia se transmite, pegá el enlace: aparece arriba de las fotos del <strong>muro</strong> y en la invitación de quienes están a distancia.
              </p>
              <div className="fields-group">
                <div>
                  <label className="field-label">Enlace de la transmisión</label>
                  <input
                    className="field-input"
                    type="url"
                    inputMode="url"
                    maxLength={300}
                    value={extras.transmision ?? ""}
                    onChange={(e) => setExtras({ ...extras, transmision: e.target.value })}
                    placeholder="https://www.youtube.com/live/…"
                  />
                  {(() => {
                    const enlace = extras.transmision?.trim();
                    if (!enlace) return <p className="field-hint">YouTube o un video de Facebook se ven dentro del muro. Zoom u otros, con un botón que los abre.</p>;
                    const t = transmisionDe(enlace);
                    if (!t) return <p className="field-hint" style={{ color: "var(--danger)", fontWeight: 700 }}>Pegá el enlace completo, que empiece con https://</p>;
                    return (
                      <p className="field-hint" style={{ color: "var(--success, #16a34a)", fontWeight: 700 }}>
                        {t.embed
                          ? `✓ Se va a ver dentro del muro (${t.nombre}).`
                          : t.plataforma === "youtube"
                          ? "✓ Se abre con un botón. Para verlo dentro del muro, pegá el enlace del video en vivo (youtube.com/live/…), no el del canal."
                          : t.plataforma === "facebook"
                          ? "✓ Se abre con un botón. Para verlo dentro del muro, pegá el enlace del video (…/videos/…), no el de la página."
                          : "✓ Se abre con un botón."}
                      </p>
                    );
                  })()}
                </div>
                <div>
                  <label className="field-label">Título (opcional)</label>
                  <input
                    className="field-input"
                    maxLength={80}
                    value={extras.transmision_titulo ?? ""}
                    onChange={(e) => setExtras({ ...extras, transmision_titulo: e.target.value })}
                    placeholder="Culto de acción de gracias"
                  />
                  <p className="field-hint">Recordá tocar <strong>Guardar</strong> al final.</p>
                </div>
              </div>
            </div>

            {/* ── 5. Foto / Video del lugar ── */}
            <div className="section-card">
              <p className="section-title">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="2" y="4" width="16" height="13" rx="2"/><path d="M8 8l5 3-5 3V8z"/></svg>
                Foto de referencia del lugar
              </p>
              <div className="fields-group">
                <p className="field-hint" style={{ marginBottom:4 }}>Una foto de la <strong>fachada o la entrada</strong> (o un video de hasta 1 minuto) para que los invitados reconozcan el lugar al llegar. Se muestra junto a la dirección.</p>

                {/* Previsualización */}
                {mediaLugar && (
                  /\.(mp4|mov|webm|avi)$/i.test(mediaLugar) ? (
                    <video src={mediaLugar} controls style={{ width:"100%", borderRadius:12, maxHeight:200 }} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaLugar} alt="Foto del lugar" style={{ width:"100%", borderRadius:12, maxHeight:200, objectFit:"cover" }} />
                  )
                )}

                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <div style={{ flex:1, border:"2px solid var(--border-mid)", borderRadius:11, padding:"10px 12px", background:"var(--accent-soft)", fontSize:13, color: mediaLugar ? "var(--text)" : "var(--text3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {mediaLugar ? "Archivo cargado ✓" : "Ningún archivo seleccionado"}
                  </div>
                  <label style={{ flexShrink:0, padding:"10px 14px", borderRadius:11, background:"var(--accent)", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                    Subir
                    <input type="file" accept="image/*,video/*" style={{ display:"none" }} onChange={async (e) => {
                      let file = e.target.files?.[0];
                      if (!file) return;
                      const isVideo = file.type.startsWith("video/");
                      if (isVideo && file.size > 104857600) { alert("El video no puede superar 100 MB (≈1 min)"); return; }
                      if (!isVideo && file.size > 20971520) { alert("La imagen no puede superar 20 MB"); return; }
                      if (!isVideo) file = await achicarImagen(file);
                      const ext = file.name.split(".").pop() ?? (isVideo ? "mp4" : "jpg");
                      const path = `${eventoId}/lugar-media-${Date.now()}.${ext}`;
                      const bucket = isVideo ? "videos-lugar" : "eventos";
                      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type });
                      if (upErr) { alert("Error al subir: " + upErr.message); return; }
                      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
                      setMediaLugar(data.publicUrl);
                    }} />
                  </label>
                  {mediaLugar && (
                    <button type="button" onClick={() => setMediaLugar(null)} style={{ padding:"10px 12px", borderRadius:11, border:"1.5px solid var(--danger-border)", background:"var(--danger-bg)", color:"var(--danger)", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                      Quitar
                    </button>
                  )}
                </div>
                <p className="field-hint">Imagen: JPG, PNG · Máx 10 MB. Video: MP4, MOV · Máx 100 MB (≈1 minuto)</p>
              </div>
            </div>

            {/* ── Botones ── */}
            <button className="btn-submit" onClick={guardar} disabled={guardando} type="button">
              {guardando ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="spin"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="44 22"/></svg>
                  Guardando...
                </>
              ) : "Guardar cambios"}
            </button>

            <Link href={`/eventos/${eventoId}/invitados`} className="btn-secondary">
              Volver a gestionar evento
            </Link>

            <div style={{ height:16 }} />
          </div>
        )}
      </div>
    </>
  );
}
