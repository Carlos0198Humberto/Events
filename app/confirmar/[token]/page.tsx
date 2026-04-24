"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { toast } from "@/app/components/Toast";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Invitado = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  estado: string;
  num_personas: number;
  cupo_elije_invitado?: boolean;
  token: string;
  numero_confirmacion?: number | null;
  foto_url?: string | null;
  deseo?: string | null;
  evento_id: string;
  nombres_personas?: string | null;
  mesa_id?: string | null;
  mesa_nombre?: string | null; // populated by join
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
  tema?: string | null;
  regalo_activo?: boolean;
  regalo_banco?: string | null;
  regalo_titular?: string | null;
  regalo_cuenta?: string | null;
  regalo_mensaje?: string | null;
  vestimenta_activo?: boolean;
  vestimenta_tipo?: string | null;
  vestimenta_colores?: string | null;
  vestimenta_nota?: string | null;
};

type ItemItinerario = {
  id: string;
  hora?: string | null;
  titulo: string;
  descripcion?: string | null;
  icono?: string | null;
  orden: number;
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
  quinceañera: "",
  boda: "",
  graduacion: "",
  cumpleaños: "",
  otro: "",
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

// ─── Confetti para pantalla de bienvenida (determinista, sin random) ─────────
const CONFETTI_PIECES = Array.from({ length: 42 }, (_, i) => ({
  id: i,
  left: ((i * 7.3 + (i % 5) * 11.7) % 100),
  delay: (i * 0.12) % 3.8,
  dur: 2.6 + (i % 6) * 0.35,
  size: 5 + (i % 5) * 2.5,
  color: ["#4F46E5","#6366F1","#818CF8","#A5B4FC","#C7D2FE","#E0E7FF","#F59E0B","#FCD34D","#10B981","#A78BFA"][i % 10],
  rot: (i * 53) % 360,
  wide: i % 3 !== 0,
}));

function crearParticulas() {
  const colores = [
    "#4F46E5",
    "#6366F1",
    "#818CF8",
    "#A5B4FC",
    "#F59E0B",
    "#10B981",
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
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id={`ev-logo-${size}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#312E81" /><stop offset="100%" stopColor="#4F46E5" /></linearGradient></defs><rect width="64" height="64" rx="18" fill={`url(#ev-logo-${size})`} /><rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" /><rect x="13" y="14" width="6" height="36" rx="3" fill="#FFFFFF" /><rect x="13" y="14" width="24" height="6" rx="3" fill="#FFFFFF" /><rect x="13" y="29" width="18" height="6" rx="3" fill="#FFFFFF" /><rect x="13" y="44" width="24" height="6" rx="3" fill="#FFFFFF" /><circle cx="48" cy="19" r="3" fill="#E0E7FF" /><circle cx="48" cy="19" r="1.4" fill="#FFFFFF" /><circle cx="47" cy="46" r="2" fill="#FFFFFF" opacity="0.55" /></svg>
  );
}

// ─── Iconos SVG ───────────────────────────────────────────────────────────────
const IcoFecha = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M8 2v3M16 2v3M3.5 9.09h17M21 8.5V17c0 3-1.5 5-5 5H8c-3.5 0-5-2-5-5V8.5c0-3 1.5-5 5-5h8c3.5 0 5 2 5 5Z"
      stroke="#4F46E5"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11.995 13.7h.01M8.294 13.7h.01M8.294 16.7h.01"
      stroke="#4F46E5"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.695 13.7h.01M15.695 16.7h.01M11.995 16.7h.01"
      stroke="#4F46E5"
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
      stroke="#4F46E5"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.71 15.18 12.61 13.3c-.54-.32-.98-1.09-.98-1.72V7.51"
      stroke="#4F46E5"
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
      stroke="#4F46E5"
      strokeWidth="1.5"
    />
    <path
      d="M3.62 8.49c1.97-8.66 14.8-8.65 16.76.01 1.15 5.08-2.01 9.38-4.78 12.04a5.193 5.193 0 0 1-7.21 0c-2.76-2.66-5.92-6.97-4.77-12.05Z"
      stroke="#4F46E5"
      strokeWidth="1.5"
    />
  </svg>
);
const IcoMusica = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M2 9.17v9.71c0 1.18.85 1.65 1.9 1.05l2.74-1.58c.36-.21.96-.23 1.34-.04l6.08 3.04c.38.19.98.17 1.34-.04l5.8-3.34c.38-.22.7-.76.7-1.2V7.06c0-1.18-.85-1.65-1.9-1.05l-2.74 1.58c-.36.21-.96.23-1.34.04L9.94 4.59c-.38-.19-.98-.17-1.34.04L2.7 7.97c-.38.22-.7.76-.7 1.2Z"
      stroke="#4F46E5"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 5v14M15 7.5V21"
      stroke="#4F46E5"
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
      stroke="#4F46E5"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.41 4c2.07 0 3.74 1.68 3.74 3.75 0 2.02-1.6 3.66-3.6 3.74-.07-.01-.14-.01-.21 0"
      stroke="#4F46E5"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.16 14.56c-2.58 1.72-2.58 4.52 0 6.23 2.93 1.95 7.73 1.95 10.66 0 2.58-1.72 2.58-4.52 0-6.23-2.92-1.94-7.72-1.94-10.66 0Z"
      stroke="#4F46E5"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.34 14c.77.16 1.49.48 2.07.96 1.63 1.3 1.63 3.43 0 4.73-.57.46-1.27.78-2.02.95"
      stroke="#4F46E5"
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
      stroke="#4F46E5"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.695 13.7h.01M15.695 16.7h.01M11.995 13.7h.01M11.995 16.7h.01M8.294 13.7h.01M8.294 16.7h.01"
      stroke="#4F46E5"
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
      stroke="#4F46E5"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.5 8h3M12 18c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4Z"
      stroke="#4F46E5"
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
      stroke="#4F46E5"
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
    stroke="#4F46E5"
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

// ─── Decoración por tipo de evento ────────────────────────────────────────────
function DecoracionEvento({ tipo }: { tipo: string }) {
  if (tipo === "boda") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "6px 0" }}>
        {/* Anillos de boda */}
        <svg width="110" height="56" viewBox="0 0 110 56" fill="none">
          {/* Anillo izquierdo */}
          <circle cx="36" cy="30" r="20" stroke="#4F46E5" strokeWidth="5" fill="none" opacity="0.85" />
          <circle cx="36" cy="30" r="13" stroke="#E0E7FF" strokeWidth="1.5" fill="none" opacity="0.4" />
          {/* Diamante */}
          <path d="M32 10 L36 4 L40 10 L36 15 Z" fill="#4F46E5" opacity="0.9" />
          <path d="M32 10 L36 15 L40 10" fill="#E0E7FF" opacity="0.6" />
          {/* Anillo derecho */}
          <circle cx="74" cy="30" r="20" stroke="#4F46E5" strokeWidth="5" fill="none" opacity="0.85" />
          <circle cx="74" cy="30" r="13" stroke="#E0E7FF" strokeWidth="1.5" fill="none" opacity="0.4" />
          {/* Destello */}
          <path d="M70 10 L74 4 L78 10 L74 15 Z" fill="#4F46E5" opacity="0.9" />
          <path d="M70 10 L74 15 L78 10" fill="#E0E7FF" opacity="0.6" />
          {/* Enlace */}
          <path d="M52 28 Q55 22 58 28" stroke="#4F46E5" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
        </svg>
        {/* Flores decorativas */}
        <svg width="200" height="28" viewBox="0 0 200 28" fill="none">
          <path d="M0 14 Q25 4 50 14 Q75 24 100 14 Q125 4 150 14 Q175 24 200 14" stroke="#4F46E5" strokeWidth="1" fill="none" opacity="0.5" />
          {[25, 75, 125, 175].map((x) => (
            <g key={x} transform={`translate(${x},14)`}>
              <circle cx="0" cy="0" r="2.5" fill="#4F46E5" opacity="0.7" />
              <circle cx="0" cy="-5" r="2" fill="#E0E7FF" opacity="0.6" />
              <circle cx="5" cy="0" r="2" fill="#E0E7FF" opacity="0.6" />
              <circle cx="0" cy="5" r="2" fill="#E0E7FF" opacity="0.6" />
              <circle cx="-5" cy="0" r="2" fill="#E0E7FF" opacity="0.6" />
            </g>
          ))}
          <circle cx="100" cy="14" r="3" fill="#4F46E5" opacity="0.9" />
        </svg>
      </div>
    );
  }

  if (tipo === "quinceañera") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "6px 0" }}>
        {/* Corona */}
        <svg width="90" height="52" viewBox="0 0 90 52" fill="none">
          {/* Base de la corona */}
          <path d="M8 44 L8 28 L22 8 L45 22 L68 8 L82 28 L82 44 Z" stroke="#4F46E5" strokeWidth="2.5" fill="rgba(79,70,229,0.12)" strokeLinejoin="round" />
          {/* Puntas de la corona */}
          <circle cx="22" cy="8" r="4" fill="#4F46E5" opacity="0.85" />
          <circle cx="45" cy="4" r="5" fill="#4F46E5" opacity="0.95" />
          <circle cx="68" cy="8" r="4" fill="#4F46E5" opacity="0.85" />
          {/* Joyas en la corona */}
          <ellipse cx="45" cy="36" rx="8" ry="6" fill="rgba(79,70,229,0.25)" stroke="#4F46E5" strokeWidth="1.5" />
          <ellipse cx="24" cy="38" rx="5" ry="4" fill="rgba(79,70,229,0.15)" stroke="#4F46E5" strokeWidth="1" />
          <ellipse cx="66" cy="38" rx="5" ry="4" fill="rgba(79,70,229,0.15)" stroke="#4F46E5" strokeWidth="1" />
          {/* Destellos */}
          <path d="M45 0 L46 3 L45 4 L44 3 Z" fill="#E0E7FF" opacity="0.9" />
        </svg>
        {/* Mariposas y flores */}
        <svg width="200" height="32" viewBox="0 0 200 32" fill="none">
          <path d="M0 16 Q50 6 100 16 Q150 26 200 16" stroke="#4F46E5" strokeWidth="0.8" fill="none" opacity="0.4" />
          {/* Mariposa izq */}
          <g transform="translate(40,16)">
            <path d="M0 0 Q-10 -10 -18 -4 Q-10 2 0 0" fill="#4F46E5" opacity="0.5" />
            <path d="M0 0 Q-10 10 -18 4 Q-10 -2 0 0" fill="#4F46E5" opacity="0.35" />
            <path d="M0 0 Q10 -10 18 -4 Q10 2 0 0" fill="#4F46E5" opacity="0.5" />
            <path d="M0 0 Q10 10 18 4 Q10 -2 0 0" fill="#4F46E5" opacity="0.35" />
            <circle cx="0" cy="0" r="2" fill="#4F46E5" opacity="0.8" />
          </g>
          {/* Flor central */}
          <g transform="translate(100,16)">
            {[0,60,120,180,240,300].map((a) => (
              <ellipse key={a} cx={Math.cos(a*Math.PI/180)*7} cy={Math.sin(a*Math.PI/180)*7} rx="4" ry="3" fill="#4F46E5" opacity="0.5" transform={`rotate(${a} ${Math.cos(a*Math.PI/180)*7} ${Math.sin(a*Math.PI/180)*7})`} />
            ))}
            <circle cx="0" cy="0" r="3.5" fill="#E0E7FF" opacity="0.85" />
          </g>
          {/* Mariposa der */}
          <g transform="translate(160,16)">
            <path d="M0 0 Q-10 -10 -18 -4 Q-10 2 0 0" fill="#4F46E5" opacity="0.5" />
            <path d="M0 0 Q-10 10 -18 4 Q-10 -2 0 0" fill="#4F46E5" opacity="0.35" />
            <path d="M0 0 Q10 -10 18 -4 Q10 2 0 0" fill="#4F46E5" opacity="0.5" />
            <path d="M0 0 Q10 10 18 4 Q10 -2 0 0" fill="#4F46E5" opacity="0.35" />
            <circle cx="0" cy="0" r="2" fill="#4F46E5" opacity="0.8" />
          </g>
        </svg>
      </div>
    );
  }

  if (tipo === "graduacion") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "6px 0" }}>
        {/* Birrete de graduación */}
        <svg width="90" height="60" viewBox="0 0 90 60" fill="none">
          {/* Borla */}
          <line x1="68" y1="18" x2="72" y2="38" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          <circle cx="72" cy="40" r="4" fill="#4F46E5" opacity="0.75" />
          {/* Tablero superior */}
          <path d="M45 6 L82 22 L45 38 L8 22 Z" fill="rgba(79,70,229,0.18)" stroke="#4F46E5" strokeWidth="2.2" strokeLinejoin="round" />
          {/* Parte superior brillante */}
          <path d="M45 6 L82 22 L45 26 L8 22 Z" fill="rgba(79,70,229,0.12)" />
          {/* Cuerpo del birrete */}
          <path d="M24 26 L24 42 Q45 50 66 42 L66 26" stroke="#4F46E5" strokeWidth="2" fill="rgba(79,70,229,0.1)" strokeLinejoin="round" />
          {/* Diploma */}
          <rect x="12" y="40" width="22" height="14" rx="2" stroke="#4F46E5" strokeWidth="1.5" fill="rgba(79,70,229,0.08)" />
          <line x1="15" y1="45" x2="31" y2="45" stroke="#4F46E5" strokeWidth="1" opacity="0.5" />
          <line x1="15" y1="49" x2="28" y2="49" stroke="#4F46E5" strokeWidth="1" opacity="0.4" />
          <path d="M29 38 Q33 36 34 40 Q33 44 29 42 Z" fill="#4F46E5" opacity="0.6" />
        </svg>
        {/* Estrellas y destellos */}
        <svg width="200" height="28" viewBox="0 0 200 28" fill="none">
          <path d="M0 14 Q50 5 100 14 Q150 23 200 14" stroke="#4F46E5" strokeWidth="0.8" fill="none" opacity="0.4" />
          {[20, 60, 100, 140, 180].map((x, i) => (
            <g key={x} transform={`translate(${x},14)`}>
              <path d={`M0 -${i===2?7:5} L1.5 -2 L${i===2?7:5} 0 L1.5 2 L0 ${i===2?7:5} L-1.5 2 L-${i===2?7:5} 0 L-1.5 -2 Z`} fill="#4F46E5" opacity={i===2?0.9:0.6} />
            </g>
          ))}
        </svg>
      </div>
    );
  }

  if (tipo === "cumpleaños") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "6px 0" }}>
        {/* Pastel con globos */}
        <svg width="110" height="60" viewBox="0 0 110 60" fill="none">
          {/* Globo izq */}
          <ellipse cx="20" cy="20" rx="12" ry="15" fill="rgba(79,70,229,0.25)" stroke="#4F46E5" strokeWidth="1.8" />
          <line x1="20" y1="35" x2="30" y2="52" stroke="#4F46E5" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
          {/* Globo der */}
          <ellipse cx="90" cy="18" rx="12" ry="15" fill="rgba(79,70,229,0.2)" stroke="#4F46E5" strokeWidth="1.8" />
          <line x1="90" y1="33" x2="80" y2="52" stroke="#4F46E5" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
          {/* Pastel */}
          <rect x="28" y="38" width="54" height="20" rx="4" fill="rgba(79,70,229,0.18)" stroke="#4F46E5" strokeWidth="2" />
          <rect x="32" y="30" width="46" height="12" rx="3" fill="rgba(79,70,229,0.12)" stroke="#4F46E5" strokeWidth="1.5" />
          {/* Velas */}
          {[40, 55, 70].map((x) => (
            <g key={x}>
              <rect x={x-2} y="18" width="4" height="13" rx="2" fill="#4F46E5" opacity="0.7" />
              <ellipse cx={x} cy="17" rx="3" ry="4" fill="#E0E7FF" opacity="0.9" />
            </g>
          ))}
          {/* Decoración pastel */}
          <path d="M28 42 Q55 36 82 42" stroke="#E0E7FF" strokeWidth="1" fill="none" opacity="0.5" />
        </svg>
        {/* Confeti */}
        <svg width="200" height="24" viewBox="0 0 200 24" fill="none">
          {[15,35,55,80,100,120,145,165,185].map((x,i) => (
            <rect key={x} x={x} y={i%2===0?4:10} width="6" height="6" rx="1" fill="#4F46E5" opacity={0.4+i*0.05} transform={`rotate(${i*25} ${x+3} ${(i%2===0?4:10)+3})`} />
          ))}
        </svg>
      </div>
    );
  }

  // otro / default
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "6px 0" }}>
      <svg width="160" height="36" viewBox="0 0 160 36" fill="none">
        <path d="M0 18 Q40 6 80 18 Q120 30 160 18" stroke="#4F46E5" strokeWidth="1" fill="none" opacity="0.5" />
        {[20,50,80,110,140].map((x,i) => (
          <g key={x} transform={`translate(${x},18)`}>
            <path d={`M0 -${i===2?8:5} L1.8 -2 L${i===2?8:5} 0 L1.8 2 L0 ${i===2?8:5} L-1.8 2 L-${i===2?8:5} 0 L-1.8 -2 Z`} fill="#4F46E5" opacity={i===2?0.9:0.55} />
          </g>
        ))}
      </svg>
    </div>
  );
}

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
            stroke="#4F46E5"
            strokeWidth="1"
            fill="none"
            opacity="0.6"
          />
          <circle cx="0" cy="7" r="1.5" fill="#4F46E5" opacity="0.5" />
          <circle cx="60" cy="7" r="1.5" fill="#4F46E5" opacity="0.5" />
        </svg>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 1 L9.5 6.5 L15 6.5 L10.5 10 L12 15 L8 11.5 L4 15 L5.5 10 L1 6.5 L6.5 6.5 Z"
            fill="#4F46E5"
            opacity="0.7"
          />
        </svg>
        <svg width="60" height="14" viewBox="0 0 60 14" fill="none">
          <path
            d="M0 7 Q15 14 30 7 Q45 0 60 7"
            stroke="#4F46E5"
            strokeWidth="1"
            fill="none"
            opacity="0.6"
          />
          <circle cx="0" cy="7" r="1.5" fill="#4F46E5" opacity="0.5" />
          <circle cx="60" cy="7" r="1.5" fill="#4F46E5" opacity="0.5" />
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
            "linear-gradient(to right, transparent, rgba(79,70,229,0.4))",
        }}
      />
      <svg width="8" height="8" viewBox="0 0 8 8" fill="#4F46E5" opacity="0.6">
        <rect x="2" y="0" width="4" height="4" transform="rotate(45 4 4)" />
      </svg>
      <div
        style={{
          flex: 1,
          height: 1,
          background:
            "linear-gradient(to left, transparent, rgba(79,70,229,0.4))",
        }}
      />
    </div>
  );
}

