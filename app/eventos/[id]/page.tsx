"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";

type Invitado = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  estado: string;
  num_personas: number;
  token: string;
};

type Evento = {
  id: string;
  nombre: string;
  tipo: string;
  anfitriones: string;
  fecha?: string;
  hora?: string;
  lugar?: string;
};

// ─── Logo SVG (sistema unificado) ────────────────────────────────────────────
function AppLogo({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="lg-inv"
          x1="0"
          y1="0"
          x2="56"
          y2="56"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#1A3A38" />
          <stop offset="100%" stopColor="#0F2422" />
        </linearGradient>
        <linearGradient
          id="lg2-inv"
          x1="10"
          y1="28"
          x2="46"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#3AADA0" />
          <stop offset="100%" stopColor="#2DC4A8" />
        </linearGradient>
        <filter id="lg3-inv" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <rect width="56" height="56" rx="16" fill="url(#lg-inv)" />
      <rect
        x="3"
        y="3"
        width="50"
        height="50"
        rx="14"
        fill="none"
        stroke="rgba(58,173,160,0.18)"
        strokeWidth="1"
      />
      <rect
        x="9"
        y="17"
        width="38"
        height="26"
        rx="3.5"
        fill="rgba(58,173,160,0.10)"
        stroke="rgba(58,173,160,0.6)"
        strokeWidth="1.4"
      />
      <path
        d="M9 20.5 L28 31 L47 20.5"
        stroke="url(#lg2-inv)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="11" r="1.6" fill="#3AADA0" opacity="0.9" />
      <circle cx="20" cy="9" r="1.1" fill="#2DC4A8" opacity="0.7" />
      <circle cx="42" cy="11" r="1.6" fill="#3AADA0" opacity="0.9" />
      <circle cx="36" cy="9" r="1.1" fill="#2DC4A8" opacity="0.7" />
      <path
        d="M28 7 L29 10.2 L32.4 10.2 L29.8 12.2 L30.8 15.4 L28 13.4 L25.2 15.4 L26.2 12.2 L23.6 10.2 L27 10.2 Z"
        fill="#3AADA0"
        opacity="0.95"
        filter="url(#lg3-inv)"
      />
      <path
        d="M24 17 Q28 14 32 17"
        stroke="#2DC4A8"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />
      <circle cx="28" cy="17" r="1.3" fill="#3AADA0" />
    </svg>
  );
}

// ─── Íconos ──────────────────────────────────────────────────────────────────
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
  sun: () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  ),
  moon: () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path
        d="M13.5 9.5A6 6 0 016.5 2.5a6 6 0 100 11 6 6 0 007-4z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  users: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M13 15c0-2.2-1.3-4-3-4s-3 1.8-3 4M7 7a3 3 0 106 0 3 3 0 00-6 0M16 15c0-1.8-1-3.3-2.5-4M17 6.5a2.5 2.5 0 010 5" />
    </svg>
  ),
  check: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M2 7l4 4 6-6" />
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
      width="13"
      height="13"
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
};

// ─── Traducciones ─────────────────────────────────────────────────────────────
const T = {
  es: {
    invitados: "Invitados",
    atras: "Atrás",
    darkMode: "Modo oscuro",
    lightMode: "Modo claro",
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
    errorGuardar: "Ingresa al menos el nombre del invitado",
    eliminar: "Eliminar",
    eliminando: "...",
    invPor: "Invitación de",
    paso1: "Abre el link de confirmación",
    paso2: "Confirma cuántas personas asistirán",
    paso3: "¡Listo! Recibirás la información del evento",
    confirmarAsistencia: "Ver mi invitación →",
    invitadoEliminado: "Invitado eliminado",
    linkCopiado: "Link copiado al portapapeles",
    tarjeta: "Tarjeta",
  },
  en: {
    invitados: "Guests",
    atras: "Back",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    total: "Total",
    confirmados: "Confirm.",
    declinaron: "Declined",
    personas: "People",
    agregar: "Add guest",
    nuevoInvitado: "New guest",
    nombre: "Full name *",
    telefono: "Phone (WhatsApp)",
    email: "Email address",
    numPersonas: "Number of people",
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
    errorGuardar: "Enter at least the guest's name",
    eliminar: "Delete",
    eliminando: "...",
    invPor: "Invitation from",
    paso1: "Open the confirmation link",
    paso2: "Confirm how many people will attend",
    paso3: "Done! You'll receive the event details",
    confirmarAsistencia: "View my invitation →",
    invitadoEliminado: "Guest removed",
    linkCopiado: "Link copied to clipboard",
    tarjeta: "Card",
  },
};

