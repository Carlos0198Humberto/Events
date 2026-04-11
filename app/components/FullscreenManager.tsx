"use client";
import { useEffect, useState } from "react";

// ── helpers ──────────────────────────────────────────────────────────────────
function detectOS(): "ios" | "android" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !(window as unknown as Record<string, unknown>)["MSStream"])
    return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

// ── component ─────────────────────────────────────────────────────────────────
export default function FullscreenManager() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Already running as installed PWA → nothing to do
    if (isStandalone()) return;

    const os = detectOS();

    if (os === "android") {
      // ① Scroll trick: hides the URL bar on most Android browsers immediately
      setTimeout(() => {
        if (window.scrollY === 0) window.scrollTo(0, 1);
      }, 400);

      // ② Fullscreen API on first user touch (requires user gesture)
      const tryFullscreen = () => {
        const el = document.documentElement;
        if (el.requestFullscreen) {
          el.requestFullscreen({ navigationUI: "hide" } as FullscreenOptions).catch(() => {
            // silently fail — browser may deny (e.g. Samsung Internet)
          });
        }
      };
      document.addEventListener("touchstart", tryFullscreen, { once: true, capture: true });
      return () => document.removeEventListener("touchstart", tryFullscreen, { capture: true });
    }

    if (os === "ios") {
      // Only show once per session (not every page navigation)
      if (sessionStorage.getItem("eventix_fs_dismissed")) return;
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  function dismiss() {
    setLeaving(true);
    sessionStorage.setItem("eventix_fs_dismissed", "1");
    setTimeout(() => setShowPrompt(false), 380);
  }

  if (!showPrompt) return null;

  return (
    <>
      <style>{`
        @keyframes fsSlideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fsSlideDown{from{transform:translateY(0);opacity:1}to{transform:translateY(100%);opacity:0}}
        .fs-sheet{
          position:fixed;bottom:0;left:0;right:0;z-index:99999;
          background:#1a1008;
          border-radius:22px 22px 0 0;
          padding:0 20px env(safe-area-inset-bottom,20px);
          box-shadow:0 -8px 48px rgba(0,0,0,0.55);
          animation:${leaving ? "fsSlideDown" : "fsSlideUp"} .38s cubic-bezier(.22,1,.36,1) both;
          font-family:'system-ui',sans-serif;
          max-width:480px;
          margin:0 auto;
        }
        .fs-drag{width:40px;height:4px;border-radius:2px;background:rgba(255,255,255,0.15);margin:14px auto 18px}
        .fs-row{display:flex;align-items:center;gap:14px;margin-bottom:14px}
        .fs-icon-wrap{width:48px;height:48px;border-radius:13px;background:rgba(201,169,110,0.12);border:1px solid rgba(201,169,110,0.25);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .fs-title{font-size:16px;font-weight:700;color:#F5EDD8;line-height:1.2;margin-bottom:3px}
        .fs-sub{font-size:12px;color:rgba(201,169,110,0.65);line-height:1.4}
        .fs-steps{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:14px 16px;margin-bottom:16px}
        .fs-step{display:flex;align-items:flex-start;gap:12px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
        .fs-step:last-child{border-bottom:none;padding-bottom:0}
        .fs-step:first-child{padding-top:0}
        .fs-step-num{width:24px;height:24px;border-radius:50%;background:rgba(201,169,110,0.15);border:1px solid rgba(201,169,110,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:700;color:rgba(201,169,110,0.85)}
        .fs-step-text{font-size:13px;color:rgba(232,213,176,0.8);line-height:1.5;padding-top:3px}
        .fs-step-text b{color:#F5EDD8;font-weight:600}
        .fs-btn-dismiss{width:100%;background:transparent;border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:13px;font-size:13px;font-weight:500;color:rgba(255,255,255,0.45);cursor:pointer;margin-bottom:8px}
      `}</style>

      {/* Backdrop tap to close */}
      <div
        onClick={dismiss}
        style={{
          position: "fixed", inset: 0, zIndex: 99998,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(4px)",
        }}
      />

      <div className="fs-sheet" role="dialog" aria-label="Ver en pantalla completa">
        <div className="fs-drag" />

        <div className="fs-row">
          <div className="fs-icon-wrap">
            {/* Expand/fullscreen icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(201,169,110,0.9)" strokeWidth="1.8" strokeLinecap="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3"/>
              <path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
              <path d="M3 16v3a2 2 0 0 0 2 2h3"/>
              <path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
            </svg>
          </div>
          <div>
            <div className="fs-title">Ver en pantalla completa</div>
            <div className="fs-sub">Sin barra de navegación ni URL</div>
          </div>
        </div>

        <div className="fs-steps">
          <div className="fs-step">
            <div className="fs-step-num">1</div>
            <div className="fs-step-text">
              Toca el ícono de <b>Compartir</b>{" "}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(201,169,110,0.75)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline", verticalAlign:"middle", marginBottom:1 }}>
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>{" "}
              en la barra inferior de Safari
            </div>
          </div>
          <div className="fs-step">
            <div className="fs-step-num">2</div>
            <div className="fs-step-text">
              Selecciona <b>"Agregar a pantalla de inicio"</b>
            </div>
          </div>
          <div className="fs-step">
            <div className="fs-step-num">3</div>
            <div className="fs-step-text">
              Abre Eventix desde tu pantalla de inicio — se verá sin ninguna barra
            </div>
          </div>
        </div>

        <button className="fs-btn-dismiss" onClick={dismiss}>
          Ahora no
        </button>
      </div>
    </>
  );
}