// ─── MusicPlayer con autoplay ─────────────────────────────────────────────────
function MusicPlayer({ url, nombre }: { url: string; nombre?: string | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    // Strategy: muted autoplay (always allowed) → unmute after 300ms
    // Fallback: wait for first user gesture
    const startMuted = () => {
      a.muted = true;
      a.play()
        .then(() => {
          setTimeout(() => {
            a.muted = false;
            setPlaying(true);
          }, 300);
        })
        .catch(() => {
          // Muted play also blocked → wait for interaction
          const onInteract = () => {
            a.muted = false;
            a.play().then(() => setPlaying(true)).catch(() => {});
            cleanup();
          };
          const cleanup = () => {
            document.removeEventListener("click", onInteract);
            document.removeEventListener("touchstart", onInteract);
          };
          document.addEventListener("click", onInteract, { once: true });
          document.addEventListener("touchstart", onInteract, { once: true });
        });
    };

    startMuted();

    return () => {
      a.pause();
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#4F46E5">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#4F46E5">
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

// ─── Galería de fotos del lugar ───────────────────────────────────────────────
function GaleriaLugar({ fotos, lugar }: { fotos: string[]; lugar?: string }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [indice, setIndice] = useState(0);
  const validas = fotos.filter(Boolean);
  if (validas.length === 0) return null;

  function prev() {
    setIndice((i) => (i - 1 + validas.length) % validas.length);
  }
  function next() {
    setIndice((i) => (i + 1) % validas.length);
  }

  return (
    <>
      {/* Thumbnails */}
      <div>
        <div className="foto-lugar-label">{lugar || "El lugar"}</div>
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
          <IcoImages />
          Ver{" "}
          {validas.length === 1
            ? "la foto del lugar"
            : `todas las fotos (${validas.length})`}
        </button>
      </div>

      {/* Modal lightbox */}
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
            {lugar && <div className="lightbox-caption">{lugar}</div>}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Subir fotos del invitado (máx 5) ────────────────────────────────────────
function SubirFotosInvitado({
  invitadoId,
  eventoId,
}: {
  invitadoId: string;
  eventoId: string;
  token?: string;
}) {
  const [fotos, setFotos] = useState<string[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [cargado, setCargado] = useState(false);
  const [verFotos, setVerFotos] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const MAX = 5;

  useEffect(() => {
    cargarFotos();
  }, []);

  async function cargarFotos() {
    const { data } = await supabase
      .from("fotos")
      .select("url")
      .eq("invitado_id", invitadoId)
      .order("created_at", { ascending: true });
    if (data) setFotos(data.map((f) => f.url).filter(Boolean));
    setCargado(true);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const disponibles = MAX - fotos.length;
    const seleccionadas = files.slice(0, disponibles);
    setSubiendo(true);
    for (const file of seleccionadas) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${eventoId}/${invitadoId}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { data: up, error } = await supabase.storage
        .from("fotos-eventos")
        .upload(path, file, { upsert: false });
      if (!error && up) {
        const { data: urlData } = supabase.storage
          .from("fotos-eventos")
          .getPublicUrl(up.path);
        const url = urlData?.publicUrl;
        if (url) {
          await supabase.from("fotos").insert({
            evento_id: eventoId,
            invitado_id: invitadoId,
            url,
            path: up.path,
            estado: "aprobada",
          });
          setFotos((prev) => [...prev, url]);
        }
      }
    }
    setSubiendo(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  if (!cargado) return null;

  const lleno = fotos.length >= MAX;

  return (
    <div className="fotos-inv-wrap">
      {/* Input oculto */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleFile}
      />

      {/* Botón principal de subir — siempre visible */}
      <button
        className="btn-accion-full"
        onClick={() => !lleno && fileRef.current?.click()}
        disabled={subiendo || lleno}
        style={{ opacity: lleno ? 0.75 : 1, cursor: lleno ? "default" : "pointer" }}
      >
        <div className="btn-accion-ico">
          {subiendo ? (
            <div className="spinner" style={{ width: 20, height: 20 }} />
          ) : (
            <IcoCamera />
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, textAlign: "left", flex: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink2)" }}>
            {subiendo ? "Subiendo fotos..." : lleno ? "✓ Fotos subidas (máx. 5)" : "Subir mis fotos del evento"}
          </span>
          <span style={{ fontSize: 11, color: "var(--ink3)" }}>
            {lleno
              ? "Ya alcanzaste el máximo de 5 fotos"
              : `${fotos.length} de ${MAX} fotos · toca para agregar`}
          </span>
        </div>
        {fotos.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setVerFotos(!verFotos); }}
            style={{ background: "none", border: "none", padding: "4px 6px", cursor: "pointer", color: "var(--ink3)", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}
          >
            {verFotos ? "Ocultar" : `Ver (${fotos.length})`}
          </button>
        )}
        {!lleno && (
          <svg style={{ flexShrink: 0 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        )}
      </button>

      {/* Grid de miniaturas — se muestra al tocar "Ver" */}
      {verFotos && fotos.length > 0 && (
        <div className="fotos-inv-grid" style={{ marginTop: 10 }}>
          {fotos.map((src, i) => (
            <div key={i} className="fotos-inv-thumb">
              <img src={src} alt={`Foto ${i + 1}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Canvas generador de tarjeta ──────────────────────────────────────────────
async function generarTarjetaCanvas(
  invitado: Invitado,
  evento: Evento,
  origin: string,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const W = 800,
      H = 1050;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve(null);
      return;
    }
    // Fondo exterior: beige muy suave para enmarcar la tarjeta
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, "#F8FAFC");
    bgGrad.addColorStop(0.5, "#EEF2FF");
    bgGrad.addColorStop(1, "#F8FAFC");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    const cX = 50,
      cY = 80,
      cW = W - 100,
      cH = H - 160,
      r = 36;
    // Sombra suave de la tarjeta
    ctx.save();
    ctx.shadowColor = "rgba(15,23,42,0.18)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 14;
    rrFill(ctx, cX, cY, cW, cH, r, "#FFFFFF");
    ctx.restore();
    rrFill(ctx, cX, cY, cW, cH, r, "#FFFFFF");
    // Header: gradiente índigo sólido (profesional, contrastado)
    const hH = 260;
    ctx.save();
    ctx.beginPath();
    rrPath(ctx, cX, cY, cW, hH, { tl: r, tr: r, bl: 0, br: 0 });
    ctx.clip();
    const hGrad = ctx.createLinearGradient(cX, cY, cX + cW, cY + hH);
    hGrad.addColorStop(0, "#3730A3");
    hGrad.addColorStop(1, "#4F46E5");
    ctx.fillStyle = hGrad;
    ctx.fillRect(cX, cY, cW, hH);
    const nombres = (() => {
      if (invitado.nombres_personas) {
        try {
          const p = JSON.parse(invitado.nombres_personas);
          if (Array.isArray(p) && p.length > 1) return p;
        } catch {}
      }
      return [invitado.nombre];
    })();
    const saludo =
      nombres.length > 1
        ? `${nombres.slice(0, 2).join(" & ")}`
        : `${invitado.nombre}`;
    // Textos del header (blanco sobre índigo)
    ctx.font = "italic 20px 'Georgia',serif";
    ctx.fillStyle = "rgba(255,255,255,0.80)";
    ctx.textAlign = "center";
    ctx.fillText(TIPO_LABEL[evento.tipo] || "Invitación", cX + cW / 2, cY + 50);
    ctx.font = "bold 52px 'Georgia',serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(saludo, cX + cW / 2, cY + 118, cW - 80);
    ctx.font = "300 22px 'Arial'";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(`Invitación de ${evento.anfitriones}`, cX + cW / 2, cY + 158);
    ctx.font = "bold 28px 'Georgia',serif";
    ctx.fillStyle = "#E0E7FF";
    ctx.fillText(evento.nombre, cX + cW / 2, cY + 205, cW - 80);
    ctx.restore();
    // Cuerpo (texto oscuro sobre blanco)
    let dY = cY + hH + 32;
    const dX = cX + 44,
      colW = cW - 88;
    if (evento.frase_evento) {
      ctx.font = "italic 20px 'Georgia',serif";
      ctx.fillStyle = "#334155";
      ctx.textAlign = "center";
      ctx.fillText(`❝ ${evento.frase_evento} ❞`, cX + cW / 2, dY, colW);
      dY += 40;
    }
    const drawRow = (label: string, val: string) => {
      ctx.font = "700 11px 'Arial'";
      ctx.fillStyle = "#4F46E5";
      ctx.textAlign = "left";
      ctx.fillText(label.toUpperCase(), dX, dY - 4);
      ctx.font = "500 22px 'Arial'";
      ctx.fillStyle = "#0F172A";
      ctx.fillText(val, dX, dY + 20, colW);
      dY += 52;
    };
    if (evento.fecha) drawRow("Fecha", formatFechaCorta(evento.fecha));
    if (evento.hora) drawRow("Hora", formatHora(evento.hora));
    if (evento.lugar) drawRow("Lugar", evento.lugar);
    if (evento.musica_nombre) drawRow("Canción", evento.musica_nombre);
    if (evento.fecha_limite_confirmacion)
      drawRow(
        "Confirmar antes del",
        formatFechaCorta(evento.fecha_limite_confirmacion),
      );
    dY += 6;
    ctx.beginPath();
    ctx.moveTo(cX + 44, dY);
    ctx.lineTo(cX + cW - 44, dY);
    ctx.strokeStyle = "rgba(79,70,229,0.22)";
    ctx.lineWidth = 1;
    ctx.stroke();
    dY += 22;
    if (evento.mensaje_invitacion) {
      ctx.font = "italic 18px 'Georgia',serif";
      ctx.fillStyle = "#475569";
      ctx.textAlign = "center";
      ctx.fillText(`"${evento.mensaje_invitacion}"`, cX + cW / 2, dY, colW);
      dY += 36;
    }
    // CTA primario (índigo lleno, texto blanco)
    const bW = colW,
      bH = 60,
      bR = 14,
      bGap = 10;
    const gBtn = ctx.createLinearGradient(dX, dY, dX + bW, dY + bH);
    gBtn.addColorStop(0, "#3730A3");
    gBtn.addColorStop(1, "#4F46E5");
    rrFill(ctx, dX, dY, bW, bH, bR, gBtn);
    ctx.font = "bold 24px 'Arial'";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText("✅  Confirmar asistencia", dX + bW / 2, dY + 38);
    dY += bH + bGap;
    // CTA secundarios (outline índigo sobre fondo pálido)
    rrFill(ctx, dX, dY, bW, bH, bR, "#EEF2FF");
    ctx.strokeStyle = "rgba(79,70,229,0.45)";
    ctx.lineWidth = 1.5;
    rrStroke(ctx, dX, dY, bW, bH, bR);
    ctx.font = "bold 22px 'Arial'";
    ctx.fillStyle = "#3730A3";
    ctx.textAlign = "center";
    ctx.fillText("📸  Subir foto al muro", dX + bW / 2, dY + 38);
    dY += bH + bGap;
    rrFill(ctx, dX, dY, bW, bH, bR, "#EEF2FF");
    ctx.strokeStyle = "rgba(79,70,229,0.45)";
    ctx.lineWidth = 1.5;
    rrStroke(ctx, dX, dY, bW, bH, bR);
    ctx.font = "bold 22px 'Arial'";
    ctx.fillStyle = "#3730A3";
    ctx.textAlign = "center";
    ctx.fillText("💌  Dejar mi deseo", dX + bW / 2, dY + 38);
    dY += bH + 14;
    // Link + firma
    ctx.font = "400 15px 'Arial'";
    ctx.fillStyle = "#64748B";
    ctx.textAlign = "center";
    ctx.fillText(
      `${origin}/confirmar/${invitado.token}`,
      cX + cW / 2,
      dY,
      colW,
    );
    ctx.font = "bold 17px 'Arial'";
    ctx.fillStyle = "#4F46E5";
    ctx.textAlign = "center";
    ctx.fillText("Eventix · Invitaciones digitales", cX + cW / 2, cY + cH - 28);
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.95);
  });
}

function rrFill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string | CanvasGradient,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fillStyle = fill as string;
  ctx.fill();
}
function rrStroke(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.stroke();
}
function rrPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  c: { tl: number; tr: number; bl: number; br: number },
) {
  const { tl, tr, bl, br } = c;
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

// ─── CountdownTimer ───────────────────────────────────────────────────────────
function CountdownTimer({ fecha, hora }: { fecha: string; hora?: string | null }) {
  const [diff, setDiff] = useState<{ d:number; h:number; m:number; s:number; pasado:boolean } | null>(null);

  useEffect(() => {
    function calcular() {
      const fechaStr = fecha.split("T")[0];
      const horaStr = hora ? hora.replace(".", ":").slice(0,5) : "00:00";
      const target = new Date(`${fechaStr}T${horaStr}:00`);
      const now = new Date();
      const ms = target.getTime() - now.getTime();
      if (ms <= 0) { setDiff({ d:0, h:0, m:0, s:0, pasado:true }); return; }
      const s = Math.floor(ms/1000);
      setDiff({ d:Math.floor(s/86400), h:Math.floor((s%86400)/3600), m:Math.floor((s%3600)/60), s:s%60, pasado:false });
    }
    calcular();
    const t = setInterval(calcular, 1000);
    return () => clearInterval(t);
  }, [fecha, hora]);

  if (!diff) return null;
  if (diff.pasado) return (
    <div style={{ textAlign:"center", padding:"14px 0 6px" }}>
      <span style={{ fontSize:12, color:"var(--gold-dark)", fontWeight:600, letterSpacing:".3px" }}>¡El evento ya ocurrió!</span>
    </div>
  );

  const pad = (n:number) => String(n).padStart(2,"0");

  return (
    <div className="countdown-wrap">
      <div className="countdown-label">Faltan</div>
      <div className="countdown-grid">
        {[{ val:diff.d, unit:"días" }, { val:diff.h, unit:"horas" }, { val:diff.m, unit:"min" }, { val:diff.s, unit:"seg" }].map(({val,unit}) => (
          <div key={unit} className="countdown-block">
            <div className="countdown-num">{unit==="días" ? diff.d : pad(val)}</div>
            <div className="countdown-unit">{unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Vestimenta data ──────────────────────────────────────────────────────────
const TIPOS_VESTIMENTA_MAP: Record<string, { label: string; desc: string }> = {
  "formal":      { label: "Etiqueta formal",  desc: "Traje o smoking / vestido de gala" },
  "semi-formal": { label: "Semi-formal",       desc: "Traje casual / vestido elegante" },
  "cocktail":    { label: "Cocktail",          desc: "Vestido corto o de cóctel" },
  "casual-chic": { label: "Casual elegante",   desc: "Ropa bonita pero cómoda" },
  "casual":      { label: "Casual",            desc: "Ropa cómoda y relajada" },
  "tematico":    { label: "Temático",          desc: "Disfraz o tema especial" },
  "blanco":      { label: "Todo de blanco",    desc: "Vestimenta en color blanco" },
  "colores":     { label: "Paleta de colores", desc: "Colores específicos indicados" },
};

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return (r*299 + g*587 + b*114)/1000 > 140;
}

function VestimentaCard({ evento }: { evento: { vestimenta_tipo?: string | null; vestimenta_colores?: string | null; vestimenta_nota?: string | null } }) {
  const tipo = evento.vestimenta_tipo ? TIPOS_VESTIMENTA_MAP[evento.vestimenta_tipo] : null;
  const colores = evento.vestimenta_colores ? evento.vestimenta_colores.split(",").filter(Boolean) : [];

  return (
    <div style={{
      background: "linear-gradient(135deg,rgba(79,70,229,0.06) 0%,rgba(79,70,229,0.10) 100%)",
      border: "1.5px solid rgba(79,70,229,0.28)",
      borderRadius: 18,
      padding: "16px 18px",
      margin: "4px 0 8px",
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:"rgba(79,70,229,0.10)", border:"1px solid rgba(79,70,229,0.22)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dark)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.5 18H3.5a1 1 0 0 1-.78-1.63L12 6.5"/>
            <path d="M12 6.5V4.5"/>
            <circle cx="12" cy="3.5" r="1"/>
            <path d="M8.5 18c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:"var(--gold-dark)", textTransform:"uppercase", letterSpacing:".8px" }}>Vestimenta</div>
          <div style={{ fontSize:13, fontWeight:600, color:"var(--ink)", marginTop:1 }}>Código de vestimenta</div>
        </div>
      </div>

      {/* Tipo */}
      {tipo && (
        <div style={{
          display:"flex", alignItems:"center", gap:12,
          background:"rgba(238,242,255,0.7)", borderRadius:12,
          border:"1px solid rgba(79,70,229,0.15)",
          padding:"12px 14px", marginBottom: colores.length > 0 || evento.vestimenta_nota ? 10 : 0,
        }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--gold-dark)", flexShrink:0, opacity:0.7 }}/>
          <div>
            <div style={{ fontSize:15, fontWeight:600, color:"var(--ink)", fontFamily:"'Cormorant Garamond',serif" }}>{tipo.label}</div>
            <div style={{ fontSize:11, color:"var(--ink3)", marginTop:2, lineHeight:1.4 }}>{tipo.desc}</div>
          </div>
        </div>
      )}

      {/* Paleta de colores */}
      {colores.length > 0 && (
        <div style={{ marginBottom: evento.vestimenta_nota ? 10 : 0 }}>
          <div style={{ fontSize:10, fontWeight:600, color:"var(--ink3)", textTransform:"uppercase", letterSpacing:".6px", marginBottom:8 }}>
            Paleta sugerida
          </div>
          <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
            {colores.map((hex, i) => (
              <div key={i} style={{
                width:36, height:36, borderRadius:10,
                background:hex,
                border:isLightColor(hex) ? "1.5px solid rgba(0,0,0,0.12)" : "1.5px solid rgba(255,255,255,0.08)",
                boxShadow:"0 2px 8px rgba(0,0,0,0.12)",
              }}/>
            ))}
          </div>
        </div>
      )}

      {/* Nota */}
      {evento.vestimenta_nota && (
        <p style={{
          fontSize:12, fontStyle:"italic", color:"var(--ink2)", lineHeight:1.6,
          borderTop:"1px solid rgba(79,70,229,0.2)", paddingTop:10, marginTop:4,
        }}>
          {evento.vestimenta_nota}
        </p>
      )}
    </div>
  );
}

// ─── RegaloCard ───────────────────────────────────────────────────────────────
function RegaloCard({ evento }: { evento: { regalo_banco?: string | null; regalo_titular?: string | null; regalo_cuenta?: string | null; regalo_mensaje?: string | null } }) {
  const [copiado, setCopiado] = useState(false);

  function copiarCuenta() {
    if (!evento.regalo_cuenta) return;
    navigator.clipboard.writeText(evento.regalo_cuenta).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }).catch(() => {
      // fallback manual
      const el = document.createElement("textarea");
      el.value = evento.regalo_cuenta!;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  return (
    <div style={{
      background: "linear-gradient(135deg,rgba(79,70,229,0.08) 0%,rgba(79,70,229,0.12) 100%)",
      border: "1.5px solid rgba(79,70,229,0.3)",
      borderRadius: 18,
      padding: "18px 18px 16px",
      margin: "4px 0 8px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:"rgba(79,70,229,0.10)", border:"1px solid rgba(79,70,229,0.22)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dark)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 7V5a2 2 0 0 0-4 0v2"/>
            <path d="M12 7V5a2 2 0 0 1 4 0v2"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gold-dark)", textTransform: "uppercase", letterSpacing: ".8px" }}>Regalo</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginTop: 1 }}>Datos para transferencia</div>
        </div>
      </div>

      {evento.regalo_mensaje && (
        <p style={{ fontSize: 12, fontStyle: "italic", color: "var(--ink2)", lineHeight: 1.6, marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid rgba(79,70,229,0.2)" }}>
          {evento.regalo_mensaje}
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {evento.regalo_banco && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".4px" }}>Banco</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{evento.regalo_banco}</span>
          </div>
        )}
        {evento.regalo_titular && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".4px" }}>Titular</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{evento.regalo_titular}</span>
          </div>
        )}
        {evento.regalo_cuenta && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 4, background: "rgba(238,242,255,0.7)", border: "1px solid rgba(79,70,229,0.25)", borderRadius: 10, padding: "10px 12px" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 3 }}>Cuenta / CLABE</div>
              <div style={{ fontFamily: "'Courier New',monospace", fontSize: 13, fontWeight: 600, color: "var(--ink)", letterSpacing: ".5px", wordBreak: "break-all" }}>
                {evento.regalo_cuenta}
              </div>
            </div>
            <button
              onClick={copiarCuenta}
              style={{
                background: copiado ? "linear-gradient(135deg,#2d7d46,#38a85c)" : "linear-gradient(135deg,#4F46E5,#E0E7FF)",
                color: copiado ? "#fff" : "#3730A3",
                border: "none", borderRadius: 10, padding: "8px 13px",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                fontFamily: "'Jost',sans-serif", whiteSpace: "nowrap",
                flexShrink: 0, transition: "all .2s",
              }}
            >
              {copiado ? "✓ Copiado" : "Copiar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ProgramaCard ─────────────────────────────────────────────────────────────
function ProgramaCard({ items }: { items: ItemItinerario[] }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border-mid)",
      borderRadius: "var(--r-sm)", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 18px 12px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: "rgba(79,70,229,0.10)", border: "1px solid rgba(79,70,229,0.22)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dark)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 2 }}>Programa del evento</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, fontWeight: 600, color: "var(--ink)" }}>Itinerario</div>
        </div>
      </div>
      {/* Items */}
      <div style={{ padding: "6px 0 8px" }}>
        {items.map((item, idx) => (
          <div key={item.id} style={{
            display: "flex", alignItems: "flex-start", gap: 14,
            padding: "12px 18px",
            borderBottom: idx < items.length - 1 ? "1px solid var(--border)" : "none",
          }}>
            {/* Línea de tiempo */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 32 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(79,70,229,0.12)",
                border: "1.5px solid rgba(79,70,229,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, lineHeight: 1,
              }}>
                {item.icono ? item.icono : (
                  <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--gold-dark)", opacity:0.8 }}/>
                )}
              </div>
              {idx < items.length - 1 && (
                <div style={{ width: 1, flex: 1, minHeight: 12, background: "linear-gradient(180deg,rgba(79,70,229,0.3),transparent)", marginTop: 4 }} />
              )}
            </div>
            {/* Contenido */}
            <div style={{ flex: 1, paddingTop: 4 }}>
              {item.hora && (
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 3 }}>
                  {item.hora}
                </div>
              )}
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, fontWeight: 600, color: "var(--ink)", lineHeight: 1.2, marginBottom: item.descripcion ? 4 : 0 }}>
                {item.titulo}
              </div>
              {item.descripcion && (
                <div style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.6 }}>
                  {item.descripcion}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
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
    "vista" | "form" | "confirmado" | "rechazado"
  >("vista");
  const [numPersonas, setNumPersonas] = useState(1);
  const [confirmando, setConfirmando] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [destroying, setDestroying] = useState(false);
  const [generandoTarjeta, setGenerandoTarjeta] = useState(false);
  const [tarjetaPreview, setTarjetaPreview] = useState<string | null>(null);
  const [mostrarModalTarjeta, setMostrarModalTarjeta] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showEventixPromo, setShowEventixPromo] = useState(false);
  const [itinerario, setItinerario] = useState<ItemItinerario[]>([]);
  // Mesa self-selection
  type MesaConOcupacion = { id: string; nombre: string; capacidad: number; ocupados: number };
  const [mesasDisponibles, setMesasDisponibles] = useState<MesaConOcupacion[]>([]);
  const [asignandoMesa, setAsignandoMesa] = useState(false);
  const [mesaConfirmada, setMesaConfirmada] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    document.title = "Eventix — Tu invitación";
    setTimeout(() => setMounted(true), 80);
    cargarDatos();
  }, []);

  async function cargarDatos() {
    // Primero cargamos el invitado sin join (siempre funciona)
    const { data: inv } = await supabase
      .from("invitados")
      .select("*")
      .eq("token", token)
      .single();
    if (!inv) {
      setLoading(false);
      return;
    }
    // Intentar obtener nombre de mesa por separado (falla graciosamente si la tabla no existe aún)
    let mesa_nombre: string | null = null;
    if (inv.mesa_id) {
      try {
        const { data: mesa } = await supabase
          .from("mesas")
          .select("nombre")
          .eq("id", inv.mesa_id)
          .single();
        mesa_nombre = mesa?.nombre ?? null;
      } catch {
        // tabla mesas no migrada aún — ignorar
      }
    }
    const { data: ev } = await supabase
      .from("eventos")
      .select("*")
      .eq("id", inv.evento_id)
      .single();
    setInvitado({ ...inv, mesa_nombre });
    if (ev) setEvento(ev);
    setNumPersonas(inv.num_personas || 1);
    if (inv.estado === "confirmado") {
      setStep("confirmado");
      cargarMesasDisponibles(inv.evento_id);
    }
    if (inv.estado === "rechazado") setStep("rechazado");
    // Cargar itinerario (falla graciosamente si tabla no existe)
    try {
      const { data: iti } = await supabase
        .from("itinerario")
        .select("*")
        .eq("evento_id", inv.evento_id)
        .order("orden", { ascending: true });
      if (iti && iti.length > 0) setItinerario(iti);
    } catch { /* tabla no migrada aún */ }
    setLoading(false);
  }

  async function cargarMesasDisponibles(eventoId: string) {
    try {
      const { data: mesas } = await supabase
        .from("mesas")
        .select("id, nombre, capacidad")
        .eq("evento_id", eventoId)
        .order("nombre", { ascending: true });
      if (!mesas || mesas.length === 0) return;
      // Get occupancy per mesa
      const { data: invs } = await supabase
        .from("invitados")
        .select("mesa_id, num_personas")
        .eq("evento_id", eventoId)
        .eq("estado", "confirmado")
        .not("mesa_id", "is", null);
      const ocupMap: Record<string, number> = {};
      (invs || []).forEach((i: { mesa_id: string; num_personas: number }) => {
        ocupMap[i.mesa_id] = (ocupMap[i.mesa_id] || 0) + (i.num_personas || 1);
      });
      const lista = mesas.map((m) => ({
        id: m.id,
        nombre: m.nombre,
        capacidad: Math.min(m.capacidad ?? 5, 5),
        ocupados: ocupMap[m.id] || 0,
      }));
      setMesasDisponibles(lista);
    } catch { /* tabla no migrada aún */ }
  }

  async function elegirMesa(mesaId: string, mesaNombre: string) {
    if (!invitado || asignandoMesa) return;
    setAsignandoMesa(true);
    const { data: updated } = await supabase
      .from("invitados")
      .update({ mesa_id: mesaId })
      .eq("id", invitado.id)
      .select()
      .single();
    if (updated) {
      setInvitado({ ...updated, mesa_nombre: mesaNombre });
      setMesaConfirmada(mesaNombre);
      toast.success(`¡Mesa "${mesaNombre}" seleccionada!`);
      // Refresh occupancy
      await cargarMesasDisponibles(invitado.evento_id);
    }
    setAsignandoMesa(false);
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
    if (updated) setInvitado(updated);
    setConfirmando(false);
    setStep("confirmado");
    if (updated?.evento_id) cargarMesasDisponibles(updated.evento_id);
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
    // Si el organizador configuró que el invitado elija, o si el cupo es > 1, mostrar form
    if (invitado.cupo_elije_invitado || (invitado.num_personas || 1) > 1) {
      setStep("form");
    } else {
      await confirmarAsistencia();
    }
  }

  function confirmarYCerrar() {
    setDestroying(true);
    const canvas = canvasRef.current;
    if (!canvas) {
      redirigirFinal();
      return;
    }
    canvas.style.display = "block";
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      redirigirFinal();
      return;
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particulas = crearParticulas();
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
        redirigirFinal();
      }
    }
    animate();
  }

  function redirigirFinal() {
    setDestroying(false);
    setShowEventixPromo(true);
  }

  async function abrirModalTarjeta() {
    if (!invitado || !evento) return;
    setGenerandoTarjeta(true);
    setMostrarModalTarjeta(true);
    const blob = await generarTarjetaCanvas(
      invitado,
      evento,
      window.location.origin,
    );
    if (blob) setTarjetaPreview(URL.createObjectURL(blob));
    setGenerandoTarjeta(false);
  }

  function cerrarModal() {
    setMostrarModalTarjeta(false);
    if (tarjetaPreview) {
      URL.revokeObjectURL(tarjetaPreview);
      setTarjetaPreview(null);
    }
  }

  async function compartirTarjeta() {
    if (!invitado || !evento || !tarjetaPreview) return;
    const origin = window.location.origin;
    const link1 = `${origin}/confirmar/${invitado.token}`;
    const link2 = `${origin}/muro/${invitado.evento_id}?token=${invitado.token}`;
    try {
      const response = await fetch(tarjetaPreview);
      const blob = await response.blob();
      const file = new File(
        [blob],
        `invitacion_${invitado.nombre.replace(/\s/g, "_")}.png`,
        { type: "image/png" },
      );
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: `Invitación — ${evento.nombre}`,
          text: `✅ Confirmar: ${link1}\n📸 Foto: ${link2}\n💌 Deseo: ${link2}`,
        });
      } else {
        const a = document.createElement("a");
        a.href = tarjetaPreview;
        a.download = `invitacion_${invitado.nombre.replace(/\s/g, "_")}.png`;
        a.click();
        const texto = encodeURIComponent(
          `🎉 *${evento.nombre}*\n\nHola *${invitado.nombre}*, aquí están tus accesos:\n\n✅ Confirmar:\n${link1}\n\n📸 Foto:\n${link2}\n\n💌 Deseo:\n${link2}`,
        );
        setTimeout(
          () => window.open(`https://wa.me/?text=${texto}`, "_blank"),
          800,
        );
      }
    } catch (err) {
      console.error("Error al compartir:", err);
    }
  }

  function descargarTarjeta() {
    if (!tarjetaPreview || !invitado) return;
    const a = document.createElement("a");
    a.href = tarjetaPreview;
    a.download = `invitacion_${invitado.nombre.replace(/\s/g, "_")}.png`;
    a.click();
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

  // Fotos del lugar (puede haber hasta 3 campos: foto_lugar_url, foto_lugar_2_url, foto_lugar_3_url)
  const fotosLugar = evento
    ? ([
        evento.foto_lugar_url,
        evento.foto_lugar_2_url,
        evento.foto_lugar_3_url,
      ].filter(Boolean) as string[])
    : [];

  // ─── TEMAS (rediseño UX/UI profesional, paleta clara) ──────────────────────
  const TEMAS: Record<string, string> = {
    clasico: `
      --gold:#4F46E5;--gold-dark:#3730A3;--gold-light:#E0E7FF;--gold-pale:#EEF2FF;
      --dark:#F8FAFC;--dark2:#EEF2FF;--ink:#0F172A;--ink2:#334155;--ink3:#4F46E5;
      --cream:#F8FAFC;--cream2:#F1F5F9;--surface:#FFFFFF;
      --on-dark:#1E1B4B;--on-dark-sub:#4338CA;
      --border:rgba(79,70,229,0.14);--border-mid:rgba(79,70,229,0.28);
      --shadow:0 8px 28px rgba(15,23,42,0.06);--shadow-lg:0 20px 48px rgba(15,23,42,0.10);
    `,
    rosado: `
      --gold:#E11D74;--gold-dark:#9D174D;--gold-light:#FCE7F3;--gold-pale:#FDF2F8;
      --dark:#FFF7FB;--dark2:#FCE7F3;--ink:#1F1226;--ink2:#4B2545;--ink3:#9D174D;
      --cream:#FFF7FB;--cream2:#FCE7F3;--surface:#FFFFFF;
      --on-dark:#4A1042;--on-dark-sub:#9D174D;
      --border:rgba(225,29,116,0.14);--border-mid:rgba(225,29,116,0.28);
      --shadow:0 8px 28px rgba(74,16,66,0.06);--shadow-lg:0 20px 48px rgba(74,16,66,0.10);
    `,
    esmeralda: `
      --gold:#059669;--gold-dark:#065F46;--gold-light:#D1FAE5;--gold-pale:#ECFDF5;
      --dark:#F0FDF6;--dark2:#D1FAE5;--ink:#0F172A;--ink2:#334155;--ink3:#065F46;
      --cream:#F0FDF6;--cream2:#D1FAE5;--surface:#FFFFFF;
      --on-dark:#064E3B;--on-dark-sub:#059669;
      --border:rgba(5,150,105,0.14);--border-mid:rgba(5,150,105,0.28);
      --shadow:0 8px 28px rgba(6,78,59,0.06);--shadow-lg:0 20px 48px rgba(6,78,59,0.10);
    `,
  };
  const temaVars = TEMAS[evento?.tema ?? "clasico"] ?? TEMAS.clasico;

  // ─── ESTILOS ───────────────────────────────────────────────────────────────
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Jost:wght@300;400;500;600;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{font-family:'Jost',sans-serif;-webkit-font-smoothing:antialiased;background:#FFFFFF;color:#0F172A}
    :root{
      ${temaVars}
      --r:24px;--r-sm:16px;
    }
    .page{min-height:100dvh;background:var(--cream);
      background-image:radial-gradient(ellipse 80% 40% at 50% 0%,rgba(79,70,229,0.08) 0%,transparent 70%),radial-gradient(ellipse 40% 30% at 90% 100%,rgba(79,70,229,0.05) 0%,transparent 60%);
      padding-bottom:80px;opacity:0;transition:opacity .5s ease;}
    .page.vis{opacity:1}
    .page.destroying{animation:shatter .6s ease forwards}
    @keyframes shatter{0%{opacity:1;transform:scale(1)}30%{opacity:1;transform:scale(1.03)}60%{opacity:.5;transform:scale(.95)}100%{opacity:0;transform:scale(.8)}}
    @keyframes riseUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}

    .topbar{display:flex;align-items:center;gap:10px;padding:11px 16px;background:rgba(255,255,255,0.90);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:20;justify-content:space-between;}
    .topbar-left{display:flex;align-items:center;gap:10px}
    .topbar-name{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--ink);letter-spacing:.3px;line-height:1}
    .topbar-sub{font-size:9px;font-weight:600;color:var(--ink3);text-transform:uppercase;letter-spacing:1px;margin-top:1px}

    .wrap{max-width:430px;margin:0 auto;padding:22px 16px;display:flex;flex-direction:column;gap:20px}

    .inv-card{background:var(--surface);border-radius:var(--r);border:1px solid var(--border-mid);box-shadow:0 8px 48px rgba(15,23,42,.13),0 2px 8px rgba(15,23,42,.06);overflow:hidden;animation:riseUp .6s cubic-bezier(.22,1,.36,1) both;}
    /* Hero foto — limpia, sin overlays ni texto encima */
    .inv-hero{position:relative;overflow:hidden;width:100%;background:var(--dark)}
    .inv-hero-foto{width:100%;height:100%;object-fit:cover;display:block;object-position:center top;}
    .inv-hero-bg{min-height:200px;background:linear-gradient(160deg,var(--dark) 0%,var(--dark2) 100%)}
    /* Sección debajo del hero */
    .inv-tipo-badge{display:inline-flex;align-items:center;gap:7px;background:transparent;border:1px solid rgba(79,70,229,0.35);border-radius:99px;padding:5px 14px 5px 10px;font-family:'Jost',sans-serif;font-size:10px;font-weight:600;color:var(--ink3);letter-spacing:1.2px;text-transform:uppercase;}
    .inv-tipo-badge-dot{width:5px;height:5px;border-radius:50%;background:var(--gold-dark);opacity:.7;display:inline-block}
    .inv-saludo{font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:500;font-style:italic;color:var(--ink);letter-spacing:-.3px;line-height:1.2;margin-top:8px}
    .inv-anfitrion{font-size:12px;color:var(--ink3);font-weight:400;letter-spacing:.3px;margin-top:4px}
    .inv-evento-nombre{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--ink);letter-spacing:.3px;margin-top:6px}
    .inv-body{padding:24px 20px;display:flex;flex-direction:column;gap:18px}
    .inv-frase{font-family:'Cormorant Garamond',serif;font-size:17px;font-style:italic;font-weight:400;color:var(--ink2);text-align:center;line-height:1.6;padding:2px 8px}
    .inv-nombres{background:var(--cream);border:1px solid var(--border);border-radius:var(--r-sm);padding:16px 18px}
    .inv-nombres-title{font-size:9px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:1.4px;margin-bottom:12px}
    .inv-nombre-item{display:flex;align-items:center;gap:11px;font-family:'Cormorant Garamond',serif;font-size:17px;color:var(--ink);font-weight:500;margin-bottom:8px}
    .inv-nombre-item:last-child{margin-bottom:0}
    .inv-nombre-av{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--gold-dark),var(--gold));color:#FFFFFF;font-family:'Cormorant Garamond',serif;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:none;box-shadow:0 2px 6px rgba(79,70,229,0.25)}
    .detalles{background:var(--cream);border:1px solid var(--border);border-radius:var(--r-sm);padding:18px 18px;display:flex;flex-direction:column;gap:16px}
    .detalle-fila{display:flex;align-items:flex-start;gap:14px}
    .detalle-ico-wrap{width:38px;height:38px;border-radius:11px;background:var(--surface);border:1px solid var(--border-mid);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 1px 4px rgba(15,23,42,.05)}
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
    .galeria-thumb-more{position:absolute;inset:0;background:rgba(15,23,42,0.60);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:var(--gold-light)}
    .btn-ver-fotos{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;background:var(--cream);border:1.5px solid var(--border-mid);border-radius:12px;padding:11px 16px;font-size:13px;font-weight:600;color:var(--ink2);cursor:pointer;transition:all .15s;font-family:'Jost',sans-serif;}
    .btn-ver-fotos:hover{background:var(--gold-pale);border-color:var(--gold);color:var(--gold-dark)}

    /* Lightbox */
    .lightbox-overlay{position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,0.92);display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease;padding:16px}
    .lightbox-inner{position:relative;width:100%;max-width:480px;display:flex;flex-direction:column;align-items:center;gap:14px}
    .lightbox-img-wrap{width:100%;border-radius:16px;overflow:hidden;box-shadow:0 16px 60px rgba(0,0,0,0.5)}
    .lightbox-img{width:100%;max-height:70vh;object-fit:contain;display:block;background:#000}
    .lightbox-close{position:absolute;top:-12px;right:-12px;width:36px;height:36px;border-radius:50%;background:rgba(79,70,229,0.15);border:1.5px solid rgba(79,70,229,0.4);color:var(--gold-light);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2}
    .lightbox-nav{position:absolute;top:50%;transform:translateY(-60%);width:40px;height:40px;border-radius:50%;background:rgba(15,23,42,0.7);border:1.5px solid rgba(79,70,229,0.3);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s}
    .lightbox-nav:hover{background:rgba(79,70,229,0.2)}
    .lightbox-prev{left:-20px}
    .lightbox-next{right:-20px}
    .lightbox-dots{display:flex;gap:7px;margin-top:4px}
    .lightbox-dot{width:7px;height:7px;border-radius:50%;background:rgba(79,70,229,0.3);cursor:pointer;transition:background .15s}
    .lightbox-dot.active{background:var(--gold)}
    .lightbox-caption{font-size:12px;color:rgba(79,70,229,0.7);font-style:italic;text-align:center}

    /* Música */
    .music-player{display:flex;align-items:center;gap:13px;background:var(--cream);border:1px solid var(--border);border-radius:var(--r-sm);padding:14px 16px;cursor:pointer;transition:background .18s,border-color .18s}
    .music-player:hover{background:var(--gold-pale);border-color:var(--border-mid)}
    .music-icon-wrap{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--gold-dark),var(--gold));display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(79,70,229,0.28)}
    .music-info{flex:1;min-width:0}
    .music-label{display:block;font-size:9px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
    .music-name{display:block;font-family:'Cormorant Garamond',serif;font-size:17px;font-style:italic;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .music-waves{display:flex;align-items:center;gap:2px;flex-shrink:0}
    .mw{width:3px;border-radius:99px;background:var(--gold);animation:mwave .8s ease-in-out infinite}
    .mw-1{height:8px;animation-delay:0s}.mw-2{height:14px;animation-delay:.1s}.mw-3{height:10px;animation-delay:.2s}.mw-4{height:16px;animation-delay:.15s}.mw-5{height:8px;animation-delay:.05s}
    @keyframes mwave{0%,100%{transform:scaleY(0.5)}50%{transform:scaleY(1)}}

    /* Mensaje */
    .inv-mensaje{background:var(--cream);border-left:3px solid var(--gold);border-radius:0 12px 12px 0;padding:14px 18px;font-family:'Cormorant Garamond',serif;font-size:17px;font-style:italic;color:var(--ink2);line-height:1.7}
    /* Deadline */
    .inv-deadline{background:#fef8f0;border:1px solid rgba(180,83,9,0.2);border-radius:var(--r-sm);padding:12px 15px;display:flex;align-items:center;gap:10px}
    .deadline-text{font-size:13px;color:#92400e;font-weight:500;line-height:1.4}
    /* Cómo llegar */
    .como-llegar-box{background:var(--cream);border:1px solid var(--border);border-radius:var(--r-sm);padding:14px 16px}
    .como-llegar-label{font-size:9px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
    .como-llegar-text{font-size:13px;color:var(--ink2);line-height:1.7}

    /* Decisión */
    .pregunta-wrap{text-align:center;padding:4px 0 2px}
    .pregunta{font-family:'Cormorant Garamond',serif;font-size:26px;font-style:italic;color:var(--ink);font-weight:400;margin-bottom:4px}
    .pregunta-sub{font-size:11px;color:var(--ink3);font-weight:500;letter-spacing:.5px}
    .grid-decision{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .btn-si{background:linear-gradient(135deg,var(--gold-dark),var(--gold));color:#fff;border:none;border-radius:var(--r-sm);padding:18px 12px;font-family:'Cormorant Garamond',serif;font-size:18px;font-style:italic;font-weight:600;cursor:pointer;box-shadow:0 8px 22px -6px rgba(79,70,229,0.40), 0 2px 6px rgba(79,70,229,0.14);transition:transform .18s,box-shadow .18s,opacity .15s;letter-spacing:.3px}
    .btn-si:hover{transform:translateY(-2px);box-shadow:0 12px 30px -6px rgba(79,70,229,0.48), 0 4px 10px rgba(79,70,229,0.18)}
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
    .cnt-val{font-family:'Cormorant Garamond',serif;font-size:44px;font-weight:400;color:var(--ink);min-width:50px;text-align:center;font-variant-numeric:tabular-nums}
    .btn-confirmar-final{width:100%;margin-top:20px;background:linear-gradient(135deg,var(--gold-dark),var(--gold));color:#fff;border:none;border-radius:var(--r-sm);padding:16px;font-family:'Cormorant Garamond',serif;font-size:18px;font-style:italic;font-weight:600;cursor:pointer;letter-spacing:.5px;box-shadow:0 8px 22px -6px rgba(79,70,229,0.42), 0 2px 6px rgba(79,70,229,0.16);transition:transform .18s,box-shadow .18s;display:flex;align-items:center;justify-content:center;gap:9px}
    .btn-confirmar-final:hover{transform:translateY(-1px)}
    .btn-confirmar-final:disabled{opacity:.65;cursor:wait}
    .spinner{width:18px;height:18px;border-radius:50%;border:2px solid rgba(79,70,229,0.3);border-top-color:var(--gold);animation:spin .7s linear infinite}

    /* Confirmado */
    .conf-card{background:var(--surface);border-radius:var(--r);border:1px solid var(--border-mid);box-shadow:var(--shadow-lg);overflow:hidden;animation:riseUp .5s cubic-bezier(.22,1,.36,1) both}
    .conf-hero{background:linear-gradient(155deg,#F8FAFC 0%,#EEF2FF 100%);padding:40px 24px 32px;text-align:center;position:relative;overflow:hidden}
    .conf-hero::before{content:'';position:absolute;inset:0;opacity:.025;background-image:radial-gradient(circle,#4F46E5 1px,transparent 1px);background-size:32px 32px}
    .conf-check{position:relative;z-index:1;width:68px;height:68px;border-radius:50%;background:rgba(79,70,229,0.10);border:1px solid rgba(79,70,229,0.35);display:flex;align-items:center;justify-content:center;margin:0 auto 22px;animation:popIn .55s .1s cubic-bezier(.22,1,.36,1) both}
    @keyframes popIn{from{transform:scale(0)}to{transform:scale(1)}}
    .conf-titulo{position:relative;z-index:1;font-family:'Cormorant Garamond',serif;font-size:40px;font-style:italic;font-weight:400;color:var(--ink);letter-spacing:-.5px;margin-bottom:8px}
    .conf-sub{position:relative;z-index:1;font-size:12px;color:var(--ink3);font-weight:500;letter-spacing:.3px}
    .conf-body{padding:22px;display:flex;flex-direction:column;gap:16px}
    .num-badge{background:var(--cream);border-radius:var(--r-sm);border:1px solid var(--border);padding:16px 20px;display:flex;align-items:center;gap:16px}
    .num-icono{width:46px;height:46px;border-radius:12px;background:var(--surface);border:1px solid var(--border-mid);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--gold-dark)}
    .num-label{font-size:9px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--ink3);margin-bottom:3px}
    .num-val{font-family:'Cormorant Garamond',serif;font-size:34px;font-weight:500;color:var(--ink);letter-spacing:-1px;line-height:1}
    .resumen{background:var(--cream);border:1px solid var(--border);border-radius:var(--r-sm);padding:16px 18px;display:flex;flex-direction:column;gap:13px}
    .res-fila{display:flex;align-items:center;gap:12px}
    .res-ico{width:34px;height:34px;border-radius:10px;background:var(--surface);border:1px solid var(--border-mid);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 1px 4px rgba(15,23,42,.05)}
    .res-texto{font-size:13px;color:var(--ink2);font-weight:400;text-transform:capitalize}
    .acciones-titulo{font-size:9px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:12px}

    /* Fotos invitado */
    .fotos-inv-wrap{background:var(--cream);border:1px solid var(--border-mid);border-radius:var(--r-sm);overflow:hidden}
    .fotos-inv-header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;cursor:pointer;transition:background .15s}
    .fotos-inv-header:hover{background:var(--gold-pale)}
    .fotos-inv-body{padding:0 16px 16px;display:flex;flex-direction:column;gap:11px;border-top:1px solid var(--border)}
    .fotos-inv-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding-top:12px}
    .fotos-inv-thumb{border-radius:8px;overflow:hidden;aspect-ratio:1;border:1px solid var(--border-mid)}
    .fotos-inv-thumb img{width:100%;height:100%;object-fit:cover;display:block}
    .btn-subir-foto{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,var(--gold-dark),var(--gold));color:#fff;border:none;border-radius:12px;padding:13px;font-size:13px;font-weight:600;font-family:'Jost',sans-serif;cursor:pointer;box-shadow:0 6px 16px -4px rgba(79,70,229,0.38);transition:transform .15s}
    .btn-subir-foto:hover{transform:translateY(-1px)}
    .btn-subir-foto:disabled{opacity:.65;cursor:wait}

    .btn-accion-ico{width:44px;height:44px;border-radius:12px;background:var(--cream2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .btn-accion-full{width:100%;background:var(--cream);border:1px solid var(--border-mid);border-radius:var(--r-sm);padding:15px 18px;display:flex;align-items:center;gap:13px;cursor:pointer;transition:all .18s;font-family:'Jost',sans-serif}
    .btn-accion-full:hover{background:var(--gold-pale);border-color:var(--gold)}
    .btn-wa{width:100%;background:linear-gradient(135deg,#1a5c36,#128C7E);color:#fff;border:none;border-radius:var(--r-sm);padding:16px;font-family:'Jost',sans-serif;font-size:14px;font-weight:600;cursor:pointer;letter-spacing:.3px;box-shadow:0 5px 20px rgba(18,140,126,0.32);transition:transform .18s;display:flex;align-items:center;justify-content:center;gap:9px}
    .btn-wa:hover{transform:translateY(-1px)}
    .btn-wa:disabled{opacity:.7;cursor:wait}
    .btn-cerrar{width:100%;background:linear-gradient(135deg,var(--gold-dark),var(--gold));color:#fff;border:none;border-radius:var(--r-sm);padding:16px;font-family:'Cormorant Garamond',serif;font-size:18px;font-style:italic;font-weight:600;cursor:pointer;letter-spacing:.3px;box-shadow:0 8px 22px -6px rgba(79,70,229,0.40);transition:transform .18s;display:flex;align-items:center;justify-content:center;gap:9px}
    .btn-cerrar:hover{transform:translateY(-1px)}

    /* Modal tarjeta */
    .modal-overlay{position:fixed;inset:0;z-index:9000;background:rgba(15,23,42,0.75);backdrop-filter:blur(14px);display:flex;align-items:flex-end;justify-content:center;animation:fadeIn .22s ease}
    .modal-sheet{width:100%;max-width:480px;background:var(--surface);border-radius:28px 28px 0 0;padding:0 0 env(safe-area-inset-bottom,20px);box-shadow:0 -16px 60px rgba(15,23,42,0.20);animation:slideUp .32s cubic-bezier(.22,1,.36,1)}
    @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
    .modal-drag{width:36px;height:4px;border-radius:2px;background:#CBD5E1;margin:14px auto 0}
    .modal-header{padding:16px 20px 12px;display:flex;align-items:center;justify-content:space-between}
    .modal-title{font-family:'Cormorant Garamond',serif;font-size:20px;font-style:italic;color:var(--ink)}
    .modal-close{width:32px;height:32px;border-radius:50%;background:var(--cream);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--ink3);font-size:18px;line-height:1}
    .tarjeta-img-wrap{margin:0 16px 14px;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,0.10);background:var(--cream);border:1px solid var(--border);min-height:200px;display:flex;align-items:center;justify-content:center}
    .tarjeta-img-wrap img{width:100%;display:block;border-radius:18px}
    .tarjeta-skeleton{width:100%;aspect-ratio:8/9;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;color:rgba(79,70,229,0.7);font-size:13px;font-weight:500}
    .tarjeta-spinner{width:34px;height:34px;border-radius:50%;border:2.5px solid rgba(79,70,229,0.2);border-top-color:var(--gold);animation:spin .75s linear infinite}
    .modal-btns{padding:0 16px 8px;display:flex;flex-direction:column;gap:10px}
    .btn-compartir-wa{width:100%;background:linear-gradient(135deg,#1a5c36,#128C7E);color:#fff;border:none;border-radius:16px;padding:16px;font-size:14px;font-weight:600;font-family:'Jost',sans-serif;cursor:pointer;box-shadow:0 5px 18px rgba(18,140,126,0.30);display:flex;align-items:center;justify-content:center;gap:9px;transition:transform .18s}
    .btn-compartir-wa:hover{transform:translateY(-1px)}
    .btn-compartir-wa:disabled{opacity:.7;cursor:wait}
    .btn-descargar{width:100%;background:var(--cream);color:var(--ink2);border:1.5px solid var(--border-mid);border-radius:16px;padding:14px;font-size:13px;font-weight:600;font-family:'Jost',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .18s}
    .btn-descargar:hover{background:var(--gold-pale);border-color:var(--gold)}
    .btn-descargar:disabled{opacity:.6;cursor:wait}
    .modal-cancelar{width:100%;background:transparent;border:none;padding:12px;font-size:13px;font-weight:500;color:var(--ink3);cursor:pointer;font-family:'Jost',sans-serif}

    /* Countdown */
    @keyframes cdPulse{0%,100%{opacity:1}50%{opacity:.75}}
    .countdown-wrap{background:linear-gradient(150deg,#F8FAFC 0%,#EEF2FF 100%);border-radius:18px;padding:20px 12px 16px;margin:4px 0 8px;text-align:center;border:1px solid rgba(79,70,229,0.15)}
    .countdown-label{font-size:9px;font-weight:700;color:rgba(79,70,229,0.55);text-transform:uppercase;letter-spacing:2px;margin-bottom:14px}
    .countdown-grid{display:flex;justify-content:center;gap:8px}
    .countdown-block{display:flex;flex-direction:column;align-items:center;background:#FFFFFF;border:1px solid rgba(79,70,229,0.14);border-radius:14px;padding:12px 10px 9px;min-width:60px;box-shadow:0 2px 6px rgba(15,23,42,0.04)}
    .countdown-num{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:500;color:var(--gold-dark);line-height:1;letter-spacing:-1px;animation:cdPulse 2s ease infinite}
    .countdown-unit{font-size:8px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:1px;margin-top:5px}

    /* Tu Mesa */
    .tu-mesa-card{
      display:flex;align-items:center;gap:14px;
      background:var(--cream);
      border:1px solid var(--border-mid);
      border-radius:16px;padding:16px 18px;margin:4px 0 8px;
      box-shadow:0 2px 12px rgba(15,23,42,.06);
    }
    .tu-mesa-icon{width:42px;height:42px;border-radius:12px;background:rgba(79,70,229,0.10);border:1px solid rgba(79,70,229,0.22);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--gold-dark)}
    .tu-mesa-info{flex:1}
    .tu-mesa-label{font-size:9px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
    .tu-mesa-nombre{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:var(--ink);letter-spacing:.3px}

    /* Rechazado */
    .rech-card{background:var(--surface);border-radius:var(--r);border:1px solid var(--border-mid);box-shadow:var(--shadow);padding:40px 26px;text-align:center;animation:riseUp .5s cubic-bezier(.22,1,.36,1) both}
    .rech-titulo{font-family:'Cormorant Garamond',serif;font-size:32px;font-style:italic;color:var(--ink);margin-bottom:12px}
    .rech-sub{font-size:14px;color:var(--ink2);line-height:1.8}

    /* Loading */
    .loading-screen{min-height:100dvh;background:#FAFBFF;display:flex;flex-direction:column;align-items:center;justify-content:center}
    .loading-spinner{width:28px;height:28px;border-radius:50%;border:2.5px solid transparent;border-top-color:#4F46E5;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    canvas#confetti-canvas{position:fixed;inset:0;z-index:9999;width:100%;height:100%;display:none;pointer-events:none}

    /* ─── QR de entrada ─── */
    .qr-entry-card{background:var(--surface);border:1.5px solid rgba(79,70,229,0.28);border-radius:18px;padding:20px 18px;text-align:center}
    .qr-entry-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:var(--gold-dark);margin-bottom:14px;display:flex;align-items:center;justify-content:center;gap:7px}
    .qr-img-wrap{width:164px;height:164px;margin:0 auto 14px;border-radius:14px;overflow:hidden;background:#fff;padding:8px;box-shadow:0 4px 18px rgba(0,0,0,.10);border:1.5px solid rgba(79,70,229,0.2)}
    .qr-img-wrap img{width:100%;height:100%;display:block;border-radius:6px}
    .qr-nombre-badge{display:inline-flex;align-items:center;gap:8px;background:var(--cream2);border:1px solid var(--border);border-radius:10px;padding:8px 14px;margin-bottom:10px}
    .qr-nombre-av{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#fff;font-family:'Cormorant Garamond',serif;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .qr-nombre-text{font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:600;color:var(--ink)}
    .qr-hint{font-size:11px;color:var(--ink3);line-height:1.6}

    /* ─── Mesa self-selection ─── */
    @keyframes mesaIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    .mesa-picker-wrap{background:var(--surface);border:1px solid var(--border-mid);border-radius:18px;overflow:hidden;animation:mesaIn .4s cubic-bezier(.22,1,.36,1) both}
    .mesa-picker-header{padding:16px 18px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px}
    .mesa-picker-ico{width:32px;height:32px;border-radius:9px;background:rgba(79,70,229,0.10);border:1px solid rgba(79,70,229,0.22);display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .mesa-picker-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:var(--gold-dark);margin-bottom:2px}
    .mesa-picker-sub{font-size:12px;color:var(--ink3);line-height:1.4}
    .mesa-list{display:flex;flex-direction:column;gap:0;max-height:320px;overflow-y:auto}
    .mesa-row{display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .15s;gap:12px}
    .mesa-row:last-child{border-bottom:none}
    .mesa-row:hover:not(.mesa-row--full):not(.mesa-row--loading){background:var(--gold-pale)}
    .mesa-row--full{opacity:.45;cursor:not-allowed}
    .mesa-row--loading{cursor:wait;opacity:.7}
    .mesa-row-name{font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:600;color:var(--ink);line-height:1}
    .mesa-row-slots{display:flex;align-items:center;gap:6px}
    .mesa-row-badge{font-size:11px;font-weight:700;padding:3px 9px;border-radius:99px;white-space:nowrap}
    .mesa-row-badge--free{background:rgba(79,70,229,0.12);color:var(--gold-dark);border:1px solid rgba(79,70,229,0.25)}
    .mesa-row-badge--full{background:rgba(0,0,0,0.05);color:var(--ink3);border:1px solid var(--border)}
    .mesa-row-arrow{color:rgba(79,70,229,0.5);flex-shrink:0}
    .mesa-confirmed-card{background:var(--cream);border:1px solid var(--border-mid);border-radius:16px;padding:15px 18px;display:flex;align-items:center;gap:14px;animation:mesaIn .4s cubic-bezier(.22,1,.36,1) both}
    .mesa-confirmed-ico{width:40px;height:40px;border-radius:11px;background:rgba(79,70,229,0.10);border:1px solid rgba(79,70,229,0.22);display:flex;align-items:center;justify-content:center;flex-shrink:0}

    /* ─── Pantalla de bienvenida ─── */
    @keyframes welcomeFadeIn{from{opacity:0}to{opacity:1}}
    @keyframes welcomeFadeOut{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(1.04)}}
    @keyframes welcomeSlideUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
    @keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}85%{opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}
    @keyframes confettiWave{0%,100%{transform:translateX(0)}25%{transform:translateX(12px)}75%{transform:translateX(-12px)}}
    @keyframes shimmer{0%,100%{opacity:.7}50%{opacity:1}}
    @keyframes starPop{0%{transform:scale(0) rotate(0deg);opacity:0}60%{transform:scale(1.2) rotate(20deg);opacity:1}100%{transform:scale(1) rotate(0deg);opacity:1}}

    .welcome-overlay{
      position:fixed;inset:0;z-index:9990;
      background:
        radial-gradient(ellipse 70% 50% at 50% 0%,rgba(79,70,229,0.09) 0%,transparent 70%),
        radial-gradient(ellipse 60% 40% at 50% 100%,rgba(129,140,248,0.07) 0%,transparent 70%),
        #FFFFFF;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:env(safe-area-inset-top,20px) 24px env(safe-area-inset-bottom,24px);
      animation:welcomeFadeIn .55s ease both;
      overflow:hidden;
    }
    .welcome-overlay.leaving{animation:welcomeFadeOut .45s ease forwards}
    .welcome-confetti-layer{position:absolute;inset:0;pointer-events:none;overflow:hidden}
    .confetti-piece{
      position:absolute;top:-30px;border-radius:2px;
      animation:confettiFall linear both, confettiWave ease-in-out infinite;
    }
    .welcome-logo-ring{
      position:relative;z-index:1;
      width:90px;height:90px;border-radius:24px;
      background:#FFFFFF;
      border:1px solid rgba(79,70,229,0.18);
      display:flex;align-items:center;justify-content:center;
      margin-bottom:24px;
      box-shadow:0 10px 36px -6px rgba(79,70,229,0.22), 0 2px 8px rgba(15,23,42,0.06);
      animation:starPop .7s .1s cubic-bezier(.22,1,.36,1) both;
    }
    .welcome-hola{
      position:relative;z-index:1;
      font-family:'Jost',sans-serif;font-size:11px;font-weight:700;
      color:var(--gold-dark);text-transform:uppercase;letter-spacing:2.5px;
      margin-bottom:10px;
      animation:welcomeSlideUp .6s .25s cubic-bezier(.22,1,.36,1) both;
    }
    .welcome-nombre{
      position:relative;z-index:1;
      font-family:'Cormorant Garamond',serif;font-size:44px;font-weight:600;font-style:italic;
      color:var(--ink);letter-spacing:-.5px;line-height:1.1;text-align:center;
      margin-bottom:16px;
      animation:welcomeSlideUp .6s .35s cubic-bezier(.22,1,.36,1) both;
    }
    .welcome-divider{
      position:relative;z-index:1;
      width:60px;height:1px;background:linear-gradient(90deg,transparent,rgba(79,70,229,0.45),transparent);
      margin:0 auto 16px;
      animation:welcomeSlideUp .6s .45s cubic-bezier(.22,1,.36,1) both;
    }
    .welcome-evento-nombre{
      position:relative;z-index:1;
      font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;
      color:var(--ink);text-align:center;line-height:1.3;letter-spacing:.3px;
      margin-bottom:6px;
      animation:welcomeSlideUp .6s .5s cubic-bezier(.22,1,.36,1) both;
    }
    .welcome-anfitrion{
      position:relative;z-index:1;
      font-size:12px;color:var(--ink3);font-weight:500;
      text-align:center;letter-spacing:.5px;margin-bottom:48px;
      animation:welcomeSlideUp .6s .58s cubic-bezier(.22,1,.36,1) both;
    }
    .welcome-btn{
      position:relative;z-index:1;
      background:linear-gradient(135deg,var(--gold-dark),var(--gold));
      color:#FFFFFF;border:none;border-radius:16px;
      padding:17px 40px;
      font-family:'Jost',sans-serif;font-size:15px;font-weight:700;letter-spacing:.5px;
      cursor:pointer;
      box-shadow:0 10px 28px -6px rgba(79,70,229,0.42), 0 2px 6px rgba(79,70,229,0.16);
      transition:transform .18s,box-shadow .18s;
      animation:welcomeSlideUp .6s .68s cubic-bezier(.22,1,.36,1) both;
      display:flex;align-items:center;gap:8px;
    }
    .welcome-btn:hover{transform:translateY(-2px);box-shadow:0 14px 36px -6px rgba(79,70,229,0.50), 0 4px 10px rgba(79,70,229,0.20)}
    .welcome-btn:active{transform:translateY(0)}
    .welcome-dots{
      position:absolute;inset:0;pointer-events:none;
      background-image:radial-gradient(circle,rgba(79,70,229,0.06) 1px,transparent 1px);
      background-size:30px 30px;
    }
    .welcome-glow{
      position:absolute;bottom:-80px;left:50%;transform:translateX(-50%);
      width:300px;height:300px;border-radius:50%;
      background:radial-gradient(circle,rgba(79,70,229,0.10) 0%,transparent 70%);
      pointer-events:none;
    }
  `;

  if (loading)
    return (
      <>
        <style>{styles}</style>
        <div className="loading-screen">
          <AppLogo size={72} />
          <div style={{marginTop: 14, fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 26, color: "#0F172A", letterSpacing: 3}}>Eventix</div>
          <div className="loading-spinner" style={{marginTop: 24}} />
          <p
            style={{
              fontSize: 11,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: "rgba(79,70,229,0.7)",
              marginTop: 12,
            }}
          >
            Cargando...
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
            <div style={{ marginBottom: 16, opacity: 0.35 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
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
  const tipoOrn = TIPO_ORNAMENTO[evento.tipo] || "";
  const fechaFmt = evento.fecha ? formatFecha(evento.fecha) : null;
  const fechaCorta = evento.fecha ? formatFechaCorta(evento.fecha) : null;
  const horaFmt = evento.hora ? formatHora(evento.hora) : null;
  const fechaLimiteFmt = evento.fecha_limite_confirmacion
    ? formatFechaCorta(evento.fecha_limite_confirmacion)
    : null;

  return (
    <>
      <style>{styles}</style>
      <canvas id="confetti-canvas" ref={canvasRef} />

      {/* ─── Pantalla de bienvenida con confeti ─── */}
      {showWelcome && (
        <div
          className="welcome-overlay"
          id="welcome-overlay"
        >
          {/* Fondo de puntos */}
          <div className="welcome-dots" />
          <div className="welcome-glow" />

          {/* Confeti */}
          <div className="welcome-confetti-layer">
            {CONFETTI_PIECES.map((p) => (
              <div
                key={p.id}
                className="confetti-piece"
                style={{
                  left: `${p.left}%`,
                  width: p.wide ? p.size * 2 : p.size,
                  height: p.wide ? p.size * 0.5 : p.size,
                  borderRadius: p.wide ? 2 : p.size / 2,
                  background: p.color,
                  animationDuration: `${p.dur}s, ${p.dur * 0.8}s`,
                  animationDelay: `${p.delay}s, ${p.delay}s`,
                  animationIterationCount: "infinite, infinite",
                  transform: `rotate(${p.rot}deg)`,
                  opacity: 0.85,
                }}
              />
            ))}
          </div>

          {/* Logo */}
          <div className="welcome-logo-ring">
            <AppLogo size={54} />
          </div>

          {/* Saludo */}
          <p className="welcome-hola">¡Te damos la bienvenida!</p>
          <h1 className="welcome-nombre">
            {invitado.nombre.split(" ").slice(0, 2).join(" ")}
          </h1>
          <div className="welcome-divider" />

          {/* Evento */}
          <p className="welcome-evento-nombre">{evento.nombre}</p>
          <p className="welcome-anfitrion">
            de {evento.anfitriones}
          </p>

          {/* CTA */}
          <button
            className="welcome-btn"
            onClick={() => {
              const el = document.getElementById("welcome-overlay");
              if (el) {
                el.classList.add("leaving");
                setTimeout(() => setShowWelcome(false), 420);
              } else {
                setShowWelcome(false);
              }
            }}
          >
            Ver mi invitación
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Modal tarjeta */}
      {mostrarModalTarjeta && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && cerrarModal()}
        >
          <div className="modal-sheet">
            <div className="modal-drag" />
            <div className="modal-header">
              <span className="modal-title">Tu tarjeta de invitación</span>
              <button className="modal-close" onClick={cerrarModal}>
                ×
              </button>
            </div>
            <div className="tarjeta-img-wrap">
              {generandoTarjeta || !tarjetaPreview ? (
                <div className="tarjeta-skeleton">
                  <div className="tarjeta-spinner" />
                  <span>Generando tarjeta...</span>
                </div>
              ) : (
                <img src={tarjetaPreview} alt="Tarjeta de invitación" />
              )}
            </div>
            <div className="modal-btns">
              <button
                className="btn-compartir-wa"
                onClick={compartirTarjeta}
                disabled={generandoTarjeta || !tarjetaPreview}
              >
                <IcoWhatsapp size={17} /> Compartir por WhatsApp
              </button>
              <button
                className="btn-descargar"
                onClick={descargarTarjeta}
                disabled={generandoTarjeta || !tarjetaPreview}
              >
                <IcoDescargar /> Descargar imagen
              </button>
              <button className="modal-cancelar" onClick={cerrarModal}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`page${mounted ? " vis" : ""}${destroying ? " destroying" : ""}`}
      >
        {/* Topbar — solo logo, sin links al dashboard */}
        <div className="topbar">
          <div className="topbar-left">
            <AppLogo size={30} />
            <div>
              <div className="topbar-name">Eventix</div>
              <div className="topbar-sub">Invitaciones digitales</div>
            </div>
          </div>
        </div>

        {/* ─── VISTA ─── */}
        {step === "vista" && (
          <div className="wrap">
            <div className="inv-card">

              {/* ── HERO: foto limpia sin texto encima ── */}
              {evento.imagen_url ? (
                <div className="inv-hero" style={{ maxHeight: 420 }}>
                  <img
                    src={evento.imagen_url}
                    className="inv-hero-foto"
                    alt={evento.nombre}
                    style={{ width: "100%", display: "block", maxHeight: 420, objectFit: "cover", objectPosition: "center top" }}
                  />
                </div>
              ) : (
                <div className="inv-hero-bg" style={{ minHeight: 160, background: "linear-gradient(160deg,var(--dark) 0%,var(--dark2) 100%)" }} />
              )}

              {/* ── Tipo, decoración, nombre invitado, anfitriones — TODO DEBAJO de la foto ── */}
              <div style={{ textAlign: "center", padding: "24px 22px 10px", background: "var(--cream)", borderBottom: "1px solid var(--border)" }}>
                {/* Badge de tipo */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <span className="inv-tipo-badge">
                    <span className="inv-tipo-badge-dot"/>
                    <span>{tipoLabel}</span>
                  </span>
                </div>

                {/* Decoraciones del tipo de evento */}
                <DecoracionEvento tipo={evento.tipo} />

                {/* Nombre del invitado */}
                <h1 className="inv-saludo">
                  {nombresEnTarjeta.length > 1
                    ? nombresEnTarjeta.slice(0, 2).join(" & ")
                    : invitado.nombre}
                </h1>

                {/* Anfitriones */}
                {evento.anfitriones && (
                  <p className="inv-anfitrion">
                    Con cariño de <strong style={{ color: "var(--ink2)" }}>{evento.anfitriones}</strong>
                  </p>
                )}

                {/* Nombre del evento */}
                <div className="inv-evento-nombre">{evento.nombre}</div>

                {/* Frase opcional */}
                {evento.frase_evento && (
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontStyle: "italic", color: "var(--ink2)", marginTop: 14, lineHeight: 1.6, padding: "0 8px" }}>
                    ❝ {evento.frase_evento} ❞
                  </div>
                )}
              </div>

              <div className="inv-body">
                {/* 1️⃣ Música — autoplay, siempre arriba */}
                {evento.musica_url && (
                  <MusicPlayer url={evento.musica_url} nombre={evento.musica_nombre} />
                )}

                <OrnamentoDivider tipo={evento.tipo} />

                {/* 3️⃣ Detalles del evento — SIN botón de mapa */}
                {(fechaFmt || evento.hora || evento.lugar) && (
                  <div className="detalles">
                    {fechaFmt && (
                      <div className="detalle-fila">
                        <div className="detalle-ico-wrap"><IcoFecha /></div>
                        <div>
                          <div className="detalle-label">Fecha</div>
                          <div className="detalle-texto">{fechaFmt}</div>
                        </div>
                      </div>
                    )}
                    {horaFmt && (
                      <div className="detalle-fila">
                        <div className="detalle-ico-wrap"><IcoHora /></div>
                        <div>
                          <div className="detalle-label">Hora</div>
                          <div className="detalle-texto">{horaFmt}</div>
                        </div>
                      </div>
                    )}
                    {evento.lugar && (
                      <div className="detalle-fila">
                        <div className="detalle-ico-wrap">
                          {/* Sin ícono en la dirección — solo texto */}
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                            <path d="M4 10h16M4 14h10" stroke="#4F46E5" strokeWidth="1.8" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <div>
                          <div className="detalle-label">Lugar</div>
                          <div className="detalle-texto">{evento.lugar}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4️⃣ Link GPS / Google Maps */}
                {evento.maps_url && (
                  <div style={{ textAlign: "center", marginTop: 4 }}>
                    <a
                      href={evento.maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="maps-btn"
                    >
                      <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M10 2a6 6 0 016 6c0 5-6 10-6 10S4 13 4 8a6 6 0 016-6z"/>
                        <circle cx="10" cy="8" r="2"/>
                      </svg>
                      Ver en Google Maps
                    </a>
                  </div>
                )}

                {/* Cómo llegar — instrucciones textuales */}
                {evento.como_llegar && (
                  <div className="como-llegar-box">
                    <div className="como-llegar-label">Instrucciones para llegar</div>
                    <p className="como-llegar-text">{evento.como_llegar}</p>
                  </div>
                )}

                {/* ⏱ Cuenta regresiva */}
                {evento.fecha && <CountdownTimer fecha={evento.fecha} hora={evento.hora} />}

                {/* 5️⃣ Galería del lugar */}
                {fotosLugar.length > 0 && (
                  <GaleriaLugar fotos={fotosLugar} lugar={evento.lugar} />
                )}

                {/* 5b️⃣ Código de vestimenta */}
                {evento.vestimenta_activo && evento.vestimenta_tipo && (
                  <VestimentaCard evento={evento} />
                )}

                {/* Invitados en la tarjeta */}
                {nombresEnTarjeta.length > 1 && (
                  <div className="inv-nombres">
                    <div className="inv-nombres-title">Invitados en esta tarjeta</div>
                    {nombresEnTarjeta.map((n, i) => (
                      <div key={i} className="inv-nombre-item">
                        <div className="inv-nombre-av">{n.charAt(0).toUpperCase()}</div>
                        <span>{n}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 6️⃣ Tu Mesa */}
                {invitado.mesa_nombre && (
                  <div className="tu-mesa-card">
                    <div className="tu-mesa-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="6" width="20" height="4" rx="2"/><path d="M5 10v8M19 10v8M8 10v8M16 10v8"/></svg>
                    </div>
                    <div className="tu-mesa-info">
                      <div className="tu-mesa-label">Tu lugar asignado</div>
                      <div className="tu-mesa-nombre">{invitado.mesa_nombre}</div>
                    </div>
                  </div>
                )}

                {/* 7️⃣ Regalo / Transferencia */}
                {evento.regalo_activo && (evento.regalo_banco || evento.regalo_titular || evento.regalo_cuenta) && (
                  <RegaloCard evento={evento} />
                )}

                {/* 8️⃣ Programa del evento */}
                {itinerario.length > 0 && (
                  <ProgramaCard items={itinerario} />
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
              <span className="campo-label">
                {invitado.cupo_elije_invitado
                  ? "¿Cuántas personas irán incluyéndote a ti?"
                  : "¿Cuántas personas asistirán?"}
              </span>
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
                      Math.min(invitado.cupo_elije_invitado ? 20 : (invitado.num_personas || 20), numPersonas + 1),
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
                {invitado.cupo_elije_invitado
                  ? "Incluye tu lugar y el de los acompañantes"
                  : `Tu invitación es para hasta ${invitado.num_personas} ${invitado.num_personas === 1 ? "persona" : "personas"}`}
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
                      stroke="#4F46E5"
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
                    style={{ color: "rgba(79,70,229,0.95)", fontWeight: 500 }}
                  >
                    {evento.nombre}
                  </strong>
                </p>
              </div>
              <div className="conf-body">
                {invitado.numero_confirmacion && (
                  <div className="num-badge">
                    <div className="num-icono">
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#4F46E5"
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

                {/* ─── QR de entrada ─── */}
                {(() => {
                  const qrUrl = typeof window !== "undefined"
                    ? `${window.location.origin}/confirmar/${invitado.token}`
                    : `/confirmar/${invitado.token}`;
                  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}&format=png&color=140d04&bgcolor=FFFFFF&margin=4`;
                  return (
                    <div className="qr-entry-card">
                      <div className="qr-entry-label">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <rect x="2" y="2" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <rect x="13" y="2" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <rect x="2" y="13" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <rect x="17" y="17" width="4" height="4" fill="currentColor"/>
                          <rect x="13" y="13" width="4" height="4" fill="currentColor"/>
                        </svg>
                        Tu QR de entrada
                      </div>
                      <div className="qr-img-wrap">
                        <img src={qrSrc} alt="QR de entrada" width={148} height={148} />
                      </div>
                      <div className="qr-nombre-badge">
                        <div className="qr-nombre-av">{invitado.nombre.charAt(0).toUpperCase()}</div>
                        <span className="qr-nombre-text">{invitado.nombre}</span>
                      </div>
                      <p className="qr-hint">Muestra este código en la entrada del evento.<br/>El organizador lo escaneará para registrar tu llegada.</p>
                    </div>
                  );
                })()}

                {/* ─── Selector de Mesa ─── */}
                {mesasDisponibles.length > 0 && (() => {
                  const mesaActual = invitado.mesa_id;
                  const mesaSelInfo = mesasDisponibles.find(m => m.id === mesaActual);
                  if (mesaActual) {
                    return (
                      <div className="mesa-confirmed-card">
                        <div className="mesa-confirmed-ico">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dark)" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="6" width="20" height="4" rx="2"/><path d="M5 10v8M19 10v8M8 10v8M16 10v8"/></svg>
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:9, fontWeight:700, color:"var(--ink3)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:3 }}>Tu mesa</div>
                          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:600, color:"var(--ink)" }}>
                            {mesaSelInfo?.nombre || invitado.mesa_nombre}
                          </div>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dark)" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                      </div>
                    );
                  }
                  return (
                    <div className="mesa-picker-wrap">
                      <div className="mesa-picker-header">
                        <div className="mesa-picker-ico">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dark)" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="6" width="20" height="4" rx="2"/><path d="M5 10v8M19 10v8"/></svg>
                        </div>
                        <div>
                          <div className="mesa-picker-title">Elige tu lugar</div>
                          <div className="mesa-picker-sub">Selecciona una mesa disponible</div>
                        </div>
                      </div>
                      <div className="mesa-list">
                        {mesasDisponibles.map((m) => {
                          const libre = m.capacidad - m.ocupados;
                          const llena = libre <= 0;
                          return (
                            <div
                              key={m.id}
                              className={`mesa-row${llena ? " mesa-row--full" : ""}${asignandoMesa ? " mesa-row--loading" : ""}`}
                              onClick={() => !llena && !asignandoMesa && elegirMesa(m.id, m.nombre)}
                            >
                              <span className="mesa-row-name">{m.nombre}</span>
                              <div className="mesa-row-slots">
                                <span className={`mesa-row-badge${llena ? " mesa-row-badge--full" : " mesa-row-badge--free"}`}>
                                  {llena ? "Llena" : `${libre} ${libre === 1 ? "lugar" : "lugares"}`}
                                </span>
                                {!llena && (
                                  <svg className="mesa-row-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {asignandoMesa && (
                        <div style={{ textAlign:"center", padding:"10px 0 12px", fontSize:11, color:"var(--gold-dark)", fontWeight:600 }}>
                          Guardando selección...
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Subir fotos — máx 5, opcional */}
                <SubirFotosInvitado
                  invitadoId={invitado.id}
                  eventoId={invitado.evento_id}
                  token={token}
                />

                {/* Dejar deseo en el muro */}
                <button
                  className="btn-accion-full"
                  onClick={() => {
                    window.location.href = `/muro/${invitado.evento_id}?token=${invitado.token}&tab=deseos`;
                  }}
                >
                  <div className="btn-accion-ico">
                    <IcoCorazon />
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
                      Dejar mi deseo
                    </span>
                    <span style={{ fontSize: 11, color: "var(--ink3)" }}>
                      Escribe un mensaje especial
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

                {evento.fecha && (
                  <button
                    className="btn-accion-full"
                    onClick={() => abrirGoogleCalendar(evento)}
                  >
                    <div className="res-ico" style={{ flexShrink: 0 }}>
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

                {/* Botón ver muro de fotos (modo lectura) */}
                <button
                  className="btn-wa"
                  style={{ background: "linear-gradient(135deg,var(--gold-dark),var(--gold))" }}
                  onClick={() => window.open(`/muro/${invitado.evento_id}?token=${invitado.token}`, "_blank")}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Ver muro de fotos del evento
                </button>

                <button className="btn-cerrar" onClick={confirmarYCerrar}>
                  Listo, cerrar esta ventana
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── RECHAZADO ─── */}
        {step === "rechazado" && (
          <div className="wrap">
            <div className="rech-card">
              <div style={{ marginBottom: 18 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.4" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div className="rech-titulo">Gracias por avisar</div>
              <OrnamentoDivider tipo={evento.tipo} />
              <p className="rech-sub" style={{ marginTop: 16 }}>
                Lamentamos que no puedas asistir,{" "}
                <strong>{invitado.nombre}</strong>.<br />
                <br />
                Esperamos verte en otra ocasión especial.
              </p>
              <button
                onClick={confirmarYCerrar}
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
                  letterSpacing: ".3px",
                }}
              >
                Cerrar ventana
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Ficha Eventix (se muestra al cerrar la tarjeta) ─── */}
      {showEventixPromo && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "#3730A3",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "32px 24px",
          animation: "fadeInPromo .5s ease both",
        }}>
          <style>{`
            @keyframes fadeInPromo { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
            @keyframes shimmerP { 0%,100%{opacity:.6} 50%{opacity:1} }
            .promo-card{width:100%;max-width:360px;background:linear-gradient(160deg,#1e1308 0%,#3730A3 100%);border:1.5px solid rgba(79,70,229,0.25);border-radius:24px;padding:36px 28px 32px;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,0.5),0 0 0 1px rgba(79,70,229,0.08);}
            .promo-logo-ring{width:72px;height:72px;border-radius:22px;background:rgba(79,70,229,0.08);border:1.5px solid rgba(79,70,229,0.2);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;}
            .promo-title{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:700;color:#E0E7FF;letter-spacing:.3px;line-height:1.15;margin-bottom:8px;}
            .promo-sub{font-size:13px;color:rgba(79,70,229,0.55);line-height:1.6;margin-bottom:28px;font-family:'Jost',sans-serif;}
            .promo-tags{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-bottom:24px;}
            .promo-tag{background:rgba(79,70,229,0.1);border:1px solid rgba(79,70,229,0.22);border-radius:20px;padding:5px 13px;font-size:11px;font-weight:600;color:#4F46E5;letter-spacing:.3px;font-family:'Jost',sans-serif;}
            .promo-divider{width:40px;height:1px;background:rgba(79,70,229,0.25);margin:0 auto 20px;}
            .promo-features{display:flex;flex-direction:column;gap:10px;margin-bottom:28px;text-align:left;}
            .promo-feature{display:flex;align-items:center;gap:12px;font-size:12.5px;color:rgba(79,70,229,0.7);font-family:'Jost',sans-serif;}
            .promo-dot{width:6px;height:6px;border-radius:50%;background:#4F46E5;flex-shrink:0;}
            .promo-btn{width:100%;padding:15px;border:none;border-radius:14px;background:linear-gradient(135deg,#4F46E5,#E0E7FF);color:#3730A3;font-size:14px;font-weight:700;cursor:pointer;font-family:'Jost',sans-serif;letter-spacing:.4px;box-shadow:0 6px 20px rgba(79,70,229,0.3);margin-bottom:10px;}
            .promo-btn-sec{width:100%;padding:12px;border:1.5px solid rgba(79,70,229,0.2);border-radius:14px;background:transparent;color:rgba(79,70,229,0.45);font-size:12px;font-weight:500;cursor:pointer;font-family:'Jost',sans-serif;}
          `}</style>
          <div className="promo-card">
            <div className="promo-logo-ring"><AppLogo size={48} /></div>
            <div className="promo-title">Eventix</div>
            <p className="promo-sub">Gestiona tus invitaciones digitales de forma elegante y sencilla</p>
            <div className="promo-tags">
              <span className="promo-tag">Invitaciones</span>
              <span className="promo-tag">Fotos</span>
              <span className="promo-tag">Mesas</span>
              <span className="promo-tag">Recuerdos</span>
            </div>
            <div className="promo-divider" />
            <div className="promo-features">
              <div className="promo-feature"><div className="promo-dot"/><span>Invitaciones personalizadas por WhatsApp</span></div>
              <div className="promo-feature"><div className="promo-dot"/><span>Confirmación de asistencia en un toque</span></div>
              <div className="promo-feature"><div className="promo-dot"/><span>Muro de fotos y deseos del evento</span></div>
              <div className="promo-feature"><div className="promo-dot"/><span>Asignación de mesas y código QR de entrada</span></div>
            </div>
            <button className="promo-btn" onClick={() => window.location.href = "/"}>
              Crear mi evento en Eventix
            </button>
            <button className="promo-btn-sec" onClick={() => { window.close(); setTimeout(() => { window.location.href = "whatsapp://"; }, 200); }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
