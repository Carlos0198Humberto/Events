"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

const TIPO_CONFIG: Record<string, { label: string; labelEn: string }> = {
  quinceañera: { label: "Quinceañera", labelEn: "Quinceañera" },
  boda: { label: "Boda", labelEn: "Wedding" },
  graduacion: { label: "Graduación", labelEn: "Graduation" },
  cumpleaños: { label: "Cumpleaños", labelEn: "Birthday" },
  otro: { label: "Evento", labelEn: "Event" },
};

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
    crearEvento: "Crear nuevo evento",
    sinEventos: "Sin eventos todavía",
    sinEventosSub: "Crea tu primer evento para comenzar",
    confirm2: "Confirm.",
    pend: "Pend.",
    declin: "Declin.",
    personas: "personas",
    confirmacion: "Confirmación",
    verMuro: "Ver muro",
    invitados: "Invitados",
    libro: "Libro",
    agradecimientos: "Agradecimientos",
    gestionar: "Gestionar",
    eliminar: "Eliminar",
    finalizad: "Finalizado",
    manana: "¡Mañana!",
    dias: "días",
    cargando: "Cargando...",
    darkMode: "Modo oscuro",
    lightMode: "Modo claro",
    elimConfirm: "¿Eliminar este evento y todos sus datos?",
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
    darkMode: "Dark mode",
    lightMode: "Light mode",
    elimConfirm: "Delete this event and all its data?",
  },
};

