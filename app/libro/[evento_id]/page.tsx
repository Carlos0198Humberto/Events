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

// ─── Logo ─────────────────────────────────────────────────────────────────────
function EventsLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="9" fill="#0d9488" />
      <path
        d="M22 6L23 9L26 10L23 11L22 14L21 11L18 10L21 9Z"
        fill="white"
        opacity="0.9"
      />
      <rect
        x="5"
        y="13"
        width="16"
        height="11"
        rx="2"
        stroke="white"
        strokeWidth="1.4"
        fill="none"
      />
      <path
        d="M5 15.5L13 20L21 15.5"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M13 12C13 10.5 14 10 15 11C16 10 17 10.5 17 12C17 13.5 15 15 15 15C15 15 13 13.5 13 12Z"
        fill="white"
        opacity="0.9"
      />
    </svg>
  );
}

// ─── Íconos ───────────────────────────────────────────────────────────────────
function IconBack() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function IconDownload() {
  return (
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
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function IconLogout() {
  return (
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
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// Íconos de tabs
function IconPortada() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    </svg>
  );
}
function IconFotos() {
  return (
    <svg
      width="17"
      height="17"
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
  );
}
function IconDeseos() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}
function IconAsistentes() {
  return (
    <svg
      width="17"
      height="17"
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
  );
}

const TAB_ICONS: Record<Vista, React.ReactElement> = {
  portada: <IconPortada />,
  fotos: <IconFotos />,
  deseos: <IconDeseos />,
  asistentes: <IconAsistentes />,
};

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
    portada: "linear-gradient(160deg,#f0fdfa 0%,#d1fae5 50%,#ccfbf1 100%)",
    titulo: "#134e4a",
    subtitulo: "#0f766e",
    acento: "#5eead4",
    fondo: "#f0fdfa",
    ornSvg: `<svg width="120" height="24" viewBox="0 0 120 24" fill="none"><path d="M10 12 h100" stroke="#5eead4" strokeWidth="1" strokeDasharray="4 3"/><circle cx="60" cy="12" r="3" fill="#5eead4" opacity=".6"/></svg>`,
  },
};

// ─── Stickers elegantes ───────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
        padding: "40px 28px",
        textAlign: "center",
        background: tema.portada,
        boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{ marginBottom: 12, opacity: 0.7 }}
        dangerouslySetInnerHTML={{ __html: tema.ornSvg }}
      />
      <h2
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: tema.titulo,
          marginBottom: 6,
        }}
      >
        {titulo}
      </h2>
      <p style={{ color: tema.subtitulo, opacity: 0.75, fontSize: 14 }}>
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

