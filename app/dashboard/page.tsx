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
    gestionar: "Gestionar",
    eliminar: "Eliminar",
    finalizad: "Finalizado",
    manana: "¡Mañana!",
    dias: "días",
    cargando: "Cargando...",
    elimConfirm: "¿Eliminar este evento y todos sus datos?",
    totalPersonas: "Total asistentes",
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
    gestionar: "Manage",
    eliminar: "Delete",
    finalizad: "Finished",
    manana: "Tomorrow!",
    dias: "days",
    cargando: "Loading...",
    elimConfirm: "Delete this event and all its data?",
    totalPersonas: "Total attendees",
  },
};

// ─── Logo ──────────────────────────────────────────────────────────────────────
function AppLogo({ size = 36 }: { size?: number }) {
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
          id="evx-bg-d"
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
          id="evx-glow-d"
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
      <rect width="64" height="64" rx="18" fill="url(#evx-bg-d)" />
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
        stroke="url(#evx-glow-d)"
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
      <circle cx="47" cy="51" r="2" fill="#5EEAD4" opacity="0.8" />
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
        html,body{font-family:'DM Sans',sans-serif;background:#EFF9F7;overflow-x:hidden}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#EFF9F7",
        }}
      >
        <div style={{ textAlign: "center", animation: "fadeIn .6s ease both" }}>
          <div style={{ marginBottom: 20 }}>
            <AppLogo size={52} />
          </div>
          <div
            style={{
              width: 34,
              height: 34,
              border: "2.5px solid rgba(13,148,136,0.15)",
              borderTopColor: "#0D9488",
              borderRadius: "50%",
              margin: "0 auto 16px",
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
            {t.cargando}
          </p>
        </div>
      </main>
    </>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
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
    // Favicon
    const svgFav = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="18" fill="#0D9488"/><path d="M18 17 L30 32 L18 47" stroke="#5EEAD4" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M46 17 L34 32 L46 47" stroke="rgba(255,255,255,0.4)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="32" cy="32" r="4" fill="white"/></svg>`;
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
        .select("estado, num_personas")
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
          --bg:#EFF9F7;--surface:#FFFFFF;--surface2:#F4FBFA;--surface3:#EBF7F5;
          --border:rgba(13,148,136,0.13);--border-mid:rgba(13,148,136,0.22);--border-hover:rgba(13,148,136,0.38);
          --accent:#0D9488;--accent2:#0F766E;--accent-light:#5EEAD4;
          --accent-soft:rgba(13,148,136,0.08);--accent-soft2:rgba(13,148,136,0.14);
          --text:#0A1A19;--text2:#1D5954;--text3:#5BA3A0;--text4:#8ECFCC;
          --danger:#DC2626;--danger-bg:#FEF2F2;--danger-border:#FECACA;
          --success:#059669;--warn:#D97706;
          --shadow-card:0 2px 16px rgba(13,148,136,0.09),0 1px 4px rgba(13,148,136,0.06);
          --shadow-sm:0 2px 8px rgba(13,148,136,0.08);
          --nav-h:58px;--nav-bg:rgba(239,249,247,0.96);
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

        .page{min-height:100vh;min-height:100dvh;background:var(--bg);position:relative;overflow-x:hidden}

        /* ── Glows ── */
        .glow{position:fixed;pointer-events:none;z-index:0;border-radius:50%;filter:blur(90px)}
        .glow-1{width:340px;height:340px;top:-100px;right:-70px;background:radial-gradient(circle,rgba(13,148,136,0.12) 0%,transparent 70%);animation:gd1 9s ease-in-out infinite}
        .glow-2{width:280px;height:280px;bottom:80px;left:-90px;background:radial-gradient(circle,rgba(94,234,212,0.08) 0%,transparent 70%);animation:gd2 11s ease-in-out infinite}
        @keyframes gd1{0%,100%{transform:translate(0,0)}40%{transform:translate(-18px,28px)}70%{transform:translate(14px,-18px)}}
        @keyframes gd2{0%,100%{transform:translate(0,0)}35%{transform:translate(22px,-30px)}65%{transform:translate(-12px,18px)}}

        /* ── Particles ── */
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
          position:sticky;top:0;z-index:30;
          height:var(--nav-h);
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

        /* Language button */
        .ctrl-btn{
          height:32px;border-radius:100px;background:var(--surface);border:1px solid var(--border);
          display:flex;align-items:center;justify-content:center;cursor:pointer;transition:var(--transition);
          box-shadow:var(--shadow-sm);color:var(--text2);font-size:10.5px;font-weight:700;letter-spacing:.5px;
          text-transform:uppercase;padding:0 11px;font-family:'DM Sans',sans-serif;
          -webkit-tap-highlight-color:transparent;touch-action:manipulation;
        }
        .ctrl-btn:hover{background:var(--accent-soft2);color:var(--accent);border-color:var(--border-hover)}

        /* New event button */
        .btn-new{
          display:flex;align-items:center;gap:5px;background:var(--accent);color:#fff;text-decoration:none;
          border-radius:10px;padding:7px 12px;font-size:12.5px;font-weight:700;
          box-shadow:0 3px 14px rgba(13,148,136,0.28);transition:transform .2s,box-shadow .2s;
          border:none;cursor:pointer;white-space:nowrap;
          -webkit-tap-highlight-color:transparent;touch-action:manipulation;
          min-height:34px;
        }
        .btn-new:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(13,148,136,0.40)}

        /* Sign out — icon only on mobile, text on wider */
        .btn-salir{
          display:flex;align-items:center;gap:5px;background:var(--danger-bg);color:var(--danger);
          border:1px solid var(--danger-border);border-radius:10px;padding:7px 10px;
          font-size:12px;font-weight:700;cursor:pointer;transition:var(--transition);
          font-family:'DM Sans',sans-serif;
          -webkit-tap-highlight-color:transparent;touch-action:manipulation;
          min-height:34px;
        }
        .btn-salir:hover{opacity:.75}
        .btn-salir-text{display:none}
        @media(min-width:420px){.btn-salir-text{display:inline}}

        /* ── Content ── */
        .content{
          max-width:540px;margin:0 auto;
          padding:16px 12px max(56px, calc(env(safe-area-inset-bottom) + 24px));
          position:relative;z-index:1;
        }
        @media(min-width:400px){.content{padding-left:16px;padding-right:16px}}

        /* ── Greeting banner ── */
        .greeting{
          margin-bottom:16px;padding:16px;
          background:linear-gradient(135deg,var(--accent) 0%,var(--accent2) 100%);
          border-radius:var(--radius);box-shadow:0 4px 20px rgba(13,148,136,0.26);
          position:relative;overflow:hidden;
        }
        .greeting::after{content:'';position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,rgba(255,255,255,0.10) 0%,transparent 55%);pointer-events:none}
        .greeting-name{font-family:'Cormorant Garamond',serif;font-size:21px;font-weight:600;color:white;letter-spacing:-.4px;line-height:1.2;margin-bottom:2px}
        .greeting-sub{font-size:12px;color:rgba(255,255,255,0.72);font-weight:500}

        /* ── Global stats grid ── */
        .global-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:12px}
        /* Stack to 2x2 on very narrow phones */
        @media(max-width:320px){.global-stats{grid-template-columns:repeat(2,1fr)}}
        .stat-pill{background:var(--surface);border:1.5px solid var(--border);border-radius:15px;padding:11px 5px 9px;text-align:center;transition:var(--transition);box-shadow:var(--shadow-card)}
        .stat-pill:hover{border-color:var(--border-mid);transform:translateY(-1px)}
        .stat-pill-icon{color:var(--accent);display:flex;justify-content:center;margin-bottom:5px}
        .stat-pill-val{font-weight:800;font-size:20px;color:var(--text);line-height:1;letter-spacing:-.5px}
        .stat-pill-label{font-size:8.5px;color:var(--text3);font-weight:700;margin-top:2px;letter-spacing:.4px;text-transform:uppercase}

        /* ── Total attendees banner ── */
        .total-banner{display:flex;align-items:center;gap:12px;background:var(--surface);border:1.5px solid var(--border-mid);border-radius:16px;padding:13px 16px;margin-bottom:14px;box-shadow:var(--shadow-card)}
        .total-banner-icon{width:40px;height:40px;flex-shrink:0;background:var(--accent-soft2);border-radius:12px;display:flex;align-items:center;justify-content:center;color:var(--accent);border:1px solid var(--border-mid)}
        .total-banner-val{font-weight:800;font-size:26px;color:var(--text);letter-spacing:-1px;line-height:1}
        .total-banner-label{font-size:12px;color:var(--text3);font-weight:600;margin-top:1px}

        /* ── Create CTA ── */
        .btn-cta{
          display:flex;align-items:center;justify-content:center;gap:9px;
          background:var(--accent);color:#fff;text-decoration:none;
          border-radius:var(--radius);padding:15px 20px;font-size:14px;font-weight:800;
          margin-bottom:18px;box-shadow:0 4px 20px rgba(13,148,136,0.30);
          letter-spacing:-.2px;transition:transform .2s,box-shadow .2s;
          position:relative;overflow:hidden;
          -webkit-tap-highlight-color:transparent;touch-action:manipulation;
          min-height:52px;
        }
        .btn-cta::after{content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 38%,rgba(255,255,255,0.16) 50%,transparent 62%);background-size:200% 100%;animation:shimmer 3.5s ease-in-out infinite}
        .btn-cta:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(13,148,136,0.42)}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}

        /* ── Empty state ── */
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

        /* ── Per-event stats grid ── */
        .stats-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin-bottom:11px}
        /* Collapse to 3+2 on very small screens */
        @media(max-width:330px){
          .stats-grid{grid-template-columns:repeat(3,1fr)}
        }
        .stat-box{background:var(--surface3);border-radius:10px;padding:8px 3px;text-align:center;border:1.5px solid var(--border);transition:var(--transition)}
        .stat-box:hover{border-color:var(--border-mid)}
        .stat-box-val{font-weight:800;font-size:16px;color:var(--text);line-height:1;letter-spacing:-.3px}
        .stat-box-label{font-size:8px;color:var(--text3);font-weight:700;margin-top:2px;letter-spacing:.3px;text-transform:uppercase}
        .stat-conf .stat-box-val{color:var(--accent)}
        .stat-pend .stat-box-val{color:var(--warn)}
        .stat-decl .stat-box-val{color:var(--danger)}
        .stat-fotos .stat-box-val{color:var(--accent2)}
        .stat-deseos .stat-box-val{color:#7C3AED}

        /* ── Personas row ── */
        .event-personas-row{display:flex;align-items:center;justify-content:space-between;background:var(--accent-soft);border:1px solid var(--border-mid);border-radius:11px;padding:8px 13px;margin-bottom:10px}
        .event-personas-label{font-size:12px;color:var(--text2);font-weight:600;display:flex;align-items:center;gap:6px}
        .event-personas-val{font-size:17px;font-weight:800;color:var(--accent);letter-spacing:-.5px}

        /* ── Progress bar ── */
        .progress-row{display:flex;justify-content:space-between;margin-bottom:5px}
        .progress-label{font-size:11.5px;color:var(--text2);font-weight:600}
        .progress-value{font-size:11.5px;color:var(--accent);font-weight:700}
        .progress-track{background:var(--accent-soft);border-radius:99px;height:6px;overflow:hidden;border:1px solid var(--border)}
        .progress-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--accent),var(--accent-light));transition:width .7s ease}

        /* ── Quick links ── */
        .quick-links{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:10px 0 9px}
        .quick-link{
          position:relative;display:flex;align-items:center;gap:7px;
          background:var(--surface2);color:var(--text2);border:1.5px solid var(--border);
          border-radius:var(--radius-sm);padding:10px 12px;font-size:11.5px;font-weight:700;
          text-decoration:none;transition:var(--transition);
          -webkit-tap-highlight-color:transparent;touch-action:manipulation;
          min-height:42px;
        }
        .quick-link:hover{background:var(--accent-soft2);color:var(--accent);border-color:var(--border-hover)}
        .quick-link-icon{color:var(--accent);flex-shrink:0}
        .quick-link-badge{position:absolute;top:-5px;right:-5px;width:15px;height:15px;background:var(--accent);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:8px;font-weight:800;border:2px solid var(--surface)}

        /* ── Card actions ── */
        .card-actions{display:flex;gap:6px}
        .btn-manage{
          flex:1;display:flex;align-items:center;justify-content:center;gap:6px;
          background:var(--accent-soft2);color:var(--accent);border:1.5px solid var(--border-mid);
          border-radius:var(--radius-sm);padding:11px;font-size:12px;font-weight:700;
          text-decoration:none;transition:var(--transition);
          -webkit-tap-highlight-color:transparent;touch-action:manipulation;min-height:42px;
        }
        .btn-manage:hover{background:var(--accent);color:white;border-color:var(--accent)}
        .btn-delete{
          display:flex;align-items:center;gap:5px;background:var(--danger-bg);color:var(--danger);
          border:1.5px solid var(--danger-border);border-radius:var(--radius-sm);padding:11px 14px;
          font-size:12px;font-weight:700;cursor:pointer;transition:var(--transition);
          font-family:'DM Sans',sans-serif;
          -webkit-tap-highlight-color:transparent;touch-action:manipulation;min-height:42px;
        }
        .btn-delete:hover{background:var(--danger);color:white;border-color:var(--danger)}
        .btn-delete:disabled{opacity:.4;cursor:not-allowed}

        /* ── Footer ── */
        .footer-copy{text-align:center;margin-top:32px;font-size:10px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;color:var(--text4);opacity:.7}

        /* ── Mount animations ── */
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
            <Link href="/eventos/nuevo" className="btn-new">
              <Icon.plus /> {t.nuevo}
            </Link>
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

          {/* Empty / event list */}
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
                            href={`/eventos/${evento.id}`}
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