// ─── SVG Logo ─────────────────────────────────────────────────────────────────
function AppLogo({ size = 36 }: { size?: number }) {
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
          id="lg-dash"
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
          id="lg2-dash"
          x1="10"
          y1="28"
          x2="46"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#3AADA0" />
          <stop offset="100%" stopColor="#2DC4A8" />
        </linearGradient>
        <filter id="lg3-dash" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <rect width="56" height="56" rx="16" fill="url(#lg-dash)" />
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
        stroke="url(#lg2-dash)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="11" r="1.6" fill="#3AADA0" opacity="0.9" />
      <circle cx="20" cy="9" r="1.1" fill="#2DC4A8" opacity="0.7" />
      <circle cx="11" cy="15" r="0.9" fill="#3AADA0" opacity="0.5" />
      <circle cx="42" cy="11" r="1.6" fill="#3AADA0" opacity="0.9" />
      <circle cx="36" cy="9" r="1.1" fill="#2DC4A8" opacity="0.7" />
      <circle cx="45" cy="15" r="0.9" fill="#3AADA0" opacity="0.5" />
      <path
        d="M28 7 L29 10.2 L32.4 10.2 L29.8 12.2 L30.8 15.4 L28 13.4 L25.2 15.4 L26.2 12.2 L23.6 10.2 L27 10.2 Z"
        fill="#3AADA0"
        opacity="0.95"
        filter="url(#lg3-dash)"
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

// ─── Icons ────────────────────────────────────────────────────────────────────
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
      width="16"
      height="16"
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
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M13 10H3M13 10l-3-3M13 10l-3 3M7 4H4a2 2 0 00-2 2v8a2 2 0 002 2h3" />
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

// ─── Component ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(true);
  const [eliminando, setElim] = useState<string | null>(null);
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState<"es" | "en">("es");
  const [mounted, setMounted] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
    setTimeout(() => setDark(true), 1800);
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

  const hoy = new Date();

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading)
    return (
      <>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg,#0C1A19 0%,#0F2422 100%)",
          }}
        >
          <div
            style={{ textAlign: "center", animation: "fadeIn .6s ease both" }}
          >
            <div style={{ marginBottom: 20 }}>
              <AppLogo size={52} />
            </div>
            <div
              style={{
                width: 36,
                height: 36,
                border: "2.5px solid rgba(58,173,160,0.2)",
                borderTopColor: "#3AADA0",
                borderRadius: "50%",
                margin: "0 auto 16px",
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
              {translations.es.cargando}
            </p>
          </div>
        </main>
      </>
    );

  // ─── Global totals ────────────────────────────────────────────────────────
  const totConf = Object.values(stats).reduce((s, v) => s + v.confirmados, 0);
  const totFotos = Object.values(stats).reduce((s, v) => s + v.total_fotos, 0);
  const totDes = Object.values(stats).reduce((s, v) => s + v.total_deseos, 0);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif}

        :root {
          --bg:#F0FAF8; --bg2:#E8F6F3;
          --surface:#FFFFFF; --surface2:#F7FDFB;
          --border:rgba(58,173,160,0.15); --border-mid:rgba(58,173,160,0.22);
          --accent:#1FA896; --accent2:#3AADA0; --accent3:#0f766e;
          --accent-soft:rgba(58,173,160,0.09); --accent-soft2:rgba(58,173,160,0.16);
          --text:#0A1E1C; --text2:#3D6E6A; --text3:#85B5B0;
          --danger:#dc2626; --danger-bg:#fef2f2; --danger-border:#fecaca;
          --shadow:0 4px 28px rgba(58,173,160,0.14);
          --shadow-sm:0 2px 10px rgba(58,173,160,0.09);
          --nav-bg:rgba(240,250,248,0.94);
          --transition:all 0.38s cubic-bezier(.4,0,.2,1);
          --radius:18px; --radius-sm:12px;
        }
        .dark {
          --bg:#0C1A19; --bg2:#0A1614;
          --surface:#162422; --surface2:#1C2E2B;
          --border:rgba(58,173,160,0.13); --border-mid:rgba(58,173,160,0.22);
          --accent:#3AADA0; --accent2:#2DC4A8; --accent3:#5eead4;
          --accent-soft:rgba(58,173,160,0.10); --accent-soft2:rgba(58,173,160,0.18);
          --text:#E8F8F5; --text2:#7ABFBA; --text3:#3D7070;
          --danger:#f87171; --danger-bg:rgba(220,38,38,0.10); --danger-border:rgba(220,38,38,0.22);
          --shadow:0 4px 28px rgba(0,0,0,0.44); --shadow-sm:0 2px 10px rgba(0,0,0,0.28);
          --nav-bg:rgba(12,26,25,0.97);
        }

        .page { min-height:100vh; background:var(--bg); transition:background 0.5s ease; position:relative; overflow-x:hidden; }

        /* Noise overlay */
        .page::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E"); opacity:0.35; }

        /* Ambient glows */
        .glow { position:fixed; pointer-events:none; z-index:0; border-radius:50%; filter:blur(90px); }
        .glow-1 { width:360px; height:360px; top:-120px; right:-80px;
          background:radial-gradient(circle,rgba(58,173,160,0.15) 0%,transparent 70%);
          animation:glowDrift1 9s ease-in-out infinite; }
        .glow-2 { width:300px; height:300px; bottom:80px; left:-100px;
          background:radial-gradient(circle,rgba(45,196,168,0.10) 0%,transparent 70%);
          animation:glowDrift2 11s ease-in-out infinite; }
        .dark .glow-1{background:radial-gradient(circle,rgba(58,173,160,0.20) 0%,transparent 70%)}
        .dark .glow-2{background:radial-gradient(circle,rgba(45,196,168,0.13) 0%,transparent 70%)}
        @keyframes glowDrift1{0%,100%{transform:translate(0,0)}40%{transform:translate(-18px,28px)}70%{transform:translate(14px,-18px)}}
        @keyframes glowDrift2{0%,100%{transform:translate(0,0)}35%{transform:translate(22px,-30px)}65%{transform:translate(-12px,18px)}}

        /* Particles */
        .particles{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
        .particle{position:absolute;border-radius:50%;background:var(--accent2);opacity:0;animation:particleFloat linear infinite}
        .particle-1{width:3px;height:3px;left:10%;animation-duration:14s;animation-delay:0s}
        .particle-2{width:2px;height:2px;left:30%;animation-duration:17s;animation-delay:3s}
        .particle-3{width:4px;height:4px;left:52%;animation-duration:12s;animation-delay:1s}
        .particle-4{width:2px;height:2px;left:68%;animation-duration:15s;animation-delay:4s}
        .particle-5{width:3px;height:3px;left:80%;animation-duration:13s;animation-delay:.5s}
        .particle-6{width:2px;height:2px;left:90%;animation-duration:18s;animation-delay:5s}
        .particle-7{width:4px;height:4px;left:22%;animation-duration:16s;animation-delay:2s}
        .particle-8{width:2px;height:2px;left:44%;animation-duration:11s;animation-delay:2.5s}
        @keyframes particleFloat{0%{transform:translateY(110vh);opacity:0}5%{opacity:.14}90%{opacity:.14}100%{transform:translateY(-10vh) translateX(20px);opacity:0}}

        /* ── NAV ── */
        .nav { position:sticky; top:0; z-index:30; height:58px; padding:0 16px;
          display:flex; align-items:center; justify-content:space-between;
          background:var(--nav-bg); backdrop-filter:blur(18px);
          border-bottom:1px solid var(--border); box-shadow:var(--shadow-sm);
          transition:background 0.5s ease, border-color 0.5s ease; }
        .nav-brand { display:flex; align-items:center; gap:10px; text-decoration:none; }
        .nav-brand-text { line-height:1; }
        .nav-brand-name { font-family:'Cormorant Garamond',serif; font-size:20px; font-weight:600;
          color:var(--accent); letter-spacing:-0.5px; line-height:1; }
        .nav-brand-sub { font-size:10px; color:var(--text3); font-weight:600;
          letter-spacing:.5px; text-transform:uppercase; margin-top:2px; }
        .nav-actions { display:flex; align-items:center; gap:6px; }
        .ctrl-btn { width:34px; height:34px; border-radius:50%; background:var(--surface);
          border:1px solid var(--border); display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:var(--transition); box-shadow:var(--shadow-sm);
          color:var(--text2); font-size:11px; font-weight:700; }
        .ctrl-btn:hover { background:var(--accent-soft2); color:var(--accent); border-color:var(--accent2); }
        .ctrl-lang { width:auto; padding:0 11px; border-radius:20px; letter-spacing:.5px; text-transform:uppercase; }
        .btn-new { display:flex; align-items:center; gap:6px;
          background:linear-gradient(135deg,var(--accent) 0%,var(--accent3) 100%);
          color:#fff; text-decoration:none; border-radius:10px; padding:8px 14px;
          font-size:13px; font-weight:700; box-shadow:0 3px 14px rgba(58,173,160,0.32);
          transition:transform .2s,box-shadow .2s; border:none; cursor:pointer; }
        .btn-new:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(58,173,160,0.42); }
        .btn-salir { display:flex; align-items:center; gap:5px; background:var(--danger-bg);
          color:var(--danger); border:1px solid var(--danger-border); border-radius:10px;
          padding:8px 12px; font-size:12px; font-weight:700; cursor:pointer;
          transition:var(--transition); font-family:'DM Sans',sans-serif; }
        .btn-salir:hover { opacity:.8; }

        /* ── CONTENT ── */
        .content { max-width:520px; margin:0 auto; padding:20px 14px 56px; position:relative; z-index:1; }

        /* ── GLOBAL STATS ── */
        .global-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:18px; }
        .stat-pill { background:var(--surface); border:1px solid var(--border); border-radius:14px;
          padding:12px 6px; text-align:center; transition:var(--transition); box-shadow:var(--shadow-sm); }
        .stat-pill-icon { color:var(--accent); display:flex; justify-content:center; margin-bottom:5px; }
        .stat-pill-val { font-weight:800; font-size:20px; color:var(--text); line-height:1; }
        .stat-pill-label { font-size:9px; color:var(--text3); font-weight:700; margin-top:3px;
          letter-spacing:.4px; text-transform:uppercase; }

        /* ── CTA BUTTON ── */
        .btn-cta { display:flex; align-items:center; justify-content:center; gap:10px;
          background:linear-gradient(135deg,var(--accent) 0%,var(--accent3) 100%);
          color:#fff; text-decoration:none; border-radius:var(--radius); padding:15px 20px;
          font-size:14px; font-weight:800; margin-bottom:22px;
          box-shadow:0 5px 22px rgba(58,173,160,0.34); letter-spacing:-0.2px;
          transition:transform .2s,box-shadow .2s; position:relative; overflow:hidden; }
        .btn-cta::after { content:''; position:absolute; inset:0;
          background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.15) 50%,transparent 60%);
          background-size:200% 100%; animation:shimmer 3.5s ease-in-out infinite; }
        .btn-cta:hover { transform:translateY(-2px); box-shadow:0 9px 28px rgba(58,173,160,0.45); }
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}

        /* ── EMPTY STATE ── */
        .empty { background:var(--surface); border-radius:var(--radius); padding:48px 24px;
          text-align:center; border:1.5px dashed var(--border-mid); }
        .empty-icon { width:54px; height:54px; background:var(--accent-soft); border-radius:14px;
          display:flex; align-items:center; justify-content:center; margin:0 auto 16px;
          color:var(--accent); border:1px solid var(--border-mid); }
        .empty-title { font-weight:800; color:var(--text); font-size:15px; margin-bottom:6px; }
        .empty-sub { color:var(--text3); font-size:13px; }

        /* ── EVENT CARD ── */
        .event-list { display:flex; flex-direction:column; gap:14px; }
        .event-card { background:var(--surface); border-radius:var(--radius); overflow:hidden;
          border:1px solid var(--border); box-shadow:var(--shadow); transition:var(--transition); }
        .event-card:hover { box-shadow:0 8px 32px rgba(58,173,160,0.16); transform:translateY(-1px); }
        .event-strip { height:3.5px; background:linear-gradient(90deg,var(--accent),var(--accent2)); }
        .event-header { padding:14px 16px 12px; }
        .event-meta { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
        .event-badge { display:inline-flex; align-items:center; gap:4px; font-size:10px; font-weight:700;
          color:var(--accent3); background:var(--accent-soft); border-radius:6px; padding:2px 9px;
          letter-spacing:.3px; text-transform:uppercase; margin-bottom:5px; border:1px solid var(--border-mid); }
        .dark .event-badge { color:var(--accent2); background:var(--accent-soft); }
        .badge-past { color:var(--text3) !important; background:var(--surface2) !important; border-color:var(--border) !important; }
        .badge-soon { color:var(--accent) !important; background:var(--accent-soft2) !important; }
        .event-name { font-weight:800; font-size:16px; color:var(--text); line-height:1.25;
          letter-spacing:-0.3px; margin-bottom:5px; }
        .event-info { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .event-info-item { display:flex; align-items:center; gap:4px; font-size:11px; color:var(--text3); }
        .event-thumb { width:46px; height:46px; border-radius:12px; overflow:hidden; flex-shrink:0;
          border:1.5px solid var(--border-mid); }
        .event-thumb img { width:100%; height:100%; object-fit:cover; }

        /* ── STATS GRID ── */
        .stats-body { padding:0 16px 14px; }
        .stats-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:5px; margin-bottom:10px; }
        .stat-box { background:var(--surface2); border-radius:10px; padding:8px 3px; text-align:center; border:1px solid var(--border); }
        .stat-box-val { font-weight:800; font-size:16px; color:var(--text); line-height:1; }
        .stat-box-label { font-size:8.5px; color:var(--text3); font-weight:700; margin-top:2px;
          letter-spacing:.3px; text-transform:uppercase; }

        /* Colores de accent para stats — solo teal/verde monocromo */
        .stat-conf .stat-box-val  { color:var(--accent); }
        .stat-pend .stat-box-val  { color:var(--text2); }
        .stat-decl .stat-box-val  { color:var(--danger); }
        .stat-fotos .stat-box-val { color:var(--accent2); }
        .stat-deseos .stat-box-val{ color:var(--accent3); }

        /* ── PROGRESS ── */
        .progress-row { display:flex; justify-content:space-between; margin-bottom:5px; }
        .progress-label { font-size:11px; color:var(--text3); }
        .progress-value { font-size:11px; color:var(--accent); font-weight:700; }
        .progress-track { background:var(--accent-soft); border-radius:99px; height:5px; overflow:hidden; border:1px solid var(--border); }
        .progress-fill { height:100%; border-radius:99px;
          background:linear-gradient(90deg,var(--accent),var(--accent2)); transition:width .7s ease; }

        /* ── QUICK LINKS ── */
        .quick-links { display:grid; grid-template-columns:1fr 1fr; gap:7px; margin:10px 0 8px; }
        .quick-link { position:relative; display:flex; align-items:center; gap:7px;
          background:var(--surface2); color:var(--text2); border:1px solid var(--border);
          border-radius:var(--radius-sm); padding:10px 12px; font-size:12px; font-weight:700;
          text-decoration:none; transition:var(--transition); }
        .quick-link:hover { background:var(--accent-soft2); color:var(--accent); border-color:var(--accent2); }
        .quick-link-icon { color:var(--accent2); flex-shrink:0; }
        .quick-link-badge { position:absolute; top:-5px; right:-5px; width:15px; height:15px;
          background:var(--accent); border-radius:50%; display:flex; align-items:center;
          justify-content:center; color:white; font-size:8px; font-weight:800; border:2px solid var(--surface); }

        /* ── ACTIONS ── */
        .card-actions { display:flex; gap:7px; }
        .btn-manage { flex:1; display:flex; align-items:center; justify-content:center; gap:6px;
          background:var(--accent-soft); color:var(--accent); border:1px solid var(--border-mid);
          border-radius:var(--radius-sm); padding:10px; font-size:12px; font-weight:700;
          text-decoration:none; transition:var(--transition); }
        .btn-manage:hover { background:var(--accent-soft2); border-color:var(--accent2); }
        .btn-delete { display:flex; align-items:center; gap:5px; background:var(--danger-bg);
          color:var(--danger); border:1px solid var(--danger-border); border-radius:var(--radius-sm);
          padding:10px 13px; font-size:12px; font-weight:700; cursor:pointer;
          transition:var(--transition); font-family:'DM Sans',sans-serif; }
        .btn-delete:hover { opacity:.75; }
        .btn-delete:disabled { opacity:.4; cursor:not-allowed; }

        /* ── FOOTER ── */
        .footer-copy { text-align:center; margin-top:32px; font-size:10px; font-weight:600;
          letter-spacing:1.8px; text-transform:uppercase; color:var(--text3); opacity:.6; }

        /* ── ANIMATIONS ── */
        .anim-in { opacity:0; transform:translateY(16px); }
        .mounted .anim-in { animation:mountIn .55s cubic-bezier(.22,1,.36,1) both; }
        .mounted .anim-d1 { animation-delay:.08s; }
        .mounted .anim-d2 { animation-delay:.18s; }
        .mounted .anim-d3 { animation-delay:.28s; }
        @keyframes mountIn { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>

      <div className={`page${dark ? " dark" : ""}${mounted ? " mounted" : ""}`}>
        <div className="glow glow-1" />
        <div className="glow glow-2" />
        <Particles />

        {/* ── NAV ─────────────────────────────────────────────────────── */}
        <nav className="nav">
          <Link href="/dashboard" className="nav-brand">
            <AppLogo size={36} />
            <div className="nav-brand-text">
              <div className="nav-brand-name">Events</div>
              <div className="nav-brand-sub">
                {nombre ? `${t.hello}, ${nombre.split(" ")[0]}` : t.dashboard}
              </div>
            </div>
          </Link>

          <div className="nav-actions">
            {/* Language toggle */}
            <button
              className="ctrl-btn ctrl-lang"
              onClick={() => setLang(lang === "es" ? "en" : "es")}
              title={lang === "es" ? "Switch to English" : "Cambiar a Español"}
            >
              {lang === "es" ? "EN" : "ES"}
            </button>

            {/* Dark/Light toggle */}
            <button
              className="ctrl-btn"
              onClick={() => setDark(!dark)}
              title={dark ? t.lightMode : t.darkMode}
            >
              {dark ? <Icon.sun /> : <Icon.moon />}
            </button>

            {/* New event */}
            <Link href="/eventos/nuevo" className="btn-new">
              <Icon.plus /> {t.nuevo}
            </Link>

            {/* Sign out */}
            <button onClick={cerrarSesion} className="btn-salir">
              <Icon.logout /> <span className="hide-xs">{t.salir}</span>
            </button>
          </div>
        </nav>

        {/* ── CONTENT ─────────────────────────────────────────────────── */}
        <div className="content">
          {/* Global summary pills */}
          {eventos.length > 0 && (
            <div className="global-stats anim-in anim-d1">
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

          {/* CTA create */}
          <Link href="/eventos/nuevo" className="btn-cta anim-in anim-d2">
            <Icon.plus /> {t.crearEvento}
          </Link>

          {/* Event list / empty */}
          {eventos.length === 0 ? (
            <div className="empty anim-in anim-d3">
              <div className="empty-icon">
                <Icon.calendar />
              </div>
              <p className="empty-title">{t.sinEventos}</p>
              <p className="empty-sub">{t.sinEventosSub}</p>
            </div>
          ) : (
            <div className="event-list anim-in anim-d3">
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
                          {/* Badges row */}
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
                            {!esPasado && dias <= 7 && dias > 0 && (
                              <span className="event-badge badge-soon">
                                {dias === 1 ? t.manana : `${dias} ${t.dias}`}
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

                    {/* Stats body */}
                    {s && (
                      <div className="stats-body">
                        {/* Mini stat boxes */}
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

                        {/* Progress bar */}
                        <div style={{ marginBottom: 10 }}>
                          <div className="progress-row">
                            <span className="progress-label">
                              {t.confirmacion} {pct}%
                            </span>
                            <span className="progress-value">
                              {s.total_personas} {t.personas}
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

                        {/* Manage + delete */}
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
