"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Invitado = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  estado: string;
  num_personas: number;
  token: string;
  numero_confirmacion?: number | null;
  foto_url?: string | null;
  deseo?: string | null;
  evento_id: string;
  nombres_personas?: string | null;
  orden?: number; // número de orden basado en created_at
};

type Evento = {
  id: string;
  nombre: string;
  tipo: string;
  anfitriones: string;
  frase_evento?: string | null;
  mensaje_invitacion?: string | null;
  fecha?: string;
  hora?: string;
  lugar?: string;
  maps_url?: string | null;
  como_llegar?: string | null;
  imagen_url?: string | null;
  foto_lugar_url?: string | null;
  foto_lugar_2_url?: string | null;
  foto_lugar_3_url?: string | null;
  musica_url?: string | null;
  musica_nombre?: string | null;
  cupo_personas?: number | null;
  fecha_limite_confirmacion?: string | null;
  organizador_telefono?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TIPO_LABEL: Record<string, string> = {
  quinceañera: "Quinceañera",
  boda: "Boda",
  graduacion: "Graduación",
  cumpleaños: "Cumpleaños",
  otro: "Evento especial",
};
const TIPO_ORNAMENTO: Record<string, string> = {
  quinceañera: "👑",
  boda: "💍",
  graduacion: "🎓",
  cumpleaños: "🎂",
  otro: "✨",
};

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function formatFechaCorta(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function formatHora(hora: string) {
  const [h, m] = hora.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function abrirGoogleCalendar(evento: Evento) {
  const titulo = encodeURIComponent(evento.nombre);
  const lugar = encodeURIComponent(evento.lugar || "");
  const desc = encodeURIComponent(
    `${TIPO_LABEL[evento.tipo] || "Evento"} de ${evento.anfitriones}`,
  );
  let fechaInicio = "",
    fechaFin = "";
  if (evento.fecha) {
    const [y, m, d] = evento.fecha.split("T")[0].split("-");
    if (evento.hora) {
      const [h, min] = evento.hora.replace(".", ":").split(":");
      const hPad = String(parseInt(h)).padStart(2, "0");
      const mPad = String(parseInt(min || "0")).padStart(2, "0");
      const hFin = String(parseInt(hPad) + 2).padStart(2, "0");
      fechaInicio = `${y}${m}${d}T${hPad}${mPad}00`;
      fechaFin = `${y}${m}${d}T${hFin}${mPad}00`;
    } else {
      fechaInicio = `${y}${m}${d}`;
      fechaFin = `${y}${m}${d}`;
    }
  }
  window.open(
    `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titulo}&dates=${fechaInicio}/${fechaFin}&details=${desc}&location=${lugar}`,
    "_blank",
  );
}

function crearParticulas() {
  const colores = [
    "#C9A96E",
    "#E8D5B0",
    "#ffffff",
    "#f472b6",
    "#fbbf24",
    "#ddd6fe",
  ];
  return Array.from({ length: 80 }, () => ({
    x: window.innerWidth / 2 + (Math.random() - 0.5) * 300,
    y: window.innerHeight / 2 + (Math.random() - 0.5) * 150,
    color: colores[Math.floor(Math.random() * colores.length)],
    vx: (Math.random() - 0.5) * 14,
    vy: Math.random() * -16 - 5,
    size: Math.random() * 12 + 4,
    rotation: Math.random() * 360,
  }));
}

// ─── AppLogo ──────────────────────────────────────────────────────────────────
function AppLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="logo-bg"
          x1="0"
          y1="0"
          x2="64"
          y2="64"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#1a1209" />
          <stop offset="100%" stopColor="#2d1f0a" />
        </linearGradient>
        <linearGradient
          id="logo-glow"
          x1="12"
          y1="20"
          x2="52"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#C9A96E" />
          <stop offset="100%" stopColor="#E8D5B0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#logo-bg)" />
      <rect
        x="2.5"
        y="2.5"
        width="59"
        height="59"
        rx="16"
        fill="none"
        stroke="rgba(201,169,110,0.3)"
        strokeWidth="1.5"
      />
      <path
        d="M18 17 L30 32 L18 47"
        stroke="url(#logo-glow)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M46 17 L34 32 L46 47"
        stroke="rgba(201,169,110,0.45)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="32" cy="32" r="4" fill="#C9A96E" opacity="0.95" />
    </svg>
  );
}

// ─── Iconos SVG ───────────────────────────────────────────────────────────────
const IcoFecha = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M8 2v3M16 2v3M3.5 9.09h17M21 8.5V17c0 3-1.5 5-5 5H8c-3.5 0-5-2-5-5V8.5c0-3 1.5-5 5-5h8c3.5 0 5 2 5 5Z"
      stroke="#C9A96E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11.995 13.7h.01M8.294 13.7h.01M8.294 16.7h.01"
      stroke="#C9A96E"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.695 13.7h.01M15.695 16.7h.01M11.995 16.7h.01"
      stroke="#C9A96E"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IcoHora = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10Z"
      stroke="#C9A96E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.71 15.18 12.61 13.3c-.54-.32-.98-1.09-.98-1.72V7.51"
      stroke="#C9A96E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IcoLugar = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 13.43a3.12 3.12 0 1 0 0-6.24 3.12 3.12 0 0 0 0 6.24Z"
      stroke="#C9A96E"
      strokeWidth="1.5"
    />
    <path
      d="M3.62 8.49c1.97-8.66 14.8-8.65 16.76.01 1.15 5.08-2.01 9.38-4.78 12.04a5.193 5.193 0 0 1-7.21 0c-2.76-2.66-5.92-6.97-4.77-12.05Z"
      stroke="#C9A96E"
      strokeWidth="1.5"
    />
  </svg>
);
const IcoMusica = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M2 9.17v9.71c0 1.18.85 1.65 1.9 1.05l2.74-1.58c.36-.21.96-.23 1.34-.04l6.08 3.04c.38.19.98.17 1.34-.04l5.8-3.34c.38-.22.7-.76.7-1.2V7.06c0-1.18-.85-1.65-1.9-1.05l-2.74 1.58c-.36.21-.96.23-1.34.04L9.94 4.59c-.38-.19-.98-.17-1.34.04L2.7 7.97c-.38.22-.7.76-.7 1.2Z"
      stroke="#C9A96E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 5v14M15 7.5V21"
      stroke="#C9A96E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IcoDeadline = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10Z"
      stroke="#b45309"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 8v5M12 16.01l.01-.011"
      stroke="#b45309"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IcoPersonas = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M9 2C6.38 2 4.25 4.13 4.25 6.75c0 2.57 2.01 4.65 4.63 4.74.08-.01.16-.01.22 0h.07A4.738 4.738 0 0 0 13.75 6.75C13.75 4.13 11.62 2 9 2Z"
      stroke="#C9A96E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.41 4c2.07 0 3.74 1.68 3.74 3.75 0 2.02-1.6 3.66-3.6 3.74-.07-.01-.14-.01-.21 0"
      stroke="#C9A96E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.16 14.56c-2.58 1.72-2.58 4.52 0 6.23 2.93 1.95 7.73 1.95 10.66 0 2.58-1.72 2.58-4.52 0-6.23-2.92-1.94-7.72-1.94-10.66 0Z"
      stroke="#C9A96E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.34 14c.77.16 1.49.48 2.07.96 1.63 1.3 1.63 3.43 0 4.73-.57.46-1.27.78-2.02.95"
      stroke="#C9A96E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IcoCalendario = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M8 2v3M16 2v3M3.5 9.09h17M21 8.5V17c0 3-1.5 5-5 5H8c-3.5 0-5-2-5-5V8.5c0-3 1.5-5 5-5h8c3.5 0 5 2 5 5Z"
      stroke="#C9A96E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.695 13.7h.01M15.695 16.7h.01M11.995 13.7h.01M11.995 16.7h.01M8.294 13.7h.01M8.294 16.7h.01"
      stroke="#C9A96E"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IcoCamera = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M6.76 22h10.48c3 0 4.21-1.74 4.36-3.86l.65-10.14C22.4 5.7 20.54 4 18.25 4c-.61 0-1.17-.35-1.45-.89l-.72-1.45C15.63.96 14.52.5 13.45.5h-2.89C9.48.5 8.38.96 7.92 1.66L7.2 3.11C6.92 3.65 6.36 4 5.75 4 3.46 4 1.6 5.7 1.75 8L2.4 18.14C2.54 20.26 3.76 22 6.76 22Z"
      stroke="#C9A96E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.5 8h3M12 18c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4Z"
      stroke="#C9A96E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IcoCorazon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M12.62 20.81c-.34.12-.9.12-1.24 0C8.48 19.82 2 15.69 2 8.69 2 5.6 4.49 3.1 7.56 3.1c1.82 0 3.43.88 4.44 2.24a5.53 5.53 0 0 1 4.44-2.24C19.51 3.1 22 5.6 22 8.69c0 7-6.48 11.13-9.38 12.12Z"
      stroke="#C9A96E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IcoWhatsapp = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);
