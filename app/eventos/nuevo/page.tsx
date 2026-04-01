"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

// ── Logo SVG (mismo que login/dashboard) ──────────────────────────────────
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
          id="lg-new"
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
          id="lg2-new"
          x1="10"
          y1="28"
          x2="46"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#3AADA0" />
          <stop offset="100%" stopColor="#2DC4A8" />
        </linearGradient>
        <filter id="lg3-new" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <rect width="56" height="56" rx="16" fill="url(#lg-new)" />
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
        stroke="url(#lg2-new)"
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
        filter="url(#lg3-new)"
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

// ── Íconos tipo evento ────────────────────────────────────────────────────
const IconoCrown = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      d="M2 13h14M3 13L2 6l4 3 3-5 3 5 4-3-1 7H3z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);
const IconoRings = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle
      cx="6.5"
      cy="9"
      r="4"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <circle
      cx="11.5"
      cy="9"
      r="4"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
  </svg>
);
const IconoCap = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      d="M9 4L2 8l7 4 7-4-7-4z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M5 10v4c0 1 1.8 2 4 2s4-1 4-2v-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M16 8v4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);
const IconoCake = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect
      x="2"
      y="9"
      width="14"
      height="7"
      rx="1.5"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <path
      d="M5 9V7M9 9V7M13 9V7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M5 7c0-1 1-2 0-3M9 7c0-1 1-2 0-3M13 7c0-1 1-2 0-3"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);
const IconoStar = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      d="M9 2l1.8 5h5.2l-4.2 3 1.6 5L9 12l-4.4 3 1.6-5L2 7h5.2L9 2z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);
const IconoCamera = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path
      d="M2 8.5h1.5l2-3h11l2 3H20a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1v-8a1 1 0 011-1z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <circle
      cx="11"
      cy="13"
      r="3.2"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
  </svg>
);
const IconoBack = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M13 4l-6 6 6 6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IconoSun = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.4" />
    <path
      d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);
const IconoMoon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path
      d="M13.5 9.5A6 6 0 016.5 2.5a6 6 0 100 11 6 6 0 007-4z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ── Traducciones ──────────────────────────────────────────────────────────
const translations = {
  es: {
    title: "Nuevo evento",
    sub: "Events — invitaciones digitales",
    tipoEvento: "Tipo de evento",
    fotoPortada: "Foto de portada",
    cambiarFoto: "Cambiar foto",
    fmtFoto: "JPG, PNG — máx 5 MB",
    infoEvento: "Información del evento",
    nombreEvento: "Nombre del evento *",
    anfitriones: "Anfitriones / Organizadores *",
    mensaje: "Mensaje para los invitados",
    fechaLugar: "Fecha y lugar",
    fecha: "Fecha *",
    hora: "Hora *",
    lugarNombre: "Nombre del lugar *",
    mapsLink: "Link de Google Maps",
    mapsHint: "Abre Google Maps → busca el lugar → Compartir → Copiar enlace",
    fotoLugar: "Foto del lugar",
    confirmacion: "Confirmación de asistencia",
    fechaLimite: "Fecha límite para confirmar *",
    fechaLimiteHint: "Después de esta fecha los invitados no podrán confirmar",
    crear: "Crear evento",
    creando: "Creando evento...",
    footer: "Podrás editar los detalles del evento después de crearlo",
    errorCampos: "Por favor llena todos los campos obligatorios",
    errorCrear: "Error al crear el evento: ",
    darkMode: "Modo oscuro",
    lightMode: "Modo claro",
    tipos: {
      quinceañera: "Quinceañera",
      boda: "Boda",
      graduacion: "Graduación",
      cumpleaños: "Cumpleaños",
      otro: "Otro",
    },
  },
  en: {
    title: "New event",
    sub: "Events — digital invitations",
    tipoEvento: "Event type",
    fotoPortada: "Cover photo",
    cambiarFoto: "Change photo",
    fmtFoto: "JPG, PNG — max 5 MB",
    infoEvento: "Event information",
    nombreEvento: "Event name *",
    anfitriones: "Hosts / Organizers *",
    mensaje: "Message for guests",
    fechaLugar: "Date & venue",
    fecha: "Date *",
    hora: "Time *",
    lugarNombre: "Venue name *",
    mapsLink: "Google Maps link",
    mapsHint: "Open Google Maps → search venue → Share → Copy link",
    fotoLugar: "Venue photo",
    confirmacion: "RSVP",
    fechaLimite: "RSVP deadline *",
    fechaLimiteHint:
      "After this date guests won't be able to confirm attendance",
    crear: "Create event",
    creando: "Creating event...",
    footer: "You can edit the event details after creating it",
    errorCampos: "Please fill in all required fields",
    errorCrear: "Error creating event: ",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    tipos: {
      quinceañera: "Quinceañera",
      boda: "Wedding",
      graduacion: "Graduation",
      cumpleaños: "Birthday",
      otro: "Other",
    },
  },
};