// ─── Componente principal ──────────────────────────────────────────────────────
export default function LibroRecuerdosPage() {
  const params = useParams();
  const router = useRouter();
  const eventoId = params.evento_id as string;
  const libroRef = useRef<HTMLDivElement>(null);

  const [evento, setEvento] = useState<Evento | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [deseos, setDeseos] = useState<Deseo[]>([]);
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const [vista, setVista] = useState<Vista>("portada");

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

  const generarPDF = () => {
    setGenerando(true);
    window.print();
    setTimeout(() => setGenerando(false), 1500);
  };

  const cerrarSesion = async () => {
    setSaliendo(true);
    await supabase.auth.signOut();
    router.push("/");
  };

  const tokenParam =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("token")
      : "";

  // ── Loading ──
  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f0fdfa",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 44,
              height: 44,
              border: "3px solid #0d9488",
              borderTopColor: "transparent",
              borderRadius: "50%",
              margin: "0 auto 14px",
              animation: "spin .8s linear infinite",
            }}
          />
          <p style={{ color: "#0d9488", fontWeight: 600, fontSize: 14 }}>
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

  const TABS: { key: Vista; label: string; count?: number }[] = [
    { key: "portada", label: "Portada" },
    { key: "fotos", label: "Fotos", count: fotos.length },
    { key: "deseos", label: "Deseos", count: deseos.length },
    { key: "asistentes", label: "Asistentes", count: invitados.length },
  ];

  const totalPersonas = invitados.reduce((s, i) => s + i.num_personas, 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700;800&display=swap');
        @media print {
          .no-print { display: none !important; }
          .pagina   { page-break-after: always; }
          body      { margin: 0; padding: 0; }
          @page     { size: A4; margin: 0; }
        }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        /* ── Header ── */
        .libro-header {
          position: sticky; top: 0; z-index: 20;
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }
        .header-top {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px 8px;
        }
        .header-brand {
          flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px;
        }
        .header-brand-text { min-width: 0; }
        .header-brand-title {
          font-weight: 800; font-size: 13px; color: #1e293b;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          display: block; line-height: 1.2;
        }
        .header-brand-sub {
          font-size: 10px; color: #0d9488; font-weight: 600; display: block;
        }

        /* ── Botones header ── */
        .btn-back {
          display: flex; align-items: center; gap: 5px;
          background: #f1f5f9; color: #475569;
          text-decoration: none; border-radius: 10px;
          padding: 7px 11px; font-size: 12px; font-weight: 700;
          flex-shrink: 0; transition: background 0.15s;
          border: none; cursor: pointer; white-space: nowrap;
        }
        .btn-back:hover { background: #e2e8f0; }

        .btn-pdf {
          display: flex; align-items: center; gap: 5px;
          background: #0d9488; color: white;
          border: none; border-radius: 10px;
          padding: 7px 13px; font-size: 12px; font-weight: 700;
          cursor: pointer; flex-shrink: 0;
          box-shadow: 0 3px 10px rgba(13,148,136,0.35);
          transition: opacity 0.15s, transform 0.15s; white-space: nowrap;
        }
        .btn-pdf:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .btn-pdf:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-salir {
          display: flex; align-items: center; gap: 5px;
          background: #fef2f2; color: #dc2626;
          border: 1px solid #fecaca; border-radius: 10px;
          padding: 7px 11px; font-size: 12px; font-weight: 700;
          cursor: pointer; flex-shrink: 0;
          transition: background 0.15s; white-space: nowrap;
        }
        .btn-salir:hover { background: #fee2e2; }
        .btn-salir:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Tabs ── */
        .tabs-row {
          display: grid; grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid #f1f5f9;
        }
        .tab-btn {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 2px; padding: 8px 4px;
          border: none; background: transparent; cursor: pointer;
          position: relative; transition: background 0.15s;
          border-right: 1px solid #f1f5f9;
        }
        .tab-btn:last-child { border-right: none; }
        .tab-btn:hover     { background: #f8fafc; }
        .tab-btn.active    { background: #fafafa; }
        .tab-btn.active::after {
          content: ''; position: absolute; bottom: 0;
          left: 10%; right: 10%; height: 2.5px;
          border-radius: 2px 2px 0 0;
          background: linear-gradient(90deg, #0d9488, #059669);
        }
        .tab-icon { line-height: 0; }
        .tab-icon svg { display: block; }
        .tab-btn:not(.active) .tab-icon { opacity: 0.35; }
        .tab-btn.active .tab-icon       { opacity: 1; color: #0d9488; }
        .tab-label {
          font-size: 9.5px; font-weight: 700; letter-spacing: 0.02em;
          color: #94a3b8; white-space: nowrap;
        }
        .tab-btn.active .tab-label { color: #0d9488; }
        .tab-badge {
          font-size: 8.5px; font-weight: 800;
          background: #f1f5f9; color: #94a3b8;
          border-radius: 99px; padding: 1px 5px; line-height: 1.5;
        }
        .tab-btn.active .tab-badge { background: #ccfbf1; color: #0f766e; }

        /* ── Body ── */
        .libro-body {
          background: #dde1e7; min-height: 100vh; padding: 20px 12px 48px;
        }
        .libro-inner {
          max-width: 640px; margin: 0 auto;
          display: flex; flex-direction: column; gap: 20px;
          animation: fadeUp 0.25s ease;
        }

        /* ── Tarjeta foto favorita ── */
        .foto-card { display: flex; flex-direction: column; }
        .foto-img-wrap {
          border-radius: 14px; overflow: hidden;
          aspect-ratio: 1; position: relative;
          box-shadow: 0 4px 14px rgba(0,0,0,0.12);
        }
        .foto-favorita-badge {
          position: absolute; top: 7px; left: 7px;
          background: #fbbf24; color: white;
          border-radius: 8px; padding: 2px 8px;
          font-size: 10px; font-weight: 800;
        }
        .foto-meta { margin-top: 6px; padding: 0 2px; }
        .foto-autor { font-size: 11px; color: #64748b; font-weight: 600; }
        .foto-caption { font-size: 11px; color: #9ca3af; font-style: italic; }

        /* ── Tarjeta deseo ── */
        .deseo-card {
          border-radius: 14px; padding: 14px; position: relative;
          border: 1px solid rgba(255,255,255,0.9);
          box-shadow: 0 2px 10px rgba(0,0,0,0.06); overflow: hidden;
        }
        .deseo-sticker {
          position: absolute; top: 8px; right: 8px;
          opacity: 0.45; width: 28px; height: 28px;
        }
        .deseo-mensaje {
          font-size: 12px; color: #374151; line-height: 1.65;
          margin-bottom: 10px; padding-right: 30px;
        }
        .deseo-autor { display: flex; align-items: center; gap: 7px; }
        .deseo-nombre { font-size: 11px; font-weight: 700; color: #4b5563; }

        /* ── Tarjeta invitado ── */
        .inv-card {
          background: white; border-radius: 12px;
          padding: 10px 12px; display: flex;
          align-items: flex-start; gap: 9px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .inv-nombre { font-weight: 700; color: #1e293b; font-size: 13px; line-height: 1.2; }
        .inv-acomp  { font-size: 10px; color: #9ca3af; margin-top: 1px; }
        .inv-msg    { font-size: 10px; color: #6b7280; font-style: italic; margin-top: 2px; }
      `}</style>

      {/* ════ HEADER ════ */}
      <div className="libro-header no-print">
        <div className="header-top">
          {/* Volver al muro */}
          <Link
            href={`/muro/${eventoId}${tokenParam ? `?token=${tokenParam}` : ""}`}
            className="btn-back"
          >
            <IconBack />
            Muro
          </Link>

          {/* Logo + título */}
          <div className="header-brand">
            <EventsLogo size={28} />
            <div className="header-brand-text">
              <span className="header-brand-title">Libro de recuerdos</span>
              <span className="header-brand-sub">
                Events — invitaciones digitales
              </span>
            </div>
          </div>

          {/* PDF */}
          <button className="btn-pdf" onClick={generarPDF} disabled={generando}>
            <IconDownload />
            {generando ? "..." : "PDF"}
          </button>

          {/* Salir */}
          <button
            className="btn-salir"
            onClick={cerrarSesion}
            disabled={saliendo}
          >
            <IconLogout />
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
              <span className="tab-icon">{TAB_ICONS[t.key]}</span>
              <span className="tab-label">{t.label}</span>
              {t.count !== undefined && (
                <span className="tab-badge">{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ════ LIBRO BODY ════ */}
      <div className="libro-body">
        <div ref={libroRef} className="libro-inner">
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
                padding: "48px 36px",
                minHeight: 520,
                position: "relative",
              }}
            >
              <div
                style={{ marginBottom: 12, opacity: 0.8 }}
                dangerouslySetInnerHTML={{ __html: tema.ornSvg }}
              />

              {/* Foto del evento */}
              {evento.imagen_url ? (
                <div
                  style={{
                    width: 160,
                    height: 160,
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "5px solid white",
                    boxShadow: "0 8px 28px rgba(0,0,0,0.15)",
                    marginBottom: 24,
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
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.6)",
                    marginBottom: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                    fontSize: 36,
                  }}
                >
                  🎊
                </div>
              )}

              <h1
                style={{
                  fontSize: 34,
                  fontWeight: 900,
                  color: tema.titulo,
                  marginBottom: 8,
                  lineHeight: 1.15,
                  letterSpacing: -0.5,
                  fontFamily: "'Cormorant Garamond', serif",
                }}
              >
                {evento.nombre}
              </h1>

              {evento.anfitriones && (
                <p
                  style={{
                    fontSize: 17,
                    color: tema.subtitulo,
                    marginBottom: 10,
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
                    padding: "8px 20px",
                    marginBottom: 16,
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 14,
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
                  padding: "7px 22px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: tema.titulo,
                  marginBottom: 6,
                }}
              >
                {fechaFormateada}
              </div>
              <p style={{ fontSize: 12, color: tema.subtitulo, opacity: 0.75 }}>
                {evento.lugar}
              </p>

              {/* Stats */}
              <div style={{ display: "flex", gap: 32, marginTop: 28 }}>
                {[
                  { val: fotos.length, label: "fotos" },
                  { val: deseos.length, label: "deseos" },
                  { val: invitados.length, label: "asistentes" },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <p
                      style={{
                        fontSize: 28,
                        fontWeight: 900,
                        color: tema.titulo,
                        lineHeight: 1,
                        fontFamily: "'Cormorant Garamond', serif",
                      }}
                    >
                      {s.val}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
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
                style={{ marginTop: 28, opacity: 0.45 }}
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
                      padding: 20,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 14,
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
                                  gap: 4,
                                  marginTop: 3,
                                  flexWrap: "wrap",
                                }}
                              >
                                {foto.reacciones.map((r) => (
                                  <span
                                    key={r.emoji}
                                    style={{
                                      fontSize: 12,
                                      background: "#f1f5f9",
                                      borderRadius: 6,
                                      padding: "1px 6px",
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
                      padding: 20,
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
                                style={{ fontSize: 22 }}
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
                  padding: 20,
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
                      gap: 10,
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
                  padding: "44px 28px",
                  textAlign: "center",
                  background: tema.portada,
                  boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{ marginBottom: 16, opacity: 0.7 }}
                  dangerouslySetInnerHTML={{ __html: tema.ornSvg }}
                />
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: tema.titulo,
                    marginBottom: 8,
                    fontFamily: "'Cormorant Garamond', serif",
                  }}
                >
                  Gracias por ser parte de este día
                </p>
                <p
                  style={{ fontSize: 13, color: tema.subtitulo, opacity: 0.75 }}
                >
                  {evento.nombre} · {fechaFormateada}
                </p>
                <div
                  style={{ marginTop: 20, opacity: 0.4 }}
                  dangerouslySetInnerHTML={{ __html: tema.ornSvg }}
                />
                <p
                  style={{
                    fontSize: 12,
                    color: tema.subtitulo,
                    marginTop: 20,
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
    </>
  );
}
