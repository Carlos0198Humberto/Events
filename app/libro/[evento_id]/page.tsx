"use client";
import React from "react";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Evento = {
  id: string;
  nombre: string;
  tipo: string;
  fecha: string;
  hora: string;
  lugar: string;
  imagen_url: string | null;
  anfitriones: string | null;
  frase_evento: string | null;
  plantilla: string;
  color_primario: string;
  color_secundario: string;
  maps_url: string | null;
};
type Foto = {
  id: string;
  url: string;
  caption: string | null;
  es_favorita: boolean;
  invitados: { nombre: string };
  reacciones: { emoji: string; count: number }[];
};
type Deseo = {
  id: string;
  nombre_autor: string;
  mensaje: string;
  emoji_sticker: string;
  color_fondo: string;
};
type Invitado = {
  id: string;
  nombre: string;
  estado: string;
  num_personas: number;
  mensaje: string | null;
};
type Vista = "portada" | "fotos" | "deseos" | "asistentes";

// ─── Eventix Logo ─────────────────────────────────────────────────────────────
function AppLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id={`ev-logo-${size}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#4F46E5" /><stop offset="100%" stopColor="#6366F1" /></linearGradient></defs><rect width="64" height="64" rx="18" fill={`url(#ev-logo-${size})`} /><rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" /><rect x="13" y="14" width="6" height="36" rx="3" fill="#FFFFFF" /><rect x="13" y="14" width="24" height="6" rx="3" fill="#FFFFFF" /><rect x="13" y="29" width="18" height="6" rx="3" fill="#FFFFFF" /><rect x="13" y="44" width="24" height="6" rx="3" fill="#FFFFFF" /><path d="M48 11 L49.8 17.2 L56 19 L49.8 20.8 L48 27 L46.2 20.8 L40 19 L46.2 17.2 Z" fill="#E0E7FF" /><circle cx="47" cy="46" r="2.5" fill="#FFFFFF" opacity="0.7" /></svg>
  );
}

// ─── Temas por tipo de evento ──────────────────────────────────────────────────
const TEMAS: Record<
  string,
  {
    portada: string;
    titulo: string;
    subtitulo: string;
    acento: string;
    fondo: string;
    ornSvg: string;
  }
> = {
  boda: {
    portada: "linear-gradient(160deg,#fdf2f8 0%,#fce7f3 50%,#fbcfe8 100%)",
    titulo: "#831843",
    subtitulo: "#9d174d",
    acento: "#f9a8d4",
    fondo: "#fdf4ff",
    ornSvg: `<svg width="120" height="24" viewBox="0 0 120 24" fill="none"><path d="M0 12 Q30 2 60 12 Q90 22 120 12" stroke="#f9a8d4" strokeWidth="1.5" fill="none"/><circle cx="20" cy="9" r="2" fill="#f9a8d4" opacity=".6"/><circle cx="60" cy="14" r="2.5" fill="#f9a8d4" opacity=".8"/><circle cx="100" cy="9" r="2" fill="#f9a8d4" opacity=".6"/></svg>`,
  },
  quinceañera: {
    portada: "linear-gradient(160deg,#faf5ff 0%,#f3e8ff 50%,#e9d5ff 100%)",
    titulo: "#4c1d95",
    subtitulo: "#6d28d9",
    acento: "#c4b5fd",
    fondo: "#faf5ff",
    ornSvg: `<svg width="120" height="24" viewBox="0 0 120 24" fill="none"><path d="M60 4L62 10H68L63 14L65 20L60 16L55 20L57 14L52 10H58Z" fill="#c4b5fd" opacity=".7"/><circle cx="20" cy="12" r="3" fill="#c4b5fd" opacity=".4"/><circle cx="100" cy="12" r="3" fill="#c4b5fd" opacity=".4"/></svg>`,
  },
  cumpleaños: {
    portada: "linear-gradient(160deg,#fffbeb 0%,#fef3c7 50%,#fde68a 100%)",
    titulo: "#78350f",
    subtitulo: "#92400e",
    acento: "#fcd34d",
    fondo: "#fffbeb",
    ornSvg: `<svg width="120" height="24" viewBox="0 0 120 24" fill="none"><circle cx="20" cy="12" r="4" fill="#fcd34d" opacity=".5"/><circle cx="60" cy="8" r="5" fill="#fcd34d" opacity=".7"/><circle cx="100" cy="12" r="4" fill="#fcd34d" opacity=".5"/><circle cx="40" cy="16" r="3" fill="#fb923c" opacity=".4"/><circle cx="80" cy="16" r="3" fill="#fb923c" opacity=".4"/></svg>`,
  },
  graduacion: {
    portada: "linear-gradient(160deg,#eff6ff 0%,#dbeafe 50%,#bfdbfe 100%)",
    titulo: "#1e3a8a",
    subtitulo: "#1d4ed8",
    acento: "#93c5fd",
    fondo: "#eff6ff",
    ornSvg: `<svg width="120" height="24" viewBox="0 0 120 24" fill="none"><path d="M50 8L60 4L70 8L60 12Z" fill="#93c5fd" opacity=".7"/><path d="M56 12L56 18L64 18L64 12" stroke="#93c5fd" strokeWidth="1.5" fill="none"/><circle cx="20" cy="14" r="2" fill="#93c5fd" opacity=".4"/><circle cx="100" cy="14" r="2" fill="#93c5fd" opacity=".4"/></svg>`,
  },
  otro: {
    portada: "linear-gradient(160deg,#FAFBFF 0%,#E0E7FF 50%,#D4A96A 100%)",
    titulo: "#475569",
    subtitulo: "#3730A3",
    acento: "#4F46E5",
    fondo: "#FAFBFF",
    ornSvg: `<svg width="120" height="24" viewBox="0 0 120 24" fill="none"><path d="M10 12 h100" stroke="#4F46E5" strokeWidth="1" strokeDasharray="4 3"/><circle cx="60" cy="12" r="3" fill="#4F46E5" opacity=".6"/></svg>`,
  },
};

