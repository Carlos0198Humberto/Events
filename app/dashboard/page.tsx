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

const TIPO_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; strip: string }
> = {
  quinceañera: {
    label: "Quinceañera",
    color: "#7c2d8e",
    bg: "#faf0fe",
    strip: "#c084fc",
  },
  boda: { label: "Boda", color: "#6d28d9", bg: "#f5f3ff", strip: "#a78bfa" },
  graduacion: {
    label: "Graduación",
    color: "#1e40af",
    bg: "#eff6ff",
    strip: "#60a5fa",
  },
  cumpleaños: {
    label: "Cumpleaños",
    color: "#92400e",
    bg: "#fffbeb",
    strip: "#fbbf24",
  },
  otro: { label: "Evento", color: "#0f766e", bg: "#f0fdfa", strip: "#2dd4bf" },
};

// ─── Iconos SVG ──────────────────────────────────────────────
const Icon = {
  calendar: () => (
    <svg
      width="16"
      height="16"
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
      width="14"
      height="14"
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
      width="15"
      height="15"
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
      width="15"
      height="15"
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
      width="15"
      height="15"
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
      width="15"
      height="15"
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
      width="15"
      height="15"
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
      width="15"
      height="15"
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
      width="15"
      height="15"
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
      width="14"
      height="14"
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
      width="17"
      height="17"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
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
  check: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M2 7l4 4 6-6" />
    </svg>
  ),
};

