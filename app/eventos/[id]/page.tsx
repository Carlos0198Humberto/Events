"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
type Invitado = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  estado: string;
  num_personas: number;
  token: string;
  nombres_personas?: string; // JSON array de nombres extra
};

type Evento = {
  id: string;
  nombre: string;
  tipo: string;
  anfitriones: string;
  frase_evento?: string;
  mensaje_invitacion?: string;
  fecha?: string;
  hora?: string;
  lugar?: string;
  maps_url?: string;
  imagen_url?: string;
  foto_lugar_url?: string;
  musica_url?: string;
  musica_nombre?: string;
  video_lugar_url?: string;
  cupo_personas?: number;
  fecha_limite_confirmacion?: string;
};

// ─── Logo ─────────────────────────────────────────────────────────────────────
function AppLogo({ size = 34 }: { size?: number }) {
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
          id="evx-bg-inv"
          x1="0"
          y1="0"
          x2="64"
          y2="64"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#0F766E" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
        <linearGradient
          id="evx-glow-inv"
          x1="12"
          y1="20"
          x2="52"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#5EEAD4" />
          <stop offset="100%" stopColor="#2DD4BF" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#evx-bg-inv)" />
      <rect
        x="2.5"
        y="2.5"
        width="59"
        height="59"
        rx="16"
        fill="none"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="1.5"
      />
      <path
        d="M18 17 L30 32 L18 47"
        stroke="url(#evx-glow-inv)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M46 17 L34 32 L46 47"
        stroke="rgba(255,255,255,0.38)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="32" cy="32" r="4" fill="white" opacity="0.95" />
      <circle cx="17" cy="13" r="2" fill="#5EEAD4" opacity="0.8" />
      <circle cx="47" cy="13" r="1.5" fill="#5EEAD4" opacity="0.5" />
      <circle cx="47" cy="51" r="2" fill="#5EEAD4" opacity="0.8" />
      <circle cx="17" cy="51" r="1.5" fill="#5EEAD4" opacity="0.5" />
    </svg>
  );
}

function Particles() {
  return (
    <div className="particles" aria-hidden="true">
      {[...Array(6)].map((_, i) => (
        <div key={i} className={`particle particle-${i + 1}`} />
      ))}
    </div>
  );
}

// ─── Íconos ───────────────────────────────────────────────────────────────────
const Icon = {
  back: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  whatsapp: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  ),
  copy: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  ),
  trash: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4h6v2" />
    </svg>
  ),
  plus: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  search: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  music: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  calendar: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <rect x="2" y="3" width="16" height="15" rx="3" />
      <path d="M2 8h16M7 1v4M13 1v4" />
    </svg>
  ),
  clock: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  location: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M10 2a6 6 0 016 6c0 5-6 10-6 10S4 13 4 8a6 6 0 016-6z" />
      <circle cx="10" cy="8" r="2" />
    </svg>
  ),
  link: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    >
      <path d="M8 11a4 4 0 005.66 0l2-2a4 4 0 000-5.66 4 4 0 00-5.66 0l-1 1" />
      <path d="M12 9a4 4 0 00-5.66 0l-2 2a4 4 0 000 5.66 4 4 0 005.66 0l1-1" />
    </svg>
  ),
  ticket: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 9a3 3 0 010-6h20a3 3 0 010 6" />
      <path d="M2 15a3 3 0 000 6h20a3 3 0 000-6" />
      <path d="M2 9h20M2 15h20" />
    </svg>
  ),
  people: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  check: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  photo: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  heart: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  ),
  wall: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
};

// ─── Traducciones ─────────────────────────────────────────────────────────────
const T = {
  es: {
    invitados: "Invitados",
    atras: "Atrás",
    total: "Total",
    confirmados: "Confirm.",
    declinaron: "Declinaron",
    personas: "Personas",
    agregar: "Agregar invitado",
    nuevoInvitado: "Nuevo invitado",
    nombre: "Nombre completo *",
    telefono: "Teléfono (WhatsApp)",
    email: "Correo electrónico",
    numPersonas: "Número de personas",
    nombresPersonas: "Nombres de las personas (opcional)",
    persona: "Persona",
    cancelar: "Cancelar",
    guardar: "Guardar",
    guardando: "Guardando...",
    buscar: "Buscar por nombre, teléfono o correo...",
    todos: "Todos",
    pendientes: "Pendientes",
    confirmadosFilt: "Confirmados",
    declinaronFilt: "Declinaron",
    sinResultados: "Sin resultados para",
    sinCategoria: "No hay invitados en esta categoría",
    whatsapp: "WhatsApp",
    copiarLink: "Copiar link",
    copiado: "¡Copiado!",
    pendiente: "Pendiente",
    declino: "Declinó",
    eliminar: "Eliminar",
    eliminando: "...",
    invPor: "Con mucho cariño te invitan",
    confirmarAsistencia: "Abrir mi tarjeta de invitación →",
    invitadoEliminado: "Invitado eliminado",
    linkCopiado: "Link copiado al portapapeles",
    tarjeta: "Tarjeta",
    vistaPrevia: "Vista previa de la invitación",
    comoConfirmar: "¿Cómo acceder?",
    paso1: "Abre tu tarjeta de invitación",
    paso2: "Confirma tu asistencia con un clic",
    paso3: "¡Listo! Comparte fotos y escribe en el muro",
    opciones: "Dentro de tu tarjeta encontrarás:",
    opcionConfirmar: "Confirmar asistencia",
    opcionFotos: "Álbum de fotografías",
    opcionMuro: "Deseos y muro del evento",
    fechaLimite: "Confirma antes del",
    musica: "Música del evento",
    lugarDestacado: "Lugar del evento",
    invitados_nombres: "Invitados:",
  },
  en: {
    invitados: "Guests",
    atras: "Back",
    total: "Total",
    confirmados: "Confirmed",
    declinaron: "Declined",
    personas: "People",
    agregar: "Add guest",
    nuevoInvitado: "New guest",
    nombre: "Full name *",
    telefono: "Phone (WhatsApp)",
    email: "Email address",
    numPersonas: "Number of people",
    nombresPersonas: "Names of the people (optional)",
    persona: "Person",
    cancelar: "Cancel",
    guardar: "Save",
    guardando: "Saving...",
    buscar: "Search by name, phone or email...",
    todos: "All",
    pendientes: "Pending",
    confirmadosFilt: "Confirmed",
    declinaronFilt: "Declined",
    sinResultados: "No results for",
    sinCategoria: "No guests in this category",
    whatsapp: "WhatsApp",
    copiarLink: "Copy link",
    copiado: "Copied!",
    pendiente: "Pending",
    declino: "Declined",
    eliminar: "Delete",
    eliminando: "...",
    invPor: "With much love, you are invited by",
    confirmarAsistencia: "Open my invitation card →",
    invitadoEliminado: "Guest removed",
    linkCopiado: "Link copied to clipboard",
    tarjeta: "Card",
    vistaPrevia: "Invitation preview",
    comoConfirmar: "How to access?",
    paso1: "Open your invitation card",
    paso2: "Confirm your attendance with one click",
    paso3: "Done! Share photos and write on the wall",
    opciones: "Inside your card you'll find:",
    opcionConfirmar: "Confirm attendance",
    opcionFotos: "Photo album",
    opcionMuro: "Wishes & event wall",
    fechaLimite: "Confirm before",
    musica: "Event music",
    lugarDestacado: "Event venue",
    invitados_nombres: "Guests:",
  },
};

