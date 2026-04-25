"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Evento = {
  id: string;
  nombre: string;
  tipo: string;
  fecha: string;
  lugar: string;
  imagen_url?: string | null;
  agradecimiento_enviado?: boolean;
};

type Stats = {
  confirmados: number;
  declinados: number;
  pendientes: number;
  total_personas: number;
  total_fotos: number;
  total_deseos: number;
};

type InvitadoResumen = {
  id: string;
  nombre: string;
  telefono: string | null;
  estado: string;
  num_personas: number;
  token: string;
  orden: number;
};

// ─── Config ────────────────────────────────────────────────────────────────────
const TIPO_CONFIG: Record<string, { label: string; labelEn: string }> = {
  quinceañera: { label: "Quinceañera", labelEn: "Quinceañera" },
  boda: { label: "Boda", labelEn: "Wedding" },
  graduacion: { label: "Graduación", labelEn: "Graduation" },
  cumpleaños: { label: "Cumpleaños", labelEn: "Birthday" },
  otro: { label: "Evento", labelEn: "Event" },
};

// ─── i18n ──────────────────────────────────────────────────────────────────────
const translations = {
  es: {
    hello: "Hola",
    signOut: "Salir",
    newEvent: "Nuevo evento",
    events: "eventos",
    eventSingular: "evento",
    yourEvents: "Tus eventos",
    youHave: "Tienes",
    registered: "registrado",
    registeredPlural: "registrados",
    confirmed: "confirmados",
    photos: "fotos",
    wishes: "deseos",
    totalAttendees: "Asistentes",
    noEvents: "Aún no has creado ningún evento",
    noEventsSub:
      "Empieza creando tu primer evento para gestionar invitados, fotos y recuerdos en un solo lugar.",
    createFirst: "Crear mi primer evento",
    details: "Ver detalles",
    hideDetails: "Ocultar detalles",
    tomorrow: "Mañana",
    past: "Finalizado",
    days: "días",
    confirmation: "Confirmación",
    guestList: "Invitados",
    viewAll: "Ver todos",
    noGuests: "Sin invitados aún",
    wall: "Muro",
    book: "Libro",
    tables: "Mesas",
    settings: "Configurar",
    thanks: "Gracias",
    scanner: "Escáner",
    manage: "Gestionar",
    delete: "Eliminar",
    deleteConfirm: "¿Eliminar este evento y todos sus datos?",
    moreActions: "Más acciones",
    less: "Menos",
    summary: "Resumen",
    adminPanel: "Panel administrador",
    statePend: "Pendiente",
    stateConf: "Confirmado",
    stateDecl: "Declinó",
  },
  en: {
    hello: "Hello",
    signOut: "Sign out",
    newEvent: "New event",
    events: "events",
    eventSingular: "event",
    yourEvents: "Your events",
    youHave: "You have",
    registered: "registered",
    registeredPlural: "registered",
    confirmed: "confirmed",
    photos: "photos",
    wishes: "wishes",
    totalAttendees: "Attendees",
    noEvents: "You haven't created any events yet",
    noEventsSub:
      "Start by creating your first event to manage guests, photos and memories in one place.",
    createFirst: "Create my first event",
    details: "View details",
    hideDetails: "Hide details",
    tomorrow: "Tomorrow",
    past: "Finished",
    days: "days",
    confirmation: "Confirmation",
    guestList: "Guests",
    viewAll: "View all",
    noGuests: "No guests yet",
    wall: "Wall",
    book: "Book",
    tables: "Tables",
    settings: "Settings",
    thanks: "Thanks",
    scanner: "Scanner",
    manage: "Manage",
    delete: "Delete",
    deleteConfirm: "Delete this event and all its data?",
    moreActions: "More actions",
    less: "Less",
    summary: "Summary",
    adminPanel: "Admin panel",
    statePend: "Pending",
    stateConf: "Confirmed",
    stateDecl: "Declined",
  },
};

// ─── Logo ──────────────────────────────────────────────────────────────────────
function AppLogo({ size = 32 }: { size?: number }) {
  const uid = `dlg-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#312E81" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill={`url(#${uid}-bg)`} />
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="16"
        fill="none"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1.2"
      />
      <rect x="13" y="14" width="6" height="36" rx="3" fill="#FFFFFF" />
      <rect x="13" y="14" width="24" height="6" rx="3" fill="#FFFFFF" />
      <rect x="13" y="29" width="18" height="6" rx="3" fill="#FFFFFF" />
      <rect x="13" y="44" width="24" height="6" rx="3" fill="#FFFFFF" />
      <circle cx="48" cy="19" r="3" fill="#E0E7FF" />
      <circle cx="48" cy="19" r="1.4" fill="#FFFFFF" />
      <circle cx="47" cy="46" r="2.5" fill="#FFFFFF" opacity="0.7" />
    </svg>
  );
}

