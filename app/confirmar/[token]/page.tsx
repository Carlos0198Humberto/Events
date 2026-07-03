"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { toast } from "@/app/components/Toast";
import { AppLogo } from "@/app/components/AppLogo";
import { openWhatsApp } from "@/app/utils/openWhatsApp";
import qrcode from "qrcode-generator";

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
  plano_mesas_url?: string | null;
  fotos_carrusel?: string[] | null;
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

const STICKERS_DESEO = ["🌸", "💖", "✨", "🌟", "🎊", "🦋", "🌹", "💫", "🎀", "🍀", "🥂", "🎶"];
const COLORES_DESEO_FORM = [
  "#EEF2FF", "#E0E7FF", "#DBEAFE", "#D1FAE5",
  "#FEF9C3", "#FEE2E2", "#F3E8FF", "#FDF4FF",
];

// Parsea "YYYY-MM-DD" como fecha LOCAL (no UTC) para evitar el desfase de un día.
function parseFechaLocal(fecha: string): Date {
  const soloFecha = fecha.split("T")[0];
  const [y, m, d] = soloFecha.split("-").map((n) => parseInt(n, 10));
  return new Date(y, (m || 1) - 1, d || 1);
}
function formatFecha(fecha: string) {
  return parseFechaLocal(fecha).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function formatFechaCorta(fecha: string) {
  return parseFechaLocal(fecha).toLocaleDateString("es-ES", {
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

// ─── Descargar archivo .ics (Apple/Outlook/Google) con recordatorio 24 h antes ─
function descargarICS(evento: Evento) {
  if (!evento.fecha) return;
  const [y, m, d] = evento.fecha.split("T")[0].split("-");
  let dtStart: string, dtEnd: string, allDay = false;
  if (evento.hora) {
    const [h, min] = evento.hora.replace(".", ":").split(":");
    const hPad = String(parseInt(h)).padStart(2, "0");
    const mPad = String(parseInt(min || "0")).padStart(2, "0");
    const hFin = String(Math.min(23, parseInt(hPad) + 3)).padStart(2, "0");
    dtStart = `${y}${m}${d}T${hPad}${mPad}00`;
    dtEnd = `${y}${m}${d}T${hFin}${mPad}00`;
  } else {
    dtStart = `${y}${m}${d}`;
    dtEnd = `${y}${m}${d}`;
    allDay = true;
  }
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Evorix//Invitaciones//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${evento.id}@evorix`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    allDay ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART:${dtStart}`,
    allDay ? `DTEND;VALUE=DATE:${dtEnd}` : `DTEND:${dtEnd}`,
    `SUMMARY:${esc(`🎓 ${evento.nombre}`)}`,
    `DESCRIPTION:${esc(`${TIPO_LABEL[evento.tipo] || "Evento"} de ${evento.anfitriones}. ¡No faltes!`)}`,
    evento.lugar ? `LOCATION:${esc(evento.lugar)}` : "",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(`Mañana es ${evento.nombre} 🎓`)}`,
    "TRIGGER:-P1D",
    "END:VALARM",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(`¡Hoy es ${evento.nombre}! Faltan 3 horas 🎉`)}`,
    "TRIGGER:-PT3H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  const blob = new Blob([lineas.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${evento.nombre.replace(/[^\wáéíóúñÁÉÍÓÚÑ ]/g, "").trim() || "evento"}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// ─── Sonido de celebración: fanfarria + aplausos sintetizados (sin archivos) ──
function sonidoCelebracion() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    // Fanfarria: Do–Mi–Sol–Do agudo con timbre de trompeta (sawtooth suavizado)
    const notas = [523.25, 659.25, 783.99, 1046.5];
    notas.forEach((f, i) => {
      const t0 = ctx.currentTime + i * 0.16;
      const dur = i === notas.length - 1 ? 0.7 : 0.22;
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const g = ctx.createGain();
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.value = 2600;
      osc.type = "sawtooth"; osc.frequency.value = f;
      osc2.type = "triangle"; osc2.frequency.value = f * 2;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.28, t0 + 0.03);
      g.gain.setValueAtTime(0.24, t0 + dur * 0.6);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(filt); osc2.connect(filt); filt.connect(g); g.connect(master);
      osc.start(t0); osc2.start(t0);
      osc.stop(t0 + dur + 0.05); osc2.stop(t0 + dur + 0.05);
    });
    // Aplausos: ráfagas de ruido filtrado durante ~2 s
    const dur = 2.2;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      // Densidad de "palmadas" que decae al final
      const burst = Math.random() < 0.028 * (1 - t / dur * 0.55) ? 1 : 0;
      data[i] = (i > 0 ? data[i - 1] : 0) * 0.62 + burst * (Math.random() * 2 - 1) * 0.9;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 1900; bp.Q.value = 0.7;
    const ga = ctx.createGain();
    const tA = ctx.currentTime + 0.25;
    ga.gain.setValueAtTime(0, tA);
    ga.gain.linearRampToValueAtTime(0.5, tA + 0.25);
    ga.gain.setValueAtTime(0.5, tA + dur - 0.7);
    ga.gain.linearRampToValueAtTime(0, tA + dur);
    src.connect(bp); bp.connect(ga); ga.connect(master);
    src.start(tA);
    setTimeout(() => { try { ctx.close(); } catch {} }, (dur + 1.5) * 1000);
  } catch { /* audio opcional */ }
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

// AppLogo viene del componente compartido — importado arriba

// ─── Iconos SVG ───────────────────────────────────────────────────────────────
const IcoFecha = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    {/* Calendario moderno — sin "puntos", más limpio */}
    <rect x="3" y="5" width="18" height="16" rx="3" stroke="#4F46E5" strokeWidth="1.6" strokeLinejoin="round"/>
    <path d="M3 10h18" stroke="#4F46E5" strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M8 3v4M16 3v4" stroke="#4F46E5" strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="8" cy="15" r="1" fill="#4F46E5"/>
    <circle cx="12" cy="15" r="1" fill="#4F46E5"/>
    <circle cx="16" cy="15" r="1" fill="#4F46E5"/>
  </svg>
);
const IcoHora = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="#4F46E5" strokeWidth="1.6"/>
    <path d="M12 7v5.25l3.5 2" stroke="#4F46E5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcoLugar = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#4F46E5" strokeWidth="1.6" strokeLinejoin="round"/>
    <circle cx="12" cy="9" r="2.5" stroke="#4F46E5" strokeWidth="1.6"/>
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
    <circle cx="9" cy="7" r="3.5" stroke="#4F46E5" strokeWidth="1.6"/>
    <path d="M2 20c0-3.31 3.13-6 7-6s7 2.69 7 6" stroke="#4F46E5" strokeWidth="1.6" strokeLinecap="round"/>
    <circle cx="17" cy="8" r="2.5" stroke="#4F46E5" strokeWidth="1.4" opacity="0.7"/>
    <path d="M20 20c0-2.5-1.8-4.6-4.3-5.4" stroke="#4F46E5" strokeWidth="1.4" strokeLinecap="round" opacity="0.7"/>
  </svg>
);
const IcoCalendario = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="5" width="18" height="16" rx="3" stroke="#4F46E5" strokeWidth="1.6" strokeLinejoin="round"/>
    <path d="M3 10h18" stroke="#4F46E5" strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M8 3v4M16 3v4" stroke="#4F46E5" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IcoCamera = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    {/* Cámara minimalista y limpia */}
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#4F46E5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="13" r="4" stroke="#4F46E5" strokeWidth="1.6"/>
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

// ─── Elementos flotantes animados (atrás del contenido, no tapan nada) ────────
function FloatingDecor({ tipo }: { tipo: string }) {
  if (tipo === "cumpleaños") {
    const piezas = [
      { left: "5%",  color: "#4F46E5", shape: "rect",   sz: 8,  delay: "0s",    dur: "3.2s" },
      { left: "14%", color: "#818CF8", shape: "circle", sz: 6,  delay: "0.4s",  dur: "2.8s" },
      { left: "22%", color: "#F59E0B", shape: "rect",   sz: 9,  delay: "0.1s",  dur: "3.6s" },
      { left: "31%", color: "#10B981", shape: "circle", sz: 7,  delay: "0.7s",  dur: "2.6s" },
      { left: "39%", color: "#EC4899", shape: "rect",   sz: 6,  delay: "0.3s",  dur: "3.0s" },
      { left: "48%", color: "#3B82F6", shape: "circle", sz: 10, delay: "0.9s",  dur: "3.4s" },
      { left: "57%", color: "#A5B4FC", shape: "rect",   sz: 7,  delay: "0.2s",  dur: "2.9s" },
      { left: "65%", color: "#34D399", shape: "circle", sz: 6,  delay: "0.6s",  dur: "3.1s" },
      { left: "73%", color: "#4F46E5", shape: "rect",   sz: 8,  delay: "0.5s",  dur: "2.7s" },
      { left: "81%", color: "#F59E0B", shape: "circle", sz: 9,  delay: "0.8s",  dur: "3.5s" },
      { left: "89%", color: "#EC4899", shape: "rect",   sz: 6,  delay: "0.15s", dur: "3.0s" },
      { left: "95%", color: "#818CF8", shape: "circle", sz: 7,  delay: "0.55s", dur: "2.8s" },
    ];
    return (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: -1 }}>
        <style>{`@keyframes confFall{0%{transform:translateY(-12px) rotate(0deg);opacity:0}15%{opacity:0.48}85%{opacity:0.38}100%{transform:translateY(420px) rotate(600deg);opacity:0}}`}</style>
        {piezas.map((p, i) => (
          <div key={i} style={{
            position: "absolute", top: -14, left: p.left,
            width: p.sz, height: p.sz,
            background: p.color,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            animation: `confFall ${p.dur} ${p.delay} linear infinite`,
          }} />
        ))}
      </div>
    );
  }

  if (tipo === "graduacion") {
    const caps = [
      { left: "4%",  delay: "0s",   dur: "4.0s", sz: 18 },
      { left: "16%", delay: "0.5s", dur: "3.4s", sz: 14 },
      { left: "28%", delay: "1.0s", dur: "3.8s", sz: 20 },
      { left: "42%", delay: "0.3s", dur: "4.2s", sz: 16 },
      { left: "55%", delay: "0.8s", dur: "3.6s", sz: 22 },
      { left: "68%", delay: "0.2s", dur: "3.9s", sz: 14 },
      { left: "80%", delay: "0.6s", dur: "4.1s", sz: 18 },
      { left: "92%", delay: "1.2s", dur: "3.5s", sz: 16 },
    ];
    return (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: -1 }}>
        <style>{`@keyframes capFloat{0%{transform:translateY(420px) rotate(-8deg);opacity:0}15%{opacity:0.3}85%{opacity:0.25}100%{transform:translateY(-12px) rotate(8deg);opacity:0}}`}</style>
        {caps.map((c, i) => (
          <div key={i} style={{
            position: "absolute", bottom: -24, left: c.left,
            fontSize: c.sz, lineHeight: 1,
            animation: `capFloat ${c.dur} ${c.delay} linear infinite`,
            userSelect: "none",
          }}>🎓</div>
        ))}
      </div>
    );
  }

  return null;
}

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
        {/* Emblema de graduación realista: laureles + birrete con sombreado + borla dorada */}
        <svg width="150" height="80" viewBox="0 0 150 80" fill="none">
          <defs>
            <linearGradient id="gradCapBoard" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4338ca" />
              <stop offset="45%" stopColor="#312e81" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>
            <linearGradient id="gradCapBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#312e81" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>
            <linearGradient id="gradGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <radialGradient id="gradGlow" cx="0.5" cy="0.35" r="0.7">
              <stop offset="0%" stopColor="rgba(252,211,77,0.35)" />
              <stop offset="100%" stopColor="rgba(252,211,77,0)" />
            </radialGradient>
          </defs>
          {/* Resplandor de fondo */}
          <ellipse cx="75" cy="38" rx="60" ry="34" fill="url(#gradGlow)" />
          {/* Laurel izquierdo */}
          <g stroke="#B45309" strokeWidth="1.4" fill="rgba(245,158,11,0.30)">
            <path d="M28 66 Q14 52 14 30 Q14 22 18 14" fill="none" strokeWidth="1.8"/>
            {[[16,18,-40],[14,28,-15],[15,38,5],[18,47,20],[23,56,38],[29,63,52]].map(([x,y,rot],i)=>(
              <ellipse key={i} cx={x} cy={y} rx="6.5" ry="3" transform={`rotate(${rot} ${x} ${y})`} />
            ))}
          </g>
          {/* Laurel derecho */}
          <g stroke="#B45309" strokeWidth="1.4" fill="rgba(245,158,11,0.30)">
            <path d="M122 66 Q136 52 136 30 Q136 22 132 14" fill="none" strokeWidth="1.8"/>
            {[[134,18,40],[136,28,15],[135,38,-5],[132,47,-20],[127,56,-38],[121,63,-52]].map(([x,y,rot],i)=>(
              <ellipse key={i} cx={x} cy={y} rx="6.5" ry="3" transform={`rotate(${rot} ${x} ${y})`} />
            ))}
          </g>
          {/* Sombra del birrete */}
          <ellipse cx="75" cy="64" rx="30" ry="4.5" fill="rgba(15,23,42,0.12)" />
          {/* Cuerpo del birrete (casquete) */}
          <path d="M55 40 L55 54 Q75 63 95 54 L95 40 Z" fill="url(#gradCapBody)" />
          <path d="M55 40 L55 54 Q75 63 95 54 L95 40" stroke="#1e1b4b" strokeWidth="1" fill="none" opacity="0.6"/>
          {/* Tablero (mortarboard) con perspectiva */}
          <path d="M75 18 L118 36 L75 54 L32 36 Z" fill="url(#gradCapBoard)" />
          {/* Brillo del tablero */}
          <path d="M75 18 L118 36 L75 41 L32 36 Z" fill="rgba(255,255,255,0.14)" />
          <path d="M75 18 L118 36 L75 54 L32 36 Z" stroke="#1e1b4b" strokeWidth="1.4" strokeLinejoin="round" fill="none" opacity="0.55"/>
          {/* Botón central dorado */}
          <circle cx="75" cy="34" r="3.4" fill="url(#gradGold)" stroke="#92400E" strokeWidth="0.6"/>
          {/* Cordón de la borla */}
          <path d="M75 34 Q96 36 103 52" stroke="url(#gradGold)" strokeWidth="2.4" fill="none" strokeLinecap="round"/>
          {/* Borla dorada con hilos */}
          <circle cx="103" cy="53" r="3.2" fill="url(#gradGold)" />
          <path d="M100.5 55 L99.5 66 M103 56 L103 67 M105.5 55 L106.5 66" stroke="url(#gradGold)" strokeWidth="2" strokeLinecap="round"/>
          <rect x="99" y="54.5" width="8" height="2.6" rx="1.3" fill="#B45309" />
          {/* Diploma con lazo */}
          <g transform="translate(38,52) rotate(-12)">
            <rect x="0" y="0" width="24" height="9" rx="4.5" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.2"/>
            <rect x="9" y="-1.5" width="6" height="12" rx="2" fill="#DC2626" opacity="0.85"/>
          </g>
          {/* Destellos */}
          <path d="M75 4 L76.5 9 L81 10.5 L76.5 12 L75 17 L73.5 12 L69 10.5 L73.5 9 Z" fill="#F59E0B" opacity="0.9"/>
          <circle cx="46" cy="14" r="1.6" fill="#FCD34D" />
          <circle cx="106" cy="12" r="1.6" fill="#FCD34D" />
        </svg>
        {/* Guirnalda de estrellas doradas */}
        <svg width="200" height="28" viewBox="0 0 200 28" fill="none">
          <path d="M0 14 Q50 5 100 14 Q150 23 200 14" stroke="#D97706" strokeWidth="0.8" fill="none" opacity="0.45" />
          {[20, 60, 100, 140, 180].map((x, i) => (
            <g key={x} transform={`translate(${x},14)`}>
              <path d={`M0 -${i===2?7:5} L1.5 -2 L${i===2?7:5} 0 L1.5 2 L0 ${i===2?7:5} L-1.5 2 L-${i===2?7:5} 0 L-1.5 -2 Z`} fill="#F59E0B" opacity={i===2?0.95:0.65} />
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


// ─── Ref global de audio para control de volumen desde TTS ───────────────────
const globalAudioRef: { current: HTMLAudioElement | null } = { current: null };

// ─── Frase con efecto máquina de escribir (graduación) ────────────────────────
function TypewriterFrase({ texto }: { texto: string }) {
  const [visible, setVisible] = useState(0);
  const [arranca, setArranca] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // Arranca cuando la frase entra en pantalla
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setArranca(true); return; }
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) { setArranca(true); obs.disconnect(); } },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!arranca || visible >= texto.length) return;
    const t = setTimeout(() => setVisible(v => v + 1), 55);
    return () => clearTimeout(t);
  }, [arranca, visible, texto.length]);
  const terminado = visible >= texto.length;
  return (
    <div ref={ref} style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontStyle: "italic", color: "var(--ink2)", marginTop: 14, lineHeight: 1.6, padding: "0 8px", minHeight: 26 }}>
      <style>{`@keyframes twBlink{0%,49%{opacity:1}50%,100%{opacity:0}}`}</style>
      <span style={{ color: "#B45309", marginRight: 4 }}>❝</span>
      {texto.slice(0, visible)}
      <span style={{
        display: "inline-block", width: 2, height: 18, verticalAlign: "-3px",
        background: "linear-gradient(180deg,#F59E0B,#B45309)", marginLeft: 2,
        animation: "twBlink 0.85s step-end infinite",
        opacity: terminado ? 0 : 1,
        transition: terminado ? "opacity .8s 1.2s" : "none",
      }} />
      {terminado && <span style={{ color: "#B45309", marginLeft: 4 }}>❞</span>}
    </div>
  );
}

// ─── Carrusel de fotos del graduado (bebé → hoy) ──────────────────────────────
function CarruselGrad({ fotos }: { fotos: string[] }) {
  const [idx, setIdx] = useState(0);
  const [pausado, setPausado] = useState(false);
  const touchX = useRef<number | null>(null);
  useEffect(() => {
    if (pausado || fotos.length < 2) return;
    const id = setInterval(() => setIdx(i => (i + 1) % fotos.length), 3800);
    return () => clearInterval(id);
  }, [pausado, fotos.length]);
  if (!fotos.length) return null;
  return (
    <div style={{ margin: "14px 0 4px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(to right,transparent,rgba(217,119,6,0.5))" }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#B45309", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          📸 Su historia
        </span>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(to left,transparent,rgba(217,119,6,0.5))" }} />
      </div>
      <div
        style={{
          position: "relative", borderRadius: 18, overflow: "hidden",
          aspectRatio: "4 / 3", background: "#1e1b4b",
          border: "2px solid rgba(217,119,6,0.45)",
          boxShadow: "0 10px 30px rgba(30,27,75,0.30)",
        }}
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; setPausado(true); }}
        onTouchEnd={(e) => {
          const x0 = touchX.current;
          touchX.current = null;
          setPausado(false);
          if (x0 === null) return;
          const dx = e.changedTouches[0].clientX - x0;
          if (Math.abs(dx) > 40) {
            setIdx(i => (i + (dx < 0 ? 1 : fotos.length - 1)) % fotos.length);
          }
        }}
      >
        {fotos.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url + i}
            src={url}
            alt={`Foto ${i + 1}`}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover",
              opacity: i === idx ? 1 : 0,
              transform: i === idx ? "scale(1)" : "scale(1.06)",
              transition: "opacity .9s ease, transform 4.5s ease",
            }}
          />
        ))}
        {/* Degradado inferior + contador */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "34%", background: "linear-gradient(to top,rgba(10,10,30,0.55),transparent)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 10, right: 12, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "#FDE68A" }}>
          {idx + 1} / {fotos.length}
        </div>
        {/* Flechas */}
        {fotos.length > 1 && (
          <>
            <button
              onClick={() => setIdx(i => (i + fotos.length - 1) % fotos.length)}
              aria-label="Anterior"
              style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(255,255,255,0.85)", color: "#92400E", fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}
            >‹</button>
            <button
              onClick={() => setIdx(i => (i + 1) % fotos.length)}
              aria-label="Siguiente"
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(255,255,255,0.85)", color: "#92400E", fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}
            >›</button>
          </>
        )}
      </div>
      {/* Puntos */}
      {fotos.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
          {fotos.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Foto ${i + 1}`}
              style={{
                width: i === idx ? 22 : 8, height: 8, borderRadius: 8,
                border: "none", cursor: "pointer", padding: 0,
                background: i === idx ? "linear-gradient(90deg,#D97706,#F59E0B)" : "rgba(217,119,6,0.30)",
                transition: "all .3s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Cuenta regresiva dorada para graduación ──────────────────────────────────
function CountdownGrad({ fecha, hora }: { fecha: string; hora?: string | null }) {
  const target = new Date(`${fecha}T${hora && /^\d{2}:\d{2}/.test(hora) ? hora.slice(0, 5) : "12:00"}:00`).getTime();
  const [restante, setRestante] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setRestante(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  if (restante === null) return null;
  const d = Math.floor(restante / 86400000);
  const h = Math.floor((restante % 86400000) / 3600000);
  const m = Math.floor((restante % 3600000) / 60000);
  const s = Math.floor((restante % 60000) / 1000);
  const unidades = [
    { v: d, l: "días" },
    { v: h, l: "horas" },
    { v: m, l: "min" },
    { v: s, l: "seg" },
  ];
  return (
    <div style={{
      margin: "14px 0 4px",
      borderRadius: 18,
      padding: "16px 12px 14px",
      background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 55%,#4338ca 100%)",
      border: "1.5px solid rgba(245,158,11,0.45)",
      boxShadow: "0 8px 26px rgba(30,27,75,0.35), inset 0 1px 0 rgba(252,211,77,0.18)",
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes cdShine{0%{transform:translateX(-120%) skewX(-18deg)}100%{transform:translateX(320%) skewX(-18deg)}}
        @keyframes cdPulseSeg{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
      `}</style>
      <div style={{ position:"absolute", top:0, bottom:0, width:"32%", background:"linear-gradient(105deg,transparent,rgba(252,211,77,0.10),transparent)", animation:"cdShine 4.5s ease-in-out infinite", pointerEvents:"none" }}/>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 2.5, color: "#FCD34D", textTransform: "uppercase", marginBottom: 10 }}>
        🎓 Falta poco para la graduación
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
        {restante === 0 ? (
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700, color: "#FDE68A" }}>
            ¡Es hoy! 🎉
          </div>
        ) : unidades.map((u, i) => (
          <div key={u.l} style={{
            minWidth: 62,
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(252,211,77,0.30)",
            borderRadius: 12,
            padding: "8px 4px 7px",
            backdropFilter: "blur(4px)",
          }}>
            <div style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: 27, fontWeight: 700, lineHeight: 1,
              color: "#FDE68A",
              textShadow: "0 2px 10px rgba(252,211,77,0.35)",
              animation: i === 3 ? "cdPulseSeg 1s ease-in-out infinite" : "none",
            }}>
              {String(u.v).padStart(2, "0")}
            </div>
            <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: 1.4, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", marginTop: 3 }}>
              {u.l}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Burbuja karaoke: muestra la frase que se está leyendo con la palabra actual resaltada ─
