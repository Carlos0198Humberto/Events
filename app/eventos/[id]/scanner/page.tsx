"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";

// ─── Tipos ─────────────────────────────────────────────────────────────────
type Invitado = {
  id: string;
  nombre: string;
  num_personas: number;
  estado: string;
  presente: boolean;
  presente_hora?: string | null;
  numero_confirmacion?: number | null;
  mesa_id?: string | null;
};

type ScanResult =
  | { status: "ok"; invitado: Invitado }
  | { status: "ya_presente"; invitado: Invitado }
  | { status: "no_confirmado"; invitado: Invitado }
  | { status: "no_encontrado" }
  | { status: "error"; message: string };

// ─── AppLogo ───────────────────────────────────────────────────────────────
function AppLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="18" fill="#140d04"/>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="rgba(201,169,110,0.20)" strokeWidth="1.2"/>
      <rect x="13" y="14" width="6" height="36" rx="3" fill="#C9A96E"/>
      <rect x="13" y="14" width="24" height="6" rx="3" fill="#C9A96E"/>
      <rect x="13" y="29" width="18" height="6" rx="3" fill="#C9A96E"/>
      <rect x="13" y="44" width="24" height="6" rx="3" fill="#C9A96E"/>
      <path d="M48 11 L49.8 17.2 L56 19 L49.8 20.8 L48 27 L46.2 20.8 L40 19 L46.2 17.2 Z" fill="#E8D5B0"/>
    </svg>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function extractToken(raw: string): string | null {
  // Acepta URL completa o solo el token
  const match = raw.match(/\/confirmar\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // Si es solo un UUID/token directamente
  if (/^[a-zA-Z0-9_-]{8,}$/.test(raw.trim())) return raw.trim();
  return null;
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

// ─── Componente principal ──────────────────────────────────────────────────
export default function ScannerPage() {
  const params = useParams();
  const router = useRouter();
  const eventoId = params.id as string;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number>(0);
  const lastScannedRef = useRef<string>("");
  const cooldownRef = useRef<number>(0);

  const [camPermiso, setCamPermiso] = useState<"pendiente" | "ok" | "denegado">("pendiente");
  const [barcodeSupport, setBarcodeSupport] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [resultado, setResultado] = useState<ScanResult | null>(null);
  const [manualInput, setManualInput] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [stats, setStats] = useState<{ total: number; presentes: number } | null>(null);
  const [eventoNombre, setEventoNombre] = useState("");

  // Cargar stats del evento
  useEffect(() => {
    async function cargar() {
      const { data: ev } = await supabase.from("eventos").select("nombre").eq("id", eventoId).single();
      if (ev) setEventoNombre(ev.nombre);
      await actualizarStats();
    }
    cargar();
  }, [eventoId]);

  async function actualizarStats() {
    const { count: total } = await supabase
      .from("invitados")
      .select("*", { count: "exact", head: true })
      .eq("evento_id", eventoId)
      .eq("estado", "confirmado");
    const { count: presentes } = await supabase
      .from("invitados")
      .select("*", { count: "exact", head: true })
      .eq("evento_id", eventoId)
      .eq("presente", true);
    setStats({ total: total ?? 0, presentes: presentes ?? 0 });
  }

  // Verificar soporte de BarcodeDetector
  useEffect(() => {
    setBarcodeSupport("BarcodeDetector" in window);
  }, []);

  // Iniciar cámara
  async function iniciarCamara() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamPermiso("ok");
      setScanning(true);
    } catch {
      setCamPermiso("denegado");
    }
  }

  // Detener cámara
  function detenerCamara() {
    cancelAnimationFrame(scanLoopRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  // Loop de escaneo con BarcodeDetector
  const iniciarScanLoop = useCallback(() => {
    if (!barcodeSupport || !videoRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });

    async function loop() {
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        scanLoopRef.current = requestAnimationFrame(loop);
        return;
      }
      const now = Date.now();
      if (now < cooldownRef.current) {
        scanLoopRef.current = requestAnimationFrame(loop);
        return;
      }
      try {
        const barcodes = await detector.detect(video);
        if (barcodes.length > 0) {
          const raw = barcodes[0].rawValue as string;
          if (raw !== lastScannedRef.current) {
            lastScannedRef.current = raw;
            cooldownRef.current = now + 3000; // 3s cooldown
            await procesarToken(raw);
          }
        }
      } catch { /* ignore */ }
      scanLoopRef.current = requestAnimationFrame(loop);
    }
    scanLoopRef.current = requestAnimationFrame(loop);
  }, [barcodeSupport]);

  useEffect(() => {
    if (scanning && barcodeSupport) {
      iniciarScanLoop();
    }
    return () => cancelAnimationFrame(scanLoopRef.current);
  }, [scanning, barcodeSupport, iniciarScanLoop]);

  useEffect(() => {
    return () => detenerCamara();
  }, []);

  // Procesar token escaneado o ingresado manualmente
  async function procesarToken(raw: string) {
    const token = extractToken(raw);
    if (!token) {
      setResultado({ status: "error", message: "QR no reconocido. Asegúrate de escanear el QR de Eventix." });
      return;
    }
    setProcesando(true);
    try {
      const { data: inv } = await supabase
        .from("invitados")
        .select("*")
        .eq("token", token)
        .eq("evento_id", eventoId)
        .single();

      if (!inv) {
        setResultado({ status: "no_encontrado" });
        setProcesando(false);
        return;
      }

      if (inv.presente) {
        setResultado({ status: "ya_presente", invitado: inv });
        setProcesando(false);
        await actualizarStats();
        return;
      }

      if (inv.estado !== "confirmado") {
        setResultado({ status: "no_confirmado", invitado: inv });
        setProcesando(false);
        return;
      }

      // Marcar como presente
      const { data: updated } = await supabase
        .from("invitados")
        .update({ presente: true, presente_hora: new Date().toISOString() })
        .eq("id", inv.id)
        .select()
        .single();

      setResultado({ status: "ok", invitado: updated ?? inv });
      await actualizarStats();
    } catch (err) {
      setResultado({ status: "error", message: String(err) });
    }
    setProcesando(false);
  }

  async function handleManualSubmit() {
    if (!manualInput.trim()) return;
    await procesarToken(manualInput.trim());
    setManualInput("");
  }

  function limpiarResultado() {
    setResultado(null);
    lastScannedRef.current = "";
    cooldownRef.current = 0;
  }

  // ─── ESTILOS ──────────────────────────────────────────────────────────────
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Jost:wght@300;400;500;600;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{font-family:'Jost',sans-serif;-webkit-font-smoothing:antialiased;background:#FAF6F0;color:#1a1209}
    :root{
      --gold:#C9A96E;--gold-dark:#8B6914;--gold-light:#E8D5B0;--gold-pale:#F5EDD8;
      --dark:#1a1209;--dark2:#2d1f0a;--ink:#3d2b0f;--ink2:#5a3e1b;--ink3:#8B6914;
      --cream:#FAF6F0;--cream2:#F0E8D8;--surface:#FFFFFF;
      --border:rgba(201,169,110,0.25);--border-mid:rgba(201,169,110,0.40);
      --r:20px;--r-sm:14px;
    }
    @keyframes riseUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
    @keyframes scanLine{0%{top:0}100%{top:100%}}
    @keyframes popIn{from{transform:scale(.7);opacity:0}to{transform:scale(1);opacity:1}}

    .page{min-height:100dvh;background:var(--cream);padding-bottom:env(safe-area-inset-bottom,20px)}
    .topbar{display:flex;align-items:center;gap:12px;padding:12px 18px;background:rgba(250,246,240,0.96);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:20}
    .topbar-back{width:36px;height:36px;border-radius:10px;background:var(--cream2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}
    .topbar-info{flex:1}
    .topbar-title{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:600;color:var(--ink);line-height:1}
    .topbar-sub{font-size:10px;color:var(--ink3);font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-top:2px}

    .wrap{max-width:480px;margin:0 auto;padding:20px 16px;display:flex;flex-direction:column;gap:16px}

    /* Stats */
    .stats-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .stat-card{background:var(--surface);border:1px solid var(--border-mid);border-radius:var(--r-sm);padding:14px 18px}
    .stat-num{font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:600;color:var(--dark);line-height:1}
    .stat-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--ink3);margin-top:3px}
    .stat-card.presentes .stat-num{color:#166534}
    .stat-card.presentes{border-color:rgba(22,101,52,.2);background:#f0fdf4}

    /* Camera */
    .cam-card{background:var(--dark);border-radius:var(--r);overflow:hidden;position:relative;aspect-ratio:4/3}
    .cam-video{width:100%;height:100%;object-fit:cover;display:block}
    .cam-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
    .cam-frame{width:200px;height:200px;position:relative}
    .cam-frame::before,.cam-frame::after{content:'';position:absolute;width:30px;height:30px;border-color:#C9A96E;border-style:solid;border-width:0}
    .cam-frame::before{top:0;left:0;border-top-width:3px;border-left-width:3px;border-radius:4px 0 0 0}
    .cam-frame::after{bottom:0;right:0;border-bottom-width:3px;border-right-width:3px;border-radius:0 0 4px 0}
    .cam-corner-tr{position:absolute;top:0;right:0;width:30px;height:30px;border-top:3px solid #C9A96E;border-right:3px solid #C9A96E;border-radius:0 4px 0 0}
    .cam-corner-bl{position:absolute;bottom:0;left:0;width:30px;height:30px;border-bottom:3px solid #C9A96E;border-left:3px solid #C9A96E;border-radius:0 0 0 4px}
    .cam-scanline{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(201,169,110,0.8),transparent);animation:scanLine 2s linear infinite}
    .cam-hint{position:absolute;bottom:12px;left:0;right:0;text-align:center;font-size:11px;color:rgba(232,213,176,0.7);font-weight:500}
    .cam-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;height:100%;padding:20px}

    /* Botones */
    .btn-primary{width:100%;background:linear-gradient(135deg,var(--dark),var(--dark2));color:var(--gold);border:1px solid rgba(201,169,110,0.35);border-radius:var(--r-sm);padding:16px;font-family:'Jost',sans-serif;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;transition:transform .15s,opacity .15s;letter-spacing:.3px}
    .btn-primary:hover{transform:translateY(-1px)}
    .btn-primary:disabled{opacity:.6;cursor:wait}
    .btn-secondary{width:100%;background:var(--cream);color:var(--ink2);border:1.5px solid var(--border-mid);border-radius:var(--r-sm);padding:14px;font-family:'Jost',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s}
    .btn-secondary:hover{background:var(--gold-pale);border-color:var(--gold)}
    .btn-danger{width:100%;background:#fef2f2;color:#b91c1c;border:1.5px solid rgba(185,28,28,.2);border-radius:var(--r-sm);padding:14px;font-family:'Jost',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s}
    .btn-danger:hover{background:#fee2e2}

    /* Manual input */
    .manual-section{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:18px}
    .manual-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:var(--ink3);margin-bottom:10px;display:block}
    .manual-row{display:flex;gap:8px}
    .manual-input{flex:1;background:var(--cream);border:1.5px solid var(--border-mid);border-radius:10px;padding:11px 14px;font-family:'Jost',sans-serif;font-size:13px;color:var(--ink);outline:none;transition:border-color .15s}
    .manual-input:focus{border-color:var(--gold)}
    .manual-input::placeholder{color:var(--ink3);opacity:.6}
    .manual-btn{background:linear-gradient(135deg,var(--dark),var(--dark2));color:var(--gold);border:none;border-radius:10px;padding:11px 16px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Jost',sans-serif;transition:opacity .15s;white-space:nowrap}
    .manual-btn:disabled{opacity:.6;cursor:wait}

    /* Resultado */
    .result-overlay{position:fixed;inset:0;z-index:9000;background:rgba(10,8,4,0.6);backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;animation:fadeIn .2s ease;padding:0 0 env(safe-area-inset-bottom,0px)}
    .result-sheet{width:100%;max-width:480px;background:var(--surface);border-radius:28px 28px 0 0;padding:24px 24px calc(28px + env(safe-area-inset-bottom,0px));box-shadow:0 -16px 60px rgba(0,0,0,.2);animation:riseUp .35s cubic-bezier(.22,1,.36,1)}
    .result-icon{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;animation:popIn .4s cubic-bezier(.22,1,.36,1)}
    .result-icon.ok{background:linear-gradient(135deg,#166534,#16a34a)}
    .result-icon.warning{background:linear-gradient(135deg,#92400e,#d97706)}
    .result-icon.error{background:linear-gradient(135deg,#991b1b,#dc2626)}
    .result-titulo{font-family:'Cormorant Garamond',serif;font-size:28px;font-style:italic;color:var(--ink);text-align:center;margin-bottom:6px}
    .result-nombre{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:var(--dark);text-align:center;margin-bottom:10px}
    .result-info-row{display:flex;align-items:center;gap:10px;background:var(--cream);border:1px solid var(--border);border-radius:10px;padding:10px 14px;margin-bottom:8px}
    .result-info-label{font-size:10px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:2px}
    .result-info-val{font-size:14px;color:var(--ink);font-weight:500}
    .spinner{width:18px;height:18px;border-radius:50%;border:2px solid rgba(201,169,110,.3);border-top-color:var(--gold);animation:spin .7s linear infinite}
    .no-support-box{background:#fffbeb;border:1px solid rgba(245,158,11,.3);border-radius:var(--r-sm);padding:16px;text-align:center}
  `;

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <style>{styles}</style>

      {/* Header */}
      <div className="topbar">
        <button className="topbar-back" onClick={() => router.push(`/dashboard`)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="#8B6914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="topbar-info">
          <div className="topbar-title">Scanner de entrada</div>
          {eventoNombre && <div className="topbar-sub">{eventoNombre}</div>}
        </div>
        <AppLogo size={34} />
      </div>

      <div className="wrap">
        {/* Stats */}
        {stats !== null && (
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-num">{stats.total}</div>
              <div className="stat-label">Confirmados</div>
            </div>
            <div className="stat-card presentes">
              <div className="stat-num">{stats.presentes}</div>
              <div className="stat-label">Presentes hoy</div>
            </div>
          </div>
        )}

        {/* Vista de cámara */}
        <div className="cam-card">
          {camPermiso === "ok" ? (
            <>
              <video ref={videoRef} className="cam-video" muted playsInline />
              <div className="cam-overlay">
                <div className="cam-frame">
                  <div className="cam-corner-tr" />
                  <div className="cam-corner-bl" />
                  <div className="cam-scanline" />
                </div>
              </div>
              {procesando && (
                <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(20,13,4,0.8)", borderRadius: 10, padding: "6px 12px", display: "flex", alignItems: "center", gap: 7, color: "#E8D5B0", fontSize: 12, fontWeight: 600 }}>
                  <div className="spinner" style={{ borderTopColor: "#C9A96E" }} />
                  Verificando...
                </div>
              )}
              <div className="cam-hint">Apunta al QR del invitado</div>
            </>
          ) : (
            <div className="cam-placeholder">
              {camPermiso === "pendiente" && (
                <>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="13" r="4" stroke="#C9A96E" strokeWidth="1.5"/>
                  </svg>
                  <p style={{ color: "rgba(232,213,176,0.75)", fontSize: 13, textAlign: "center", lineHeight: 1.5 }}>
                    Necesitamos acceso a la cámara<br/>para escanear los QR
                  </p>
                  <button className="btn-primary" style={{ maxWidth: 240 }} onClick={iniciarCamara}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Activar cámara
                  </button>
                </>
              )}
              {camPermiso === "denegado" && (
                <>
                  <div style={{ fontSize: 40 }}>🚫</div>
                  <p style={{ color: "rgba(232,213,176,0.75)", fontSize: 13, textAlign: "center", lineHeight: 1.5 }}>
                    Acceso a cámara denegado.<br/>Usa el campo manual abajo.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Advertencia si no hay soporte de BarcodeDetector */}
        {camPermiso === "ok" && barcodeSupport === false && (
          <div className="no-support-box">
            <p style={{ fontSize: 13, color: "#92400e", lineHeight: 1.6, fontWeight: 500 }}>
              ⚠️ Tu navegador no soporta escaneo automático de QR. Usa <strong>Chrome en Android/PC</strong> para escaneo en tiempo real, o ingresa el token manualmente.
            </p>
          </div>
        )}

        {/* Detener cámara */}
        {camPermiso === "ok" && (
          <button className="btn-secondary" onClick={detenerCamara}>
            ⏹ Detener cámara
          </button>
        )}

        {/* Entrada manual */}
        <div className="manual-section">
          <span className="manual-label">Ingresar token manualmente</span>
          <div className="manual-row">
            <input
              className="manual-input"
              placeholder="Pegar URL o token del QR..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleManualSubmit(); }}
            />
            <button
              className="manual-btn"
              disabled={procesando || !manualInput.trim()}
              onClick={handleManualSubmit}
            >
              {procesando ? <span className="spinner" /> : "Verificar"}
            </button>
          </div>
          <p style={{ marginTop: 8, fontSize: 11, color: "var(--ink3)", lineHeight: 1.5 }}>
            Puedes pegar la URL completa de la invitación o solo el token.
          </p>
        </div>
      </div>

      {/* Hoja de resultado */}
      {resultado && (
        <div className="result-overlay" onClick={limpiarResultado}>
          <div className="result-sheet" onClick={(e) => e.stopPropagation()}>
            {resultado.status === "ok" && (
              <>
                <div className="result-icon ok">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="result-titulo">¡Bienvenido!</div>
                <div className="result-nombre">{resultado.invitado.nombre}</div>
                <div className="result-info-row">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M9 2C6.38 2 4.25 4.13 4.25 6.75c0 2.57 2.01 4.65 4.63 4.74A4.738 4.738 0 0 0 13.75 6.75C13.75 4.13 11.62 2 9 2Z" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M4.16 14.56c-2.58 1.72-2.58 4.52 0 6.23 2.93 1.95 7.73 1.95 10.66 0 2.58-1.72 2.58-4.52 0-6.23-2.92-1.94-7.72-1.94-10.66 0Z" stroke="#C9A96E" strokeWidth="1.5"/>
                  </svg>
                  <div>
                    <div className="result-info-label">Personas</div>
                    <div className="result-info-val">{resultado.invitado.num_personas} {resultado.invitado.num_personas === 1 ? "persona" : "personas"}</div>
                  </div>
                </div>
                {resultado.invitado.numero_confirmacion && (
                  <div className="result-info-row">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="7" width="20" height="10" rx="2" stroke="#C9A96E" strokeWidth="1.5"/>
                      <path d="M7 12h10" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <div>
                      <div className="result-info-label">Confirmación</div>
                      <div className="result-info-val">#{String(resultado.invitado.numero_confirmacion).padStart(3, "0")}</div>
                    </div>
                  </div>
                )}
                <div style={{ height: 12 }} />
                <button className="btn-primary" onClick={limpiarResultado}>Listo, seguir escaneando</button>
              </>
            )}

            {resultado.status === "ya_presente" && (
              <>
                <div className="result-icon warning">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M12 8v4M12 16.01l.01-.011" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                    <path d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10Z" stroke="white" strokeWidth="2.5"/>
                  </svg>
                </div>
                <div className="result-titulo">Ya registrado</div>
                <div className="result-nombre">{resultado.invitado.nombre}</div>
                {resultado.invitado.presente_hora && (
                  <div className="result-info-row">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10Z" stroke="#C9A96E" strokeWidth="1.5"/>
                      <path d="M15.71 15.18 12.61 13.3c-.54-.32-.98-1.09-.98-1.72V7.51" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <div>
                      <div className="result-info-label">Registrado a las</div>
                      <div className="result-info-val">{formatHora(resultado.invitado.presente_hora)}</div>
                    </div>
                  </div>
                )}
                <div style={{ height: 12 }} />
                <button className="btn-secondary" onClick={limpiarResultado}>Continuar</button>
              </>
            )}

            {resultado.status === "no_confirmado" && (
              <>
                <div className="result-icon error">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="result-titulo">Sin confirmación</div>
                <div className="result-nombre">{resultado.invitado.nombre}</div>
                <p style={{ textAlign: "center", fontSize: 13, color: "var(--ink2)", lineHeight: 1.6, marginBottom: 16 }}>
                  Este invitado <strong>no ha confirmado</strong> su asistencia.
                </p>
                <button className="btn-secondary" onClick={limpiarResultado}>Continuar</button>
              </>
            )}

            {resultado.status === "no_encontrado" && (
              <>
                <div className="result-icon error">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="result-titulo">No encontrado</div>
                <p style={{ textAlign: "center", fontSize: 13, color: "var(--ink2)", lineHeight: 1.6, marginBottom: 16 }}>
                  Este QR no corresponde a ningún invitado de este evento.
                </p>
                <button className="btn-secondary" onClick={limpiarResultado}>Continuar</button>
              </>
            )}

            {resultado.status === "error" && (
              <>
                <div className="result-icon error">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="result-titulo">Error</div>
                <p style={{ textAlign: "center", fontSize: 13, color: "var(--ink2)", lineHeight: 1.6, marginBottom: 16 }}>
                  {resultado.message}
                </p>
                <button className="btn-secondary" onClick={limpiarResultado}>Continuar</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