const IcoDescargar = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);
const IcoImages = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#C9A96E"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const IcoPlus = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IcoX = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IcoChevronLeft = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IcoChevronRight = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IcoSalir = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const IcoCheck = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ─── Ornamento decorativo ─────────────────────────────────────────────────────
function OrnamentoDivider({ tipo }: { tipo: string }) {
  if (tipo === "boda") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          margin: "4px 0",
        }}
      >
        <svg width="60" height="14" viewBox="0 0 60 14" fill="none">
          <path
            d="M0 7 Q15 0 30 7 Q45 14 60 7"
            stroke="#C9A96E"
            strokeWidth="1"
            fill="none"
            opacity="0.6"
          />
          <circle cx="0" cy="7" r="1.5" fill="#C9A96E" opacity="0.5" />
          <circle cx="60" cy="7" r="1.5" fill="#C9A96E" opacity="0.5" />
        </svg>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 1 L9.5 6.5 L15 6.5 L10.5 10 L12 15 L8 11.5 L4 15 L5.5 10 L1 6.5 L6.5 6.5 Z"
            fill="#C9A96E"
            opacity="0.7"
          />
        </svg>
        <svg width="60" height="14" viewBox="0 0 60 14" fill="none">
          <path
            d="M0 7 Q15 14 30 7 Q45 0 60 7"
            stroke="#C9A96E"
            strokeWidth="1"
            fill="none"
            opacity="0.6"
          />
          <circle cx="0" cy="7" r="1.5" fill="#C9A96E" opacity="0.5" />
          <circle cx="60" cy="7" r="1.5" fill="#C9A96E" opacity="0.5" />
        </svg>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          flex: 1,
          height: 1,
          background:
            "linear-gradient(to right, transparent, rgba(201,169,110,0.4))",
        }}
      />
      <svg width="8" height="8" viewBox="0 0 8 8" fill="#C9A96E" opacity="0.6">
        <rect x="2" y="0" width="4" height="4" transform="rotate(45 4 4)" />
      </svg>
      <div
        style={{
          flex: 1,
          height: 1,
          background:
            "linear-gradient(to left, transparent, rgba(201,169,110,0.4))",
        }}
      />
    </div>
  );
}