// ─── Logo Events ─────────────────────────────────────────────
function EventsLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="logoGradDash"
          x1="0"
          y1="0"
          x2="40"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#0D9488" />
          <stop offset="100%" stopColor="#0F766E" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#logoGradDash)" />
      <path
        d="M20 9 L21.3 16.7 L28 18 L21.3 19.3 L20 27 L18.7 19.3 L12 18 L18.7 16.7 Z"
        fill="white"
        opacity="0.95"
      />
      <circle cx="28" cy="11" r="2" fill="white" opacity="0.55" />
      <circle cx="12" cy="29" r="1.5" fill="white" opacity="0.35" />
      <path
        d="M13 30 Q20 33 27 30"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.45"
        fill="none"
      />
    </svg>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(true);
  const [eliminando, setElim] = useState<string | null>(null);

  useEffect(() => {
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
    if (!confirm("¿Eliminar este evento y todos sus datos?")) return;
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

  if (loading)
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#f0fdfa,#ccfbf1)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 16 }}>
            <EventsLogo size={44} />
          </div>
          <div
            style={{
              width: 40,
              height: 40,
              border: "3px solid #ccfbf1",
              borderTopColor: "#0D9488",
              borderRadius: "50%",
              margin: "0 auto 14px",
              animation: "spin .8s linear infinite",
            }}
          />
          <p style={{ color: "#0f766e", fontWeight: 600, fontSize: 14 }}>
            Cargando...
          </p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </main>
    );

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(160deg,#f0fdfa 0%,#eff6ff 60%,#faf5ff 100%)",
        paddingBottom: 48,
      }}
    >
      {/* ── Navbar ── */}
      <nav
        style={{
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid #ccfbf1",
          padding: "0 16px",
          height: 58,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 30,
          boxShadow: "0 1px 12px rgba(13,148,136,0.07)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <EventsLogo size={34} />
          <div>
            <p
              style={{
                fontWeight: 800,
                fontSize: 15,
                color: "#0f766e",
                lineHeight: 1,
                letterSpacing: -0.4,
              }}
            >
              Events
            </p>
            <p
              style={{
                fontSize: 10,
                color: "#5eead4",
                lineHeight: 1,
                marginTop: 2,
                fontWeight: 600,
              }}
            >
              {nombre ? `Hola, ${nombre.split(" ")[0]}` : "Dashboard"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            href="/eventos/nuevo"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "linear-gradient(135deg,#0D9488,#0F766E)",
              color: "white",
              textDecoration: "none",
              borderRadius: 10,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 700,
              boxShadow: "0 3px 12px rgba(13,148,136,0.30)",
            }}
          >
            <Icon.plus /> Nuevo
          </Link>
          <button
            onClick={cerrarSesion}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: "#fef2f2",
              color: "#dc2626",
              border: "1px solid #fecaca",
              borderRadius: 10,
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Icon.logout /> Salir
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 14px" }}>
        {/* ── Resumen global ── */}
        {eventos.length > 0 &&
          (() => {
            const totConf = Object.values(stats).reduce(
              (s, v) => s + v.confirmados,
              0,
            );
            const totFotos = Object.values(stats).reduce(
              (s, v) => s + v.total_fotos,
              0,
            );
            const totDes = Object.values(stats).reduce(
              (s, v) => s + v.total_deseos,
              0,
            );
            return (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4,1fr)",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                {[
                  {
                    val: eventos.length,
                    label: "Eventos",
                    icon: <Icon.calendar />,
                    color: "#0f766e",
                    bg: "#f0fdfa",
                    border: "#ccfbf1",
                  },
                  {
                    val: totConf,
                    label: "Confirmados",
                    icon: <Icon.users />,
                    color: "#16a34a",
                    bg: "#f0fdf4",
                    border: "#bbf7d0",
                  },
                  {
                    val: totFotos,
                    label: "Fotos",
                    icon: <Icon.camera />,
                    color: "#7c3aed",
                    bg: "#faf5ff",
                    border: "#ddd6fe",
                  },
                  {
                    val: totDes,
                    label: "Deseos",
                    icon: <Icon.heart />,
                    color: "#be185d",
                    bg: "#fdf2f8",
                    border: "#fecdd3",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: s.bg,
                      borderRadius: 14,
                      padding: "12px 8px",
                      textAlign: "center",
                      border: `1px solid ${s.border}`,
                    }}
                  >
                    <div
                      style={{
                        color: s.color,
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: 4,
                      }}
                    >
                      {s.icon}
                    </div>
                    <p
                      style={{
                        fontWeight: 800,
                        fontSize: 20,
                        color: s.color,
                        lineHeight: 1,
                      }}
                    >
                      {s.val}
                    </p>
                    <p
                      style={{
                        fontSize: 10,
                        color: s.color,
                        opacity: 0.75,
                        marginTop: 2,
                        fontWeight: 600,
                      }}
                    >
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            );
          })()}

        {/* ── Botón crear ── */}
        <Link
          href="/eventos/nuevo"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            background: "linear-gradient(135deg,#0D9488,#0F766E)",
            color: "white",
            textDecoration: "none",
            borderRadius: 16,
            padding: "16px 20px",
            fontSize: 14,
            fontWeight: 800,
            marginBottom: 24,
            boxShadow: "0 4px 20px rgba(13,148,136,0.30)",
            letterSpacing: -0.2,
          }}
        >
          <Icon.plus /> Crear nuevo evento
        </Link>

        {/* ── Lista eventos ── */}
        {eventos.length === 0 ? (
          <div
            style={{
              background: "white",
              borderRadius: 20,
              padding: "48px 24px",
              textAlign: "center",
              border: "1.5px dashed #ccfbf1",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                background: "#f0fdfa",
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: "#0D9488",
                border: "1px solid #ccfbf1",
              }}
            >
              <Icon.calendar />
            </div>
            <p
              style={{
                fontWeight: 700,
                color: "#134e4a",
                fontSize: 15,
                marginBottom: 6,
              }}
            >
              Sin eventos todavía
            </p>
            <p style={{ color: "#9ca3af", fontSize: 13 }}>
              Crea tu primer evento para comenzar
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {eventos.map((evento) => {
              const s = stats[evento.id];
              const cfg = TIPO_CONFIG[evento.tipo] || TIPO_CONFIG.otro;
              const total = s ? s.confirmados + s.declinados + s.pendientes : 0;
              const pct =
                total > 0 ? Math.round((s.confirmados / total) * 100) : 0;
              const esPasado = new Date(evento.fecha) < hoy;
              const dias = Math.ceil(
                (new Date(evento.fecha).getTime() - hoy.getTime()) / 86400000,
              );

              return (
                <div
                  key={evento.id}
                  style={{
                    background: "white",
                    borderRadius: 20,
                    overflow: "hidden",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* Franja teal superior */}
                  <div
                    style={{
                      height: 4,
                      background: `linear-gradient(90deg,#0D9488,${cfg.strip})`,
                    }}
                  />

                  {/* Header */}
                  <div style={{ padding: "14px 16px 12px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: cfg.color,
                              background: cfg.bg,
                              borderRadius: 6,
                              padding: "2px 8px",
                              letterSpacing: 0.3,
                              textTransform: "uppercase",
                            }}
                          >
                            {cfg.label}
                          </span>
                          {esPasado && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: "#64748b",
                                background: "#f1f5f9",
                                borderRadius: 6,
                                padding: "2px 8px",
                              }}
                            >
                              Finalizado
                            </span>
                          )}
                          {!esPasado && dias <= 7 && dias > 0 && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: "#0f766e",
                                background: "#ccfbf1",
                                borderRadius: 6,
                                padding: "2px 8px",
                              }}
                            >
                              {dias === 1 ? "¡Mañana!" : `${dias} días`}
                            </span>
                          )}
                        </div>
                        <p
                          style={{
                            fontWeight: 800,
                            fontSize: 16,
                            color: "#111827",
                            lineHeight: 1.25,
                            letterSpacing: -0.3,
                            marginBottom: 4,
                          }}
                        >
                          {evento.nombre}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 12,
                              color: "#64748b",
                            }}
                          >
                            <Icon.calendar />
                            {new Date(evento.fecha).toLocaleDateString(
                              "es-ES",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 12,
                              color: "#64748b",
                            }}
                          >
                            <Icon.location /> {evento.lugar}
                          </span>
                        </div>
                      </div>
                      {evento.imagen_url && (
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            overflow: "hidden",
                            flexShrink: 0,
                            border: "2px solid #ccfbf1",
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
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  {s && (
                    <div style={{ padding: "0 16px 14px" }}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(5,1fr)",
                          gap: 6,
                          marginBottom: 10,
                        }}
                      >
                        {[
                          {
                            val: s.confirmados,
                            label: "Confirm.",
                            color: "#16a34a",
                            bg: "#f0fdf4",
                          },
                          {
                            val: s.pendientes,
                            label: "Pend.",
                            color: "#d97706",
                            bg: "#fffbeb",
                          },
                          {
                            val: s.declinados,
                            label: "Declin.",
                            color: "#dc2626",
                            bg: "#fef2f2",
                          },
                          {
                            val: s.total_fotos,
                            label: "Fotos",
                            color: "#7c3aed",
                            bg: "#faf5ff",
                          },
                          {
                            val: s.total_deseos,
                            label: "Deseos",
                            color: "#be185d",
                            bg: "#fdf2f8",
                          },
                        ].map((st) => (
                          <div
                            key={st.label}
                            style={{
                              background: st.bg,
                              borderRadius: 10,
                              padding: "8px 4px",
                              textAlign: "center",
                            }}
                          >
                            <p
                              style={{
                                fontWeight: 800,
                                fontSize: 17,
                                color: st.color,
                                lineHeight: 1,
                              }}
                            >
                              {st.val}
                            </p>
                            <p
                              style={{
                                fontSize: 9,
                                color: st.color,
                                fontWeight: 700,
                                marginTop: 2,
                                opacity: 0.8,
                              }}
                            >
                              {st.label}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Barra progreso teal */}
                      <div style={{ marginBottom: 12 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 4,
                          }}
                        >
                          <span style={{ fontSize: 11, color: "#64748b" }}>
                            Confirmación {pct}%
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              color: "#0D9488",
                              fontWeight: 700,
                            }}
                          >
                            {s.total_personas} personas
                          </span>
                        </div>
                        <div
                          style={{
                            background: "#f0fdfa",
                            borderRadius: 99,
                            height: 5,
                            overflow: "hidden",
                            border: "1px solid #ccfbf1",
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              borderRadius: 99,
                              background:
                                "linear-gradient(90deg,#0D9488,#5eead4)",
                              transition: "width .6s ease",
                            }}
                          />
                        </div>
                      </div>

                      {/* Accesos rápidos */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        {[
                          {
                            href: `/muro/${evento.id}`,
                            icon: <Icon.wall />,
                            label: "Ver muro",
                            color: "#0f766e",
                            bg: "#f0fdfa",
                            border: "#ccfbf1",
                          },
                          {
                            href: `/eventos/${evento.id}/invitados`,
                            icon: <Icon.users />,
                            label: "Invitados",
                            color: "#16a34a",
                            bg: "#f0fdf4",
                            border: "#bbf7d0",
                          },
                          {
                            href: `/libro/${evento.id}`,
                            icon: <Icon.book />,
                            label: "Libro",
                            color: "#7c3aed",
                            bg: "#faf5ff",
                            border: "#ddd6fe",
                          },
                          {
                            href: `/eventos/${evento.id}/agradecimientos`,
                            icon: <Icon.mail />,
                            label: "Agradecimientos",
                            color: evento.agradecimiento_enviado
                              ? "#16a34a"
                              : "#be185d",
                            bg: evento.agradecimiento_enviado
                              ? "#f0fdf4"
                              : "#fdf2f8",
                            border: evento.agradecimiento_enviado
                              ? "#bbf7d0"
                              : "#fecdd3",
                          },
                        ].map(({ href, icon, label, color, bg, border }) => (
                          <Link
                            key={href}
                            href={href}
                            style={{
                              position: "relative",
                              display: "flex",
                              alignItems: "center",
                              gap: 7,
                              background: bg,
                              color,
                              border: `1px solid ${border}`,
                              borderRadius: 12,
                              padding: "10px 12px",
                              fontSize: 12,
                              fontWeight: 700,
                              textDecoration: "none",
                            }}
                          >
                            <span style={{ color }}>{icon}</span>
                            {label}
                            {label === "Agradecimientos" &&
                              evento.agradecimiento_enviado && (
                                <span
                                  style={{
                                    position: "absolute",
                                    top: -5,
                                    right: -5,
                                    width: 16,
                                    height: 16,
                                    background: "#16a34a",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontSize: 9,
                                    fontWeight: 800,
                                    border: "2px solid white",
                                  }}
                                >
                                  ✓
                                </span>
                              )}
                          </Link>
                        ))}
                      </div>

                      {/* Gestionar + eliminar */}
                      <div style={{ display: "flex", gap: 8 }}>
                        <Link
                          href={`/eventos/${evento.id}`}
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            background: "#f0fdfa",
                            color: "#0f766e",
                            border: "1px solid #ccfbf1",
                            borderRadius: 12,
                            padding: "9px",
                            fontSize: 12,
                            fontWeight: 700,
                            textDecoration: "none",
                          }}
                        >
                          <Icon.settings /> Gestionar
                        </Link>
                        <button
                          onClick={() => eliminarEvento(evento.id)}
                          disabled={eliminando === evento.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            background: "#fef2f2",
                            color: "#dc2626",
                            border: "1px solid #fecaca",
                            borderRadius: 12,
                            padding: "9px 14px",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <Icon.trash /> {eliminando === evento.id ? "..." : ""}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