const STICKERS: Record<string, string> = {
  rosa: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="6" fill="#f9a8d4" opacity=".8"/><path d="M16 10Q18 6 22 8Q24 12 20 14Q22 18 18 18Q16 22 12 20Q8 18 10 14Q6 12 8 8Q12 6 16 10Z" fill="#ec4899" opacity=".6"/></svg>`,
  corazon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M16 26C14 24 5 18 5 12A5.5 5.5 0 0116 9A5.5 5.5 0 0127 12C27 18 18 24 16 26Z" fill="#f43f5e"/></svg>`,
  estrella: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M16 4L18.5 12H27L20 17L22.5 25L16 20L9.5 25L12 17L5 12H13.5Z" fill="#fbbf24"/></svg>`,
  mariposa: `<svg width="36" height="32" viewBox="0 0 36 32" fill="none"><ellipse cx="9" cy="12" rx="8" ry="10" fill="#a78bfa" opacity=".7" transform="rotate(-25 9 12)"/><ellipse cx="27" cy="12" rx="8" ry="10" fill="#a78bfa" opacity=".7" transform="rotate(25 27 12)"/><ellipse cx="9" cy="22" rx="6" ry="7" fill="#c4b5fd" opacity=".6" transform="rotate(15 9 22)"/><ellipse cx="27" cy="22" rx="6" ry="7" fill="#c4b5fd" opacity=".6" transform="rotate(-15 27 22)"/><path d="M18 10Q18 16 18 22" stroke="#6d28d9" strokeWidth="1.5" strokeLinecap="round"/></svg>`,
  paloma: `<svg width="34" height="30" viewBox="0 0 34 30" fill="none"><path d="M17 14Q8 8 4 12Q8 18 17 16Q26 18 30 12Q26 8 17 14Z" fill="white" stroke="#94a3b8" strokeWidth="1"/><path d="M17 16L14 26L17 23L20 26Z" fill="#94a3b8"/><circle cx="13" cy="13" r="1.5" fill="#334155"/></svg>`,
  flor: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="4" fill="#fde68a"/><ellipse cx="16" cy="7" rx="4" ry="6" fill="#fb923c" opacity=".7"/><ellipse cx="16" cy="25" rx="4" ry="6" fill="#fb923c" opacity=".7"/><ellipse cx="7" cy="16" rx="6" ry="4" fill="#fb923c" opacity=".7"/><ellipse cx="25" cy="16" rx="6" ry="4" fill="#fb923c" opacity=".7"/></svg>`,
  luna: `<svg width="30" height="32" viewBox="0 0 30 32" fill="none"><path d="M20 4A12 12 0 1020 28A8 8 0 1120 4Z" fill="#c4b5fd"/><circle cx="22" cy="8" r="1.5" fill="#7c3aed" opacity=".5"/></svg>`,
  diamante: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M16 4L28 14L16 28L4 14Z" fill="#67e8f9" opacity=".8"/><path d="M4 14L16 14L28 14" stroke="white" strokeWidth="1"/><path d="M16 4L16 28" stroke="white" strokeWidth=".8"/></svg>`,
};