// ─── MusicPlayer ──────────────────────────────────────────────────────────────
function MusicPlayer({ url, nombre }: { url: string; nombre?: string | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const tryPlay = () => {
      a.play()
        .then(() => setPlaying(true))
        .catch(() => {});
    };
    tryPlay();
    document.addEventListener("click", tryPlay, { once: true });
    return () => {
      a.pause();
      document.removeEventListener("click", tryPlay);
    };
  }, [url]);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play()
        .then(() => setPlaying(true))
        .catch(() => {});
    }
  }

  return (
    <div className="music-player" onClick={toggle}>
      <audio ref={audioRef} src={url} loop />
      <div className="music-icon-wrap">
        {playing ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#C9A96E">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#C9A96E">
            <path d="M5 3l14 9-14 9V3z" />
          </svg>
        )}
      </div>
      <div className="music-info">
        <span className="music-label">Canción del evento</span>
        <span className="music-name">{nombre || "Música especial"}</span>
      </div>
      {playing && (
        <div className="music-waves">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`mw mw-${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── GaleriaLugar ─────────────────────────────────────────────────────────────
function GaleriaLugar({ fotos, lugar }: { fotos: string[]; lugar?: string }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [indice, setIndice] = useState(0);
  const validas = fotos.filter(Boolean);
  if (validas.length === 0) return null;
  const prev = () =>
    setIndice((i) => (i - 1 + validas.length) % validas.length);
  const next = () => setIndice((i) => (i + 1) % validas.length);

  return (
    <>
      <div>
        <div className="foto-lugar-label">📍 {lugar || "El lugar"}</div>
        <div className="galeria-thumbs">
          {validas.slice(0, 3).map((src, i) => (
            <div
              key={i}
              className="galeria-thumb"
              onClick={() => {
                setIndice(i);
                setModalOpen(true);
              }}
            >
              <img src={src} alt={`Foto ${i + 1}`} />
              {i === 2 && validas.length > 3 && (
                <div className="galeria-thumb-more">+{validas.length - 3}</div>
              )}
            </div>
          ))}
        </div>
        <button
          className="btn-ver-fotos"
          onClick={() => {
            setIndice(0);
            setModalOpen(true);
          }}
        >
          <IcoImages /> Ver{" "}
          {validas.length === 1
            ? "la foto del lugar"
            : `todas las fotos (${validas.length})`}
        </button>
      </div>
      {modalOpen && (
        <div
          className="lightbox-overlay"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="lightbox-inner">
            <button
              className="lightbox-close"
              onClick={() => setModalOpen(false)}
            >
              <IcoX />
            </button>
            <div className="lightbox-img-wrap">
              <img
                src={validas[indice]}
                alt={`Foto ${indice + 1}`}
                className="lightbox-img"
              />
            </div>
            {validas.length > 1 && (
              <>
                <button className="lightbox-nav lightbox-prev" onClick={prev}>
                  <IcoChevronLeft />
                </button>
                <button className="lightbox-nav lightbox-next" onClick={next}>
                  <IcoChevronRight />
                </button>
                <div className="lightbox-dots">
                  {validas.map((_, i) => (
                    <div
                      key={i}
                      className={`lightbox-dot${i === indice ? " active" : ""}`}
                      onClick={() => setIndice(i)}
                    />
                  ))}
                </div>
              </>
            )}
            {lugar && <div className="lightbox-caption">📍 {lugar}</div>}
          </div>
        </div>
      )}
    </>
  );
}

// ─── SubirFotosInvitado ───────────────────────────────────────────────────────
function SubirFotosInvitado({
  invitadoId,
  eventoId,
  token,
  onFotoSubida,
}: {
  invitadoId: string;
  eventoId: string;
  token: string;
  onFotoSubida?: () => void;
}) {
  const [fotos, setFotos] = useState<string[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [cargado, setCargado] = useState(false);
  const [expandido, setExpandido] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const MAX = 5;

  useEffect(() => {
    cargarFotos();
  }, []);

  async function cargarFotos() {
    const { data } = await supabase
      .from("fotos_muro")
      .select("foto_url")
      .eq("invitado_id", invitadoId)
      .order("created_at", { ascending: true });
    if (data) setFotos(data.map((f) => f.foto_url).filter(Boolean));
    setCargado(true);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const seleccionadas = files.slice(0, MAX - fotos.length);
    setSubiendo(true);
    for (const file of seleccionadas) {
      const ext = file.name.split(".").pop();
      const path = `muro/${eventoId}/${invitadoId}_${Date.now()}.${ext}`;
      const { data: up, error } = await supabase.storage
        .from("eventix")
        .upload(path, file, { upsert: false });
      if (!error && up) {
        const { data: urlData } = supabase.storage
          .from("eventix")
          .getPublicUrl(up.path);
        const url = urlData?.publicUrl;
        if (url) {
          await supabase
            .from("fotos_muro")
            .insert({
              evento_id: eventoId,
              invitado_id: invitadoId,
              token_invitado: token,
              foto_url: url,
            });
          setFotos((prev) => [...prev, url]);
          onFotoSubida?.();
        }
      }
    }
    setSubiendo(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  if (!cargado) return null;

  return (
    <div className="fotos-inv-wrap">
      <div
        className="fotos-inv-header"
        onClick={() => setExpandido(!expandido)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="btn-accion-ico">
            <IcoCamera />
          </div>
          <div>
            <div
              style={{ fontSize: 13, fontWeight: 600, color: "var(--ink2)" }}
            >
              Mis fotos del evento
            </div>
            <div style={{ fontSize: 11, color: "var(--ink3)" }}>
              {fotos.length}/{MAX} fotos · toca para{" "}
              {expandido ? "cerrar" : "abrir"}
            </div>
          </div>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--ink3)"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <polyline points={expandido ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
        </svg>
      </div>
      {expandido && (
        <div className="fotos-inv-body">
          {fotos.length > 0 && (
            <div className="fotos-inv-grid">
              {fotos.map((src, i) => (
                <div key={i} className="fotos-inv-thumb">
                  <img src={src} alt={`Foto ${i + 1}`} />
                </div>
              ))}
            </div>
          )}
          {fotos.length < MAX ? (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={handleFile}
              />
              <button
                className="btn-subir-foto"
                onClick={() => fileRef.current?.click()}
                disabled={subiendo}
              >
                {subiendo ? (
                  <>
                    <div className="spinner" /> Subiendo...
                  </>
                ) : (
                  <>
                    <IcoPlus /> Agregar foto
                  </>
                )}
              </button>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--ink3)",
                  textAlign: "center",
                }}
              >
                Puedes subir hasta {MAX} fotos · quedan {MAX - fotos.length}{" "}
                disponibles
              </p>
            </>
          ) : (
            <p
              style={{
                fontSize: 12,
                color: "var(--ink3)",
                textAlign: "center",
                padding: "8px 0",
              }}
            >
              ✓ Ya subiste el máximo de {MAX} fotos
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── DejarDeseo ───────────────────────────────────────────────────────────────
function DejarDeseo({
  invitadoId,
  eventoId,
  invNombre,
  onDeseoGuardado,
}: {
  invitadoId: string;
  eventoId: string;
  invNombre: string;
  onDeseoGuardado?: () => void;
}) {
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [expandido, setExpandido] = useState(false);

  useEffect(() => {
    supabase
      .from("deseos")
      .select("id")
      .eq("invitado_id", invitadoId)
      .then(({ data }) => {
        if (data && data.length > 0) setEnviado(true);
      });
  }, [invitadoId]);

  async function publicar() {
    if (!mensaje.trim()) return;
    setEnviando(true);
    await supabase.from("deseos").insert({
      evento_id: eventoId,
      invitado_id: invitadoId,
      nombre_autor: invNombre || "Anónimo",
      mensaje: mensaje.trim(),
      emoji_sticker: "💌",
      color_fondo: "#e8f8f5",
      aprobado: true,
    });
    setEnviado(true);
    setEnviando(false);
    setExpandido(false);
    onDeseoGuardado?.();
  }

  return (
    <div className="fotos-inv-wrap">
      <div
        className="fotos-inv-header"
        onClick={() => !enviado && setExpandido(!expandido)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="btn-accion-ico">
            <IcoCorazon />
          </div>
          <div>
            <div
              style={{ fontSize: 13, fontWeight: 600, color: "var(--ink2)" }}
            >
              {enviado ? "Deseo enviado ✓" : "Dejar mi deseo"}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink3)" }}>
              {enviado
                ? "Tu mensaje ya está en el muro"
                : "Escribe un mensaje especial · opcional"}
            </div>
          </div>
        </div>
        {!enviado && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--ink3)"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <polyline
              points={expandido ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}
            />
          </svg>
        )}
        {enviado && <span style={{ fontSize: 18 }}>💌</span>}
      </div>
      {expandido && !enviado && (
        <div className="fotos-inv-body">
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Escribe tu deseo, dedicatoria o mensaje especial..."
            maxLength={280}
            rows={3}
            style={{
              width: "100%",
              border: "1.5px solid rgba(201,169,110,0.4)",
              borderRadius: 12,
              padding: "11px 13px",
              fontSize: 14,
              outline: "none",
              fontFamily: "'Jost',sans-serif",
              boxSizing: "border-box",
              background: "var(--cream)",
              resize: "none",
              lineHeight: 1.6,
              color: "var(--ink)",
            }}
          />
          <p
            style={{
              fontSize: 11,
              color: "var(--ink3)",
              textAlign: "right",
              marginTop: 3,
            }}
          >
            {mensaje.length}/280
          </p>
          <button
            className="btn-subir-foto"
            onClick={publicar}
            disabled={enviando || !mensaje.trim()}
            style={{ opacity: mensaje.trim() ? 1 : 0.5 }}
          >
            {enviando ? (
              <>
                <div className="spinner" /> Enviando...
              </>
            ) : (
              <>💌 Publicar deseo</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function ConfirmarPage() {
  const params = useParams();
  const token = params.token as string;

  const [invitado, setInvitado] = useState<Invitado | null>(null);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<
    "vista" | "form" | "confirmado" | "rechazado" | "muro"
  >("vista");
  const [numPersonas, setNumPersonas] = useState(1);
  const [confirmando, setConfirmando] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [destroying, setDestroying] = useState(false);
  const [fotoSubida, setFotoSubida] = useState(false);
  const [deseoGuardado, setDeseoGuardado] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    document.title = "Eventix — Tu invitación";
    setTimeout(() => setMounted(true), 80);
    cargarDatos();
  }, []);

  async function cargarDatos() {
    const { data: inv } = await supabase
      .from("invitados")
      .select("*")
      .eq("token", token)
      .single();
    if (!inv) {
      setLoading(false);
      return;
    }

    // Calcular orden basado en created_at dentro del mismo evento
    const { data: todos } = await supabase
      .from("invitados")
      .select("id,created_at")
      .eq("evento_id", inv.evento_id)
      .order("created_at", { ascending: true });
    const orden = todos ? todos.findIndex((i) => i.id === inv.id) + 1 : 1;

    const { data: ev } = await supabase
      .from("eventos")
      .select("*")
      .eq("id", inv.evento_id)
      .single();
    setInvitado({ ...inv, orden });
    if (ev) setEvento(ev);
    setNumPersonas(inv.num_personas || 1);

    // Si ya confirmó o rechazó → ir directo al paso correspondiente
    if (inv.estado === "confirmado") setStep("confirmado");
    if (inv.estado === "rechazado") setStep("rechazado");
    setLoading(false);
  }

  async function confirmarAsistencia() {
    if (!invitado) return;
    setConfirmando(true);
    const { data: lastConf } = await supabase
      .from("invitados")
      .select("numero_confirmacion")
      .eq("evento_id", invitado.evento_id)
      .eq("estado", "confirmado")
      .order("numero_confirmacion", { ascending: false })
      .limit(1);
    const siguiente = lastConf?.[0]?.numero_confirmacion
      ? lastConf[0].numero_confirmacion + 1
      : 1;
    const { data: updated } = await supabase
      .from("invitados")
      .update({
        estado: "confirmado",
        num_personas: numPersonas,
        numero_confirmacion: siguiente,
      })
      .eq("id", invitado.id)
      .select()
      .single();
    if (updated) setInvitado((prev) => (prev ? { ...prev, ...updated } : prev));
    setConfirmando(false);
    setStep("confirmado");
  }

  async function rechazarAsistencia() {
    if (!invitado) return;
    await supabase
      .from("invitados")
      .update({ estado: "rechazado" })
      .eq("id", invitado.id);
    setStep("rechazado");
  }

  async function handleConfirmarClick() {
    if (!invitado) return;
    if ((invitado.num_personas || 1) === 1) await confirmarAsistencia();
    else setStep("form");
  }

  // Ir al muro — SOLO vista del muro, sin dashboard
  function irAlMuro() {
    if (!invitado) return;
    window.location.href = `/muro/${invitado.evento_id}?token=${invitado.token}`;
  }

  // Salir completamente
  function salir() {
    setDestroying(true);
    const canvas = canvasRef.current;
    if (!canvas) {
      redirigirSalida();
      return;
    }
    canvas.style.display = "block";
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      redirigirSalida();
      return;
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let particulas = crearParticulas();
    let frame = 0;
    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      particulas.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.5;
        p.rotation += 6;
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.fillStyle = p.color;
        ctx!.globalAlpha = Math.max(0, 1 - frame / 80);
        ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx!.restore();
      });
      frame++;
      if (frame < 80) animRef.current = requestAnimationFrame(animate);
      else {
        cancelAnimationFrame(animRef.current);
        redirigirSalida();
      }
    }
    animate();
  }

  function redirigirSalida() {
    window.close();
    setTimeout(() => {
      window.location.href = "whatsapp://";
    }, 300);
  }

  const nombresEnTarjeta: string[] = (() => {
    if (invitado?.nombres_personas) {
      try {
        const p = JSON.parse(invitado.nombres_personas);
        if (Array.isArray(p) && p.length > 1) return p;
      } catch {}
    }
    return invitado ? [invitado.nombre] : [];
  })();

  const fotosLugar = evento
    ? ([
        evento.foto_lugar_url,
        evento.foto_lugar_2_url,
        evento.foto_lugar_3_url,
      ].filter(Boolean) as string[])
    : [];

  // ─── ESTILOS ───────────────────────────────────────────────────────────────
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Jost:wght@300;400;500;600;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{font-family:'Jost',sans-serif;-webkit-font-smoothing:antialiased;background:#FAF6F0;color:#1a1209}
    :root{
      --gold:#C9A96E;--gold-dark:#8B6914;--gold-light:#E8D5B0;--gold-pale:#F5EDD8;
      --dark:#1a1209;--dark2:#2d1f0a;--ink:#3d2b0f;--ink2:#5a3e1b;--ink3:#8B6914;
      --cream:#FAF6F0;--cream2:#F0E8D8;--surface:#FFFFFF;
      --border:rgba(201,169,110,0.25);--border-mid:rgba(201,169,110,0.40);
      --shadow:0 8px 40px rgba(26,18,9,0.10);--shadow-lg:0 20px 60px rgba(26,18,9,0.16);
      --r:24px;--r-sm:16px;
    }
    .page{min-height:100dvh;background:var(--cream);
      background-image:radial-gradient(ellipse 80% 40% at 50% 0%,rgba(201,169,110,0.08) 0%,transparent 70%),radial-gradient(ellipse 40% 30% at 90% 100%,rgba(201,169,110,0.05) 0%,transparent 60%);
      padding-bottom:80px;opacity:0;transition:opacity .5s ease;}
    .page.vis{opacity:1}
    .page.destroying{animation:shatter .6s ease forwards}
    @keyframes shatter{0%{opacity:1;transform:scale(1)}30%{opacity:1;transform:scale(1.03)}60%{opacity:.5;transform:scale(.95)}100%{opacity:0;transform:scale(.8)}}
    @keyframes riseUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes popIn{from{transform:scale(0)}to{transform:scale(1)}}

    /* ── Topbar ── */
    .topbar{display:flex;align-items:center;gap:10px;padding:11px 16px;background:rgba(250,246,240,0.95);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:20;justify-content:space-between;}
    .topbar-left{display:flex;align-items:center;gap:10px}
    .topbar-name{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--ink);letter-spacing:.3px;line-height:1}
    .topbar-sub{font-size:9px;font-weight:600;color:var(--ink3);text-transform:uppercase;letter-spacing:1px;margin-top:1px}

    /* ── Número de orden en topbar ── */
    .topbar-num{
      background:linear-gradient(135deg,var(--dark),var(--dark2));
      color:var(--gold);border:1px solid rgba(201,169,110,0.3);
      border-radius:8px;padding:4px 10px;
      font-size:11px;font-weight:800;letter-spacing:.5px;
      font-variant-numeric:tabular-nums;
    }

    /* ── Botón salir (solo en muro mode) ── */
    .btn-salir-muro{
      display:flex;align-items:center;gap:6px;
      background:var(--cream2);color:var(--ink2);
      border:1.5px solid var(--border-mid);border-radius:10px;
      padding:7px 13px;font-size:12px;font-weight:700;
      cursor:pointer;font-family:'Jost',sans-serif;
      transition:all .18s;-webkit-tap-highlight-color:transparent;
    }
    .btn-salir-muro:hover{background:var(--dark);color:var(--gold);border-color:rgba(201,169,110,0.5)}

    .wrap{max-width:430px;margin:0 auto;padding:22px 16px;display:flex;flex-direction:column;gap:20px}

    .inv-card{background:var(--surface);border-radius:var(--r);border:1px solid var(--border-mid);box-shadow:var(--shadow-lg);overflow:hidden;animation:riseUp .6s cubic-bezier(.22,1,.36,1) both;}
    .inv-hero{padding:40px 24px 32px;text-align:center;position:relative;overflow:hidden;min-height:300px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:0}
    .inv-hero-bg{position:absolute;inset:0;background:linear-gradient(160deg,var(--dark) 0%,var(--dark2) 100%)}
    .inv-hero-foto{position:absolute;inset:0;object-fit:cover;width:100%;height:100%;object-position:center top;}
    .inv-hero-foto-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(10,7,3,0.18) 0%,rgba(10,7,3,0.55) 45%,rgba(10,7,3,0.88) 100%)}

    /* Número de orden en hero */
    .inv-num-badge{
      position:relative;z-index:3;
      display:inline-flex;align-items:center;gap:5px;
      background:rgba(201,169,110,0.22);border:1px solid rgba(201,169,110,0.6);
      border-radius:99px;padding:4px 13px;
      font-size:11px;font-weight:800;color:rgba(232,213,176,1);
      letter-spacing:1px;text-transform:uppercase;
      margin-bottom:10px;
    }

    .inv-tipo-badge{position:relative;z-index:2;display:inline-flex;align-items:center;gap:6px;background:rgba(201,169,110,0.18);border:1px solid rgba(201,169,110,0.55);border-radius:99px;padding:5px 14px;font-family:'Jost',sans-serif;font-size:10px;font-weight:700;color:rgba(232,213,176,1);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px;text-shadow:0 1px 4px rgba(0,0,0,0.5);}
    .inv-saludo{position:relative;z-index:2;font-family:'Cormorant Garamond',serif;font-size:40px;font-weight:500;font-style:italic;color:#fff;letter-spacing:-.5px;line-height:1.15;margin-bottom:6px;text-shadow:0 2px 16px rgba(0,0,0,0.7),0 1px 4px rgba(0,0,0,0.9);}
    .inv-anfitrion{position:relative;z-index:2;font-size:12px;color:rgba(232,213,176,0.92);font-weight:500;letter-spacing:.5px;margin-bottom:16px;text-shadow:0 1px 6px rgba(0,0,0,0.7);}
    .inv-evento-nombre{position:relative;z-index:2;background:rgba(26,18,9,0.65);backdrop-filter:blur(8px);border:1px solid rgba(201,169,110,0.55);border-radius:12px;padding:12px 22px;font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:#fff;letter-spacing:.3px;text-shadow:0 1px 8px rgba(0,0,0,0.6);}
    .inv-body{padding:22px 20px;display:flex;flex-direction:column;gap:16px}
    .inv-frase{font-family:'Cormorant Garamond',serif;font-size:17px;font-style:italic;font-weight:400;color:var(--ink2);text-align:center;line-height:1.6;padding:2px 8px}
    .inv-nombres{background:var(--cream);border:1px solid var(--border);border-radius:var(--r-sm);padding:14px 16px}
    .inv-nombres-title{font-size:9px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:10px}
    .inv-nombre-item{display:flex;align-items:center;gap:10px;font-family:'Cormorant Garamond',serif;font-size:16px;color:var(--ink);font-weight:500;margin-bottom:7px}
    .inv-nombre-item:last-child{margin-bottom:0}
    .inv-nombre-av{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#fff;font-family:'Cormorant Garamond',serif;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .detalles{background:var(--cream);border:1px solid var(--border);border-radius:var(--r-sm);padding:16px 18px;display:flex;flex-direction:column;gap:14px}
    .detalle-fila{display:flex;align-items:flex-start;gap:13px}
    .detalle-ico-wrap{width:36px;height:36px;border-radius:10px;background:var(--cream2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .detalle-label{font-size:9px;color:var(--ink3);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px}
    .detalle-texto{font-size:14px;color:var(--ink);font-weight:400;line-height:1.4;text-transform:capitalize}
    .maps-btn{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#fff;border-radius:8px;padding:6px 12px;font-size:11px;font-weight:600;letter-spacing:.3px;text-decoration:none;margin-top:7px;transition:opacity .15s;font-family:'Jost',sans-serif;}
    .maps-btn:hover{opacity:.85}

    /* Galería fotos lugar */
    .foto-lugar-label{font-size:10px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:1px;margin-bottom:9px}
    .galeria-thumbs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px}
    .galeria-thumb{position:relative;border-radius:10px;overflow:hidden;aspect-ratio:1;cursor:pointer;border:1.5px solid var(--border-mid);transition:transform .15s}
    .galeria-thumb:hover{transform:scale(1.02)}
    .galeria-thumb img{width:100%;height:100%;object-fit:cover;display:block}
    .galeria-thumb-more{position:absolute;inset:0;background:rgba(26,18,9,0.60);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:var(--gold-light)}
    .btn-ver-fotos{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;background:var(--cream);border:1.5px solid var(--border-mid);border-radius:12px;padding:11px 16px;font-size:13px;font-weight:600;color:var(--ink2);cursor:pointer;transition:all .15s;font-family:'Jost',sans-serif;}
    .btn-ver-fotos:hover{background:var(--gold-pale);border-color:var(--gold);color:var(--gold-dark)}

    /* Lightbox */
    .lightbox-overlay{position:fixed;inset:0;z-index:9999;background:rgba(10,8,4,0.92);display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease;padding:16px}
    .lightbox-inner{position:relative;width:100%;max-width:480px;display:flex;flex-direction:column;align-items:center;gap:14px}
    .lightbox-img-wrap{width:100%;border-radius:16px;overflow:hidden;box-shadow:0 16px 60px rgba(0,0,0,0.5)}
    .lightbox-img{width:100%;max-height:70vh;object-fit:contain;display:block;background:#000}
    .lightbox-close{position:absolute;top:-12px;right:-12px;width:36px;height:36px;border-radius:50%;background:rgba(201,169,110,0.15);border:1.5px solid rgba(201,169,110,0.4);color:var(--gold-light);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2}
    .lightbox-nav{position:absolute;top:50%;transform:translateY(-60%);width:40px;height:40px;border-radius:50%;background:rgba(26,18,9,0.7);border:1.5px solid rgba(201,169,110,0.3);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s}
    .lightbox-nav:hover{background:rgba(201,169,110,0.2)}
    .lightbox-prev{left:-20px}
    .lightbox-next{right:-20px}
    .lightbox-dots{display:flex;gap:7px;margin-top:4px}
    .lightbox-dot{width:7px;height:7px;border-radius:50%;background:rgba(201,169,110,0.3);cursor:pointer;transition:background .15s}
    .lightbox-dot.active{background:var(--gold)}
    .lightbox-caption{font-size:12px;color:rgba(232,213,176,0.7);font-style:italic;text-align:center}

    /* Música */
    .music-player{display:flex;align-items:center;gap:13px;background:var(--dark);border-radius:var(--r-sm);padding:14px 16px;cursor:pointer;transition:opacity .15s}
    .music-player:hover{opacity:.92}
    .music-icon-wrap{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--gold-dark),var(--gold));display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 3px 14px rgba(201,169,110,0.4)}
    .music-info{flex:1;min-width:0}
    .music-label{display:block;font-size:9px;font-weight:700;color:rgba(201,169,110,0.6);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
    .music-name{display:block;font-family:'Cormorant Garamond',serif;font-size:17px;font-style:italic;color:var(--gold-light);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .music-waves{display:flex;align-items:center;gap:2px;flex-shrink:0}
    .mw{width:3px;border-radius:99px;background:var(--gold);animation:mwave .8s ease-in-out infinite}
    .mw-1{height:8px;animation-delay:0s}.mw-2{height:14px;animation-delay:.1s}.mw-3{height:10px;animation-delay:.2s}.mw-4{height:16px;animation-delay:.15s}.mw-5{height:8px;animation-delay:.05s}
    @keyframes mwave{0%,100%{transform:scaleY(0.5)}50%{transform:scaleY(1)}}

    .inv-mensaje{background:var(--cream);border-left:3px solid var(--gold);border-radius:0 12px 12px 0;padding:14px 18px;font-family:'Cormorant Garamond',serif;font-size:17px;font-style:italic;color:var(--ink2);line-height:1.7}
    .inv-deadline{background:#fef8f0;border:1px solid rgba(180,83,9,0.2);border-radius:var(--r-sm);padding:12px 15px;display:flex;align-items:center;gap:10px}
    .deadline-text{font-size:13px;color:#92400e;font-weight:500;line-height:1.4}
    .como-llegar-box{background:var(--cream);border:1px solid var(--border);border-radius:var(--r-sm);padding:14px 16px}
    .como-llegar-label{font-size:9px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
    .como-llegar-text{font-size:13px;color:var(--ink2);line-height:1.7}

    /* Decisión */
    .pregunta-wrap{text-align:center;padding:4px 0 2px}
    .pregunta{font-family:'Cormorant Garamond',serif;font-size:26px;font-style:italic;color:var(--ink);font-weight:400;margin-bottom:4px}
    .pregunta-sub{font-size:11px;color:var(--ink3);font-weight:500;letter-spacing:.5px}
    .grid-decision{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .btn-si{background:linear-gradient(135deg,var(--dark),var(--dark2));color:var(--gold);border:1px solid rgba(201,169,110,0.4);border-radius:var(--r-sm);padding:18px 12px;font-family:'Cormorant Garamond',serif;font-size:18px;font-style:italic;font-weight:600;cursor:pointer;box-shadow:0 5px 22px rgba(26,18,9,0.20);transition:transform .18s,box-shadow .18s,opacity .15s;letter-spacing:.3px}
    .btn-si:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(26,18,9,0.28)}
    .btn-si:disabled{opacity:.65;cursor:wait}
    .btn-no{background:var(--cream);color:var(--ink2);border:1px solid var(--border-mid);border-radius:var(--r-sm);padding:18px 12px;font-family:'Jost',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all .18s;letter-spacing:.2px}
    .btn-no:hover{background:#fef2f2;color:#b45309;border-color:rgba(180,83,9,0.25)}

    /* Form */
    .form-card{background:var(--surface);border-radius:var(--r);border:1px solid var(--border-mid);box-shadow:var(--shadow);padding:30px 24px;animation:riseUp .45s cubic-bezier(.22,1,.36,1) both}
    .form-titulo{font-family:'Cormorant Garamond',serif;font-size:32px;font-style:italic;font-weight:400;color:var(--ink)}
    .form-sub{font-size:11px;color:var(--ink3);font-weight:600;margin:4px 0 24px;text-transform:uppercase;letter-spacing:.8px}
    .campo-label{font-size:10px;font-weight:700;color:var(--gold-dark);text-transform:uppercase;letter-spacing:1px;margin:18px 0 12px;display:block}
    .counter-row{display:flex;align-items:center;gap:20px;padding:2px 0}
    .cnt-btn{width:48px;height:48px;border-radius:50%;border:1.5px solid var(--border-mid);background:var(--cream);color:var(--ink3);font-size:22px;font-weight:400;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;user-select:none;font-family:'Cormorant Garamond',serif;line-height:1}
    .cnt-btn:hover{background:var(--gold-pale);border-color:var(--gold);color:var(--gold-dark)}
    .cnt-val{font-family:'Cormorant Garamond',serif;font-size:44px;font-weight:300;color:var(--dark);min-width:50px;text-align:center;font-variant-numeric:tabular-nums}
    .btn-confirmar-final{width:100%;margin-top:20px;background:linear-gradient(135deg,var(--dark),var(--dark2));color:var(--gold);border:1px solid rgba(201,169,110,0.3);border-radius:var(--r-sm);padding:16px;font-family:'Cormorant Garamond',serif;font-size:18px;font-style:italic;font-weight:600;cursor:pointer;letter-spacing:.5px;box-shadow:0 5px 20px rgba(26,18,9,0.20);transition:transform .18s,box-shadow .18s;display:flex;align-items:center;justify-content:center;gap:9px}
    .btn-confirmar-final:hover{transform:translateY(-1px)}
    .btn-confirmar-final:disabled{opacity:.65;cursor:wait}
    .spinner{width:18px;height:18px;border-radius:50%;border:2px solid rgba(201,169,110,0.3);border-top-color:var(--gold);animation:spin .7s linear infinite}

    /* Confirmado */
    .conf-card{background:var(--surface);border-radius:var(--r);border:1px solid var(--border-mid);box-shadow:var(--shadow-lg);overflow:hidden;animation:riseUp .5s cubic-bezier(.22,1,.36,1) both}
    .conf-hero{background:linear-gradient(160deg,var(--dark) 0%,var(--dark2) 100%);padding:36px 24px 30px;text-align:center;position:relative;overflow:hidden}
    .conf-hero::before{content:'';position:absolute;inset:0;opacity:.04;background-image:radial-gradient(circle,var(--gold) 1px,transparent 1px);background-size:28px 28px}
    .conf-check{position:relative;z-index:1;width:72px;height:72px;border-radius:50%;background:rgba(201,169,110,0.15);border:1.5px solid rgba(201,169,110,0.45);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;animation:popIn .55s .1s cubic-bezier(.22,1,.36,1) both}
    .conf-titulo{position:relative;z-index:1;font-family:'Cormorant Garamond',serif;font-size:38px;font-style:italic;font-weight:400;color:var(--gold-light);letter-spacing:-.3px;margin-bottom:8px}
    .conf-sub{position:relative;z-index:1;font-size:13px;color:rgba(232,213,176,0.7);font-weight:400}
    .conf-body{padding:22px;display:flex;flex-direction:column;gap:16px}
    .num-badge{background:linear-gradient(135deg,var(--dark),var(--dark2));border-radius:var(--r-sm);border:1px solid rgba(201,169,110,0.3);padding:16px 20px;display:flex;align-items:center;gap:16px}
    .num-icono{width:46px;height:46px;border-radius:12px;background:rgba(201,169,110,0.12);border:1px solid rgba(201,169,110,0.25);display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .num-label{font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(201,169,110,0.6);margin-bottom:3px}
    .num-val{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:300;color:var(--gold);letter-spacing:-1px;line-height:1}
    .resumen{background:var(--cream);border:1px solid var(--border);border-radius:var(--r-sm);padding:16px 18px;display:flex;flex-direction:column;gap:12px}
    .res-fila{display:flex;align-items:center;gap:11px}
    .res-ico{width:32px;height:32px;border-radius:9px;background:var(--cream2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .res-texto{font-size:13px;color:var(--ink2);font-weight:400;text-transform:capitalize}

    /* Fotos invitado */
    .fotos-inv-wrap{background:var(--cream);border:1px solid var(--border-mid);border-radius:var(--r-sm);overflow:hidden}
    .fotos-inv-header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;cursor:pointer;transition:background .15s}
    .fotos-inv-header:hover{background:var(--gold-pale)}
    .fotos-inv-body{padding:0 16px 16px;display:flex;flex-direction:column;gap:11px;border-top:1px solid var(--border)}
    .fotos-inv-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding-top:12px}
    .fotos-inv-thumb{border-radius:8px;overflow:hidden;aspect-ratio:1;border:1px solid var(--border-mid)}
    .fotos-inv-thumb img{width:100%;height:100%;object-fit:cover;display:block}
    .btn-subir-foto{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,var(--dark),var(--dark2));color:var(--gold);border:none;border-radius:12px;padding:13px;font-size:13px;font-weight:600;font-family:'Jost',sans-serif;cursor:pointer;box-shadow:0 3px 14px rgba(26,18,9,0.18);transition:transform .15s}
    .btn-subir-foto:hover{transform:translateY(-1px)}
    .btn-subir-foto:disabled{opacity:.65;cursor:wait}
    .btn-accion-ico{width:44px;height:44px;border-radius:12px;background:var(--cream2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0}

    /* Botones acción confirmado */
    .btn-accion-full{width:100%;background:var(--cream);border:1px solid var(--border-mid);border-radius:var(--r-sm);padding:15px 18px;display:flex;align-items:center;gap:13px;cursor:pointer;transition:all .18s;font-family:'Jost',sans-serif}
    .btn-accion-full:hover{background:var(--gold-pale);border-color:var(--gold)}

    /* ── Botón ir al muro ── */
    .btn-muro{width:100%;background:linear-gradient(135deg,var(--dark),var(--dark2));color:var(--gold);border:1px solid rgba(201,169,110,0.3);border-radius:var(--r-sm);padding:16px;font-family:'Cormorant Garamond',serif;font-size:18px;font-style:italic;font-weight:600;cursor:pointer;letter-spacing:.3px;box-shadow:0 5px 20px rgba(26,18,9,0.18);transition:transform .18s;display:flex;align-items:center;justify-content:center;gap:9px}
    .btn-muro:hover{transform:translateY(-1px)}

    /* ── Botón salir ── */
    .btn-cerrar{width:100%;background:var(--cream);color:var(--ink2);border:1.5px solid var(--border-mid);border-radius:var(--r-sm);padding:14px;font-family:'Jost',sans-serif;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .18s}
    .btn-cerrar:hover{background:var(--dark);color:var(--gold);border-color:rgba(201,169,110,0.4)}

    /* Rechazado */
    .rech-card{background:var(--surface);border-radius:var(--r);border:1px solid var(--border-mid);box-shadow:var(--shadow);padding:40px 26px;text-align:center;animation:riseUp .5s cubic-bezier(.22,1,.36,1) both}
    .rech-titulo{font-family:'Cormorant Garamond',serif;font-size:32px;font-style:italic;color:var(--ink);margin-bottom:12px}
    .rech-sub{font-size:14px;color:var(--ink2);line-height:1.8}

    /* Loading */
    .loading-screen{min-height:100dvh;background:var(--cream);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px}
    .loading-spinner{width:36px;height:36px;border-radius:50%;border:2.5px solid rgba(201,169,110,0.15);border-top-color:var(--gold);animation:spin .75s linear infinite}
    canvas#confetti-canvas{position:fixed;inset:0;z-index:9999;width:100%;height:100%;display:none;pointer-events:none}

    /* ── Paso progress ── */
    .paso-progress{background:var(--cream2);border:1px solid var(--border);border-radius:var(--r-sm);padding:12px 16px;display:flex;align-items:center;gap:10px}
    .paso-dot{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;flex-shrink:0;border:2px solid transparent}
    .paso-dot-done{background:var(--gold);color:var(--dark);border-color:var(--gold-dark)}
    .paso-dot-active{background:var(--dark);color:var(--gold);border-color:var(--gold)}
    .paso-dot-pending{background:var(--cream);color:var(--ink3);border-color:var(--border-mid)}
    .paso-line{flex:1;height:2px;background:var(--border);border-radius:1px}
    .paso-line-done{background:linear-gradient(90deg,var(--gold),var(--gold-dark))}
  `;

  if (loading)
    return (
      <>
        <style>{styles}</style>
        <div className="loading-screen">
          <AppLogo size={56} />
          <div className="loading-spinner" />
          <p
            style={{
              color: "var(--gold)",
              fontWeight: 500,
              fontSize: 12,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            Cargando tu invitación
          </p>
        </div>
      </>
    );

  if (!invitado || !evento)
    return (
      <>
        <style>{styles}</style>
        <div
          style={{
            minHeight: "100dvh",
            background: "var(--cream)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 22,
              border: "1px solid var(--border-mid)",
              padding: "40px 28px",
              maxWidth: 340,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 14 }}>🔍</div>
            <p
              style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: 26,
                fontStyle: "italic",
                color: "var(--ink)",
                marginBottom: 8,
              }}
            >
              Invitación no encontrada
            </p>
            <p style={{ fontSize: 13, color: "var(--ink2)" }}>
              Este enlace no es válido o ya expiró.
            </p>
          </div>
        </div>
      </>
    );

  const tipoLabel = TIPO_LABEL[evento.tipo] || "Evento especial";
  const tipoOrn = TIPO_ORNAMENTO[evento.tipo] || "✨";
  const fechaFmt = evento.fecha ? formatFecha(evento.fecha) : null;
  const fechaCorta = evento.fecha ? formatFechaCorta(evento.fecha) : null;
  const horaFmt = evento.hora ? formatHora(evento.hora) : null;
  const fechaLimiteFmt = evento.fecha_limite_confirmacion
    ? formatFechaCorta(evento.fecha_limite_confirmacion)
    : null;
  const numOrden = invitado.orden ?? 1;

  return (
    <>
      <style>{styles}</style>
      <canvas id="confetti-canvas" ref={canvasRef} />

      <div
        className={`page${mounted ? " vis" : ""}${destroying ? " destroying" : ""}`}
      >
        {/* ── TOPBAR ── */}
        <div className="topbar">
          <div className="topbar-left">
            <AppLogo size={30} />
            <div>
              <div className="topbar-name">Eventix</div>
              <div className="topbar-sub">Invitaciones digitales</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Número de orden siempre visible */}
            <div className="topbar-num">
              🎟️ #{String(numOrden).padStart(3, "0")}
            </div>
            {/* Botón salir SOLO cuando ya está en modo muro */}
            {(step === "confirmado" || step === "rechazado") && (
              <button className="btn-salir-muro" onClick={salir}>
                <IcoSalir /> Salir
              </button>
            )}
          </div>
        </div>

        {/* ─── VISTA ─── */}
        {step === "vista" && (
          <div className="wrap">
            <div className="inv-card">
              <div
                className="inv-hero"
                style={{ minHeight: evento.imagen_url ? 320 : 260 }}
              >
                {evento.imagen_url ? (
                  <>
                    <img
                      src={evento.imagen_url}
                      className="inv-hero-foto"
                      alt={evento.nombre}
                    />
                    <div className="inv-hero-foto-overlay" />
                  </>
                ) : (
                  <div className="inv-hero-bg" />
                )}
                {/* Número de orden en hero */}
                <div className="inv-num-badge">
                  🎟️ Invitación #{String(numOrden).padStart(3, "0")}
                </div>
                <div className="inv-tipo-badge">
                  <span>{tipoOrn}</span>
                  <span>{tipoLabel}</span>
                </div>
                <h1 className="inv-saludo">
                  {nombresEnTarjeta.length > 1
                    ? `${nombresEnTarjeta.slice(0, 2).join(" & ")}`
                    : `${invitado.nombre}`}
                </h1>
                <p className="inv-anfitrion">
                  Con cariño de{" "}
                  <strong style={{ color: "#fff", fontWeight: 600 }}>
                    {evento.anfitriones}
                  </strong>
                </p>
                <div className="inv-evento-nombre">{evento.nombre}</div>
              </div>

              <div className="inv-body">
                {evento.frase_evento && (
                  <>
                    <OrnamentoDivider tipo={evento.tipo} />
                    <div className="inv-frase">❝ {evento.frase_evento} ❞</div>
                    <OrnamentoDivider tipo={evento.tipo} />
                  </>
                )}

                {nombresEnTarjeta.length > 1 && (
                  <div className="inv-nombres">
                    <div className="inv-nombres-title">
                      Invitados en esta tarjeta
                    </div>
                    {nombresEnTarjeta.map((n, i) => (
                      <div key={i} className="inv-nombre-item">
                        <div className="inv-nombre-av">
                          {n.charAt(0).toUpperCase()}
                        </div>
                        <span>{n}</span>
                      </div>
                    ))}
                  </div>
                )}

                {(fechaFmt || evento.hora || evento.lugar) && (
                  <div className="detalles">
                    {fechaFmt && (
                      <div className="detalle-fila">
                        <div className="detalle-ico-wrap">
                          <IcoFecha />
                        </div>
                        <div>
                          <div className="detalle-label">Fecha</div>
                          <div className="detalle-texto">{fechaFmt}</div>
                        </div>
                      </div>
                    )}
                    {horaFmt && (
                      <div className="detalle-fila">
                        <div className="detalle-ico-wrap">
                          <IcoHora />
                        </div>
                        <div>
                          <div className="detalle-label">Hora</div>
                          <div className="detalle-texto">{horaFmt}</div>
                        </div>
                      </div>
                    )}
                    {evento.lugar && (
                      <div className="detalle-fila">
                        <div className="detalle-ico-wrap">
                          <IcoLugar />
                        </div>
                        <div>
                          <div className="detalle-label">Lugar</div>
                          <div className="detalle-texto">{evento.lugar}</div>
                          {evento.maps_url && (
                            <a
                              href={evento.maps_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="maps-btn"
                            >
                              <span>📍</span>Ver en el mapa
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                    {evento.musica_nombre && (
                      <div className="detalle-fila">
                        <div className="detalle-ico-wrap">
                          <IcoMusica />
                        </div>
                        <div>
                          <div className="detalle-label">
                            Canción del evento
                          </div>
                          <div className="detalle-texto">
                            {evento.musica_nombre}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {evento.como_llegar && (
                  <div className="como-llegar-box">
                    <div className="como-llegar-label">
                      Instrucciones para llegar
                    </div>
                    <p className="como-llegar-text">{evento.como_llegar}</p>
                  </div>
                )}

                {fotosLugar.length > 0 && (
                  <GaleriaLugar fotos={fotosLugar} lugar={evento.lugar} />
                )}
                {evento.musica_url && (
                  <MusicPlayer
                    url={evento.musica_url}
                    nombre={evento.musica_nombre}
                  />
                )}
                {evento.mensaje_invitacion && (
                  <div className="inv-mensaje">
                    "{evento.mensaje_invitacion}"
                  </div>
                )}
                {fechaLimiteFmt && (
                  <div className="inv-deadline">
                    <IcoDeadline />
                    <span className="deadline-text">
                      Por favor confirma antes del{" "}
                      <strong>{fechaLimiteFmt}</strong>
                    </span>
                  </div>
                )}
                <OrnamentoDivider tipo={evento.tipo} />
              </div>
            </div>

            <div className="pregunta-wrap">
              <p className="pregunta">¿Podrás asistir?</p>
              <p className="pregunta-sub">
                Tu respuesta es importante para los anfitriones
              </p>
            </div>
            <div className="grid-decision">
              <button className="btn-no" onClick={rechazarAsistencia}>
                No podré asistir
              </button>
              <button
                className="btn-si"
                onClick={handleConfirmarClick}
                disabled={confirmando}
              >
                {confirmando ? "Confirmando..." : "Confirmar asistencia"}
              </button>
            </div>
          </div>
        )}

        {/* ─── FORM ─── */}
        {step === "form" && (
          <div className="wrap">
            <div className="form-card">
              <div className="form-titulo">¡Qué alegría!</div>
              <div className="form-sub">Un detalle más</div>
              <span className="campo-label">¿Cuántas personas asistirán?</span>
              <div className="counter-row">
                <button
                  className="cnt-btn"
                  onClick={() => setNumPersonas(Math.max(1, numPersonas - 1))}
                >
                  −
                </button>
                <span className="cnt-val">{numPersonas}</span>
                <button
                  className="cnt-btn"
                  onClick={() =>
                    setNumPersonas(
                      Math.min(invitado.num_personas || 20, numPersonas + 1),
                    )
                  }
                >
                  +
                </button>
              </div>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--ink3)",
                  marginTop: 10,
                  letterSpacing: ".3px",
                }}
              >
                Tu invitación es para hasta {invitado.num_personas}{" "}
                {invitado.num_personas === 1 ? "persona" : "personas"}
              </p>
              <button
                className="btn-confirmar-final"
                onClick={confirmarAsistencia}
                disabled={confirmando}
              >
                {confirmando ? (
                  <>
                    <div className="spinner" /> Confirmando...
                  </>
                ) : (
                  "Confirmar asistencia"
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── CONFIRMADO ─── */}
        {step === "confirmado" && (
          <div className="wrap">
            <div className="conf-card">
              <div className="conf-hero">
                <div className="conf-check">
                  <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
                    <path
                      d="M7 16l7 7 11-11"
                      stroke="#C9A96E"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="conf-titulo">¡Confirmado!</div>
                <p className="conf-sub">
                  Nos vemos en{" "}
                  <strong
                    style={{ color: "rgba(232,213,176,0.95)", fontWeight: 500 }}
                  >
                    {evento.nombre}
                  </strong>
                </p>
              </div>

              <div className="conf-body">
                {/* Número de orden del invitado */}
                <div className="num-badge">
                  <div className="num-icono">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#C9A96E"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 9a3 3 0 010-6h20a3 3 0 010 6" />
                      <path d="M2 15a3 3 0 000 6h20a3 3 0 000-6" />
                      <path d="M2 9h20M2 15h20" />
                    </svg>
                  </div>
                  <div>
                    <div className="num-label">Tu número de invitado</div>
                    <div className="num-val">
                      #{String(numOrden).padStart(3, "0")}
                    </div>
                  </div>
                </div>

                {invitado.numero_confirmacion && (
                  <div
                    className="num-badge"
                    style={{ background: "rgba(201,169,110,0.08)" }}
                  >
                    <div className="num-icono">
                      <IcoCheck />
                    </div>
                    <div>
                      <div className="num-label">Número de confirmación</div>
                      <div className="num-val">
                        #{String(invitado.numero_confirmacion).padStart(3, "0")}
                      </div>
                    </div>
                  </div>
                )}

                <div className="resumen">
                  {fechaCorta && (
                    <div className="res-fila">
                      <div className="res-ico">
                        <IcoFecha />
                      </div>
                      <span className="res-texto">{fechaCorta}</span>
                    </div>
                  )}
                  {horaFmt && (
                    <div className="res-fila">
                      <div className="res-ico">
                        <IcoHora />
                      </div>
                      <span className="res-texto">{horaFmt}</span>
                    </div>
                  )}
                  {evento.lugar && (
                    <div className="res-fila">
                      <div className="res-ico">
                        <IcoLugar />
                      </div>
                      <span className="res-texto">{evento.lugar}</span>
                    </div>
                  )}
                  <div className="res-fila">
                    <div className="res-ico">
                      <IcoPersonas />
                    </div>
                    <span className="res-texto">
                      {invitado.num_personas}{" "}
                      {invitado.num_personas === 1 ? "persona" : "personas"}
                    </span>
                  </div>
                </div>

                {/* Indicador de pasos opcionales */}
                <div className="paso-progress">
                  <div className="paso-dot paso-dot-done">✓</div>
                  <div
                    className={`paso-line${fotoSubida ? " paso-line-done" : ""}`}
                  />
                  <div
                    className={`paso-dot ${fotoSubida ? "paso-dot-done" : "paso-dot-active"}`}
                  >
                    {fotoSubida ? "✓" : "📸"}
                  </div>
                  <div
                    className={`paso-line${deseoGuardado ? " paso-line-done" : ""}`}
                  />
                  <div
                    className={`paso-dot ${deseoGuardado ? "paso-dot-done" : "paso-dot-pending"}`}
                  >
                    {deseoGuardado ? "✓" : "💌"}
                  </div>
                </div>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--ink3)",
                    textAlign: "center",
                    marginTop: -8,
                  }}
                >
                  ✓ Confirmado ·{" "}
                  {fotoSubida ? "📸 Foto subida" : "📸 Foto (opcional)"} ·{" "}
                  {deseoGuardado ? "💌 Deseo enviado" : "💌 Deseo (opcional)"}
                </p>

                {/* Subir fotos (opcional) */}
                <SubirFotosInvitado
                  invitadoId={invitado.id}
                  eventoId={invitado.evento_id}
                  token={token}
                  onFotoSubida={() => setFotoSubida(true)}
                />

                {/* Dejar deseo (opcional) */}
                <DejarDeseo
                  invitadoId={invitado.id}
                  eventoId={invitado.evento_id}
                  invNombre={invitado.nombre}
                  onDeseoGuardado={() => setDeseoGuardado(true)}
                />

                {/* Google Calendar */}
                {evento.fecha && (
                  <button
                    className="btn-accion-full"
                    onClick={() => abrirGoogleCalendar(evento)}
                  >
                    <div className="res-ico">
                      <IcoCalendario />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        textAlign: "left",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--ink2)",
                        }}
                      >
                        Guardar en Google Calendar
                      </span>
                      <span style={{ fontSize: 11, color: "var(--ink3)" }}>
                        No olvides el evento
                      </span>
                    </div>
                    <svg
                      style={{ marginLeft: "auto" }}
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--gold)"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </button>
                )}

                {/* ── IR AL MURO (solo fotos y deseos, sin dashboard) ── */}
                <button className="btn-muro" onClick={irAlMuro}>
                  📸 Ver fotos y deseos del evento
                </button>

                {/* ── SALIR ── */}
                <button className="btn-cerrar" onClick={salir}>
                  <IcoSalir /> Listo, cerrar esta ventana
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── RECHAZADO ─── */}
        {step === "rechazado" && (
          <div className="wrap">
            <div className="rech-card">
              <div style={{ fontSize: 50, marginBottom: 18 }}>🕊️</div>
              <div className="rech-titulo">Gracias por avisar</div>
              <OrnamentoDivider tipo={evento.tipo} />
              <p className="rech-sub" style={{ marginTop: 16 }}>
                Lamentamos que no puedas asistir,{" "}
                <strong>{invitado.nombre}</strong>.<br />
                <br />
                Esperamos verte en otra ocasión especial.
              </p>
              <button
                onClick={salir}
                style={{
                  marginTop: 26,
                  width: "100%",
                  background: "var(--cream)",
                  color: "var(--ink2)",
                  border: "1.5px solid var(--border-mid)",
                  borderRadius: "var(--r-sm)",
                  padding: "14px",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "'Jost',sans-serif",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <IcoSalir /> Cerrar ventana
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
