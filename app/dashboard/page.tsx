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

// Invitado con número de orden
type InvitadoResumen = {
  id: string;
  nombre: string;
  telefono: string | null;
  estado: string;
  num_personas: number;
  token: string;
  orden: number; // #001, #002 ... basado en created_at
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
    dashboard: "Dashboard",
    nuevo: "Nuevo",
    salir: "Salir",
    eventos: "Eventos",
    confirmados: "Confirm.",
    fotos: "Fotos",
    deseos: "Deseos",
    asistentes: "Asistentes",
    crearEvento: "Crear nuevo evento",
    sinEventos: "Sin eventos todavía",
    sinEventosSub: "Crea tu primer evento para comenzar",
    confirm2: "Confirm.",
    pend: "Pend.",
    declin: "Declin.",
    personas: "personas",
    confirmacion: "Confirmación",
    verMuro: "Muro",
    invitados: "Invitados",
    libro: "Libro",
    agradecimientos: "Gracias",
    mesas: "Mesas",
    configurar: "Configurar",
    gestionar: "Gestionar",
    eliminar: "Eliminar",
    finalizad: "Finalizado",
    manana: "¡Mañana!",
    dias: "días",
    cargando: "Cargando...",
    elimConfirm: "¿Eliminar este evento y todos sus datos?",
    totalPersonas: "Total asistentes",
    verInvitados: "Ver todos",
    invitadosSin: "Sin invitados aún",
    num: "N°",
    estadoPend: "Pendiente",
    estadoConf: "Confirmado",
    estadoDecl: "Declinó",
  },
  en: {
    hello: "Hello",
    dashboard: "Dashboard",
    nuevo: "New",
    salir: "Sign out",
    eventos: "Events",
    confirmados: "Confirm.",
    fotos: "Photos",
    deseos: "Wishes",
    asistentes: "Attendees",
    crearEvento: "Create new event",
    sinEventos: "No events yet",
    sinEventosSub: "Create your first event to get started",
    confirm2: "Confirm.",
    pend: "Pend.",
    declin: "Declin.",
    personas: "people",
    confirmacion: "Confirmation",
    verMuro: "Wall",
    invitados: "Guests",
    libro: "Book",
    agradecimientos: "Thank-yous",
    mesas: "Tables",
    configurar: "Settings",
    gestionar: "Manage",
    eliminar: "Delete",
    finalizad: "Finished",
    manana: "Tomorrow!",
    dias: "days",
    cargando: "Loading...",
    elimConfirm: "Delete this event and all its data?",
    totalPersonas: "Total attendees",
    verInvitados: "View all",
    invitadosSin: "No guests yet",
    num: "No.",
    estadoPend: "Pending",
    estadoConf: "Confirmed",
    estadoDecl: "Declined",
  },
};

// ─── Logo ──────────────────────────────────────────────────────────────────────
function AppLogo({ size = 36 }: { size?: number }) {
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

// ─── Icons ─────────────────────────────────────────────────────────────────────
const Icon = {
  calendar: () => (
    <svg
      width="15"
      height="15"
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
      width="13"
      height="13"
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
  camera: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M2 7h2l2-3h8l2 3h2a1 1 0 011 1v9a1 1 0 01-1 1H2a1 1 0 01-1-1V8a1 1 0 011-1z" />
      <circle cx="10" cy="12" r="3" />
    </svg>
  ),
  heart: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M10 17S2 12 2 6.5A4.5 4.5 0 0110 4a4.5 4.5 0 018 2.5C18 12 10 17 10 17z" />
    </svg>
  ),
  book: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M4 2h10a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2zM8 2v16" />
    </svg>
  ),
  mail: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <rect x="2" y="4" width="16" height="13" rx="2" />
      <path d="M2 7l8 5 8-5" />
    </svg>
  ),
  wall: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <rect x="2" y="2" width="7" height="7" rx="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  ),
  settings: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" />
    </svg>
  ),
  table: () => (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <rect x="2" y="4" width="16" height="4" rx="1.5"/>
      <path d="M5 8v8M15 8v8M8 8v8M12 8v8"/>
    </svg>
  ),
  gear: () => (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="10" cy="10" r="2.5"/>
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4"/>
    </svg>
  ),
  trash: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M3 5h14M8 5V3h4v2M6 5l.5 12h7L14 5" />
    </svg>
  ),
  plus: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <path d="M10 4v12M4 10h12" />
    </svg>
  ),
  logout: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M13 10H3M13 10l-3-3M13 10l-3 3M7 4H4a2 2 0 00-2 2v8a2 2 0 002 2h3" />
    </svg>
  ),
  person: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <circle cx="10" cy="6" r="3.5" />
      <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" />
    </svg>
  ),
  whatsapp: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  ),
  copy: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    >
      <rect x="7" y="7" width="11" height="11" rx="2" />
      <path d="M4 13H3a2 2 0 01-2-2V3a2 2 0 012-2h8a2 2 0 012 2v1" />
    </svg>
  ),
  chevron: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M7 10l3 3 3-3" />
    </svg>
  ),
};

