"use client";
import { useEffect, useRef, useState } from "react";

type ScanResult = {
  token: string;
  nombre: string;
  estado: string;
  num_personas: number;
};

type Props = {
  onClose: () => void;
  onCheckin: (token: string) => Promise<ScanResult | null>;
};

export default function QRScanner({ onClose, onCheckin }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const lastScanRef = useRef<string>("");

  const [status, setStatus] = useState<"scanning" | "loading" | "success" | "error" | "already">("scanning");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [camError, setCamError] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stop();
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        videoRef.current.onloadedmetadata = () => scanLoop();
      }
    } catch {
      setCamError(true);
    }
  }

  function stop() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }

  function scanLoop() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    import("jsqr").then(({ default: jsQR }) => {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code && code.data && code.data !== lastScanRef.current) {
        lastScanRef.current = code.data;
        handleScan(code.data);
        return;
      }
      rafRef.current = requestAnimationFrame(scanLoop);
    });
  }

  async function handleScan(raw: string) {
    // Extract token from URL or raw token
    let token = raw;
    try {
      const url = new URL(raw);
      const parts = url.pathname.split("/");
      token = parts[parts.length - 1] || raw;
    } catch { /* not a URL, use raw */ }

    setStatus("loading");
    stop();

    const res = await onCheckin(token);
    if (!res) {
      setStatus("error");
      return;
    }
    if (res.estado === "checkin") {
      setStatus("already");
    } else {
      setStatus("success");
    }
    setResult(res);
  }

  function close() {
    setLeaving(true);
    stop();
    setTimeout(onClose, 340);
  }

  function scanAgain() {
    lastScanRef.current = "";
    setStatus("scanning");
    setResult(null);
    startCamera();
  }

  return (
    <>
      <style>{`
        @keyframes qrFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes qrSlideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
        @keyframes qrSlideDown{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(40px)}}
        @keyframes qrSuccessPop{0%{transform:scale(0)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
        @keyframes qrScan{0%{top:0}50%{top:calc(100% - 3px)}100%{top:0}}
        .qr-overlay{position:fixed;inset:0;z-index:9995;background:rgba(10,8,4,0.94);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:env(safe-area-inset-top,20px) 24px env(safe-area-inset-bottom,24px);animation:qrFadeIn .25s ease}
        .qr-sheet{width:100%;max-width:400px;animation:${leaving?"qrSlideDown":"qrSlideUp"} .34s cubic-bezier(.22,1,.36,1) both}
        .qr-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
        .qr-topbar-title{font-family:'Cormorant Garamond',serif;font-size:22px;font-style:italic;color:#F8FAFC}
        .qr-close-btn{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.08);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.6)}
        .qr-viewport{position:relative;width:100%;aspect-ratio:1;border-radius:20px;overflow:hidden;background:#000;margin-bottom:18px}
        .qr-video{width:100%;height:100%;object-fit:cover;display:block}
        .qr-frame{position:absolute;inset:14%;border-radius:12px;border:2.5px solid rgba(124,58,237,0.8);box-shadow:0 0 0 9999px rgba(0,0,0,0.45)}
        .qr-scanline{position:absolute;left:14%;right:14%;height:3px;background:linear-gradient(90deg,transparent,rgba(124,58,237,0.9),transparent);border-radius:2px;animation:qrScan 2s ease-in-out infinite}
        .qr-corner{position:absolute;width:24px;height:24px;border-color:var(--gold,#7C3AED);border-style:solid}
        .qr-corner-tl{top:14%;left:14%;border-width:3px 0 0 3px;border-radius:6px 0 0 0}
        .qr-corner-tr{top:14%;right:14%;border-width:3px 3px 0 0;border-radius:0 6px 0 0}
        .qr-corner-bl{bottom:14%;left:14%;border-width:0 0 3px 3px;border-radius:0 0 0 6px}
        .qr-corner-br{bottom:14%;right:14%;border-width:0 3px 3px 0;border-radius:0 0 6px 0}
        .qr-hint{font-size:12px;color:rgba(124,58,237,0.65);text-align:center;letter-spacing:.3px}
        .qr-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:40px 0}
        .qr-spinner{width:40px;height:40px;border-radius:50%;border:3px solid rgba(124,58,237,0.2);border-top-color:#7C3AED;animation:spin .75s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .qr-result{background:rgba(255,255,255,0.05);border-radius:18px;padding:24px;text-align:center}
        .qr-result-ico{width:72px;height:72px;border-radius:50%;margin:0 auto 18px;display:flex;align-items:center;justify-content:center;animation:qrSuccessPop .5s cubic-bezier(.22,1,.36,1) both}
        .qr-result-name{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:600;color:#F8FAFC;margin-bottom:4px}
        .qr-result-sub{font-size:12px;color:rgba(124,58,237,0.65);margin-bottom:20px}
        .qr-result-personas{display:inline-flex;align-items:center;gap:7px;background:rgba(124,58,237,0.12);border:1px solid rgba(124,58,237,0.25);border-radius:99px;padding:6px 14px;font-size:12px;font-weight:600;color:rgba(124,58,237,0.8);margin-bottom:20px}
        .qr-btn-next{width:100%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:14px;font-size:13px;font-weight:600;color:rgba(255,255,255,0.7);cursor:pointer;font-family:inherit}
        .qr-btn-next:hover{background:rgba(255,255,255,0.12)}
      `}</style>

      <div className="qr-overlay" onClick={(e) => e.target === e.currentTarget && close()}>
        <div className="qr-sheet">
          <div className="qr-topbar">
            <div className="qr-topbar-title">Check-in QR</div>
            <button className="qr-close-btn" onClick={close}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {status === "scanning" && (
            <>
              <div className="qr-viewport">
                {camError ? (
                  <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:12,color:"rgba(124,58,237,0.7)",fontSize:13,textAlign:"center",padding:20 }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    <span>Activa el permiso de cámara para usar el escáner</span>
                  </div>
                ) : (
                  <>
                    <video ref={videoRef} className="qr-video" muted playsInline />
                    <canvas ref={canvasRef} style={{ display:"none" }} />
                    <div className="qr-frame" />
                    <div className="qr-scanline" />
                    <div className="qr-corner qr-corner-tl" />
                    <div className="qr-corner qr-corner-tr" />
                    <div className="qr-corner qr-corner-bl" />
                    <div className="qr-corner qr-corner-br" />
                  </>
                )}
              </div>
              <p className="qr-hint">Apunta la cámara al código QR del invitado</p>
            </>
          )}

          {status === "loading" && (
            <div className="qr-loading">
              <div className="qr-spinner" />
              <span style={{ fontSize:13, color:"rgba(124,58,237,0.65)" }}>Verificando invitado...</span>
            </div>
          )}

          {(status === "success" || status === "already" || status === "error") && (
            <div className="qr-result">
              {status === "success" && (
                <>
                  <div className="qr-result-ico" style={{ background:"rgba(34,197,94,0.15)",border:"1.5px solid rgba(34,197,94,0.4)" }}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                  </div>
                  <div className="qr-result-name">{result?.nombre}</div>
                  <div className="qr-result-sub">Check-in registrado</div>
                  <div className="qr-result-personas">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
                    {result?.num_personas} {result?.num_personas === 1 ? "persona" : "personas"}
                  </div>
                </>
              )}
              {status === "already" && (
                <>
                  <div className="qr-result-ico" style={{ background:"rgba(234,179,8,0.15)",border:"1.5px solid rgba(234,179,8,0.4)" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </div>
                  <div className="qr-result-name">{result?.nombre}</div>
                  <div className="qr-result-sub" style={{ color:"rgba(234,179,8,0.7)" }}>Ya hizo check-in</div>
                </>
              )}
              {status === "error" && (
                <>
                  <div className="qr-result-ico" style={{ background:"rgba(239,68,68,0.12)",border:"1.5px solid rgba(239,68,68,0.3)" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </div>
                  <div className="qr-result-name" style={{ fontSize:20, color:"rgba(239,68,68,0.8)" }}>QR no válido</div>
                  <div className="qr-result-sub" style={{ color:"rgba(239,68,68,0.6)" }}>Código no encontrado en el sistema</div>
                </>
              )}
              <button className="qr-btn-next" onClick={scanAgain}>
                Escanear siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
