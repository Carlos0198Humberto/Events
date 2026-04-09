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
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <rect width="64" height="64" rx="18" fill="#140d04"/>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="rgba(201,169,110,0.20)" strokeWidth="1.2"/>
      {/* Geometric E — vertical bar */}
      <rect x="13" y="14" width="6" height="36" rx="3" fill="#C9A96E"/>
      {/* Top bar */}
      <rect x="13" y="14" width="24" height="6" rx="3" fill="#C9A96E"/>
      {/* Middle bar (slightly shorter) */}
      <rect x="13" y="29" width="18" height="6" rx="3" fill="#C9A96E"/>
      {/* Bottom bar */}
      <rect x="13" y="44" width="24" height="6" rx="3" fill="#C9A96E"/>
      {/* 4-pointed star sparkle — upper right */}
      <path d="M48 11 L49.8 17.2 L56 19 L49.8 20.8 L48 27 L46.2 20.8 L40 19 L46.2 17.2 Z" fill="#E8D5B0"/>
      {/* Small accent dot */}
      <circle cx="47" cy="46" r="2.5" fill="#C9A96E" opacity="0.55"/>
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

// ─── Decoración por tipo de evento ────────────────────────────────────────────
function DecoracionEvento({ tipo }: { tipo: string }) {
  if (tipo === "boda") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "6px 0" }}>
        {/* Anillos de boda */}
        <svg width="110" height="56" viewBox="0 0 110 56" fill="none">
          {/* Anillo izquierdo */}
          <circle cx="36" cy="30" r="20" stroke="#C9A96E" strokeWidth="5" fill="none" opacity="0.85" />
          <circle cx="36" cy="30" r="13" stroke="#E8D5B0" strokeWidth="1.5" fill="none" opacity="0.4" />
          {/* Diamante */}
          <path d="M32 10 L36 4 L40 10 L36 15 Z" fill="#C9A96E" opacity="0.9" />
          <path d="M32 10 L36 15 L40 10" fill="#E8D5B0" opacity="0.6" />
          {/* Anillo derecho */}
          <circle cx="74" cy="30" r="20" stroke="#C9A96E" strokeWidth="5" fill="none" opacity="0.85" />
          <circle cx="74" cy="30" r="13" stroke="#E8D5B0" strokeWidth="1.5" fill="none" opacity="0.4" />
          {/* Destello */}
          <path d="M70 10 L74 4 L78 10 L74 15 Z" fill="#C9A96E" opacity="0.9" />
          <path d="M70 10 L74 15 L78 10" fill="#E8D5B0" opacity="0.6" />
          {/* Enlace */}
          <path d="M52 28 Q55 22 58 28" stroke="#C9A96E" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
        </svg>
        {/* Flores decorativas */}
        <svg width="200" height="28" viewBox="0 0 200 28" fill="none">
          <path d="M0 14 Q25 4 50 14 Q75 24 100 14 Q125 4 150 14 Q175 24 200 14" stroke="#C9A96E" strokeWidth="1" fill="none" opacity="0.5" />
          {[25, 75, 125, 175].map((x) => (
            <g key={x} transform={`translate(${x},14)`}>
              <circle cx="0" cy="0" r="2.5" fill="#C9A96E" opacity="0.7" />
              <circle cx="0" cy="-5" r="2" fill="#E8D5B0" opacity="0.6" />
              <circle cx="5" cy="0" r="2" fill="#E8D5B0" opacity="0.6" />
              <circle cx="0" cy="5" r="2" fill="#E8D5B0" opacity="0.6" />
              <circle cx="-5" cy="0" r="2" fill="#E8D5B0" opacity="0.6" />
            </g>
          ))}
          <circle cx="100" cy="14" r="3" fill="#C9A96E" opacity="0.9" />
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
          <path d="M8 44 L8 28 L22 8 L45 22 L68 8 L82 28 L82 44 Z" stroke="#C9A96E" strokeWidth="2.5" fill="rgba(201,169,110,0.12)" strokeLinejoin="round" />
          {/* Puntas de la corona */}
          <circle cx="22" cy="8" r="4" fill="#C9A96E" opacity="0.85" />
          <circle cx="45" cy="4" r="5" fill="#C9A96E" opacity="0.95" />
          <circle cx="68" cy="8" r="4" fill="#C9A96E" opacity="0.85" />
          {/* Joyas en la corona */}
          <ellipse cx="45" cy="36" rx="8" ry="6" fill="rgba(201,169,110,0.25)" stroke="#C9A96E" strokeWidth="1.5" />
          <ellipse cx="24" cy="38" rx="5" ry="4" fill="rgba(201,169,110,0.15)" stroke="#C9A96E" strokeWidth="1" />
          <ellipse cx="66" cy="38" rx="5" ry="4" fill="rgba(201,169,110,0.15)" stroke="#C9A96E" strokeWidth="1" />
          {/* Destellos */}
          <path d="M45 0 L46 3 L45 4 L44 3 Z" fill="#E8D5B0" opacity="0.9" />
        </svg>
        {/* Mariposas y flores */}
        <svg width="200" height="32" viewBox="0 0 200 32" fill="none">
          <path d="M0 16 Q50 6 100 16 Q150 26 200 16" stroke="#C9A96E" strokeWidth="0.8" fill="none" opacity="0.4" />
          {/* Mariposa izq */}
          <g transform="translate(40,16)">
            <path d="M0 0 Q-10 -10 -18 -4 Q-10 2 0 0" fill="#C9A96E" opacity="0.5" />
            <path d="M0 0 Q-10 10 -18 4 Q-10 -2 0 0" fill="#C9A96E" opacity="0.35" />
            <path d="M0 0 Q10 -10 18 -4 Q10 2 0 0" fill="#C9A96E" opacity="0.5" />
            <path d="M0 0 Q10 10 18 4 Q10 -2 0 0" fill="#C9A96E" opacity="0.35" />
            <circle cx="0" cy="0" r="2" fill="#C9A96E" opacity="0.8" />
          </g>
          {/* Flor central */}
          <g transform="translate(100,16)">
            {[0,60,120,180,240,300].map((a) => (
              <ellipse key={a} cx={Math.cos(a*Math.PI/180)*7} cy={Math.sin(a*Math.PI/180)*7} rx="4" ry="3" fill="#C9A96E" opacity="0.5" transform={`rotate(${a} ${Math.cos(a*Math.PI/180)*7} ${Math.sin(a*Math.PI/180)*7})`} />
            ))}
            <circle cx="0" cy="0" r="3.5" fill="#E8D5B0" opacity="0.85" />
          </g>
          {/* Mariposa der */}
          <g transform="translate(160,16)">
            <path d="M0 0 Q-10 -10 -18 -4 Q-10 2 0 0" fill="#C9A96E" opacity="0.5" />
            <path d="M0 0 Q-10 10 -18 4 Q-10 -2 0 0" fill="#C9A96E" opacity="0.35" />
            <path d="M0 0 Q10 -10 18 -4 Q10 2 0 0" fill="#C9A96E" opacity="0.5" />
            <path d="M0 0 Q10 10 18 4 Q10 -2 0 0" fill="#C9A96E" opacity="0.35" />
            <circle cx="0" cy="0" r="2" fill="#C9A96E" opacity="0.8" />
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
          <line x1="68" y1="18" x2="72" y2="38" stroke="#C9A96E" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          <circle cx="72" cy="40" r="4" fill="#C9A96E" opacity="0.75" />
          {/* Tablero superior */}
          <path d="M45 6 L82 22 L45 38 L8 22 Z" fill="rgba(201,169,110,0.18)" stroke="#C9A96E" strokeWidth="2.2" strokeLinejoin="round" />
          {/* Parte superior brillante */}
          <path d="M45 6 L82 22 L45 26 L8 22 Z" fill="rgba(201,169,110,0.12)" />
          {/* Cuerpo del birrete */}
          <path d="M24 26 L24 42 Q45 50 66 42 L66 26" stroke="#C9A96E" strokeWidth="2" fill="rgba(201,169,110,0.1)" strokeLinejoin="round" />
          {/* Diploma */}
          <rect x="12" y="40" width="22" height="14" rx="2" stroke="#C9A96E" strokeWidth="1.5" fill="rgba(201,169,110,0.08)" />
          <line x1="15" y1="45" x2="31" y2="45" stroke="#C9A96E" strokeWidth="1" opacity="0.5" />
          <line x1="15" y1="49" x2="28" y2="49" stroke="#C9A96E" strokeWidth="1" opacity="0.4" />
          <path d="M29 38 Q33 36 34 40 Q33 44 29 42 Z" fill="#C9A96E" opacity="0.6" />
        </svg>
        {/* Estrellas y destellos */}
        <svg width="200" height="28" viewBox="0 0 200 28" fill="none">
          <path d="M0 14 Q50 5 100 14 Q150 23 200 14" stroke="#C9A96E" strokeWidth="0.8" fill="none" opacity="0.4" />
          {[20, 60, 100, 140, 180].map((x, i) => (
            <g key={x} transform={`translate(${x},14)`}>
              <path d={`M0 -${i===2?7:5} L1.5 -2 L${i===2?7:5} 0 L1.5 2 L0 ${i===2?7:5} L-1.5 2 L-${i===2?7:5} 0 L-1.5 -2 Z`} fill="#C9A96E" opacity={i===2?0.9:0.6} />
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
          <ellipse cx="20" cy="20" rx="12" ry="15" fill="rgba(201,169,110,0.25)" stroke="#C9A96E" strokeWidth="1.8" />
          <line x1="20" y1="35" x2="30" y2="52" stroke="#C9A96E" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
          {/* Globo der */}
          <ellipse cx="90" cy="18" rx="12" ry="15" fill="rgba(201,169,110,0.2)" stroke="#C9A96E" strokeWidth="1.8" />
          <line x1="90" y1="33" x2="80" y2="52" stroke="#C9A96E" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
          {/* Pastel */}
          <rect x="28" y="38" width="54" height="20" rx="4" fill="rgba(201,169,110,0.18)" stroke="#C9A96E" strokeWidth="2" />
          <rect x="32" y="30" width="46" height="12" rx="3" fill="rgba(201,169,110,0.12)" stroke="#C9A96E" strokeWidth="1.5" />
          {/* Velas */}
          {[40, 55, 70].map((x) => (
            <g key={x}>
              <rect x={x-2} y="18" width="4" height="13" rx="2" fill="#C9A96E" opacity="0.7" />
              <ellipse cx={x} cy="17" rx="3" ry="4" fill="#E8D5B0" opacity="0.9" />
            </g>
          ))}
          {/* Decoración pastel */}
          <path d="M28 42 Q55 36 82 42" stroke="#E8D5B0" strokeWidth="1" fill="none" opacity="0.5" />
        </svg>
        {/* Confeti */}
        <svg width="200" height="24" viewBox="0 0 200 24" fill="none">
          {[15,35,55,80,100,120,145,165,185].map((x,i) => (
            <rect key={x} x={x} y={i%2===0?4:10} width="6" height="6" rx="1" fill="#C9A96E" opacity={0.4+i*0.05} transform={`rotate(${i*25} ${x+3} ${(i%2===0?4:10)+3})`} />
          ))}
        </svg>
      </div>
    );
  }

  // otro / default
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "6px 0" }}>
      <svg width="160" height="36" viewBox="0 0 160 36" fill="none">
        <path d="M0 18 Q40 6 80 18 Q120 30 160 18" stroke="#C9A96E" strokeWidth="1" fill="none" opacity="0.5" />
        {[20,50,80,110,140].map((x,i) => (
          <g key={x} transform={`translate(${x},18)`}>
            <path d={`M0 -${i===2?8:5} L1.8 -2 L${i===2?8:5} 0 L1.8 2 L0 ${i===2?8:5} L-1.8 2 L-${i===2?8:5} 0 L-1.8 -2 Z`} fill="#C9A96E" opacity={i===2?0.9:0.55} />
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
            {lugar && <div className="lightbox-caption">📍 {lugar}</div>}
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
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, "#1a1209");
    bgGrad.addColorStop(0.5, "#2d1f0a");
    bgGrad.addColorStop(1, "#1a1209");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    const cX = 50,
      cY = 80,
      cW = W - 100,
      cH = H - 160,
      r = 36;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.50)";
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 20;
    rrFill(ctx, cX, cY, cW, cH, r, "#FAF6F0");
    ctx.restore();
    rrFill(ctx, cX, cY, cW, cH, r, "#FAF6F0");
    const hH = 260;
    ctx.save();
    ctx.beginPath();
    rrPath(ctx, cX, cY, cW, hH, { tl: r, tr: r, bl: 0, br: 0 });
    ctx.clip();
    const hGrad = ctx.createLinearGradient(cX, cY, cX + cW, cY + hH);
    hGrad.addColorStop(0, "#1a1209");
    hGrad.addColorStop(1, "#2d1f0a");
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
    ctx.font = "italic 20px 'Georgia',serif";
    ctx.fillStyle = "rgba(201,169,110,0.75)";
    ctx.textAlign = "center";
    ctx.fillText(TIPO_LABEL[evento.tipo] || "Invitación", cX + cW / 2, cY + 50);
    ctx.font = "bold 52px 'Georgia',serif";
    ctx.fillStyle = "#C9A96E";
    ctx.fillText(saludo, cX + cW / 2, cY + 118, cW - 80);
    ctx.font = "300 22px 'Arial'";
    ctx.fillStyle = "rgba(232,213,176,0.80)";
    ctx.fillText(`Invitación de ${evento.anfitriones}`, cX + cW / 2, cY + 158);
    ctx.font = "bold 28px 'Georgia',serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(evento.nombre, cX + cW / 2, cY + 205, cW - 80);
    ctx.restore();
    let dY = cY + hH + 32;
    const dX = cX + 44,
      colW = cW - 88;
    if (evento.frase_evento) {
      ctx.font = "italic 20px 'Georgia',serif";
      ctx.fillStyle = "#8B6914";
      ctx.textAlign = "center";
      ctx.fillText(`❝ ${evento.frase_evento} ❞`, cX + cW / 2, dY, colW);
      dY += 40;
    }
    const drawRow = (label: string, val: string) => {
      ctx.font = "700 11px 'Arial'";
      ctx.fillStyle = "#C9A96E";
      ctx.textAlign = "left";
      ctx.fillText(label.toUpperCase(), dX, dY - 4);
      ctx.font = "500 22px 'Arial'";
      ctx.fillStyle = "#2d1f0a";
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
    ctx.strokeStyle = "rgba(201,169,110,0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    dY += 22;
    if (evento.mensaje_invitacion) {
      ctx.font = "italic 18px 'Georgia',serif";
      ctx.fillStyle = "#5a3e1b";
      ctx.textAlign = "center";
      ctx.fillText(`"${evento.mensaje_invitacion}"`, cX + cW / 2, dY, colW);
      dY += 36;
    }
    const bW = colW,
      bH = 60,
      bR = 14,
      bGap = 10;
    const gBtn = ctx.createLinearGradient(dX, dY, dX + bW, dY + bH);
    gBtn.addColorStop(0, "#C9A96E");
    gBtn.addColorStop(1, "#8B6914");
    rrFill(ctx, dX, dY, bW, bH, bR, gBtn);
    ctx.font = "bold 24px 'Arial'";
    ctx.fillStyle = "#1a1209";
    ctx.textAlign = "center";
    ctx.fillText("✅  Confirmar asistencia", dX + bW / 2, dY + 38);
    dY += bH + bGap;
    rrFill(ctx, dX, dY, bW, bH, bR, "#F5EDD8");
    ctx.strokeStyle = "rgba(201,169,110,0.40)";
    ctx.lineWidth = 1.5;
    rrStroke(ctx, dX, dY, bW, bH, bR);
    ctx.font = "bold 24px 'Arial'";
    ctx.fillStyle = "#8B6914";
    ctx.textAlign = "center";
    ctx.fillText("📸  Subir foto al muro", dX + bW / 2, dY + 38);
    dY += bH + bGap;
    rrFill(ctx, dX, dY, bW, bH, bR, "#F5EDD8");
    ctx.strokeStyle = "rgba(201,169,110,0.40)";
    ctx.lineWidth = 1.5;
    rrStroke(ctx, dX, dY, bW, bH, bR);
    ctx.font = "bold 24px 'Arial'";
    ctx.fillStyle = "#8B6914";
    ctx.textAlign = "center";
    ctx.fillText("💌  Dejar mi deseo", dX + bW / 2, dY + 38);
    dY += bH + 14;
    ctx.font = "400 16px 'Arial'";
    ctx.fillStyle = "#C9A96E";
    ctx.textAlign = "center";
    ctx.fillText(
      `${origin}/confirmar/${invitado.token}`,
      cX + cW / 2,
      dY,
      colW,
    );
    ctx.font = "bold 17px 'Arial'";
    ctx.fillStyle = "#C9A96E";
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

// ─── Vestimenta data ──────────────────────────────────────────────────────────
const TIPOS_VESTIMENTA_MAP: Record<string, { emoji: string; label: string; desc: string }> = {
  "formal":      { emoji: "🤵", label: "Etiqueta formal",  desc: "Traje o smoking / vestido de gala" },
  "semi-formal": { emoji: "👔", label: "Semi-formal",       desc: "Traje casual / vestido elegante" },
  "cocktail":    { emoji: "🥂", label: "Cocktail",          desc: "Vestido corto o de cóctel" },
  "casual-chic": { emoji: "✨", label: "Casual elegante",   desc: "Ropa bonita pero cómoda" },
  "casual":      { emoji: "👕", label: "Casual",            desc: "Ropa cómoda y relajada" },
  "tematico":    { emoji: "🎭", label: "Temático",          desc: "Disfraz o tema especial" },
  "blanco":      { emoji: "🤍", label: "Todo de blanco",    desc: "Vestimenta en color blanco" },
  "colores":     { emoji: "🎨", label: "Paleta de colores", desc: "Colores específicos indicados" },
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
      background: "linear-gradient(135deg,rgba(201,169,110,0.06) 0%,rgba(232,213,176,0.10) 100%)",
      border: "1.5px solid rgba(201,169,110,0.28)",
      borderRadius: 18,
      padding: "16px 18px",
      margin: "4px 0 8px",
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
        <span style={{ fontSize:20 }}>👗</span>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:"var(--gold)", textTransform:"uppercase", letterSpacing:".8px" }}>Vestimenta</div>
          <div style={{ fontSize:13, fontWeight:600, color:"var(--ink)", marginTop:1 }}>Código de vestimenta</div>
        </div>
      </div>

      {/* Tipo */}
      {tipo && (
        <div style={{
          display:"flex", alignItems:"center", gap:12,
          background:"rgba(250,246,240,0.8)", borderRadius:12,
          padding:"11px 13px", marginBottom: colores.length > 0 || evento.vestimenta_nota ? 10 : 0,
        }}>
          <span style={{ fontSize:24, lineHeight:1 }}>{tipo.emoji}</span>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:"var(--ink)", fontFamily:"'Cormorant Garamond',serif" }}>{tipo.label}</div>
            <div style={{ fontSize:11, color:"var(--ink3)", marginTop:2 }}>{tipo.desc}</div>
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
          borderTop:"1px solid rgba(201,169,110,0.2)", paddingTop:10, marginTop:4,
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
      background: "linear-gradient(135deg,rgba(201,169,110,0.08) 0%,rgba(232,213,176,0.12) 100%)",
      border: "1.5px solid rgba(201,169,110,0.3)",
      borderRadius: 18,
      padding: "18px 18px 16px",
      margin: "4px 0 8px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>🎁</span>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: ".8px" }}>Regalo</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginTop: 1 }}>Datos para transferencia</div>
        </div>
      </div>

      {evento.regalo_mensaje && (
        <p style={{ fontSize: 12, fontStyle: "italic", color: "var(--ink2)", lineHeight: 1.6, marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid rgba(201,169,110,0.2)" }}>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 4, background: "rgba(250,246,240,0.8)", border: "1px solid rgba(201,169,110,0.25)", borderRadius: 10, padding: "10px 12px" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 3 }}>Cuenta / CLABE</div>
              <div style={{ fontFamily: "'Courier New',monospace", fontSize: 13, fontWeight: 600, color: "var(--ink)", letterSpacing: ".5px", wordBreak: "break-all" }}>
                {evento.regalo_cuenta}
              </div>
            </div>
            <button
              onClick={copiarCuenta}
              style={{
                background: copiado ? "linear-gradient(135deg,#2d7d46,#38a85c)" : "linear-gradient(135deg,#C9A96E,#E8C97A)",
                color: copiado ? "#fff" : "#140d04",
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
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    document.title = "Eventix — Tu invitación";
    setTimeout(() => setMounted(true), 80);
    cargarDatos();
    // Mostrar prompt "Agregar a pantalla" si NO está en modo standalone (PWA)
    const isStandalone =
      (window.navigator as { standalone?: boolean }).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
    if (!isStandalone) {
      const dismissed = sessionStorage.getItem("pwa-prompt-dismissed");
      if (!dismissed) {
        const t = setTimeout(() => setShowPwaPrompt(true), 2500);
        return () => clearTimeout(t);
      }
    }
  }, []);

  async function cargarDatos() {
    const { data: inv } = await supabase
      .from("invitados")
      .select("*, mesas(nombre)")
      .eq("token", token)
      .single();
    if (!inv) {
      setLoading(false);
      return;
    }
    // Normalizar el join de mesas
    const invNorm = {
      ...inv,
      mesa_nombre: (inv.mesas as { nombre?: string } | null)?.nombre ?? null,
    };
    const { data: ev } = await supabase
      .from("eventos")
      .select("*")
      .eq("id", inv.evento_id)
      .single();
    setInvitado(invNorm);
    if (ev) setEvento(ev);
    setNumPersonas(inv.num_personas || 1);
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
    if (updated) setInvitado(updated);
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
        redirigirFinal();
      }
    }
    animate();
  }

  function redirigirFinal() {
    window.close();
    setTimeout(() => {
      window.location.href = "whatsapp://";
    }, 300);
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

  // ─── TEMAS ─────────────────────────────────────────────────────────────────
  const TEMAS: Record<string, string> = {
    clasico: `
      --gold:#C9A96E;--gold-dark:#8B6914;--gold-light:#E8D5B0;--gold-pale:#F5EDD8;
      --dark:#1a1209;--dark2:#2d1f0a;--ink:#3d2b0f;--ink2:#5a3e1b;--ink3:#8B6914;
      --cream:#FAF6F0;--cream2:#F0E8D8;--surface:#FFFFFF;
      --border:rgba(201,169,110,0.25);--border-mid:rgba(201,169,110,0.40);
      --shadow:0 8px 40px rgba(26,18,9,0.10);--shadow-lg:0 20px 60px rgba(26,18,9,0.16);
    `,
    rosado: `
      --gold:#d4847a;--gold-dark:#9c3f36;--gold-light:#f0b8b3;--gold-pale:#FDF0EF;
      --dark:#4a1535;--dark2:#6b1f4a;--ink:#5c1f3d;--ink2:#8a3b62;--ink3:#b06a8a;
      --cream:#FDF5F5;--cream2:#F7E8E8;--surface:#FFFFFF;
      --border:rgba(212,132,122,0.25);--border-mid:rgba(212,132,122,0.40);
      --shadow:0 8px 40px rgba(74,21,53,0.10);--shadow-lg:0 20px 60px rgba(74,21,53,0.16);
    `,
    esmeralda: `
      --gold:#4caf82;--gold-dark:#2d7a57;--gold-light:#8fd5b5;--gold-pale:#E8F7F0;
      --dark:#0d2d1e;--dark2:#1a4a30;--ink:#1b4332;--ink2:#2d6a4f;--ink3:#52b788;
      --cream:#F2FAF6;--cream2:#E0F2EA;--surface:#FFFFFF;
      --border:rgba(76,175,130,0.25);--border-mid:rgba(76,175,130,0.40);
      --shadow:0 8px 40px rgba(13,45,30,0.10);--shadow-lg:0 20px 60px rgba(13,45,30,0.16);
    `,
  };
  const temaVars = TEMAS[evento?.tema ?? "clasico"] ?? TEMAS.clasico;

  // ─── ESTILOS ───────────────────────────────────────────────────────────────
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Jost:wght@300;400;500;600;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{font-family:'Jost',sans-serif;-webkit-font-smoothing:antialiased;background:#FAF6F0;color:#1a1209}
    :root{
      ${temaVars}
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

    .topbar{display:flex;align-items:center;gap:10px;padding:11px 16px;background:rgba(250,246,240,0.95);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:20;justify-content:space-between;}
    .topbar-left{display:flex;align-items:center;gap:10px}
    .topbar-name{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--ink);letter-spacing:.3px;line-height:1}
    .topbar-sub{font-size:9px;font-weight:600;color:var(--ink3);text-transform:uppercase;letter-spacing:1px;margin-top:1px}

    .wrap{max-width:430px;margin:0 auto;padding:22px 16px;display:flex;flex-direction:column;gap:20px}

    .inv-card{background:var(--surface);border-radius:var(--r);border:1px solid var(--border-mid);box-shadow:var(--shadow-lg);overflow:hidden;animation:riseUp .6s cubic-bezier(.22,1,.36,1) both;}
    /* Hero foto — limpia, sin overlays ni texto encima */
    .inv-hero{position:relative;overflow:hidden;width:100%;background:var(--dark)}
    .inv-hero-foto{width:100%;height:100%;object-fit:cover;display:block;object-position:center top;}
    .inv-hero-bg{min-height:200px;background:linear-gradient(160deg,var(--dark) 0%,var(--dark2) 100%)}
    /* Sección debajo del hero */
    .inv-tipo-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(201,169,110,0.14);border:1px solid rgba(201,169,110,0.45);border-radius:99px;padding:5px 14px;font-family:'Jost',sans-serif;font-size:10px;font-weight:700;color:var(--gold-dark);letter-spacing:1.5px;text-transform:uppercase;}
    .inv-saludo{font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:500;font-style:italic;color:var(--ink);letter-spacing:-.3px;line-height:1.2;margin-top:8px}
    .inv-anfitrion{font-size:12px;color:var(--ink3);font-weight:500;letter-spacing:.5px;margin-top:4px}
    .inv-evento-nombre{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--ink);letter-spacing:.3px;margin-top:6px}
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
    @keyframes popIn{from{transform:scale(0)}to{transform:scale(1)}}
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
    .acciones-titulo{font-size:10px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:1px;margin-bottom:11px}

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
    .btn-accion-full{width:100%;background:var(--cream);border:1px solid var(--border-mid);border-radius:var(--r-sm);padding:15px 18px;display:flex;align-items:center;gap:13px;cursor:pointer;transition:all .18s;font-family:'Jost',sans-serif}
    .btn-accion-full:hover{background:var(--gold-pale);border-color:var(--gold)}
    .btn-wa{width:100%;background:linear-gradient(135deg,#1a5c36,#128C7E);color:#fff;border:none;border-radius:var(--r-sm);padding:16px;font-family:'Jost',sans-serif;font-size:14px;font-weight:600;cursor:pointer;letter-spacing:.3px;box-shadow:0 5px 20px rgba(18,140,126,0.32);transition:transform .18s;display:flex;align-items:center;justify-content:center;gap:9px}
    .btn-wa:hover{transform:translateY(-1px)}
    .btn-wa:disabled{opacity:.7;cursor:wait}
    .btn-cerrar{width:100%;background:linear-gradient(135deg,var(--dark),var(--dark2));color:var(--gold);border:1px solid rgba(201,169,110,0.3);border-radius:var(--r-sm);padding:16px;font-family:'Cormorant Garamond',serif;font-size:18px;font-style:italic;font-weight:600;cursor:pointer;letter-spacing:.3px;box-shadow:0 5px 20px rgba(26,18,9,0.18);transition:transform .18s;display:flex;align-items:center;justify-content:center;gap:9px}
    .btn-cerrar:hover{transform:translateY(-1px)}

    /* Modal tarjeta */
    .modal-overlay{position:fixed;inset:0;z-index:9000;background:rgba(10,8,4,0.75);backdrop-filter:blur(14px);display:flex;align-items:flex-end;justify-content:center;animation:fadeIn .22s ease}
    .modal-sheet{width:100%;max-width:480px;background:var(--surface);border-radius:28px 28px 0 0;padding:0 0 env(safe-area-inset-bottom,20px);box-shadow:0 -16px 60px rgba(26,18,9,0.20);animation:slideUp .32s cubic-bezier(.22,1,.36,1)}
    @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
    .modal-drag{width:36px;height:4px;border-radius:2px;background:#D4C4B0;margin:14px auto 0}
    .modal-header{padding:16px 20px 12px;display:flex;align-items:center;justify-content:space-between}
    .modal-title{font-family:'Cormorant Garamond',serif;font-size:20px;font-style:italic;color:var(--ink)}
    .modal-close{width:32px;height:32px;border-radius:50%;background:var(--cream);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--ink3);font-size:18px;line-height:1}
    .tarjeta-img-wrap{margin:0 16px 14px;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(26,18,9,0.15);background:var(--dark);min-height:200px;display:flex;align-items:center;justify-content:center}
    .tarjeta-img-wrap img{width:100%;display:block;border-radius:18px}
    .tarjeta-skeleton{width:100%;aspect-ratio:8/9;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;color:rgba(201,169,110,0.7);font-size:13px;font-weight:500}
    .tarjeta-spinner{width:34px;height:34px;border-radius:50%;border:2.5px solid rgba(201,169,110,0.2);border-top-color:var(--gold);animation:spin .75s linear infinite}
    .modal-btns{padding:0 16px 8px;display:flex;flex-direction:column;gap:10px}
    .btn-compartir-wa{width:100%;background:linear-gradient(135deg,#1a5c36,#128C7E);color:#fff;border:none;border-radius:16px;padding:16px;font-size:14px;font-weight:600;font-family:'Jost',sans-serif;cursor:pointer;box-shadow:0 5px 18px rgba(18,140,126,0.30);display:flex;align-items:center;justify-content:center;gap:9px;transition:transform .18s}
    .btn-compartir-wa:hover{transform:translateY(-1px)}
    .btn-compartir-wa:disabled{opacity:.7;cursor:wait}
    .btn-descargar{width:100%;background:var(--cream);color:var(--ink2);border:1.5px solid var(--border-mid);border-radius:16px;padding:14px;font-size:13px;font-weight:600;font-family:'Jost',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .18s}
    .btn-descargar:hover{background:var(--gold-pale);border-color:var(--gold)}
    .btn-descargar:disabled{opacity:.6;cursor:wait}
    .modal-cancelar{width:100%;background:transparent;border:none;padding:12px;font-size:13px;font-weight:500;color:var(--ink3);cursor:pointer;font-family:'Jost',sans-serif}

    /* Tu Mesa */
    .tu-mesa-card{
      display:flex;align-items:center;gap:14px;
      background:linear-gradient(135deg,rgba(201,169,110,0.1) 0%,rgba(232,213,176,0.15) 100%);
      border:1.5px solid rgba(201,169,110,0.35);
      border-radius:16px;padding:16px 18px;margin:4px 0 8px;
      box-shadow:0 4px 16px rgba(201,169,110,0.12);
    }
    .tu-mesa-icon{font-size:28px;line-height:1;flex-shrink:0}
    .tu-mesa-info{flex:1}
    .tu-mesa-label{font-size:10px;font-weight:600;color:var(--gold);text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px}
    .tu-mesa-nombre{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:var(--ink);letter-spacing:.3px}

    /* Rechazado */
    .rech-card{background:var(--surface);border-radius:var(--r);border:1px solid var(--border-mid);box-shadow:var(--shadow);padding:40px 26px;text-align:center;animation:riseUp .5s cubic-bezier(.22,1,.36,1) both}
    .rech-titulo{font-family:'Cormorant Garamond',serif;font-size:32px;font-style:italic;color:var(--ink);margin-bottom:12px}
    .rech-sub{font-size:14px;color:var(--ink2);line-height:1.8}

    /* Loading */
    .loading-screen{min-height:100dvh;background:#FAF6F0;display:flex;flex-direction:column;align-items:center;justify-content:center}
    .loading-spinner{width:28px;height:28px;border-radius:50%;border:2.5px solid transparent;border-top-color:#C9A96E;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    canvas#confetti-canvas{position:fixed;inset:0;z-index:9999;width:100%;height:100%;display:none;pointer-events:none}

    /* ─── PWA Install Prompt ─── */
    .pwa-prompt{
      position:fixed;bottom:0;left:0;right:0;z-index:9000;
      background:rgba(20,13,4,0.97);
      backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
      padding:16px 20px calc(16px + env(safe-area-inset-bottom,0px));
      border-top:1px solid rgba(201,169,110,0.3);
      display:flex;align-items:center;gap:14px;
      animation:slideUp .4s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
    .pwa-prompt-icon{width:48px;height:48px;border-radius:12px;flex-shrink:0;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.3)}
    .pwa-prompt-text{flex:1;min-width:0}
    .pwa-prompt-title{font-size:13px;font-weight:600;color:#E8D5B0;line-height:1.3;margin-bottom:2px}
    .pwa-prompt-sub{font-size:11px;color:rgba(232,213,176,0.6);line-height:1.4}
    .pwa-prompt-ios{display:flex;align-items:center;gap:4px;margin-top:5px;font-size:10.5px;color:rgba(201,169,110,0.8);font-weight:500}
    .pwa-prompt-btns{display:flex;flex-direction:column;gap:6px;flex-shrink:0}
    .pwa-prompt-add{background:linear-gradient(135deg,#C9A96E,#E8C97A);color:#140d04;border:none;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Jost',sans-serif;white-space:nowrap;letter-spacing:.2px}
    .pwa-prompt-close{background:transparent;border:1px solid rgba(201,169,110,0.3);border-radius:10px;padding:7px 10px;font-size:11px;font-weight:500;color:rgba(232,213,176,0.5);cursor:pointer;font-family:'Jost',sans-serif;white-space:nowrap}
  `;

  if (loading)
    return (
      <>
        <style>{styles}</style>
        <div className="loading-screen">
          <AppLogo size={72} />
          <div style={{marginTop: 14, fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 26, color: "#1a0f04", letterSpacing: 3}}>Eventix</div>
          <div className="loading-spinner" style={{marginTop: 24}} />
          <p
            style={{
              fontSize: 11,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: "rgba(201,169,110,0.7)",
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

  return (
    <>
      <style>{styles}</style>
      <canvas id="confetti-canvas" ref={canvasRef} />

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
                    <span>{tipoOrn}</span>
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
                            <path d="M4 10h16M4 14h10" stroke="#C9A96E" strokeWidth="1.8" strokeLinecap="round"/>
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

                {/* 4️⃣ Cómo llegar — texto, sin botón de ubicación */}
                {evento.como_llegar && (
                  <div className="como-llegar-box">
                    <div className="como-llegar-label">Instrucciones para llegar</div>
                    <p className="como-llegar-text">{evento.como_llegar}</p>
                  </div>
                )}

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
                    <div className="tu-mesa-icon">🪑</div>
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
                {invitado.numero_confirmacion && (
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

      {/* ─── Banner "Agregar a pantalla de inicio" ─── */}
      {showPwaPrompt && (
        <div className="pwa-prompt">
          <div className="pwa-prompt-icon">
            <AppLogo size={48} />
          </div>
          <div className="pwa-prompt-text">
            <div className="pwa-prompt-title">Abre como app, sin barra de URL</div>
            <div className="pwa-prompt-sub">Experiencia completa, como app nativa</div>
            <div className="pwa-prompt-ios">
              {/* Instrucción según plataforma — se renderiza en cliente */}
              {typeof window !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent)
                ? <>Toca <strong style={{color:"#C9A96E"}}>⎙ Compartir</strong> → &ldquo;Agregar a inicio&rdquo;</>
                : <>Toca <strong style={{color:"#C9A96E"}}>⋮ Menú</strong> → &ldquo;Añadir a pantalla de inicio&rdquo;</>
              }
            </div>
          </div>
          <div className="pwa-prompt-btns">
            <button
              className="pwa-prompt-add"
              onClick={() => {
                sessionStorage.setItem("pwa-prompt-dismissed", "1");
                setShowPwaPrompt(false);
              }}
            >
              Entendido
            </button>
            <button
              className="pwa-prompt-close"
              onClick={() => {
                sessionStorage.setItem("pwa-prompt-dismissed", "1");
                setShowPwaPrompt(false);
              }}
            >
              No gracias
            </button>
          </div>
        </div>
      )}
    </>
  );
}