// ─── Particles ─────────────────────────────────────────────────────────────────
function Particles() {
  return (
    <div className="particles" aria-hidden="true">
      {[...Array(8)].map((_, i) => (
        <div key={i} className={`particle particle-${i + 1}`} />
      ))}
    </div>
  );
}

// ─── Loading screen ────────────────────────────────────────────────────────────
function LoadingScreen({ t }: { t: typeof translations.es }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{font-family:'DM Sans',sans-serif;background:#FAF6F0;overflow-x:hidden}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAF6F0",
        }}
      >
        <div style={{ textAlign: "center", animation: "fadeIn .6s ease both" }}>
          <div style={{ marginBottom: 0 }}>
            <AppLogo size={72} />
          </div>
          <div style={{marginTop: 14, fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 26, color: "#1a0f04", letterSpacing: 3}}>Eventix</div>
          <div
            style={{
              width: 28,
              height: 28,
              border: "2.5px solid transparent",
              borderTopColor: "#C9A96E",
              borderRadius: "50%",
              margin: "24px auto 0",
              animation: "spin .8s linear infinite",
            }}
          />
          <p
            style={{
              color: "rgba(201,169,110,0.7)",
              fontWeight: 400,
              fontSize: 11,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginTop: 12,
            }}
          >
            Cargando...
          </p>
        </div>
      </main>
    </>
  );
}

// ─── Guest number badge ────────────────────────────────────────────────────────
function NumBadge({ n }: { n: number }) {
  return <span className="num-badge">#{String(n).padStart(3, "0")}</span>;
}

// ─── Estado badge ──────────────────────────────────────────────────────────────
function EstadoBadge({
  estado,
  t,
}: {
  estado: string;
  t: typeof translations.es;
}) {
  const map: Record<string, { cls: string; label: string }> = {
    confirmado: { cls: "badge-conf", label: t.estadoConf },
    rechazado: { cls: "badge-decl", label: t.estadoDecl },
    pendiente: { cls: "badge-pend", label: t.estadoPend },
  };
  const info = map[estado] ?? map.pendiente;
  return <span className={`estado-badge ${info.cls}`}>{info.label}</span>;
}