const CONFIG_TIPO: Record<
  string,
  {
    es: {
      placeholderNombre: string;
      placeholderAnfitriones: string;
      placeholderLugar: string;
      placeholderMensaje: string;
      labelFotoPortada: string;
      labelFotoLugar: string;
    };
    en: {
      placeholderNombre: string;
      placeholderAnfitriones: string;
      placeholderLugar: string;
      placeholderMensaje: string;
      labelFotoPortada: string;
      labelFotoLugar: string;
    };
  }
> = {
  quinceañera: {
    es: {
      placeholderNombre: "Ej: XV Años de Sofía",
      placeholderAnfitriones: "Ej: Familia García López",
      placeholderLugar: "Ej: Salón Versalles, San Salvador",
      placeholderMensaje:
        "Ej: Con mucha alegría los invitamos a celebrar los XV años de Sofía...",
      labelFotoPortada: "Foto de la festejada",
      labelFotoLugar: "Foto del salón o lugar",
    },
    en: {
      placeholderNombre: "Ex: Sofia's XV",
      placeholderAnfitriones: "Ex: García López Family",
      placeholderLugar: "Ex: Versailles Hall, San Salvador",
      placeholderMensaje:
        "Ex: With great joy we invite you to celebrate Sofia's XV...",
      labelFotoPortada: "Photo of the honoree",
      labelFotoLugar: "Photo of the venue",
    },
  },
  boda: {
    es: {
      placeholderNombre: "Ej: Boda de Ana & Carlos",
      placeholderAnfitriones: "Ej: Familias Martínez y López",
      placeholderLugar: "Ej: Hacienda El Paraíso, Santa Ana",
      placeholderMensaje:
        "Ej: Con amor los invitamos a compartir el día más especial...",
      labelFotoPortada: "Foto de la pareja",
      labelFotoLugar: "Foto de la iglesia o hacienda",
    },
    en: {
      placeholderNombre: "Ex: Ana & Carlos' Wedding",
      placeholderAnfitriones: "Ex: Martínez and López Families",
      placeholderLugar: "Ex: Hacienda El Paraíso, Santa Ana",
      placeholderMensaje:
        "Ex: With love we invite you to share our most special day...",
      labelFotoPortada: "Photo of the couple",
      labelFotoLugar: "Photo of the church or venue",
    },
  },
  graduacion: {
    es: {
      placeholderNombre: "Ej: Graduación de Luis — Ingeniería 2025",
      placeholderAnfitriones: "Ej: Familia Ramírez",
      placeholderLugar: "Ej: Centro de Convenciones UCA",
      placeholderMensaje:
        "Ej: Con gran orgullo los invitamos a celebrar este logro...",
      labelFotoPortada: "Foto del graduado",
      labelFotoLugar: "Foto del auditorio o recinto",
    },
    en: {
      placeholderNombre: "Ex: Luis' Graduation — Engineering 2025",
      placeholderAnfitriones: "Ex: Ramírez Family",
      placeholderLugar: "Ex: UCA Convention Center",
      placeholderMensaje:
        "Ex: With great pride we invite you to celebrate this achievement...",
      labelFotoPortada: "Photo of the graduate",
      labelFotoLugar: "Photo of the auditorium",
    },
  },
  cumpleaños: {
    es: {
      placeholderNombre: "Ej: 30 Años de María",
      placeholderAnfitriones: "Ej: Diego Hernández",
      placeholderLugar: "Ej: Restaurante La Terraza, Santa Tecla",
      placeholderMensaje: "Ej: ¡Ven a celebrar conmigo este nuevo capítulo!",
      labelFotoPortada: "Foto del festejado",
      labelFotoLugar: "Foto del salón o restaurante",
    },
    en: {
      placeholderNombre: "Ex: María's 30th Birthday",
      placeholderAnfitriones: "Ex: Diego Hernández",
      placeholderLugar: "Ex: La Terraza Restaurant, Santa Tecla",
      placeholderMensaje: "Ex: Come celebrate this new chapter with me!",
      labelFotoPortada: "Photo of the birthday person",
      labelFotoLugar: "Photo of the venue",
    },
  },
  otro: {
    es: {
      placeholderNombre: "Ej: Reunión Familiar Navidad 2025",
      placeholderAnfitriones: "Ej: Familia Pérez",
      placeholderLugar: "Ej: Casa de la abuela, Soyapango",
      placeholderMensaje:
        "Ej: Los esperamos para compartir un momento especial juntos...",
      labelFotoPortada: "Foto del evento",
      labelFotoLugar: "Foto del lugar",
    },
    en: {
      placeholderNombre: "Ex: Family Christmas Reunion 2025",
      placeholderAnfitriones: "Ex: Pérez Family",
      placeholderLugar: "Ex: Grandma's house, Soyapango",
      placeholderMensaje:
        "Ex: We look forward to sharing a special moment together...",
      labelFotoPortada: "Event photo",
      labelFotoLugar: "Venue photo",
    },
  },
};