const TIPO_EMOJI: Record<string, string> = {
  quinceañera: "👑",
  boda: "💍",
  graduacion: "🎓",
  cumpleaños: "🎂",
  otro: "✨",
};

function tokenToCardNumber(token: string): string {
  const suffix = token
    .slice(-8)
    .replace(/[^a-f0-9]/gi, "")
    .slice(-4);
  const num = parseInt(suffix, 16) % 9999;
  return String(num + 1).padStart(4, "0");
}

function formatFecha(fecha: string, lang: "es" | "en") {
  return new Date(fecha).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
    weekday: "long",
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

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, visible }: { msg: string; visible: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? "0" : "70px"})`,
        background: "var(--accent2)",
        color: "#fff",
        padding: "10px 22px",
        borderRadius: 99,
        fontSize: 13,
        fontWeight: 700,
        boxShadow: "0 4px 20px rgba(13,148,136,0.40)",
        transition: "transform .3s ease, opacity .3s ease",
        opacity: visible ? 1 : 0,
        zIndex: 100,
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}
    >
      ✓ {msg}
    </div>
  );
}

// ─── Formulario nuevo invitado (con soporte para múltiples nombres) ────────────
function FormNuevoInvitado({
  eventoId,
  onGuardado,
  t,
}: {
  eventoId: string;
  onGuardado: () => void;
  t: (typeof T)["es"];
}) {
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    email: "",
    num_personas: 1,
  });
  const [nombresExtra, setNombresExtra] = useState<string[]>(["", "", ""]);
  const [guardando, setGuardando] = useState(false);
  const [expandido, setExpandido] = useState(false);

  async function guardar() {
    if (!form.nombre.trim()) return;
    setGuardando(true);

    // Construir array de nombres incluyendo el principal
    const todosNombres = [
      form.nombre.trim(),
      ...nombresExtra.filter((n) => n.trim()),
    ].slice(0, form.num_personas);

    await supabase.from("invitados").insert({
      evento_id: eventoId,
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
      num_personas: form.num_personas,
      estado: "pendiente",
      nombres_personas:
        todosNombres.length > 1 ? JSON.stringify(todosNombres) : null,
    });

    setForm({ nombre: "", telefono: "", email: "", num_personas: 1 });
    setNombresExtra(["", "", ""]);
    setExpandido(false);
    setGuardando(false);
    onGuardado();
  }

  const extraSlots =
    form.num_personas > 1 ? Math.min(form.num_personas - 1, 3) : 0;

  if (!expandido)
    return (
      <button
        onClick={() => setExpandido(true)}
        className="btn-cta"
        type="button"
      >
        <Icon.plus /> {t.agregar}
      </button>
    );

  return (
    <div
      className="section-card"
      style={{ border: "1.5px solid var(--border-mid)" }}
    >
      <p className="section-title">{t.nuevoInvitado}</p>
      <div className="fields-group">
        {[
          {
            key: "nombre",
            label: t.nombre,
            ph: "Ej: María García",
            type: "text",
          },
          {
            key: "telefono",
            label: t.telefono,
            ph: "Ej: +503 7000 0000",
            type: "tel",
          },
          {
            key: "email",
            label: t.email,
            ph: "Ej: maria@correo.com",
            type: "email",
          },
        ].map(({ key, label, ph, type }) => (
          <div key={key}>
            <label className="field-label">{label}</label>
            <input
              className="field-input"
              type={type}
              value={(form as any)[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={ph}
            />
          </div>
        ))}

        {/* Número de personas con counter */}
        <div>
          <label className="field-label">{t.numPersonas}</label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 4,
            }}
          >
            <button
              className="counter-btn"
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  num_personas: Math.max(1, form.num_personas - 1),
                })
              }
            >
              −
            </button>
            <span
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "var(--text)",
                minWidth: 32,
                textAlign: "center",
              }}
            >
              {form.num_personas}
            </span>
            <button
              className="counter-btn"
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  num_personas: Math.min(4, form.num_personas + 1),
                })
              }
            >
              +
            </button>
            <span style={{ fontSize: 11, color: "var(--text3)" }}>máx. 4</span>
          </div>
        </div>

        {/* Nombres adicionales si hay más de 1 persona */}
        {extraSlots > 0 && (
          <div>
            <label className="field-label">{t.nombresPersonas}</label>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 7,
                marginTop: 4,
              }}
            >
              {[...Array(extraSlots)].map((_, i) => (
                <input
                  key={i}
                  className="field-input"
                  type="text"
                  value={nombresExtra[i] || ""}
                  onChange={(e) => {
                    const nuevo = [...nombresExtra];
                    nuevo[i] = e.target.value;
                    setNombresExtra(nuevo);
                  }}
                  placeholder={`${t.persona} ${i + 2}: Ej: Carlos García`}
                />
              ))}
            </div>
            <p style={{ fontSize: 10, color: "var(--text3)", marginTop: 5 }}>
              Estos nombres aparecerán en la tarjeta de invitación
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => setExpandido(false)}
          >
            {t.cancelar}
          </button>
          <button
            className="btn-primary"
            type="button"
            style={{ flex: 2, opacity: form.nombre.trim() ? 1 : 0.5 }}
            onClick={guardar}
            disabled={guardando || !form.nombre.trim()}
          >
            {guardando ? t.guardando : t.guardar}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal tarjeta de invitación (COMPLETA) ───────────────────────────────────
function ModalInvitacion({
  invitado,
  evento,
  onClose,
  onEnviar,
  t,
  lang,
}: {
  invitado: Invitado;
  evento: Evento;
  onClose: () => void;
  onEnviar: () => void;
  t: (typeof T)["es"];
  lang: "es" | "en";
}) {
  const link = `${window.location.origin}/confirmar/${invitado.token}`;
  const emoji = TIPO_EMOJI[evento.tipo] || "✨";
  const cardNumber = tokenToCardNumber(invitado.token);
  const fechaFmt = evento.fecha ? formatFecha(evento.fecha, lang) : null;
  const horaFmt = evento.hora ? formatHora(evento.hora) : null;

  // Nombres de personas en la tarjeta
  let nombresEnTarjeta: string[] = [invitado.nombre];
  if (invitado.nombres_personas) {
    try {
      const parsed = JSON.parse(invitado.nombres_personas);
      if (Array.isArray(parsed) && parsed.length > 1) nombresEnTarjeta = parsed;
    } catch {}
  }

  // Fecha límite formateada
  const fechaLimiteFmt = evento.fecha_limite_confirmacion
    ? formatFecha(evento.fecha_limite_confirmacion, lang)
    : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 99,
            background: "var(--border-mid)",
            margin: "0 auto 18px",
          }}
        />

        <p
          className="section-title"
          style={{ textAlign: "center", marginBottom: 18 }}
        >
          {t.vistaPrevia}
        </p>

        {/* ── TARJETA COMPLETA ── */}
        <div className="inv-card-preview">
          <div className="inv-card-bg" />

          {/* Número de tarjeta */}
          <div className="inv-card-number">
            <Icon.ticket />
            <span>
              {t.tarjeta} #{cardNumber}
            </span>
          </div>

          {/* Header con logo */}
          <div className="inv-card-header">
            <AppLogo size={36} />
            <div>
              <p className="inv-card-appname">Eventix</p>
              <p className="inv-card-appsub">Invitaciones digitales</p>
            </div>
          </div>

          {/* Foto de portada si existe */}
          {evento.imagen_url && (
            <div className="inv-card-cover">
              <img
                src={evento.imagen_url}
                alt={evento.nombre}
                className="inv-card-cover-img"
              />
              <div className="inv-card-cover-overlay" />
            </div>
          )}

          {/* Emoji del tipo */}
          <div className="inv-card-emoji">{emoji}</div>

          {/* Saludo al invitado */}
          <p className="inv-card-guest">
            {nombresEnTarjeta.length > 1
              ? `¡Hola, ${nombresEnTarjeta.slice(0, 2).join(" & ")}${nombresEnTarjeta.length > 2 ? " y más" : ""}!`
              : `¡Hola, ${invitado.nombre}!`}
          </p>

          {/* Quién invita */}
          <p className="inv-card-body">
            <span style={{ color: "var(--text3)", fontSize: 12 }}>
              {t.invPor}
            </span>
            <br />
            <strong style={{ fontSize: 16, color: "var(--text)" }}>
              {evento.anfitriones}
            </strong>
          </p>

          {/* Nombre del evento */}
          <div className="inv-card-event-name">{evento.nombre}</div>

          {/* Frase especial */}
          {evento.frase_evento && (
            <p className="inv-card-frase">❝ {evento.frase_evento} ❞</p>
          )}

          {/* Nombres de todos los invitados en la tarjeta */}
          {nombresEnTarjeta.length > 1 && (
            <div className="inv-card-guests-list">
              <p className="inv-card-guests-title">{t.invitados_nombres}</p>
              {nombresEnTarjeta.map((n, i) => (
                <div key={i} className="inv-card-guest-item">
                  <div className="inv-card-guest-avatar">
                    {n.charAt(0).toUpperCase()}
                  </div>
                  <span>{n}</span>
                </div>
              ))}
            </div>
          )}

          {/* Detalles: fecha, hora, lugar */}
          {(fechaFmt || evento.lugar) && (
            <div className="inv-card-details">
              {fechaFmt && (
                <div className="inv-card-detail-item">
                  <span style={{ color: "var(--accent2)" }}>
                    <Icon.calendar />
                  </span>
                  <span style={{ textTransform: "capitalize" }}>
                    {fechaFmt}
                  </span>
                </div>
              )}
              {horaFmt && (
                <div className="inv-card-detail-item">
                  <span style={{ color: "var(--accent2)" }}>
                    <Icon.clock />
                  </span>
                  <span>{horaFmt}</span>
                </div>
              )}
              {evento.lugar && (
                <div className="inv-card-detail-item">
                  <span style={{ color: "var(--accent2)" }}>
                    <Icon.location />
                  </span>
                  <span>{evento.lugar}</span>
                </div>
              )}
            </div>
          )}

          {/* Foto del lugar */}
          {evento.foto_lugar_url && (
            <div className="inv-card-venue-photo">
              <p className="inv-card-venue-label">{t.lugarDestacado}</p>
              <img
                src={evento.foto_lugar_url}
                alt={evento.lugar || "Lugar"}
                className="inv-card-venue-img"
              />
            </div>
          )}

          {/* Música del evento */}
          {evento.musica_url && (
            <div className="inv-card-music">
              <div className="inv-card-music-icon">
                <Icon.music />
              </div>
              <div className="inv-card-music-info">
                <span className="inv-card-music-label">{t.musica}</span>
                <span className="inv-card-music-name">
                  {evento.musica_nombre || "♫ Canción del evento"}
                </span>
              </div>
              <div className="inv-card-music-wave">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`wave-bar wave-bar-${i + 1}`} />
                ))}
              </div>
            </div>
          )}

          {/* Mensaje personalizado */}
          {evento.mensaje_invitacion && (
            <div className="inv-card-mensaje">
              <p>"{evento.mensaje_invitacion}"</p>
            </div>
          )}

          {/* Fecha límite */}
          {fechaLimiteFmt && (
            <div className="inv-card-deadline">
              <span>⏰</span>
              <span style={{ textTransform: "capitalize" }}>
                {t.fechaLimite}: <strong>{fechaLimiteFmt}</strong>
              </span>
            </div>
          )}

          {/* Opciones disponibles dentro de la tarjeta */}
          <div className="inv-card-options-title">{t.opciones}</div>
          <div className="inv-card-options">
            <div className="inv-card-option">
              <div className="inv-card-option-icon opt-confirm">
                <Icon.check />
              </div>
              <span>{t.opcionConfirmar}</span>
            </div>
            <div className="inv-card-option">
              <div className="inv-card-option-icon opt-photos">
                <Icon.photo />
              </div>
              <span>{t.opcionFotos}</span>
            </div>
            <div className="inv-card-option">
              <div className="inv-card-option-icon opt-wall">
                <Icon.wall />
              </div>
              <span>{t.opcionMuro}</span>
            </div>
          </div>

          {/* Instrucciones breves */}
          <div className="inv-card-steps">
            <p className="inv-card-steps-title">{t.comoConfirmar}</p>
            {[t.paso1, t.paso2, t.paso3].map((paso, i) => (
              <div key={i} className="inv-card-step">
                <div className="inv-card-step-num">{i + 1}</div>
                <span>{paso}</span>
              </div>
            ))}
          </div>

          {/* CTA principal */}
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inv-card-cta"
          >
            <Icon.link /> {t.confirmarAsistencia}
          </a>
          <p className="inv-card-url">{link}</p>
        </div>

        {/* Botones de acción */}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button className="btn-secondary" type="button" onClick={onClose}>
            {t.cancelar}
          </button>
          <button className="btn-whatsapp" type="button" onClick={onEnviar}>
            <Icon.whatsapp /> {t.whatsapp}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function InvitadosPage() {
  const params = useParams();
  const router = useRouter();
  const eventoId = params.id as string;

  const [evento, setEvento] = useState<Evento | null>(null);
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVis, setToastVis] = useState(false);
  const [lang, setLang] = useState<"es" | "en">("es");
  const [mounted, setMounted] = useState(false);
  const [modalInv, setModalInv] = useState<Invitado | null>(null);

  const t = T[lang];

  useEffect(() => {
    document.title = "Eventix — Invitados";
    setTimeout(() => setMounted(true), 50);
    cargarDatos();
  }, []);

  async function cargarDatos() {
    const [{ data: ev }, { data: inv }] = await Promise.all([
      supabase.from("eventos").select("*").eq("id", eventoId).single(),
      supabase
        .from("invitados")
        .select("*")
        .eq("evento_id", eventoId)
        .order("created_at", { ascending: false }),
    ]);
    if (ev) setEvento(ev);
    if (inv) setInvitados(inv);
    setLoading(false);
  }

  function toast(msg: string) {
    setToastMsg(msg);
    setToastVis(true);
    setTimeout(() => setToastVis(false), 2500);
  }

  function copiarLink(token: string) {
    navigator.clipboard.writeText(
      `${window.location.origin}/confirmar/${token}`,
    );
    setCopiado(token);
    toast(t.linkCopiado);
    setTimeout(() => setCopiado(null), 2000);
  }

  // ── WhatsApp con texto completo de la tarjeta ─────────────────────────────
  function enviarWhatsApp() {
    if (!modalInv || !evento) return;
    const link = `${window.location.origin}/confirmar/${modalInv.token}`;
    const emoji = TIPO_EMOJI[evento.tipo] || "✨";

    // Parsear nombres
    let nombres = [modalInv.nombre];
    if (modalInv.nombres_personas) {
      try {
        const parsed = JSON.parse(modalInv.nombres_personas);
        if (Array.isArray(parsed) && parsed.length > 1) nombres = parsed;
      } catch {}
    }

    const saludo =
      nombres.length > 1
        ? `¡Hola *${nombres.join(", ")}*!`
        : `¡Hola *${modalInv.nombre}*!`;

    const fechaFmt = evento.fecha ? formatFecha(evento.fecha, lang) : null;
    const horaFmt = evento.hora ? formatHora(evento.hora) : null;
    const fechaLimiteFmt = evento.fecha_limite_confirmacion
      ? formatFecha(evento.fecha_limite_confirmacion, lang)
      : null;

    let msg = `${emoji} *${evento.nombre}*\n\n`;
    msg += `${saludo} 🎉\n\n`;
    msg += `Con mucho cariño, *${evento.anfitriones}* te invita a este evento especial.\n\n`;

    if (evento.frase_evento) msg += `_"${evento.frase_evento}"_\n\n`;

    if (fechaFmt) msg += `📅 *Fecha:* ${fechaFmt}\n`;
    if (horaFmt) msg += `🕐 *Hora:* ${horaFmt}\n`;
    if (evento.lugar) msg += `📍 *Lugar:* ${evento.lugar}\n`;
    if (evento.musica_nombre) msg += `🎵 *Música:* ${evento.musica_nombre}\n`;

    msg += `\n`;

    if (fechaLimiteFmt) {
      msg += `⏰ *Por favor confirma tu asistencia antes del:*\n${fechaLimiteFmt}\n\n`;
    }

    msg += `🎟️ *Abre tu tarjeta de invitación aquí:*\n${link}\n\n`;
    msg += `Dentro de tu tarjeta podrás:\n`;
    msg += `✅ Confirmar tu asistencia\n`;
    msg += `📷 Ver el álbum de fotografías\n`;
    msg += `💌 Escribir en el muro del evento\n`;

    const tel = modalInv.telefono?.replace(/\D/g, "") || "";
    window.open(
      `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
    setModalInv(null);
  }

  async function eliminarInvitado(id: string) {
    if (!confirm("¿Eliminar este invitado?")) return;
    setEliminando(id);
    await supabase.from("invitados").delete().eq("id", id);
    setInvitados((prev) => prev.filter((i) => i.id !== id));
    setEliminando(null);
    toast(t.invitadoEliminado);
  }

  const confirmados = invitados.filter((i) => i.estado === "confirmado");
  const rechazados = invitados.filter((i) => i.estado === "rechazado");
  const pendientes = invitados.filter((i) => i.estado === "pendiente");
  const totalPersonas = confirmados.reduce(
    (s, i) => s + (i.num_personas || 1),
    0,
  );

  const lista = (
    filtro === "todos"
      ? invitados
      : filtro === "confirmado"
        ? confirmados
        : filtro === "rechazado"
          ? rechazados
          : pendientes
  ).filter(
    (i) =>
      !busqueda.trim() ||
      i.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      i.telefono?.includes(busqueda) ||
      i.email?.toLowerCase().includes(busqueda.toLowerCase()),
  );

  if (loading)
    return (
      <>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif;background:#F0FAF9}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#F0FAF9",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ marginBottom: 18 }}>
              <AppLogo size={52} />
            </div>
            <div
              style={{
                width: 34,
                height: 34,
                border: "2.5px solid rgba(13,148,136,0.2)",
                borderTopColor: "#0D9488",
                borderRadius: "50%",
                margin: "0 auto 14px",
                animation: "spin .75s linear infinite",
              }}
            />
            <p
              style={{
                color: "#0D9488",
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: 1,
              }}
            >
              Cargando...
            </p>
          </div>
        </main>
      </>
    );

  if (!evento) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{font-family:'DM Sans',sans-serif;background:#F0FAF9;overflow-x:hidden;-webkit-font-smoothing:antialiased}

        :root{
          --bg:#F0FAF9;--surface:#FFFFFF;--surface2:#F7FDFB;
          --border:rgba(13,148,136,0.14);--border-mid:rgba(13,148,136,0.24);
          --accent:#0D9488;--accent2:#0F766E;--accent3:#0a5c55;
          --accent-soft:rgba(13,148,136,0.06);--accent-soft2:rgba(13,148,136,0.14);
          --text:#0A1E1C;--text2:#2D6E68;--text3:#7ABFBA;
          --danger:#dc2626;--danger-bg:#fef2f2;--danger-border:#fecaca;
          --shadow:0 4px 24px rgba(13,148,136,0.13);--shadow-sm:0 2px 10px rgba(13,148,136,0.09);
          --nav-bg:rgba(240,250,249,0.96);
          --transition:all 0.34s cubic-bezier(.4,0,.2,1);
          --radius:18px;--radius-sm:12px;
        }

        .page{min-height:100vh;background:var(--bg);padding-bottom:60px;position:relative;overflow-x:hidden}
        .glow{position:fixed;pointer-events:none;z-index:0;border-radius:50%;filter:blur(90px)}
        .glow-1{width:300px;height:300px;top:-70px;right:-60px;background:radial-gradient(circle,rgba(13,148,136,0.14) 0%,transparent 70%);animation:gd1 9s ease-in-out infinite}
        .glow-2{width:240px;height:240px;bottom:80px;left:-70px;background:radial-gradient(circle,rgba(94,234,212,0.09) 0%,transparent 70%);animation:gd2 11s ease-in-out infinite}
        @keyframes gd1{0%,100%{transform:translate(0,0)}40%{transform:translate(-14px,22px)}70%{transform:translate(10px,-14px)}}
        @keyframes gd2{0%,100%{transform:translate(0,0)}35%{transform:translate(18px,-24px)}65%{transform:translate(-8px,14px)}}

        .particles{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
        .particle{position:absolute;border-radius:50%;background:rgba(94,234,212,0.6);opacity:0;animation:pf linear infinite}
        .particle-1{width:3px;height:3px;left:12%;animation-duration:14s;animation-delay:0s}
        .particle-2{width:2px;height:2px;left:35%;animation-duration:17s;animation-delay:3s}
        .particle-3{width:3px;height:3px;left:58%;animation-duration:12s;animation-delay:1s}
        .particle-4{width:2px;height:2px;left:72%;animation-duration:15s;animation-delay:4s}
        .particle-5{width:3px;height:3px;left:82%;animation-duration:13s;animation-delay:.5s}
        .particle-6{width:2px;height:2px;left:92%;animation-duration:18s;animation-delay:5s}
        @keyframes pf{0%{transform:translateY(110vh);opacity:0}5%{opacity:.12}90%{opacity:.12}100%{transform:translateY(-10vh) translateX(16px);opacity:0}}

        /* ── Nav ── */
        .nav{position:sticky;top:0;z-index:30;height:56px;padding:0 14px;
          display:flex;align-items:center;justify-content:space-between;
          background:var(--nav-bg);backdrop-filter:blur(18px);
          border-bottom:1px solid var(--border);box-shadow:var(--shadow-sm)}
        .nav-left{display:flex;align-items:center;gap:9px;min-width:0}
        .nav-back{display:flex;align-items:center;gap:4px;color:var(--accent);background:var(--accent-soft);border:1px solid var(--border-mid);border-radius:10px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer;transition:var(--transition);text-decoration:none;flex-shrink:0;-webkit-tap-highlight-color:transparent}
        .nav-back:hover{background:var(--accent-soft2)}
        .nav-brand{display:flex;align-items:center;gap:8px;min-width:0}
        .nav-brand-name{font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:600;color:var(--accent);letter-spacing:-.4px;line-height:1;white-space:nowrap}
        .nav-brand-sub{font-size:9px;color:var(--text3);font-weight:600;letter-spacing:.3px;text-transform:uppercase;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px}
        .nav-right{display:flex;align-items:center;gap:6px;flex-shrink:0}
        .ctrl-btn{padding:0 11px;height:32px;border-radius:20px;background:var(--surface);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:var(--transition);color:var(--text2);font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;font-family:'DM Sans',sans-serif;-webkit-tap-highlight-color:transparent}
        .ctrl-btn:hover{background:var(--accent-soft2);color:var(--accent);border-color:var(--accent2)}

        /* ── Layout ── */
        .content{max-width:500px;margin:0 auto;padding:16px 14px 0;position:relative;z-index:1;display:flex;flex-direction:column;gap:11px}

        /* ── Stats ── */
        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
        .stat-pill{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:12px 6px;text-align:center;box-shadow:var(--shadow-sm)}
        .stat-pill-val{font-weight:800;font-size:20px;color:var(--accent);line-height:1}
        .stat-pill-label{font-size:9px;color:var(--text3);font-weight:700;margin-top:3px;letter-spacing:.4px;text-transform:uppercase}
        .stat-decl .stat-pill-val{color:var(--danger)}

        /* ── Section card ── */
        .section-card{background:var(--surface);border-radius:var(--radius);padding:16px;border:1px solid var(--border);box-shadow:var(--shadow)}
        .section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.3px;color:var(--accent2);margin-bottom:12px}
        .fields-group{display:flex;flex-direction:column;gap:12px}
        .field-label{font-size:10px;font-weight:700;color:var(--accent2);display:block;margin-bottom:5px;letter-spacing:.2px;text-transform:uppercase}
        .field-input{width:100%;border:2px solid var(--border-mid);border-radius:11px;padding:10px 13px;font-size:14px;background:var(--accent-soft);color:var(--text);outline:none;transition:border-color .2s,box-shadow .2s;font-family:'DM Sans',sans-serif;-webkit-appearance:none}
        .field-input::placeholder{color:var(--text3)}
        .field-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(13,148,136,0.10);background:var(--surface)}
        .counter-btn{width:36px;height:36px;border-radius:50%;border:2px solid var(--border-mid);background:var(--surface2);color:var(--text2);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700;transition:var(--transition);-webkit-tap-highlight-color:transparent}
        .counter-btn:hover{border-color:var(--accent2);color:var(--accent);background:var(--accent-soft2)}

        /* ── Buttons ── */
        .btn-cta{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,var(--accent) 0%,var(--accent3) 100%);color:#fff;border:none;border-radius:var(--radius);padding:14px;font-size:14px;font-weight:800;font-family:'DM Sans',sans-serif;cursor:pointer;box-shadow:0 5px 20px rgba(13,148,136,0.34);transition:transform .2s,box-shadow .2s;position:relative;overflow:hidden;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
        .btn-cta::after{content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.14) 50%,transparent 60%);background-size:200% 100%;animation:shimmer 3.5s ease-in-out infinite}
        .btn-cta:hover{transform:translateY(-1px);box-shadow:0 8px 26px rgba(13,148,136,0.44)}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        .btn-primary{flex:2;background:linear-gradient(135deg,var(--accent),var(--accent3));color:#fff;border:none;border-radius:var(--radius-sm);padding:12px;font-size:13px;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;box-shadow:0 3px 12px rgba(13,148,136,0.28);transition:var(--transition);-webkit-tap-highlight-color:transparent}
        .btn-secondary{flex:1;background:var(--surface2);color:var(--text2);border:1px solid var(--border-mid);border-radius:var(--radius-sm);padding:12px;font-size:13px;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;transition:var(--transition);-webkit-tap-highlight-color:transparent}
        .btn-secondary:hover{background:var(--accent-soft2);color:var(--accent)}
        .btn-whatsapp{flex:2;display:flex;align-items:center;justify-content:center;gap:7px;background:#16a34a;color:#fff;border:none;border-radius:var(--radius-sm);padding:13px;font-size:14px;font-weight:800;font-family:'DM Sans',sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(22,163,74,0.30);transition:var(--transition);-webkit-tap-highlight-color:transparent}
        .btn-whatsapp:hover{background:#15803d}

        /* ── Buscador ── */
        .search-wrap{position:relative}
        .search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text3);pointer-events:none}
        .search-input{width:100%;border:1.5px solid var(--border-mid);border-radius:13px;padding:10px 36px;font-size:13px;outline:none;font-family:'DM Sans',sans-serif;background:var(--surface);color:var(--text);box-shadow:var(--shadow-sm);transition:border-color .2s;-webkit-appearance:none}
        .search-input::placeholder{color:var(--text3)}
        .search-input:focus{border-color:var(--accent)}
        .search-clear{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:var(--accent-soft2);border:none;border-radius:50%;width:20px;height:20px;font-size:10px;cursor:pointer;color:var(--accent);display:flex;align-items:center;justify-content:center;font-weight:800}

        /* ── Filtros ── */
        .filtros{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px}
        .filtros::-webkit-scrollbar{display:none}
        .filtro-btn{flex-shrink:0;padding:7px 14px;border-radius:99px;font-size:12px;font-weight:700;cursor:pointer;border:none;background:var(--surface);color:var(--text3);box-shadow:var(--shadow-sm);transition:var(--transition);font-family:'DM Sans',sans-serif;-webkit-tap-highlight-color:transparent}
        .filtro-btn.active{background:linear-gradient(135deg,var(--accent),var(--accent3));color:#fff;box-shadow:0 3px 12px rgba(13,148,136,0.30)}

        /* ── Guest cards ── */
        .guest-list{display:flex;flex-direction:column;gap:9px}
        .guest-card{background:var(--surface);border-radius:var(--radius);padding:14px;border:1px solid var(--border);box-shadow:var(--shadow-sm);animation:fadeIn .22s ease both;transition:var(--transition)}
        .guest-card:hover{box-shadow:var(--shadow)}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .guest-avatar{width:40px;height:40px;border-radius:50%;background:var(--accent-soft2);border:2px solid var(--border-mid);display:flex;align-items:center;justify-content:center;color:var(--accent);font-weight:800;font-size:16px;flex-shrink:0}
        .guest-name{font-weight:700;color:var(--text);font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px}
        .guest-sub{font-size:11px;color:var(--text3);margin-top:1px}
        .guest-card-num{font-size:9px;color:var(--text3);font-weight:700;letter-spacing:.5px;margin-top:2px;display:flex;align-items:center;gap:3px}
        .badge{font-size:11px;padding:4px 10px;border-radius:99px;font-weight:700;flex-shrink:0}
        .badge-pend{background:var(--accent-soft);color:var(--accent);border:1px solid var(--border-mid)}
        .badge-conf{background:rgba(22,163,74,0.10);color:#16a34a;border:1px solid rgba(22,163,74,0.22)}
        .badge-decl{background:var(--danger-bg);color:var(--danger);border:1px solid var(--danger-border)}
        .guest-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:11px}
        .action-btn{display:flex;align-items:center;justify-content:center;gap:6px;border-radius:var(--radius-sm);padding:9px;font-size:12px;font-weight:700;cursor:pointer;border:none;transition:var(--transition);font-family:'DM Sans',sans-serif;-webkit-tap-highlight-color:transparent}
        .action-wa{background:#16a34a;color:#fff;box-shadow:0 2px 8px rgba(22,163,74,0.22)}
        .action-wa:hover{background:#15803d}
        .action-copy{background:var(--accent-soft);color:var(--accent);border:1px solid var(--border-mid) !important}
        .action-copy:hover{background:var(--accent-soft2)}
        .action-copy.copied{background:rgba(22,163,74,0.10);color:#16a34a}
        .action-del{background:var(--danger-bg);color:var(--danger);border:1px solid var(--danger-border) !important}
        .action-del:hover{opacity:.75}

        /* ── Empty ── */
        .empty{background:var(--surface);border-radius:var(--radius);padding:44px 24px;text-align:center;border:1.5px dashed var(--border-mid)}
        .empty-emoji{font-size:30px;margin-bottom:10px}
        .empty-text{color:var(--accent);font-size:14px;font-weight:700}

        /* ── Modal ── */
        .modal-backdrop{position:fixed;inset:0;background:rgba(12,26,25,0.55);backdrop-filter:blur(6px);z-index:50;display:flex;align-items:flex-end;justify-content:center;animation:bdin .2s ease}
        @keyframes bdin{from{opacity:0}to{opacity:1}}
        .modal-sheet{background:var(--surface);border-radius:26px 26px 0 0;padding:16px 16px 40px;width:100%;max-width:480px;max-height:92vh;overflow-y:auto;animation:sheetin .3s cubic-bezier(.22,1,.36,1)}
        @keyframes sheetin{from{transform:translateY(100%)}to{transform:translateY(0)}}

        /* ── Inv card (COMPLETA) ── */
        .inv-card-preview{position:relative;border-radius:20px;overflow:hidden;border:1px solid var(--border-mid);background:var(--surface2);padding:20px 18px 18px;margin-bottom:4px}
        .inv-card-bg{position:absolute;inset:0;pointer-events:none;z-index:0;background:linear-gradient(135deg,rgba(13,148,136,0.06) 0%,rgba(94,234,212,0.03) 50%,transparent 100%)}
        .inv-card-bg::before{content:'';position:absolute;top:-60px;right:-60px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(13,148,136,0.10) 0%,transparent 70%)}

        .inv-card-number{position:relative;z-index:2;display:flex;align-items:center;gap:5px;font-size:10px;font-weight:800;color:var(--accent2);letter-spacing:1.2px;text-transform:uppercase;background:var(--accent-soft2);border:1px solid var(--border-mid);border-radius:99px;padding:4px 10px;width:fit-content;margin-bottom:12px}
        .inv-card-header{position:relative;z-index:1;display:flex;align-items:center;gap:10px;margin-bottom:16px}
        .inv-card-appname{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:600;color:var(--accent);letter-spacing:-.4px;line-height:1}
        .inv-card-appsub{font-size:10px;color:var(--text3);font-weight:600;letter-spacing:.3px;text-transform:uppercase;margin-top:2px}

        /* Foto de portada en tarjeta */
        .inv-card-cover{position:relative;z-index:1;border-radius:14px;overflow:hidden;margin-bottom:14px;height:140px}
        .inv-card-cover-img{width:100%;height:100%;object-fit:cover;display:block}
        .inv-card-cover-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(10,30,28,0.5) 0%,transparent 60%)}

        .inv-card-emoji{position:relative;z-index:1;font-size:34px;text-align:center;margin-bottom:8px}
        .inv-card-guest{position:relative;z-index:1;font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:var(--text);text-align:center;letter-spacing:-.3px;line-height:1.2;margin-bottom:4px}
        .inv-card-body{position:relative;z-index:1;text-align:center;color:var(--text2);font-size:13px;margin-bottom:12px;line-height:1.5}
        .inv-card-frase{position:relative;z-index:1;text-align:center;font-style:italic;font-size:12px;color:var(--text3);margin-bottom:12px;line-height:1.5;padding:0 8px}
        .inv-card-event-name{position:relative;z-index:1;background:linear-gradient(135deg,var(--accent),var(--accent3));color:#fff;border-radius:12px;padding:10px 16px;text-align:center;font-weight:800;font-size:15px;margin-bottom:12px;box-shadow:0 3px 14px rgba(13,148,136,0.28);letter-spacing:-.2px}

        /* Lista de invitados en tarjeta */
        .inv-card-guests-list{position:relative;z-index:1;background:var(--accent-soft);border:1px solid var(--border-mid);border-radius:12px;padding:11px 13px;margin-bottom:12px}
        .inv-card-guests-title{font-size:10px;font-weight:800;color:var(--accent2);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px}
        .inv-card-guest-item{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text);font-weight:600;margin-bottom:5px}
        .inv-card-guest-item:last-child{margin-bottom:0}
        .inv-card-guest-avatar{width:22px;height:22px;border-radius:50%;background:var(--accent);color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}

        .inv-card-details{position:relative;z-index:1;background:var(--surface);border-radius:12px;padding:11px 13px;margin-bottom:12px;border:1px solid var(--border);display:flex;flex-direction:column;gap:7px}
        .inv-card-detail-item{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text2);font-weight:500}

        /* Foto del lugar en tarjeta */
        .inv-card-venue-photo{position:relative;z-index:1;border-radius:12px;overflow:hidden;margin-bottom:12px}
        .inv-card-venue-label{font-size:10px;font-weight:800;color:var(--accent2);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px}
        .inv-card-venue-img{width:100%;height:110px;object-fit:cover;border-radius:10px;display:block}

        /* Música en tarjeta */
        .inv-card-music{position:relative;z-index:1;background:linear-gradient(135deg,rgba(13,148,136,0.12),rgba(94,234,212,0.06));border:1px solid var(--border-mid);border-radius:12px;padding:11px 13px;margin-bottom:12px;display:flex;align-items:center;gap:10px}
        .inv-card-music-icon{width:32px;height:32px;background:var(--accent);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0}
        .inv-card-music-info{flex:1;min-width:0}
        .inv-card-music-label{display:block;font-size:9px;font-weight:800;color:var(--accent2);text-transform:uppercase;letter-spacing:.8px;margin-bottom:2px}
        .inv-card-music-name{display:block;font-size:12px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .inv-card-music-wave{display:flex;align-items:center;gap:2px;flex-shrink:0}
        .wave-bar{width:3px;border-radius:99px;background:var(--accent);animation:wave .8s ease-in-out infinite}
        .wave-bar-1{height:8px;animation-delay:0s}
        .wave-bar-2{height:14px;animation-delay:.1s}
        .wave-bar-3{height:10px;animation-delay:.2s}
        .wave-bar-4{height:16px;animation-delay:.15s}
        .wave-bar-5{height:8px;animation-delay:.05s}
        @keyframes wave{0%,100%{transform:scaleY(0.5)}50%{transform:scaleY(1)}}

        /* Mensaje */
        .inv-card-mensaje{position:relative;z-index:1;background:var(--surface);border-left:3px solid var(--accent);border-radius:0 10px 10px 0;padding:10px 13px;margin-bottom:12px;font-size:12px;color:var(--text2);font-style:italic;line-height:1.5}

        /* Fecha límite */
        .inv-card-deadline{position:relative;z-index:1;background:rgba(220,38,38,0.06);border:1px solid rgba(220,38,38,0.18);border-radius:10px;padding:9px 13px;margin-bottom:12px;font-size:12px;color:#dc2626;display:flex;align-items:center;gap:7px}

        /* Opciones de la tarjeta */
        .inv-card-options-title{position:relative;z-index:1;font-size:10px;font-weight:800;color:var(--accent2);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px}
        .inv-card-options{position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
        .inv-card-option{display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 6px;background:var(--surface);border:1px solid var(--border);border-radius:12px;font-size:10px;font-weight:700;color:var(--text2);text-align:center;line-height:1.3}
        .inv-card-option-icon{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center}
        .opt-confirm{background:rgba(22,163,74,0.12);color:#16a34a}
        .opt-photos{background:rgba(13,148,136,0.12);color:var(--accent)}
        .opt-wall{background:rgba(124,58,237,0.10);color:#7c3aed}

        .inv-card-steps{position:relative;z-index:1;background:var(--accent-soft);border:1px solid var(--border-mid);border-radius:12px;padding:11px 13px;margin-bottom:12px}
        .inv-card-steps-title{font-size:10px;font-weight:800;color:var(--accent2);text-transform:uppercase;letter-spacing:1px;margin-bottom:9px}
        .inv-card-step{display:flex;align-items:flex-start;gap:10px;font-size:12px;color:var(--text2);margin-bottom:7px}
        .inv-card-step:last-child{margin-bottom:0}
        .inv-card-step-num{width:20px;height:20px;border-radius:50%;background:var(--accent);color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}

        .inv-card-cta{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,var(--accent),var(--accent3));color:#fff;border-radius:12px;padding:13px 18px;font-size:14px;font-weight:800;text-decoration:none;box-shadow:0 4px 16px rgba(13,148,136,0.36);transition:transform .2s;margin-bottom:9px}
        .inv-card-cta:hover{transform:translateY(-1px)}
        .inv-card-url{position:relative;z-index:1;text-align:center;font-size:10px;color:var(--text3);word-break:break-all}

        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:360px){.stats-grid{grid-template-columns:repeat(2,1fr)}.guest-name{max-width:120px}.inv-card-options{grid-template-columns:repeat(3,1fr)}}
        @media(max-height:580px){.nav{height:48px}}
      `}</style>

      <div className={`page${mounted ? " mounted" : ""}`}>
        <div className="glow glow-1" />
        <div className="glow glow-2" />
        <Particles />

        <nav className="nav">
          <div className="nav-left">
            <button
              className="nav-back"
              type="button"
              onClick={() => router.back()}
            >
              <Icon.back /> {t.atras}
            </button>
            <div className="nav-brand">
              <AppLogo size={28} />
              <div>
                <div className="nav-brand-name">Eventix</div>
                <div className="nav-brand-sub">{evento.nombre}</div>
              </div>
            </div>
          </div>
          <div className="nav-right">
            <button
              className="ctrl-btn"
              type="button"
              onClick={() => setLang(lang === "es" ? "en" : "es")}
            >
              {lang === "es" ? "EN" : "ES"}
            </button>
          </div>
        </nav>

        <div className="content">
          {/* Stats */}
          <div className="stats-grid">
            {[
              { val: invitados.length, label: t.total, cls: "" },
              { val: confirmados.length, label: t.confirmados, cls: "" },
              { val: rechazados.length, label: t.declinaron, cls: "stat-decl" },
              { val: totalPersonas, label: t.personas, cls: "" },
            ].map((s) => (
              <div key={s.label} className={`stat-pill ${s.cls}`}>
                <div className="stat-pill-val">{s.val}</div>
                <div className="stat-pill-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Formulario */}
          <FormNuevoInvitado
            eventoId={eventoId}
            onGuardado={cargarDatos}
            t={t}
          />

          {/* Buscador */}
          <div className="search-wrap">
            <span className="search-icon">
              <Icon.search />
            </span>
            <input
              className="search-input"
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={t.buscar}
            />
            {busqueda && (
              <button
                className="search-clear"
                type="button"
                onClick={() => setBusqueda("")}
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtros */}
          <div className="filtros">
            {[
              { val: "todos", label: `${t.todos} (${invitados.length})` },
              {
                val: "pendiente",
                label: `${t.pendientes} (${pendientes.length})`,
              },
              {
                val: "confirmado",
                label: `${t.confirmadosFilt} (${confirmados.length})`,
              },
              {
                val: "rechazado",
                label: `${t.declinaronFilt} (${rechazados.length})`,
              },
            ].map((f) => (
              <button
                key={f.val}
                type="button"
                className={`filtro-btn${filtro === f.val ? " active" : ""}`}
                onClick={() => setFiltro(f.val)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Lista */}
          {lista.length === 0 ? (
            <div className="empty">
              <div className="empty-emoji">{busqueda ? "🔍" : "👥"}</div>
              <p className="empty-text">
                {busqueda ? `${t.sinResultados} "${busqueda}"` : t.sinCategoria}
              </p>
            </div>
          ) : (
            <div className="guest-list">
              {lista.map((inv, idx) => {
                // Parsear nombres adicionales para mostrar en la card
                let nombresAdicionales: string[] = [];
                if (inv.nombres_personas) {
                  try {
                    const parsed = JSON.parse(inv.nombres_personas);
                    if (Array.isArray(parsed) && parsed.length > 1) {
                      nombresAdicionales = parsed.slice(1);
                    }
                  } catch {}
                }

                return (
                  <div
                    key={inv.id}
                    className="guest-card"
                    style={{ animationDelay: `${idx * 0.04}s` }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 11,
                        }}
                      >
                        <div className="guest-avatar">
                          {inv.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p className="guest-name">{inv.nombre}</p>
                          <p className="guest-sub">
                            {inv.num_personas > 1
                              ? `+${inv.num_personas - 1} personas · `
                              : ""}
                            {inv.telefono || inv.email || "—"}
                          </p>
                          {nombresAdicionales.length > 0 && (
                            <p
                              style={{
                                fontSize: 10,
                                color: "var(--text3)",
                                marginTop: 2,
                              }}
                            >
                              {nombresAdicionales.join(", ")}
                            </p>
                          )}
                          <p className="guest-card-num">
                            🎫 #{tokenToCardNumber(inv.token)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`badge ${inv.estado === "confirmado" ? "badge-conf" : inv.estado === "rechazado" ? "badge-decl" : "badge-pend"}`}
                      >
                        {inv.estado === "confirmado"
                          ? `${inv.num_personas} pers.`
                          : inv.estado === "rechazado"
                            ? t.declino
                            : t.pendiente}
                      </span>
                    </div>

                    <div className="guest-actions">
                      <button
                        className="action-btn action-wa"
                        type="button"
                        onClick={() => setModalInv(inv)}
                      >
                        <Icon.whatsapp /> {t.whatsapp}
                      </button>
                      <button
                        className={`action-btn action-copy${copiado === inv.token ? " copied" : ""}`}
                        type="button"
                        onClick={() => copiarLink(inv.token)}
                      >
                        <Icon.copy />
                        {copiado === inv.token ? t.copiado : t.copiarLink}
                      </button>
                      <button
                        className="action-btn action-del"
                        type="button"
                        style={{ gridColumn: "span 2" }}
                        onClick={() => eliminarInvitado(inv.id)}
                        disabled={eliminando === inv.id}
                      >
                        <Icon.trash />
                        {eliminando === inv.id ? t.eliminando : t.eliminar}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Toast msg={toastMsg} visible={toastVis} />

        {modalInv && evento && (
          <ModalInvitacion
            invitado={modalInv}
            evento={evento}
            onClose={() => setModalInv(null)}
            onEnviar={enviarWhatsApp}
            t={t}
            lang={lang}
          />
        )}
      </div>
    </>
  );
}