// ─── Ornament divider ──────────────────────────────────────────────────────────
function Ornament({ width = 120 }: { width?: number }) {
  const cx = width / 2;
  return (
    <svg
      width={width}
      height="14"
      viewBox={`0 0 ${width} 14`}
      fill="none"
      aria-hidden="true"
    >
      <line
        x1="0"
        y1="7"
        x2={cx - 10}
        y2="7"
        stroke="currentColor"
        strokeWidth="0.7"
        opacity="0.55"
      />
      <path
        d={`M${cx} 2 L${cx + 2} 6.5 L${cx + 6} 7 L${cx + 2} 7.5 L${cx} 12 L${cx - 2} 7.5 L${cx - 6} 7 L${cx - 2} 6.5 Z`}
        fill="currentColor"
        opacity="0.75"
      />
      <line
        x1={cx + 10}
        y1="7"
        x2={width}
        y2="7"
        stroke="currentColor"
        strokeWidth="0.7"
        opacity="0.55"
      />
    </svg>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────
type IconProps = { size?: number };
const Icon = {
  calendar: ({ size = 14 }: IconProps = {}) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <rect x="2" y="3" width="16" height="15" rx="2" />
      <path d="M2 8h16M7 1v4M13 1v4" />
    </svg>
  ),
  location: ({ size = 14 }: IconProps = {}) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <path d="M10 2a6 6 0 016 6c0 5-6 10-6 10S4 13 4 8a6 6 0 016-6z" />
      <circle cx="10" cy="8" r="2" />
    </svg>
  ),
  users: ({ size = 14 }: IconProps = {}) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <path d="M13 15c0-2.2-1.3-4-3-4s-3 1.8-3 4M7 7a3 3 0 106 0 3 3 0 00-6 0M16 15c0-1.8-1-3.3-2.5-4M17 6.5a2.5 2.5 0 010 5" />
    </svg>
  ),
  book: ({ size = 14 }: IconProps = {}) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <path d="M4 2h10a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2zM8 2v16" />
    </svg>
  ),
  mail: ({ size = 14 }: IconProps = {}) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <rect x="2" y="4" width="16" height="13" rx="2" />
      <path d="M2 7l8 5 8-5" />
    </svg>
  ),
  wall: ({ size = 14 }: IconProps = {}) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <rect x="2" y="2" width="7" height="7" rx="1" />
      <rect x="11" y="2" width="7" height="7" rx="1" />
      <rect x="2" y="11" width="7" height="7" rx="1" />
      <rect x="11" y="11" width="7" height="7" rx="1" />
    </svg>
  ),
  table: ({ size = 14 }: IconProps = {}) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <rect x="2" y="4" width="16" height="4" rx="1" />
      <path d="M5 8v8M15 8v8M8 8v8M12 8v8" />
    </svg>
  ),
  gear: ({ size = 14 }: IconProps = {}) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" />
    </svg>
  ),
  scanner: ({ size = 14 }: IconProps = {}) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <rect x="2" y="2" width="6" height="6" rx="1" />
      <rect x="12" y="2" width="6" height="6" rx="1" />
      <rect x="2" y="12" width="6" height="6" rx="1" />
      <path d="M12 12h6v6h-6z" />
    </svg>
  ),
  plus: ({ size = 14 }: IconProps = {}) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M10 4v12M4 10h12" />
    </svg>
  ),
  logout: ({ size = 14 }: IconProps = {}) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <path d="M13 10H3M13 10l-3-3M13 10l-3 3M7 4H4a2 2 0 00-2 2v8a2 2 0 002 2h3" />
    </svg>
  ),
  whatsapp: ({ size = 12 }: IconProps = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  ),
  copy: ({ size = 12 }: IconProps = {}) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="7" y="7" width="11" height="11" rx="2" />
      <path d="M4 13H3a2 2 0 01-2-2V3a2 2 0 012-2h8a2 2 0 012 2v1" />
    </svg>
  ),
  chevron: ({ size = 12 }: IconProps = {}) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M5 8l5 5 5-5" />
    </svg>
  ),
};