// ─── Mini guest list inside dashboard card ─────────────────────────────────────
function MiniInvitados({
  eventoId,
  lang,
  t,
}: {
  eventoId: string;
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
        ? `🎟️ *Invitación #${String(inv.orden).padStart(3, "0")}*\n\nHola *${inv.nombre}*, aquí está tu invitación personal 👇\n\n${link}\n\nAbre el enlace para:\n✅ Confirmar tu asistencia\n📸 Subir tu foto\n💌 Dejar tu deseo`
        : `🎟️ *Invitation #${String(inv.orden).padStart(3, "0")}*\n\nHi *${inv.nombre}*, here's your personal invitation 👇\n\n${link}\n\nOpen the link to:\n✅ Confirm attendance\n📸 Upload your photo\n💌 Leave a wish`;
    const tel = inv.telefono?.replace(/\D/g, "") ?? "";
    window.open(
      `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  }

  if (loading) return null;

  const visibles = expanded ? invitados : invitados.slice(0, 3);

  return (
    <div className="mini-inv-wrap">
      <div className="mini-inv-header">
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Icon.users />
          <span className="mini-inv-title">{t.invitados}</span>
          <span className="mini-inv-count">{invitados.length}</span>
        </div>
        <Link href={`/eventos/${eventoId}/invitados`} className="mini-inv-ver">
          {t.verInvitados} →
        </Link>
      </div>

      {invitados.length === 0 ? (
        <p className="mini-inv-empty">{t.invitadosSin}</p>
      ) : (
        <>
          <div className="mini-inv-list">
            {visibles.map((inv) => (
              <div key={inv.id} className="mini-inv-row">
                {/* Número de orden */}
                <NumBadge n={inv.orden} />

                {/* Avatar + nombre */}
                <div className="mini-inv-avatar">
                  {inv.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="mini-inv-info">
                  <span className="mini-inv-nombre">{inv.nombre}</span>
                  {inv.telefono && (
                    <span className="mini-inv-tel">{inv.telefono}</span>
                  )}
                </div>

                {/* Estado */}
                <EstadoBadge estado={inv.estado} t={t} />

                {/* Acciones */}
                <div className="mini-inv-actions">
                  <button
                    className="mini-btn mini-btn-wa"
                    title="WhatsApp"
                    onClick={() => abrirWhatsApp(inv)}
                  >
                    <Icon.whatsapp />
                  </button>
                  <button
                    className={`mini-btn ${copiado === inv.token ? "mini-btn-ok" : "mini-btn-copy"}`}
                    title="Copiar link"
                    onClick={() => copiarLink(inv.token)}
                  >
                    {copiado === inv.token ? "✓" : <Icon.copy />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {invitados.length > 3 && (
            <button
              className="mini-inv-toggle"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "▲ Ver menos" : `▼ Ver ${invitados.length - 3} más`}
            </button>
          )}
        </>
      )}
    </div>
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

  const t = translations[lang];

  useEffect(() => {
    const svgFav = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="18" fill="#140d04"/><rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="rgba(201,169,110,0.20)" stroke-width="1.2"/><rect x="13" y="14" width="6" height="36" rx="3" fill="#C9A96E"/><rect x="13" y="14" width="24" height="6" rx="3" fill="#C9A96E"/><rect x="13" y="29" width="18" height="6" rx="3" fill="#C9A96E"/><rect x="13" y="44" width="24" height="6" rx="3" fill="#C9A96E"/><path d="M48 11 L49.8 17.2 L56 19 L49.8 20.8 L48 27 L46.2 20.8 L40 19 L46.2 17.2 Z" fill="#E8D5B0"/><circle cx="47" cy="46" r="2.5" fill="#C9A96E" opacity="0.55"/></svg>`;
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = `data:image/svg+xml,${encodeURIComponent(svgFav.trim())}`;
    document.head.appendChild(link);
    document.title = "Eventix — Dashboard";
    setTimeout(() => setMounted(true), 50);
    checkUser();
    cargarEventos();
  }, []);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/auth/login");
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("nombre")
      .eq("id", data.user.id)
      .single();
    if (profile) setNombre(profile.nombre);
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
        .filter((i) => i.estado !== "rechazado")
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
    if (!confirm(t.elimConfirm)) return;
    setElim(id);
    await supabase.from("eventos").delete().eq("id", id);
    setEventos((prev) => prev.filter((e) => e.id !== id));
    setElim(null);
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) return <LoadingScreen t={t} />;

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
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        :root{
          --bg:#FAF6F0;--surface:#FFFFFF;--surface2:#F7F2EA;
          --border:rgba(201,169,110,0.16);--border-mid:rgba(201,169,110,0.28);--border-hover:rgba(201,169,110,0.50);
          --accent:#C9A96E;--accent2:#8B6914;--accent-light:#C9A96E;
          --accent-soft:rgba(201,169,110,0.08);--accent-soft2:rgba(201,169,110,0.16);
          --text:#1a0f04;--text2:#3d2b0f;--text3:#8B6914;--text4:#8B6914;
          --danger:#DC2626;--danger-bg:#FEF2F2;--danger-border:#FECACA;
          --success:#059669;--warn:#D97706;
          --shadow-card:0 2px 16px rgba(26,15,4,0.09),0 1px 4px rgba(26,15,4,0.06);
          --shadow-sm:0 2px 8px rgba(26,15,4,0.08);
          --nav-h:58px;--nav-bg:rgba(250,246,240,0.96);
          --radius:20px;--radius-sm:13px;
          --transition:all 0.30s cubic-bezier(.4,0,.2,1);
        }

        html,body{
          font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);
          -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;
          overflow-x:hidden;width:100%;
        }

        body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
          opacity:0.4}

        /* ── Borde festivo de colores (top + bottom) ── */
        .confetti-top, .confetti-bottom {
          position: fixed; left: 0; right: 0; z-index: 9999;
          height: 7px; pointer-events: none;
          background: repeating-linear-gradient(90deg,
            #F44336 0px,#F44336 12px, #E91E63 12px,#E91E63 24px,
            #9C27B0 24px,#9C27B0 36px, #3F51B5 36px,#3F51B5 48px,
            #2196F3 48px,#2196F3 60px, #00BCD4 60px,#00BCD4 72px,
            #4CAF50 72px,#4CAF50 84px, #8BC34A 84px,#8BC34A 96px,
            #FFEB3B 96px,#FFEB3B 108px, #FF9800 108px,#FF9800 120px,
            #FF5722 120px,#FF5722 132px, #F44336 132px,#F44336 144px
          );
        }
        .confetti-top { top: 0; }
        .confetti-bottom { bottom: 0; }

        .page{min-height:100vh;min-height:100dvh;background:var(--bg);position:relative;overflow-x:hidden}

        .glow{position:fixed;pointer-events:none;z-index:0;border-radius:50%;filter:blur(90px)}
        .glow-1{width:340px;height:340px;top:-100px;right:-70px;background:radial-gradient(circle,rgba(13,148,136,0.12) 0%,transparent 70%);animation:gd1 9s ease-in-out infinite}
        .glow-2{width:280px;height:280px;bottom:80px;left:-90px;background:radial-gradient(circle,rgba(94,234,212,0.08) 0%,transparent 70%);animation:gd2 11s ease-in-out infinite}
        @keyframes gd1{0%,100%{transform:translate(0,0)}40%{transform:translate(-18px,28px)}70%{transform:translate(14px,-18px)}}
        @keyframes gd2{0%,100%{transform:translate(0,0)}35%{transform:translate(22px,-30px)}65%{transform:translate(-12px,18px)}}

        .particles{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
        .particle{position:absolute;border-radius:50%;background:var(--accent-light);opacity:0;animation:pf linear infinite}
        .particle-1{width:3px;height:3px;left:10%;animation-duration:14s;animation-delay:0s}
        .particle-2{width:2px;height:2px;left:30%;animation-duration:17s;animation-delay:3s}
        .particle-3{width:4px;height:4px;left:52%;animation-duration:12s;animation-delay:1s}
        .particle-4{width:2px;height:2px;left:68%;animation-duration:15s;animation-delay:4s}
        .particle-5{width:3px;height:3px;left:80%;animation-duration:13s;animation-delay:.5s}
        .particle-6{width:2px;height:2px;left:90%;animation-duration:18s;animation-delay:5s}
        .particle-7{width:4px;height:4px;left:22%;animation-duration:16s;animation-delay:2s}
        .particle-8{width:2px;height:2px;left:44%;animation-duration:11s;animation-delay:2.5s}
        @keyframes pf{0%{transform:translateY(105vh);opacity:0}5%{opacity:.1}90%{opacity:.1}100%{transform:translateY(-8vh) translateX(20px);opacity:0}}

        /* ── Nav ── */
        .nav{
          position:sticky;top:7px;z-index:30;height:var(--nav-h);
          padding:0 12px;
          padding-left:max(12px, env(safe-area-inset-left));
          padding-right:max(12px, env(safe-area-inset-right));
          display:flex;align-items:center;justify-content:space-between;gap:8px;
          background:var(--nav-bg);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
          border-bottom:1px solid var(--border);box-shadow:0 1px 12px rgba(13,148,136,0.07);
        }
        .nav-brand{display:flex;align-items:center;gap:8px;text-decoration:none;flex-shrink:0;min-width:0}
        .nav-brand-text{min-width:0}
        .nav-brand-name{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;letter-spacing:-.5px;line-height:1;color:var(--text);white-space:nowrap}
        .nav-brand-name span{color:var(--accent)}
        .nav-brand-sub{font-size:9.5px;color:var(--text3);font-weight:600;letter-spacing:.4px;text-transform:uppercase;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px}
        .nav-actions{display:flex;align-items:center;gap:6px;flex-shrink:0}
        .ctrl-btn{height:32px;border-radius:100px;background:var(--surface);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:var(--transition);box-shadow:var(--shadow-sm);color:var(--text2);font-size:10.5px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;padding:0 11px;font-family:'DM Sans',sans-serif;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
        .ctrl-btn:hover{background:var(--accent-soft2);color:var(--accent);border-color:var(--border-hover)}
        .btn-new{display:flex;align-items:center;gap:5px;background:var(--accent);color:#fff;text-decoration:none;border-radius:10px;padding:7px 12px;font-size:12.5px;font-weight:700;box-shadow:0 3px 14px rgba(13,148,136,0.28);transition:transform .2s,box-shadow .2s;border:none;cursor:pointer;white-space:nowrap;-webkit-tap-highlight-color:transparent;touch-action:manipulation;min-height:34px}
        .btn-new:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(13,148,136,0.40)}
        .btn-salir{display:flex;align-items:center;gap:5px;background:var(--danger-bg);color:var(--danger);border:1px solid var(--danger-border);border-radius:10px;padding:7px 10px;font-size:12px;font-weight:700;cursor:pointer;transition:var(--transition);font-family:'DM Sans',sans-serif;-webkit-tap-highlight-color:transparent;touch-action:manipulation;min-height:34px}
        .btn-salir:hover{opacity:.75}
        .btn-salir-text{display:none}
        @media(min-width:420px){.btn-salir-text{display:inline}}

        /* ── Content ── */
        .content{max-width:540px;margin:0 auto;padding:16px 12px max(56px, calc(env(safe-area-inset-bottom) + 24px));position:relative;z-index:1}
        @media(min-width:400px){.content{padding-left:16px;padding-right:16px}}

        /* ── Greeting ── */
        .greeting{margin-bottom:16px;padding:16px;background:linear-gradient(135deg,var(--accent) 0%,var(--accent2) 100%);border-radius:var(--radius);box-shadow:0 4px 20px rgba(13,148,136,0.26);position:relative;overflow:hidden}
        .greeting::after{content:'';position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,rgba(255,255,255,0.10) 0%,transparent 55%);pointer-events:none}
        .greeting-name{font-family:'Cormorant Garamond',serif;font-size:21px;font-weight:600;color:white;letter-spacing:-.4px;line-height:1.2;margin-bottom:2px}
        .greeting-sub{font-size:12px;color:rgba(255,255,255,0.72);font-weight:500}

        /* ── Global stats ── */
        .global-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:12px}
        @media(max-width:320px){.global-stats{grid-template-columns:repeat(2,1fr)}}
        .stat-pill{background:var(--surface);border:1.5px solid var(--border);border-radius:15px;padding:11px 5px 9px;text-align:center;transition:var(--transition);box-shadow:var(--shadow-card)}
        .stat-pill:hover{border-color:var(--border-mid);transform:translateY(-1px)}
        .stat-pill-icon{color:var(--accent);display:flex;justify-content:center;margin-bottom:5px}
        .stat-pill-val{font-weight:800;font-size:20px;color:var(--text);line-height:1;letter-spacing:-.5px}
        .stat-pill-label{font-size:8.5px;color:var(--text3);font-weight:700;margin-top:2px;letter-spacing:.4px;text-transform:uppercase}

        /* ── Total attendees ── */
        .total-banner{display:flex;align-items:center;gap:12px;background:var(--surface);border:1.5px solid var(--border-mid);border-radius:16px;padding:13px 16px;margin-bottom:14px;box-shadow:var(--shadow-card)}
        .total-banner-icon{width:40px;height:40px;flex-shrink:0;background:var(--accent-soft2);border-radius:12px;display:flex;align-items:center;justify-content:center;color:var(--accent);border:1px solid var(--border-mid)}
        .total-banner-val{font-weight:800;font-size:26px;color:var(--text);letter-spacing:-1px;line-height:1}
        .total-banner-label{font-size:12px;color:var(--text3);font-weight:600;margin-top:1px}

        /* ── CTA ── */
        .btn-cta{display:flex;align-items:center;justify-content:center;gap:9px;background:var(--accent);color:#fff;text-decoration:none;border-radius:var(--radius);padding:15px 20px;font-size:14px;font-weight:800;margin-bottom:18px;box-shadow:0 4px 20px rgba(13,148,136,0.30);letter-spacing:-.2px;transition:transform .2s,box-shadow .2s;position:relative;overflow:hidden;-webkit-tap-highlight-color:transparent;touch-action:manipulation;min-height:52px}
        .btn-cta::after{content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 38%,rgba(255,255,255,0.16) 50%,transparent 62%);background-size:200% 100%;animation:shimmer 3.5s ease-in-out infinite}
        .btn-cta:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(13,148,136,0.42)}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}

        /* ── Empty ── */
        .empty{background:var(--surface);border-radius:var(--radius);padding:48px 24px;text-align:center;border:1.5px dashed var(--border-mid);box-shadow:var(--shadow-card)}
        .empty-icon{width:54px;height:54px;background:var(--accent-soft);border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;color:var(--accent);border:1px solid var(--border-mid)}
        .empty-title{font-weight:800;color:var(--text);font-size:16px;margin-bottom:5px}
        .empty-sub{color:var(--text3);font-size:13px;line-height:1.5}

        /* ── Event cards ── */
        .event-list{display:flex;flex-direction:column;gap:13px}
        .event-card{background:var(--surface);border-radius:var(--radius);overflow:hidden;border:1.5px solid var(--border);box-shadow:var(--shadow-card);transition:var(--transition)}
        .event-card:hover{box-shadow:0 8px 28px rgba(13,148,136,0.13);transform:translateY(-1px);border-color:var(--border-mid)}
        .event-strip{height:4px;background:linear-gradient(90deg,var(--accent),var(--accent-light))}
        .event-header{padding:13px 14px 11px}
        .event-meta{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
        .event-badge{display:inline-flex;align-items:center;gap:4px;font-size:9.5px;font-weight:700;color:var(--accent2);background:var(--accent-soft);border-radius:7px;padding:3px 9px;letter-spacing:.3px;text-transform:uppercase;margin-bottom:5px;border:1px solid var(--border-mid)}
        .badge-past{color:var(--text3)!important;background:var(--surface2)!important;border-color:var(--border)!important}
        .badge-soon{color:var(--warn)!important;background:rgba(217,119,6,0.08)!important;border-color:rgba(217,119,6,0.25)!important}
        .badge-tomorrow{color:var(--success)!important;background:rgba(5,150,105,0.08)!important;border-color:rgba(5,150,105,0.25)!important}
        .event-name{font-weight:800;font-size:16px;color:var(--text);line-height:1.2;letter-spacing:-.3px;margin-bottom:6px}
        .event-info{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .event-info-item{display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text3);font-weight:500}
        .event-thumb{width:46px;height:46px;border-radius:12px;overflow:hidden;flex-shrink:0;border:2px solid var(--border-mid)}
        .event-thumb img{width:100%;height:100%;object-fit:cover}

        .stats-body{padding:0 14px 14px}
        .stats-divider{height:1px;background:var(--border);margin:0 0 11px}
        .stats-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin-bottom:11px}
        @media(max-width:330px){.stats-grid{grid-template-columns:repeat(3,1fr)}}
        .stat-box{background:var(--surface3);border-radius:10px;padding:8px 3px;text-align:center;border:1.5px solid var(--border);transition:var(--transition)}
        .stat-box:hover{border-color:var(--border-mid)}
        .stat-box-val{font-weight:800;font-size:16px;color:var(--text);line-height:1;letter-spacing:-.3px}
        .stat-box-label{font-size:8px;color:var(--text3);font-weight:700;margin-top:2px;letter-spacing:.3px;text-transform:uppercase}
        .stat-conf .stat-box-val{color:var(--accent)}
        .stat-pend .stat-box-val{color:var(--warn)}
        .stat-decl .stat-box-val{color:var(--danger)}
        .stat-fotos .stat-box-val{color:var(--accent2)}
        .stat-deseos .stat-box-val{color:#7C3AED}

        .event-personas-row{display:flex;align-items:center;justify-content:space-between;background:var(--accent-soft);border:1px solid var(--border-mid);border-radius:11px;padding:8px 13px;margin-bottom:10px}
        .event-personas-label{font-size:12px;color:var(--text2);font-weight:600;display:flex;align-items:center;gap:6px}
        .event-personas-val{font-size:17px;font-weight:800;color:var(--accent);letter-spacing:-.5px}

        .progress-row{display:flex;justify-content:space-between;margin-bottom:5px}
        .progress-label{font-size:11.5px;color:var(--text2);font-weight:600}
        .progress-value{font-size:11.5px;color:var(--accent);font-weight:700}
        .progress-track{background:var(--accent-soft);border-radius:99px;height:6px;overflow:hidden;border:1px solid var(--border)}
        .progress-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--accent),var(--accent-light));transition:width .7s ease}

        /* ── Mini invitados ── */
        .mini-inv-wrap{background:var(--surface3);border:1.5px solid var(--border-mid);border-radius:var(--radius-sm);overflow:hidden;margin-bottom:10px}
        .mini-inv-header{display:flex;align-items:center;justify-content:space-between;padding:9px 13px;border-bottom:1px solid var(--border)}
        .mini-inv-title{font-size:10px;font-weight:800;color:var(--accent2);text-transform:uppercase;letter-spacing:.8px}
        .mini-inv-count{background:var(--accent);color:#fff;font-size:9px;font-weight:800;border-radius:99px;padding:1px 7px;min-width:20px;text-align:center}
        .mini-inv-ver{font-size:10px;font-weight:700;color:var(--accent);text-decoration:none;letter-spacing:.2px}
        .mini-inv-ver:hover{text-decoration:underline}
        .mini-inv-empty{font-size:12px;color:var(--text3);text-align:center;padding:14px;font-style:italic}
        .mini-inv-list{display:flex;flex-direction:column}

        .mini-inv-row{
          display:flex;align-items:center;gap:8px;
          padding:8px 12px;border-bottom:1px solid var(--border);
          transition:background .15s;
        }
        .mini-inv-row:last-child{border-bottom:none}
        .mini-inv-row:hover{background:rgba(13,148,136,0.04)}

        /* Número de orden */
        .num-badge{
          flex-shrink:0;
          font-size:9.5px;font-weight:800;
          color:var(--accent2);
          background:var(--accent-soft2);
          border:1px solid var(--border-mid);
          border-radius:6px;
          padding:2px 6px;
          letter-spacing:.3px;
          font-variant-numeric:tabular-nums;
          min-width:38px;
          text-align:center;
        }

        .mini-inv-avatar{
          width:28px;height:28px;border-radius:50%;
          background:linear-gradient(135deg,var(--accent),var(--accent2));
          color:#fff;font-size:12px;font-weight:800;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;
        }
        .mini-inv-info{flex:1;min-width:0}
        .mini-inv-nombre{display:block;font-size:12px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .mini-inv-tel{display:block;font-size:10px;color:var(--text3);margin-top:1px}

        /* Estado badges */
        .estado-badge{flex-shrink:0;font-size:9px;font-weight:700;border-radius:99px;padding:2px 8px;border:1px solid transparent}
        .badge-conf{background:rgba(5,150,105,0.10);color:var(--success);border-color:rgba(5,150,105,0.22)}
        .badge-pend{background:rgba(217,119,6,0.08);color:var(--warn);border-color:rgba(217,119,6,0.22)}
        .badge-decl{background:var(--danger-bg);color:var(--danger);border-color:var(--danger-border)}

        /* Micro action buttons */
        .mini-inv-actions{display:flex;gap:4px;flex-shrink:0}
        .mini-btn{
          width:28px;height:28px;border-radius:8px;border:1px solid var(--border);
          display:flex;align-items:center;justify-content:center;
          cursor:pointer;transition:var(--transition);font-size:10px;font-weight:800;
          -webkit-tap-highlight-color:transparent;
        }
        .mini-btn-wa{background:#16a34a;color:#fff;border-color:#16a34a}
        .mini-btn-wa:hover{background:#15803d}
        .mini-btn-copy{background:var(--surface);color:var(--accent)}
        .mini-btn-copy:hover{background:var(--accent-soft2)}
        .mini-btn-ok{background:rgba(5,150,105,0.12);color:var(--success);border-color:rgba(5,150,105,0.22)}

        .mini-inv-toggle{
          width:100%;background:none;border:none;border-top:1px solid var(--border);
          padding:8px;font-size:11px;font-weight:700;color:var(--accent2);
          cursor:pointer;text-align:center;transition:background .15s;
          font-family:'DM Sans',sans-serif;
        }
        .mini-inv-toggle:hover{background:var(--accent-soft)}

        /* ── Quick links ── */
        .quick-links{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:10px 0 9px}
        .quick-link{position:relative;display:flex;align-items:center;gap:7px;background:var(--surface2);color:var(--text2);border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;font-size:11.5px;font-weight:700;text-decoration:none;transition:var(--transition);-webkit-tap-highlight-color:transparent;touch-action:manipulation;min-height:42px}
        .quick-link:hover{background:var(--accent-soft2);color:var(--accent);border-color:var(--border-hover)}
        .quick-link-icon{color:var(--accent);flex-shrink:0}
        .quick-link-badge{position:absolute;top:-5px;right:-5px;width:15px;height:15px;background:var(--accent);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:8px;font-weight:800;border:2px solid var(--surface)}

        /* ── Card actions ── */
        .card-actions{display:flex;gap:6px}
        .btn-manage{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;background:var(--accent-soft2);color:var(--accent);border:1.5px solid var(--border-mid);border-radius:var(--radius-sm);padding:11px;font-size:12px;font-weight:700;text-decoration:none;transition:var(--transition);-webkit-tap-highlight-color:transparent;touch-action:manipulation;min-height:42px}
        .btn-manage:hover{background:var(--accent);color:white;border-color:var(--accent)}
        .btn-delete{display:flex;align-items:center;gap:5px;background:var(--danger-bg);color:var(--danger);border:1.5px solid var(--danger-border);border-radius:var(--radius-sm);padding:11px 14px;font-size:12px;font-weight:700;cursor:pointer;transition:var(--transition);font-family:'DM Sans',sans-serif;-webkit-tap-highlight-color:transparent;touch-action:manipulation;min-height:42px}
        .btn-delete:hover{background:var(--danger);color:white;border-color:var(--danger)}
        .btn-delete:disabled{opacity:.4;cursor:not-allowed}

        .footer-copy{text-align:center;margin-top:32px;font-size:10px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;color:var(--text4);opacity:.7}

        .anim-in{opacity:0;transform:translateY(16px)}
        .mounted .anim-in{animation:mountIn .52s cubic-bezier(.22,1,.36,1) both}
        .mounted .anim-d1{animation-delay:.06s}
        .mounted .anim-d2{animation-delay:.14s}
        .mounted .anim-d3{animation-delay:.22s}
        .mounted .anim-d4{animation-delay:.30s}
        @keyframes mountIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div className={`page${mounted ? " mounted" : ""}`}>
        <div className="confetti-top" />
        <div className="confetti-bottom" />
        <div className="glow glow-1" />
        <div className="glow glow-2" />
        <Particles />

        {/* ── NAV ── */}
        <nav className="nav">
          <Link href="/dashboard" className="nav-brand">
            <AppLogo size={34} />
            <div className="nav-brand-text">
              <div className="nav-brand-name">
                Event<span>ix</span>
              </div>
              {nombre && (
                <div className="nav-brand-sub">
                  {t.hello}, {nombre.split(" ")[0]}
                </div>
              )}
            </div>
          </Link>
          <div className="nav-actions">
            <button
              className="ctrl-btn"
              onClick={() => setLang(lang === "es" ? "en" : "es")}
              title="Toggle language"
            >
              {lang === "es" ? "EN" : "ES"}
            </button>
            <button
              onClick={cerrarSesion}
              className="btn-salir"
              title={t.salir}
            >
              <Icon.logout />
              <span className="btn-salir-text">{t.salir}</span>
            </button>
          </div>
        </nav>

        {/* ── CONTENT ── */}
        <div className="content">
          {/* Greeting */}
          {nombre && (
            <div className="greeting anim-in anim-d1">
              <div className="greeting-name">
                {t.hello}, {nombre.split(" ")[0]} 👋
              </div>
              <div className="greeting-sub">
                {lang === "es"
                  ? `Tienes ${eventos.length} evento${eventos.length !== 1 ? "s" : ""} registrado${eventos.length !== 1 ? "s" : ""}`
                  : `You have ${eventos.length} registered event${eventos.length !== 1 ? "s" : ""}`}
              </div>
            </div>
          )}

          {/* Global stats */}
          {eventos.length > 0 && (
            <div className="global-stats anim-in anim-d2">
              {[
                {
                  val: eventos.length,
                  label: t.eventos,
                  icon: <Icon.calendar />,
                },
                { val: totConf, label: t.confirmados, icon: <Icon.users /> },
                { val: totFotos, label: t.fotos, icon: <Icon.camera /> },
                { val: totDes, label: t.deseos, icon: <Icon.heart /> },
              ].map((s) => (
                <div key={s.label} className="stat-pill">
                  <div className="stat-pill-icon">{s.icon}</div>
                  <div className="stat-pill-val">{s.val}</div>
                  <div className="stat-pill-label">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Total attendees */}
          {eventos.length > 0 && (
            <div className="total-banner anim-in anim-d2">
              <div className="total-banner-icon">
                <Icon.person />
              </div>
              <div>
                <div className="total-banner-val">{totPersonas}</div>
                <div className="total-banner-label">{t.totalPersonas}</div>
              </div>
            </div>
          )}

          {/* Create CTA */}
          <Link href="/eventos/nuevo" className="btn-cta anim-in anim-d3">
            <Icon.plus /> {t.crearEvento}
          </Link>

          {/* Event list */}
          {eventos.length === 0 ? (
            <div className="empty anim-in anim-d4">
              <div className="empty-icon">
                <Icon.calendar />
              </div>
              <p className="empty-title">{t.sinEventos}</p>
              <p className="empty-sub">{t.sinEventosSub}</p>
            </div>
          ) : (
            <div className="event-list anim-in anim-d4">
              {eventos.map((evento) => {
                const s = stats[evento.id];
                const tipo = TIPO_CONFIG[evento.tipo] || TIPO_CONFIG.otro;
                const total = s
                  ? s.confirmados + s.declinados + s.pendientes
                  : 0;
                const pct =
                  total > 0 ? Math.round((s.confirmados / total) * 100) : 0;
                const esPasado = new Date(evento.fecha) < hoy;
                const dias = Math.ceil(
                  (new Date(evento.fecha).getTime() - hoy.getTime()) / 86400000,
                );
                const tipoLabel = lang === "es" ? tipo.label : tipo.labelEn;

                return (
                  <div key={evento.id} className="event-card">
                    <div className="event-strip" />

                    {/* Header */}
                    <div className="event-header">
                      <div className="event-meta">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              flexWrap: "wrap",
                              marginBottom: 5,
                            }}
                          >
                            <span className="event-badge">{tipoLabel}</span>
                            {esPasado && (
                              <span className="event-badge badge-past">
                                {t.finalizad}
                              </span>
                            )}
                            {!esPasado && dias === 1 && (
                              <span className="event-badge badge-tomorrow">
                                {t.manana}
                              </span>
                            )}
                            {!esPasado && dias > 1 && dias <= 7 && (
                              <span className="event-badge badge-soon">
                                {dias} {t.dias}
                              </span>
                            )}
                          </div>
                          <p className="event-name">{evento.nombre}</p>
                          <div className="event-info">
                            <span className="event-info-item">
                              <Icon.calendar />
                              {new Date(evento.fecha).toLocaleDateString(
                                lang === "es" ? "es-ES" : "en-US",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                            <span className="event-info-item">
                              <Icon.location /> {evento.lugar}
                            </span>
                          </div>
                        </div>
                        {evento.imagen_url && (
                          <div className="event-thumb">
                            <img src={evento.imagen_url} alt="" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    {s && (
                      <div className="stats-body">
                        <div className="stats-divider" />
                        <div className="stats-grid">
                          {[
                            {
                              val: s.confirmados,
                              label: t.confirm2,
                              cls: "stat-conf",
                            },
                            {
                              val: s.pendientes,
                              label: t.pend,
                              cls: "stat-pend",
                            },
                            {
                              val: s.declinados,
                              label: t.declin,
                              cls: "stat-decl",
                            },
                            {
                              val: s.total_fotos,
                              label: t.fotos,
                              cls: "stat-fotos",
                            },
                            {
                              val: s.total_deseos,
                              label: t.deseos,
                              cls: "stat-deseos",
                            },
                          ].map((st) => (
                            <div
                              key={st.label}
                              className={`stat-box ${st.cls}`}
                            >
                              <div className="stat-box-val">{st.val}</div>
                              <div className="stat-box-label">{st.label}</div>
                            </div>
                          ))}
                        </div>

                        {/* Total personas */}
                        <div className="event-personas-row">
                          <span className="event-personas-label">
                            <Icon.person />
                            {t.totalPersonas}
                          </span>
                          <span className="event-personas-val">
                            {s.total_personas}
                          </span>
                        </div>

                        {/* Progress */}
                        <div style={{ marginBottom: 10 }}>
                          <div className="progress-row">
                            <span className="progress-label">
                              {t.confirmacion} · {pct}%
                            </span>
                            <span className="progress-value">
                              {s.confirmados} / {total}
                            </span>
                          </div>
                          <div className="progress-track">
                            <div
                              className="progress-fill"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {/* ── MINI LISTA DE INVITADOS CON NÚMERO DE ORDEN ── */}
                        <MiniInvitados eventoId={evento.id} lang={lang} t={t} />

                        {/* Quick links */}
                        <div className="quick-links">
                          {[
                            {
                              href: `/muro/${evento.id}`,
                              icon: <Icon.wall />,
                              label: t.verMuro,
                            },
                            {
                              href: `/eventos/${evento.id}/invitados`,
                              icon: <Icon.users />,
                              label: t.invitados,
                            },
                            {
                              href: `/libro/${evento.id}`,
                              icon: <Icon.book />,
                              label: t.libro,
                            },
                            {
                              href: `/eventos/${evento.id}/agradecimientos`,
                              icon: <Icon.mail />,
                              label: t.agradecimientos,
                              badge: evento.agradecimiento_enviado,
                            },
                            {
                              href: `/eventos/${evento.id}/mesas`,
                              icon: <Icon.table />,
                              label: t.mesas,
                            },
                            {
                              href: `/eventos/${evento.id}/configurar`,
                              icon: <Icon.gear />,
                              label: t.configurar,
                            },
                          ].map(({ href, icon, label, badge }) => (
                            <Link key={href} href={href} className="quick-link">
                              <span className="quick-link-icon">{icon}</span>
                              {label}
                              {badge && (
                                <span className="quick-link-badge">✓</span>
                              )}
                            </Link>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="card-actions">
                          <Link
                            href={`/eventos/${evento.id}/invitados`}
                            className="btn-manage"
                          >
                            <Icon.settings /> {t.gestionar}
                          </Link>
                          <button
                            onClick={() => eliminarEvento(evento.id)}
                            disabled={eliminando === evento.id}
                            className="btn-delete"
                          >
                            <Icon.trash />
                            {eliminando === evento.id ? "..." : ""}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <p className="footer-copy">Humb3rsec 2026</p>
        </div>
      </div>
    </>
  );
}
