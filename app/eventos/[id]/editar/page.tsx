"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppLogo } from "@/app/components/AppLogo";

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
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setErr("Máx 10 MB"); return; }
    setErr(""); setSubiendo(true);
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
            <svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ margin:"0 auto 8px", display:"block" }}>
              <path d="M2 7a2 2 0 012-2h1.2l1.6-2h6.4l1.6 2H16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V7z"/>
              <circle cx="10" cy="11" r="2.5"/>
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

// ── Mini uploader de audio ─────────────────────────────────────────────────────
function AudioUploader({
  currentUrl, eventoId, onUploaded,
}: { currentUrl?: string | null; eventoId: string; onUploaded: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [nombre, setNombre] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (currentUrl) {
      const parts = currentUrl.split("/");
      setNombre(decodeURIComponent(parts[parts.length - 1]));
    }
  }, [currentUrl]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { setErr("Máx 20 MB"); return; }
    setErr(""); setSubiendo(true);
    const ext = file.name.split(".").pop() ?? "mp3";
    const path = `${eventoId}/musica-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("musica-eventos").upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { setErr("Error al subir audio"); setSubiendo(false); return; }
    const { data } = supabase.storage.from("musica-eventos").getPublicUrl(path);
    setNombre(file.name);
    onUploaded(data.publicUrl);
    setSubiendo(false);
  }

  return (
    <div>
      <label className="field-label">Archivo de música</label>
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
          {subiendo ? "..." : "Subir"}
        </button>
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
      .select("id,nombre,tipo,anfitriones,frase_evento,mensaje_invitacion,fecha,hora,lugar,maps_url,como_llegar,cupo_personas,fecha_limite_confirmacion,musica_nombre,musica_url,imagen_url,foto_lugar_url,color_primario,color_secundario,plantilla")
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
    setColorPrimario(data.color_primario ?? "#0D9488");
    setColorSecundario(data.color_secundario ?? "#5EEAD4");
    setPlantilla(data.plantilla ?? "clasica");
    setLoading(false);
  }

  async function guardar() {
    setError("");
    if (!nombre.trim() || !fecha || !hora || !lugar.trim() || !anfitriones.trim()) {
      setError("Por favor completá todos los campos obligatorios (*)");
      return;
    }
    setGuardando(true);
    const { error: errUpdate } = await supabase.from("eventos").update({
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
    }).eq("id", eventoId);
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
        .section-title{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:var(--accent2);margin-bottom:13px;display:flex;align-items:center;gap:6px}
        .fields-group{display:flex;flex-direction:column;gap:13px}
        .field-label{font-size:10px;font-weight:700;color:var(--accent2);display:block;margin-bottom:5px;letter-spacing:.2px;text-transform:uppercase}
        .field-input{width:100%;border:2px solid var(--border-mid);border-radius:11px;padding:10px 12px;font-size:14px;background:var(--accent-soft);color:var(--text);outline:none;transition:border-color .2s,box-shadow .2s,background .2s;font-family:'DM Sans',sans-serif;-webkit-appearance:none}
        .field-input::placeholder{color:var(--text3)}
        .field-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(79,70,229,0.10);background:var(--surface)}
        .field-hint{font-size:10px;color:var(--text3);margin-top:4px;padding:0 2px;line-height:1.4}
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
                  <input className="field-input" type="date" value={fechaLimite} onChange={e => setFechaLimite(e.target.value)} />
                  <p className="field-hint">Después de esta fecha los invitados no podrán confirmar.</p>
                </div>
              </div>
            </div>

            {/* ── 4. Foto de portada ── */}
            <div className="section-card">
              <p className="section-title">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7a2 2 0 012-2h1.2l1.6-2h6.4l1.6 2H16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V7z"/><circle cx="10" cy="11" r="2.5"/></svg>
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

            {/* ── 5. Foto / Video del lugar ── */}
            <div className="section-card">
              <p className="section-title">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="2" y="4" width="16" height="13" rx="2"/><path d="M8 8l5 3-5 3V8z"/></svg>
                Foto o video del lugar
              </p>
              <div className="fields-group">
                <p className="field-hint" style={{ marginBottom:4 }}>Podés subir una foto del lugar <strong>o</strong> un video de hasta 1 minuto para que los invitados sepan cómo llegar.</p>

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
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const isVideo = file.type.startsWith("video/");
                      if (isVideo && file.size > 104857600) { alert("El video no puede superar 100 MB (≈1 min)"); return; }
                      if (!isVideo && file.size > 10485760) { alert("La imagen no puede superar 10 MB"); return; }
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