// ─── Loading screen — editorial ─────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,500&family=DM+Sans:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#FAFBFF;font-family:'DM Sans',sans-serif}
        @keyframes dotPulse{0%,80%,100%{opacity:.18;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}
      `}</style>
      <main
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          background: "#FAFBFF",
          color: "#0F172A",
        }}
      >
        <AppLogo size={52} />
        <div
          style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: 30,
            letterSpacing: 6,
            color: "#0F172A",
            fontStyle: "italic",
            fontWeight: 400,
          }}
        >
          Eventix
        </div>
        <div style={{ display: "flex", gap: 8 }} aria-label="Cargando">
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#4F46E5",
              animation: "dotPulse 1.2s infinite ease-in-out",
            }}
          />
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#4F46E5",
              animation: "dotPulse 1.2s .2s infinite ease-in-out",
            }}
          />
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#4F46E5",
              animation: "dotPulse 1.2s .4s infinite ease-in-out",
            }}
          />
        </div>
      </main>
    </>
  );
}

// ─── Number badge ──────────────────────────────────────────────────────────────
function NumBadge({ n }: { n: number }) {
  return <span className="num-badge">{String(n).padStart(3, "0")}</span>;
}

// ─── State badge ───────────────────────────────────────────────────────────────
function EstadoBadge({
  estado,
  t,
}: {
  estado: string;
  t: typeof translations.es;
}) {
  const map: Record<string, { cls: string; label: string }> = {
    confirmado: { cls: "state-conf", label: t.stateConf },
    rechazado: { cls: "state-decl", label: t.stateDecl },
    pendiente: { cls: "state-pend", label: t.statePend },
  };
  const info = map[estado] ?? map.pendiente;
  return <span className={`state-badge ${info.cls}`}>{info.label}</span>;
}

// ─── Mini guest list ───────────────────────────────────────────────────────────
function MiniInvitados({
  eventoId,
  eventoNombre,
  lang,
  t,
}: {
  eventoId: string;
  eventoNombre: string;
  lang: "es" | "en";
  t: typeof translations.es;
}) {
  const [invitados, setInvitados] = useState<InvitadoResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("invitados")
      .select("id,nombre,telefono,estado,num_personas,token,created_at")
      .eq("evento_id", eventoId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) {
          setInvitados(data.map((inv, idx) => ({ ...inv, orden: idx + 1 })));
        }
        setLoading(false);
      });
  }, [eventoId]);

  function copiarLink(token: string) {
    const url = `${window.location.origin}/confirmar/${token}`;
    navigator.clipboard.writeText(url);
    setCopiado(token);
    setTimeout(() => setCopiado(null), 2000);
  }

  function abrirWhatsApp(inv: InvitadoResumen) {
    const link = `${window.location.origin}/confirmar/${inv.token}`;
    const msg =
      lang === "es"
        ? `*${eventoNombre}*\n\nHola ${inv.nombre}, te enviamos tu invitación personal.\n\nConfirmá tu asistencia aquí:\n${link}\n\n— Eventix`
        : `*${eventoNombre}*\n\nHi ${inv.nombre}, here is your personal invitation.\n\nConfirm your attendance here:\n${link}\n\n— Eventix`;
    const tel = inv.telefono?.replace(/\D/g, "") ?? "";
    window.open(
      `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  }

  if (loading) return <div className="guest-skeleton" aria-hidden="true" />;

  const visibles = expanded ? invitados : invitados.slice(0, 3);

  return (
    <section className="guest-section">
      <header className="guest-head">
        <span className="guest-head-title">
          {t.guestList}
          <em> · {invitados.length}</em>
        </span>
        <Link
          href={`/eventos/${eventoId}/invitados`}
          className="guest-head-all"
        >
          {t.viewAll}
        </Link>
      </header>

      {invitados.length === 0 ? (
        <p className="guest-empty">{t.noGuests}</p>
      ) : (
        <>
          <ul className="guest-list">
            {visibles.map((inv) => (
              <li key={inv.id} className="guest-row">
                <NumBadge n={inv.orden} />
                <div className="guest-avatar">
                  {inv.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="guest-info">
                  <span className="guest-name">{inv.nombre}</span>
                  {inv.telefono && (
                    <span className="guest-tel">{inv.telefono}</span>
                  )}
                </div>
                <EstadoBadge estado={inv.estado} t={t} />
                <div className="guest-actions">
                  <button
                    className="guest-btn guest-btn-wa"
                    title="WhatsApp"
                    onClick={() => abrirWhatsApp(inv)}
                  >
                    <Icon.whatsapp />
                  </button>
                  <button
                    className={`guest-btn ${copiado === inv.token ? "guest-btn-ok" : ""}`}
                    title="Copiar link"
                    onClick={() => copiarLink(inv.token)}
                  >
                    {copiado === inv.token ? "✓" : <Icon.copy />}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {invitados.length > 3 && (
            <button
              className="guest-toggle"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? t.less : `+ ${invitados.length - 3}`}
            </button>
          )}
        </>
      )}
    </section>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(true);
  const [eliminando, setElim] = useState<string | null>(null);
  const [lang, setLang] = useState<"es" | "en">("es");
  const [mounted, setMounted] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showStats, setShowStats] = useState(false);

  const t = translations[lang];

  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/auth/login");
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("nombre,es_admin")
      .eq("id", data.user.id)
      .single();
    if (profile) {
      setNombre(profile.nombre);
      setEsAdmin(!!profile.es_admin);
    }
  }

  async function cargarEventos() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("eventos")
      .select("*")
      .eq("organizador_id", user.id)
      .order("fecha", { ascending: true });
    if (data) {
      setEventos(data);
      await Promise.all(data.map((e: Evento) => cargarStats(e.id)));
    }
    setLoading(false);
  }

  async function cargarStats(eventoId: string) {
    const [invData, fotosData, deseosData] = await Promise.all([
      supabase
        .from("invitados")
        .select("estado,num_personas")
        .eq("evento_id", eventoId),
      supabase
        .from("fotos")
        .select("id", { count: "exact", head: true })
        .eq("evento_id", eventoId)
        .eq("estado", "aprobada"),
      supabase
        .from("deseos")
        .select("id", { count: "exact", head: true })
        .eq("evento_id", eventoId)
        .eq("aprobado", true),
    ]);
    if (invData.data) {
      const confirmados = invData.data.filter(
        (i) => i.estado === "confirmado",
      ).length;
      const declinados = invData.data.filter(
        (i) => i.estado === "rechazado",
      ).length;
      const pendientes = invData.data.filter(
        (i) => i.estado === "pendiente",
      ).length;
      const total_personas = invData.data
        .filter((i) => i.estado === "confirmado")
        .reduce((s, i) => s + (i.num_personas || 1), 0);
      setStats((prev) => ({
        ...prev,
        [eventoId]: {
          confirmados,
          declinados,
          pendientes,
          total_personas,
          total_fotos: fotosData.count ?? 0,
          total_deseos: deseosData.count ?? 0,
        },
      }));
    }
  }

  async function eliminarEvento(id: string) {
    if (!confirm(t.deleteConfirm)) return;
    setElim(id);
    await supabase.from("eventos").delete().eq("id", id);
    setEventos((prev) => prev.filter((e) => e.id !== id));
    setElim(null);
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push("/");
  }

  useEffect(() => {
    const svgFav = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="dfv" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#312E81"/><stop offset="100%" stop-color="#4F46E5"/></linearGradient></defs><rect width="64" height="64" rx="18" fill="url(%23dfv)"/><rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="1.2"/><rect x="13" y="14" width="6" height="36" rx="3" fill="#FFFFFF"/><rect x="13" y="14" width="24" height="6" rx="3" fill="#FFFFFF"/><rect x="13" y="29" width="18" height="6" rx="3" fill="#FFFFFF"/><rect x="13" y="44" width="24" height="6" rx="3" fill="#FFFFFF"/><circle cx="48" cy="19" r="3" fill="#E0E7FF"/><circle cx="48" cy="19" r="1.4" fill="#FFFFFF"/></svg>`;
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = `data:image/svg+xml,${encodeURIComponent(svgFav.trim())}`;
    document.head.appendChild(link);
    document.title = "Eventix — Dashboard";
    setTimeout(() => setMounted(true), 50);
    checkUser();
    cargarEventos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <LoadingScreen />;

  const hoy = new Date();
  const totConf = Object.values(stats).reduce((s, v) => s + v.confirmados, 0);
  const totFotos = Object.values(stats).reduce((s, v) => s + v.total_fotos, 0);
  const totDes = Object.values(stats).reduce((s, v) => s + v.total_deseos, 0);
  const totPersonas = Object.values(stats).reduce(
    (s, v) => s + v.total_personas,
    0,
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        :root{
          --bg:#FAFBFF;
          --paper:#FFFFFF;
          --paper-soft:#F4F5FB;
          --ink:#0F172A;
          --ink-soft:#475569;
          --ink-mute:#64748B;
          --rule:#E5E7F0;
          --rule-strong:#CBD5E1;
          --gold:#4F46E5;
          --gold-soft:rgba(79,70,229,0.06);
          --gold-mid:rgba(79,70,229,0.14);
          --gold-dark:#3730A3;
          --danger:#EF4444;
          --ok:#10B981;
          --warn:#F59E0B;
          --grad-primary:linear-gradient(135deg,#312E81 0%,#4F46E5 100%);
          --grad-secondary:linear-gradient(135deg,#4F46E5 0%,#6366F1 100%);
          --grad-warm:linear-gradient(135deg,#4F46E5 0%,#818CF8 100%);
          --grad-success:linear-gradient(135deg,#10B981 0%,#06B6D4 100%);
          --shadow-sm:0 2px 10px rgba(15,23,42,0.05);
          --shadow-md:0 6px 20px -4px rgba(15,23,42,0.10),0 2px 6px rgba(15,23,42,0.05);
          --shadow-btn:0 10px 30px -6px rgba(79,70,229,0.35),0 4px 12px rgba(79,70,229,0.15);
          --serif:'Cormorant Garamond',Georgia,serif;
          --sans:'DM Sans',-apple-system,sans-serif;
          --ease:cubic-bezier(.4,0,.2,1);
        }

        html,body{background:var(--bg);color:var(--ink);font-family:var(--sans);
          -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;
          overflow-x:hidden;width:100%}

        /* Paper grain */
        body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          opacity:.55;mix-blend-mode:multiply;}

        .page{min-height:100dvh;position:relative;z-index:1}

        /* ── Nav ── */
        .nav{position:sticky;top:env(safe-area-inset-top,0px);z-index:30;display:flex;align-items:center;justify-content:space-between;
          min-height:60px;
          padding-top:10px;
          padding-bottom:10px;
          padding-left:max(20px, env(safe-area-inset-left));
          padding-right:max(20px, env(safe-area-inset-right));
          background:rgba(255,255,255,0.88);
          backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
          border-bottom:1px solid var(--rule);
          box-sizing:border-box;}
        .nav-brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit}
        .nav-brand-name{font-family:var(--serif);font-size:22px;font-weight:500;letter-spacing:2px;line-height:1;color:var(--ink);font-style:italic}
        .nav-actions{display:flex;align-items:center;gap:6px}
        .ctrl{height:34px;min-width:40px;padding:0 12px;border:1px solid var(--rule-strong);border-radius:100px;background:transparent;color:var(--ink-soft);font-family:var(--sans);font-size:10.5px;letter-spacing:1.4px;text-transform:uppercase;font-weight:600;cursor:pointer;transition:all .25s var(--ease);display:flex;align-items:center;justify-content:center;gap:5px;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
        .ctrl:hover{background:var(--ink);color:var(--paper);border-color:var(--ink)}
        .ctrl-danger:hover{background:var(--danger);border-color:var(--danger);color:var(--paper)}

        /* ── Content ── */
        .content{max-width:640px;margin:0 auto;padding:32px 20px max(96px, calc(env(safe-area-inset-bottom) + 60px));position:relative;z-index:1}

        /* ── Greeting ── */
        .greeting{margin-bottom:28px;display:flex;flex-direction:column;gap:6px}
        .greeting-row{display:inline-flex;align-items:baseline;gap:10px;flex-wrap:wrap}
        .greeting-hello{font-family:var(--sans);font-size:clamp(22px,4.5vw,28px);font-weight:700;color:var(--ink);line-height:1.15;letter-spacing:-.5px}
        .greeting-name{font-family:var(--sans);font-size:clamp(22px,4.5vw,28px);font-weight:700;color:var(--ink);line-height:1.15;letter-spacing:-.5px;word-break:break-word;max-width:100%}
        .greeting-name.is-email{
          font-size:clamp(15px,3.2vw,18px);
          font-weight:600;
          color:var(--ink-soft);
          letter-spacing:-.2px;
          word-break:break-all;
        }
        .greeting-name em{font-style:normal}
        .greeting-sub{font-family:var(--sans);font-size:14px;color:var(--ink-soft);line-height:1.5;font-weight:400;max-width:42ch;margin-top:4px}

        /* ── Global stats line ── */
        .stats-line{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:28px 0 36px;padding:22px 0;border-top:1px solid var(--rule-strong);border-bottom:1px solid var(--rule-strong)}
        .stat-chunk{display:flex;flex-direction:column;gap:4px;text-align:left}
        .stat-chunk-val{font-family:var(--serif);font-size:clamp(24px,5.2vw,28px);font-weight:500;color:var(--ink);line-height:1;letter-spacing:-.5px;font-variant-numeric:tabular-nums}
        .stat-chunk-label{font-family:var(--sans);font-size:9.5px;font-weight:600;color:var(--ink-mute);letter-spacing:1.3px;text-transform:uppercase}

        /* ── CTA outlined with ink fill ── */
        .cta{display:inline-flex;align-items:center;justify-content:center;gap:10px;text-decoration:none;
          background:transparent;color:var(--ink);border:1px solid var(--ink);
          padding:16px 24px;font-family:var(--sans);font-size:11.5px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;
          transition:color .3s var(--ease);-webkit-tap-highlight-color:transparent;min-height:52px;
          position:relative;overflow:hidden;width:100%;}
        .cta::before{content:'';position:absolute;inset:0;background:var(--ink);transform:translateY(101%);transition:transform .35s var(--ease);z-index:0}
        .cta:hover::before{transform:translateY(0)}
        .cta > *{position:relative;z-index:1}
        .cta:hover{color:var(--paper)}
        .cta-inline{display:inline-flex;width:auto}
        .cta-wrap{margin-bottom:48px}

        /* ── Events section header ── */
        .events-head{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:22px;padding-bottom:14px;border-bottom:1px solid var(--rule-strong)}
        .events-head-title{font-family:var(--serif);font-style:italic;font-size:26px;font-weight:500;color:var(--ink);letter-spacing:.3px;line-height:1}
        .events-head-count{font-family:var(--serif);font-size:14px;color:var(--ink-mute);font-style:italic;letter-spacing:.3px}

        /* ── Event list ── */
        .event-list{display:flex;flex-direction:column;gap:40px}

        /* ── Event card — paper / invitation ── */
        .event-card{background:var(--paper);border:1px solid var(--rule);border-radius:2px;overflow:hidden;
          box-shadow:0 1px 2px rgba(15,23,42,.04),0 18px 48px -24px rgba(15,23,42,.28);
          transition:box-shadow .35s var(--ease),transform .35s var(--ease);}
        .event-card:hover{box-shadow:0 2px 4px rgba(15,23,42,.05),0 22px 56px -20px rgba(15,23,42,.34);transform:translateY(-2px)}

        /* Cover */
        .event-cover{position:relative;aspect-ratio:4/3;width:100%;overflow:hidden;background:var(--paper-soft);display:flex;align-items:center;justify-content:center;color:var(--gold)}
        .event-cover img{width:100%;height:100%;object-fit:contain;object-position:center;display:block}
        .event-cover::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,rgba(15,23,42,.12) 100%);pointer-events:none}
        .event-chip{position:absolute;top:14px;left:14px;z-index:2;display:inline-flex;align-items:center;gap:5px;
          padding:5px 12px;background:rgba(253,250,244,.94);
          backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
          font-family:var(--serif);font-style:italic;font-size:13px;font-weight:500;color:var(--ink-soft);letter-spacing:.3px;
          border-radius:100px;border:1px solid var(--rule);box-shadow:0 1px 3px rgba(0,0,0,.04)}
        .event-chip.chip-tomorrow{color:var(--ok);border-color:rgba(63,122,78,.25)}
        .event-chip.chip-soon{color:var(--warn);border-color:rgba(160,115,43,.25)}
        .event-chip.chip-past{color:var(--ink-mute);opacity:.85}

        /* Event header text */
        .event-body{padding:26px 22px 22px}
        .event-type{font-family:var(--serif);font-style:italic;font-size:12px;font-weight:500;color:var(--gold);
          letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;display:block}
        .event-name{font-family:var(--serif);font-size:clamp(26px,7vw,32px);font-weight:500;color:var(--ink);
          line-height:1.1;letter-spacing:-.5px;margin-bottom:16px;word-wrap:break-word}
        .event-meta{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;font-family:var(--sans);font-size:11px;font-weight:600;
          color:var(--ink-soft);letter-spacing:1.1px;text-transform:uppercase}
        .event-meta-item{display:inline-flex;align-items:center;gap:6px}
        .event-meta-item svg{color:var(--gold);flex-shrink:0}
        .event-meta-dot{color:var(--rule-strong);margin:0 2px}

        /* Progress */
        .event-progress{margin-top:24px;padding-top:20px;border-top:1px solid var(--rule)}
        .progress-head{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:10px;gap:8px}
        .progress-title{font-family:var(--serif);font-style:italic;font-size:16px;color:var(--ink);font-weight:500}
        .progress-nums{font-family:var(--serif);font-size:17px;color:var(--ink-soft);font-weight:500;font-variant-numeric:tabular-nums;letter-spacing:-.2px}
        .progress-nums em{font-style:italic;color:var(--gold);font-weight:500}
        .progress-pct{font-family:var(--serif);font-style:italic;font-size:12px;color:var(--ink-mute);letter-spacing:1.2px;text-transform:uppercase;margin-top:6px;display:block}
        .progress-track{height:2px;background:var(--rule);overflow:hidden;border-radius:99px}
        .progress-fill{height:100%;background:linear-gradient(90deg,var(--gold) 0%,#D4B082 100%);transition:width .9s var(--ease);border-radius:99px}

        /* Primary quick links — 4 */
        .primary-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-top:1px solid var(--rule);background:var(--paper)}
        .pa-link{display:flex;flex-direction:column;align-items:center;gap:7px;padding:16px 4px;text-decoration:none;color:var(--ink-soft);font-family:var(--sans);font-size:10px;font-weight:600;letter-spacing:1.3px;text-transform:uppercase;border-right:1px solid var(--rule);transition:all .2s var(--ease);background:transparent;position:relative;-webkit-tap-highlight-color:transparent;min-height:64px}
        .pa-link:last-child{border-right:none}
        .pa-link:hover{background:var(--paper-soft);color:var(--ink)}
        .pa-link svg{color:var(--gold);transition:transform .2s var(--ease)}
        .pa-link:hover svg{transform:scale(1.08)}
        .secondary-row{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);background:var(--paper-soft)}
        .sr-link{display:flex;flex-direction:column;align-items:center;gap:5px;padding:11px 4px;text-decoration:none;color:var(--ink-mute);font-family:var(--sans);font-size:9.5px;font-weight:600;letter-spacing:1.3px;text-transform:uppercase;border-right:1px solid var(--rule);transition:all .2s var(--ease);background:transparent;-webkit-tap-highlight-color:transparent;min-height:50px;position:relative}
        .sr-link:last-child{border-right:none}
        .sr-link:hover{background:var(--paper);color:var(--ink)}
        .sr-link svg{color:var(--gold);transition:transform .2s var(--ease)}
        .sr-link:hover svg{color:var(--gold);transform:scale(1.08)}
        .sr-dot{position:absolute;top:8px;right:calc(50% - 10px);width:5px;height:5px;background:var(--gold);border-radius:50%}
        .pa-badge{position:absolute;top:10px;right:10px;width:5px;height:5px;background:var(--gold);border-radius:50%}

        /* Expand / details */
        .expand-wrap{padding:0}
        .expand-btn{width:100%;background:transparent;border:none;padding:14px 22px;font-family:var(--serif);font-style:italic;font-size:14.5px;color:var(--ink-soft);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;-webkit-tap-highlight-color:transparent;transition:color .2s;letter-spacing:.2px;border-bottom:1px solid transparent}
        .expand-btn:hover{color:var(--gold)}
        .expand-btn svg{transition:transform .3s var(--ease)}
        .expand-btn.open svg{transform:rotate(180deg)}
        .expand-btn.open{border-bottom-color:var(--rule)}

        /* Details panel */
        .details{padding:20px 22px 22px;background:var(--paper);animation:fadeSlide .35s var(--ease)}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        .details-section{margin-bottom:26px}
        .details-section:last-child{margin-bottom:0}
        .details-head{font-family:var(--serif);font-style:italic;font-size:13px;color:var(--ink-mute);letter-spacing:2.6px;text-transform:uppercase;margin-bottom:14px;font-weight:500;display:flex;align-items:center;gap:10px}
        .details-head::after{content:'';flex:1;height:1px;background:var(--rule)}

        /* Stats line in details */
        .stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:16px 14px}
        .stat-row-item{display:flex;flex-direction:column;gap:0}
        .stat-row-val{font-family:var(--serif);font-size:24px;font-weight:500;color:var(--ink);line-height:1;font-variant-numeric:tabular-nums;letter-spacing:-.3px}
        .stat-row-val.sv-pend{color:var(--warn)}
        .stat-row-val.sv-decl{color:var(--danger)}
        .stat-row-val.sv-ok{color:var(--ok)}
        .stat-row-label{font-family:var(--sans);font-size:9.5px;color:var(--ink-mute);letter-spacing:1.3px;text-transform:uppercase;font-weight:600;margin-top:5px}

        /* Secondary actions */
        .secondary-actions{display:flex;flex-wrap:wrap;gap:16px 20px}
        .sa-link{display:inline-flex;align-items:center;gap:6px;color:var(--ink-soft);text-decoration:none;font-family:var(--sans);font-size:11px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;padding-bottom:3px;border-bottom:1px solid var(--rule-strong);transition:all .2s var(--ease)}
        .sa-link:hover{color:var(--ink);border-bottom-color:var(--ink)}
        .sa-link svg{color:var(--gold)}

        /* Manage / Delete */
        .card-actions{display:flex;align-items:center;justify-content:space-between;padding:16px 22px;border-top:1px solid var(--rule);background:var(--paper-soft)}
        .btn-manage{display:inline-flex;align-items:center;gap:8px;text-decoration:none;color:var(--ink);
          font-family:var(--sans);font-size:11.5px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;
          padding-bottom:4px;border-bottom:1.5px solid var(--ink);transition:all .25s var(--ease);-webkit-tap-highlight-color:transparent;min-height:34px}
        .btn-manage:hover{color:var(--gold);border-color:var(--gold)}
        .btn-manage svg{transition:transform .25s var(--ease);display:inline-block}
        .btn-manage:hover svg{transform:translateX(3px)}
        .btn-del{background:none;border:none;padding:8px 4px;cursor:pointer;color:var(--ink-mute);transition:color .2s var(--ease);display:flex;align-items:center;gap:5px;font-family:var(--sans);font-size:10.5px;letter-spacing:1.2px;text-transform:uppercase;font-weight:600;-webkit-tap-highlight-color:transparent;min-height:34px}
        .btn-del:hover:not(:disabled){color:var(--danger)}
        .btn-del:disabled{opacity:.35;cursor:not-allowed}

        /* Guest list inside details */
        .guest-section{margin:0}
        .guest-head{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px}
        .guest-head-title{font-family:var(--serif);font-style:italic;font-size:15px;color:var(--ink);font-weight:500}
        .guest-head-title em{color:var(--gold);font-style:italic;font-weight:500;letter-spacing:.3px}
        .guest-head-all{font-family:var(--sans);font-size:10px;letter-spacing:1.4px;text-transform:uppercase;font-weight:600;color:var(--ink-mute);text-decoration:none;border-bottom:1px solid var(--rule-strong);padding-bottom:2px;transition:all .2s}
        .guest-head-all:hover{color:var(--ink);border-color:var(--ink)}
        .guest-skeleton{height:50px;background:linear-gradient(90deg,var(--paper-soft) 0%,var(--paper) 50%,var(--paper-soft) 100%);background-size:200% 100%;animation:shimmer 1.6s infinite;border-radius:2px}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        .guest-empty{font-family:var(--serif);font-style:italic;font-size:14px;color:var(--ink-mute);text-align:center;padding:18px 0}
        .guest-list{list-style:none;display:flex;flex-direction:column}
        .guest-row{display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid var(--rule)}
        .guest-row:last-child{border-bottom:none}
        .num-badge{font-family:var(--serif);font-style:italic;font-size:14px;color:var(--gold);font-variant-numeric:tabular-nums;min-width:36px;font-weight:500;letter-spacing:.3px}
        .guest-avatar{width:32px;height:32px;border-radius:50%;background:var(--paper-soft);border:1px solid var(--gold-mid);color:var(--ink);font-family:var(--serif);font-size:15px;font-weight:500;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .guest-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
        .guest-name{font-family:var(--sans);font-size:13px;font-weight:600;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .guest-tel{font-family:var(--sans);font-size:10.5px;color:var(--ink-mute)}
        .state-badge{font-family:var(--sans);font-size:8.5px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;padding:3px 8px;border-radius:100px;border:1px solid transparent;flex-shrink:0}
        .state-conf{background:transparent;color:var(--ok);border-color:rgba(63,122,78,.28)}
        .state-pend{background:transparent;color:var(--warn);border-color:rgba(160,115,43,.28)}
        .state-decl{background:transparent;color:var(--danger);border-color:rgba(155,44,44,.24)}
        .guest-actions{display:flex;gap:4px;flex-shrink:0}
        .guest-btn{width:30px;height:30px;border-radius:50%;border:1px solid var(--rule-strong);background:var(--paper);color:var(--ink-soft);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s var(--ease);-webkit-tap-highlight-color:transparent}
        .guest-btn:hover{background:var(--ink);color:var(--paper);border-color:var(--ink)}
        .guest-btn-wa{color:#128C7E;border-color:rgba(18,140,126,.3)}
        .guest-btn-wa:hover{background:#128C7E;color:var(--paper);border-color:#128C7E}
        .guest-btn-ok{color:var(--ok);border-color:rgba(63,122,78,.4);font-size:14px;font-weight:700}
        .guest-toggle{width:100%;margin-top:10px;padding:10px;background:transparent;border:1px dashed var(--rule-strong);cursor:pointer;font-family:var(--serif);font-style:italic;font-size:13px;color:var(--ink-soft);transition:all .2s var(--ease);-webkit-tap-highlight-color:transparent;letter-spacing:.3px;border-radius:2px}
        .guest-toggle:hover{background:var(--paper-soft);border-color:var(--ink-mute);color:var(--ink)}

        /* Empty state */
        .empty{text-align:center;padding:60px 28px;border:1px solid var(--rule);border-radius:2px;background:var(--paper);margin-top:8px;box-shadow:0 1px 3px rgba(15,23,42,.03)}
        .empty-orn{display:flex;justify-content:center;margin-bottom:26px;color:var(--gold)}
        .empty-title{font-family:var(--serif);font-style:italic;font-size:26px;font-weight:500;color:var(--ink);line-height:1.25;margin-bottom:12px;max-width:22ch;margin-left:auto;margin-right:auto;letter-spacing:-.3px}
        .empty-sub{font-family:var(--sans);font-size:14px;color:var(--ink-mute);line-height:1.65;max-width:38ch;margin:0 auto 28px;font-weight:400}

        /* Footer */
        .footer-line{display:flex;justify-content:center;margin-top:60px;color:var(--gold);opacity:.5}
        .footer-admin{display:block;text-align:center;margin-top:24px;font-family:var(--sans);font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:var(--ink-mute);text-decoration:none;font-weight:600;transition:color .2s}
        .footer-admin:hover{color:var(--ink)}
        .footer-copy{text-align:center;margin-top:18px;font-family:var(--serif);font-style:italic;font-size:13px;color:var(--ink-mute);opacity:.7;letter-spacing:1px}

        /* Animations */
        .anim-in{opacity:0;transform:translateY(14px)}
        .mounted .anim-in{animation:mountIn .65s cubic-bezier(.22,1,.36,1) both}
        .mounted .d1{animation-delay:.04s}
        .mounted .d2{animation-delay:.12s}
        .mounted .d3{animation-delay:.20s}
        .mounted .d4{animation-delay:.28s}
        @keyframes mountIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}

        /* Smaller phones */
        @media (max-width: 380px){
          .content{padding:24px 16px 80px}
          .event-body{padding:22px 18px 18px}
          .expand-btn{padding:14px 18px}
          .details{padding:20px 18px}
          .card-actions{padding:14px 18px}
          .stats-line{grid-template-columns:repeat(2,1fr);gap:14px 16px}
          .stat-row{grid-template-columns:repeat(2,1fr);gap:14px 12px}
        }
        @media (max-width: 340px){
          .primary-actions{grid-template-columns:repeat(2,1fr)}
          .pa-link:nth-child(1),.pa-link:nth-child(2){border-bottom:1px solid var(--rule)}
          .pa-link:nth-child(2){border-right:none}
          .pa-link:nth-child(4){border-right:none}
          .secondary-row{grid-template-columns:repeat(3,1fr)}
        }
      `}</style>

      <div className={`page${mounted ? " mounted" : ""}`}>
        {/* ── NAV ── */}
        <nav className="nav">
          <Link href="/dashboard" className="nav-brand">
            <AppLogo size={32} />
            <div className="nav-brand-name">Eventix</div>
          </Link>
          <div className="nav-actions">
            <button
              className="ctrl"
              onClick={() => setLang(lang === "es" ? "en" : "es")}
              title="Toggle language"
              aria-label="Toggle language"
            >
              {lang === "es" ? "EN" : "ES"}
            </button>
            <button
              className="ctrl ctrl-danger"
              onClick={cerrarSesion}
              title={t.signOut}
              aria-label={t.signOut}
            >
              <Icon.logout />
            </button>
          </div>
        </nav>

        {/* ── CONTENT ── */}
        <div className="content">
          {/* Greeting */}
          {nombre && (() => {
            const looksLikeEmail = nombre.includes("@");
            const displayName = looksLikeEmail
              ? nombre.split("@")[0]
              : nombre.split(" ")[0];
            const prettyName = looksLikeEmail
              ? displayName
                  .replace(/[._-]+/g, " ")
                  .replace(/\d+/g, "")
                  .trim()
              : displayName;
            const finalName = prettyName || displayName;
            return (
              <header className="greeting anim-in d1">
                <div className="greeting-row">
                  <span className="greeting-hello">{t.hello},</span>
                  <span
                    className={`greeting-name${looksLikeEmail && finalName === displayName ? " is-email" : ""}`}
                  >
                    {finalName}
                  </span>
                </div>
                <p className="greeting-sub">
                  {lang === "es"
                    ? `${t.youHave} ${eventos.length} ${eventos.length === 1 ? t.eventSingular : t.events} ${eventos.length === 1 ? t.registered : t.registeredPlural} en tu agenda.`
                    : `${t.youHave} ${eventos.length} ${eventos.length === 1 ? t.eventSingular : t.events} ${t.registered} on your calendar.`}
                </p>
              </header>
            );
          })()}

          {/* Resumen global — botón que despliega stats */}
          {eventos.length > 0 && (
            <div className="anim-in d2" style={{margin:"20px 0 32px"}}>
              <button
                onClick={() => setShowStats(s => !s)}
                style={{
                  display:"flex",alignItems:"center",gap:10,
                  background:"transparent",border:"1px solid var(--rule-strong)",
                  borderRadius:12,padding:"12px 18px",cursor:"pointer",
                  fontFamily:"var(--sans)",fontSize:13,fontWeight:600,
                  color:"var(--ink-soft)",transition:"all .2s",width:"100%",
                  justifyContent:"space-between",
                }}
              >
                <span style={{display:"flex",alignItems:"center",gap:8}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  {lang === "es" ? "Ver resumen global" : "View global summary"}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  style={{transition:"transform .25s",transform:showStats?"rotate(180deg)":"rotate(0deg)"}}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              {showStats && (
                <div className="stats-line" style={{marginTop:0,borderRadius:"0 0 12px 12px",border:"1px solid var(--rule-strong)",borderTop:"none",padding:"18px 18px 18px",background:"var(--paper)"}}>
                  <div className="stat-chunk">
                    <span className="stat-chunk-val">{totPersonas}</span>
                    <span className="stat-chunk-label">{t.totalAttendees}</span>
                  </div>
                  <div className="stat-chunk">
                    <span className="stat-chunk-val">{totConf}</span>
                    <span className="stat-chunk-label">{t.confirmed}</span>
                  </div>
                  <div className="stat-chunk">
                    <span className="stat-chunk-val">{totFotos}</span>
                    <span className="stat-chunk-label">{t.photos}</span>
                  </div>
                  <div className="stat-chunk">
                    <span className="stat-chunk-val">{totDes}</span>
                    <span className="stat-chunk-label">{t.wishes}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="cta-wrap anim-in d3">
            <Link href="/eventos/nuevo" className="cta">
              <Icon.plus />
              <span>{t.newEvent}</span>
            </Link>
          </div>

          {/* Empty state or event list */}
          {eventos.length === 0 ? (
            <div className="empty anim-in d4">
              <div className="empty-orn">
                <Ornament width={110} />
              </div>
              <h2 className="empty-title">{t.noEvents}</h2>
              <p className="empty-sub">{t.noEventsSub}</p>
              <Link href="/eventos/nuevo" className="cta cta-inline">
                <Icon.plus />
                <span>{t.createFirst}</span>
              </Link>
            </div>
          ) : (
            <>
              <div className="events-head anim-in d4">
                <div className="events-head-title">{t.yourEvents}</div>
                <div className="events-head-count">
                  {eventos.length}{" "}
                  {eventos.length === 1 ? t.eventSingular : t.events}
                </div>
              </div>

              <div className="event-list anim-in d4">
                {eventos.map((evento) => {
                  const s = stats[evento.id];
                  const tipo = TIPO_CONFIG[evento.tipo] || TIPO_CONFIG.otro;
                  const total = s
                    ? s.confirmados + s.declinados + s.pendientes
                    : 0;
                  const pct =
                    s && total > 0
                      ? Math.round((s.confirmados / total) * 100)
                      : 0;
                  const esPasado = new Date(evento.fecha) < hoy;
                  const dias = Math.ceil(
                    (new Date(evento.fecha).getTime() - hoy.getTime()) /
                      86400000,
                  );
                  const tipoLabel = lang === "es" ? tipo.label : tipo.labelEn;
                  const isOpen = !!expanded[evento.id];

                  let chipText = "";
                  let chipCls = "";
                  if (esPasado) {
                    chipText = t.past;
                    chipCls = "chip-past";
                  } else if (dias === 1) {
                    chipText = t.tomorrow;
                    chipCls = "chip-tomorrow";
                  } else if (dias > 1 && dias <= 7) {
                    chipText = `${dias} ${t.days}`;
                    chipCls = "chip-soon";
                  }

                  return (
                    <article key={evento.id} className="event-card">
                      {/* Cover */}
                      <div className="event-cover">
                        {evento.imagen_url ? (
                          <img
                            src={evento.imagen_url}
                            alt=""
                            loading="lazy"
                          />
                        ) : (
                          <Ornament width={160} />
                        )}
                        {chipText && (
                          <span className={`event-chip ${chipCls}`}>
                            {chipText}
                          </span>
                        )}
                      </div>

                      {/* Body */}
                      <div className="event-body">
                        <span className="event-type">— {tipoLabel} —</span>
                        <h2 className="event-name">{evento.nombre}</h2>
                        <div className="event-meta">
                          <span className="event-meta-item">
                            <Icon.calendar size={12} />
                            {new Date(evento.fecha).toLocaleDateString(
                              lang === "es" ? "es-ES" : "en-US",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )}
                          </span>
                          <span className="event-meta-dot">·</span>
                          <span className="event-meta-item">
                            <Icon.location size={12} />
                            {evento.lugar}
                          </span>
                        </div>

                        {/* Progress */}
                        {s && total > 0 && (
                          <div className="event-progress">
                            <div className="progress-head">
                              <span className="progress-title">
                                {t.confirmation}
                              </span>
                              <span className="progress-nums">
                                {s.confirmados} <em>/ {total}</em>
                              </span>
                            </div>
                            <div className="progress-track">
                              <div
                                className="progress-fill"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="progress-pct">{pct}%</span>
                          </div>
                        )}
                      </div>

                      {/* Primary actions */}
                      <div className="primary-actions">
                        <Link href={`/eventos/${evento.id}/invitados`} className="pa-link">
                          <Icon.users />
                          {t.guestList}
                        </Link>
                        <Link href={`/muro/${evento.id}`} className="pa-link">
                          <Icon.wall />
                          {t.wall}
                        </Link>
                        <Link href={`/eventos/${evento.id}/mesas`} className="pa-link">
                          <Icon.table />
                          {t.tables}
                        </Link>
                        <Link href={`/eventos/${evento.id}/configurar`} className="pa-link">
                          <Icon.gear />
                          {t.settings}
                        </Link>
                      </div>

                      {/* Secondary actions — siempre visibles */}
                      <div className="secondary-row">
                        <Link href={`/libro/${evento.id}`} className="sr-link">
                          <Icon.book />
                          {t.book}
                        </Link>
                        <Link href={`/eventos/${evento.id}/agradecimientos`} className="sr-link">
                          <Icon.mail />
                          {t.thanks}
                          {evento.agradecimiento_enviado && <span className="sr-dot" />}
                        </Link>
                        <Link href={`/eventos/${evento.id}/scanner`} className="sr-link">
                          <Icon.scanner />
                          {t.scanner}
                        </Link>
                      </div>

                      {/* Expand */}
                      <div className="expand-wrap">
                        <button
                          className={`expand-btn${isOpen ? " open" : ""}`}
                          onClick={() =>
                            setExpanded((p) => ({
                              ...p,
                              [evento.id]: !p[evento.id],
                            }))
                          }
                          aria-expanded={isOpen}
                        >
                          {isOpen ? t.hideDetails : t.details}
                          <Icon.chevron size={11} />
                        </button>
                      </div>

                      {/* Details panel */}
                      {isOpen && s && (
                        <div className="details">
                          <div className="details-section">
                            <div className="details-head">{t.summary}</div>
                            <div className="stat-row">
                              <div className="stat-row-item">
                                <span className="stat-row-val sv-ok">
                                  {s.confirmados}
                                </span>
                                <span className="stat-row-label">
                                  {t.stateConf}
                                </span>
                              </div>
                              <div className="stat-row-item">
                                <span className="stat-row-val sv-pend">
                                  {s.pendientes}
                                </span>
                                <span className="stat-row-label">
                                  {t.statePend}
                                </span>
                              </div>
                              <div className="stat-row-item">
                                <span className="stat-row-val sv-decl">
                                  {s.declinados}
                                </span>
                                <span className="stat-row-label">
                                  {t.stateDecl}
                                </span>
                              </div>
                              <div className="stat-row-item">
                                <span className="stat-row-val">
                                  {s.total_personas}
                                </span>
                                <span className="stat-row-label">
                                  {t.totalAttendees}
                                </span>
                              </div>
                              <div className="stat-row-item">
                                <span className="stat-row-val">
                                  {s.total_fotos}
                                </span>
                                <span className="stat-row-label">
                                  {t.photos}
                                </span>
                              </div>
                              <div className="stat-row-item">
                                <span className="stat-row-val">
                                  {s.total_deseos}
                                </span>
                                <span className="stat-row-label">
                                  {t.wishes}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="details-section">
                            <MiniInvitados
                              eventoId={evento.id}
                              eventoNombre={evento.nombre}
                              lang={lang}
                              t={t}
                            />
                          </div>

                        </div>
                      )}

                      {/* Footer actions */}
                      <div className="card-actions">
                        <Link
                          href={`/eventos/${evento.id}/invitados`}
                          className="btn-manage"
                        >
                          {t.manage} <span aria-hidden="true">→</span>
                        </Link>
                        <button
                          className="btn-del"
                          onClick={() => eliminarEvento(evento.id)}
                          disabled={eliminando === evento.id}
                        >
                          {eliminando === evento.id ? "..." : t.delete}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          <div className="footer-line">
            <Ornament width={80} />
          </div>
          {esAdmin && (
            <Link href="/admin" className="footer-admin">
              {t.adminPanel}
            </Link>
          )}
          <p className="footer-copy">Eventix · Humb3rsec 2026</p>
        </div>
      </div>
    </>
  );
}
