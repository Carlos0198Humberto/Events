"use client";
/**
 * Sistema de Toast Notifications para Eventix.
 * Uso:
 *   import { toast } from "@/app/components/Toast";
 *   toast.success("¡Guardado correctamente!");
 *   toast.error("Algo falló");
 *   toast.info("Procesando...");
 *   toast.warning("Sin conexión");
 */

import { useEffect, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info" | "warning";

import type { ReactNode } from "react";

type ToastItem = {
  id: number;
  type: ToastType;
  message: string;
  leaving: boolean;
};

// ── Singleton event bus ───────────────────────────────────────────────────────
type ToastListener = (item: Omit<ToastItem, "id" | "leaving">) => void;
let _listeners: ToastListener[] = [];
let _idCounter = 0;

function emit(type: ToastType, message: string) {
  _listeners.forEach((fn) => fn({ type, message }));
}

export const toast = {
  success: (msg: string) => emit("success", msg),
  error: (msg: string) => emit("error", msg),
  info: (msg: string) => emit("info", msg),
  warning: (msg: string) => emit("warning", msg),
};

// ── Config per type ───────────────────────────────────────────────────────────
const TOAST_CONFIG: Record<ToastType, { bg: string; border: string; icon: ReactNode; color: string }> = {
  success: {
    bg: "rgba(16,24,14,0.97)",
    border: "rgba(34,197,94,0.35)",
    color: "#4ade80",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
    ),
  },
  error: {
    bg: "rgba(24,10,10,0.97)",
    border: "rgba(239,68,68,0.35)",
    color: "#f87171",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    ),
  },
  info: {
    bg: "rgba(10,16,24,0.97)",
    border: "rgba(96,165,250,0.35)",
    color: "#93c5fd",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
  warning: {
    bg: "rgba(24,18,8,0.97)",
    border: "rgba(251,191,36,0.35)",
    color: "#fbbf24",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
};

const DURATION = 3500;

// ── Component ─────────────────────────────────────────────────────────────────
export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((item: Omit<ToastItem, "id" | "leaving">) => {
    const id = ++_idCounter;
    setToasts((prev) => [...prev, { ...item, id, leaving: false }]);
    setTimeout(() => removeToast(id), DURATION);
  }, []);

  function removeToast(id: number) {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 380);
  }

  useEffect(() => {
    _listeners.push(addToast);
    return () => { _listeners = _listeners.filter((fn) => fn !== addToast); };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toastIn{from{opacity:0;transform:translateX(100%) scale(0.9)}to{opacity:1;transform:translateX(0) scale(1)}}
        @keyframes toastOut{from{opacity:1;transform:translateX(0) scale(1)}to{opacity:0;transform:translateX(110%) scale(0.9)}}
        .eventix-toast{
          display:flex;align-items:center;gap:11px;
          padding:12px 15px;border-radius:14px;
          border:1px solid;
          backdrop-filter:blur(20px);
          box-shadow:0 8px 32px rgba(0,0,0,0.35),0 2px 8px rgba(0,0,0,0.2);
          font-family:'DM Sans','system-ui',sans-serif;
          font-size:13px;font-weight:500;
          max-width:320px;min-width:200px;
          cursor:pointer;
        }
        .eventix-toast.entering{animation:toastIn .35s cubic-bezier(.22,1,.36,1) both}
        .eventix-toast.leaving{animation:toastOut .35s cubic-bezier(.22,1,.36,1) both}
        .toast-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:rgba(255,255,255,0.06)}
        .toast-progress{position:absolute;bottom:0;left:0;height:2px;border-radius:0 0 14px 14px;animation:toastProgress ${DURATION}ms linear both}
        @keyframes toastProgress{from{width:100%}to{width:0%}}
      `}</style>

      <div
        style={{
          position: "fixed",
          top: "env(safe-area-inset-top, 16px)",
          right: 16,
          zIndex: 999999,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => {
          const cfg = TOAST_CONFIG[t.type];
          return (
            <div
              key={t.id}
              className={`eventix-toast ${t.leaving ? "leaving" : "entering"}`}
              style={{
                background: cfg.bg,
                borderColor: cfg.border,
                color: "#F5EDD8",
                position: "relative",
                overflow: "hidden",
                pointerEvents: "all",
              }}
              onClick={() => removeToast(t.id)}
            >
              <div className="toast-icon">{cfg.icon}</div>
              <span style={{ lineHeight: 1.4 }}>{t.message}</span>
              <div className="toast-progress" style={{ background: cfg.color, opacity: 0.5 }} />
            </div>
          );
        })}
      </div>
    </>
  );
}