const TIPOS = [
  { value: "quinceañera", Icono: IconoCrown },
  { value: "boda", Icono: IconoRings },
  { value: "graduacion", Icono: IconoCap },
  { value: "cumpleaños", Icono: IconoCake },
  { value: "otro", Icono: IconoStar },
];

// ── Particles (mismo que login/dashboard) ─────────────────────────────────
function Particles() {
  return (
    <div className="particles" aria-hidden="true">
      {[...Array(6)].map((_, i) => (
        <div key={i} className={`particle particle-${i + 1}`} />
      ))}
    </div>
  );
}

// ── Campo reutilizable ────────────────────────────────────────────────────
function Campo({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────
export default function NuevoEvento() {
  const router = useRouter();

  const [tipo, setTipo] = useState("quinceañera");
  const [nombre, setNombre] = useState("");
  const [anfitriones, setAnfitriones] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [lugar, setLugar] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [mensajeInvitacion, setMensajeInvitacion] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [imagen, setImagen] = useState<File | null>(null);
  const [imagenLugar, setImagenLugar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewLugar, setPreviewLugar] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState<"es" | "en">("es");
  const [mounted] = useState(true);

  const t = translations[lang];
  const cfg = CONFIG_TIPO[tipo][lang];

  function handleImagen(
    e: React.ChangeEvent<HTMLInputElement>,
    destino: "evento" | "lugar",
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (destino === "evento") {
      setImagen(file);
      setPreview(URL.createObjectURL(file));
    } else {
      setImagenLugar(file);
      setPreviewLugar(URL.createObjectURL(file));
    }
  }

  async function subirImagen(file: File, clave: string) {
    const ext = file.name.split(".").pop();
    const fileName = `${clave}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("eventos")
      .upload(fileName, file);
    if (error) return null;
    const { data } = supabase.storage.from("eventos").getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleCrear() {
    setLoading(true);
    setError("");
    if (!nombre || !fecha || !hora || !lugar || !fechaLimite || !anfitriones) {
      setError(t.errorCampos);
      setLoading(false);
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const imagen_url = imagen ? await subirImagen(imagen, user.id) : null;
    const foto_lugar_url = imagenLugar
      ? await subirImagen(imagenLugar, `lugar-${user.id}`)
      : null;

    const { error: insertError } = await supabase.from("eventos").insert({
      organizador_id: user.id,
      nombre,
      tipo,
      anfitriones,
      fecha,
      hora,
      lugar,
      maps_url: mapsUrl,
      fecha_limite_confirmacion: fechaLimite,
      mensaje_invitacion: mensajeInvitacion,
      imagen_url,
      foto_lugar_url,
    });

    if (insertError) setError(t.errorCrear + insertError.message);
    else router.push("/dashboard");
    setLoading(false);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif}

        :root {
          --bg:#F0FAF8; --bg2:#E8F6F3;
          --surface:#FFFFFF; --surface2:#F7FDFB;
          --border:rgba(58,173,160,0.15); --border-mid:rgba(58,173,160,0.25);
          --accent:#1FA896; --accent2:#3AADA0; --accent3:#0f766e;
          --accent-soft:rgba(58,173,160,0.09); --accent-soft2:rgba(58,173,160,0.17);
          --text:#0A1E1C; --text2:#3D6E6A; --text3:#85B5B0;
          --danger:#dc2626; --danger-bg:#fef2f2; --danger-border:#fecaca;
          --shadow:0 4px 24px rgba(58,173,160,0.13); --shadow-sm:0 2px 10px rgba(58,173,160,0.09);
          --nav-bg:rgba(240,250,248,0.95);
          --transition:all 0.35s cubic-bezier(.4,0,.2,1);
          --radius:18px; --radius-sm:12px;
        }
        .dark {
          --bg:#0C1A19; --bg2:#0A1614;
          --surface:#162422; --surface2:#1C2E2B;
          --border:rgba(58,173,160,0.13); --border-mid:rgba(58,173,160,0.24);
          --accent:#3AADA0; --accent2:#2DC4A8; --accent3:#5eead4;
          --accent-soft:rgba(58,173,160,0.10); --accent-soft2:rgba(58,173,160,0.19);
          --text:#E8F8F5; --text2:#7ABFBA; --text3:#3D7070;
          --danger:#f87171; --danger-bg:rgba(220,38,38,0.10); --danger-border:rgba(220,38,38,0.22);
          --shadow:0 4px 24px rgba(0,0,0,0.42); --shadow-sm:0 2px 10px rgba(0,0,0,0.28);
          --nav-bg:rgba(12,26,25,0.97);
        }

        .page { min-height:100vh; background:var(--bg); transition:background 0.5s ease; position:relative; overflow-x:hidden; padding-bottom:56px; }
        .page::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E"); opacity:0.35; }

        .glow { position:fixed; pointer-events:none; z-index:0; border-radius:50%; filter:blur(90px); }
        .glow-1 { width:320px; height:320px; top:-100px; right:-80px;
          background:radial-gradient(circle,rgba(58,173,160,0.14) 0%,transparent 70%);
          animation:gd1 9s ease-in-out infinite; }
        .glow-2 { width:260px; height:260px; bottom:100px; left:-80px;
          background:radial-gradient(circle,rgba(45,196,168,0.09) 0%,transparent 70%);
          animation:gd2 11s ease-in-out infinite; }
        .dark .glow-1{background:radial-gradient(circle,rgba(58,173,160,0.19) 0%,transparent 70%)}
        .dark .glow-2{background:radial-gradient(circle,rgba(45,196,168,0.12) 0%,transparent 70%)}
        @keyframes gd1{0%,100%{transform:translate(0,0)}40%{transform:translate(-16px,24px)}70%{transform:translate(12px,-16px)}}
        @keyframes gd2{0%,100%{transform:translate(0,0)}35%{transform:translate(20px,-26px)}65%{transform:translate(-10px,16px)}}

        .particles{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
        .particle{position:absolute;border-radius:50%;background:var(--accent2);opacity:0;animation:pf linear infinite}
        .particle-1{width:3px;height:3px;left:12%;animation-duration:14s;animation-delay:0s}
        .particle-2{width:2px;height:2px;left:35%;animation-duration:17s;animation-delay:3s}
        .particle-3{width:3px;height:3px;left:58%;animation-duration:12s;animation-delay:1s}
        .particle-4{width:2px;height:2px;left:72%;animation-duration:15s;animation-delay:4s}
        .particle-5{width:3px;height:3px;left:82%;animation-duration:13s;animation-delay:.5s}
        .particle-6{width:2px;height:2px;left:92%;animation-duration:18s;animation-delay:5s}
        @keyframes pf{0%{transform:translateY(110vh);opacity:0}5%{opacity:.12}90%{opacity:.12}100%{transform:translateY(-10vh) translateX(16px);opacity:0}}

        /* ── NAV ── */
        .nav { position:sticky; top:0; z-index:30; height:58px; padding:0 16px;
          display:flex; align-items:center; justify-content:space-between;
          background:var(--nav-bg); backdrop-filter:blur(18px);
          border-bottom:1px solid var(--border); box-shadow:var(--shadow-sm);
          transition:background 0.5s ease; }
        .nav-left { display:flex; align-items:center; gap:10px; }
        .nav-back { width:34px; height:34px; border-radius:10px; background:var(--surface);
          border:1px solid var(--border); display:flex; align-items:center; justify-content:center;
          color:var(--text3); cursor:pointer; transition:var(--transition); text-decoration:none; }
        .nav-back:hover { color:var(--accent); background:var(--accent-soft2); border-color:var(--accent2); }
        .nav-brand { display:flex; align-items:center; gap:9px; }
        .nav-brand-name { font-family:'Cormorant Garamond',serif; font-size:20px; font-weight:600;
          color:var(--accent); letter-spacing:-0.5px; line-height:1; }
        .nav-brand-sub { font-size:10px; color:var(--text3); font-weight:600;
          letter-spacing:.4px; text-transform:uppercase; margin-top:2px; }
        .nav-right { display:flex; align-items:center; gap:6px; }
        .ctrl-btn { width:34px; height:34px; border-radius:50%; background:var(--surface);
          border:1px solid var(--border); display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:var(--transition); color:var(--text2);
          font-size:11px; font-weight:700; }
        .ctrl-btn:hover { background:var(--accent-soft2); color:var(--accent); border-color:var(--accent2); }
        .ctrl-lang { width:auto; padding:0 11px; border-radius:20px; letter-spacing:.5px; text-transform:uppercase; }

        /* ── CONTENT ── */
        .content { max-width:520px; margin:0 auto; padding:18px 14px 0; position:relative; z-index:1; display:flex; flex-direction:column; gap:12px; }

        /* ── SECTION CARD ── */
        .section-card { background:var(--surface); border-radius:var(--radius); padding:18px 16px;
          border:1px solid var(--border); box-shadow:var(--shadow); transition:background 0.5s ease; }
        .section-title { font-size:10px; font-weight:700; text-transform:uppercase;
          letter-spacing:1.4px; color:var(--accent2); margin-bottom:14px; }

        /* ── TIPO BUTTONS ── */
        .tipos-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:7px; }
        .tipo-btn { display:flex; flex-direction:column; align-items:center; gap:6px;
          padding:12px 4px; border-radius:14px; font-size:10px; font-weight:700;
          border:2px solid var(--border); background:var(--surface2); color:var(--text2);
          cursor:pointer; transition:var(--transition); font-family:'DM Sans',sans-serif; }
        .tipo-btn:hover { border-color:var(--accent2); color:var(--accent); background:var(--accent-soft); }
        .tipo-btn.active { background:var(--accent); color:#fff; border-color:var(--accent);
          box-shadow:0 4px 16px rgba(58,173,160,0.38); }

        /* ── PHOTO UPLOAD ── */
        .photo-upload { cursor:pointer; display:block; border-radius:14px; overflow:hidden;
          border:2px dashed var(--border-mid); transition:var(--transition); }
        .photo-upload:hover { border-color:var(--accent2); background:var(--accent-soft); }
        .photo-empty { display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:10px; background:var(--accent-soft); padding:28px 16px; text-align:center; }
        .photo-empty-icon { width:56px; height:56px; border-radius:14px; background:var(--surface);
          border:1px solid var(--border-mid); display:flex; align-items:center; justify-content:center;
          color:var(--accent); box-shadow:var(--shadow-sm); }
        .photo-empty-title { font-size:13px; font-weight:700; color:var(--accent); }
        .photo-empty-sub { font-size:11px; color:var(--text3); margin-top:2px; }

        /* Cover photo — tall */
        .photo-cover .photo-empty { min-height:200px; }
        /* Venue photo — shorter */
        .photo-venue .photo-empty { min-height:140px; }

        /* Photo preview overlay */
        .photo-preview { position:relative; width:100%; }
        .photo-cover .photo-preview { height:200px; }
        .photo-venue .photo-preview { height:140px; }
        .photo-preview-img { width:100%; height:100%; object-fit:cover; display:block; }
        .photo-preview-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.38);
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:6px; opacity:0; transition:opacity .25s ease; }
        .photo-preview:hover .photo-preview-overlay { opacity:1; }
        .photo-preview-overlay-icon { color:white; }
        .photo-preview-overlay-text { color:white; font-size:12px; font-weight:700; }

        /* ── FIELDS ── */
        .fields-group { display:flex; flex-direction:column; gap:14px; }
        .field-label { font-size:11px; font-weight:700; color:var(--accent2); display:block;
          margin-bottom:6px; letter-spacing:.2px; text-transform:uppercase; }
        .field-input { width:100%; border:2px solid var(--border-mid); border-radius:12px;
          padding:11px 13px; font-size:14px; background:var(--accent-soft); color:var(--text);
          outline:none; transition:border-color .2s,box-shadow .2s,background .2s;
          font-family:'DM Sans',sans-serif; }
        .field-input::placeholder { color:var(--text3); }
        .field-input:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(58,173,160,0.12); background:var(--surface); }
        .field-hint { font-size:11px; color:var(--text3); margin-top:5px; padding:0 2px; line-height:1.4; }
        .field-textarea { resize:none; }
        .input-icon-wrap { position:relative; }
        .input-icon-wrap .input-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text3); pointer-events:none; }
        .input-icon-wrap .field-input { padding-left:34px; }
        .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }

        /* ── ERROR ── */
        .error-box { background:var(--danger-bg); border:1px solid var(--danger-border);
          color:var(--danger); font-size:13px; padding:11px 14px; border-radius:12px;
          display:flex; align-items:center; gap:8px; }

        /* ── SUBMIT ── */
        .btn-submit { width:100%; padding:15px; border-radius:var(--radius); border:none;
          background:linear-gradient(135deg,var(--accent) 0%,var(--accent3) 100%);
          color:#fff; font-size:15px; font-weight:800; font-family:'DM Sans',sans-serif;
          cursor:pointer; box-shadow:0 6px 22px rgba(58,173,160,0.36);
          transition:transform .2s,box-shadow .2s,opacity .2s; position:relative; overflow:hidden;
          display:flex; align-items:center; justify-content:center; gap:8px; }
        .btn-submit::after { content:''; position:absolute; inset:0;
          background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.15) 50%,transparent 60%);
          background-size:200% 100%; animation:shimmer 3.5s ease-in-out infinite; }
        .btn-submit:not(:disabled):hover { transform:translateY(-2px); box-shadow:0 10px 28px rgba(58,173,160,0.46); }
        .btn-submit:not(:disabled):active { transform:scale(0.98); }
        .btn-submit:disabled { opacity:.55; cursor:not-allowed; }
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}

        .footer-note { text-align:center; font-size:11px; color:var(--text3); padding-bottom:8px; }

        @keyframes spin{to{transform:rotate(360deg)}}
        .spin{animation:spin .75s linear infinite}
      `}</style>

      <div className={`page${dark ? " dark" : ""}`}>
        <div className="glow glow-1" />
        <div className="glow glow-2" />
        <Particles />

        {/* ── NAV ─────────────────────────────────────────────────── */}
        <nav className="nav">
          <div className="nav-left">
            <Link href="/dashboard" className="nav-back">
              <IconoBack />
            </Link>
            <div className="nav-brand">
              <AppLogo size={32} />
              <div>
                <div className="nav-brand-name">Events</div>
                <div className="nav-brand-sub">{t.title}</div>
              </div>
            </div>
          </div>

          <div className="nav-right">
            <button
              className="ctrl-btn ctrl-lang"
              onClick={() => setLang(lang === "es" ? "en" : "es")}
              title={lang === "es" ? "Switch to English" : "Cambiar a Español"}
            >
              {lang === "es" ? "EN" : "ES"}
            </button>
            <button
              className="ctrl-btn"
              onClick={() => setDark(!dark)}
              title={dark ? t.lightMode : t.darkMode}
            >
              {dark ? <IconoSun /> : <IconoMoon />}
            </button>
          </div>
        </nav>

        {/* ── CONTENT ─────────────────────────────────────────────── */}
        <div className="content">
          {/* Error */}
          {error && (
            <div className="error-box">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <circle
                  cx="8"
                  cy="8"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path
                  d="M8 5v3M8 10v1"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
              {error}
            </div>
          )}

          {/* ── Sección 1: Tipo ── */}
          <div className="section-card">
            <p className="section-title">{t.tipoEvento}</p>
            <div className="tipos-grid">
              {TIPOS.map(({ value, Icono }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTipo(value)}
                  className={`tipo-btn${tipo === value ? " active" : ""}`}
                >
                  <Icono />
                  <span style={{ lineHeight: 1.2, textAlign: "center" }}>
                    {t.tipos[value as keyof typeof t.tipos]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Sección 2: Foto portada ── */}
          <div className="section-card">
            <p className="section-title">{t.fotoPortada}</p>
            <label className="photo-upload photo-cover">
              {preview ? (
                <div className="photo-preview">
                  <img
                    src={preview}
                    alt="preview"
                    className="photo-preview-img"
                  />
                  <div className="photo-preview-overlay">
                    <div className="photo-preview-overlay-icon">
                      <IconoCamera />
                    </div>
                    <span className="photo-preview-overlay-text">
                      {t.cambiarFoto}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="photo-empty">
                  <div className="photo-empty-icon">
                    <IconoCamera />
                  </div>
                  <div>
                    <p className="photo-empty-title">{cfg.labelFotoPortada}</p>
                    <p className="photo-empty-sub">{t.fmtFoto}</p>
                  </div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImagen(e, "evento")}
                style={{ display: "none" }}
              />
            </label>
          </div>

          {/* ── Sección 3: Info ── */}
          <div className="section-card">
            <p className="section-title">{t.infoEvento}</p>
            <div className="fields-group">
              <Campo label={t.nombreEvento}>
                <input
                  className="field-input"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder={cfg.placeholderNombre}
                />
              </Campo>
              <Campo label={t.anfitriones}>
                <input
                  className="field-input"
                  type="text"
                  value={anfitriones}
                  onChange={(e) => setAnfitriones(e.target.value)}
                  placeholder={cfg.placeholderAnfitriones}
                />
              </Campo>
              <Campo label={t.mensaje}>
                <textarea
                  className="field-input field-textarea"
                  value={mensajeInvitacion}
                  onChange={(e) => setMensajeInvitacion(e.target.value)}
                  placeholder={cfg.placeholderMensaje}
                  rows={3}
                />
              </Campo>
            </div>
          </div>

          {/* ── Sección 4: Fecha y lugar ── */}
          <div className="section-card">
            <p className="section-title">{t.fechaLugar}</p>
            <div className="fields-group">
              <div className="grid-2">
                <Campo label={t.fecha}>
                  <input
                    className="field-input"
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </Campo>
                <Campo label={t.hora}>
                  <input
                    className="field-input"
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                  />
                </Campo>
              </div>

              <Campo label={t.lugarNombre}>
                <input
                  className="field-input"
                  type="text"
                  value={lugar}
                  onChange={(e) => setLugar(e.target.value)}
                  placeholder={cfg.placeholderLugar}
                />
              </Campo>

              <Campo label={t.mapsLink} hint={t.mapsHint}>
                <div className="input-icon-wrap">
                  <span className="input-icon">
                    <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
                      <path
                        d="M7.5 1A5 5 0 002.5 6c0 3.5 5 8 5 8s5-4.5 5-8a5 5 0 00-5-5z"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        fill="none"
                      />
                      <circle
                        cx="7.5"
                        cy="6"
                        r="1.7"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        fill="none"
                      />
                    </svg>
                  </span>
                  <input
                    className="field-input"
                    type="url"
                    value={mapsUrl}
                    onChange={(e) => setMapsUrl(e.target.value)}
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </Campo>

              {/* Foto del lugar */}
              <Campo label={t.fotoLugar}>
                <label
                  className="photo-upload photo-venue"
                  style={{ display: "block" }}
                >
                  {previewLugar ? (
                    <div className="photo-preview">
                      <img
                        src={previewLugar}
                        alt="lugar"
                        className="photo-preview-img"
                      />
                      <div className="photo-preview-overlay">
                        <div className="photo-preview-overlay-icon">
                          <IconoCamera />
                        </div>
                        <span className="photo-preview-overlay-text">
                          {t.cambiarFoto}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="photo-empty">
                      <div className="photo-empty-icon">
                        <IconoCamera />
                      </div>
                      <div>
                        <p className="photo-empty-title">
                          {cfg.labelFotoLugar}
                        </p>
                        <p className="photo-empty-sub">{t.fmtFoto}</p>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImagen(e, "lugar")}
                    style={{ display: "none" }}
                  />
                </label>
              </Campo>
            </div>
          </div>

          {/* ── Sección 5: Confirmación ── */}
          <div className="section-card">
            <p className="section-title">{t.confirmacion}</p>
            <Campo label={t.fechaLimite} hint={t.fechaLimiteHint}>
              <input
                className="field-input"
                type="date"
                value={fechaLimite}
                onChange={(e) => setFechaLimite(e.target.value)}
              />
            </Campo>
          </div>

          {/* ── Botón crear ── */}
          <button
            className="btn-submit"
            onClick={handleCrear}
            disabled={loading}
          >
            {loading ? (
              <>
                <svg
                  className="spin"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="6"
                    stroke="white"
                    strokeWidth="2"
                    strokeDasharray="28"
                    strokeDashoffset="10"
                  />
                </svg>
                {t.creando}
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path
                    d="M7.5 2v11M2 7.5h11"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                {t.crear}
              </>
            )}
          </button>

          <p className="footer-note">{t.footer}</p>
        </div>
      </div>
    </>
  );
}
