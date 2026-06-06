"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Meta = { video_url: string | null; fotos: string[]; nombres: string };

const MAX_FOTOS = 20;
const MIN_FOTOS = 3;
const MAX_VIDEO_MB = 500;

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased;background:#FAFBFF;color:#0F172A;max-width:100vw;-webkit-text-size-adjust:100%}
  :root{
    --bg:#FAFBFF;--surface:#FFFFFF;--surface2:#F4F5FB;
    --border:rgba(79,70,229,0.16);--border-input:rgba(79,70,229,0.28);
    --accent:#4F46E5;--accent-dark:#3730A3;
    --accent-soft:rgba(79,70,229,0.08);--accent-soft2:rgba(79,70,229,0.16);
    --text:#0F172A;--text2:#475569;--text3:#3730A3;
    --shadow:0 2px 16px rgba(79,70,229,0.08);--r:22px
  }
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .page-wrap{min-height:calc(100dvh - env(safe-area-inset-top,0px));background:var(--bg);opacity:0;transition:opacity .35s}
  .page-wrap.vis{opacity:1}
  .top-bar{display:flex;align-items:center;justify-content:center;height:54px;padding:0 16px;background:rgba(500,251,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--border);position:sticky;top:env(safe-area-inset-top,0px);z-index:30;width:100%}
  .top-bar-title{font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:600;color:var(--text);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .bottom-bar{position:fixed;bottom:0;left:0;right:0;z-index:40;height:calc(56px + env(safe-area-inset-bottom,0px));padding-bottom:env(safe-area-inset-bottom,0px);background:rgba(500,251,255,0.94);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-top:1px solid var(--border);display:flex;align-items:center;padding-left:16px;padding-right:16px;box-shadow:0 -4px 20px rgba(79,70,229,0.07)}
  .btn-back{display:inline-flex;align-items:center;gap:8px;background:transparent;border:none;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;color:var(--accent);cursor:pointer;padding:10px 4px;border-radius:10px;-webkit-tap-highlight-color:transparent;transition:opacity .15s}
  .btn-back:active{opacity:.6}
  .content{max-width:520px;margin:0 auto;padding:18px 14px calc(100px + env(safe-area-inset-bottom,0px))}
  .card{background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r);padding:22px 20px;box-shadow:var(--shadow);margin-bottom:14px;animation:fadeIn .4s ease both}
  .card-title{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--text);margin-bottom:3px}
  .card-sub{font-size:12.5px;color:var(--text3);font-weight:500;margin-bottom:20px}
  .section-header{display:flex;align-items:flex-start;gap:13px;margin-bottom:18px}
  .sec-icon{width:42px;height:42px;border-radius:13px;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .sec-icon svg{color:var(--accent)}
  .sec-title{font-size:15px;font-weight:700;color:var(--text);margin-bottom:2px}
  .sec-sub{font-size:12px;color:var(--text2);line-height:1.5}
  .campo{margin-top:14px}
  .field-label{font-size:11px;font-weight:600;color:var(--accent);display:block;margin-bottom:7px;letter-spacing:.6px;text-transform:uppercase}
  .field-input{width:100%;border:2px solid var(--border-input);border-radius:14px;padding:12px 15px;font-size:14px;font-family:'DM Sans',sans-serif;color:var(--text);background:var(--accent-soft);outline:none;transition:border-color .15s,background .15s;-webkit-appearance:none}
  .field-input::placeholder{color:var(--text3)}
  .field-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(79,70,229,0.11);background:var(--surface)}
  .upload-area{border:2px dashed var(--border-input);border-radius:16px;padding:26px 16px;text-align:center;cursor:pointer;transition:all .18s;background:var(--accent-soft);display:block}
  .upload-area:hover{border-color:var(--accent);background:var(--accent-soft2)}
  .upload-icon{font-size:30px;margin-bottom:10px}
  .upload-label{font-size:13px;font-weight:600;color:var(--accent)}
  .upload-hint{font-size:11px;color:var(--text2);margin-top:5px}
  .video-preview{width:100%;max-height:200px;border-radius:14px;background:#000;display:block;margin-bottom:12px}
  .fotos-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}
  .foto-item{position:relative;aspect-ratio:1;border-radius:12px;overflow:hidden;border:1.5px solid var(--border)}
  .foto-item img{width:100%;height:100%;object-fit:cover;display:block}
  .foto-del{position:absolute;top:5px;right:5px;background:rgba(0,0,0,0.65);border:none;border-radius:50%;width:24px;height:24px;color:#fff;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1}
  .progress-wrap{height:5px;background:var(--accent-soft2);border-radius:3px;margin-top:12px;overflow:hidden}
  .progress-fill{height:100%;background:var(--accent);border-radius:3px;transition:width .3s}
  .counter{display:inline-flex;align-items:center;background:var(--accent-soft2);border:1.5px solid var(--border-input);border-radius:20px;padding:3px 11px;font-size:11px;font-weight:700;color:var(--accent-dark);margin-left:8px}
  .btn-guardar{width:100%;background:linear-gradient(135deg,#4F46E5,#6366F1);color:#fff;border:none;border-radius:16px;padding:15px;font-size:15px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 10px 24px -6px rgba(79,70,229,0.38);transition:opacity .15s,transform .15s;margin-top:8px}
  .btn-guardar:disabled{opacity:.55;cursor:not-allowed}
  .btn-guardar:active:not(:disabled){transform:scale(.98)}
  .btn-sec{display:inline-flex;align-items:center;gap:6px;background:var(--surface);border:1.5px solid var(--border-input);border-radius:11px;padding:9px 15px;font-size:12px;font-weight:600;color:var(--text2);cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s}
  .btn-sec:hover{border-color:var(--accent);color:var(--accent)}
  .btn-danger{border-color:rgba(185,28,28,.25);color:#b91c1c}
  .btn-danger:hover{border-color:#b91c1c;background:#fef2f2}
  .btn-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
  .alert-ok{background:rgba(34,197,94,0.09);border:1.5px solid rgba(34,197,94,0.28);border-radius:14px;padding:13px 16px;display:flex;align-items:center;gap:10px;font-size:13px;color:#166534;margin-bottom:16px}
  .alert-warn{background:rgba(79,70,229,0.06);border:1.5px solid var(--border);border-radius:14px;padding:13px 16px;display:flex;align-items:center;gap:10px;font-size:12px;color:var(--text2);margin-bottom:16px}
  .muro-btn{display:inline-flex;align-items:center;gap:6px;background:var(--accent-soft);border:1.5px solid var(--border-input);border-radius:11px;padding:8px 14px;font-size:12px;font-weight:600;color:var(--accent-dark);text-decoration:none;margin-left:auto}
  .toast{position:fixed;bottom:calc(70px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);background:#0F172A;color:#fff;padding:10px 20px;border-radius:12px;font-size:13px;font-weight:500;z-index:9999;box-shadow:0 6px 24px rgba(0,0,0,0.25);pointer-events:none;white-space:nowrap}
  .spinner{border-radius:50%;border:2px solid rgba(79,70,229,0.2);border-top-color:var(--accent);animation:spin .75s linear infinite}
  .spinner.sm{width:14px;height:14px}
  .spinner.lg{width:32px;height:32px}
  .spinner-center{display:flex;justify-content:center;padding:64px}
  @media(max-width:400px){.card{padding:18px 15px;border-radius:18px}.field-input{padding:10px 13px;font-size:13.5px}}
`;

export default function BodaCivilAdminPage() {
  const { id: eventoId } = useParams<{ id: string }>();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [eventoNombre, setEventoNombre] = useState("");
  const [anfitriones, setAnfitriones] = useState("");
  const [meta, setMeta] = useState<Meta>({ video_url: null, fotos: [], nombres: "" });
  const [nombres, setNombres] = useState("");
  const [savingNombres, setSavingNombres] = useState(false);
  const [toast, setToast] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingFotos, setUploadingFotos] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [fotosProgress, setFotosProgress] = useState(0);
  const videoRef = useRef<HTMLInputElement>(null);
  const fotosRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    document.title = "Evorix — Mi Boda Civil";
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth/login"); return; }
      const { data: ev } = await supabase
        .from("eventos")
        .select("id,nombre,tipo,anfitriones,organizador_id")
        .eq("id", eventoId)
        .single();
      if (!ev || ev.organizador_id !== user.id || ev.tipo !== "boda") {
        router.replace("/dashboard"); return;
      }
      setEventoNombre(ev.nombre);
      setAnfitriones(ev.anfitriones || "");
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
    setTimeout(() => setToast(""), 3000);
  }

  async function guardarNombres() {
    if (!nombres.trim()) return;
    setSavingNombres(true);
    const fd = new FormData();
    fd.append("type", "set_nombres");
    fd.append("nombres", nombres.trim());
    const res = await fetch(`/api/boda-civil/${eventoId}`, { method: "POST", body: fd });
    const json = await res.json();
    if (json.ok) { setMeta(json.meta); showToast("Guardado ✓"); }
    else showToast("Error al guardar");
    setSavingNombres(false);
  }

  async function subirVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      showToast(`El video no puede superar ${MAX_VIDEO_MB} MB`); return;
    }
    setUploadingVideo(true); setVideoProgress(20);
    const fd = new FormData();
    fd.append("type", "video"); fd.append("file", file);
    setVideoProgress(50);
    const res = await fetch(`/api/boda-civil/${eventoId}`, { method: "POST", body: fd });
    setVideoProgress(90);
    const json = await res.json();
    if (json.ok) { setMeta(json.meta); showToast("Video subido ✓"); }
    else showToast("Error: " + (json.error ?? ""));
    setUploadingVideo(false); setVideoProgress(0);
    if (videoRef.current) videoRef.current.value = "";
  }

  async function eliminarVideo() {
    if (!confirm("¿Eliminar el video?")) return;
    const fd = new FormData();
    fd.append("type", "delete_video");
    const res = await fetch(`/api/boda-civil/${eventoId}`, { method: "POST", body: fd });
    const json = await res.json();
    if (json.ok) { setMeta(json.meta); showToast("Video eliminado"); }
  }

  async function subirFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const disponibles = MAX_FOTOS - meta.fotos.length;
    if (disponibles <= 0) { showToast("Ya tienes 20 fotos"); return; }
    const toUpload = files.slice(0, disponibles);
    setUploadingFotos(true);
    let done = 0;
    let latestMeta = { ...meta };
    for (const file of toUpload) {
      const fd = new FormData();
      fd.append("type", "foto"); fd.append("file", file);
      const res = await fetch(`/api/boda-civil/${eventoId}`, { method: "POST", body: fd });
      const json = await res.json();
      if (json.ok) latestMeta = json.meta;
      done++;
      setFotosProgress(Math.round((done / toUpload.length) * 100));
    }
    setMeta(latestMeta);
    showToast(`${done} foto${done > 1 ? "s" : ""} subida${done > 1 ? "s" : ""} ✓`);
    setUploadingFotos(false); setFotosProgress(0);
    if (fotosRef.current) fotosRef.current.value = "";
  }

  async function eliminarFoto(url: string) {
    if (meta.fotos.length <= MIN_FOTOS) {
      showToast(`Mínimo ${MIN_FOTOS} fotos`); return;
    }
    const fd = new FormData();
    fd.append("type", "delete_foto"); fd.append("url", url);
    const res = await fetch(`/api/boda-civil/${eventoId}`, { method: "POST", body: fd });
    const json = await res.json();
    if (json.ok) { setMeta(json.meta); showToast("Foto eliminada"); }
  }

  const listo = meta.fotos.length >= MIN_FOTOS && !!meta.video_url && !!meta.nombres;

  if (loading) return (
    <div className="page-wrap vis">
      <style>{styles}</style>
      <div className="spinner-center"><div className="spinner lg" /></div>
    </div>
  );

  return (
    <div className={`page-wrap${mounted ? " vis" : ""}`}>
      <style>{styles}</style>

      <div className="top-bar">
        <div className="top-bar-title">💍 Mi Boda Civil — {eventoNombre}</div>
      </div>

      <div className="content">
        {listo ? (
          <div className="alert-ok">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <div style={{flex:1}}><strong>¡Módulo activo!</strong> Aparece en el muro del evento.</div>
            <a href={`/muro/${eventoId}?tab=boda`} className="muro-btn">Ver muro →</a>
          </div>
        ) : (
          <div className="alert-warn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Necesitas nombres, video y al menos {MIN_FOTOS} fotos para activar este módulo en el muro.
          </div>
        )}

        {/* 1. Nombres */}
        <div className="card">
          <div className="section-header">
            <div className="sec-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </div>
            <div>
              <div className="sec-title">Nombres de los casantes</div>
              <div className="sec-sub">Aparecen en el marco decorativo del video · Ej: Carlos &amp; María</div>
            </div>
          </div>
          <div className="campo">
            <label className="field-label">Nombres</label>
            <input
              className="field-input"
              value={nombres}
              onChange={e => setNombres(e.target.value)}
              placeholder={anfitriones || "Ej: Carlos & María"}
              maxLength={80}
            />
          </div>
          <button className="btn-guardar" onClick={guardarNombres} disabled={savingNombres || !nombres.trim()}>
            {savingNombres ? <><div className="spinner sm" /> Guardando...</> : "Guardar nombres"}
          </button>
        </div>

        {/* 2. Video */}
        <div className="card">
          <div className="section-header">
            <div className="sec-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            </div>
            <div>
              <div className="sec-title">
                Video de la boda civil
                {meta.video_url && <span style={{marginLeft:8,fontSize:11,background:"rgba(34,197,94,0.12)",color:"#166534",border:"1px solid rgba(34,197,94,0.3)",borderRadius:20,padding:"2px 9px",fontWeight:700}}>Subido ✓</span>}
              </div>
              <div className="sec-sub">Máx. {MAX_VIDEO_MB} MB · MP4 / MOV / WebM · 3–4 min recomendado</div>
            </div>
          </div>
          {meta.video_url ? (
            <>
              <video src={meta.video_url} controls className="video-preview" />
              <div className="btn-row">
                <label style={{cursor:"pointer"}}>
                  <span className="btn-sec">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Cambiar video
                  </span>
                  <input ref={videoRef} type="file" accept="video/*" style={{display:"none"}} onChange={subirVideo} disabled={uploadingVideo} />
                </label>
                <button className="btn-sec btn-danger" onClick={eliminarVideo}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                  Eliminar
                </button>
              </div>
            </>
          ) : (
            <label className="upload-area">
              <div className="upload-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--accent)"}}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              </div>
              <div className="upload-label">{uploadingVideo ? "Subiendo video…" : "Toca para seleccionar video"}</div>
              <div className="upload-hint">MP4 · MOV · WebM · máx {MAX_VIDEO_MB} MB</div>
              <input ref={videoRef} type="file" accept="video/*" style={{display:"none"}} onChange={subirVideo} disabled={uploadingVideo} />
            </label>
          )}
          {uploadingVideo && (
            <div className="progress-wrap">
              <div className="progress-fill" style={{width:`${videoProgress}%`}} />
            </div>
          )}
        </div>

        {/* 3. Fotos */}
        <div className="card">
          <div className="section-header">
            <div className="sec-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
            <div style={{flex:1}}>
              <div className="sec-title" style={{display:"flex",alignItems:"center",flexWrap:"wrap"}}>
                Carrusel de fotos
                <span className="counter">{meta.fotos.length} / {MAX_FOTOS}</span>
                {meta.fotos.length >= MIN_FOTOS && (
                  <span style={{marginLeft:6,fontSize:11,background:"rgba(34,197,94,0.12)",color:"#166534",border:"1px solid rgba(34,197,94,0.3)",borderRadius:20,padding:"2px 9px",fontWeight:700}}>✓</span>
                )}
              </div>
              <div className="sec-sub">Mín. {MIN_FOTOS} · Máx. {MAX_FOTOS} · aparecen debajo del video</div>
            </div>
          </div>
          {meta.fotos.length < MAX_FOTOS && (
            <label className="upload-area" style={{marginBottom:14}}>
              <div className="upload-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--accent)"}}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
              <div className="upload-label">{uploadingFotos ? `Subiendo… ${fotosProgress}%` : "Agregar fotos"}</div>
              <div className="upload-hint">Puedes seleccionar varias a la vez</div>
              <input ref={fotosRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={subirFotos} disabled={uploadingFotos} />
            </label>
          )}
          {uploadingFotos && (
            <div className="progress-wrap" style={{marginBottom:14}}>
              <div className="progress-fill" style={{width:`${fotosProgress}%`}} />
            </div>
          )}
          {meta.fotos.length > 0 ? (
            <div className="fotos-grid">
              {meta.fotos.map((url, i) => (
                <div key={url} className="foto-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Foto ${i + 1}`} />
                  <button className="foto-del" onClick={() => eliminarFoto(url)} title="Eliminar">×</button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{textAlign:"center",color:"var(--text2)",fontSize:12,padding:"16px 0"}}>
              Aún no hay fotos. Sube al menos {MIN_FOTOS}.
            </p>
          )}
        </div>
      </div>

      <div className="bottom-bar">
        <button className="btn-back" onClick={() => router.push("/dashboard")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          Dashboard
        </button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
