"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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
};

// ─── Íconos SVG ──────────────────────────────────────────────
function IconBack({
  size = 18,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function IconWhatsApp({
  size = 13,
  color = "white",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
function IconCopy({
  size = 13,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}
function IconTrash({
  size = 13,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4h6v2" />
    </svg>
  );
}
function IconPlus({
  size = 18,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IconMessenger({
  size = 13,
  color = "white",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2C6.48 2 2 6.26 2 11.5c0 2.76 1.19 5.24 3.1 6.99V22l3.87-2.12c1 .28 2.07.42 3.03.42 5.52 0 10-4.26 10-9.5S17.52 2 12 2zm1 13l-2.5-2.67L6 15l4.89-5.19L13.5 12.5 18 9l-5 6z" />
    </svg>
  );
}
function IconSearch({
  size = 15,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

// ─── Logo ─────────────────────────────────────────────────────
function EventsLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient
          id="lgInv"
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
      <rect width="40" height="40" rx="12" fill="url(#lgInv)" />
      <path
        d="M20 9 L21.3 16.7 L28 18 L21.3 19.3 L20 27 L18.7 19.3 L12 18 L18.7 16.7 Z"
        fill="white"
        opacity="0.95"
      />
      <circle cx="28" cy="11" r="2" fill="white" opacity="0.55" />
      <circle cx="12" cy="29" r="1.5" fill="white" opacity="0.35" />
    </svg>
  );
}

// ─── Colores por tipo ─────────────────────────────────────────
const TIPO_COLOR: Record<
  string,
  { texto: string; claro: string; acento: string }
> = {
  quinceañera: { texto: "#9d174d", claro: "#fce7f3", acento: "#f9a8d4" },
  boda: { texto: "#6b21a8", claro: "#f3e8ff", acento: "#d8b4fe" },
  graduacion: { texto: "#1e40af", claro: "#dbeafe", acento: "#93c5fd" },
  cumpleaños: { texto: "#92400e", claro: "#fef3c7", acento: "#fcd34d" },
  otro: { texto: "#0f766e", claro: "#ccfbf1", acento: "#5eead4" },
};

// ─── Formulario nuevo invitado ────────────────────────────────
type FormData = {
  nombre: string;
  telefono: string;
  email: string;
  num_personas: number;
};

function FormNuevoInvitado({
  eventoId,
  onGuardado,
  col,
}: {
  eventoId: string;
  onGuardado: () => void;
  col: { texto: string; claro: string; acento: string };
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

  if (!expandido) {
    return (
      <button
        onClick={() => setExpandido(true)}
        style={{
          width: "100%",
          background: "linear-gradient(135deg,#0D9488,#0F766E)",
          color: "white",
          border: "none",
          borderRadius: 18,
          padding: "16px 24px",
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: "0 4px 16px rgba(13,148,136,0.35)",
        }}
      >
        <IconPlus size={18} color="white" /> Agregar invitado
      </button>
    );
  }

  return (
    <div
      style={{
        background: "white",
        borderRadius: 20,
        padding: 20,
        border: `1.5px solid ${col.acento}`,
        boxShadow: "0 4px 20px rgba(13,148,136,0.10)",
      }}
    >
      <p
        style={{
          fontWeight: 700,
          color: col.texto,
          fontSize: 15,
          marginBottom: 16,
        }}
      >
        Nuevo invitado
      </p>

      {[
        {
          key: "nombre",
          label: "Nombre completo *",
          placeholder: "Ej: María García",
          type: "text",
        },
        {
          key: "telefono",
          label: "Teléfono (WhatsApp)",
          placeholder: "Ej: +503 7000 0000",
          type: "tel",
        },
        {
          key: "email",
          label: "Correo electrónico",
          placeholder: "Ej: maria@correo.com",
          type: "email",
        },
      ].map(({ key, label, placeholder, type }) => (
        <div key={key} style={{ marginBottom: 14 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: col.texto,
              display: "block",
              marginBottom: 6,
            }}
          >
            {label}
          </label>
          <input
            type={type}
            value={(form as any)[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            placeholder={placeholder}
            style={{
              width: "100%",
              border: `1.5px solid ${col.acento}`,
              borderRadius: 12,
              padding: "10px 14px",
              fontSize: 14,
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
              background: col.claro,
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#0D9488";
              e.currentTarget.style.boxShadow =
                "0 0 0 3px rgba(13,148,136,0.10)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = col.acento;
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
      ))}

      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: col.texto,
            display: "block",
            marginBottom: 6,
          }}
        >
          Número de personas
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {[
            {
              op: "−",
              fn: () =>
                setForm({
                  ...form,
                  num_personas: Math.max(1, form.num_personas - 1),
                }),
            },
            {
              op: "+",
              fn: () =>
                setForm({
                  ...form,
                  num_personas: Math.min(10, form.num_personas + 1),
                }),
            },
          ].map((btn, i) => (
            <button
              key={i}
              onClick={btn.fn}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: `1.5px solid ${col.acento}`,
                background: col.claro,
                color: col.texto,
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
              }}
            >
              {btn.op}
            </button>
          ))}
          <span
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: col.texto,
              minWidth: 28,
              textAlign: "center",
            }}
          >
            {form.num_personas}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => setExpandido(false)}
          style={{
            flex: 1,
            background: col.claro,
            color: col.texto,
            border: `1px solid ${col.acento}`,
            borderRadius: 12,
            padding: "12px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
        <button
          onClick={guardar}
          disabled={guardando || !form.nombre.trim()}
          style={{
            flex: 2,
            background: form.nombre.trim()
              ? "linear-gradient(135deg,#0D9488,#0F766E)"
              : "#e2e8f0",
            color: form.nombre.trim() ? "white" : "#9ca3af",
            border: "none",
            borderRadius: 12,
            padding: "12px",
            fontSize: 14,
            fontWeight: 700,
            cursor: form.nombre.trim() ? "pointer" : "not-allowed",
            boxShadow: form.nombre.trim()
              ? "0 3px 12px rgba(13,148,136,0.25)"
              : "none",
          }}
        >
          {guardando ? "Guardando..." : "Guardar invitado"}
        </button>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────
function Toast({ mensaje, visible }: { mensaje: string; visible: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? "0" : "80px"})`,
        background: "#0f766e",
        color: "white",
        padding: "10px 22px",
        borderRadius: 99,
        fontSize: 13,
        fontWeight: 700,
        boxShadow: "0 4px 20px rgba(13,148,136,0.35)",
        transition: "transform 0.3s ease, opacity 0.3s ease",
        opacity: visible ? 1 : 0,
        zIndex: 100,
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}
    >
      ✓ {mensaje}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────
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
  const [eliminandoInv, setEliminandoInv] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    const [{ data: eventoData }, { data: invitadosData }] = await Promise.all([
      supabase.from("eventos").select("*").eq("id", eventoId).single(),
      supabase
        .from("invitados")
        .select("*")
        .eq("evento_id", eventoId)
        .order("created_at", { ascending: false }),
    ]);
    if (eventoData) setEvento(eventoData);
    if (invitadosData) setInvitados(invitadosData);
    setLoading(false);
  }

  function mostrarToast(msg: string) {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }

  function copiarLink(token: string) {
    navigator.clipboard.writeText(
      `${window.location.origin}/confirmar/${token}`,
    );
    setCopiado(token);
    mostrarToast("Link copiado al portapapeles");
    setTimeout(() => setCopiado(null), 2000);
  }

  function compartirWhatsApp(invitado: Invitado) {
    if (!evento) return;
    const link = `${window.location.origin}/confirmar/${invitado.token}`;
    const msg = `Hola ${invitado.nombre}! Te invitamos a *${evento.nombre}*.\n\nConfirma tu asistencia aquí: ${link}`;
    window.open(
      `https://wa.me/${invitado.telefono?.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  }

  function compartirMessenger(invitado: Invitado) {
    const link = `${window.location.origin}/confirmar/${invitado.token}`;
    window.open(
      `https://www.facebook.com/dialog/send?link=${encodeURIComponent(link)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(link)}`,
      "_blank",
    );
  }

  async function eliminarInvitado(id: string) {
    if (!confirm("¿Eliminar este invitado?")) return;
    setEliminandoInv(id);
    await supabase.from("invitados").delete().eq("id", id);
    setInvitados((prev) => prev.filter((i) => i.id !== id));
    setEliminandoInv(null);
    mostrarToast("Invitado eliminado");
  }

  const confirmados = invitados.filter((i) => i.estado === "confirmado");
  const rechazados = invitados.filter((i) => i.estado === "rechazado");
  const pendientes = invitados.filter((i) => i.estado === "pendiente");
  const totalPersonas = confirmados.reduce(
    (sum, i) => sum + (i.num_personas || 1),
    0,
  );

  const invitadosFiltrados = (
    filtro === "todos"
      ? invitados
      : filtro === "confirmado"
        ? confirmados
        : filtro === "rechazado"
          ? rechazados
          : pendientes
  ).filter(
    (i) =>
      busqueda.trim() === "" ||
      i.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      i.telefono?.includes(busqueda) ||
      i.email?.toLowerCase().includes(busqueda.toLowerCase()),
  );

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
          <EventsLogo size={44} />
          <div
            style={{
              width: 40,
              height: 40,
              border: "3px solid #ccfbf1",
              borderTopColor: "#0D9488",
              borderRadius: "50%",
              margin: "16px auto 12px",
              animation: "spin .8s linear infinite",
            }}
          />
          <p style={{ color: "#0f766e", fontWeight: 600, fontSize: 14 }}>
            Cargando...
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </main>
    );

  if (!evento) return null;
  const col = TIPO_COLOR[evento.tipo] || TIPO_COLOR.otro;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#f0fdfa,#eff6ff)",
        paddingBottom: 40,
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .inv-card { animation: fadeIn 0.25s ease both; }
      `}</style>

      {/* ── Header ── */}
      <div
        style={{
          background: "rgba(255,255,255,0.97)",
          borderBottom: "1px solid #ccfbf1",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          position: "sticky",
          top: 0,
          zIndex: 10,
          boxShadow: "0 1px 12px rgba(13,148,136,0.08)",
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            color: "#0f766e",
            background: "#f0fdfa",
            border: "1px solid #ccfbf1",
            borderRadius: 10,
            padding: "7px 14px",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <IconBack size={16} color="#0f766e" /> Atrás
        </button>
        <EventsLogo size={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontWeight: 800,
              color: "#0f766e",
              fontSize: 16,
              lineHeight: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Invitados
          </p>
          <p
            style={{
              fontSize: 12,
              color: "#5eead4",
              marginTop: 2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontWeight: 600,
            }}
          >
            {evento.nombre}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 500, margin: "0 auto", padding: "20px 16px" }}>
        {/* ── Stats ── */}
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
              num: invitados.length,
              label: "Total",
              color: "#0f766e",
              bg: "#f0fdfa",
              border: "#ccfbf1",
            },
            {
              num: confirmados.length,
              label: "Confirm.",
              color: "#16a34a",
              bg: "#f0fdf4",
              border: "#bbf7d0",
            },
            {
              num: rechazados.length,
              label: "Declinaron",
              color: "#dc2626",
              bg: "#fef2f2",
              border: "#fecaca",
            },
            {
              num: totalPersonas,
              label: "Personas",
              color: "#0f766e",
              bg: "#f0fdfa",
              border: "#ccfbf1",
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: s.bg,
                borderRadius: 16,
                padding: "12px 8px",
                textAlign: "center",
                border: `1px solid ${s.border}`,
              }}
            >
              <p style={{ fontSize: 22, fontWeight: 800, color: s.color }}>
                {s.num}
              </p>
              <p
                style={{
                  fontSize: 10,
                  color: s.color,
                  opacity: 0.8,
                  marginTop: 2,
                  fontWeight: 600,
                }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Formulario ── */}
        <div style={{ marginBottom: 20 }}>
          <FormNuevoInvitado
            eventoId={eventoId}
            onGuardado={cargarDatos}
            col={col}
          />
        </div>

        {/* ── Buscador ── */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <div
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          >
            <IconSearch size={15} color="#5eead4" />
          </div>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, teléfono o correo..."
            style={{
              width: "100%",
              border: "1.5px solid #ccfbf1",
              borderRadius: 14,
              padding: "10px 14px 10px 36px",
              fontSize: 13,
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
              background: "white",
              color: "#111",
              boxShadow: "0 1px 4px rgba(13,148,136,0.06)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#0D9488";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#ccfbf1";
            }}
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "#ccfbf1",
                border: "none",
                borderRadius: "50%",
                width: 20,
                height: 20,
                fontSize: 11,
                cursor: "pointer",
                color: "#0f766e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* ── Filtros ── */}
        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            paddingBottom: 4,
            marginBottom: 16,
          }}
        >
          {[
            { value: "todos", label: `Todos (${invitados.length})` },
            { value: "pendiente", label: `Pendientes (${pendientes.length})` },
            {
              value: "confirmado",
              label: `Confirmados (${confirmados.length})`,
            },
            { value: "rechazado", label: `Declinaron (${rechazados.length})` },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              style={{
                flexShrink: 0,
                padding: "7px 14px",
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                border: "none",
                background:
                  filtro === f.value
                    ? "linear-gradient(135deg,#0D9488,#0F766E)"
                    : "white",
                color: filtro === f.value ? "white" : "#64748b",
                boxShadow:
                  filtro === f.value
                    ? "0 3px 10px rgba(13,148,136,0.25)"
                    : "0 1px 4px rgba(0,0,0,0.06)",
                transition: "all 0.15s",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Lista ── */}
        {invitadosFiltrados.length === 0 ? (
          <div
            style={{
              background: "white",
              borderRadius: 20,
              padding: 40,
              textAlign: "center",
              border: "1px solid #ccfbf1",
            }}
          >
            <p style={{ fontSize: 28, marginBottom: 8 }}>
              {busqueda ? "🔍" : "👥"}
            </p>
            <p style={{ color: "#0f766e", fontSize: 14, fontWeight: 600 }}>
              {busqueda
                ? `Sin resultados para "${busqueda}"`
                : "No hay invitados en esta categoría"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {invitadosFiltrados.map((invitado, idx) => (
              <div
                key={invitado.id}
                className="inv-card"
                style={{
                  background: "white",
                  borderRadius: 18,
                  padding: 16,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(13,148,136,0.05)",
                  animationDelay: `${idx * 0.04}s`,
                }}
              >
                {/* Info invitado */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: col.claro,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: col.texto,
                        fontWeight: 800,
                        fontSize: 16,
                        flexShrink: 0,
                        border: `1.5px solid ${col.acento}`,
                      }}
                    >
                      {invitado.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          fontWeight: 700,
                          color: "#111",
                          fontSize: 14,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 160,
                        }}
                      >
                        {invitado.nombre}
                      </p>
                      <p style={{ fontSize: 12, color: "#94a3b8" }}>
                        {invitado.telefono || invitado.email || "Sin contacto"}
                      </p>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "4px 10px",
                      borderRadius: 99,
                      fontWeight: 700,
                      flexShrink: 0,
                      background:
                        invitado.estado === "confirmado"
                          ? "#dcfce7"
                          : invitado.estado === "rechazado"
                            ? "#fee2e2"
                            : "#f0fdfa",
                      color:
                        invitado.estado === "confirmado"
                          ? "#16a34a"
                          : invitado.estado === "rechazado"
                            ? "#dc2626"
                            : "#0f766e",
                      border: `1px solid ${invitado.estado === "confirmado" ? "#86efac" : invitado.estado === "rechazado" ? "#fecaca" : "#ccfbf1"}`,
                    }}
                  >
                    {invitado.estado === "confirmado"
                      ? `${invitado.num_personas} persona(s)`
                      : invitado.estado === "rechazado"
                        ? "Declinó"
                        : "Pendiente"}
                  </span>
                </div>

                {/* Botones compartir */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <button
                    onClick={() => compartirWhatsApp(invitado)}
                    style={{
                      background: "#16a34a",
                      color: "white",
                      border: "none",
                      borderRadius: 12,
                      padding: "9px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <IconWhatsApp size={14} color="white" /> WhatsApp
                  </button>
                  <button
                    onClick={() => compartirMessenger(invitado)}
                    style={{
                      background: "linear-gradient(135deg,#0084ff,#a334fa)",
                      color: "white",
                      border: "none",
                      borderRadius: 12,
                      padding: "9px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <IconMessenger size={14} color="white" /> Messenger
                  </button>
                </div>

                {/* Copiar + Eliminar */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  <button
                    onClick={() => copiarLink(invitado.token)}
                    style={{
                      background:
                        copiado === invitado.token ? "#f0fdf4" : "#f0fdfa",
                      color: copiado === invitado.token ? "#16a34a" : "#0f766e",
                      border: `1px solid ${copiado === invitado.token ? "#86efac" : "#ccfbf1"}`,
                      borderRadius: 12,
                      padding: "9px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      transition: "all 0.2s",
                    }}
                  >
                    <IconCopy
                      size={13}
                      color={copiado === invitado.token ? "#16a34a" : "#0f766e"}
                    />
                    {copiado === invitado.token ? "¡Copiado!" : "Copiar link"}
                  </button>
                  <button
                    onClick={() => eliminarInvitado(invitado.id)}
                    disabled={eliminandoInv === invitado.id}
                    style={{
                      background: "#fef2f2",
                      color: "#dc2626",
                      border: "1px solid #fecaca",
                      borderRadius: 12,
                      padding: "9px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      opacity: eliminandoInv === invitado.id ? 0.5 : 1,
                    }}
                  >
                    <IconTrash size={13} color="#dc2626" />
                    {eliminandoInv === invitado.id ? "..." : "Eliminar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Toast mensaje={toastMsg} visible={toastVisible} />
    </main>
  );
}