function KaraokeBubble({ texto, charIdx }: { texto: string; charIdx: number }) {
  if (!texto) return null;
  // Dividir en oraciones conservando offsets
  const oraciones: { start: number; text: string }[] = [];
  const re = /[^.!?…]+[.!?…]*\s*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) oraciones.push({ start: m.index, text: m[0] });
  if (!oraciones.length) oraciones.push({ start: 0, text: texto });
  // Oración que contiene el carácter actual
  let actual = oraciones[0];
  for (const o of oraciones) {
    if (charIdx >= o.start && charIdx < o.start + o.text.length) { actual = o; break; }
    if (o.start <= charIdx) actual = o;
  }
  // Palabras con offset absoluto
  const palabras: { start: number; w: string }[] = [];
  const wre = /\S+/g;
  while ((m = wre.exec(actual.text))) palabras.push({ start: actual.start + m.index, w: m[0] });
  return (
    <div style={{
      pointerEvents: "none",
      maxWidth: 250,
      background: "rgba(15,23,42,0.92)",
      backdropFilter: "blur(10px)",
      borderRadius: "16px 16px 4px 16px",
      border: "1px solid rgba(252,211,77,0.35)",
      padding: "10px 14px",
      marginBottom: 8,
      boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
      animation: "mascIn .3s ease both",
    }}>
      <div style={{ fontSize: 13.5, lineHeight: 1.55, fontFamily: "'DM Sans',sans-serif" }}>
        {palabras.map((p, i) => {
          const dicha = p.start <= charIdx;
          const esActual = dicha && (i === palabras.length - 1 || palabras[i + 1].start > charIdx);
          return (
            <span key={i} style={{
              color: esActual ? "#FCD34D" : dicha ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.42)",
              fontWeight: esActual ? 800 : dicha ? 600 : 400,
              textShadow: esActual ? "0 0 12px rgba(252,211,77,0.55)" : "none",
              transition: "color .12s, font-weight .12s",
            }}>{p.w}{" "}</span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Mascota flotante sobre la invitación ────────────────────────────────────
function FloatingMascot({
  invitado, evento, token: _token, fase, setFase, hablando, leer, detener, textoActual, charIdx,
}: {
  invitado: { nombre: string };
  evento: { nombre: string; tipo: string; anfitriones?: string; frase_evento?: string | null;
             mensaje_invitacion?: string | null; fecha?: string | null; hora?: string | null;
             lugar?: string | null; como_llegar?: string | null; };
  token: string; fase: string;
  setFase: (f: string) => void;
  hablando: boolean;
  leer: (t: string, cb?: () => void) => void;
  detener: () => void;
  textoActual: string;
  charIdx: number;
}) {
  const [minimizado, setMinimizado] = useState(false);


  // ── FASE 1: Lee la invitación y termina con "dale click a Confirmar" ──────
  useEffect(() => {
    if (fase !== "leyendo") return;
    const primerNombre = invitado.nombre.trim().split(" ")[0];
    const partes: string[] = [];
    partes.push(`¡Hola, ${primerNombre}! Tenés una invitación especial.`);
    partes.push(`Estás invitad${primerNombre.endsWith("a") ? "a" : "o"} a ${evento.nombre}.`);
    if (evento.anfitriones) partes.push(`Organizado con cariño por ${evento.anfitriones}.`);
    if (evento.frase_evento) partes.push(evento.frase_evento + ".");
    if (evento.mensaje_invitacion) partes.push(evento.mensaje_invitacion);
    if (evento.fecha) {
      const f = new Date(evento.fecha + "T12:00:00").toLocaleDateString("es", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
      partes.push(`La celebración será el ${f}.`);
    }
    if (evento.hora) partes.push(`Comenzamos a las ${evento.hora} horas.`);
    if (evento.lugar) partes.push(`El lugar es ${evento.lugar}.`);
    if (evento.como_llegar) partes.push(`Para llegar: ${evento.como_llegar}.`);
    partes.push(`Para confirmar tu asistencia, dale click al botón Confirmar asistencia que aparece más abajo.`);
    leer(partes.join(" "), () => setFase("esperando_confirm"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  // Detección de step manejada en el componente padre

  // ── FASE 2: Post confirmación — cuántos van ───────────────────────────────
  useEffect(() => {
    if (fase !== "post_confirm") return;
    leer(
      "¡Perfecto! Ahora indicá cuántas personas irán contigo a la graduación, incluyéndote a vos.",
      () => setFase("esperando_submit")
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  // ── FASE 3: Instrucciones de acciones disponibles ────────────────────────
  useEffect(() => {
    if (fase !== "instrucciones") return;
    leer(
      "¡Listo, ya quedaste registrado! Si querés compartir un momento especial, podés subir hasta cinco fotos del evento, las cuales se verán en el muro para que todos las disfruten. También podés escribirle un deseo al graduado, agendar la fecha en tu calendario, o ver el muro. Si no deseás hacer nada más, usá el botón de salir. ¡Muchas gracias y que disfruten la celebración!",
      () => setFase("oculto")
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  // ── FASE 4: Despedida si no puede asistir ─────────────────────────────────
  useEffect(() => {
    if (fase !== "despedida") return;
    const primerNombre = invitado.nombre.trim().split(" ")[0];
    leer(
      `Lamentamos mucho que no puedas acompañarnos, ${primerNombre}. Igual podés dejarle un deseo al graduado desde el muro. ¡Gracias por avisarnos y que estés muy bien!`,
      () => setFase("oculto")
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  if (minimizado) {
    return (
      <div
        onClick={() => setMinimizado(false)}
        style={{ position:"fixed", bottom:130, right:14, zIndex:8000, cursor:"pointer",
          width:56, height:56, borderRadius:"50%",
          overflow:"hidden",
          boxShadow:"0 6px 20px rgba(79,70,229,0.45)",
          animation: hablando ? "mascPulse 0.6s ease-in-out infinite alternate" : "none",
        }}
      >
        <style>{`@keyframes mascPulse{from{transform:scale(1)}to{transform:scale(1.12)}}`}</style>
        <GradAvatar size={56} hablando={hablando} />
      </div>
    );
  }

  return (
    <div style={{
      position:"fixed", bottom:130, right:14, zIndex:8000,
      display:"flex", flexDirection:"column", alignItems:"flex-end", gap:0,
      pointerEvents:"none",
    }}>
      <style>{`
        @keyframes mascFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes mascIn{from{opacity:0;transform:translateY(20px) scale(.9)}to{opacity:1;transform:translateY(0) scale(1)}}
        .masc-wrap{animation:mascIn .5s cubic-bezier(.22,1,.36,1) both, mascFloat 2.4s 0.5s ease-in-out infinite;pointer-events:auto}
        .masc-ctrl{pointer-events:auto;display:flex;gap:6px;margin-bottom:4px;justify-content:flex-end}
        .masc-btn{padding:4px 10px;border-radius:20px;border:none;font-size:11px;font-weight:700;cursor:pointer;font-family:"DM Sans",sans-serif;backdrop-filter:blur(8px)}
      `}</style>

      {/* Controles */}
      <div className="masc-ctrl">
        {(fase === "leyendo") && (
          <button className="masc-btn" style={{ background:"rgba(255,255,255,0.92)", color:"#4F46E5" }}
            onClick={() => { detener(); setFase("instrucciones"); }}>
            Saltar →
          </button>
        )}
        <button className="masc-btn" style={{ background:"rgba(0,0,0,0.55)", color:"white" }}
          onClick={() => { detener(); setMinimizado(true); }}>
          —
        </button>
      </div>

      {/* Burbuja con el texto leído en sincronía con la voz */}
      {hablando && <KaraokeBubble texto={textoActual} charIdx={charIdx} />}

      {/* Mascota */}
      <div className="masc-wrap">
        <GradMascot hablando={hablando} />
      </div>
    </div>
  );
}

// ─── Avatar animado de graduado: parpadea, habla y balancea la borla ──────────
function GradAvatar({ size = 64, hablando }: { size?: number; hablando: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={hablando ? "av-root talking" : "av-root"}
      style={{ display: "block" }}
    >
      <style>{`
        .av-eyes{transform-box:fill-box;transform-origin:center;animation:avBlink 4.2s ease-in-out infinite}
        @keyframes avBlink{0%,91%,100%{transform:scaleY(1)}94%,96%{transform:scaleY(0.08)}}
        .av-head{transform-box:fill-box;transform-origin:50% 62%}
        .av-root.talking .av-head{animation:avNod 0.95s ease-in-out infinite}
        @keyframes avNod{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}}
        .av-mouth-talk{transform-box:fill-box;transform-origin:center;animation:avTalk .26s ease-in-out infinite alternate}
        @keyframes avTalk{from{transform:scaleY(0.3) scaleX(1.15)}to{transform:scaleY(1.1) scaleX(0.92)}}
        .av-tassel{transform-box:fill-box;transform-origin:0% 0%;animation:avSwing 2.8s ease-in-out infinite}
        .av-root.talking .av-tassel{animation-duration:1.1s}
        @keyframes avSwing{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(8deg)}}
        @keyframes avNote{0%{opacity:0;transform:translate(6px,4px) scale(.5)}40%{opacity:1}100%{opacity:0;transform:translate(-5px,-7px) scale(1.2)}}
        .av-note-1{animation:avNote 1.3s ease-out infinite}
        .av-note-2{animation:avNote 1.3s .45s ease-out infinite}
        .av-note-3{animation:avNote 1.3s .9s ease-out infinite}
      `}</style>
      <defs>
        <linearGradient id="avBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#3730A3" />
        </linearGradient>
        <linearGradient id="avCap" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b3663" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
        <linearGradient id="avGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      {/* Fondo */}
      <circle cx="32" cy="32" r="31" fill="url(#avBg)" />
      <circle cx="32" cy="32" r="31" fill="none" stroke="rgba(252,211,77,0.55)" strokeWidth="1.6" />
      {/* Toga con cuello dorado */}
      <path d="M13 58 Q17 42 32 42 Q47 42 51 58 Z" fill="#1e1b4b" />
      <path d="M27 43 L32 51 L37 43 L32 41.5 Z" fill="#FCD34D" />
      <g className="av-head">
        {/* Orejas y cabeza */}
        <circle cx="19.5" cy="30" r="2.6" fill="#F8C9A0" />
        <circle cx="44.5" cy="30" r="2.6" fill="#F8C9A0" />
        <circle cx="32" cy="30" r="13" fill="#F8C9A0" />
        {/* Mejillas */}
        <circle cx="24.5" cy="33.5" r="2.6" fill="#F59E9E" opacity="0.5" />
        <circle cx="39.5" cy="33.5" r="2.6" fill="#F59E9E" opacity="0.5" />
        {/* Ojos (parpadean) */}
        <g className="av-eyes">
          <circle cx="26.5" cy="29" r="2.2" fill="#1e1b4b" />
          <circle cx="37.5" cy="29" r="2.2" fill="#1e1b4b" />
          <circle cx="27.2" cy="28.3" r="0.7" fill="white" />
          <circle cx="38.2" cy="28.3" r="0.7" fill="white" />
        </g>
        {/* Cejas */}
        <path d="M23.5 25 Q26.5 23.2 29 25" stroke="#7c4a21" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <path d="M35 25 Q37.5 23.2 40.5 25" stroke="#7c4a21" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        {/* Boca: se mueve al ritmo del habla, sonríe en reposo */}
        {hablando ? (
          <ellipse className="av-mouth-talk" cx="32" cy="37" rx="3.4" ry="2.6" fill="#7c2d12" />
        ) : (
          <path d="M28.5 36.5 Q32 39.6 35.5 36.5" stroke="#7c2d12" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        )}
        {/* Birrete */}
        <path d="M32 10 L52 19 L32 28 L12 19 Z" fill="url(#avCap)" />
        <path d="M32 10 L52 19 L32 22.5 L12 19 Z" fill="rgba(255,255,255,0.13)" />
        <path d="M24 21.5 L24 26.5 Q32 30.5 40 26.5 L40 21.5" fill="#1e1b4b" />
        <circle cx="32" cy="19" r="1.8" fill="url(#avGold)" />
        {/* Borla (se balancea) */}
        <g className="av-tassel">
          <path d="M32 19 Q44 21 46 30" stroke="url(#avGold)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <circle cx="46" cy="31" r="1.9" fill="url(#avGold)" />
          <path d="M44.6 32.2 L44 37 M46 32.8 L46 38 M47.4 32.2 L48 37" stroke="url(#avGold)" strokeWidth="1.3" strokeLinecap="round" />
        </g>
      </g>
      {/* Notas de voz cuando habla */}
      {hablando && (
        <g className="av-notes" fill="#FCD34D">
          <circle cx="9" cy="22" r="1.6" className="av-note-1" />
          <circle cx="7" cy="30" r="1.3" className="av-note-2" />
          <circle cx="10" cy="38" r="1.1" className="av-note-3" />
        </g>
      )}
    </svg>
  );
}

// ─── Botón flotante de voz ───────────────────────────────────────────────────
function GradMascot({ hablando }: { hablando: boolean }) {
  return (
    <div style={{ width: 64, height: 64 }}>
      <style>{`
        @keyframes voicePulse{0%,100%{box-shadow:0 0 0 0 rgba(79,70,229,0.5)}70%{box-shadow:0 0 0 14px rgba(79,70,229,0)}}
        @keyframes voiceIdle{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
        .vbtn{width:64px;height:64px;border-radius:50%;border:none;cursor:pointer;padding:0;overflow:hidden;display:flex;align-items:center;justify-content:center;transition:transform .15s;-webkit-tap-highlight-color:transparent}
        .vbtn.talking{animation:voicePulse 1s ease-out infinite}
        .vbtn.idle{animation:voiceIdle 2.5s ease-in-out infinite}
      `}</style>
      <div
        className={`vbtn ${hablando ? "talking" : "idle"}`}
        style={{ boxShadow: "0 6px 20px rgba(79,70,229,0.40)" }}
      >
        <GradAvatar size={64} hablando={hablando} />
      </div>
    </div>
  );
}

// ─── TTS — Lee la invitación en voz alta (con sincronización palabra a palabra) ─
function useTTS() {
  const [hablando, setHablando] = useState(false);
  const [listo, setListo] = useState(false);
  // Texto que se está leyendo + índice del carácter actual (para karaoke)
  const [textoActual, setTextoActual] = useState("");
  const [charIdx, setCharIdx] = useState(0);
  const fallbackTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const boundaryFired = useRef(false);

  function limpiarFallback() {
    if (fallbackTimer.current) { clearInterval(fallbackTimer.current); fallbackTimer.current = null; }
  }

  // Elegir la voz en español más natural disponible (neural/online > Google > local)
  function mejorVozEs(): SpeechSynthesisVoice | null {
    const voces = window.speechSynthesis.getVoices().filter(v => v.lang?.toLowerCase().startsWith("es"));
    if (!voces.length) return null;
    const score = (v: SpeechSynthesisVoice) => {
      const n = v.name.toLowerCase();
      let p = 0;
      if (n.includes("natural")) p += 6;      // Microsoft Edge voces neurales
      if (n.includes("neural")) p += 6;
      if (n.includes("online")) p += 3;
      if (n.includes("google")) p += 4;       // Chrome: "Google español"
      if (n.includes("premium") || n.includes("enhanced") || n.includes("mejorada")) p += 3;
      if (n.includes("paulina") || n.includes("mónica") || n.includes("monica") || n.includes("sabina") || n.includes("helena") || n.includes("dalia")) p += 2;
      if (v.lang.toLowerCase() === "es-es" || v.lang.toLowerCase() === "es-us" || v.lang.toLowerCase() === "es-mx") p += 1;
      if (!v.localService) p += 2;            // voces en la nube suenan mejor
      return p;
    };
    return voces.sort((a, b) => score(b) - score(a))[0];
  }

  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sesionRef = useRef(0); // invalida callbacks de lecturas viejas/canceladas

  function limpiarTimers() {
    limpiarFallback();
    if (watchdog.current) { clearTimeout(watchdog.current); watchdog.current = null; }
  }

  function leer(texto: string, onFin?: () => void) {
    if (typeof window === "undefined" || !window.speechSynthesis) { onFin?.(); return; }
    const ss = window.speechSynthesis;
    const sesion = ++sesionRef.current;
    try { ss.cancel(); } catch {}
    limpiarTimers();
    // Bajar música mientras habla
    const audio = globalAudioRef.current;
    if (audio) audio.volume = 0.12;

    // Estado OPTIMISTA: el avatar habla desde ya.
    // iOS Safari muchas veces NO dispara onstart, y sin esto la boca/burbuja no aparecían.
    setHablando(true);
    setTextoActual(texto);
    setCharIdx(0);
    boundaryFired.current = false;

    // Karaoke por tiempo (iOS no dispara onboundary): estimación continua
    const rate = 0.88;
    const charsPorSeg = 13.5 * rate;
    const t0 = Date.now();
    fallbackTimer.current = setInterval(() => {
      if (sesion !== sesionRef.current) return;
      if (boundaryFired.current) return; // los eventos reales toman el control
      setCharIdx(Math.min(texto.length, Math.floor(((Date.now() - t0) / 1000) * charsPorSeg)));
    }, 200);

    const fin = () => {
      if (sesion !== sesionRef.current) return;
      sesionRef.current++;
      limpiarTimers();
      setHablando(false);
      setTextoActual("");
      setCharIdx(0);
      if (audio) audio.volume = 1;
      onFin?.();
    };

    // Leer por FRASES: evita que Android/Chrome corte textos largos
    // y permite reanudar la cola de forma confiable en iOS.
    const chunks = (texto.match(/[^.!?…]+[.!?…]*\s*/g) ?? [texto]).filter(c => c.trim().length > 0);
    let idx = 0;
    let offset = 0;
    const hablarSiguiente = () => {
      if (sesion !== sesionRef.current) return;
      if (idx >= chunks.length) { fin(); return; }
      const parte = chunks[idx];
      const chunkOffset = texto.indexOf(parte, offset) >= 0 ? texto.indexOf(parte, offset) : offset;
      const u = new SpeechSynthesisUtterance(parte);
      u.lang = "es-ES";
      u.rate = rate;
      u.pitch = 1.05;
      u.volume = 1;
      const voz = mejorVozEs();
      if (voz) { u.voice = voz; u.lang = voz.lang; }
      u.onboundary = (e: SpeechSynthesisEvent) => {
        if (sesion !== sesionRef.current) return;
        if (typeof e.charIndex === "number") {
          boundaryFired.current = true;
          setCharIdx(chunkOffset + e.charIndex);
        }
      };
      const siguiente = () => {
        if (sesion !== sesionRef.current) return;
        idx++;
        offset = chunkOffset + parte.length;
        if (boundaryFired.current) setCharIdx(offset);
        hablarSiguiente();
      };
      u.onend = siguiente;
      u.onerror = (ev: SpeechSynthesisErrorEvent) => {
        // "canceled"/"interrupted" llegan al cortar nosotros — los ignora la guardia de sesión
        if (ev.error === "canceled" || ev.error === "interrupted") return;
        siguiente(); // otros errores: saltar a la frase siguiente
      };
      try {
        ss.speak(u);
        ss.resume(); // iOS a veces arranca la cola en pausa
      } catch { siguiente(); }
    };

    // Arrancar SIN esperar indefinidamente las voces:
    // en iOS getVoices() llega vacío y onvoiceschanged puede no dispararse jamás.
    let arrancado = false;
    const arrancar = () => {
      if (arrancado || sesion !== sesionRef.current) return;
      arrancado = true;
      hablarSiguiente();
    };
    if (ss.getVoices().length) {
      arrancar();
    } else {
      ss.onvoiceschanged = arrancar;
      setTimeout(arrancar, 300); // iOS: hablar igual con la voz por defecto
    }

    // Watchdog: si el motor de voz muere en silencio, liberar el avatar y seguir el flujo
    const durMax = (texto.length / charsPorSeg) * 1000 + 8000;
    watchdog.current = setTimeout(fin, durMax);
    setListo(true);
  }

  function detener() {
    sesionRef.current++; // invalida cualquier lectura en curso
    try { window.speechSynthesis?.cancel(); } catch {}
    setHablando(false);
    setTextoActual("");
    setCharIdx(0);
    limpiarTimers();
    const audio = globalAudioRef.current;
    if (audio) audio.volume = 1;
  }

  return { hablando, listo, leer, detener, textoActual, charIdx };
}

// ─── Desbloqueo de TTS en iOS: debe llamarse DENTRO de un gesto del usuario ────
// iPhone bloquea speechSynthesis si la primera locución no nace de un toque.
// Hablar una locución muda dentro del gesto "abre la puerta" para las siguientes.
function desbloquearTTS() {
  try {
    const ss = window.speechSynthesis;
    if (!ss) return;
    ss.cancel();
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    u.rate = 2;
    ss.speak(u);
    ss.resume();
  } catch { /* opcional */ }
}

// ─── MusicPlayer con autoplay ─────────────────────────────────────────────────
function MusicPlayer({ url, nombre }: { url: string; nombre?: string | null }) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    // Usar el audio oculto que ya fue desbloqueado en el gesto del welcome
    const a = globalAudioRef.current ??
      (document.getElementById("inv-audio-hidden") as HTMLAudioElement | null);
    if (!a) return;
    globalAudioRef.current = a;

    // Sincronizar estado visual con el estado real del audio
    const syncState = () => setPlaying(!a.paused);
    a.addEventListener("play", syncState);
    a.addEventListener("pause", syncState);
    syncState();

    // Si el audio no está reproduciendo todavía, intentar arrancar
    if (a.paused) {
      a.muted = false;
      a.play().then(() => setPlaying(true)).catch(() => {
        // Fallback: esperar próximo gesto
        const onInteract = () => {
          a.muted = false;
          a.play().then(() => setPlaying(true)).catch(() => {});
        };
        document.addEventListener("click", onInteract, { once: true });
        document.addEventListener("touchstart", onInteract, { once: true });
      });
    }

    return () => {
      a.removeEventListener("play", syncState);
      a.removeEventListener("pause", syncState);
    };
  }, [url]);

  function toggle() {
    const a = globalAudioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play().then(() => setPlaying(true)).catch(() => {});
    }
  }

  return (
    <div className="music-player" onClick={toggle}>
      {/* El <audio> real está renderizado como elemento oculto en el root */}
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
      {/* Solo botón — fotos ocultas por defecto */}
      <div>
        <button
          className="btn-ver-fotos"
          onClick={() => {
            setIndice(0);
            setModalOpen(true);
          }}
        >
          <IcoImages />
          {lugar ? `Ver fotos de ${lugar}` : `Ver fotos del lugar`}
          {validas.length > 1 && ` (${validas.length})`}
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
              {/\.(mp4|mov|webm|avi|mkv)/i.test(validas[indice]) ? (
                <video
                  src={validas[indice]}
                  className="lightbox-video"
                  controls
                  autoPlay
                  playsInline
                  controlsList="nodownload"
                />
              ) : (
                <img
                  src={validas[indice]}
                  alt={`Foto ${indice + 1}`}
                  className="lightbox-img"
                />
              )}
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
  onMostrarDeseo,
}: {
  invitadoId: string;
  eventoId: string;
  token?: string;
  onMostrarDeseo?: () => void;
}) {
  const [fotos, setFotos] = useState<string[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [cargado, setCargado] = useState(false);
  const [verFotos, setVerFotos] = useState(false);
  const [promptDeseo, setPromptDeseo] = useState<"primera" | "maxima" | null>(null);
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
    const nuevas: string[] = [];
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
          nuevas.push(url);
        }
      }
    }
    setSubiendo(false);
    if (fileRef.current) fileRef.current.value = "";
    if (nuevas.length > 0) {
      const prevCount = fotos.length;
      const newCount = prevCount + nuevas.length;
      setFotos(prev => [...prev, ...nuevas]);
      // Mostrar prompt solo después de la 1ª foto o al alcanzar el máximo
      if (newCount >= MAX) setPromptDeseo("maxima");
      else if (prevCount === 0 && newCount >= 1) setPromptDeseo("primera");
    }
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
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); setVerFotos(!verFotos); }}
            onKeyDown={(e) => e.key==="Enter" && setVerFotos(!verFotos)}
            style={{ background: "none", padding: "4px 6px", cursor: "pointer", color: "var(--ink3)", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", userSelect:"none" }}
          >
            {verFotos ? "Ocultar" : `Ver (${fotos.length})`}
          </div>
        )}
        {!lleno && (
          <svg style={{ flexShrink: 0 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        )}
      </button>

      {/* Grid de miniaturas */}
      {verFotos && fotos.length > 0 && (
        <div className="fotos-inv-grid" style={{ marginTop: 10 }}>
          {fotos.map((src, i) => (
            <div key={i} className="fotos-inv-thumb">
              <img src={src} alt={`Foto ${i + 1}`} />
            </div>
          ))}
        </div>
      )}

      {/* Prompt contextual: publicar deseo después de foto 1 o foto 5 */}
      {promptDeseo && (
        <div style={{ marginTop: 12, background: "linear-gradient(135deg,#EEF2FF,#E0E7FF)", border: "1.5px solid rgba(79,70,229,0.20)", borderRadius: 16, padding: "18px 16px", animation: "fadeUp 0.3s ease" }}>
          <div style={{ fontSize: 22, textAlign: "center", marginBottom: 8 }}>
            {promptDeseo === "maxima" ? "🎉" : "📸"}
          </div>
          <p style={{ fontSize: 13, color: "#3730A3", fontWeight: 600, textAlign: "center", marginBottom: 4 }}>
            {promptDeseo === "maxima"
              ? "¡Llegaste al máximo de fotos!"
              : "¡Primera foto subida!"}
          </p>
          <p style={{ fontSize: 12, color: "#6366F1", textAlign: "center", marginBottom: 14, lineHeight: 1.5 }}>
            {promptDeseo === "maxima"
              ? "¿Querés dejar tu deseo para los anfitriones antes de ir al muro?"
              : "¿Es tu única foto? Podés publicar tu deseo ahora o subir más fotos primero."}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { setPromptDeseo(null); if (onMostrarDeseo) onMostrarDeseo(); }}
              style={{ flex: 1, background: "linear-gradient(135deg,#3730A3,#4F46E5)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 8px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(79,70,229,0.28)" }}
            >
              💌 Publicar deseo
            </button>
            <button
              onClick={() => setPromptDeseo(null)}
              style={{ flex: 1, background: "white", color: "#6366F1", border: "1.5px solid rgba(99,102,241,0.30)", borderRadius: 12, padding: "12px 8px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              {promptDeseo === "maxima" ? "Ir al muro" : "Subir más fotos"}
            </button>
          </div>
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
  const esGradTipo = evento.tipo === "graduacion";
  // Foto del graduado (solo graduación): cargarla antes de dibujar
  let fotoGrad: HTMLImageElement | null = null;
  if (esGradTipo && evento.imagen_url) {
    fotoGrad = await new Promise<HTMLImageElement | null>((res) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      const to = setTimeout(() => res(null), 6000);
      img.onload = () => { clearTimeout(to); res(img); };
      img.onerror = () => { clearTimeout(to); res(null); };
      img.src = evento.imagen_url as string;
    });
  }
  return new Promise((resolve) => {
    const W = 800,
      H = esGradTipo ? (fotoGrad ? 1460 : 1320) : 1050;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve(null);
      return;
    }
    const esGrad = evento.tipo === "graduacion";
    // Helper: estrella dorada
    const drawStar = (x: number, y: number, rad: number, color: string, alpha = 1) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const rr = i % 2 === 0 ? rad : rad * 0.45;
        if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    };
    // Fondo exterior
    if (esGrad) {
      // Graduación: noche estrellada azul profundo con marco dorado
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, "#0f172a");
      bgGrad.addColorStop(0.5, "#1e1b4b");
      bgGrad.addColorStop(1, "#0f172a");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);
      // Estrellas dispersas en el marco
      const estrellas = [
        [24, 40, 5], [W - 28, 60, 4], [30, H / 2, 4], [W - 24, H / 2 + 40, 5],
        [26, H - 60, 4], [W - 30, H - 44, 5], [W / 2 - 300, 30, 3], [W / 2 + 310, H - 26, 3],
        [W / 2, 24, 4], [W / 2 - 100, H - 22, 3], [W / 2 + 140, 26, 3],
      ] as const;
      estrellas.forEach(([x, y, s], i) => drawStar(x, y, s, "#FCD34D", 0.55 + (i % 3) * 0.15));
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, "#F8FAFC");
      bgGrad.addColorStop(0.5, "#EEF2FF");
      bgGrad.addColorStop(1, "#F8FAFC");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);
    }
    const cX = 50,
      cY = 80,
      cW = W - 100,
      cH = H - 160,
      r = 36;
    // Sombra suave de la tarjeta
    ctx.save();
    ctx.shadowColor = esGrad ? "rgba(252,211,77,0.30)" : "rgba(15,23,42,0.18)";
    ctx.shadowBlur = esGrad ? 50 : 40;
    ctx.shadowOffsetY = 14;
    rrFill(ctx, cX, cY, cW, cH, r, "#FFFFFF");
    ctx.restore();
    rrFill(ctx, cX, cY, cW, cH, r, "#FFFFFF");
    if (esGrad) {
      // Doble borde dorado alrededor de la tarjeta
      ctx.strokeStyle = "#D97706";
      ctx.lineWidth = 3;
      rrStroke(ctx, cX - 6, cY - 6, cW + 12, cH + 12, r + 6);
      ctx.strokeStyle = "rgba(252,211,77,0.85)";
      ctx.lineWidth = 1.5;
      rrStroke(ctx, cX - 12, cY - 12, cW + 24, cH + 24, r + 10);
    }
    // Header
    const hH = esGrad ? (fotoGrad ? 400 : 260) : 260;
    ctx.save();
    ctx.beginPath();
    rrPath(ctx, cX, cY, cW, hH, { tl: r, tr: r, bl: 0, br: 0 });
    ctx.clip();
    if (esGrad) {
      // Graduación: azul noche → índigo con destellos dorados
      const hGrad = ctx.createLinearGradient(cX, cY, cX + cW, cY + hH);
      hGrad.addColorStop(0, "#1e1b4b");
      hGrad.addColorStop(0.55, "#312e81");
      hGrad.addColorStop(1, "#4338ca");
      ctx.fillStyle = hGrad;
      ctx.fillRect(cX, cY, cW, hH);
      // Resplandor dorado superior
      const glow = ctx.createRadialGradient(cX + cW / 2, cY, 10, cX + cW / 2, cY, 240);
      glow.addColorStop(0, "rgba(252,211,77,0.22)");
      glow.addColorStop(1, "rgba(252,211,77,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(cX, cY, cW, hH);
      // Estrellas dentro del header
      drawStar(cX + 60, cY + 46, 6, "#FCD34D", 0.9);
      drawStar(cX + cW - 60, cY + 46, 6, "#FCD34D", 0.9);
      drawStar(cX + 110, cY + 120, 4, "#FCD34D", 0.6);
      drawStar(cX + cW - 110, cY + 120, 4, "#FCD34D", 0.6);
      drawStar(cX + 42, cY + hH - 60, 4, "#FCD34D", 0.5);
      drawStar(cX + cW - 42, cY + hH - 60, 4, "#FCD34D", 0.5);
      if (fotoGrad) {
        // Foto del graduado en círculo con doble anillo dorado
        const pX = cX + cW / 2, pY = cY + 138, pR = 66;
        const ring = ctx.createLinearGradient(pX - pR, pY - pR, pX + pR, pY + pR);
        ring.addColorStop(0, "#FDE68A");
        ring.addColorStop(0.5, "#F59E0B");
        ring.addColorStop(1, "#B45309");
        ctx.beginPath(); ctx.arc(pX, pY, pR + 9, 0, Math.PI * 2);
        ctx.fillStyle = ring; ctx.fill();
        ctx.beginPath(); ctx.arc(pX, pY, pR + 3, 0, Math.PI * 2);
        ctx.fillStyle = "#1e1b4b"; ctx.fill();
        ctx.save();
        ctx.beginPath(); ctx.arc(pX, pY, pR, 0, Math.PI * 2); ctx.clip();
        const s = Math.max((pR * 2) / fotoGrad.width, (pR * 2) / fotoGrad.height);
        const dw = fotoGrad.width * s, dh = fotoGrad.height * s;
        ctx.drawImage(fotoGrad, pX - dw / 2, pY - dh / 2, dw, dh);
        ctx.restore();
        // Birrete coronando la foto
        ctx.font = "36px serif";
        ctx.textAlign = "center";
        ctx.fillText("🎓", pX + pR - 8, pY - pR + 14);
        // Birretes a los lados
        ctx.font = "34px serif";
        ctx.fillText("🎓", cX + 74, cY + 160);
        ctx.fillText("🎓", cX + cW - 74, cY + 160);
      } else {
        // Birretes flanqueando el nombre
        ctx.font = "42px serif";
        ctx.textAlign = "center";
        ctx.fillText("🎓", cX + 90, cY + 190);
        ctx.fillText("🎓", cX + cW - 90, cY + 190);
      }
      // Línea dorada al pie del header
      const goldLine = ctx.createLinearGradient(cX, 0, cX + cW, 0);
      goldLine.addColorStop(0, "rgba(252,211,77,0)");
      goldLine.addColorStop(0.5, "#FCD34D");
      goldLine.addColorStop(1, "rgba(252,211,77,0)");
      ctx.fillStyle = goldLine;
      ctx.fillRect(cX, cY + hH - 5, cW, 5);
    } else {
      const hGrad = ctx.createLinearGradient(cX, cY, cX + cW, cY + hH);
      hGrad.addColorStop(0, "#3730A3");
      hGrad.addColorStop(1, "#4F46E5");
      ctx.fillStyle = hGrad;
      ctx.fillRect(cX, cY, cW, hH);
    }
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
    // Textos del header
    if (esGrad) {
      // Con foto, los textos bajan para dejar espacio al retrato
      const tOff = fotoGrad ? 172 : 0;
      ctx.font = "700 17px 'Arial'";
      ctx.fillStyle = "#FCD34D";
      ctx.textAlign = "center";
      ctx.fillText("G R A D U A C I Ó N", cX + cW / 2, cY + (fotoGrad ? 40 : 52));
      ctx.font = "bold 54px 'Georgia',serif";
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "rgba(252,211,77,0.45)";
      ctx.shadowBlur = 18;
      ctx.fillText(saludo, cX + cW / 2, cY + 120 + tOff, cW - 80);
      ctx.shadowBlur = 0;
      ctx.font = "300 22px 'Arial'";
      ctx.fillStyle = "rgba(255,255,255,0.78)";
      ctx.fillText(`Invitación de ${evento.anfitriones}`, cX + cW / 2, cY + 160 + tOff);
      ctx.font = "italic bold 28px 'Georgia',serif";
      ctx.fillStyle = "#FDE68A";
      ctx.fillText(evento.nombre, cX + cW / 2, cY + 207 + tOff, cW - 200);
    } else {
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
    }
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
      ctx.fillStyle = esGrad ? "#B45309" : "#4F46E5";
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
    ctx.strokeStyle = esGrad ? "rgba(217,119,6,0.40)" : "rgba(79,70,229,0.22)";
    ctx.lineWidth = 1;
    ctx.stroke();
    if (esGrad) drawStar(cX + cW / 2, dY, 6, "#D97706", 0.9);
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
    if (esGrad) {
      gBtn.addColorStop(0, "#B45309");
      gBtn.addColorStop(0.5, "#F59E0B");
      gBtn.addColorStop(1, "#B45309");
    } else {
      gBtn.addColorStop(0, "#3730A3");
      gBtn.addColorStop(1, "#4F46E5");
    }
    rrFill(ctx, dX, dY, bW, bH, bR, gBtn);
    ctx.font = "bold 24px 'Arial'";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText(esGrad ? "🎓  Confirmar asistencia" : "✅  Confirmar asistencia", dX + bW / 2, dY + 38);
    dY += bH + bGap;
    // CTA secundarios (outline sobre fondo pálido)
    const secBg = esGrad ? "#FFFBEB" : "#EEF2FF";
    const secBorder = esGrad ? "rgba(217,119,6,0.45)" : "rgba(79,70,229,0.45)";
    const secTxt = esGrad ? "#92400E" : "#3730A3";
    rrFill(ctx, dX, dY, bW, bH, bR, secBg);
    ctx.strokeStyle = secBorder;
    ctx.lineWidth = 1.5;
    rrStroke(ctx, dX, dY, bW, bH, bR);
    ctx.font = "bold 22px 'Arial'";
    ctx.fillStyle = secTxt;
    ctx.textAlign = "center";
    ctx.fillText("📸  Subir foto al muro", dX + bW / 2, dY + 38);
    dY += bH + bGap;
    rrFill(ctx, dX, dY, bW, bH, bR, secBg);
    ctx.strokeStyle = secBorder;
    ctx.lineWidth = 1.5;
    rrStroke(ctx, dX, dY, bW, bH, bR);
    ctx.font = "bold 22px 'Arial'";
    ctx.fillStyle = secTxt;
    ctx.textAlign = "center";
    ctx.fillText(esGrad ? "💌  Dejar un deseo al graduado" : "💌  Dejar mi deseo", dX + bW / 2, dY + 38);
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
    // ── Graduación: QR al muro + sello "Promoción" ──
    if (esGrad) {
      dY += 22;
      try {
        const qr = qrcode(0, "M");
        qr.addData(`${origin}/muro/${evento.id}`);
        qr.make();
        const n = qr.getModuleCount();
        const qSize = 128, cell = qSize / n;
        const qX = cX + cW / 2 - qSize - 55, qY = dY + 6;
        // Marco blanco con borde dorado
        rrFill(ctx, qX - 12, qY - 12, qSize + 24, qSize + 24, 14, "#FFFFFF");
        ctx.strokeStyle = "#D97706";
        ctx.lineWidth = 2.5;
        rrStroke(ctx, qX - 12, qY - 12, qSize + 24, qSize + 24, 14);
        ctx.fillStyle = "#1e1b4b";
        for (let rw = 0; rw < n; rw++)
          for (let cl = 0; cl < n; cl++)
            if (qr.isDark(rw, cl))
              ctx.fillRect(qX + cl * cell, qY + rw * cell, Math.ceil(cell), Math.ceil(cell));
        ctx.font = "600 14px 'Arial'";
        ctx.fillStyle = "#92400E";
        ctx.textAlign = "center";
        ctx.fillText("Escaneá y mirá el muro", qX + qSize / 2, qY + qSize + 32);
        ctx.fillText("de fotos del evento", qX + qSize / 2, qY + qSize + 50);
      } catch { /* QR opcional */ }
      // Sello medalla "Promoción YYYY"
      const anio = evento.fecha
        ? new Date(evento.fecha + "T12:00:00").getFullYear()
        : new Date().getFullYear();
      const sX = cX + cW / 2 + 130, sY = dY + 76;
      // Cintas rojas
      ctx.save();
      ctx.fillStyle = "#DC2626";
      ctx.beginPath();
      ctx.moveTo(sX - 26, sY + 30); ctx.lineTo(sX - 40, sY + 88); ctx.lineTo(sX - 22, sY + 78); ctx.lineTo(sX - 10, sY + 92); ctx.lineTo(sX - 4, sY + 40);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sX + 26, sY + 30); ctx.lineTo(sX + 40, sY + 88); ctx.lineTo(sX + 22, sY + 78); ctx.lineTo(sX + 10, sY + 92); ctx.lineTo(sX + 4, sY + 40);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      // Borde dentado dorado
      ctx.save();
      ctx.translate(sX, sY);
      ctx.fillStyle = "#B45309";
      for (let i = 0; i < 24; i++) {
        const a = (Math.PI * 2 * i) / 24;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 54, Math.sin(a) * 54, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      // Medalla con gradiente dorado
      const sg = ctx.createRadialGradient(sX - 14, sY - 14, 6, sX, sY, 58);
      sg.addColorStop(0, "#FDE68A");
      sg.addColorStop(0.55, "#F59E0B");
      sg.addColorStop(1, "#B45309");
      ctx.beginPath(); ctx.arc(sX, sY, 54, 0, Math.PI * 2);
      ctx.fillStyle = sg; ctx.fill();
      ctx.strokeStyle = "#92400E"; ctx.lineWidth = 2; ctx.stroke();
      // Disco interior
      ctx.beginPath(); ctx.arc(sX, sY, 42, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFBEB"; ctx.fill();
      ctx.strokeStyle = "rgba(146,64,14,0.5)"; ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
      // Contenido del sello
      ctx.font = "22px serif";
      ctx.textAlign = "center";
      ctx.fillText("🎓", sX, sY - 12);
      ctx.font = "700 11px 'Arial'";
      ctx.fillStyle = "#92400E";
      ctx.fillText("PROMOCIÓN", sX, sY + 8);
      ctx.font = "bold 24px 'Georgia',serif";
      ctx.fillStyle = "#B45309";
      ctx.fillText(String(anio), sX, sY + 32);
    }
    ctx.font = "bold 17px 'Arial'";
    ctx.fillStyle = esGrad ? "#B45309" : "#4F46E5";
    ctx.textAlign = "center";
    ctx.fillText("Evorix · Invitaciones digitales", cX + cW / 2, cY + cH - 28);
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.95);
  });
}

// ─── Tarjeta formato Instagram Stories 9:16 (graduación) ─────────────────────
async function generarStoryCanvas(
  invitado: Invitado,
  evento: Evento,
  origin: string,
): Promise<Blob | null> {
  // Foto del graduado (opcional)
  let foto: HTMLImageElement | null = null;
  if (evento.imagen_url) {
    foto = await new Promise<HTMLImageElement | null>((res) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      const to = setTimeout(() => res(null), 6000);
      img.onload = () => { clearTimeout(to); res(img); };
      img.onerror = () => { clearTimeout(to); res(null); };
      img.src = evento.imagen_url as string;
    });
  }
  return new Promise((resolve) => {
    const W = 1080, H = 1920;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) { resolve(null); return; }
    const star = (x: number, y: number, rad: number, alpha = 1) => {
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const rr = i % 2 === 0 ? rad : rad * 0.45;
        if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath(); ctx.fillStyle = "#FCD34D"; ctx.fill(); ctx.restore();
    };
    // Fondo noche estrellada
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#312e81");
    bg.addColorStop(0.45, "#1e1b4b");
    bg.addColorStop(1, "#0f172a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    // Resplandor central
    const glow = ctx.createRadialGradient(W / 2, 520, 40, W / 2, 520, 560);
    glow.addColorStop(0, "rgba(252,211,77,0.20)");
    glow.addColorStop(1, "rgba(252,211,77,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    // Estrellas dispersas
    ([[90,140,7],[980,190,6],[140,420,5],[950,480,7],[80,860,6],[1000,900,5],
      [120,1300,6],[970,1350,7],[200,1650,5],[880,1700,6],[540,110,5],[420,1800,4]] as const)
      .forEach(([x, y, s], i) => star(x, y, s, 0.5 + (i % 3) * 0.18));
    // Doble marco dorado
    ctx.strokeStyle = "#D97706"; ctx.lineWidth = 6;
    rrStroke(ctx, 42, 42, W - 84, H - 84, 44);
    ctx.strokeStyle = "rgba(252,211,77,0.8)"; ctx.lineWidth = 2.5;
    rrStroke(ctx, 60, 60, W - 120, H - 120, 34);
    ctx.textAlign = "center";
    // Encabezado
    ctx.font = "110px serif";
    ctx.fillText("🎓", W / 2, 240);
    ctx.font = "700 34px 'Arial'";
    ctx.fillStyle = "#FCD34D";
    ctx.fillText("G R A D U A C I Ó N", W / 2, 320);
    star(W / 2 - 230, 308, 9); star(W / 2 + 230, 308, 9);
    // Foto circular
    let yCursor = 400;
    if (foto) {
      const pX = W / 2, pY = 580, pR = 170;
      const ring = ctx.createLinearGradient(pX - pR, pY - pR, pX + pR, pY + pR);
      ring.addColorStop(0, "#FDE68A"); ring.addColorStop(0.5, "#F59E0B"); ring.addColorStop(1, "#B45309");
      ctx.beginPath(); ctx.arc(pX, pY, pR + 16, 0, Math.PI * 2); ctx.fillStyle = ring; ctx.fill();
      ctx.beginPath(); ctx.arc(pX, pY, pR + 6, 0, Math.PI * 2); ctx.fillStyle = "#1e1b4b"; ctx.fill();
      ctx.save();
      ctx.beginPath(); ctx.arc(pX, pY, pR, 0, Math.PI * 2); ctx.clip();
      const s = Math.max((pR * 2) / foto.width, (pR * 2) / foto.height);
      ctx.drawImage(foto, pX - (foto.width * s) / 2, pY - (foto.height * s) / 2, foto.width * s, foto.height * s);
      ctx.restore();
      yCursor = 850;
    }
    // Nombre del evento
    ctx.font = "italic bold 64px 'Georgia',serif";
    ctx.fillStyle = "#FDE68A";
    ctx.shadowColor = "rgba(252,211,77,0.4)"; ctx.shadowBlur = 24;
    ctx.fillText(evento.nombre, W / 2, yCursor + 60, W - 220);
    ctx.shadowBlur = 0;
    // Anfitriones
    ctx.font = "300 34px 'Arial'";
    ctx.fillStyle = "rgba(255,255,255,0.80)";
    ctx.fillText(`de ${evento.anfitriones}`, W / 2, yCursor + 130, W - 240);
    // Línea dorada
    const gl = ctx.createLinearGradient(W / 2 - 260, 0, W / 2 + 260, 0);
    gl.addColorStop(0, "rgba(252,211,77,0)"); gl.addColorStop(0.5, "#FCD34D"); gl.addColorStop(1, "rgba(252,211,77,0)");
    ctx.fillStyle = gl;
    ctx.fillRect(W / 2 - 260, yCursor + 170, 520, 4);
    // Detalles
    let dy = yCursor + 250;
    const fila = (emoji: string, txt: string) => {
      ctx.font = "36px serif";
      ctx.fillText(emoji, W / 2, dy - 44);
      ctx.font = "600 38px 'Arial'";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(txt, W / 2, dy, W - 220);
      dy += 116;
    };
    if (evento.fecha) fila("📅", formatFechaCorta(evento.fecha));
    if (evento.hora) fila("🕐", formatHora(evento.hora));
    if (evento.lugar) fila("📍", evento.lugar);
    // QR de confirmación
    try {
      const qr = qrcode(0, "M");
      qr.addData(`${origin}/confirmar/${invitado.token}`);
      qr.make();
      const n = qr.getModuleCount();
      const qSize = 300, cell = qSize / n;
      const qX = W / 2 - qSize / 2, qY = H - 560;
      rrFill(ctx, qX - 26, qY - 26, qSize + 52, qSize + 52, 30, "#FFFFFF");
      ctx.strokeStyle = "#D97706"; ctx.lineWidth = 5;
      rrStroke(ctx, qX - 26, qY - 26, qSize + 52, qSize + 52, 30);
      ctx.fillStyle = "#1e1b4b";
      for (let rw = 0; rw < n; rw++)
        for (let cl = 0; cl < n; cl++)
          if (qr.isDark(rw, cl)) ctx.fillRect(qX + cl * cell, qY + rw * cell, Math.ceil(cell), Math.ceil(cell));
      ctx.font = "700 34px 'Arial'";
      ctx.fillStyle = "#FCD34D";
      ctx.fillText("Escaneá y confirmá tu asistencia", W / 2, qY + qSize + 90);
    } catch { /* QR opcional */ }
    // Footer
    ctx.font = "bold 28px 'Arial'";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText("Evorix · Invitaciones digitales", W / 2, H - 96);
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

// ─── Botón ver plano de mesas ─────────────────────────────────────────────────
function PlanoMesasBtn({ url }: { url: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ background: "var(--gold-pale)", border: "1px solid var(--border-mid)", borderRadius: 8, padding: "5px 10px", fontSize: 10, fontWeight: 700, color: "var(--gold-dark)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", flexShrink: 0 }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
        Ver plano
      </button>
      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9800, background: "rgba(15,23,42,0.88)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setOpen(false)}>
          <div style={{ position: "relative", maxWidth: 480, width: "100%" }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} style={{ position: "absolute", top: -14, right: -14, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, fontSize: 18 }}>×</button>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "1px", textAlign: "center", marginBottom: 12 }}>Distribución de mesas</div>
            <img src={url} alt="Plano de mesas" style={{ width: "100%", borderRadius: 16, display: "block", maxHeight: "70vh", objectFit: "contain", background: "#000" }} />
          </div>
        </div>
      )}
    </>
  );
}

// ─── Modal "¿Querés dejar tu deseo?" ─────────────────────────────────────────
function DeseoModal({ eventoId, token, onClose }: { eventoId: string; token: string; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9500, background: "rgba(15,23,42,0.72)", backdropFilter: "blur(12px)", display: "flex", alignItems: "flex-end", justifyContent: "center", animation: "fadeIn .22s ease" }}>
      <div style={{ width: "100%", maxWidth: 480, background: "var(--surface)", borderRadius: "28px 28px 0 0", padding: "0 0 max(24px, env(safe-area-inset-bottom))", boxShadow: "0 -16px 60px rgba(15,23,42,0.20)", animation: "slideUp .32s cubic-bezier(.22,1,.36,1)" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#CBD5E1", margin: "14px auto 0" }} />
        <div style={{ padding: "22px 24px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>💌</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontStyle: "italic", color: "var(--ink)", marginBottom: 8 }}>
            ¿Querés dejar tu deseo?
          </div>
          <p style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.6, marginBottom: 24 }}>
            Ya subiste tu foto. ¿Querés escribir un mensaje especial para los anfitriones?
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              style={{ width: "100%", background: "linear-gradient(135deg,var(--gold-dark),var(--gold))", color: "#fff", border: "none", borderRadius: 14, padding: "16px", fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontStyle: "italic", fontWeight: 600, cursor: "pointer", boxShadow: "0 8px 22px -6px rgba(79,70,229,0.40)" }}
              onClick={() => { window.location.href = `/muro/${eventoId}?token=${token}&tab=deseos`; }}
            >
              Sí, quiero dejar mi deseo 💌
            </button>
            <button
              style={{ width: "100%", background: "transparent", border: "none", padding: "12px", fontSize: 13, fontWeight: 500, color: "var(--ink3)", cursor: "pointer", fontFamily: "'Jost',sans-serif" }}
              onClick={onClose}
            >
              No, gracias
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Formulario deseo inline ──────────────────────────────────────────────────
function DeseoFormInline({
  invitadoId,
  eventoId,
  invitadoNombre,
  onPublicado,
}: {
  invitadoId: string;
  eventoId: string;
  invitadoNombre: string;
  onPublicado: () => void;
}) {
  const [mensaje, setMensaje] = useState("");
  const [sticker, setSticker] = useState(STICKERS_DESEO[0]);
  const [color, setColor] = useState(COLORES_DESEO_FORM[0]);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  // ── Dedicatoria con voz ──
  const [grabando, setGrabando] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [segGrabados, setSegGrabados] = useState(0);
  const [errAudio, setErrAudio] = useState("");
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const MAX_SEG = 60;

  function detenerGrabacion() {
    if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setGrabando(false);
  }

  async function iniciarGrabacion() {
    setErrAudio("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", ""].find(
        (t) => !t || (window.MediaRecorder && MediaRecorder.isTypeSupported(t)),
      );
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        setAudioBlob(blob);
        setAudioPreview(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      recRef.current = rec;
      rec.start();
      setGrabando(true);
      setSegGrabados(0);
      timerRef.current = setInterval(() => {
        setSegGrabados((s) => {
          if (s + 1 >= MAX_SEG) detenerGrabacion();
          return s + 1;
        });
      }, 1000);
    } catch {
      setErrAudio("No se pudo acceder al micrófono. Revisá los permisos del navegador.");
    }
  }

  function borrarAudio() {
    if (audioPreview) URL.revokeObjectURL(audioPreview);
    setAudioBlob(null);
    setAudioPreview(null);
    setSegGrabados(0);
  }

  async function publicar() {
    if (!mensaje.trim() && !audioBlob) return;
    setEnviando(true);
    // Subir el audio (si hay) al storage
    let audioUrl: string | null = null;
    if (audioBlob) {
      const ext = audioBlob.type.includes("mp4") ? "m4a" : "webm";
      const path = `audios/${eventoId}/${invitadoId}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("fotos-eventos")
        .upload(path, audioBlob, { contentType: audioBlob.type || "audio/webm" });
      if (!upErr) {
        const { data } = supabase.storage.from("fotos-eventos").getPublicUrl(path);
        audioUrl = data.publicUrl;
      }
    }
    const fila: Record<string, unknown> = {
      evento_id: eventoId,
      invitado_id: invitadoId,
      nombre_autor: invitadoNombre || "Invitado",
      mensaje: mensaje.trim() || "🎤 Dedicatoria de voz",
      emoji_sticker: sticker,
      color_fondo: color,
      aprobado: true,
    };
    if (audioUrl) fila.audio_url = audioUrl;
    let { error } = await supabase.from("deseos").insert(fila);
    // Si la columna audio_url no existe aún (falta migración), publicar sin audio
    if (error && /audio_url/i.test(error.message || "")) {
      delete fila.audio_url;
      ({ error } = await supabase.from("deseos").insert(fila));
    }
    setEnviando(false);
    setEnviado(true);
    onPublicado();
  }

  if (enviado) {
    return (
      <div style={{ background: "linear-gradient(135deg,#EEF2FF,#E0E7FF)", border: "1.5px solid rgba(79,70,229,0.22)", borderRadius: 18, padding: "24px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>💌</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontStyle: "italic", color: "#3730A3", marginBottom: 8 }}>¡Tu deseo fue enviado!</div>
        <p style={{ fontSize: 13, color: "#6366F1" }}>Tu mensaje aparecerá en el muro del evento.</p>
      </div>
    );
  }

  return (
    <div style={{ background: "white", border: "1.5px solid rgba(79,70,229,0.18)", borderRadius: 18, padding: "20px", display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 4px 20px rgba(79,70,229,0.08)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 28 }}>💌</div>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontStyle: "italic", color: "#1E1B4B", fontWeight: 600 }}>Dejá tu deseo</div>
          <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>Un mensaje especial para los anfitriones</div>
        </div>
      </div>

      {/* Stickers */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#4F46E5", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.8px" }}>Elige un sticker</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {STICKERS_DESEO.map((s) => (
            <button key={s} onClick={() => setSticker(s)}
              style={{ width: 36, height: 36, borderRadius: 10, border: sticker === s ? "2.5px solid #4F46E5" : "1.5px solid #E5E7EB", background: sticker === s ? "#EEF2FF" : "white", fontSize: 18, cursor: "pointer", transition: "all .14s" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Color de tarjeta */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#4F46E5", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.8px" }}>Color de tarjeta</div>
        <div style={{ display: "flex", gap: 6 }}>
          {COLORES_DESEO_FORM.map((c) => (
            <button key={c} onClick={() => setColor(c)}
              style={{ width: 28, height: 28, borderRadius: 8, background: c, border: color === c ? "2.5px solid #4F46E5" : "1.5px solid #D1D5DB", cursor: "pointer", transition: "all .14s" }} />
          ))}
        </div>
      </div>

      {/* Mensaje */}
      <textarea
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        placeholder="Escribe tu deseo, dedicatoria o mensaje especial..."
        maxLength={300}
        rows={4}
        style={{ width: "100%", border: "1.5px solid #E0E7FF", borderRadius: 12, padding: "12px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", resize: "none", background: color, color: "#1E1B4B", boxSizing: "border-box", lineHeight: 1.6 }}
      />
      <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: -10, textAlign: "right" }}>{mensaje.length}/300</div>

      {/* ── Dedicatoria con voz ── */}
      <div style={{ border: "1.5px dashed rgba(79,70,229,0.35)", borderRadius: 14, padding: "12px 14px", background: "rgba(79,70,229,0.04)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#4F46E5", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>
          🎤 Dedicatoria de voz (opcional)
        </div>
        {!audioPreview && !grabando && (
          <button
            onClick={iniciarGrabacion}
            style={{ width: "100%", border: "none", borderRadius: 12, padding: "12px", background: "linear-gradient(135deg,#EEF2FF,#E0E7FF)", color: "#3730A3", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="12" rx="3"/>
              <path d="M5 10v1a7 7 0 0014 0v-1M12 18v4M8 22h8"/>
            </svg>
            Grabar mensaje de voz
          </button>
        )}
        {grabando && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <style>{`@keyframes recPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.35);opacity:.55}}`}</style>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#dc2626", animation: "recPulse 1s ease-in-out infinite", flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", flex: 1 }}>
              Grabando... {String(Math.floor(segGrabados / 60)).padStart(1, "0")}:{String(segGrabados % 60).padStart(2, "0")} / 1:00
            </span>
            <button
              onClick={detenerGrabacion}
              style={{ border: "none", borderRadius: 10, padding: "8px 14px", background: "#dc2626", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              ■ Detener
            </button>
          </div>
        )}
        {audioPreview && !grabando && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <audio controls src={audioPreview} style={{ width: "100%", height: 38 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={borrarAudio}
                style={{ flex: 1, border: "1.5px solid rgba(220,38,38,0.4)", borderRadius: 10, padding: "8px", background: "white", color: "#dc2626", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                🗑 Borrar y regrabar
              </button>
            </div>
          </div>
        )}
        {errAudio && <p style={{ fontSize: 11, color: "#dc2626", marginTop: 6 }}>{errAudio}</p>}
      </div>

      <button
        onClick={publicar}
        disabled={enviando || (!mensaje.trim() && !audioBlob)}
        style={{ width: "100%", background: (mensaje.trim() || audioBlob) ? "linear-gradient(135deg,#3730A3,#4F46E5)" : "#E5E7EB", color: (mensaje.trim() || audioBlob) ? "white" : "#9CA3AF", border: "none", borderRadius: 14, padding: "15px", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: (mensaje.trim() || audioBlob) ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .2s", boxShadow: (mensaje.trim() || audioBlob) ? "0 6px 20px rgba(79,70,229,0.30)" : "none" }}
      >
        <span style={{ fontSize: 18 }}>{sticker}</span>
        {enviando ? "Publicando..." : "Publicar mi deseo"}
      </button>
    </div>
  );
}

// ─── Recordatorio final de deseo (antes del botón Listo) ─────────────────────
function RecordatorioDeseoFinal({ eventoId, invitadoId, token }: { eventoId: string; invitadoId: string; token: string }) {
  const [tieneDeseo, setTieneDeseo] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.from("deseos").select("id").eq("invitado_id", invitadoId).limit(1)
      .then(({ data }) => setTieneDeseo(!!(data && data.length > 0)));
  }, [invitadoId]);

  if (tieneDeseo === null || tieneDeseo) return null;

  return (
    <div style={{ background: "linear-gradient(135deg,#FDF4FF,#EEF2FF)", border: "1.5px solid rgba(139,92,246,0.25)", borderRadius: 18, padding: "20px 18px", display: "flex", flexDirection: "column", gap: 12, textAlign: "center" }}>
      <div style={{ fontSize: 28 }}>💌</div>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontStyle: "italic", color: "var(--ink)", lineHeight: 1.3 }}>
        ¿Querés dejar un mensaje?
      </div>
      <p style={{ fontSize: 12, color: "var(--ink3)", lineHeight: 1.6, margin: 0 }}>
        Todavía podés escribir un deseo o dedicatoria especial para los anfitriones.
      </p>
      <button
        className="btn-accion-full"
        style={{ borderRadius: 13 }}
        onClick={() => { window.location.href = `/muro/${eventoId}?token=${token}&tab=deseos`; }}
      >
        <div className="btn-accion-ico">
          <span style={{ fontSize: 18 }}>💌</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1, textAlign: "left" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Sí, escribir mi deseo</span>
          <span style={{ fontSize: 11, opacity: 0.65 }}>Te llevamos al libro de mensajes</span>
        </div>
        <svg style={{ marginLeft: "auto", flexShrink: 0, opacity: 0.4 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  );
}

// ─── Recordatorio de foto y deseo ─────────────────────────────────────────────
function RecordatorioAccion({ eventoId: _eventoId, invitadoId, token: _token, onEscribirDeseo }: { eventoId: string; invitadoId: string; token: string; onEscribirDeseo?: () => void }) {
  const [tieneFoto, setTieneFoto] = useState<boolean | null>(null);
  const [tieneDeseo, setTieneDeseo] = useState<boolean | null>(null);

  useEffect(() => {
    async function check() {
      const [{ data: fotos }, { data: deseos }] = await Promise.all([
        supabase.from("fotos").select("id").eq("invitado_id", invitadoId).limit(1),
        supabase.from("deseos").select("id").eq("invitado_id", invitadoId).limit(1),
      ]);
      setTieneFoto(!!(fotos && fotos.length > 0));
      setTieneDeseo(!!(deseos && deseos.length > 0));
    }
    check();
  }, [invitadoId]);

  if (tieneFoto === null) return null;
  if (tieneFoto && tieneDeseo) return null;

  return (
    <div style={{ background: "linear-gradient(135deg,#EEF2FF,#F5F3FF)", border: "1px solid rgba(79,70,229,0.2)", borderRadius: 18, padding: "18px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gold-dark)", textTransform: "uppercase", letterSpacing: "1px" }}>
        ✨ Completá tu experiencia
      </div>

      {/* Foto */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: tieneFoto ? "rgba(34,197,94,0.12)" : "rgba(79,70,229,0.10)", border: `1px solid ${tieneFoto ? "rgba(34,197,94,0.3)" : "rgba(79,70,229,0.22)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>
          {tieneFoto ? "✓" : <IcoCamera />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: tieneFoto ? "#16a34a" : "var(--ink)", textDecoration: tieneFoto ? "line-through" : "none", opacity: tieneFoto ? 0.7 : 1 }}>
            Subí tu foto del evento
          </div>
          <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 1 }}>
            {tieneFoto ? "Ya subiste tu foto" : "Compartí el momento con los demás"}
          </div>
        </div>
        {!tieneFoto && (
          <button
            style={{ flexShrink: 0, background: "var(--cream)", border: "1px solid var(--border-mid)", borderRadius: 10, padding: "7px 13px", fontSize: 12, fontWeight: 700, color: "var(--ink2)", cursor: "pointer", fontFamily: "'Jost',sans-serif", whiteSpace: "nowrap", transition: "all .15s" }}
            onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.background = "#4F46E5"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#4F46E5"; }}
            onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--cream)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ink2)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-mid)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--cream)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ink2)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-mid)"; }}
            onClick={() => { document.getElementById("subir-fotos-inv")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}
          >
            Subir foto
          </button>
        )}
      </div>

      {/* Deseo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: tieneDeseo ? "rgba(34,197,94,0.12)" : "rgba(79,70,229,0.10)", border: `1px solid ${tieneDeseo ? "rgba(34,197,94,0.3)" : "rgba(79,70,229,0.22)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: tieneDeseo ? 16 : 14 }}>
          {tieneDeseo ? "✓" : "💌"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: tieneDeseo ? "#16a34a" : "var(--ink)", textDecoration: tieneDeseo ? "line-through" : "none", opacity: tieneDeseo ? 0.7 : 1 }}>
            Dejá tu deseo
          </div>
          <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 1 }}>
            {tieneDeseo ? "Ya enviaste tu mensaje" : "Un mensaje especial para los anfitriones"}
          </div>
        </div>
        {!tieneDeseo && onEscribirDeseo && (
          <button
            style={{ flexShrink: 0, background: "var(--cream)", border: "1px solid var(--border-mid)", borderRadius: 10, padding: "7px 13px", fontSize: 12, fontWeight: 700, color: "var(--ink2)", cursor: "pointer", fontFamily: "'Jost',sans-serif", whiteSpace: "nowrap", transition: "all .15s" }}
            onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.background = "#4F46E5"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#4F46E5"; }}
            onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--cream)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ink2)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-mid)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--cream)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ink2)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-mid)"; }}
            onClick={onEscribirDeseo}
          >
            Escribir
          </button>
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
  const [showWelcome, setShowWelcome] = useState(true);
  const [showEvorixPromo, setShowEvorixPromo] = useState(false);
  // showMascota eliminado — reemplazado por FloatingMascot
  const [mascotaFase, setMascotaFase] = useState<"leyendo"|"esperando_confirm"|"post_confirm"|"esperando_submit"|"instrucciones"|"despedida"|"oculto">("oculto");
  // Cuando cambia de pantalla → el birrete lee la nueva pantalla
  const prevStepRef = useRef(step);
  useEffect(() => {
    const prev = prevStepRef.current;
    prevStepRef.current = step;
    if (prev === step) return;
    if (prev === "vista" && step === "form") {
      if (mascotaFase === "esperando_confirm" || mascotaFase === "leyendo" || mascotaFase === "oculto") {
        setMascotaFase("post_confirm");
      }
    }
    if (prev !== "confirmado" && step === "confirmado") {
      setMascotaFase("instrucciones");
      // Lluvia de birretes + fanfarria y aplausos (solo graduación)
      if (evento?.tipo === "graduacion") {
        setGradCapsKey(k => k + 1);
        sonidoCelebracion();
      }
    }
    if (prev !== "rechazado" && step === "rechazado") {
      setMascotaFase("despedida");
    }
  }, [step, mascotaFase]);
  const [gradCapsKey, setGradCapsKey] = useState(0);
  // Auto-limpiar la lluvia de birretes al terminar la animación
  useEffect(() => {
    if (!gradCapsKey) return;
    const t = setTimeout(() => setGradCapsKey(0), 7000);
    return () => clearTimeout(t);
  }, [gradCapsKey]);
  // ── Contador de confirmados en vivo ──
  const [totalConfirmados, setTotalConfirmados] = useState<number | null>(null);
  useEffect(() => {
    if (!invitado?.evento_id) return;
    let activo = true;
    const cargar = async () => {
      const { data } = await supabase
        .from("invitados")
        .select("num_personas")
        .eq("evento_id", invitado.evento_id)
        .eq("estado", "confirmado");
      if (activo && data) {
        setTotalConfirmados(data.reduce((s, i) => s + (i.num_personas || 1), 0));
      }
    };
    cargar();
    const int = setInterval(cargar, 25000); // refresco "en vivo"
    return () => { activo = false; clearInterval(int); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitado?.evento_id, step]);
  // ── Vista previa del muro (últimas fotos) — solo graduación ──
  const [muroPreview, setMuroPreview] = useState<{ urls: string[]; total: number } | null>(null);
  useEffect(() => {
    if (!invitado?.evento_id || evento?.tipo !== "graduacion") return;
    (async () => {
      const { data, count } = await supabase
        .from("fotos")
        .select("url", { count: "exact" })
        .eq("evento_id", invitado.evento_id)
        .order("created_at", { ascending: false })
        .limit(3);
      if (data && data.length) {
        setMuroPreview({ urls: data.map((f: { url: string }) => f.url), total: count ?? data.length });
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitado?.evento_id, evento?.tipo]);
  // ── Aparición suave de las secciones al hacer scroll ──
  useEffect(() => {
    if (loading || step !== "vista") return;
    if (typeof IntersectionObserver === "undefined") return;
    const els = Array.from(document.querySelectorAll(".inv-body > *"));
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("rv-in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -30px 0px" },
    );
    els.forEach((el) => { el.classList.add("rv-prep"); io.observe(el); });
    return () => io.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, step, evento?.id]);
  const { hablando, leer, detener, textoActual, charIdx } = useTTS();
  const [itinerario, setItinerario] = useState<ItemItinerario[]>([]);
  // Mesa self-selection
  type MesaConOcupacion = { id: string; nombre: string; capacidad: number; ocupados: number };
  const [mesasDisponibles, setMesasDisponibles] = useState<MesaConOcupacion[]>([]);
  const [asignandoMesa, setAsignandoMesa] = useState(false);
  const [mesaConfirmada, setMesaConfirmada] = useState<string | null>(null);
  // Formulario deseo inline
  const [showDeseoForm, setShowDeseoForm] = useState(false);
  const [deseoPublicado, setDeseoPublicado] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    document.title = "Evorix — Tu invitación";
    setMounted(true);
    cargarDatos();
  }, []);

  // ── Desbloqueo de audio ──────────────────────────────────────────────────────
  // iOS/Android bloquean autoplay de audio con sonido. Estrategia:
  // 1. Intentar muted autoplay inmediato (funciona en Chrome/desktop).
  // 2. Si falla: esperar primer touchstart/mousedown capturado.
  // 3. En el unlock: play muted → unmute (truco iOS más confiable).
  useEffect(() => {
    let desbloqueado = false;

    const getAudio = () =>
      globalAudioRef.current ??
      (document.getElementById("inv-audio-hidden") as HTMLAudioElement | null);

    const unlock = () => {
      if (desbloqueado) return;
      desbloqueado = true;
      document.removeEventListener("touchstart", unlock, true);
      document.removeEventListener("mousedown", unlock, true);
      const audio = getAudio();
      if (!audio) return;
      // Truco iOS: play en muted (permitido) → unmute inmediatamente
      audio.muted = true;
      audio.play()
        .then(() => { audio.muted = false; })
        .catch(() => {
          audio.muted = false;
          audio.play().catch(() => {});
        });
    };

    // Exponer función de unlock para que el botón de bienvenida la llame directo
    (window as unknown as Record<string, unknown>).__unlockAudio = unlock;

    const tryImmediate = () => {
      const audio = getAudio();
      if (!audio) return;
      // Intentar muted autoplay (Chrome lo permite; iOS lo bloqueará)
      audio.muted = true;
      audio.play()
        .then(() => { audio.muted = false; desbloqueado = true; })
        .catch(() => {
          // Bloqueado — esperar primer gesto
          document.addEventListener("touchstart", unlock, { capture: true, once: true });
          document.addEventListener("mousedown", unlock, { capture: true, once: true });
        });
    };

    const timer = setTimeout(tryImmediate, 80);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("touchstart", unlock, true);
      document.removeEventListener("mousedown", unlock, true);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

    let siguiente = (lastConf?.[0]?.numero_confirmacion ?? 0) + 1;

    // Reintentos para manejar race condition en numero_confirmacion (unique constraint)
    let updated = null;
    for (let intento = 0; intento < 5; intento++) {
      const { data, error } = await supabase
        .from("invitados")
        .update({
          estado: "confirmado",
          num_personas: numPersonas,
          numero_confirmacion: siguiente,
        })
        .eq("id", invitado.id)
        .select()
        .single();

      if (data && !error) {
        updated = data;
        break;
      }

      // Si el error es unique constraint en numero_confirmacion, reintentamos con el siguiente
      const esConflicto = error?.code === "23505" ||
        error?.message?.includes("numero_confirmacion") ||
        error?.message?.includes("unique");

      if (esConflicto) {
        siguiente++;
        continue;
      }

      // Otro error — salimos del loop
      console.error("Error al confirmar:", error);
      break;
    }

    setConfirmando(false);

    if (updated) {
      setInvitado(updated);
      setStep("confirmado");
      window.scrollTo({ top: 0, behavior: "instant" });
      cargarMesasDisponibles(updated.evento_id);
    } else {
      // El UPDATE falló en la DB — no avanzamos al paso confirmado
      alert("Hubo un error al confirmar tu asistencia. Por favor intentá de nuevo.");
    }
  }

  async function rechazarAsistencia() {
    if (!invitado) return;
    const { error } = await supabase
      .from("invitados")
      .update({ estado: "rechazado" })
      .eq("id", invitado.id);
    if (!error) {
      setStep("rechazado");
      window.scrollTo({ top: 0, behavior: "instant" });
    } else {
      alert("Hubo un error. Por favor intentá de nuevo.");
    }
  }

  async function handleConfirmarClick() {
    if (!invitado) return;
    // Si el organizador configuró que el invitado elija, o si el cupo es > 1, mostrar form
    if (invitado.cupo_elije_invitado || (invitado.num_personas || 1) > 1) {
      setStep("form");
      window.scrollTo({ top: 0, behavior: "instant" });
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
        ctx!.globalAlpha = Math.max(0, 1 - frame / 80);
        if (evento?.tipo === "graduacion") {
          // Birretes en lugar de confeti genérico
          ctx!.font = `${Math.max(16, p.size * 1.7)}px serif`;
          ctx!.textAlign = "center";
          ctx!.fillText("🎓", 0, p.size / 2);
        } else {
          ctx!.fillStyle = p.color;
          ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
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
    setShowEvorixPromo(true);
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
        setTimeout(() => openWhatsApp(`https://wa.me/?text=${texto}`), 800);
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

  // ── Versión Instagram Stories 9:16 (graduación) ──
  const [generandoStory, setGenerandoStory] = useState(false);
  async function compartirStory() {
    if (!invitado || !evento || generandoStory) return;
    setGenerandoStory(true);
    try {
      const blob = await generarStoryCanvas(invitado, evento, window.location.origin);
      if (!blob) return;
      const file = new File([blob], `story_${evento.nombre.replace(/\s/g, "_")}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `🎓 ${evento.nombre}` });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `story_${evento.nombre.replace(/\s/g, "_")}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      }
    } catch (err) {
      console.error("Error al generar story:", err);
    } finally {
      setGenerandoStory(false);
    }
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
    // Tema exclusivo de graduación: dorado + azul noche
    graduacion: `
      --gold:#D97706;--gold-dark:#92400E;--gold-light:#FDE68A;--gold-pale:#FFFBEB;
      --dark:#FFFBEB;--dark2:#FEF3C7;--ink:#1E1B4B;--ink2:#44406B;--ink3:#92400E;
      --cream:#FFFBEB;--cream2:#FEF3C7;--surface:#FFFFFF;
      --on-dark:#78350F;--on-dark-sub:#B45309;
      --border:rgba(217,119,6,0.18);--border-mid:rgba(217,119,6,0.34);
      --shadow:0 8px 28px rgba(120,53,15,0.07);--shadow-lg:0 20px 48px rgba(120,53,15,0.12);
    `,
  };
  const temaVars = evento?.tipo === "graduacion"
    ? TEMAS.graduacion
    : (TEMAS[evento?.tema ?? "clasico"] ?? TEMAS.clasico);

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
      padding-bottom:4px;opacity:0;transition:opacity .5s ease;}
    .page.vis{opacity:1}
    .page.destroying{animation:shatter .6s ease forwards}
    @keyframes shatter{0%{opacity:1;transform:scale(1)}30%{opacity:1;transform:scale(1.03)}60%{opacity:.5;transform:scale(.95)}100%{opacity:0;transform:scale(.8)}}
    @keyframes riseUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}

    .topbar{display:flex;align-items:center;gap:10px;padding:11px 16px;background:rgba(255,255,255,0.90);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);position:sticky;top:env(safe-area-inset-top,0px);z-index:20;justify-content:space-between;box-sizing:border-box;width:100%;}
    .topbar-left{display:flex;align-items:center;gap:10px}
    .topbar-name{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--ink);letter-spacing:.3px;line-height:1}
    .topbar-sub{font-size:11px;font-weight:600;color:var(--ink3);text-transform:uppercase;letter-spacing:1px;margin-top:1px}

    .wrap{max-width:430px;margin:0 auto;padding:22px 16px max(32px,env(safe-area-inset-bottom,32px));display:flex;flex-direction:column;gap:20px}

    .inv-card{background:var(--surface);border-radius:var(--r);border:1px solid var(--border-mid);box-shadow:0 8px 48px rgba(15,23,42,.13),0 2px 8px rgba(15,23,42,.06);overflow:hidden;animation:riseUp .6s cubic-bezier(.22,1,.36,1) both;}
    /* Hero foto — limpia, sin overlays ni texto encima */
    .inv-hero{position:relative;overflow:hidden;width:100%;background:var(--dark)}
    .inv-hero-foto{width:100%;height:100%;object-fit:cover;display:block;object-position:center top;}
    .inv-hero-bg{min-height:200px;background:linear-gradient(160deg,var(--dark) 0%,var(--dark2) 100%)}
    /* Sección debajo del hero */
    .inv-tipo-badge{display:inline-flex;align-items:center;gap:7px;background:transparent;border:1px solid rgba(79,70,229,0.35);border-radius:99px;padding:5px 14px 5px 10px;font-family:'Jost',sans-serif;font-size:12px;font-weight:600;color:var(--ink3);letter-spacing:1.2px;text-transform:uppercase;}
    .inv-tipo-badge-dot{width:5px;height:5px;border-radius:50%;background:var(--gold-dark);opacity:.7;display:inline-block}
    .inv-saludo{font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:500;font-style:italic;color:var(--ink);letter-spacing:-.3px;line-height:1.2;margin-top:8px}
    .inv-anfitrion{font-size:14px;color:var(--ink3);font-weight:400;letter-spacing:.3px;margin-top:4px}
    .inv-evento-nombre{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--ink);letter-spacing:.3px;margin-top:6px}
    .inv-body{padding:24px 20px;display:flex;flex-direction:column;gap:18px}
    .inv-frase{font-family:'Cormorant Garamond',serif;font-size:17px;font-style:italic;font-weight:400;color:var(--ink2);text-align:center;line-height:1.6;padding:2px 8px}
    .inv-nombres{background:var(--cream);border:1px solid var(--border);border-radius:var(--r-sm);padding:16px 18px}
    .inv-nombres-title{font-size:11px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:1.4px;margin-bottom:12px}
    .inv-nombre-item{display:flex;align-items:center;gap:11px;font-family:'Cormorant Garamond',serif;font-size:17px;color:var(--ink);font-weight:500;margin-bottom:8px}
    .inv-nombre-item:last-child{margin-bottom:0}
    .inv-nombre-av{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--gold-dark),var(--gold));color:#FFFFFF;font-family:'Cormorant Garamond',serif;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:none;box-shadow:0 2px 6px rgba(79,70,229,0.25)}
    .detalles{background:var(--cream);border:1px solid var(--border);border-radius:var(--r-sm);padding:18px 18px;display:flex;flex-direction:column;gap:16px}
    .detalle-fila{display:flex;align-items:flex-start;gap:14px}
    .detalle-ico-wrap{width:38px;height:38px;border-radius:11px;background:var(--surface);border:1px solid var(--border-mid);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 1px 4px rgba(15,23,42,.05)}
    .detalle-label{font-size:11px;color:var(--ink3);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px}
    .detalle-texto{font-size:15px;color:var(--ink);font-weight:400;line-height:1.4;text-transform:capitalize}
    .maps-btn{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,var(--gold),var(--gold-dark));color:#fff;border-radius:8px;padding:6px 12px;font-size:11px;font-weight:600;letter-spacing:.3px;text-decoration:none;margin-top:7px;transition:opacity .15s;font-family:'Jost',sans-serif;}
    .maps-btn:hover{opacity:.85}

    /* Galería fotos lugar */
    .foto-lugar-label{font-size:12px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:1px;margin-bottom:9px}
    .galeria-thumbs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px}
    .galeria-thumb{position:relative;border-radius:10px;overflow:hidden;aspect-ratio:1;cursor:pointer;border:1.5px solid var(--border-mid);transition:transform .15s}
    .galeria-thumb:hover{transform:scale(1.02)}
    .galeria-thumb img{width:100%;height:100%;object-fit:cover;display:block}
    .galeria-thumb-more{position:absolute;inset:0;background:rgba(15,23,42,0.60);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:var(--gold-light)}
    .btn-ver-fotos{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;background:var(--cream);border:1.5px solid var(--border-mid);border-radius:12px;padding:11px 16px;font-size:13px;font-weight:600;color:var(--ink2);cursor:pointer;transition:all .15s;font-family:'Jost',sans-serif;}
    .btn-ver-fotos:hover{background:var(--gold-pale);border-color:var(--gold);color:var(--gold-dark)}

    /* Lightbox */
    .lightbox-overlay{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;overflow:hidden;touch-action:none}
    .lightbox-inner{position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center}
    .lightbox-img-wrap{width:100%;display:flex;align-items:center;justify-content:center;background:transparent}
    .lightbox-img{width:100%;height:auto;display:block;user-select:none}
    .lightbox-video{width:100%;max-height:90dvh;display:block;outline:none;background:#000}
    .lightbox-close{position:fixed;top:env(safe-area-inset-top,12px);right:14px;width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,0.6);border:1.5px solid rgba(255,255,255,0.3);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:10;backdrop-filter:blur(8px)}
    .lightbox-nav{position:fixed;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;background:rgba(0,0,0,0.55);border:1.5px solid rgba(255,255,255,0.2);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;color:#fff;z-index:10}
    .lightbox-nav:hover{background:rgba(79,70,229,0.5)}
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
    .music-label{display:block;font-size:11px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
    .music-name{display:block;font-family:'Cormorant Garamond',serif;font-size:17px;font-style:italic;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .music-waves{display:flex;align-items:center;gap:2px;flex-shrink:0}
    .mw{width:3px;border-radius:99px;background:var(--gold);animation:mwave .8s ease-in-out infinite}
    .mw-1{height:8px;animation-delay:0s}.mw-2{height:14px;animation-delay:.1s}.mw-3{height:10px;animation-delay:.2s}.mw-4{height:16px;animation-delay:.15s}.mw-5{height:8px;animation-delay:.05s}
    @keyframes mwave{0%,100%{transform:scaleY(0.5)}50%{transform:scaleY(1)}}

    /* Mensaje */
    .inv-mensaje{background:var(--cream);border-left:3px solid var(--gold);border-radius:0 12px 12px 0;padding:14px 18px;font-family:'Cormorant Garamond',serif;font-size:17px;font-style:italic;color:var(--ink2);line-height:1.7}
    /* Deadline */
    .inv-deadline{background:#fef8f0;border:1px solid rgba(180,83,9,0.2);border-radius:var(--r-sm);padding:12px 15px;display:flex;align-items:center;gap:10px}
    .deadline-text{font-size:14px;color:#92400e;font-weight:500;line-height:1.4}
    /* Cómo llegar */
    .como-llegar-box{background:var(--cream);border:1px solid var(--border);border-radius:var(--r-sm);padding:14px 16px}
    .como-llegar-label{font-size:11px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
    .como-llegar-text{font-size:14px;color:var(--ink2);line-height:1.7}

    /* ── Barra de decisión — FIXED bottom, siempre visible sin importar el scroll ── */
    .decision-bar{
      position:fixed;bottom:0;left:0;right:0;
      background:rgba(255,255,255,0.97);
      backdrop-filter:blur(20px);
      -webkit-backdrop-filter:blur(20px);
      border-top:1px solid rgba(79,70,229,0.14);
      padding:12px 16px max(16px,env(safe-area-inset-bottom,16px));
      z-index:50;
      box-shadow:0 -8px 32px rgba(79,70,229,0.12);
    }
    .decision-bar-inner{max-width:430px;margin:0 auto}
    .decision-bar-label{font-family:'Cormorant Garamond',serif;font-size:15px;font-style:italic;color:var(--ink3);text-align:center;margin-bottom:10px;font-weight:400}
    .decision-bar-btns{display:grid;grid-template-columns:1fr 2fr;gap:10px}
    /* Espacio extra en el .wrap para que el contenido no quede tapado por la barra fija */
    .wrap-has-bar{padding-bottom:110px!important}
    .btn-si{background:linear-gradient(135deg,var(--gold-dark),var(--gold));color:#fff;border:none;border-radius:var(--r-sm);padding:16px 12px;font-family:'Jost',sans-serif;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 6px 20px -4px rgba(79,70,229,0.40);transition:transform .18s,box-shadow .18s,opacity .15s;letter-spacing:.3px}
    .btn-si:hover{transform:translateY(-1px);box-shadow:0 10px 28px -4px rgba(79,70,229,0.48)}
    .btn-si:disabled{opacity:.65;cursor:wait}
    .btn-no{background:var(--cream);color:var(--ink2);border:1px solid var(--border-mid);border-radius:var(--r-sm);padding:16px 12px;font-family:'Jost',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all .18s;letter-spacing:.2px}
    .btn-no:hover{background:#fef2f2;color:#b45309;border-color:rgba(180,83,9,0.25)}

    /* Form */
    .form-card{background:var(--surface);border-radius:var(--r);border:1px solid var(--border-mid);box-shadow:var(--shadow);padding:30px 24px;animation:riseUp .45s cubic-bezier(.22,1,.36,1) both}
    .form-titulo{font-family:'Cormorant Garamond',serif;font-size:32px;font-style:italic;font-weight:400;color:var(--ink)}
    .form-sub{font-size:12px;color:var(--ink3);font-weight:600;margin:4px 0 24px;text-transform:uppercase;letter-spacing:.8px}
    .campo-label{font-size:12px;font-weight:700;color:var(--gold-dark);text-transform:uppercase;letter-spacing:1px;margin:18px 0 12px;display:block}
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
    .conf-sub{position:relative;z-index:1;font-size:14px;color:var(--ink3);font-weight:500;letter-spacing:.3px}
    .conf-body{padding:22px;display:flex;flex-direction:column;gap:16px}
    .num-badge{background:var(--cream);border-radius:var(--r-sm);border:1px solid var(--border);padding:16px 20px;display:flex;align-items:center;gap:16px}
    .num-icono{width:46px;height:46px;border-radius:12px;background:var(--surface);border:1px solid var(--border-mid);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--gold-dark)}
    .num-label{font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--ink3);margin-bottom:3px}
    .num-val{font-family:'Cormorant Garamond',serif;font-size:34px;font-weight:500;color:var(--ink);letter-spacing:-1px;line-height:1}
    .resumen{background:var(--cream);border:1px solid var(--border);border-radius:var(--r-sm);padding:16px 18px;display:flex;flex-direction:column;gap:13px}
    .res-fila{display:flex;align-items:center;gap:12px}
    .res-ico{width:34px;height:34px;border-radius:10px;background:var(--surface);border:1px solid var(--border-mid);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 1px 4px rgba(15,23,42,.05)}
    .res-texto{font-size:15px;color:var(--ink2);font-weight:400;text-transform:capitalize}
    .acciones-titulo{font-size:11px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:12px}

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
    .btn-accion-full{width:100%;background:var(--cream);border:1px solid var(--border-mid);border-radius:var(--r-sm);padding:15px 18px;display:flex;align-items:center;gap:13px;cursor:pointer;transition:all .18s;font-family:'Jost',sans-serif;color:var(--ink2)}
    .btn-accion-full:hover{background:var(--gold-pale);border-color:rgba(79,70,229,0.3)}
    .btn-accion-full:active{background:#4F46E5;border-color:#4F46E5;color:#fff;transform:scale(0.98)}
    .btn-accion-full:active .btn-accion-ico{background:rgba(255,255,255,0.15);border-color:transparent}
    .btn-wa{width:100%;background:var(--cream);border:1px solid var(--border-mid);border-radius:var(--r-sm);padding:15px 18px;display:flex;align-items:center;gap:13px;cursor:pointer;transition:all .18s;font-family:'Jost',sans-serif;color:var(--ink2)}
    .btn-wa:hover{background:var(--gold-pale);border-color:rgba(79,70,229,0.3)}
    .btn-wa:active{background:#4F46E5;border-color:#4F46E5;color:#fff;transform:scale(0.98)}
    .btn-wa:disabled{opacity:.7;cursor:wait}
    .btn-cerrar{width:100%;background:var(--cream);border:1px solid var(--border-mid);border-radius:var(--r-sm);padding:15px 18px;display:flex;align-items:center;gap:13px;cursor:pointer;transition:all .18s;font-family:'Jost',sans-serif;font-size:14px;font-weight:600;color:var(--ink2)}
    .btn-cerrar:hover{background:var(--gold-pale);border-color:rgba(79,70,229,0.3)}
    .btn-cerrar:active{background:#4F46E5;border-color:#4F46E5;color:#fff;transform:scale(0.98)}

    /* Mesa row mejorado */
    .mesa-row{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .15s;gap:12px}

    /* Mobile global */
    html,body{overflow-x:clip;-webkit-text-size-adjust:100%}
    .page{min-height:100dvh;overflow-x:clip}
    .wrap{width:100%;box-sizing:border-box}
    img,video{max-width:100%}

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
    .countdown-label{font-size:11px;font-weight:700;color:rgba(79,70,229,0.55);text-transform:uppercase;letter-spacing:2px;margin-bottom:14px}
    .countdown-grid{display:flex;justify-content:center;gap:8px}
    .countdown-block{display:flex;flex-direction:column;align-items:center;background:#FFFFFF;border:1px solid rgba(79,70,229,0.14);border-radius:14px;padding:12px 10px 9px;min-width:60px;box-shadow:0 2px 6px rgba(15,23,42,0.04)}
    .countdown-num{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:500;color:var(--gold-dark);line-height:1;letter-spacing:-1px;animation:cdPulse 2s ease infinite}
    .countdown-unit{font-size:10px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:1px;margin-top:5px}

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
    .mesa-list{display:flex;flex-direction:column;gap:0;max-height:380px;overflow-y:auto}
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

    /* ── Pulido visual: aparición al hacer scroll ── */
    .rv-prep{opacity:0;transform:translateY(22px)}
    .rv-prep.rv-in{opacity:1;transform:translateY(0);transition:opacity .7s ease,transform .7s cubic-bezier(.22,1,.36,1)}
    @media (prefers-reduced-motion: reduce){.rv-prep{opacity:1;transform:none}}
    /* ── Ken Burns: la foto principal respira lentamente ── */
    @keyframes heroKen{0%{transform:scale(1.03) translateY(0)}100%{transform:scale(1.12) translateY(-8px)}}
    .inv-hero-foto{animation:heroKen 16s ease-in-out infinite alternate}
    /* ── Destello que recorre el badge del tipo de evento ── */
    .inv-tipo-badge{position:relative;overflow:hidden}
    .inv-tipo-badge::after{content:"";position:absolute;top:0;bottom:0;width:45%;
      background:linear-gradient(105deg,transparent,rgba(255,255,255,0.55),transparent);
      transform:translateX(-180%) skewX(-18deg);animation:badgeShine 4.5s 1.2s ease-in-out infinite;pointer-events:none}
    @keyframes badgeShine{0%{transform:translateX(-180%) skewX(-18deg)}45%,100%{transform:translateX(340%) skewX(-18deg)}}
    ${evento?.tipo === "graduacion" ? `
    /* ── Overrides dorados de graduación (bienvenida noche estrellada + detalles ámbar) ── */
    .page{background-image:radial-gradient(ellipse 80% 40% at 50% 0%,rgba(245,158,11,0.10) 0%,transparent 70%),radial-gradient(ellipse 40% 30% at 90% 100%,rgba(217,119,6,0.06) 0%,transparent 60%)}
    .welcome-overlay{background:radial-gradient(ellipse 70% 55% at 50% 28%,#312e81 0%,#1e1b4b 52%,#0f172a 100%)}
    .welcome-dots{background-image:radial-gradient(circle,rgba(252,211,77,0.12) 1px,transparent 1px)}
    .welcome-glow{background:radial-gradient(circle,rgba(252,211,77,0.16) 0%,transparent 70%)}
    .welcome-logo-ring{background:rgba(255,255,255,0.07);border:1px solid rgba(252,211,77,0.38);box-shadow:0 10px 36px -6px rgba(0,0,0,0.55)}
    .welcome-hola{color:#FCD34D}
    .welcome-nombre{color:#FFFFFF;text-shadow:0 2px 22px rgba(252,211,77,0.30)}
    .welcome-divider{background:linear-gradient(90deg,transparent,rgba(252,211,77,0.75),transparent)}
    .welcome-evento-nombre{color:#FDE68A}
    .welcome-anfitrion{color:rgba(255,255,255,0.68)}
    .welcome-btn{background:linear-gradient(135deg,#B45309,#F59E0B);box-shadow:0 10px 28px -6px rgba(245,158,11,0.50), 0 2px 6px rgba(0,0,0,0.35)}
    .welcome-btn:hover{box-shadow:0 14px 36px -6px rgba(245,158,11,0.62)}
    .conf-hero{background:linear-gradient(155deg,#FFFBEB 0%,#FEF3C7 100%)}
    .conf-hero::before{background-image:radial-gradient(circle,#D97706 1px,transparent 1px)}
    .conf-check{background:rgba(217,119,6,0.12);border-color:rgba(217,119,6,0.40)}
    .decision-bar{border-top:1px solid rgba(217,119,6,0.20);box-shadow:0 -8px 32px rgba(120,53,15,0.14)}
    .btn-si{box-shadow:0 6px 20px -4px rgba(217,119,6,0.45)}
    .btn-si:hover{box-shadow:0 10px 28px -4px rgba(217,119,6,0.55)}
    .music-icon-wrap{box-shadow:0 4px 12px rgba(217,119,6,0.35)}
    .btn-confirmar-final{box-shadow:0 8px 22px -6px rgba(217,119,6,0.45), 0 2px 6px rgba(217,119,6,0.18)}
    .spinner{border:2px solid rgba(217,119,6,0.30);border-top-color:var(--gold)}
    .lightbox-caption{color:rgba(146,64,14,0.75)}
    ` : ""}
  `;

  if (loading)
    return (
      <>
        <style>{styles}</style>
        <div className="loading-screen">
          <AppLogo size={72} />
          <div style={{marginTop: 14, fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 26, color: "#0F172A", letterSpacing: 3}}>Evorix</div>
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

      {/* Audio oculto — montado desde el inicio para que iOS lo desbloquee
          en el primer gesto del usuario (botón "Ver mi invitación") */}
      {evento.musica_url && (
        <audio
          id="inv-audio-hidden"
          src={evento.musica_url}
          loop
          playsInline
          muted
          style={{ display: "none" }}
          ref={(el) => { if (el) globalAudioRef.current = el; }}
        />
      )}

      {/* ─── Pantalla de bienvenida con confeti ─── */}
      {showWelcome && (
        <div
          className="welcome-overlay"
          id="welcome-overlay"
        >
          {/* ── Apertura tipo diploma (solo graduación): pergamino centrado que se desenrolla ── */}
          {evento.tipo === "graduacion" && (
            <div
              className="gd-back"
              onClick={(e) => { (e.currentTarget as HTMLDivElement).style.display = "none"; }}
            >
              <style>{`
                @keyframes gdBackOut{0%{opacity:1}100%{opacity:0;visibility:hidden}}
                @keyframes gdDrop{0%{opacity:0;transform:translateY(-52px) scale(.9)}62%{opacity:1;transform:translateY(7px) scale(1.015)}82%{transform:translateY(-3px) scale(.998)}100%{opacity:1;transform:translateY(0) scale(1)}}
                @keyframes gdSealBreak{
                  0%,52%{transform:scale(1) rotate(0deg);opacity:1}
                  58%{transform:scale(1.06) rotate(-4deg)}
                  64%{transform:scale(1.03) rotate(3deg)}
                  70%{transform:scale(1.09) rotate(-3deg)}
                  80%{transform:scale(1.22) rotate(-8deg);opacity:1}
                  100%{transform:scale(.25) rotate(32deg) translateY(60px);opacity:0}}
                @keyframes gdUnroll{0%{height:0}100%{height:400px}}
                @keyframes gdTxt{0%{opacity:0;transform:translateY(12px)}100%{opacity:1;transform:translateY(0)}}
                @keyframes gdSparkle{0%{transform:translateY(14px) scale(.5);opacity:0}30%{opacity:.85}100%{transform:translateY(-80px) scale(1.15);opacity:0}}
                @keyframes gdRingPulse{0%,100%{box-shadow:0 0 0 0 rgba(252,211,77,.45)}70%{box-shadow:0 0 0 16px rgba(252,211,77,0)}}
                @keyframes gdHint{0%,20%{opacity:0}35%,80%{opacity:.65}100%{opacity:0}}
                .gd-back{position:absolute;inset:0;z-index:60;overflow:hidden;cursor:pointer;
                  display:flex;align-items:center;justify-content:center;
                  background:radial-gradient(ellipse at 50% 32%,#312e81 0%,#1e1b4b 48%,#0f172a 100%);
                  animation:gdBackOut .9s 6.6s ease both}
                .gd-glow{position:absolute;width:420px;height:420px;border-radius:50%;pointer-events:none;
                  background:radial-gradient(circle,rgba(252,211,77,.16) 0%,transparent 65%)}
                .gd-sparkle{position:absolute;border-radius:50%;background:#FCD34D;pointer-events:none;
                  animation:gdSparkle 2.6s ease-out infinite}
                .gd-wrap{position:relative;display:flex;flex-direction:column;align-items:center;
                  animation:gdDrop 1s .2s cubic-bezier(.34,1.4,.5,1) both}
                .gd-roller{width:min(88vw,362px);height:24px;border-radius:12px;position:relative;z-index:2;flex-shrink:0;
                  background:linear-gradient(180deg,#b45309 0%,#7c2d12 55%,#5b1f0a 100%);
                  box-shadow:0 5px 14px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.22)}
                .gd-roller::before,.gd-roller::after{content:"";position:absolute;top:3px;width:18px;height:18px;border-radius:50%;
                  background:radial-gradient(circle at 34% 32%,#fde68a,#d97706 55%,#92400e);box-shadow:0 2px 5px rgba(0,0,0,.45)}
                .gd-roller::before{left:-9px}
                .gd-roller::after{right:-9px}
                .gd-body{width:min(80vw,330px);height:0;max-height:62vh;overflow:hidden;position:relative;z-index:1;
                  display:flex;align-items:center;justify-content:center;
                  background:
                    repeating-linear-gradient(90deg, rgba(180,83,9,.045) 0 2px, transparent 2px 30px),
                    linear-gradient(180deg,#f6e6bf 0%,#fdf6e3 14%,#fdf6e3 86%,#f3ddab 100%);
                  box-shadow:inset 0 16px 20px -14px rgba(120,53,15,.55), inset 0 -16px 20px -14px rgba(120,53,15,.55),
                    inset 8px 0 14px -10px rgba(120,53,15,.35), inset -8px 0 14px -10px rgba(120,53,15,.35),
                    0 14px 44px rgba(0,0,0,.45);
                  animation:gdUnroll 1.8s 2.7s cubic-bezier(.7,0,.22,1) both}
                .gd-inner{flex-shrink:0;width:100%;padding:26px 22px;text-align:center;
                  font-family:'Cormorant Garamond',Georgia,serif;color:#78350f}
                .gd-t{animation:gdTxt .65s ease both}
                .gd-t1{animation-delay:3.3s}
                .gd-t2{animation-delay:3.6s}
                .gd-t3{animation-delay:3.9s}
                .gd-t4{animation-delay:4.25s}
                .gd-ring{width:58px;height:58px;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;
                  background:radial-gradient(circle at 34% 30%,#fde68a,#f59e0b 60%,#b45309);border:2.5px solid #92400e;
                  font-size:28px;animation:gdTxt .65s 3.3s ease both, gdRingPulse 2.2s 4s ease-out infinite}
                .gd-tit{font-size:15px;font-weight:700;letter-spacing:3.5px;text-transform:uppercase;color:#92400e}
                .gd-div{display:flex;align-items:center;gap:8px;margin:12px 0 14px}
                .gd-div::before,.gd-div::after{content:"";flex:1;height:1.5px;background:linear-gradient(90deg,transparent,#b45309)}
                .gd-div::after{background:linear-gradient(90deg,#b45309,transparent)}
                .gd-div span{color:#b45309;font-size:13px}
                .gd-oto{font-size:11.5px;font-weight:600;letter-spacing:2.6px;text-transform:uppercase;opacity:.75;margin-bottom:6px}
                .gd-nombre{font-size:32px;font-weight:700;font-style:italic;line-height:1.15;padding:0 6px;
                  background:linear-gradient(90deg,#92400e,#d97706 50%,#92400e);-webkit-background-clip:text;background-clip:text;color:transparent}
                .gd-evento{font-size:14px;font-style:italic;color:#92400e;opacity:.85;margin-top:14px;line-height:1.4}
                .gd-seal{position:absolute;top:50%;left:50%;margin:-47px 0 0 -47px;width:94px;height:94px;border-radius:50%;z-index:5;
                  display:flex;align-items:center;justify-content:center;flex-direction:column;
                  background:radial-gradient(circle at 32% 30%,#fde68a,#f59e0b 55%,#b45309);
                  border:3px solid #92400e;box-shadow:0 12px 34px rgba(69,26,3,.55), inset 0 2px 7px rgba(255,255,255,.45);
                  animation:gdSealBreak 2.6s .3s cubic-bezier(.5,0,.6,1) both}
                .gd-hint{position:absolute;bottom:26px;left:0;right:0;text-align:center;font-size:11px;font-weight:600;
                  letter-spacing:1.6px;text-transform:uppercase;color:#FDE68A;animation:gdHint 6.6s ease both;pointer-events:none}
              `}</style>

              {/* Resplandor y destellos dorados */}
              <div className="gd-glow" />
              {[
                { l: "16%", t: "26%", s: 5, d: "0s" }, { l: "78%", t: "22%", s: 4, d: ".7s" },
                { l: "10%", t: "62%", s: 4, d: "1.3s" }, { l: "86%", t: "58%", s: 5, d: ".4s" },
                { l: "26%", t: "78%", s: 3, d: "1.8s" }, { l: "68%", t: "80%", s: 4, d: "1s" },
                { l: "50%", t: "14%", s: 3, d: "1.5s" }, { l: "38%", t: "20%", s: 3, d: "2.1s" },
              ].map((p, i) => (
                <span key={i} className="gd-sparkle" style={{ left: p.l, top: p.t, width: p.s, height: p.s, animationDelay: p.d }} />
              ))}

              {/* Pergamino: rodillo — cuerpo que se desenrolla — rodillo */}
              <div className="gd-wrap">
                <div className="gd-roller" />
                <div className="gd-body">
                  <div className="gd-inner">
                    <div className="gd-ring">🎓</div>
                    <div className="gd-t gd-t2">
                      <div className="gd-tit">Diploma de Invitación</div>
                      <div className="gd-div"><span>✦</span></div>
                    </div>
                    <div className="gd-t gd-t3">
                      <div className="gd-oto">Otorgado a</div>
                      <div className="gd-nombre">{invitado.nombre.split(" ").slice(0, 3).join(" ")}</div>
                    </div>
                    <div className="gd-t gd-t4">
                      <div className="gd-evento">{evento.nombre}</div>
                    </div>
                  </div>
                </div>
                <div className="gd-roller" />
                {/* Sello de lacre que se rompe */}
                <div className="gd-seal">
                  <span style={{ fontSize: 32, lineHeight: 1 }}>🎓</span>
                  <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: 1.2, color: "#78350f", marginTop: 2 }}>INVITACIÓN</span>
                </div>
              </div>

              <div className="gd-hint">Tocá la pantalla para saltar</div>
            </div>
          )}

          {/* Fondo de puntos */}
          <div className="welcome-dots" />
          <div className="welcome-glow" />

          {/* Confeti — birretes y estrellas doradas en graduación */}
          <div className="welcome-confetti-layer">
            {CONFETTI_PIECES.map((p) => (
              evento.tipo === "graduacion" ? (
                <div
                  key={p.id}
                  className="confetti-piece"
                  style={{
                    left: `${p.left}%`,
                    fontSize: 10 + p.size * 1.6,
                    lineHeight: 1,
                    animationDuration: `${p.dur * 1.4}s, ${p.dur * 1.1}s`,
                    animationDelay: `${p.delay}s, ${p.delay}s`,
                    animationIterationCount: "infinite, infinite",
                    transform: `rotate(${p.rot}deg)`,
                    opacity: 0.85,
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
                  }}
                >
                  {p.id % 4 === 0 ? "⭐" : p.id % 7 === 0 ? "✨" : "🎓"}
                </div>
              ) : (
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
              )
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
            onTouchStart={() => {
              // iOS: desbloquear audio en el touchstart del botón (antes del click)
              const fn = (window as unknown as Record<string, unknown>).__unlockAudio;
              if (typeof fn === "function") (fn as () => void)();
              // iOS: desbloquear también la voz (speechSynthesis) dentro del gesto
              if (evento.tipo === "graduacion") desbloquearTTS();
            }}
            onClick={() => {
              // El click también cuenta como gesto (Android/desktop no disparan touchstart con mouse)
              if (evento.tipo === "graduacion") desbloquearTTS();
              const el = document.getElementById("welcome-overlay");
              if (el) { el.classList.add("leaving"); }
              setTimeout(() => {
                setShowWelcome(false);
                // Para graduación: solo hablar si NO ha confirmado ya
                if (evento.tipo === "graduacion") {
                  if (step === "confirmado" || step === "rechazado") {
                    // Ya completó el flujo — no repetir la invitación
                    setMascotaFase("oculto");
                  } else {
                    setMascotaFase("leyendo");
                  }
                }
              }, 420);
            }}
          >
            {evento.tipo === "graduacion" ? (
              <>
                ¡A celebrar!
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft:2}}>
                  <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z"/>
                  <path d="M6 12v5c3.33 1.67 8.67 1.67 12 0v-5"/>
                </svg>
              </>
            ) : "Ver mi invitación"}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* ── Mascota flotante de graduación — lee la invitación sin pantalla extra ── */}
      {evento && evento.tipo === "graduacion" && !showWelcome && mascotaFase !== "oculto" && (
        <FloatingMascot
          invitado={invitado}
          evento={evento}
          token={token}
          fase={mascotaFase}
          setFase={setMascotaFase}
          hablando={hablando}
          leer={leer}
          detener={detener}
          textoActual={textoActual}
          charIdx={charIdx}
        />
      )}

      {/* ── Lluvia de birretes al confirmar asistencia (graduación) ── */}
      {gradCapsKey > 0 && (
        <div key={gradCapsKey} style={{ position: "fixed", inset: 0, zIndex: 9500, pointerEvents: "none", overflow: "hidden" }}>
          <style>{`
            @keyframes gradCapFall{
              0%{transform:translateY(-60px) rotate(-20deg);opacity:0}
              8%{opacity:1}
              100%{transform:translateY(110vh) rotate(340deg);opacity:0.9}
            }
            @keyframes gradCapSway{0%,100%{margin-left:0}50%{margin-left:26px}}
          `}</style>
          {Array.from({ length: 26 }, (_, i) => {
            const left = ((i * 37 + i * i * 1.3) % 96) + 2;
            const dur = 2.6 + (i % 5) * 0.45;
            const delay = (i % 8) * 0.22;
            const size = 22 + (i % 4) * 8;
            const esEstrella = i % 5 === 4;
            return (
              <span key={i} style={{
                position: "absolute", top: -50, left: `${left}%`,
                fontSize: size, lineHeight: 1,
                animation: `gradCapFall ${dur}s ${delay}s cubic-bezier(.3,.4,.6,1) forwards, gradCapSway ${1.4 + (i % 3) * 0.4}s ease-in-out infinite`,
                filter: "drop-shadow(0 3px 6px rgba(30,27,75,0.35))",
              }}>{esEstrella ? "⭐" : "🎓"}</span>
            );
          })}
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
              {evento.tipo === "graduacion" && (
                <button
                  onClick={compartirStory}
                  disabled={generandoStory}
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg,#7c3aed 0%,#db2777 55%,#f59e0b 100%)",
                    color: "white", border: "none", borderRadius: 14, padding: "14px",
                    fontFamily: "inherit", fontSize: 14, fontWeight: 700,
                    cursor: generandoStory ? "wait" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: "0 6px 20px rgba(219,39,119,0.35)",
                    opacity: generandoStory ? 0.7 : 1,
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5"/>
                    <circle cx="12" cy="12" r="4.5"/>
                    <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
                  </svg>
                  {generandoStory ? "Generando..." : "Versión para Instagram Stories"}
                </button>
              )}
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
              <div className="topbar-name">Evorix</div>
              <div className="topbar-sub">Invitaciones digitales</div>
            </div>
          </div>
        </div>

        {/* ─── VISTA ─── */}
        {step === "vista" && (
          <div className="wrap wrap-has-bar">
            <div className="inv-card" style={{ position: "relative" }}>

              {/* Elementos flotantes animados — detrás de todo (z-index 0) */}
              <FloatingDecor tipo={evento.tipo} />

              {/* ── HERO: foto limpia sin texto encima ── */}
              {evento.imagen_url ? (
                <div className="inv-hero" style={{ position:"relative", overflow:"hidden", borderRadius:"0 0 28px 28px" }}>
                  {/* Imagen con zoom sutil */}
                  <img
                    src={evento.imagen_url}
                    className="inv-hero-foto"
                    alt={evento.nombre}
                    style={{ width:"100%", display:"block", maxHeight:400, objectFit:"cover", objectPosition:"center top", transform:"scale(1.03)" }}
                  />

                  {/* Vignette general siempre */}
                  <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.35) 100%)", pointerEvents:"none" }}/>

                  {/* Degradado inferior para texto */}
                  <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"55%", background:"linear-gradient(to top, rgba(10,10,30,0.82) 0%, transparent 100%)", pointerEvents:"none" }}/>

                  {/* Nombre del evento sobre la foto */}
                  <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"18px 20px 20px", pointerEvents:"none" }}>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:"white", lineHeight:1.2, textShadow:"0 2px 12px rgba(0,0,0,0.5)", marginBottom:4 }}>
                      {evento.nombre}
                    </div>
                    {evento.anfitriones && (
                      <div style={{ fontSize:12, color:"rgba(255,255,255,0.82)", fontWeight:500, textShadow:"0 1px 6px rgba(0,0,0,0.4)" }}>
                        {evento.anfitriones}
                      </div>
                    )}
                  </div>

                  {/* Marco decorativo tipo según evento */}
                  {evento.tipo === "graduacion" && (
                    <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
                      {/* Borde dorado top */}
                      <div style={{ position:"absolute", top:0, left:0, right:0, height:4, background:"linear-gradient(90deg,transparent,#F59E0B,#FCD34D,#F59E0B,transparent)" }}/>
                      {/* Birretes animados izquierda */}
                      {[{t:"8%",s:26,o:0.7,r:-18},{t:"42%",s:20,o:0.55,r:-12},{t:"72%",s:24,o:0.65,r:-20}].map((c,i)=>(
                        <div key={i} style={{position:"absolute",left:8,top:c.t,opacity:c.o,transform:`rotate(${c.r}deg)`}}>
                          <svg width={c.s} height={c.s} viewBox="0 0 32 28" fill="none">
                            <path d="M2 16 L16 8 L30 14 L16 20 Z" fill="#F59E0B"/>
                            <rect x="11" y="18" width="10" height="8" rx="3" fill="#D97706"/>
                            <line x1="24" y1="13" x2="28" y2="20" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round"/>
                            <circle cx="28" cy="21" r="2.5" fill="#FCD34D"/>
                          </svg>
                        </div>
                      ))}
                      {/* Birretes derecha */}
                      {[{t:"5%",s:24,o:0.65,r:18},{t:"38%",s:20,o:0.55,r:14},{t:"68%",s:26,o:0.7,r:20}].map((c,i)=>(
                        <div key={i} style={{position:"absolute",right:8,top:c.t,opacity:c.o,transform:`rotate(${c.r}deg)`}}>
                          <svg width={c.s} height={c.s} viewBox="0 0 32 28" fill="none">
                            <path d="M2 16 L16 8 L30 14 L16 20 Z" fill="#F59E0B"/>
                            <rect x="11" y="18" width="10" height="8" rx="3" fill="#D97706"/>
                            <line x1="24" y1="13" x2="28" y2="20" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round"/>
                            <circle cx="28" cy="21" r="2.5" fill="#FCD34D"/>
                          </svg>
                        </div>
                      ))}
                      {/* Estrellas esquinas */}
                      {[{l:"18%",t:"10%"},{r:"16%",t:"12%"},{l:"10%",b:"30%"},{r:"10%",b:"32%"}].map((pos,i)=>(
                        <div key={i} style={{position:"absolute",...pos as React.CSSProperties,opacity:0.75}}>
                          <svg width="12" height="12" viewBox="0 0 20 20"><path d="M10 1l2.4 6.6H20l-5.7 4.1 2.2 6.7L10 14.5l-6.5 3.9 2.2-6.7L0 7.6h7.6z" fill="#FCD34D"/></svg>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Para otros tipos: frame morado elegante */}
                  {evento.tipo !== "graduacion" && (
                    <div style={{ position:"absolute", inset:0, pointerEvents:"none", border:"3px solid rgba(79,70,229,0.25)", borderRadius:"0 0 28px 28px" }}/>
                  )}
                </div>
              ) : (
                <div className="inv-hero-bg" style={{ minHeight: 160, background: "linear-gradient(160deg,var(--dark) 0%,var(--dark2) 100%)" }} />
              )}

              {/* ── Tipo, decoración, nombre invitado, anfitriones — TODO DEBAJO de la foto ── */}
              <div style={{ textAlign: "center", padding: "24px 22px 10px", background: "var(--cream)", borderBottom: "1px solid var(--border)", position: "relative" }}>
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

                {/* Frase opcional — con efecto máquina de escribir en graduación */}
                {evento.frase_evento && (
                  evento.tipo === "graduacion" ? (
                    <TypewriterFrase texto={evento.frase_evento} />
                  ) : (
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontStyle: "italic", color: "var(--ink2)", marginTop: 14, lineHeight: 1.6, padding: "0 8px" }}>
                      ❝ {evento.frase_evento} ❞
                    </div>
                  )
                )}
              </div>

              <div className="inv-body">
                {/* 1️⃣ Música — autoplay, siempre arriba */}
                {evento.musica_url && (
                  <MusicPlayer url={evento.musica_url} nombre={evento.musica_nombre} />
                )}

                {/* Carrusel de fotos del graduado — solo graduación */}
                {evento.tipo === "graduacion" && Array.isArray(evento.fotos_carrusel) && evento.fotos_carrusel.length > 0 && (
                  <CarruselGrad fotos={evento.fotos_carrusel} />
                )}

                {/* Cuenta regresiva — solo graduación */}
                {evento.tipo === "graduacion" && evento.fecha && (
                  <CountdownGrad fecha={evento.fecha} hora={evento.hora} />
                )}

                {/* Contador de confirmados en vivo — solo graduación */}
                {evento.tipo === "graduacion" && (totalConfirmados ?? 0) >= 2 && (
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    margin: "10px 0 2px", padding: "10px 14px",
                    background: "linear-gradient(135deg,#FFFBEB,#FEF3C7)",
                    border: "1.5px solid rgba(217,119,6,0.35)",
                    borderRadius: 14,
                  }}>
                    <span style={{ position: "relative", display: "inline-flex", width: 9, height: 9 }}>
                      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#16a34a", animation: "cdPulseSeg 1.6s ease-in-out infinite" }} />
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#92400E" }}>
                      🎓 {totalConfirmados} personas ya confirmaron su asistencia
                    </span>
                  </div>
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

                {/* ⏱ Cuenta regresiva genérica (graduación ya tiene la suya dorada) */}
                {evento.fecha && evento.tipo !== "graduacion" && <CountdownTimer fecha={evento.fecha} hora={evento.hora} />}

                {/* 📍 Google Maps — botón principal */}
                {evento.maps_url && (
                  <a
                    href={evento.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display:"flex", alignItems:"center", gap:12,
                      background:"white", border:"1.5px solid rgba(79,70,229,0.22)",
                      borderRadius:14, padding:"14px 16px", textDecoration:"none",
                      color:"var(--ink2)", transition:"all .18s",
                      boxShadow:"0 2px 10px rgba(79,70,229,0.08)",
                    }}
                  >
                    <div style={{ width:40, height:40, borderRadius:10, background:"#EEF2FF", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 2a6 6 0 016 6c0 5-6 10-6 10S4 13 4 8a6 6 0 016-6z" fill="#4F46E5" opacity="0.2"/>
                        <path d="M10 2a6 6 0 016 6c0 5-6 10-6 10S4 13 4 8a6 6 0 016-6z" stroke="#4F46E5" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
                        <circle cx="10" cy="8" r="2.2" fill="#4F46E5"/>
                      </svg>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:2 }}>
                        {evento.lugar || "Ver ubicación"}
                      </div>
                      {evento.como_llegar && (
                        <div style={{ fontSize:11, color:"var(--ink3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {evento.como_llegar}
                        </div>
                      )}
                      <div style={{ fontSize:10, color:"#4F46E5", fontWeight:600, marginTop:2 }}>
                        Abrir en Google Maps →
                      </div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="#4F46E5" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M5 10h10M13 7l3 3-3 3"/>
                    </svg>
                  </a>
                )}

                {/* 📍 Solo instrucciones si no hay maps_url */}
                {!evento.maps_url && evento.como_llegar && (
                  <div className="como-llegar-box">
                    <div className="como-llegar-label">Instrucciones para llegar</div>
                    <p className="como-llegar-text">{evento.como_llegar}</p>
                  </div>
                )}

                {/* 🗺️ Cómo llegar rápido (graduación): Google Maps + Waze aunque no haya maps_url */}
                {evento.tipo === "graduacion" && (evento.maps_url || evento.lugar) && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <a
                      href={evento.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evento.lugar || "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: "linear-gradient(135deg,#FFFBEB,#FEF3C7)", border: "1.5px solid rgba(217,119,6,0.35)", borderRadius: 13, padding: "12px 8px", textDecoration: "none", fontSize: 12.5, fontWeight: 700, color: "#92400E" }}
                    >
                      <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M10 2a6 6 0 016 6c0 5-6 10-6 10S4 13 4 8a6 6 0 016-6z" stroke="#92400E" strokeWidth="1.6" fill="rgba(217,119,6,0.18)"/><circle cx="10" cy="8" r="2.2" fill="#92400E"/></svg>
                      Google Maps
                    </a>
                    <a
                      href={`https://waze.com/ul?q=${encodeURIComponent(evento.lugar || "")}&navigate=yes`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: "linear-gradient(135deg,#FFFBEB,#FEF3C7)", border: "1.5px solid rgba(217,119,6,0.35)", borderRadius: 13, padding: "12px 8px", textDecoration: "none", fontSize: 12.5, fontWeight: 700, color: "#92400E" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c5 0 9 3.6 9 8 0 3.2-2.1 5.9-5.2 7.2.1.4.2.9.2 1.3 0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5c0-.2 0-.4.1-.6h-1.4c0 .2.1.4.1.6 0 .8-.7 1.5-1.5 1.5S8 20.3 8 19.5c0-.5.1-.9.3-1.3C5.2 16.9 3 14.3 3 11c0-4.4 4-8 9-8z"/><circle cx="9.5" cy="10" r=".8" fill="#92400E"/><circle cx="14.5" cy="10" r=".8" fill="#92400E"/><path d="M9.5 13.5c.7.7 1.6 1 2.5 1s1.8-.3 2.5-1"/></svg>
                      Waze
                    </a>
                  </div>
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

                {/* 📸 Vista previa del muro en vivo — solo graduación */}
                {evento.tipo === "graduacion" && muroPreview && muroPreview.total > 0 && (
                  <div
                    onClick={() => window.open(`/muro/${invitado.evento_id}?token=${invitado.token}`, "_blank")}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                      background: "linear-gradient(135deg,#1e1b4b,#312e81)",
                      border: "1.5px solid rgba(252,211,77,0.40)",
                      borderRadius: 16, padding: "14px 16px",
                      boxShadow: "0 8px 24px rgba(30,27,75,0.30)",
                    }}
                  >
                    {/* Miniaturas superpuestas */}
                    <div style={{ display: "flex", flexShrink: 0 }}>
                      {muroPreview.urls.map((u, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={u + i}
                          src={u}
                          alt=""
                          style={{
                            width: 42, height: 42, borderRadius: "50%", objectFit: "cover",
                            border: "2px solid #FCD34D",
                            marginLeft: i > 0 ? -14 : 0,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                          }}
                        />
                      ))}
                      {muroPreview.total > 3 && (
                        <div style={{ width: 42, height: 42, borderRadius: "50%", marginLeft: -14, background: "rgba(252,211,77,0.9)", border: "2px solid #FCD34D", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#78350F" }}>
                          +{muroPreview.total - 3}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>
                        Ya hay {muroPreview.total} foto{muroPreview.total !== 1 ? "s" : ""} en el muro 📸
                      </div>
                      <div style={{ fontSize: 11, color: "#FDE68A", marginTop: 2 }}>
                        Mirá los momentos que ya compartieron →
                      </div>
                    </div>
                  </div>
                )}

                {/* ✍️ Firma del graduado — cierre emotivo */}
                {evento.tipo === "graduacion" && evento.anfitriones && (
                  <div style={{ textAlign: "center", padding: "16px 0 4px" }}>
                    <div style={{ fontSize: 14, fontStyle: "italic", color: "var(--ink2)", fontFamily: "'Cormorant Garamond',serif", marginBottom: 8 }}>
                      Será un honor contar con tu presencia,
                    </div>
                    <div style={{
                      fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontStyle: "italic", fontWeight: 600,
                      lineHeight: 1.1, display: "inline-block", transform: "rotate(-3deg)",
                      background: "linear-gradient(90deg,#92400E,#D97706 50%,#92400E)",
                      WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
                      padding: "0 10px",
                    }}>
                      {evento.anfitriones}
                    </div>
                    <div style={{ width: 130, height: 1.5, margin: "10px auto 0", background: "linear-gradient(90deg,transparent,#D97706,transparent)" }} />
                    <div style={{ fontSize: 17, marginTop: 8 }}>🎓</div>
                  </div>
                )}

                <OrnamentoDivider tipo={evento.tipo} />
              </div>
            </div>

            {/* ── Barra de decisión sticky en mobile — siempre visible ── */}
            <div className="decision-bar">
              <div className="decision-bar-inner">
                <p className="decision-bar-label">¿Podrás asistir?</p>
                <div className="decision-bar-btns">
                  <button className="btn-no" onClick={rechazarAsistencia}>
                    No podré
                  </button>
                  <button
                    className="btn-si"
                    onClick={handleConfirmarClick}
                    disabled={confirmando}
                  >
                    {confirmando ? "Confirmando..." : "✓ Confirmar asistencia"}
                  </button>
                </div>
              </div>
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
                {invitado.numero_confirmacion && evento.tipo === "graduacion" ? (
                  /* ── Medalla dorada con el número de confirmado (graduación) ── */
                  <div style={{ textAlign: "center", padding: "6px 0 2px" }}>
                    <style>{`
                      @keyframes medalDrop{0%{opacity:0;transform:translateY(-26px) scale(.7)}60%{opacity:1;transform:translateY(4px) scale(1.05)}100%{opacity:1;transform:translateY(0) scale(1)}}
                      @keyframes medalShine{0%{transform:translateX(-150%) rotate(20deg)}100%{transform:translateX(250%) rotate(20deg)}}
                    `}</style>
                    <div style={{ position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center", animation: "medalDrop .7s .2s cubic-bezier(.34,1.4,.5,1) both" }}>
                      {/* Cinta */}
                      <div style={{ display: "flex", gap: 2, marginBottom: -8, zIndex: 0 }}>
                        <div style={{ width: 16, height: 34, background: "linear-gradient(180deg,#1e1b4b,#312e81)", transform: "skewX(12deg)", borderRadius: "3px 3px 0 0" }} />
                        <div style={{ width: 16, height: 34, background: "linear-gradient(180deg,#B45309,#F59E0B)", transform: "skewX(-12deg)", borderRadius: "3px 3px 0 0" }} />
                      </div>
                      {/* Medalla */}
                      <div style={{
                        position: "relative", zIndex: 1, width: 108, height: 108, borderRadius: "50%",
                        background: "radial-gradient(circle at 32% 28%,#FDE68A,#F59E0B 55%,#B45309)",
                        border: "3px solid #92400E",
                        boxShadow: "0 12px 30px rgba(146,64,14,0.40), inset 0 2px 8px rgba(255,255,255,0.45)",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        overflow: "hidden",
                      }}>
                        <div style={{ position: "absolute", top: 0, bottom: 0, width: "36%", background: "linear-gradient(105deg,transparent,rgba(255,255,255,0.5),transparent)", animation: "medalShine 3.2s 1s ease-in-out infinite" }} />
                        <span style={{ fontSize: 20, lineHeight: 1 }}>🎓</span>
                        <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: 1.4, color: "#78350F", margin: "3px 0 1px" }}>INVITADO N°</span>
                        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 30, fontWeight: 700, lineHeight: 1, color: "#78350F" }}>
                          {String(invitado.numero_confirmacion).padStart(3, "0")}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--ink3)", fontWeight: 600, marginTop: 10, letterSpacing: 0.4 }}>
                      Sos el invitado confirmado N° {invitado.numero_confirmacion} 🎉
                    </div>
                  </div>
                ) : invitado.numero_confirmacion ? (
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
                ) : null}

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
                        <div style={{ flex: 1 }}>
                          <div className="mesa-picker-title">Elige tu lugar</div>
                          <div className="mesa-picker-sub">Seleccioná una mesa disponible</div>
                        </div>
                        {evento.plano_mesas_url && (
                          <PlanoMesasBtn url={evento.plano_mesas_url!} />
                        )}
                      </div>
                      <div className="mesa-list">
                        {mesasDisponibles.map((m) => {
                          const libre = m.capacidad - m.ocupados;
                          const llena = libre <= 0;
                          const pct = Math.min(100, Math.round((m.ocupados / m.capacidad) * 100));
                          return (
                            <div
                              key={m.id}
                              className={`mesa-row${llena ? " mesa-row--full" : ""}${asignandoMesa ? " mesa-row--loading" : ""}`}
                              onClick={() => !llena && !asignandoMesa && elegirMesa(m.id, m.nombre)}
                            >
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                                  <span className="mesa-row-name">{m.nombre}</span>
                                  <span className={`mesa-row-badge${llena ? " mesa-row-badge--full" : " mesa-row-badge--free"}`}>
                                    {llena ? "Llena" : `${libre} libre${libre !== 1 ? "s" : ""}`}
                                  </span>
                                </div>
                                {/* Barra de capacidad */}
                                <div style={{ height: 5, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: llena ? "#9CA3AF" : "var(--gold)", transition: "width .4s" }} />
                                </div>
                                <div style={{ fontSize: 10, color: "var(--ink3)", marginTop: 3 }}>
                                  {m.ocupados} de {m.capacidad} lugares ocupados
                                </div>
                              </div>
                              {!llena && (
                                <svg className="mesa-row-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                              )}
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

                {/* ── Subir fotos inline ── */}
                <SubirFotosInvitado
                  invitadoId={invitado.id}
                  eventoId={invitado.evento_id}
                  token={token}
                  onMostrarDeseo={() => setShowDeseoForm(true)}
                />

                {/* ── Escribir deseo ── */}
                {showDeseoForm && !deseoPublicado && (
                  <DeseoFormInline
                    invitadoId={invitado.id}
                    eventoId={invitado.evento_id}
                    invitadoNombre={invitado.nombre}
                    onPublicado={() => {
                      setDeseoPublicado(true);
                    }}
                  />
                )}
                {deseoPublicado && (
                  <div style={{ background: "linear-gradient(135deg,#EEF2FF,#E0E7FF)", border: "1.5px solid rgba(79,70,229,0.22)", borderRadius: 18, padding: "18px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>💌</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontStyle: "italic", color: "#3730A3", marginBottom: 6 }}>¡Tu deseo fue publicado!</div>
                    <div style={{ fontSize: 12, color: "#6366F1" }}>Ya aparece en el muro del evento para que todos lo vean.</div>
                  </div>
                )}
                {!showDeseoForm && !deseoPublicado && (
                  <button
                    className="btn-accion-full"
                    onClick={() => setShowDeseoForm(true)}
                  >
                    <div className="btn-accion-ico">
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                        <path d="M3 4h14a1 1 0 011 1v8a1 1 0 01-1 1H6l-4 3V5a1 1 0 011-1z"/>
                      </svg>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1, textAlign: "left" }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Escribir mi deseo</span>
                      <span style={{ fontSize: 11, opacity: 0.65 }}>Un mensaje especial para los anfitriones</span>
                    </div>
                    <svg style={{ marginLeft: "auto", flexShrink: 0, opacity: 0.4 }} width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M7 5l5 5-5 5"/></svg>
                  </button>
                )}

                {/* ── Guardar en Google Calendar ── */}
                {evento.fecha && (
                  <button
                    className="btn-accion-full"
                    onClick={() => abrirGoogleCalendar(evento)}
                  >
                    <div className="btn-accion-ico">
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                        <rect x="2" y="3" width="16" height="15" rx="2"/>
                        <path d="M2 8h16M7 1v4M13 1v4"/>
                      </svg>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1, textAlign: "left" }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Guardar en Google Calendar</span>
                      <span style={{ fontSize: 11, opacity: 0.65 }}>No olvides el evento</span>
                    </div>
                    <svg style={{ marginLeft: "auto", flexShrink: 0, opacity: 0.4 }} width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M7 5l5 5-5 5"/></svg>
                  </button>
                )}

                {/* ── Ver muro de fotos ── */}
                <button
                  className="btn-accion-full"
                  onClick={() => window.open(`/muro/${invitado.evento_id}?token=${invitado.token}`, "_blank")}
                >
                  <div className="btn-accion-ico">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                      <rect x="2" y="2" width="7" height="7" rx="1"/>
                      <rect x="11" y="2" width="7" height="7" rx="1"/>
                      <rect x="2" y="11" width="7" height="7" rx="1"/>
                      <rect x="11" y="11" width="7" height="7" rx="1"/>
                    </svg>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 1, textAlign: "left" }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Ver muro de fotos del evento</span>
                    <span style={{ fontSize: 11, opacity: 0.65 }}>Mirá las fotos que subieron los demás</span>
                  </div>
                  <svg style={{ marginLeft: "auto", flexShrink: 0, opacity: 0.4 }} width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M7 5l5 5-5 5"/></svg>
                </button>

                {/* ── Agendar en el calendario (.ics con recordatorios) ── */}
                {evento.fecha && (
                  <>
                    <button
                      className="btn-accion-full"
                      onClick={() => descargarICS(evento)}
                    >
                      <div className="btn-accion-ico">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                          <path d="M9 15l2 2 4-4"/>
                        </svg>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 1, textAlign: "left" }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>Agendar en mi calendario</span>
                        <span style={{ fontSize: 11, opacity: 0.65 }}>Con recordatorio automático un día antes</span>
                      </div>
                      <svg style={{ marginLeft: "auto", flexShrink: 0, opacity: 0.4 }} width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M7 5l5 5-5 5"/></svg>
                    </button>
                    <button
                      onClick={() => abrirGoogleCalendar(evento)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 600, color: "#4F46E5", textDecoration: "underline", padding: "0 0 4px", fontFamily: "inherit", marginTop: -6 }}
                    >
                      o abrir directo en Google Calendar
                    </button>
                  </>
                )}

                {/* ── Ramo a las Solteras (solo bodas) ── */}
                {evento.tipo === "boda" && (
                  <button
                    className="btn-accion-full"
                    style={{ background: "linear-gradient(135deg,#fce7f3,#fdf2f8)", border: "1.5px solid rgba(249,168,212,0.45)" }}
                    onClick={() => window.open(`/muro/${invitado.evento_id}?token=${invitado.token}`, "_blank")}
                  >
                    <div className="btn-accion-ico" style={{ background: "rgba(236,72,153,0.10)" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#be185d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="7" r="3"/><circle cx="6.5" cy="12" r="2.5"/><circle cx="17.5" cy="12" r="2.5"/>
                        <circle cx="9" cy="17.5" r="2.5"/><circle cx="15" cy="17.5" r="2.5"/>
                        <line x1="12" y1="10" x2="12" y2="13"/>
                      </svg>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1, textAlign: "left" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#9d174d" }}>💐 Ramo a las Solteras</span>
                      <span style={{ fontSize: 11, opacity: 0.65, color: "#be185d" }}>¡Participa en la rifa del ramo!</span>
                    </div>
                    <svg style={{ marginLeft: "auto", flexShrink: 0, opacity: 0.4 }} width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M7 5l5 5-5 5"/></svg>
                  </button>
                )}

                {/* ── Listo, cerrar ── */}
                <button className="btn-cerrar" onClick={confirmarYCerrar}>
                  <div className="btn-accion-ico">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                      <path d="M17 5L8 14l-4-4"/>
                    </svg>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 1, textAlign: "left" }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Listo, cerrar esta ventana</span>
                    <span style={{ fontSize: 11, opacity: 0.65 }}>Todo quedó guardado</span>
                  </div>
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

      {/* ─── Ficha Evorix (se muestra al cerrar la tarjeta) ─── */}
      {showEvorixPromo && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "#FFFFFF",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "48px 16px 32px",
          overflow: "hidden",
        }}>
          <style>{`
            @keyframes fadeInPromo { from{opacity:0;transform:translateY(20px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
            @keyframes promoGlow1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-18px,28px) scale(1.07)} 66%{transform:translate(14px,-18px) scale(0.95)} }
            @keyframes promoGlow2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(22px,-30px) scale(1.09)} 70%{transform:translate(-8px,18px) scale(0.93)} }
            @keyframes promoRingExp { 0%{transform:scale(0.82);opacity:.7} 100%{transform:scale(2.0);opacity:0} }
            @keyframes promoLogoPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
            @keyframes promoMountLogo { from{opacity:0;transform:translateY(28px) scale(0.92)} to{opacity:1;transform:translateY(0) scale(1)} }
            @keyframes promoMountCard { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
            @keyframes promoMountFoot { from{opacity:0} to{opacity:1} }
            @keyframes promoShimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
            .promo-glow { position:absolute;pointer-events:none;border-radius:50%;filter:blur(90px) }
            .promo-glow-1 { width:280px;height:280px;top:-60px;right:-40px;background:radial-gradient(circle,rgba(79,70,229,0.13) 0%,transparent 70%);animation:promoGlow1 9s ease-in-out infinite }
            .promo-glow-2 { width:220px;height:220px;bottom:60px;left:-60px;background:radial-gradient(circle,rgba(129,140,248,0.10) 0%,transparent 70%);animation:promoGlow2 11s ease-in-out infinite }
            .promo-glow-3 { width:180px;height:180px;bottom:-30px;right:10px;background:radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%);animation:promoGlow1 13s ease-in-out infinite reverse }
            .promo-logo-ring { position:absolute;border-radius:50%;border:1.5px solid rgba(79,70,229,0.18);animation:promoRingExp 3s ease-out infinite;width:68px;height:68px }
            .promo-logo-ring-2 { animation-delay:1s }
            .promo-logo-ring-3 { animation-delay:2s }
            .promo-logo-pulse { position:relative;z-index:2;animation:promoLogoPulse 3.5s ease-in-out infinite;filter:drop-shadow(0 4px 20px rgba(79,70,229,0.20)) }
            .promo-logo-name { font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:600;letter-spacing:-1.2px;color:#0F172A;line-height:1;text-align:center }
            .promo-logo-name span { color:#4F46E5 }
            .promo-logo-tag { font-size:10px;font-weight:500;letter-spacing:2px;text-transform:uppercase;color:#64748B;margin-top:3px;text-align:center }
            .promo-card-box { background:#FFFFFF;border:1.5px solid #E5E7F0;border-radius:24px;padding:28px 24px;box-shadow:0 14px 40px -10px rgba(15,23,42,0.10);width:100%;max-width:380px }
            .promo-feat-row { display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;background:rgba(79,70,229,0.06);border:1px solid #E5E7F0;margin-bottom:8px }
            .promo-feat-ic { width:34px;height:34px;border-radius:10px;background:#EEF2FF;display:flex;align-items:center;justify-content:center;color:#4F46E5;flex-shrink:0;font-size:15px }
            .promo-feat-lbl { font-size:13px;font-weight:600;color:#0F172A;line-height:1.25 }
            .promo-feat-desc { font-size:11.5px;color:#64748B;line-height:1.35 }
            .promo-btn-main { width:100%;padding:15px;border-radius:14px;border:none;background:linear-gradient(135deg,#4F46E5,#3730A3);color:#fff;font-size:15px;font-weight:600;font-family:'DM Sans',sans-serif;letter-spacing:.3px;cursor:pointer;margin-top:4px;box-shadow:0 10px 30px -6px rgba(79,70,229,0.38),0 4px 12px rgba(79,70,229,0.18);transition:transform .2s,box-shadow .2s;position:relative;overflow:hidden;min-height:50px;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:10px }
            .promo-btn-main:hover { transform:translateY(-2px);box-shadow:0 10px 34px rgba(79,70,229,0.28) }
            .promo-btn-main:active { transform:scale(0.97) }
            .promo-btn-shimmer { position:absolute;inset:0;border-radius:inherit;background:linear-gradient(105deg,transparent 38%,rgba(255,255,255,0.22) 50%,transparent 62%);background-size:200% 100%;animation:promoShimmer 3.5s ease-in-out infinite }
            .promo-btn-sec { width:100%;padding:12px;border:1.5px solid #E5E7F0;border-radius:14px;background:transparent;color:#64748B;font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:color .2s,border-color .2s }
            .promo-btn-sec:hover { color:#4F46E5;border-color:rgba(79,70,229,0.3) }
            .promo-wrap-logo { animation:promoMountLogo .7s cubic-bezier(.22,1,.36,1) .1s both }
            .promo-wrap-card { animation:promoMountCard .6s cubic-bezier(.22,1,.36,1) .26s both }
            .promo-wrap-foot { animation:promoMountFoot .5s cubic-bezier(.22,1,.36,1) .42s both }
          `}</style>

          {/* Glows animados */}
          <div className="promo-glow promo-glow-1" />
          <div className="promo-glow promo-glow-2" />
          <div className="promo-glow promo-glow-3" />

          <div style={{ width: "100%", maxWidth: 380, position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>

            {/* Logo área */}
            <div className="promo-wrap-logo" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 80, height: 80 }}>
                <div className="promo-logo-ring" />
                <div className="promo-logo-ring promo-logo-ring-2" />
                <div className="promo-logo-ring promo-logo-ring-3" />
                <div className="promo-logo-pulse"><AppLogo size={58} /></div>
              </div>
              <div>
                <div className="promo-logo-name">Evori<span>x</span></div>
                <div className="promo-logo-tag">Invitaciones · Fotos · Recuerdos</div>
              </div>
            </div>

            {/* Card */}
            <div className="promo-card-box promo-wrap-card">
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 600, color: "#0F172A", marginBottom: 4, letterSpacing: "-0.3px" }}>
                ¡Creá tu propio evento!
              </div>
              <p style={{ fontSize: 13, color: "#64748B", marginBottom: 20, lineHeight: 1.55 }}>
                Gestiona invitaciones digitales elegantes, recibí confirmaciones y conservá cada recuerdo.
              </p>

              <div className="promo-feat-row">
                <div className="promo-feat-ic">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                      <rect x="2" y="4" width="16" height="13" rx="2"/>
                      <path d="M2 7l8 5 8-5"/>
                    </svg>
                  </div>
                <div>
                  <div className="promo-feat-lbl">Invitaciones por WhatsApp</div>
                  <div className="promo-feat-desc">Personalizadas y con confirmación en un toque</div>
                </div>
              </div>
              <div className="promo-feat-row">
                <div className="promo-feat-ic">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 7a2 2 0 012-2h1.2l1.6-2h6.4l1.6 2H16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V7z"/>
                      <circle cx="10" cy="11" r="2.5"/>
                    </svg>
                  </div>
                <div>
                  <div className="promo-feat-lbl">Muro de fotos en vivo</div>
                  <div className="promo-feat-desc">Todas las fotos del evento, en tiempo real</div>
                </div>
              </div>
              <div className="promo-feat-row" style={{ marginBottom: 20 }}>
                <div className="promo-feat-ic">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                      <rect x="2" y="2" width="6" height="6" rx="1"/>
                      <rect x="12" y="2" width="6" height="6" rx="1"/>
                      <rect x="2" y="12" width="6" height="6" rx="1"/>
                      <path d="M12 12h6v6h-6z"/>
                    </svg>
                  </div>
                <div>
                  <div className="promo-feat-lbl">Mesas y QR de entrada</div>
                  <div className="promo-feat-desc">Asignación y registro de asistentes</div>
                </div>
              </div>

              <button className="promo-btn-main" onClick={() => window.location.href = "/"}>
                <span className="promo-btn-shimmer" />
                Crear mi evento gratis
              </button>
              <button className="promo-btn-sec" onClick={() => { window.close(); setTimeout(() => { window.location.href = "whatsapp://"; }, 200); }}>
                Cerrar
              </button>
            </div>

            {/* Footer */}
            <div className="promo-wrap-foot" style={{ textAlign: "center", marginTop: 16, opacity: 0.55 }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1.8px", textTransform: "uppercase", color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}>
                Humb3rsec 2026
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
