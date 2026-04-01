"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

// ─── Tipos ─────────────────────────────────────────────────
type Invitado = {
  id: string;
  nombre: string;
  estado: string;
  num_personas: number;
  mensaje: string | null;
  token: string;
  evento_id: string;
};

type Evento = {
  id: string;
  nombre: string;
  tipo: string;
  fecha: string;
  hora: string;
  lugar: string;
  anfitriones: string | null;
  frase_evento: string | null;
  imagen_url: string | null;
  foto_lugar_url: string | null;
  mensaje_invitacion: string | null;
  maps_url: string | null;
  fecha_limite_confirmacion: string;
  color_primario: string;
  color_secundario: string;
};

// ─── Paletas por tipo ───────────────────────────────────────
const PALETAS: Record<
  string,
  {
    gradHero: string;
    gradBg: string;
    texto: string;
    acento: string;
    claro: string;
    label: string;
    emoji: string;
  }
> = {
  boda: {
    gradHero: "linear-gradient(135deg,#fce7f3 0%,#f3e8ff 50%,#fbcfe8 100%)",
    gradBg: "linear-gradient(180deg,#fdf4ff,#fff)",
    texto: "#6b21a8",
    acento: "#d8b4fe",
    claro: "#f3e8ff",
    label: "Boda",
    emoji: "💍",
  },
  quinceañera: {
    gradHero: "linear-gradient(135deg,#fae8ff 0%,#f0abfc 40%,#e879f9 100%)",
    gradBg: "linear-gradient(180deg,#fdf4ff,#fff)",
    texto: "#86198f",
    acento: "#f0abfc",
    claro: "#fae8ff",
    label: "Quinceañera",
    emoji: "👑",
  },
  cumpleaños: {
    gradHero: "linear-gradient(135deg,#fef3c7 0%,#fde68a 40%,#fbbf24 100%)",
    gradBg: "linear-gradient(180deg,#fffbeb,#fff)",
    texto: "#78350f",
    acento: "#fcd34d",
    claro: "#fef3c7",
    label: "Cumpleaños",
    emoji: "🎂",
  },
  graduacion: {
    gradHero: "linear-gradient(135deg,#dbeafe 0%,#93c5fd 40%,#60a5fa 100%)",
    gradBg: "linear-gradient(180deg,#eff6ff,#fff)",
    texto: "#1e3a8a",
    acento: "#93c5fd",
    claro: "#dbeafe",
    label: "Graduación",
    emoji: "🎓",
  },
  otro: {
    gradHero: "linear-gradient(135deg,#ccfbf1 0%,#5eead4 40%,#2dd4bf 100%)",
    gradBg: "linear-gradient(180deg,#f0fdfa,#fff)",
    texto: "#0f766e",
    acento: "#5eead4",
    claro: "#ccfbf1",
    label: "Evento",
    emoji: "✨",
  },
};