function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}

function Avatar({
  inicial,
  acento,
  titulo,
}: {
  inicial: string;
  acento: string;
  titulo: string;
}) {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        flexShrink: 0,
        background: `linear-gradient(135deg,${acento},${titulo}55)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: 13,
        color: titulo,
      }}
    >
      {inicial.toUpperCase()}
    </div>
  );
}

function SeccionHeader({
  titulo,
  subtitulo,
  tema,
}: {
  titulo: string;
  subtitulo: string;
  tema: typeof TEMAS.otro;
}) {
  return (
    <div
      className="pagina"
      style={{
        borderRadius: 20,
        padding: "36px 24px",
        textAlign: "center",
        background: tema.portada,
        boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{ marginBottom: 10, opacity: 0.7 }}
        dangerouslySetInnerHTML={{ __html: tema.ornSvg }}
      />
      <h2
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: tema.titulo,
          marginBottom: 5,
          fontFamily: "'Cormorant Garamond',serif",
        }}
      >
        {titulo}
      </h2>
      <p style={{ color: tema.subtitulo, opacity: 0.75, fontSize: 13 }}>
        {subtitulo}
      </p>
    </div>
  );
}

function Vacia({ mensaje }: { mensaje: string }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: 40,
        background: "white",
        borderRadius: 18,
        color: "#9ca3af",
        fontSize: 14,
      }}
    >
      {mensaje}
    </div>
  );
}

// ─── Tab Icons ────────────────────────────────────────────────────────────────
const TabIcons: Record<Vista, React.ReactElement> = {
  portada: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    </svg>
  ),
  fotos: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  deseos: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  ),
  asistentes: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
};

// ─── Componente principal ──────────────────────────────────────────────────────
export default function LibroRecuerdosPage() {
  const params = useParams();
  const router = useRouter();
  const eventoId = params.evento_id as string;

  const [evento, setEvento] = useState<Evento | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [deseos, setDeseos] = useState<Deseo[]>([]);
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const [descargandoFotos, setDescargandoFotos] = useState(false);
  const [descargandoDeseos, setDescargandoDeseos] = useState(false);
  const [descargandoAsistentes, setDescargandoAsistentes] = useState(false);
  const [vista, setVista] = useState<Vista>("portada");
  const [mounted, setMounted] = useState(false);

  const tokenParam =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("token")
      : "";

  useEffect(() => {
    document.title = "Eventix — Libro de recuerdos";
    setTimeout(() => setMounted(true), 50);
  }, []);

  useEffect(() => {
    async function cargar() {
      const [ev, ft, ds, inv] = await Promise.all([
        supabase.from("eventos").select("*").eq("id", eventoId).single(),
        supabase
          .from("fotos")
          .select(
            "id,url,caption,es_favorita,invitados(nombre),reacciones(emoji)",
          )
          .eq("evento_id", eventoId)
          .eq("estado", "aprobada")
          .order("es_favorita", { ascending: false }),
        supabase
          .from("deseos")
          .select("id,nombre_autor,mensaje,emoji_sticker,color_fondo")
          .eq("evento_id", eventoId)
          .eq("aprobado", true)
          .eq("incluir_en_libro", true),
        supabase
          .from("invitados")
          .select("id,nombre,estado,num_personas,mensaje")
          .eq("evento_id", eventoId)
          .eq("estado", "confirmado"),
      ]);
      if (ev.data) setEvento(ev.data);
      if (ft.data) {
        const fotosConR = ft.data.map((f: any) => {
          const c: Record<string, number> = {};
          f.reacciones?.forEach((r: { emoji: string }) => {
            c[r.emoji] = (c[r.emoji] || 0) + 1;
          });
          return {
            ...f,
            reacciones: Object.entries(c).map(([emoji, count]) => ({
              emoji,
              count,
            })),
          };
        });
        setFotos(fotosConR);
      }
      if (ds.data) setDeseos(ds.data);
      if (inv.data) setInvitados(inv.data);
      setLoading(false);
    }
    cargar();
  }, [eventoId]);

  // ── Descargar PDF (print) ──
  const generarPDF = () => {
    setGenerando(true);
    window.print();
    setTimeout(() => setGenerando(false), 1500);
  };

  // ── Descargar todas las fotos (zip simulado con links) ──
  const descargarFotos = async () => {
    if (!fotos.length) return;
    setDescargandoFotos(true);
    for (let i = 0; i < fotos.length; i++) {
      try {
        const res = await fetch(fotos[i].url);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `foto-${i + 1}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        await new Promise((r) => setTimeout(r, 400));
      } catch {
        /* skip failed */
      }
    }
    setDescargandoFotos(false);
  };

  // ── Descargar deseos como PDF via print ──
  const descargarDeseosPDF = () => {
    setDescargandoDeseos(true);
    setVista("deseos");
    setTimeout(() => {
      window.print();
      setDescargandoDeseos(false);
    }, 600);
  };

  // ── Descargar asistentes como PDF via print ──
  const descargarAsistentesPDF = () => {
    setDescargandoAsistentes(true);
    setVista("asistentes");
    setTimeout(() => {
      window.print();
      setDescargandoAsistentes(false);
    }, 600);
  };

  const cerrarSesion = async () => {
    setSaliendo(true);
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAFBFF",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 0 }}>
            <AppLogo size={52} />
          </div>
          <div
            style={{
              width: 36,
              height: 36,
              border: "3px solid #E0E7FF",
              borderTopColor: "#4F46E5",
              borderRadius: "50%",
              margin: "16px auto 12px",
              animation: "spin .8s linear infinite",
            }}
          />
          <p
            style={{
              color: "#3730A3",
              fontWeight: 600,
              fontSize: 14,
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            Preparando tu libro...
          </p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );

  if (!evento)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "#9ca3af" }}>Evento no encontrado</p>
      </div>
    );

  const tema = TEMAS[evento.tipo] ?? TEMAS.otro;
  const fechaFormateada = new Date(evento.fecha).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const totalPersonas = invitados.reduce((s, i) => s + i.num_personas, 0);

  const TABS: { key: Vista; label: string; count?: number }[] = [
    { key: "portada", label: "Portada" },
    { key: "fotos", label: "Fotos", count: fotos.length },
    { key: "deseos", label: "Deseos", count: deseos.length },
    { key: "asistentes", label: "Asistentes", count: invitados.length },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:           #FAFBFF;
          --surface:      #FFFFFF;
          --surface2:     #F4F5FB;
          --border:       rgba(79, 70, 229,0.18);
          --border-hover: rgba(79, 70, 229,0.40);
          --accent:       #4F46E5;
          --accent2:      #3730A3;
          --accent-light: #E0E7FF;
          --accent-soft:  rgba(79, 70, 229,0.09);
          --accent-soft2: rgba(79, 70, 229,0.17);
          --text:         #0F172A;
          --text2:        #475569;
          --text3:        #3730A3;
          --shadow:       0 4px 24px rgba(15,23,42,0.10);
          --shadow-sm:    0 2px 10px rgba(15,23,42,0.08);
          --shadow-btn:   0 6px 28px rgba(79, 70, 229,0.25);
          --transition:   all 0.3s cubic-bezier(.4,0,.2,1);
        }

        html, body {
          font-family: 'DM Sans', sans-serif;
          background: var(--bg);
          color: var(--text);
          -webkit-font-smoothing: antialiased;
        }

        body::before {
          content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
          opacity: 0.5;
        }

        @media print {
          .no-print { display: none !important; }
          .pagina   { page-break-after: always; }
          body      { margin: 0; padding: 0; }
          @page     { size: A4; margin: 0; }
        }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        /* ── Header ── */
        .libro-header {
          position: sticky; top: 0; z-index: 20;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
          padding-top: env(safe-area-inset-top, 0px);
        }
        .header-top {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 14px 10px;
        }
        .brand-block { display: flex; align-items: center; gap: 9px; flex: 1; min-width: 0; }
        .brand-name { font-family: 'Cormorant Garamond', serif; font-size: 19px; font-weight: 700; color: var(--text); letter-spacing: -0.3px; line-height: 1; }
        .brand-name span { color: var(--accent); }
        .brand-sub { font-size: 9.5px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text3); margin-top: 2px; display: block; }
        .brand-event { font-size: 10.5px; color: var(--accent); font-weight: 600; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }

        /* ── Botones header ── */
        .hbtn {
          display: flex; align-items: center; justify-content: center; gap: 5px;
          border-radius: 11px; padding: 7px 11px;
          font-size: 11.5px; font-weight: 700; cursor: pointer;
          border: none; white-space: nowrap; flex-shrink: 0;
          font-family: 'DM Sans', sans-serif;
          transition: var(--transition);
          -webkit-tap-highlight-color: transparent;
        }
        .hbtn-ghost { background: var(--surface); color: var(--text2); border: 1.5px solid var(--border); box-shadow: var(--shadow-sm); }
        .hbtn-ghost:hover { background: var(--accent-soft2); color: var(--accent); border-color: var(--border-hover); }
        .hbtn-primary { background: linear-gradient(135deg, var(--accent), var(--accent2)); color: white; box-shadow: var(--shadow-btn); }
        .hbtn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(79, 70, 229,0.25); }
        .hbtn-danger { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .hbtn-danger:hover { background: #fee2e2; }
        .hbtn:disabled { opacity: 0.55; cursor: not-allowed; }

        /* ── Tabs ── */
        .tabs-row {
          display: grid; grid-template-columns: repeat(4,1fr);
          border-top: 1px solid var(--border);
        }
        .tab-btn {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 2px; padding: 8px 4px;
          border: none; background: transparent; cursor: pointer;
          position: relative; transition: background .15s;
          border-right: 1px solid var(--border);
          -webkit-tap-highlight-color: transparent;
        }
        .tab-btn:last-child { border-right: none; }
        .tab-btn:hover { background: var(--accent-soft); }
        .tab-btn.active { background: var(--surface2); }
        .tab-btn.active::after {
          content: ''; position: absolute; bottom: 0; left: 10%; right: 10%;
          height: 2.5px; border-radius: 2px 2px 0 0;
          background: linear-gradient(90deg, var(--accent), var(--accent-light));
        }
        .tab-icon { line-height: 0; color: #94a3b8; }
        .tab-btn.active .tab-icon { color: var(--accent); }
        .tab-label { font-size: 9px; font-weight: 700; letter-spacing: 0.3px; color: #94a3b8; text-transform: uppercase; }
        .tab-btn.active .tab-label { color: var(--accent); }
        .tab-badge { font-size: 8px; font-weight: 800; background: #f1f5f9; color: #94a3b8; border-radius: 99px; padding: 1px 5px; line-height: 1.5; }
        .tab-btn.active .tab-badge { background: #E0E7FF; color: var(--accent2); }

        /* ── Barra de acciones de sección ── */
        .section-actions {
          display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
          padding: 10px 12px 0;
          max-width: 640px; margin: 0 auto;
        }
        .btn-dl {
          display: flex; align-items: center; gap: 6px;
          background: var(--surface); color: var(--accent2);
          border: 1.5px solid var(--border-hover); border-radius: 12px;
          padding: 9px 16px; font-size: 12px; font-weight: 700;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          transition: var(--transition); box-shadow: var(--shadow-sm);
          -webkit-tap-highlight-color: transparent;
        }
        .btn-dl:hover:not(:disabled) { background: var(--accent-soft2); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(79, 70, 229,0.18); }
        .btn-dl:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Cuerpo ── */
        .libro-body {
          background: #dde1e7; min-height: 100vh;
          padding: 16px 12px;
          padding-bottom: calc(80px + env(safe-area-inset-bottom, 16px));
        }
        .libro-inner {
          max-width: 640px; margin: 0 auto;
          display: flex; flex-direction: column; gap: 18px;
          animation: fadeUp .25s ease;
        }

        /* ── Fotos ── */
        .foto-card { display: flex; flex-direction: column; }
        .foto-img-wrap { border-radius: 13px; overflow: hidden; aspect-ratio: 1; position: relative; box-shadow: 0 4px 14px rgba(0,0,0,0.12); }
        .foto-favorita-badge { position: absolute; top: 6px; left: 6px; background: #fbbf24; color: white; border-radius: 7px; padding: 2px 7px; font-size: 9px; font-weight: 800; }
        .foto-meta { margin-top: 5px; padding: 0 2px; }
        .foto-autor { font-size: 10.5px; color: #64748b; font-weight: 600; }
        .foto-caption { font-size: 10.5px; color: #9ca3af; font-style: italic; }

        /* ── Deseos ── */
        .deseo-card { border-radius: 14px; padding: 13px; position: relative; border: 1px solid rgba(255,255,255,0.9); box-shadow: 0 2px 10px rgba(0,0,0,0.06); overflow: hidden; }
        .deseo-sticker { position: absolute; top: 8px; right: 8px; opacity: 0.45; width: 26px; height: 26px; }
        .deseo-mensaje { font-size: 12px; color: #374151; line-height: 1.65; margin-bottom: 9px; padding-right: 28px; }
        .deseo-autor { display: flex; align-items: center; gap: 7px; }
        .deseo-nombre { font-size: 11px; font-weight: 700; color: #4b5563; }

        /* ── Invitados ── */
        .inv-card { background: white; border-radius: 12px; padding: 10px 12px; display: flex; align-items: flex-start; gap: 9px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .inv-nombre { font-weight: 700; color: #1e293b; font-size: 13px; line-height: 1.2; }
        .inv-acomp  { font-size: 10px; color: #9ca3af; margin-top: 1px; }
        .inv-msg    { font-size: 10px; color: #6b7280; font-style: italic; margin-top: 2px; }

        /* ── Bottom bar ── */
        .bottom-bar {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 20;
          padding: 11px 14px;
          padding-bottom: calc(11px + env(safe-area-inset-bottom, 0px));
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border-top: 1px solid var(--border);
          box-shadow: 0 -4px 20px rgba(79, 70, 229,0.09);
        }
        .bottom-inner { display: flex; gap: 10px; max-width: 640px; margin: 0 auto; }
        .btn-back-bottom {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
          background: var(--surface); color: var(--text2);
          border: 1.5px solid var(--border); border-radius: 14px;
          padding: 13px; font-size: 14px; font-weight: 600;
          font-family: 'DM Sans', sans-serif; text-decoration: none;
          transition: var(--transition); box-shadow: var(--shadow-sm);
          -webkit-tap-highlight-color: transparent;
        }
        .btn-back-bottom:hover { background: var(--accent-soft2); color: var(--accent); border-color: var(--border-hover); }
      `}</style>

      {/* ════ HEADER ════ */}
      <div className="libro-header no-print">
        <div className="header-top">
          {/* Marca */}
          <div className="brand-block">
            <AppLogo size={30} />
            <div style={{ minWidth: 0 }}>
              <div className="brand-name">
                Event<span>ix</span>
              </div>
              <span className="brand-sub">Libro de recuerdos</span>
              <span className="brand-event">{evento.nombre}</span>
            </div>
          </div>

          {/* PDF */}
          <button
            className="hbtn hbtn-primary"
            onClick={generarPDF}
            disabled={generando}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {generando ? "..." : "PDF"}
          </button>

          {/* Salir */}
          <button
            className="hbtn hbtn-danger"
            onClick={cerrarSesion}
            disabled={saliendo}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {saliendo ? "..." : "Salir"}
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs-row">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`tab-btn${vista === t.key ? " active" : ""}`}
              onClick={() => setVista(t.key)}
            >
              <span className="tab-icon">{TabIcons[t.key]}</span>
              <span className="tab-label">{t.label}</span>
              {t.count !== undefined && (
                <span className="tab-badge">{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Acciones de sección (descargas) ── */}
      {vista === "fotos" && fotos.length > 0 && (
        <div className="section-actions no-print" style={{ marginTop: 14 }}>
          <button
            className="btn-dl"
            onClick={descargarFotos}
            disabled={descargandoFotos}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {descargandoFotos
              ? `Descargando...`
              : `Descargar ${fotos.length} fotos`}
          </button>
        </div>
      )}
      {vista === "deseos" && deseos.length > 0 && (
        <div className="section-actions no-print" style={{ marginTop: 14 }}>
          <button
            className="btn-dl"
            onClick={descargarDeseosPDF}
            disabled={descargandoDeseos}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {descargandoDeseos
              ? "Generando PDF..."
              : `Descargar ${deseos.length} deseos (PDF)`}
          </button>
        </div>
      )}
      {vista === "asistentes" && invitados.length > 0 && (
        <div className="section-actions no-print" style={{ marginTop: 14 }}>
          <button
            className="btn-dl"
            onClick={descargarAsistentesPDF}
            disabled={descargandoAsistentes}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {descargandoAsistentes
              ? "Generando PDF..."
              : `Descargar lista (${totalPersonas} personas)`}
          </button>
        </div>
      )}

      {/* ════ LIBRO BODY ════ */}
      <div className="libro-body">
        <div className="libro-inner">
          {/* ══ PORTADA ══ */}
          {vista === "portada" && (
            <div
              className="pagina"
              style={{
                borderRadius: 24,
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
                background: tema.portada,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "44px 32px",
                minHeight: 500,
                position: "relative",
              }}
            >
              <div
                style={{ marginBottom: 10, opacity: 0.8 }}
                dangerouslySetInnerHTML={{ __html: tema.ornSvg }}
              />
              {evento.imagen_url ? (
                <div
                  style={{
                    width: 148,
                    height: 148,
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "5px solid white",
                    boxShadow: "0 8px 28px rgba(0,0,0,0.15)",
                    marginBottom: 22,
                  }}
                >
                  <img
                    src={evento.imagen_url}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.6)",
                    marginBottom: 22,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                    fontSize: 32,
                  }}
                >
                  🎊
                </div>
              )}
              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: tema.titulo,
                  marginBottom: 7,
                  lineHeight: 1.15,
                  letterSpacing: -0.5,
                  fontFamily: "'Cormorant Garamond',serif",
                }}
              >
                {evento.nombre}
              </h1>
              {evento.anfitriones && (
                <p
                  style={{
                    fontSize: 16,
                    color: tema.subtitulo,
                    marginBottom: 9,
                    fontWeight: 500,
                  }}
                >
                  {evento.anfitriones}
                </p>
              )}
              {evento.frase_evento && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.6)",
                    borderRadius: 12,
                    padding: "8px 18px",
                    marginBottom: 14,
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      fontStyle: "italic",
                      color: tema.subtitulo,
                    }}
                  >
                    "{evento.frase_evento}"
                  </p>
                </div>
              )}
              <div
                style={{
                  background: tema.acento,
                  borderRadius: 99,
                  padding: "6px 20px",
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: tema.titulo,
                  marginBottom: 5,
                }}
              >
                {fechaFormateada}
              </div>
              <p
                style={{ fontSize: 11.5, color: tema.subtitulo, opacity: 0.75 }}
              >
                {evento.lugar}
              </p>
              <div style={{ display: "flex", gap: 28, marginTop: 26 }}>
                {[
                  { val: fotos.length, label: "fotos" },
                  { val: deseos.length, label: "deseos" },
                  { val: invitados.length, label: "asistentes" },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <p
                      style={{
                        fontSize: 26,
                        fontWeight: 900,
                        color: tema.titulo,
                        lineHeight: 1,
                        fontFamily: "'Cormorant Garamond',serif",
                      }}
                    >
                      {s.val}
                    </p>
                    <p
                      style={{
                        fontSize: 10.5,
                        color: tema.subtitulo,
                        opacity: 0.75,
                        marginTop: 2,
                      }}
                    >
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
              <div
                style={{ marginTop: 26, opacity: 0.4 }}
                dangerouslySetInnerHTML={{ __html: tema.ornSvg }}
              />
            </div>
          )}

          {/* ══ FOTOS ══ */}
          {vista === "fotos" && (
            <>
              <SeccionHeader
                titulo="Momentos capturados"
                subtitulo={`${fotos.length} fotografías de este día especial`}
                tema={tema}
              />
              {fotos.length === 0 ? (
                <Vacia mensaje="Aún no hay fotos en este evento" />
              ) : (
                chunk(fotos, 4).map((grupo, i) => (
                  <div
                    key={i}
                    className="pagina"
                    style={{
                      background: tema.fondo,
                      borderRadius: 20,
                      padding: 18,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                      }}
                    >
                      {grupo.map((foto) => (
                        <div key={foto.id} className="foto-card">
                          <div className="foto-img-wrap">
                            <img
                              src={foto.url}
                              alt=""
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                            {foto.es_favorita && (
                              <div className="foto-favorita-badge">
                                Favorita
                              </div>
                            )}
                          </div>
                          <div className="foto-meta">
                            <p className="foto-autor">
                              {(foto.invitados as any)?.nombre}
                            </p>
                            {foto.caption && (
                              <p className="foto-caption">{foto.caption}</p>
                            )}
                            {foto.reacciones.length > 0 && (
                              <div
                                style={{
                                  display: "flex",
                                  gap: 3,
                                  marginTop: 3,
                                  flexWrap: "wrap",
                                }}
                              >
                                {foto.reacciones.map((r) => (
                                  <span
                                    key={r.emoji}
                                    style={{
                                      fontSize: 11,
                                      background: "#f1f5f9",
                                      borderRadius: 6,
                                      padding: "1px 5px",
                                    }}
                                  >
                                    {r.emoji}
                                    {r.count > 1 ? ` ×${r.count}` : ""}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* ══ DESEOS ══ */}
          {vista === "deseos" && (
            <>
              <SeccionHeader
                titulo="Deseos y dedicatorias"
                subtitulo="Palabras llenas de cariño de quienes te quieren"
                tema={tema}
              />
              {deseos.length === 0 ? (
                <Vacia mensaje="Aún no hay deseos en este evento" />
              ) : (
                chunk(deseos, 4).map((grupo, i) => (
                  <div
                    key={i}
                    className="pagina"
                    style={{
                      background: "white",
                      borderRadius: 20,
                      padding: 18,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 11,
                      }}
                    >
                      {grupo.map((deseo) => {
                        const stickerSvg =
                          STICKERS[deseo.emoji_sticker] ?? STICKERS.corazon;
                        const esEmoji =
                          /\p{Emoji}/u.test(deseo.emoji_sticker) &&
                          !STICKERS[deseo.emoji_sticker];
                        return (
                          <div
                            key={deseo.id}
                            className="deseo-card"
                            style={{ background: deseo.color_fondo }}
                          >
                            {esEmoji ? (
                              <div
                                className="deseo-sticker"
                                style={{ fontSize: 20 }}
                              >
                                {deseo.emoji_sticker}
                              </div>
                            ) : (
                              <div
                                className="deseo-sticker"
                                dangerouslySetInnerHTML={{ __html: stickerSvg }}
                              />
                            )}
                            <p className="deseo-mensaje">"{deseo.mensaje}"</p>
                            <div className="deseo-autor">
                              <Avatar
                                inicial={deseo.nombre_autor.charAt(0)}
                                acento={tema.acento}
                                titulo={tema.titulo}
                              />
                              <span className="deseo-nombre">
                                {deseo.nombre_autor}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* ══ ASISTENTES ══ */}
          {vista === "asistentes" && (
            <>
              <SeccionHeader
                titulo="Quienes estuvieron"
                subtitulo={`${totalPersonas} personas compartieron este momento`}
                tema={tema}
              />
              <div
                className="pagina"
                style={{
                  borderRadius: 20,
                  padding: 18,
                  background: tema.fondo,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
                }}
              >
                {invitados.length === 0 ? (
                  <Vacia mensaje="Sin asistentes registrados" />
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 9,
                    }}
                  >
                    {invitados.map((inv) => (
                      <div key={inv.id} className="inv-card">
                        <Avatar
                          inicial={inv.nombre.charAt(0)}
                          acento={tema.acento}
                          titulo={tema.titulo}
                        />
                        <div style={{ minWidth: 0 }}>
                          <p className="inv-nombre">{inv.nombre}</p>
                          {inv.num_personas > 1 && (
                            <p className="inv-acomp">
                              +{inv.num_personas - 1} acompañantes
                            </p>
                          )}
                          {inv.mensaje && (
                            <p className="inv-msg">"{inv.mensaje}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cierre del libro */}
              <div
                className="pagina"
                style={{
                  borderRadius: 20,
                  padding: "40px 24px",
                  textAlign: "center",
                  background: tema.portada,
                  boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{ marginBottom: 14, opacity: 0.7 }}
                  dangerouslySetInnerHTML={{ __html: tema.ornSvg }}
                />
                <p
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: tema.titulo,
                    marginBottom: 7,
                    fontFamily: "'Cormorant Garamond',serif",
                  }}
                >
                  Gracias por ser parte de este día
                </p>
                <p
                  style={{
                    fontSize: 12.5,
                    color: tema.subtitulo,
                    opacity: 0.75,
                  }}
                >
                  {evento.nombre} · {fechaFormateada}
                </p>
                <div
                  style={{ marginTop: 18, opacity: 0.35 }}
                  dangerouslySetInnerHTML={{ __html: tema.ornSvg }}
                />
                <p
                  style={{
                    fontSize: 11.5,
                    color: tema.subtitulo,
                    marginTop: 16,
                    opacity: 0.55,
                    fontStyle: "italic",
                  }}
                >
                  Que Dios bendiga cada momento compartido
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom bar: volver al muro / dashboard ── */}
      <div className="bottom-bar no-print">
        <div className="bottom-inner">
          <Link
            href={`/muro/${eventoId}${tokenParam ? `?token=${tokenParam}` : ""}`}
            className="btn-back-bottom"
          >
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
              <path
                d="M8 2L4 6l4 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Volver al Muro
          </Link>
          {!tokenParam && (
            <Link
              href="/dashboard"
              className="btn-back-bottom"
              style={{ flex: "0 0 auto", padding: "13px 18px" }}
            >
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