// ─── TIPO emojis ─────────────────────────────────────────────────────────────
const TIPO_EMOJI: Record<string, string> = {
  quinceañera: "👑",
  boda: "💍",
  graduacion: "🎓",
  cumpleaños: "🎂",
  otro: "✨",
};

// ─── Número de tarjeta a partir del token ────────────────────────────────────
function tokenToCardNumber(token: string): string {
  // Toma los últimos 4 caracteres del token y los convierte a número
  const suffix = token
    .slice(-8)
    .replace(/[^a-f0-9]/gi, "")
    .slice(-4);
  const num = parseInt(suffix, 16) % 9999;
  return String(num + 1).padStart(4, "0");
}

// ─── Formulario nuevo invitado ────────────────────────────────────────────────
type FormData = {
  nombre: string;
  telefono: string;
  email: string;
  num_personas: number;
};

function FormNuevoInvitado({
  eventoId,
  onGuardado,
  t,
  dark,
}: {
  eventoId: string;
  onGuardado: () => void;
  t: (typeof T)["es"];
  dark: boolean;
}) {
  const [form, setForm] = useState<FormData>({
    nombre: "",
    telefono: "",
    email: "",
    num_personas: 1,
  });
  const [guardando, setGuardando] = useState(false);
  const [expandido, setExpandido] = useState(false);

  const guardar = async () => {
    if (!form.nombre.trim()) return;
    setGuardando(true);
    await supabase.from("invitados").insert({
      evento_id: eventoId,
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
      num_personas: form.num_personas,
      estado: "pendiente",
    });
    setForm({ nombre: "", telefono: "", email: "", num_personas: 1 });
    setExpandido(false);
    setGuardando(false);
    onGuardado();
  };

  if (!expandido)
    return (
      <button onClick={() => setExpandido(true)} className="btn-cta">
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

        <div>
          <label className="field-label">{t.numPersonas}</label>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              className="counter-btn"
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
                fontSize: 22,
                fontWeight: 800,
                color: "var(--text)",
                minWidth: 28,
                textAlign: "center",
              }}
            >
              {form.num_personas}
            </span>
            <button
              className="counter-btn"
              onClick={() =>
                setForm({
                  ...form,
                  num_personas: Math.min(20, form.num_personas + 1),
                })
              }
            >
              +
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-secondary" onClick={() => setExpandido(false)}>
            {t.cancelar}
          </button>
          <button
            className="btn-primary"
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

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, visible }: { msg: string; visible: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? "0" : "70px"})`,
        background: "var(--accent3)",
        color: "#fff",
        padding: "10px 22px",
        borderRadius: 99,
        fontSize: 13,
        fontWeight: 700,
        boxShadow: "0 4px 20px rgba(58,173,160,0.40)",
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

// ─── Modal tarjeta invitación ─────────────────────────────────────────────────
function ModalInvitacion({
  invitado,
  evento,
  onClose,
  onEnviar,
  t,
}: {
  invitado: Invitado;
  evento: Evento;
  onClose: () => void;
  onEnviar: () => void;
  t: (typeof T)["es"];
}) {
  const link = `${window.location.origin}/confirmar/${invitado.token}`;
  const emoji = TIPO_EMOJI[evento.tipo] || "✨";
  const cardNumber = tokenToCardNumber(invitado.token);

  const fechaFmt = evento.fecha
    ? new Date(evento.fecha).toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
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
            margin: "0 auto 20px",
          }}
        />

        <p
          className="section-title"
          style={{ textAlign: "center", marginBottom: 20 }}
        >
          Vista previa de la invitación
        </p>

        {/* ── TARJETA ── */}
        <div className="inv-card-preview">
          <div className="inv-card-bg" />

          {/* Número de tarjeta */}
          <div className="inv-card-number">
            <Icon.ticket />
            <span>
              {t.tarjeta} #{cardNumber}
            </span>
          </div>

          {/* Header tarjeta */}
          <div className="inv-card-header">
            <div className="inv-card-logo-wrap">
              <AppLogo size={36} />
            </div>
            <div>
              <p className="inv-card-appname">Events</p>
              <p className="inv-card-appsub">Invitaciones digitales</p>
            </div>
          </div>

          {/* Emoji tipo */}
          <div className="inv-card-emoji">{emoji}</div>

          {/* Nombres */}
          <p className="inv-card-guest">¡Hola, {invitado.nombre}!</p>
          <p className="inv-card-body">
            <span style={{ color: "var(--text3)", fontSize: 13 }}>
              {t.invPor}
            </span>
            <br />
            <strong style={{ fontSize: 16 }}>{evento.anfitriones}</strong>
          </p>

          {/* Nombre evento */}
          <div className="inv-card-event-name">{evento.nombre}</div>

          {/* Detalles */}
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

          {/* Pasos */}
          <div className="inv-card-steps">
            <p className="inv-card-steps-title">¿Cómo confirmar?</p>
            {[t.paso1, t.paso2, t.paso3].map((paso, i) => (
              <div key={i} className="inv-card-step">
                <div className="inv-card-step-num">{i + 1}</div>
                <span>{paso}</span>
              </div>
            ))}
          </div>

          {/* CTA link */}
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inv-card-cta"
          >
            <Icon.link /> {t.confirmarAsistencia}
          </a>

          {/* URL visible */}
          <p className="inv-card-url">{link}</p>
        </div>

        {/* Botones acción */}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button className="btn-secondary" onClick={onClose}>
            {t.cancelar}
          </button>
          <button className="btn-whatsapp" onClick={onEnviar}>
            <Icon.whatsapp /> {t.whatsapp}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
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
  const [toastVisible, setToastVisible] = useState(false);
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState<"es" | "en">("es");
  const [mounted, setMounted] = useState(false);
  const [modalInv, setModalInv] = useState<Invitado | null>(null);

  const t = T[lang];

  useEffect(() => {
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
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }

  function copiarLink(token: string) {
    navigator.clipboard.writeText(
      `${window.location.origin}/confirmar/${token}`,
    );
    setCopiado(token);
    toast(t.linkCopiado);
    setTimeout(() => setCopiado(null), 2000);
  }

  function abrirModalWhatsApp(invitado: Invitado) {
    setModalInv(invitado);
  }

  // ── MEJORA CLAVE: WhatsApp envía solo el link limpio ──────────────────────
  function enviarWhatsApp() {
    if (!modalInv || !evento) return;
    const link = `${window.location.origin}/confirmar/${modalInv.token}`;
    const emoji = TIPO_EMOJI[evento.tipo] || "✨";

    // Mensaje corto y limpio — WhatsApp generará preview de la tarjeta automáticamente
    const msg =
      `${emoji} *${evento.nombre}*\n\n` +
      `¡Hola *${modalInv.nombre}*! 🎉\n\n` +
      `Tienes una invitación especial. Ábrela aquí:\n${link}`;

    const telefono = modalInv.telefono?.replace(/\D/g, "") || "";
    window.open(
      `https://wa.me/${telefono}?text=${encodeURIComponent(msg)}`,
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
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          body{font-family:'DM Sans',sans-serif}
          @keyframes spin{to{transform:rotate(360deg)}}
          @keyframes fi{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        `}</style>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg,#0C1A19,#0F2422)",
          }}
        >
          <div style={{ textAlign: "center", animation: "fi .5s ease both" }}>
            <div style={{ marginBottom: 18 }}>
              <AppLogo size={52} />
            </div>
            <div
              style={{
                width: 34,
                height: 34,
                border: "2.5px solid rgba(58,173,160,0.2)",
                borderTopColor: "#3AADA0",
                borderRadius: "50%",
                margin: "0 auto 14px",
                animation: "spin .75s linear infinite",
              }}
            />
            <p
              style={{
                color: "#3AADA0",
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
        body{font-family:'DM Sans',sans-serif}

        :root {
          --bg:#F0FAF8; --surface:#FFFFFF; --surface2:#F7FDFB;
          --border:rgba(58,173,160,0.15); --border-mid:rgba(58,173,160,0.26);
          --accent:#1FA896; --accent2:#3AADA0; --accent3:#0f766e;
          --accent-soft:rgba(58,173,160,0.09); --accent-soft2:rgba(58,173,160,0.17);
          --text:#0A1E1C; --text2:#3D6E6A; --text3:#85B5B0;
          --danger:#dc2626; --danger-bg:#fef2f2; --danger-border:#fecaca;
          --shadow:0 4px 24px rgba(58,173,160,0.13); --shadow-sm:0 2px 10px rgba(58,173,160,0.08);
          --nav-bg:rgba(240,250,248,0.96);
          --transition:all 0.34s cubic-bezier(.4,0,.2,1);
          --radius:18px; --radius-sm:12px;
        }
        .dark {
          --bg:#0C1A19; --surface:#162422; --surface2:#1C2E2B;
          --border:rgba(58,173,160,0.13); --border-mid:rgba(58,173,160,0.24);
          --accent:#3AADA0; --accent2:#2DC4A8; --accent3:#5eead4;
          --accent-soft:rgba(58,173,160,0.10); --accent-soft2:rgba(58,173,160,0.18);
          --text:#E8F8F5; --text2:#7ABFBA; --text3:#3D7070;
          --danger:#f87171; --danger-bg:rgba(220,38,38,0.10); --danger-border:rgba(220,38,38,0.22);
          --shadow:0 4px 24px rgba(0,0,0,0.44); --shadow-sm:0 2px 10px rgba(0,0,0,0.28);
          --nav-bg:rgba(12,26,25,0.97);
        }

        .page { min-height:100vh; background:var(--bg); transition:background 0.5s ease; padding-bottom:60px; }
        .page::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E"); opacity:.3; }
        .glow { position:fixed; pointer-events:none; z-index:0; border-radius:50%; filter:blur(80px); }
        .glow-1 { width:300px; height:300px; top:-80px; right:-60px; background:radial-gradient(circle,rgba(58,173,160,0.13) 0%,transparent 70%); animation:gd1 9s ease-in-out infinite; }
        .glow-2 { width:240px; height:240px; bottom:80px; left:-70px; background:radial-gradient(circle,rgba(45,196,168,0.09) 0%,transparent 70%); animation:gd2 11s ease-in-out infinite; }
        .dark .glow-1{background:radial-gradient(circle,rgba(58,173,160,0.18) 0%,transparent 70%)}
        .dark .glow-2{background:radial-gradient(circle,rgba(45,196,168,0.12) 0%,transparent 70%)}
        @keyframes gd1{0%,100%{transform:translate(0,0)}40%{transform:translate(-14px,22px)}70%{transform:translate(10px,-14px)}}
        @keyframes gd2{0%,100%{transform:translate(0,0)}35%{transform:translate(18px,-24px)}65%{transform:translate(-8px,14px)}}

        .nav { position:sticky; top:0; z-index:30; height:58px; padding:0 14px;
          display:flex; align-items:center; justify-content:space-between;
          background:var(--nav-bg); backdrop-filter:blur(18px);
          border-bottom:1px solid var(--border); box-shadow:var(--shadow-sm);
          transition:background 0.5s ease; }
        .nav-left { display:flex; align-items:center; gap:9px; }
        .nav-back { display:flex; align-items:center; gap:4px; color:var(--accent);
          background:var(--accent-soft); border:1px solid var(--border-mid); border-radius:10px;
          padding:7px 12px; font-size:12px; font-weight:700; cursor:pointer;
          transition:var(--transition); text-decoration:none; }
        .nav-back:hover { background:var(--accent-soft2); }
        .nav-brand { display:flex; align-items:center; gap:8px; }
        .nav-brand-name { font-family:'Cormorant Garamond',serif; font-size:19px; font-weight:600; color:var(--accent); letter-spacing:-.4px; line-height:1; }
        .nav-brand-sub { font-size:10px; color:var(--text3); font-weight:600; letter-spacing:.3px; text-transform:uppercase; margin-top:2px; }
        .nav-right { display:flex; align-items:center; gap:6px; }
        .ctrl-btn { width:33px; height:33px; border-radius:50%; background:var(--surface);
          border:1px solid var(--border); display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:var(--transition); color:var(--text2); font-size:11px; font-weight:700; }
        .ctrl-btn:hover { background:var(--accent-soft2); color:var(--accent); border-color:var(--accent2); }
        .ctrl-lang { width:auto; padding:0 10px; border-radius:20px; letter-spacing:.4px; text-transform:uppercase; }

        .content { max-width:500px; margin:0 auto; padding:18px 14px 0; position:relative; z-index:1; display:flex; flex-direction:column; gap:12px; }

        .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
        .stat-pill { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:12px 6px; text-align:center; box-shadow:var(--shadow-sm); }
        .stat-pill-val { font-weight:800; font-size:20px; color:var(--accent); line-height:1; }
        .stat-pill-label { font-size:9px; color:var(--text3); font-weight:700; margin-top:3px; letter-spacing:.4px; text-transform:uppercase; }
        .stat-conf .stat-pill-val { color:var(--accent); }
        .stat-decl .stat-pill-val { color:var(--danger); }

        .section-card { background:var(--surface); border-radius:var(--radius); padding:16px; border:1px solid var(--border); box-shadow:var(--shadow); }
        .section-title { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1.3px; color:var(--accent2); margin-bottom:12px; }
        .fields-group { display:flex; flex-direction:column; gap:12px; }
        .field-label { font-size:11px; font-weight:700; color:var(--accent2); display:block; margin-bottom:5px; letter-spacing:.2px; text-transform:uppercase; }
        .field-input { width:100%; border:2px solid var(--border-mid); border-radius:11px; padding:10px 13px; font-size:14px; background:var(--accent-soft); color:var(--text); outline:none; transition:border-color .2s,box-shadow .2s; font-family:'DM Sans',sans-serif; }
        .field-input::placeholder { color:var(--text3); }
        .field-input:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(58,173,160,0.11); background:var(--surface); }
        .counter-btn { width:36px; height:36px; border-radius:50%; border:2px solid var(--border-mid); background:var(--surface2); color:var(--text2); font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:700; transition:var(--transition); }
        .counter-btn:hover { border-color:var(--accent2); color:var(--accent); background:var(--accent-soft2); }

        .btn-cta { width:100%; display:flex; align-items:center; justify-content:center; gap:8px;
          background:linear-gradient(135deg,var(--accent) 0%,var(--accent3) 100%);
          color:#fff; border:none; border-radius:var(--radius); padding:15px;
          font-size:14px; font-weight:800; font-family:'DM Sans',sans-serif; cursor:pointer;
          box-shadow:0 5px 20px rgba(58,173,160,0.34); transition:transform .2s,box-shadow .2s;
          position:relative; overflow:hidden; }
        .btn-cta::after { content:''; position:absolute; inset:0;
          background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.14) 50%,transparent 60%);
          background-size:200% 100%; animation:shimmer 3.5s ease-in-out infinite; }
        .btn-cta:hover { transform:translateY(-1px); box-shadow:0 8px 26px rgba(58,173,160,0.44); }
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        .btn-primary { flex:2; background:linear-gradient(135deg,var(--accent),var(--accent3)); color:#fff; border:none; border-radius:var(--radius-sm); padding:12px; font-size:13px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; box-shadow:0 3px 12px rgba(58,173,160,0.28); transition:var(--transition); }
        .btn-secondary { flex:1; background:var(--surface2); color:var(--text2); border:1px solid var(--border-mid); border-radius:var(--radius-sm); padding:12px; font-size:13px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:var(--transition); }
        .btn-secondary:hover { background:var(--accent-soft2); color:var(--accent); }
        .btn-whatsapp { flex:2; display:flex; align-items:center; justify-content:center; gap:7px;
          background:#16a34a; color:#fff; border:none; border-radius:var(--radius-sm); padding:13px;
          font-size:14px; font-weight:800; font-family:'DM Sans',sans-serif; cursor:pointer;
          box-shadow:0 4px 14px rgba(22,163,74,0.30); transition:var(--transition); }
        .btn-whatsapp:hover { background:#15803d; }

        .search-wrap { position:relative; }
        .search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text3); pointer-events:none; }
        .search-input { width:100%; border:1.5px solid var(--border-mid); border-radius:13px; padding:10px 36px; font-size:13px; outline:none; font-family:'DM Sans',sans-serif; background:var(--surface); color:var(--text); box-shadow:var(--shadow-sm); transition:border-color .2s; }
        .search-input::placeholder { color:var(--text3); }
        .search-input:focus { border-color:var(--accent); }
        .search-clear { position:absolute; right:10px; top:50%; transform:translateY(-50%); background:var(--accent-soft2); border:none; border-radius:50%; width:20px; height:20px; font-size:10px; cursor:pointer; color:var(--accent); display:flex; align-items:center; justify-content:center; font-weight:800; }

        .filtros { display:flex; gap:6px; overflow-x:auto; padding-bottom:4px; }
        .filtros::-webkit-scrollbar { display:none; }
        .filtro-btn { flex-shrink:0; padding:7px 14px; border-radius:99px; font-size:12px; font-weight:700; cursor:pointer; border:none; background:var(--surface); color:var(--text3); box-shadow:var(--shadow-sm); transition:var(--transition); font-family:'DM Sans',sans-serif; }
        .filtro-btn.active { background:linear-gradient(135deg,var(--accent),var(--accent3)); color:#fff; box-shadow:0 3px 12px rgba(58,173,160,0.30); }

        .guest-list { display:flex; flex-direction:column; gap:9px; }
        .guest-card { background:var(--surface); border-radius:var(--radius); padding:14px; border:1px solid var(--border); box-shadow:var(--shadow-sm); animation:fadeIn .22s ease both; transition:var(--transition); }
        .guest-card:hover { box-shadow:var(--shadow); }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .guest-avatar { width:40px; height:40px; border-radius:50%; background:var(--accent-soft2); border:2px solid var(--border-mid); display:flex; align-items:center; justify-content:center; color:var(--accent); font-weight:800; font-size:16px; flex-shrink:0; }
        .guest-name { font-weight:700; color:var(--text); font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:160px; }
        .guest-sub { font-size:11px; color:var(--text3); margin-top:2px; }

        /* Número de tarjeta en guest card */
        .guest-card-num { font-size:9px; color:var(--text3); font-weight:700; letter-spacing:.5px; margin-top:1px; display:flex; align-items:center; gap:3px; }

        .badge { font-size:11px; padding:4px 10px; border-radius:99px; font-weight:700; flex-shrink:0; }
        .badge-pend { background:var(--accent-soft); color:var(--accent); border:1px solid var(--border-mid); }
        .badge-conf { background:rgba(22,163,74,0.10); color:#16a34a; border:1px solid rgba(22,163,74,0.22); }
        .badge-decl { background:var(--danger-bg); color:var(--danger); border:1px solid var(--danger-border); }
        .guest-actions { display:grid; grid-template-columns:1fr 1fr; gap:7px; margin-top:11px; }
        .action-btn { display:flex; align-items:center; justify-content:center; gap:6px; border-radius:var(--radius-sm); padding:9px; font-size:12px; font-weight:700; cursor:pointer; border:none; transition:var(--transition); font-family:'DM Sans',sans-serif; }
        .action-wa { background:#16a34a; color:#fff; box-shadow:0 2px 8px rgba(22,163,74,0.22); }
        .action-wa:hover { background:#15803d; }
        .action-copy { background:var(--accent-soft); color:var(--accent); border:1px solid var(--border-mid) !important; border:none; }
        .action-copy:hover { background:var(--accent-soft2); }
        .action-copy.copied { background:rgba(22,163,74,0.10); color:#16a34a; }
        .action-del { background:var(--danger-bg); color:var(--danger); border:1px solid var(--danger-border) !important; border:none; }
        .action-del:hover { opacity:.75; }

        .empty { background:var(--surface); border-radius:var(--radius); padding:44px 24px; text-align:center; border:1.5px dashed var(--border-mid); }
        .empty-emoji { font-size:30px; margin-bottom:10px; }
        .empty-text { color:var(--accent); font-size:14px; font-weight:700; }

        .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.55); backdrop-filter:blur(6px); z-index:50; display:flex; align-items:flex-end; justify-content:center; animation:bdin .2s ease; }
        @keyframes bdin{from{opacity:0}to{opacity:1}}
        .modal-sheet { background:var(--surface); border-radius:26px 26px 0 0; padding:16px 16px 32px; width:100%; max-width:480px; max-height:92vh; overflow-y:auto; animation:sheetin .3s cubic-bezier(.22,1,.36,1); }
        @keyframes sheetin{from{transform:translateY(100%)}to{transform:translateY(0)}}

        /* ── NÚMERO DE TARJETA en modal ── */
        .inv-card-number {
          position:relative; z-index:2;
          display:flex; align-items:center; gap:5px;
          font-size:10px; font-weight:800; color:var(--accent2);
          letter-spacing:1.2px; text-transform:uppercase;
          background:var(--accent-soft2); border:1px solid var(--border-mid);
          border-radius:99px; padding:4px 10px; width:fit-content;
          margin-bottom:12px;
        }

        .inv-card-preview { position:relative; border-radius:20px; overflow:hidden; border:1px solid var(--border-mid); background:var(--surface2); padding:22px 20px 20px; margin-bottom:4px; }
        .inv-card-bg { position:absolute; inset:0; pointer-events:none; z-index:0; background:linear-gradient(135deg,rgba(58,173,160,0.06) 0%,rgba(45,196,168,0.03) 50%,transparent 100%); }
        .inv-card-bg::before { content:''; position:absolute; top:-60px; right:-60px; width:180px; height:180px; border-radius:50%; background:radial-gradient(circle,rgba(58,173,160,0.12) 0%,transparent 70%); }
        .inv-card-bg::after { content:''; position:absolute; bottom:-40px; left:-40px; width:120px; height:120px; border-radius:50%; background:radial-gradient(circle,rgba(45,196,168,0.08) 0%,transparent 70%); }
        .inv-card-header { position:relative; z-index:1; display:flex; align-items:center; gap:10px; margin-bottom:18px; }
        .inv-card-logo-wrap { flex-shrink:0; filter:drop-shadow(0 2px 8px rgba(58,173,160,0.30)); }
        .inv-card-appname { font-family:'Cormorant Garamond',serif; font-size:18px; font-weight:600; color:var(--accent); letter-spacing:-.4px; line-height:1; }
        .inv-card-appsub { font-size:10px; color:var(--text3); font-weight:600; letter-spacing:.3px; text-transform:uppercase; margin-top:2px; }
        .inv-card-emoji { position:relative; z-index:1; font-size:36px; text-align:center; margin-bottom:10px; filter:drop-shadow(0 2px 6px rgba(0,0,0,0.1)); }
        .inv-card-guest { position:relative; z-index:1; font-family:'Cormorant Garamond',serif; font-size:22px; font-weight:600; color:var(--text); text-align:center; letter-spacing:-.3px; line-height:1.2; margin-bottom:4px; }
        .inv-card-body { position:relative; z-index:1; text-align:center; color:var(--text2); font-size:13px; margin-bottom:14px; line-height:1.5; }
        .inv-card-event-name { position:relative; z-index:1; background:linear-gradient(135deg,var(--accent),var(--accent3)); color:#fff; border-radius:12px; padding:10px 16px; text-align:center; font-weight:800; font-size:15px; margin-bottom:14px; box-shadow:0 3px 14px rgba(58,173,160,0.28); letter-spacing:-.2px; }
        .inv-card-details { position:relative; z-index:1; background:var(--surface); border-radius:12px; padding:12px 14px; margin-bottom:14px; border:1px solid var(--border); display:flex; flex-direction:column; gap:8px; }
        .inv-card-detail-item { display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text2); font-weight:500; }
        .inv-card-steps { position:relative; z-index:1; background:var(--accent-soft); border:1px solid var(--border-mid); border-radius:12px; padding:12px 14px; margin-bottom:14px; }
        .inv-card-steps-title { font-size:10px; font-weight:800; color:var(--accent2); text-transform:uppercase; letter-spacing:1px; margin-bottom:10px; }
        .inv-card-step { display:flex; align-items:flex-start; gap:10px; font-size:12px; color:var(--text2); margin-bottom:7px; }
        .inv-card-step:last-child { margin-bottom:0; }
        .inv-card-step-num { width:20px; height:20px; border-radius:50%; background:var(--accent); color:#fff; font-size:10px; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; }
        .inv-card-cta { position:relative; z-index:1; display:flex; align-items:center; justify-content:center; gap:8px; background:linear-gradient(135deg,var(--accent),var(--accent3)); color:#fff; border-radius:12px; padding:13px 18px; font-size:14px; font-weight:800; text-decoration:none; box-shadow:0 4px 16px rgba(58,173,160,0.36); transition:transform .2s; margin-bottom:10px; }
        .inv-card-cta:hover { transform:translateY(-1px); }
        .inv-card-url { position:relative; z-index:1; text-align:center; font-size:10px; color:var(--text3); word-break:break-all; }

        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div className={`page${dark ? " dark" : ""}${mounted ? " mounted" : ""}`}>
        <div className="glow glow-1" />
        <div className="glow glow-2" />

        {/* ── NAV ── */}
        <nav className="nav">
          <div className="nav-left">
            <button className="nav-back" onClick={() => router.back()}>
              <Icon.back /> {t.atras}
            </button>
            <div className="nav-brand">
              <AppLogo size={30} />
              <div>
                <div className="nav-brand-name">Events</div>
                <div
                  className="nav-brand-sub"
                  style={{
                    maxWidth: 120,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {evento.nombre}
                </div>
              </div>
            </div>
          </div>
          <div className="nav-right">
            <button
              className="ctrl-btn ctrl-lang"
              onClick={() => setLang(lang === "es" ? "en" : "es")}
            >
              {lang === "es" ? "EN" : "ES"}
            </button>
            <button
              className="ctrl-btn"
              onClick={() => setDark(!dark)}
              title={dark ? t.lightMode : t.darkMode}
            >
              {dark ? <Icon.sun /> : <Icon.moon />}
            </button>
          </div>
        </nav>

        <div className="content">
          {/* Stats */}
          <div className="stats-grid">
            {[
              { val: invitados.length, label: t.total, cls: "" },
              {
                val: confirmados.length,
                label: t.confirmados,
                cls: "stat-conf",
              },
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
            dark={dark}
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
              <button className="search-clear" onClick={() => setBusqueda("")}>
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
              {lista.map((inv, idx) => (
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
                      style={{ display: "flex", alignItems: "center", gap: 11 }}
                    >
                      <div className="guest-avatar">
                        {inv.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p className="guest-name">{inv.nombre}</p>
                        <p className="guest-sub">
                          {inv.telefono || inv.email || "—"}
                        </p>
                        {/* Número de tarjeta visible en la lista */}
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
                      onClick={() => abrirModalWhatsApp(inv)}
                    >
                      <Icon.whatsapp /> {t.whatsapp}
                    </button>
                    <button
                      className={`action-btn action-copy${copiado === inv.token ? " copied" : ""}`}
                      onClick={() => copiarLink(inv.token)}
                    >
                      <Icon.copy />
                      {copiado === inv.token ? t.copiado : t.copiarLink}
                    </button>
                    <button
                      className="action-btn action-del"
                      style={{ gridColumn: "span 2" }}
                      onClick={() => eliminarInvitado(inv.id)}
                      disabled={eliminando === inv.id}
                    >
                      <Icon.trash />
                      {eliminando === inv.id ? t.eliminando : t.eliminar}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Toast msg={toastMsg} visible={toastVisible} />

        {modalInv && evento && (
          <ModalInvitacion
            invitado={modalInv}
            evento={evento}
            onClose={() => setModalInv(null)}
            onEnviar={enviarWhatsApp}
            t={t}
          />
        )}
      </div>
    </>
  );
}