// ─── Iconos SVG ─────────────────────────────────────────────
function IconCheck({
  size = 20,
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconX({
  size = 20,
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IconCamera({
  size = 20,
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
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
function IconGallery({
  size = 20,
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
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}
function IconHeart({
  size = 20,
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
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}
function IconMap({
  size = 20,
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
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}
function IconStar({
  size = 20,
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
      fill={color}
      stroke="none"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

// ─── Logo Events ─────────────────────────────────────────────
function EventsLogo({ size = 28 }: { size?: number }) {
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
          id="logoGradInv"
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
      <rect width="40" height="40" rx="12" fill="url(#logoGradInv)" />
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

// ─── Número de tarjeta desde token ──────────────────────────
function tokenToCardNumber(token: string): string {
  const suffix = token
    .slice(-8)
    .replace(/[^a-f0-9]/gi, "")
    .slice(-4);
  const num = parseInt(suffix, 16) % 9999;
  return String(num + 1).padStart(4, "0");
}

// ─── SubirFotoSection ────────────────────────────────────────
function SubirFotoSection({
  invitado,
  eventoId,
  col,
}: {
  invitado: Invitado;
  eventoId: string;
  col: (typeof PALETAS)[string];
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [yaSubio, setYaSubio] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [caption, setCaption] = useState("");

  useEffect(() => {
    supabase
      .from("fotos")
      .select("id")
      .eq("invitado_id", invitado.id)
      .then(({ data }) => {
        if (data && data.length > 0) setYaSubio(true);
      });
  }, [invitado.id]);

  const seleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setArchivo(f);
    setPreview(URL.createObjectURL(f));
  };

  const subirFoto = async () => {
    if (!archivo) return;
    setSubiendo(true);
    const ext = archivo.name.split(".").pop();
    const path = `${eventoId}/${invitado.id}_${Date.now()}.${ext}`;
    const { error: storageError } = await supabase.storage
      .from("fotos-eventos")
      .upload(path, archivo, { upsert: false });
    if (storageError) {
      alert("Error al subir. Intenta de nuevo.");
      setSubiendo(false);
      return;
    }
    const { data: urlData } = supabase.storage
      .from("fotos-eventos")
      .getPublicUrl(path);
    await supabase
      .from("fotos")
      .insert({
        evento_id: eventoId,
        invitado_id: invitado.id,
        url: urlData.publicUrl,
        path,
        caption: caption.trim() || null,
      });
    setYaSubio(true);
    setSubiendo(false);
  };

  if (yaSubio) {
    return (
      <div
        style={{
          background: col.claro,
          borderRadius: 18,
          padding: "18px 22px",
          border: `1.5px solid ${col.acento}`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: col.texto,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 10px",
          }}
        >
          <IconCheck size={24} color="white" />
        </div>
        <p style={{ fontWeight: 700, color: col.texto, fontSize: 15 }}>
          Foto enviada al muro ✓
        </p>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
          Tu momento ya está en el álbum del evento
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "white",
        borderRadius: 20,
        padding: 20,
        border: `1px solid ${col.acento}50`,
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
      }}
    >
      <p
        style={{
          fontWeight: 700,
          color: col.texto,
          fontSize: 15,
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <IconCamera size={18} color={col.texto} /> Comparte una foto del evento
      </p>
      {preview ? (
        <div style={{ marginBottom: 14 }}>
          <img
            src={preview}
            alt="Vista previa"
            style={{
              width: "100%",
              borderRadius: 14,
              maxHeight: 220,
              objectFit: "cover",
              display: "block",
            }}
          />
          <button
            onClick={() => {
              setPreview(null);
              setArchivo(null);
            }}
            style={{
              marginTop: 8,
              background: "none",
              border: "none",
              color: "#9ca3af",
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <IconX size={14} color="#9ca3af" /> Cambiar foto
          </button>
        </div>
      ) : (
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            border: `2px dashed ${col.acento}`,
            borderRadius: 16,
            padding: "28px 20px",
            cursor: "pointer",
            background: col.claro,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: col.acento,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconCamera size={22} color={col.texto} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: col.texto }}>
            Toca para seleccionar una foto
          </p>
          <p style={{ fontSize: 12, color: "#94a3b8" }}>JPG, PNG · máx 10MB</p>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={seleccionarArchivo}
            style={{ display: "none" }}
          />
        </label>
      )}
      {preview && (
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Añade una descripción (opcional)"
          maxLength={120}
          style={{
            width: "100%",
            border: `1.5px solid ${col.acento}`,
            borderRadius: 12,
            padding: "10px 14px",
            fontSize: 13,
            outline: "none",
            fontFamily: "inherit",
            boxSizing: "border-box",
            background: col.claro,
            marginBottom: 14,
          }}
        />
      )}
      {archivo && (
        <button
          onClick={subirFoto}
          disabled={subiendo}
          style={{
            width: "100%",
            background: `linear-gradient(135deg,#0D9488,#0F766E)`,
            color: "white",
            border: "none",
            borderRadius: 14,
            padding: "14px",
            fontSize: 14,
            fontWeight: 700,
            cursor: subiendo ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: "0 4px 16px rgba(13,148,136,0.30)",
          }}
        >
          <IconCamera size={18} color="white" />
          {subiendo ? "Subiendo..." : "Publicar en el muro"}
        </button>
      )}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────
export default function ConfirmarInvitacion() {
  const params = useParams();
  const token = params.token as string;

  const [invitado, setInvitado] = useState<Invitado | null>(null);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [paso, setPaso] = useState<
    "invitacion" | "formulario" | "confirmado" | "rechazado"
  >("invitacion");
  const [numPersonas, setNumPersonas] = useState(1);
  const [mensaje, setMensaje] = useState("");
  const [alergias, setAlergias] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [yaRespondio, setYaRespondio] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    async function cargar() {
      const { data: inv } = await supabase
        .from("invitados")
        .select("*")
        .eq("token", token)
        .single();
      if (!inv) {
        setLoading(false);
        return;
      }
      setInvitado(inv);
      setNumPersonas(inv.num_personas || 1);
      if (inv.estado !== "pendiente") {
        setYaRespondio(true);
        setPaso(inv.estado === "confirmado" ? "confirmado" : "rechazado");
      }
      const { data: ev } = await supabase
        .from("eventos")
        .select("*")
        .eq("id", inv.evento_id)
        .single();
      if (ev) setEvento(ev);
      setLoading(false);
    }
    cargar();
  }, [token]);

  const confirmar = async () => {
    if (!invitado) return;
    setGuardando(true);
    await supabase
      .from("invitados")
      .update({
        estado: "confirmado",
        num_personas: numPersonas,
        mensaje: mensaje.trim() || null,
        alergias: alergias.trim() || null,
        respondido_at: new Date().toISOString(),
      })
      .eq("id", invitado.id);
    setPaso("confirmado");
    setGuardando(false);
  };

  const rechazar = async () => {
    if (!invitado) return;
    setGuardando(true);
    await supabase
      .from("invitados")
      .update({ estado: "rechazado", respondido_at: new Date().toISOString() })
      .eq("id", invitado.id);
    setPaso("rechazado");
    setGuardando(false);
  };

  if (loading)
    return (
      <main
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
              width: 52,
              height: 52,
              borderRadius: "50%",
              border: "3px solid #ccfbf1",
              borderTopColor: "#0D9488",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 14px",
            }}
          />
          <EventsLogo size={24} />
          <p
            style={{
              color: "#0f766e",
              fontWeight: 600,
              fontSize: 13,
              marginTop: 10,
            }}
          >
            Cargando tu invitación...
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </main>
    );

  if (!invitado || !evento)
    return (
      <main
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
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#ccfbf1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <IconX size={28} color="#0f766e" />
          </div>
          <p style={{ color: "#134e4a", fontWeight: 700, fontSize: 16 }}>
            Invitación no encontrada
          </p>
          <p style={{ color: "#5eead4", fontSize: 13, marginTop: 4 }}>
            Verifica el enlace que recibiste
          </p>
        </div>
      </main>
    );

  const col = PALETAS[evento.tipo] || PALETAS.otro;
  const cardNumber = tokenToCardNumber(invitado.token);
  const fechaEvento = new Date(evento.fecha).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const fechaLimite = new Date(
    evento.fecha_limite_confirmacion,
  ).toLocaleDateString("es-ES", { day: "numeric", month: "long" });
  const muroUrl = `/muro/${evento.id}?token=${invitado.token}`;
  const muroDeseosUrl = `/muro/${evento.id}?token=${invitado.token}&tab=deseos`;

  // ── Menú flotante ──
  const MenuFlotante = () => (
    <div style={{ position: "fixed", bottom: 24, right: 20, zIndex: 100 }}>
      {menuAbierto && (
        <div
          style={{
            position: "absolute",
            bottom: 64,
            right: 0,
            background: "white",
            borderRadius: 18,
            padding: "8px 0",
            boxShadow: "0 8px 32px rgba(13,148,136,0.18)",
            border: "1px solid #ccfbf1",
            minWidth: 200,
            overflow: "hidden",
          }}
        >
          <Link
            href={muroUrl}
            onClick={() => setMenuAbierto(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 20px",
              textDecoration: "none",
              color: "#134e4a",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <IconGallery size={18} color="#0D9488" /> Ver muro del evento
          </Link>
          <div style={{ height: 1, background: "#f0fdfa", margin: "4px 0" }} />
          <Link
            href={`/libro/${evento.id}?token=${invitado.token}`}
            onClick={() => setMenuAbierto(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 20px",
              textDecoration: "none",
              color: "#134e4a",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0D9488"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
            Libro de recuerdos
          </Link>
        </div>
      )}
      <button
        onClick={() => setMenuAbierto(!menuAbierto)}
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "linear-gradient(135deg,#0D9488,#0F766E)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 24px rgba(13,148,136,0.45)",
          transition: "transform 0.2s",
          transform: menuAbierto ? "rotate(45deg)" : "rotate(0deg)",
        }}
      >
        {menuAbierto ? (
          <IconX size={22} color="white" />
        ) : (
          <svg
            width={22}
            height={22}
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <circle cx="12" cy="5" r="1" fill="white" />
            <circle cx="12" cy="12" r="1" fill="white" />
            <circle cx="12" cy="19" r="1" fill="white" />
          </svg>
        )}
      </button>
    </div>
  );

  // ══════════ VISTA: INVITACIÓN ══════════
  if (paso === "invitacion")
    return (
      <main
        style={{
          minHeight: "100vh",
          background: col.gradBg,
          paddingBottom: 100,
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;600;700;800&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'DM Sans', sans-serif; }
          @keyframes spin { to { transform: rotate(360deg) } }
          @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
          @keyframes popIn { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }
          .card-badge-shine { background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.55) 50%, transparent 60%); background-size: 200% 100%; animation: shine 3s ease-in-out infinite; }
          @keyframes shine { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
        `}</style>

        {/* ── HERO con número de tarjeta ── */}
        <div
          style={{
            position: "relative",
            background: col.gradHero,
            overflow: "hidden",
            paddingBottom: 40,
          }}
        >
          {evento.imagen_url && (
            <div
              style={{ position: "relative", height: 240, overflow: "hidden" }}
            >
              <img
                src={evento.imagen_url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to bottom,rgba(0,0,0,0.05),rgba(0,0,0,0.45))",
                }}
              />
            </div>
          )}

          <div
            style={{
              textAlign: "center",
              padding: "32px 24px 0",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Logo */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                marginBottom: 14,
              }}
            >
              <EventsLogo size={22} />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: col.texto,
                  opacity: 0.75,
                  letterSpacing: 0.5,
                }}
              >
                Events
              </span>
            </div>

            {/* ── NÚMERO DE TARJETA ── */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(255,255,255,0.85)",
                borderRadius: 99,
                padding: "5px 14px",
                marginBottom: 14,
                border: `1.5px solid ${col.acento}`,
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                className="card-badge-shine"
                style={{ position: "absolute", inset: 0 }}
              />
              <span style={{ fontSize: 16, position: "relative", zIndex: 1 }}>
                🎫
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: col.texto,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                Tarjeta #{cardNumber}
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: col.texto,
                  opacity: 0.55,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                · {col.label}
              </span>
            </div>

            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: col.texto,
                opacity: 0.7,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              Tienes una invitación especial
            </p>
            <h1
              style={{
                fontSize: 30,
                fontWeight: 900,
                color: col.texto,
                lineHeight: 1.15,
                marginBottom: 8,
                fontFamily: "'Cormorant Garamond', serif",
              }}
            >
              {col.emoji} {evento.nombre}
            </h1>
            {evento.anfitriones && (
              <p
                style={{
                  fontSize: 15,
                  color: col.texto,
                  opacity: 0.85,
                  fontWeight: 500,
                  marginBottom: 8,
                }}
              >
                {evento.anfitriones}
              </p>
            )}
            {evento.frase_evento && (
              <div
                style={{
                  display: "inline-block",
                  background: "rgba(255,255,255,0.75)",
                  borderRadius: 99,
                  padding: "6px 20px",
                  marginBottom: 16,
                  border: `1px solid ${col.acento}`,
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    fontStyle: "italic",
                    color: col.texto,
                    fontWeight: 600,
                  }}
                >
                  "{evento.frase_evento}"
                </p>
              </div>
            )}

            {/* Chip de invitado */}
            <div
              style={{
                background: "rgba(255,255,255,0.92)",
                borderRadius: 20,
                padding: "16px 28px",
                display: "inline-block",
                marginTop: 8,
                boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                border: `2px solid ${col.acento}`,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  color: col.texto,
                  fontWeight: 700,
                  opacity: 0.7,
                  marginBottom: 2,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                Para
              </p>
              <p
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: col.texto,
                  fontFamily: "'Cormorant Garamond', serif",
                }}
              >
                {invitado.nombre}
              </p>
            </div>
          </div>
        </div>

        {/* ── DETALLES ── */}
        <div style={{ maxWidth: 500, margin: "0 auto", padding: "24px 16px" }}>
          <div
            style={{
              background: "white",
              borderRadius: 24,
              padding: 24,
              boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
              border: `1px solid ${col.acento}50`,
              marginBottom: 16,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: col.texto,
                marginBottom: 16,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              Detalles del evento
            </p>
            {[
              { label: "Fecha", valor: fechaEvento },
              { label: "Hora", valor: evento.hora },
              { label: "Lugar", valor: evento.lugar },
              { label: "Confirmar antes del", valor: fechaLimite },
            ].map(({ label, valor }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  marginBottom: 10,
                  padding: "10px 14px",
                  borderRadius: 14,
                  background: col.claro,
                }}
              >
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: col.texto,
                      opacity: 0.7,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {label}
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#111",
                      lineHeight: 1.4,
                    }}
                  >
                    {valor}
                  </p>
                </div>
              </div>
            ))}
            {evento.maps_url && (
              <a
                href={evento.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: col.gradHero,
                  color: col.texto,
                  textDecoration: "none",
                  borderRadius: 14,
                  padding: "10px",
                  fontSize: 13,
                  fontWeight: 700,
                  marginTop: 4,
                  border: `1px solid ${col.acento}`,
                }}
              >
                <IconMap size={16} color={col.texto} /> Ver en Google Maps
              </a>
            )}
          </div>

          {evento.foto_lugar_url && (
            <div
              style={{
                borderRadius: 20,
                overflow: "hidden",
                marginBottom: 16,
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              }}
            >
              <img
                src={evento.foto_lugar_url}
                alt="Lugar del evento"
                style={{ width: "100%", display: "block" }}
              />
            </div>
          )}

          {evento.mensaje_invitacion && (
            <div
              style={{
                background: col.claro,
                borderRadius: 20,
                padding: "18px 22px",
                borderLeft: `4px solid ${col.acento}`,
                marginBottom: 16,
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: col.texto,
                  fontStyle: "italic",
                  lineHeight: 1.7,
                  fontWeight: 500,
                }}
              >
                "{evento.mensaje_invitacion}"
              </p>
              {evento.anfitriones && (
                <p
                  style={{
                    fontSize: 12,
                    color: col.texto,
                    opacity: 0.7,
                    marginTop: 8,
                    fontWeight: 700,
                  }}
                >
                  — {evento.anfitriones}
                </p>
              )}
            </div>
          )}

          {/* ── BOTONES PRINCIPALES ── */}
          {!yaRespondio ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginTop: 8,
              }}
            >
              <button
                onClick={() => setPaso("formulario")}
                style={{
                  background: "linear-gradient(135deg,#0D9488,#0F766E)",
                  color: "white",
                  border: "none",
                  borderRadius: 18,
                  padding: "16px 24px",
                  fontSize: 16,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(13,148,136,0.40)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <IconCheck size={20} color="white" /> Confirmar mi asistencia
              </button>
              <button
                onClick={rechazar}
                disabled={guardando}
                style={{
                  background: "white",
                  color: "#6b7280",
                  border: "2px solid #e2e8f0",
                  borderRadius: 18,
                  padding: "14px 24px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <IconX size={18} color="#9ca3af" />{" "}
                {guardando ? "Guardando..." : "No podré asistir"}
              </button>
            </div>
          ) : (
            <div
              style={{
                background:
                  invitado.estado === "confirmado" ? "#f0fdf4" : "#fef9c3",
                border: `2px solid ${invitado.estado === "confirmado" ? "#86efac" : "#fde047"}`,
                borderRadius: 18,
                padding: "16px 20px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontWeight: 800,
                  color:
                    invitado.estado === "confirmado" ? "#16a34a" : "#ca8a04",
                  fontSize: 15,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {invitado.estado === "confirmado" ? (
                  <>
                    <IconCheck size={18} color="#16a34a" /> Ya confirmaste tu
                    asistencia
                  </>
                ) : (
                  <>
                    <IconX size={18} color="#ca8a04" /> Ya indicaste que no
                    podrás asistir
                  </>
                )}
              </p>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                Gracias por responder
              </p>
            </div>
          )}

          {/* ── VER MURO ── */}
          <div
            style={{
              marginTop: 20,
              background: col.claro,
              borderRadius: 18,
              border: `1px solid ${col.acento}`,
              overflow: "hidden",
            }}
          >
            <Link
              href={muroUrl}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                textDecoration: "none",
                color: col.texto,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "linear-gradient(135deg,#0D9488,#0F766E)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconGallery size={20} color="white" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14 }}>
                    Ver el muro del evento
                  </p>
                  <p style={{ fontSize: 11, opacity: 0.7 }}>
                    Fotos, deseos y más
                  </p>
                </div>
              </div>
              <svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke={col.texto}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        </div>
        <MenuFlotante />
      </main>
    );

  // ══════════ VISTA: FORMULARIO ══════════
  if (paso === "formulario")
    return (
      <main
        style={{
          minHeight: "100vh",
          background: col.gradBg,
          paddingBottom: 60,
        }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@400;600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0} body{font-family:'DM Sans',sans-serif}`}</style>
        <div
          style={{
            background: col.gradHero,
            padding: "32px 20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.92)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              border: `2px solid ${col.acento}`,
            }}
          >
            <IconCheck size={30} color={col.texto} />
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: col.texto,
              fontFamily: "'Cormorant Garamond',serif",
            }}
          >
            ¡Qué alegría!
          </h1>
          <p style={{ color: col.texto, opacity: 0.8, marginTop: 4 }}>
            {invitado.nombre}, confirma los detalles de tu asistencia
          </p>
        </div>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>
          <div
            style={{
              background: "white",
              borderRadius: 24,
              padding: 24,
              boxShadow: "0 8px 32px rgba(0,0,0,0.07)",
            }}
          >
            <div style={{ marginBottom: 22 }}>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: col.texto,
                  display: "block",
                  marginBottom: 10,
                }}
              >
                ¿Cuántas personas asistirán? (incluido tú)
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  justifyContent: "center",
                }}
              >
                {[
                  {
                    op: "−",
                    fn: () => setNumPersonas(Math.max(1, numPersonas - 1)),
                  },
                  {
                    op: "+",
                    fn: () => setNumPersonas(Math.min(10, numPersonas + 1)),
                  },
                ].map((btn, i) => (
                  <button
                    key={i}
                    onClick={btn.fn}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      border: `2px solid ${col.acento}`,
                      background: col.claro,
                      color: col.texto,
                      fontSize: 22,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {btn.op}
                  </button>
                ))}
              </div>
              <p
                style={{
                  textAlign: "center",
                  fontSize: 32,
                  fontWeight: 900,
                  color: col.texto,
                  marginTop: -36,
                  pointerEvents: "none",
                }}
              >
                {numPersonas}
              </p>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: col.texto,
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Un mensaje para los festejados (opcional)
              </label>
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Con mucho cariño estaré ahí..."
                rows={3}
                maxLength={200}
                style={{
                  width: "100%",
                  border: `1.5px solid ${col.acento}`,
                  borderRadius: 14,
                  padding: "10px 14px",
                  fontSize: 13,
                  resize: "none",
                  outline: "none",
                  fontFamily: "inherit",
                  lineHeight: 1.6,
                  boxSizing: "border-box",
                  background: col.claro,
                }}
              />
            </div>
            <div style={{ marginBottom: 22 }}>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: col.texto,
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Alergias o preferencias alimentarias (opcional)
              </label>
              <input
                value={alergias}
                onChange={(e) => setAlergias(e.target.value)}
                placeholder="Ej: vegetariano, alérgico al marisco..."
                style={{
                  width: "100%",
                  border: `1.5px solid ${col.acento}`,
                  borderRadius: 14,
                  padding: "10px 14px",
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  background: col.claro,
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setPaso("invitacion")}
                style={{
                  flex: 1,
                  background: col.claro,
                  color: col.texto,
                  border: `1px solid ${col.acento}`,
                  borderRadius: 14,
                  padding: "14px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                Volver
              </button>
              <button
                onClick={confirmar}
                disabled={guardando}
                style={{
                  flex: 2,
                  background: "linear-gradient(135deg,#0D9488,#0F766E)",
                  color: "white",
                  border: "none",
                  borderRadius: 14,
                  padding: "14px",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: guardando ? "wait" : "pointer",
                  boxShadow: "0 4px 16px rgba(13,148,136,0.30)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                {guardando ? (
                  "Guardando..."
                ) : (
                  <>
                    <IconCheck size={18} color="white" /> Confirmar asistencia
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    );

  // ══════════ VISTA: CONFIRMADO — tarjeta completa con botones de muro ══════════
  if (paso === "confirmado")
    return (
      <main
        style={{
          minHeight: "100vh",
          background: col.gradBg,
          paddingBottom: 60,
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;600;700;800&display=swap');
          *{box-sizing:border-box;margin:0;padding:0} body{font-family:'DM Sans',sans-serif}
          @keyframes confetti { 0%{transform:translateY(-10px) rotate(0deg);opacity:1} 100%{transform:translateY(80px) rotate(720deg);opacity:0} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
          @keyframes popIn { from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)} }
          @keyframes shine { 0%{background-position:200% center}100%{background-position:-200% center} }
          .btn-action { transition: transform 0.15s, box-shadow 0.15s; }
          .btn-action:hover { transform: translateY(-2px); }
          .btn-action:active { transform: scale(0.97); }
        `}</style>

        <div
          style={{ maxWidth: 480, margin: "0 auto", padding: "32px 16px 60px" }}
        >
          {/* ── CABECERA ÉXITO ── */}
          <div
            style={{
              textAlign: "center",
              marginBottom: 24,
              animation: "fadeUp 0.4s ease both",
            }}
          >
            <div
              style={{
                position: "relative",
                display: "inline-block",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg,${col.acento},${col.texto})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  boxShadow: `0 12px 40px ${col.acento}60`,
                }}
              >
                <IconCheck size={46} color="white" />
              </div>
              {/* Mini confetti dots */}
              {["#fbbf24", "#34d399", "#60a5fa", "#f472b6"].map((c, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: c,
                    top: `${[0, 0, 70, 70][i]}%`,
                    left: `${[0, 100, 0, 100][i]}%`,
                    animation: `confetti ${1.2 + i * 0.2}s ease ${i * 0.1}s both`,
                    transform: "translate(-50%,-50%)",
                  }}
                />
              ))}
            </div>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: col.texto,
                fontFamily: "'Cormorant Garamond',serif",
                marginBottom: 6,
              }}
            >
              ¡Confirmado!
            </h2>
            <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.6 }}>
              <strong>{invitado.nombre}</strong>, estamos muy felices de que
              puedas acompañarnos.
            </p>
          </div>

          {/* ── TARJETA DIGITAL ── */}
          <div
            style={{
              background: "white",
              borderRadius: 28,
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.10)",
              border: `2px solid ${col.acento}40`,
              animation: "popIn 0.5s ease 0.1s both",
              marginBottom: 20,
            }}
          >
            {/* Header de tarjeta */}
            <div
              style={{
                background: col.gradHero,
                padding: "20px 24px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Shine overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.25) 50%,transparent 60%)",
                  backgroundSize: "200% 100%",
                  animation: "shine 4s ease-in-out infinite",
                }}
              />
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <EventsLogo size={32} />
                  <div>
                    <p
                      style={{
                        fontFamily: "'Cormorant Garamond',serif",
                        fontSize: 18,
                        fontWeight: 600,
                        color: col.texto,
                        lineHeight: 1,
                      }}
                    >
                      Events
                    </p>
                    <p
                      style={{
                        fontSize: 10,
                        color: col.texto,
                        opacity: 0.65,
                        fontWeight: 600,
                        letterSpacing: 0.3,
                        textTransform: "uppercase",
                      }}
                    >
                      Invitaciones digitales
                    </p>
                  </div>
                </div>
                {/* Número de tarjeta */}
                <div style={{ textAlign: "right" }}>
                  <p
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      color: col.texto,
                      opacity: 0.6,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                    }}
                  >
                    Tarjeta
                  </p>
                  <p
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color: col.texto,
                      letterSpacing: 2,
                      fontFamily: "'DM Sans',sans-serif",
                    }}
                  >
                    #{cardNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Cuerpo tarjeta */}
            <div style={{ padding: "20px 24px 24px" }}>
              {/* Emoji + evento */}
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>{col.emoji}</div>
                <h3
                  style={{
                    fontFamily: "'Cormorant Garamond',serif",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#111",
                    marginBottom: 4,
                  }}
                >
                  {evento.nombre}
                </h3>
                {evento.anfitriones && (
                  <p style={{ fontSize: 13, color: "#6b7280" }}>
                    {evento.anfitriones}
                  </p>
                )}
              </div>

              {/* Detalles compactos */}
              <div
                style={{
                  background: col.claro,
                  borderRadius: 16,
                  padding: "12px 16px",
                  marginBottom: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    fontSize: 13,
                    color: "#374151",
                  }}
                >
                  <span>📅</span>
                  <span
                    style={{ fontWeight: 600, textTransform: "capitalize" }}
                  >
                    {fechaEvento}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    fontSize: 13,
                    color: "#374151",
                  }}
                >
                  <span>📍</span>
                  <span style={{ fontWeight: 600 }}>{evento.lugar}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    fontSize: 13,
                    color: "#374151",
                  }}
                >
                  <span>👥</span>
                  <span style={{ fontWeight: 600 }}>
                    {numPersonas} persona{numPersonas > 1 ? "s" : ""} confirmada
                    {numPersonas > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Chip de invitado con estrella */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: `linear-gradient(135deg,${col.acento}20,${col.acento}40)`,
                  borderRadius: 14,
                  padding: "10px 14px",
                  border: `1px solid ${col.acento}60`,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: col.texto,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{ color: "white", fontWeight: 800, fontSize: 16 }}
                  >
                    {invitado.nombre.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    style={{ fontWeight: 700, fontSize: 14, color: col.texto }}
                  >
                    {invitado.nombre}
                  </p>
                  <p style={{ fontSize: 11, color: col.texto, opacity: 0.7 }}>
                    Invitado confirmado ✓
                  </p>
                </div>
                <IconStar size={18} color={col.texto} />
              </div>
            </div>
          </div>

          {/* ── SECCIÓN FOTO ── */}
          <div
            style={{
              animation: "fadeUp 0.5s ease 0.25s both",
              marginBottom: 16,
            }}
          >
            <SubirFotoSection
              invitado={invitado}
              eventoId={evento.id}
              col={col}
            />
          </div>

          {/* ── BOTONES DE MURO ── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              animation: "fadeUp 0.5s ease 0.35s both",
            }}
          >
            {/* Botón: Foto al muro */}
            <Link
              href={muroUrl}
              className="btn-action"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: "linear-gradient(135deg,#0D9488,#0F766E)",
                color: "white",
                textDecoration: "none",
                borderRadius: 18,
                padding: "16px 20px",
                boxShadow: "0 6px 24px rgba(13,148,136,0.35)",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconCamera size={22} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 800, fontSize: 15 }}>
                  Ver muro del evento
                </p>
                <p style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                  Fotos, reacciones y recuerdos
                </p>
              </div>
              <svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>

            {/* Botón: Dejar un deseo */}
            <Link
              href={muroDeseosUrl}
              className="btn-action"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: "white",
                color: col.texto,
                textDecoration: "none",
                borderRadius: 18,
                padding: "16px 20px",
                border: `2px solid ${col.acento}`,
                boxShadow: `0 4px 20px ${col.acento}30`,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: col.claro,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  border: `1px solid ${col.acento}`,
                }}
              >
                <IconHeart size={22} color={col.texto} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 800, fontSize: 15 }}>
                  Dejar un deseo 💌
                </p>
                <p style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                  Escribe tu mensaje especial al muro
                </p>
              </div>
              <svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke={col.texto}
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>

            {/* Botón: Libro de recuerdos */}
            <Link
              href={`/libro/${evento.id}?token=${invitado.token}`}
              className="btn-action"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: col.claro,
                color: col.texto,
                textDecoration: "none",
                borderRadius: 18,
                padding: "14px 20px",
                border: `1px solid ${col.acento}50`,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: col.acento + "40",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={col.texto}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 14 }}>
                  Libro de recuerdos
                </p>
                <p style={{ fontSize: 11, opacity: 0.65, marginTop: 2 }}>
                  Momentos especiales del evento
                </p>
              </div>
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke={col.texto}
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        </div>
      </main>
    );

  // ══════════ VISTA: RECHAZADO ══════════
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f0fdfa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@400;600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0} body{font-family:'DM Sans',sans-serif}`}</style>
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <div
          style={{
            background: "white",
            borderRadius: 28,
            padding: "40px 32px",
            boxShadow: "0 8px 32px rgba(13,148,136,0.08)",
            border: "1px solid #ccfbf1",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "#f0fdfa",
              border: "2px solid #ccfbf1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <IconX size={36} color="#5eead4" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <EventsLogo size={32} />
          </div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#134e4a",
              marginBottom: 8,
              fontFamily: "'Cormorant Garamond',serif",
            }}
          >
            Entendemos
          </h2>
          <p style={{ color: "#6b7280", lineHeight: 1.6, marginBottom: 20 }}>
            <strong>{invitado.nombre}</strong>, lamentamos que no puedas
            acompañarnos. ¡Estarás en nuestros pensamientos!
          </p>
          <div
            style={{
              background: "#f0fdfa",
              borderRadius: 16,
              padding: 16,
              border: "1px solid #ccfbf1",
            }}
          >
            <p style={{ fontSize: 13, color: "#0f766e", fontStyle: "italic" }}>
              Que Dios te guarde y te bendiga siempre
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
