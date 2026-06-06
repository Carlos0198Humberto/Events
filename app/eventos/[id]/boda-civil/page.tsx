"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { AppLogo } from "@/app/components/AppLogo";

type Meta = { video_url: string | null; fotos: string[]; nombres: string };

const MAX_FOTOS = 20;
const MIN_FOTOS = 3;
const MAX_VIDEO_MB = 250;

export default function BodaCivilAdminPage() {
  const { id: eventoId } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [eventoNombre, setEventoNombre] = useState("");
  const [anfitriones, setAnfitriones] = useState("");
  const [meta, setMeta] = useState<Meta>({ video_url: null, fotos: [], nombres: "" });
  const [nombres, setNombres] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingFotos, setUploadingFotos] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [fotosProgress, setFotosProgress] = useState(0);

  const videoRef = useRef<HTMLInputElement>(null);
  const fotosRef = useRef<HTMLInputElement>(null);

  // ── Verificar sesión y cargar evento ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth/login"); return; }

      const { data: ev } = await supabase
        .from("eventos")
        .select("id,nombre,tipo,anfitriones,organizador_id")
        .eq("id", eventoId)
        .single();

      if (!ev || ev.organizador_id !== user.id || ev.tipo !== "boda") {
        router.replace("/dashboard");
        return;
      }
      setEventoNombre(ev.nombre);
      setAnfitriones(ev.anfitriones || "");

      // Cargar meta existente
      const res = await fetch(`/api/boda-civil/${eventoId}`);
      if (res.ok) {
        const data: Meta = await res.json();
        setMeta(data);
        setNombres(data.nombres || ev.anfitriones || "");
      } else {
        setNombres(ev.anfitriones || "");
      }
      setLoading(false);
    })();
  }, [eventoId, router]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  // ── Guardar nombres ────────────────────────────────────────────────────────
  async function guardarNombres() {
    setSaving(true);
    const fd = new FormData();
    fd.append("type", "set_nombres");
    fd.append("nombres", nombres.trim());
    const res = await fetch(`/api/boda-civil/${eventoId}`, { method: "POST", body: fd });
    const json = await res.json();
    if (json.ok) { setMeta(json.meta); showToast("Nombres guardados ✓"); }
    else showToast("Error al guardar nombres");
    setSaving(false);
  }

  // ── Subir video ───────────────────────────────────────────────────────────
  async function subirVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      showToast(`El video no puede superar ${MAX_VIDEO_MB}MB`);
      return;
    }
    setUploadingVideo(true);
    setVideoProgress(10);
    const fd = new FormData();
    fd.append("type", "video");
    fd.append("file", file);
    setVideoProgress(40);
    const res = await fetch(`/api/boda-civil/${eventoId}`, { method: "POST", body: fd });
    setVideoProgress(90);
    const json = await res.json();
    if (json.ok) { setMeta(json.meta); showToast("Video subido ✓"); }
    else showToast("Error al subir video: " + (json.error ?? ""));
    setUploadingVideo(false);
    setVideoProgress(0);
    if (videoRef.current) videoRef.current.value = "";
  }

  // ── Eliminar video ────────────────────────────────────────────────────────
  async function eliminarVideo() {
    if (!confirm("¿Eliminar el video?")) return;
    const fd = new FormData();
    fd.append("type", "delete_video");
    const res = await fetch(`/api/boda-civil/${eventoId}`, { method: "POST", body: fd });
    const json = await res.json();
    if (json.ok) { setMeta(json.meta); showToast("Video eliminado"); }
  }

  // ── Subir fotos ───────────────────────────────────────────────────────────
  async function subirFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const disponibles = MAX_FOTOS - meta.fotos.length;
    if (disponibles <= 0) { showToast("Ya tienes 20 fotos (máximo)"); return; }
    const toUpload = files.slice(0, disponibles);
    if (toUpload.length < files.length) showToast(`Solo se subirán ${toUpload.length} fotos (límite 20)`);

    setUploadingFotos(true);
    let done = 0;
    const newMeta = { ...meta };
    for (const file of toUpload) {
      const fd = new FormData();
      fd.append("type", "foto");
      fd.append("file", file);
      const res = await fetch(`/api/boda-civil/${eventoId}`, { method: "POST", body: fd });
      const json = await res.json();
      if (json.ok) newMeta.fotos = json.meta.fotos;
      done++;
      setFotosProgress(Math.round((done / toUpload.length) * 100));
    }
    setMeta(newMeta);
    showToast(`${done} foto(s) subida(s) ✓`);
    setUploadingFotos(false);
    setFotosProgress(0);
    if (fotosRef.current) fotosRef.current.value = "";
  }

  // ── Eliminar foto ─────────────────────────────────────────────────────────
  async function eliminarFoto(url: string) {
    if (meta.fotos.length <= MIN_FOTOS) {
      showToast(`Mínimo ${MIN_FOTOS} fotos requeridas`);
      return;
    }
    const fd = new FormData();
    fd.append("type", "delete_foto");
    fd.append("url", url);
    const res = await fetch(`/api/boda-civil/${eventoId}`, { method: "POST", body: fd });
    const json = await res.json();
    if (json.ok) { setMeta(json.meta); showToast("Foto eliminada"); }
  }

  const listo = meta.fotos.length >= MIN_FOTOS;

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f0e17", color: "#e8d9b5" }}>
      Cargando...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0f0e17", color: "#e8d9b5", fontFamily: "'DM Sans', sans-serif", paddingBottom: 60 }}>
      <style>{`
        *{box-sizing:border-box}
        .bc-header{background:#1a1209;border-bottom:1px solid rgba(212,175,55,0.25);padding:14px 18px;display:flex;align-items:center;gap:12px}
        .bc-back{color:#d4af37;font-size:13px;font-weight:600;text-decoration:none;display:flex;align-items:center;gap:6px}
        .bc-title{font-family:'Cormorant Garamond',serif;font-size:20px;font-style:italic;color:#e8d9b5;margin:0 auto;text-align:center;line-height:1.2}
        .bc-section{background:#1a1209;border:1px solid rgba(212,175,55,0.2);border-radius:14px;padding:18px;margin:16px}
        .bc-section-title{font-family:'Cormorant Garamond',serif;font-size:17px;color:#d4af37;margin:0 0 14px 0;display:flex;align-items:center;gap:8px}
        .bc-input{width:100%;background:#0f0e17;border:1px solid rgba(212,175,55,0.35);border-radius:10px;padding:12px 14px;color:#e8d9b5;font-size:14px;font-family:'DM Sans',sans-serif;outline:none}
        .bc-input:focus{border-color:#d4af37}
        .bc-btn{background:linear-gradient(135deg,#d4af37,#b8932a);color:#0f0e17;border:none;border-radius:10px;padding:12px 22px;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:opacity .18s}
        .bc-btn:hover{opacity:.85}
        .bc-btn:disabled{opacity:.45;cursor:not-allowed}
        .bc-btn-outline{background:transparent;border:1px solid rgba(212,175,55,0.5);color:#d4af37;border-radius:10px;padding:10px 18px;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .18s}
        .bc-btn-outline:hover{background:rgba(212,175,55,0.12)}
        .bc-upload-area{border:2px dashed rgba(212,175,55,0.35);border-radius:12px;padding:24px;text-align:center;cursor:pointer;transition:border-color .18s}
        .bc-upload-area:hover{border-color:#d4af37}
        .bc-video-preview{width:100%;max-height:220px;border-radius:10px;background:#000;margin-bottom:10px}
        .bc-fotos-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
        .bc-foto-item{position:relative;aspect-ratio:1;border-radius:8px;overflow:hidden}
        .bc-foto-item img{width:100%;height:100%;object-fit:cover;display:block}
        .bc-foto-del{position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.7);border:none;border-radius:50%;width:22px;height:22px;color:#fff;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1}
        .bc-progress{height:4px;background:rgba(212,175,55,0.2);border-radius:2px;margin-top:10px;overflow:hidden}
        .bc-progress-bar{height:100%;background:#d4af37;border-radius:2px;transition:width .3s}
        .bc-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.35);border-radius:20px;padding:4px 10px;font-size:11px;font-weight:700;color:#d4af37}
        .bc-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a1209;border:1px solid #d4af37;color:#e8d9b5;padding:10px 20px;border-radius:10px;font-size:13px;z-index:9999;box-shadow:0 6px 24px rgba(0,0,0,0.5);pointer-events:none}
        .bc-ok-check{width:20px;height:20px;background:rgba(34,197,94,0.2);border:1px solid rgba(34,197,94,0.5);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;color:#22c55e;flex-shrink:0}
        .bc-hint{font-size:11.5px;color:#94a3b8;margin-top:6px;line-height:1.5}
        .bc-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
        .bc-listo{background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.4);border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:10px;font-size:13px;color:#4ade80;margin:16px}
      `}</style>

      {/* Header */}
      <header className="bc-header">
        <Link href={`/dashboard`} className="bc-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          Dashboard
        </Link>
        <div style={{ flex: 1, textAlign: "center" }}>
          <AppLogo size={28} />
        </div>
      </header>

      <div style={{ padding: "20px 18px 6px", textAlign: "center" }}>
        <div style={{ fontSize: 28 }}>💍</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontStyle: "italic", color: "#d4af37", margin: "6px 0 4px" }}>
          Mi Boda Civil
        </h1>
        <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>{eventoNombre}</p>
      </div>

      {/* 1. Nombres de los casantes */}
      <div className="bc-section">
        <h2 className="bc-section-title">💑 Nombres de los casantes</h2>
        <p className="bc-hint" style={{ marginBottom: 12 }}>
          Aparecerá en el marco del video. Ej: <em>Carlos &amp; María</em>
        </p>
        <input
          className="bc-input"
          value={nombres}
          onChange={e => setNombres(e.target.value)}
          placeholder={anfitriones || "Ej: Carlos & María"}
          maxLength={80}
        />
        <div style={{ marginTop: 10 }}>
          <button className="bc-btn" onClick={guardarNombres} disabled={saving || !nombres.trim()}>
            {saving ? "Guardando..." : "Guardar nombres"}
          </button>
        </div>
      </div>

      {/* 2. Video */}
      <div className="bc-section">
        <h2 className="bc-section-title">
          🎬 Video de la boda civil
          {meta.video_url && <span className="bc-ok-check">✓</span>}
        </h2>
        <p className="bc-hint" style={{ marginBottom: 12 }}>
          Máximo {MAX_VIDEO_MB}MB · MP4, MOV o WebM · duración recomendada 3-4 min
        </p>

        {meta.video_url ? (
          <>
            <video src={meta.video_url} controls className="bc-video-preview" />
            <div className="bc-row">
              <label style={{ cursor: "pointer" }}>
                <span className="bc-btn-outline">Cambiar video</span>
                <input ref={videoRef} type="file" accept="video/*" style={{ display: "none" }} onChange={subirVideo} disabled={uploadingVideo} />
              </label>
              <button className="bc-btn-outline" style={{ borderColor: "rgba(239,68,68,0.5)", color: "#f87171" }} onClick={eliminarVideo}>
                Eliminar
              </button>
            </div>
          </>
        ) : (
          <label className="bc-upload-area" style={{ display: "block" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎥</div>
            <div style={{ fontSize: 13, color: "#d4af37", fontWeight: 600 }}>
              {uploadingVideo ? "Subiendo video..." : "Toca para seleccionar video"}
            </div>
            <div className="bc-hint" style={{ marginTop: 6 }}>MP4 · MOV · WebM</div>
            <input ref={videoRef} type="file" accept="video/*" style={{ display: "none" }} onChange={subirVideo} disabled={uploadingVideo} />
          </label>
        )}

        {uploadingVideo && (
          <div className="bc-progress">
            <div className="bc-progress-bar" style={{ width: `${videoProgress}%` }} />
          </div>
        )}
      </div>

      {/* 3. Fotos */}
      <div className="bc-section">
        <h2 className="bc-section-title">
          📸 Carrusel de fotos
          <span className="bc-badge">{meta.fotos.length} / {MAX_FOTOS}</span>
          {meta.fotos.length >= MIN_FOTOS && <span className="bc-ok-check">✓</span>}
        </h2>
        <p className="bc-hint" style={{ marginBottom: 12 }}>
          Mínimo {MIN_FOTOS}, máximo {MAX_FOTOS} fotos. Aparecen debajo del video en el muro.
        </p>

        {meta.fotos.length < MAX_FOTOS && (
          <label className="bc-upload-area" style={{ display: "block", marginBottom: 12 }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>➕</div>
            <div style={{ fontSize: 13, color: "#d4af37", fontWeight: 600 }}>
              {uploadingFotos ? `Subiendo... ${fotosProgress}%` : "Agregar fotos"}
            </div>
            <div className="bc-hint">Puedes seleccionar varias a la vez</div>
            <input ref={fotosRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={subirFotos} disabled={uploadingFotos} />
          </label>
        )}

        {uploadingFotos && (
          <div className="bc-progress" style={{ marginBottom: 12 }}>
            <div className="bc-progress-bar" style={{ width: `${fotosProgress}%` }} />
          </div>
        )}

        {meta.fotos.length > 0 && (
          <div className="bc-fotos-grid">
            {meta.fotos.map((url, i) => (
              <div key={url} className="bc-foto-item">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Foto ${i + 1}`} />
                <button className="bc-foto-del" onClick={() => eliminarFoto(url)} title="Eliminar foto">×</button>
              </div>
            ))}
          </div>
        )}

        {meta.fotos.length === 0 && !uploadingFotos && (
          <p style={{ color: "#94a3b8", fontSize: 12, textAlign: "center", padding: "16px 0" }}>
            Aún no hay fotos. Sube al menos {MIN_FOTOS}.
          </p>
        )}
      </div>

      {/* Estado final */}
      {listo && meta.video_url && (
        <div className="bc-listo">
          <span style={{ fontSize: 20 }}>✅</span>
          <div>
            <div style={{ fontWeight: 700 }}>¡Todo listo!</div>
            <div style={{ fontSize: 11, color: "#86efac", marginTop: 2 }}>
              El módulo "Mi Boda Civil" ya aparece en el muro del evento.
            </div>
          </div>
          <Link
            href={`/muro/${eventoId}?tab=boda`}
            style={{ marginLeft: "auto", background: "#d4af37", color: "#0f0e17", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none" }}
          >
            Ver en muro →
          </Link>
        </div>
      )}

      {!listo && (
        <div style={{ margin: "0 16px", padding: "12px 16px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 12, fontSize: 12, color: "#fca5a5" }}>
          ⚠️ Para mostrar el módulo en el muro necesitas: nombres de casantes, video y al menos {MIN_FOTOS} fotos.
        </div>
      )}

      {toast && <div className="bc-toast">{toast}</div>}
    </div>
  );
}
