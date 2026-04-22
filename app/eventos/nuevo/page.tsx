"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Logo ─────────────────────────────────────────────────────────────────────
function AppLogo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id={`ev-logo-${size}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#7C3AED" /><stop offset="100%" stopColor="#EC4899" /></linearGradient></defs><rect width="64" height="64" rx="18" fill={`url(#ev-logo-${size})`} /><rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" /><rect x="13" y="14" width="6" height="36" rx="3" fill="#FFFFFF" /><rect x="13" y="14" width="24" height="6" rx="3" fill="#FFFFFF" /><rect x="13" y="29" width="18" height="6" rx="3" fill="#FFFFFF" /><rect x="13" y="44" width="24" height="6" rx="3" fill="#FFFFFF" /><path d="M48 11 L49.8 17.2 L56 19 L49.8 20.8 L48 27 L46.2 20.8 L40 19 L46.2 17.2 Z" fill="#FDE68A" /><circle cx="47" cy="46" r="2.5" fill="#FFFFFF" opacity="0.7" /></svg>
  );
}

// ─── Íconos ───────────────────────────────────────────────────────────────────
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
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M2 7.5h1.4l1.8-2.8h10l1.8 2.8H19a.9.9 0 01.9.9v7.2a.9.9 0 01-.9.9H2a.9.9 0 01-.9-.9V8.4A.9.9 0 012 7.5z"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
    />
    <circle
      cx="10.5"
      cy="11.5"
      r="2.8"
      stroke="currentColor"
      strokeWidth="1.4"
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
const IconoMusic = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      d="M7 14V5l8-2v9"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="5"
      cy="14"
      r="2"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
    />
    <circle
      cx="13"
      cy="12"
      r="2"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
    />
  </svg>
);
const IconoVideo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect
      x="1"
      y="4"
      width="11"
      height="10"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
    />
    <path
      d="M12 7.5l5-2.5v8l-5-2.5V7.5z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);
const IconoPeople = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle
      cx="6.5"
      cy="6.5"
      r="2.5"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
    />
    <path
      d="M1 16c0-3 2.5-5.5 5.5-5.5S12 13 12 16"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      fill="none"
    />
    <circle
      cx="13"
      cy="6"
      r="2"
      stroke="currentColor"
      strokeWidth="1.3"
      fill="none"
    />
    <path
      d="M15.5 16c0-2.2-1.3-4-3-4.8"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);
const IconoMap = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      d="M9 1a5 5 0 00-5 5c0 4 5 11 5 11s5-7 5-11a5 5 0 00-5-5z"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
    />
    <circle
      cx="9"
      cy="6.5"
      r="1.8"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
    />
  </svg>
);
const IconoQuote = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      d="M2 9h4V5H2v4zm0 0c0 2.2 1.8 4 4 4M9 9h4V5H9v4zm0 0c0 2.2 1.8 4 4 4"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

function Particles() {
  return (
    <div className="particles" aria-hidden="true">
      {[...Array(6)].map((_, i) => (
        <div key={i} className={`particle particle-${i + 1}`} />
      ))}
    </div>
  );
}

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

// ─── Traducciones ─────────────────────────────────────────────────────────────
const T = {
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
    frase: "Frase especial del evento",
    frasePlaceholder:
      "Ej: Para siempre juntos · El comienzo de una nueva etapa",
    mensaje: "Mensaje para los invitados",
    fechaLugar: "Fecha y lugar",
    fecha: "Fecha *",
    hora: "Hora *",
    lugarNombre: "Nombre del lugar *",
    mapsLink: "Link de Google Maps",
    mapsHint: "Abre Google Maps → busca el lugar → Compartir → Copiar enlace",
    comoLlegar: "Cómo llegar (instrucciones)",
    comoLlegarPH:
      "Ej: Al llegar al semáforo de la 5a Av., doblar a la derecha...",
    fotoLugar: "Foto del lugar (se muestra destacada en la tarjeta)",
    fotoLugarHint: "Aparecerá primero en la invitación con botón «Cómo llegar»",
    videoLugar: "Video corto del lugar",
    videoLugarHint: "MP4 — máx 30 MB",
    videoBtn: "Seleccionar video",
    videoCambiar: "Cambiar",
    musica: "Música del evento",
    musicaArchivo: "Pista de audio",
    musicaArchivoHint: "MP3 u OGG — máx 15 MB",
    musicaNombre: "Nombre de la canción",
    musicaNombrePH: "Ej: Perfect — Ed Sheeran",
    musicaBtn: "Seleccionar audio",
    musicaCambiar: "Cambiar",
    cupo: "Cupo de personas",
    cupoLabel: "Número máximo de personas",
    cupoHint: "Déjalo vacío si no hay límite de cupo",
    cupoPH: "Ej: 150",
    cupoDesc: "Si se llena el cupo, los invitados no podrán confirmar.",
    confirmacion: "Confirmación de asistencia",
    fechaLimite: "Fecha límite para confirmar *",
    fechaLimiteHint: "Después de esta fecha los invitados no podrán confirmar",
    crear: "Crear evento",
    creando: "Creando evento...",
    footer: "Podrás editar los detalles del evento después de crearlo",
    errorCampos: "Por favor llena todos los campos obligatorios",
    errorCrear: "Error al crear el evento: ",
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
    frase: "Special event phrase",
    frasePlaceholder: "Ex: Forever together · The beginning of a new chapter",
    mensaje: "Message for guests",
    fechaLugar: "Date & venue",
    fecha: "Date *",
    hora: "Time *",
    lugarNombre: "Venue name *",
    mapsLink: "Google Maps link",
    mapsHint: "Open Google Maps → search venue → Share → Copy link",
    comoLlegar: "How to get there",
    comoLlegarPH:
      "Ex: When you reach the traffic light on 5th Ave., turn right...",
    fotoLugar: "Venue photo (featured on the card)",
    fotoLugarHint:
      "Appears first on the invitation with a «How to get there» button",
    videoLugar: "Short venue video",
    videoLugarHint: "MP4 — max 30 MB",
    videoBtn: "Select video",
    videoCambiar: "Change",
    musica: "Event music",
    musicaArchivo: "Audio track",
    musicaArchivoHint: "MP3 or OGG — max 15 MB",
    musicaNombre: "Song name",
    musicaNombrePH: "Ex: Perfect — Ed Sheeran",
    musicaBtn: "Select audio",
    musicaCambiar: "Change",
    cupo: "Guest capacity",
    cupoLabel: "Maximum number of people",
    cupoHint: "Leave empty if there's no capacity limit",
    cupoPH: "Ex: 150",
    cupoDesc: "Once capacity is reached, guests won't be able to confirm.",
    confirmacion: "RSVP",
    fechaLimite: "RSVP deadline *",
    fechaLimiteHint: "After this date guests won't be able to confirm",
    crear: "Create event",
    creando: "Creating event...",
    footer: "You can edit the event details after creating it",
    errorCampos: "Please fill in all required fields",
    errorCrear: "Error creating event: ",
    tipos: {
      quinceañera: "Quinceañera",
      boda: "Wedding",
      graduacion: "Graduation",
      cumpleaños: "Birthday",
      otro: "Other",
    },
  },
};

const CONFIG_TIPO: Record<string, { es: any; en: any }> = {
  quinceañera: {
    es: {
      pNombre: "Ej: XV Años de Sofía",
      pAnf: "Ej: Familia García López",
      pLugar: "Ej: Salón Versalles, San Salvador",
      pMensaje:
        "Ej: Con mucha alegría los invitamos a celebrar los XV años de Sofía...",
      lPortada: "Foto de la festejada",
      lLugar: "Foto del salón o lugar",
    },
    en: {
      pNombre: "Ex: Sofia's XV",
      pAnf: "Ex: García López Family",
      pLugar: "Ex: Versailles Hall, San Salvador",
      pMensaje: "Ex: With great joy we invite you to celebrate Sofia's XV...",
      lPortada: "Photo of the honoree",
      lLugar: "Photo of the venue",
    },
  },
  boda: {
    es: {
      pNombre: "Ej: Boda de Ana & Carlos",
      pAnf: "Ej: Familias Martínez y López",
      pLugar: "Ej: Hacienda El Paraíso, Santa Ana",
      pMensaje: "Ej: Con amor los invitamos a compartir el día más especial...",
      lPortada: "Foto de la pareja",
      lLugar: "Foto de la iglesia o hacienda",
    },
    en: {
      pNombre: "Ex: Ana & Carlos' Wedding",
      pAnf: "Ex: Martínez and López Families",
      pLugar: "Ex: Hacienda El Paraíso, Santa Ana",
      pMensaje: "Ex: With love we invite you to share our most special day...",
      lPortada: "Photo of the couple",
      lLugar: "Photo of the church or venue",
    },
  },
  graduacion: {
    es: {
      pNombre: "Ej: Graduación de Luis — Ingeniería 2025",
      pAnf: "Ej: Familia Ramírez",
      pLugar: "Ej: Centro de Convenciones UCA",
      pMensaje: "Ej: Con gran orgullo los invitamos a celebrar este logro...",
      lPortada: "Foto del graduado",
      lLugar: "Foto del auditorio",
    },
    en: {
      pNombre: "Ex: Luis' Graduation — Engineering 2025",
      pAnf: "Ex: Ramírez Family",
      pLugar: "Ex: UCA Convention Center",
      pMensaje:
        "Ex: With great pride we invite you to celebrate this achievement...",
      lPortada: "Photo of the graduate",
      lLugar: "Photo of the auditorium",
    },
  },
  cumpleaños: {
    es: {
      pNombre: "Ej: 30 Años de María",
      pAnf: "Ej: Diego Hernández",
      pLugar: "Ej: Restaurante La Terraza, Santa Tecla",
      pMensaje: "Ej: ¡Ven a celebrar conmigo este nuevo capítulo!",
      lPortada: "Foto del festejado",
      lLugar: "Foto del salón o restaurante",
    },
    en: {
      pNombre: "Ex: María's 30th Birthday",
      pAnf: "Ex: Diego Hernández",
      pLugar: "Ex: La Terraza Restaurant, Santa Tecla",
      pMensaje: "Ex: Come celebrate this new chapter with me!",
      lPortada: "Photo of the birthday person",
      lLugar: "Photo of the venue",
    },
  },
  otro: {
    es: {
      pNombre: "Ej: Reunión Familiar Navidad 2025",
      pAnf: "Ej: Familia Pérez",
      pLugar: "Ej: Casa de la abuela, Soyapango",
      pMensaje:
        "Ej: Los esperamos para compartir un momento especial juntos...",
      lPortada: "Foto del evento",
      lLugar: "Foto del lugar",
    },
    en: {
      pNombre: "Ex: Family Christmas Reunion 2025",
      pAnf: "Ex: Pérez Family",
      pLugar: "Ex: Grandma's house, Soyapango",
      pMensaje: "Ex: We look forward to sharing a special moment together...",
      lPortada: "Event photo",
      lLugar: "Venue photo",
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

// ─── Upload helper ─────────────────────────────────────────────────────────────
async function subirArchivo(file: File, bucket: string, prefijo: string) {
  const ext = file.name.split(".").pop();
  const fileName = `${prefijo}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    console.error(`Error subiendo a ${bucket}:`, error.message);
    return null;
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

// ─── FilePickRow ───────────────────────────────────────────────────────────────
function FilePickRow({
  icon,
  label,
  hint,
  accept,
  file,
  onChange,
  btnLabel,
  btnCambiar,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  accept: string;
  file: File | null;
  onChange: (f: File) => void;
  btnLabel: string;
  btnCambiar: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <Campo label={label} hint={hint}>
      <div className="file-pick-row" onClick={() => inputRef.current?.click()}>
        <div className="file-pick-icon">{icon}</div>
        <div className="file-pick-info">
          {file ? (
            <>
              <span className="file-name">{file.name}</span>
              <span className="file-size">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </span>
            </>
          ) : (
            <span className="file-empty">{btnLabel}</span>
          )}
        </div>
        <div className={`file-pick-btn${file ? " file-pick-btn-change" : ""}`}>
          {file ? btnCambiar : "+"}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onChange(f);
          }}
          style={{ display: "none" }}
        />
      </div>
    </Campo>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function NuevoEvento() {
  const router = useRouter();
  const [lang, setLang] = useState<"es" | "en">("es");
  const t = T[lang];
  const [tipo, setTipo] = useState("quinceañera");
  const cfg = CONFIG_TIPO[tipo][lang];

  const [nombre, setNombre] = useState("");
  const [anfitriones, setAnfitriones] = useState("");
  const [frase, setFrase] = useState("");
  const [mensajeInvitacion, setMensajeInvitacion] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [lugar, setLugar] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [comoLlegar, setComoLlegar] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [imagen, setImagen] = useState<File | null>(null);
  const [imagenLugar, setImagenLugar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewLugar, setPreviewLugar] = useState<string | null>(null);
  // videoLugar eliminado
  const [musicaFile, setMusicaFile] = useState<File | null>(null);
  const [musicaNombre, setMusicaNombre] = useState("");
  const [cupo, setCupo] = useState("");
  const [tema, setTema] = useState("clasico");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Eventix — Nuevo evento";
  }, []);

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

    const [imagen_url, foto_lugar_url, musica_url] =
      await Promise.all([
        imagen
          ? subirArchivo(imagen, "eventos", user.id)
          : Promise.resolve(null),
        imagenLugar
          ? subirArchivo(imagenLugar, "eventos", `lugar-${user.id}`)
          : Promise.resolve(null),
        musicaFile
          ? subirArchivo(musicaFile, "musica-eventos", `musica-${user.id}`)
          : Promise.resolve(null),
      ]);

    const { data: nuevoEvento, error: insertError } = await supabase.from("eventos").insert({
      organizador_id: user.id,
      nombre,
      tipo,
      anfitriones,
      frase_evento: frase || null,
      mensaje_invitacion: mensajeInvitacion || null,
      fecha,
      hora,
      lugar,
      maps_url: mapsUrl || null,
      como_llegar: comoLlegar || null,
      fecha_limite_confirmacion: fechaLimite,
      imagen_url,
      foto_lugar_url,
      musica_url,
      musica_nombre: musicaNombre || null,
      cupo_personas: cupo ? parseInt(cupo) : null,
    }).select("id").single();

    if (insertError) {
      setError(t.errorCrear + insertError.message);
      setLoading(false);
      return;
    }

    // Guardar tema por separado (columna opcional — silencia error si columna no existe)
    if (nuevoEvento?.id && tema !== "clasico") {
      try {
        await supabase.from("eventos").update({ tema }).eq("id", nuevoEvento.id);
      } catch {
        // columna tema aún no migrada, ignorar
      }
    }

    router.push("/dashboard");
    setLoading(false);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{font-family:'DM Sans',sans-serif;overflow-x:hidden;-webkit-font-smoothing:antialiased;background:#FAFBFF}

        :root{
          --bg:#FAFBFF;--surface:#FFFFFF;--surface2:#F4F5FB;
          --border:rgba(124,58,237,0.16);--border-mid:rgba(124,58,237,0.28);
          --accent:#7C3AED;--accent2:#5B21B6;--accent3:#5a3e1b;
          --accent-soft:rgba(124,58,237,0.08);--accent-soft2:rgba(124,58,237,0.16);
          --text:#0F172A;--text2:#475569;--text3:#5B21B6;
          --danger:#dc2626;--danger-bg:#fef2f2;--danger-border:#fecaca;
          --shadow:0 4px 24px rgba(15,23,42,0.10);--shadow-sm:0 2px 10px rgba(15,23,42,0.07);
          --nav-bg:rgba(250,246,240,0.95);--transition:all 0.35s cubic-bezier(.4,0,.2,1);
          --radius:18px;
        }

        .page{min-height:100vh;background:var(--bg);position:relative;overflow-x:hidden;padding-bottom:60px}
        .glow{position:fixed;pointer-events:none;z-index:0;border-radius:50%;filter:blur(90px)}
        .glow-1{width:320px;height:320px;top:-100px;right:-80px;background:radial-gradient(circle,rgba(124,58,237,0.14) 0%,transparent 70%);animation:gd1 9s ease-in-out infinite}
        .glow-2{width:260px;height:260px;bottom:100px;left:-80px;background:radial-gradient(circle,rgba(94,234,212,0.09) 0%,transparent 70%);animation:gd2 11s ease-in-out infinite}
        @keyframes gd1{0%,100%{transform:translate(0,0)}40%{transform:translate(-16px,24px)}70%{transform:translate(12px,-16px)}}
        @keyframes gd2{0%,100%{transform:translate(0,0)}35%{transform:translate(20px,-26px)}65%{transform:translate(-10px,16px)}}

        .particles{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
        .particle{position:absolute;border-radius:50%;background:rgba(94,234,212,0.6);opacity:0;animation:pf linear infinite}
        .particle-1{width:3px;height:3px;left:12%;animation-duration:14s;animation-delay:0s}
        .particle-2{width:2px;height:2px;left:35%;animation-duration:17s;animation-delay:3s}
        .particle-3{width:3px;height:3px;left:58%;animation-duration:12s;animation-delay:1s}
        .particle-4{width:2px;height:2px;left:72%;animation-duration:15s;animation-delay:4s}
        .particle-5{width:3px;height:3px;left:82%;animation-duration:13s;animation-delay:.5s}
        .particle-6{width:2px;height:2px;left:92%;animation-duration:18s;animation-delay:5s}
        @keyframes pf{0%{transform:translateY(110vh);opacity:0}5%{opacity:.12}90%{opacity:.12}100%{transform:translateY(-10vh) translateX(16px);opacity:0}}

        /* ── Nav ── */
        .nav{position:sticky;top:0;z-index:30;height:56px;padding:0 16px;
          display:flex;align-items:center;justify-content:space-between;
          background:var(--nav-bg);backdrop-filter:blur(18px);
          border-bottom:1px solid var(--border);box-shadow:var(--shadow-sm)}
        .nav-left{display:flex;align-items:center;gap:10px;min-width:0}
        .nav-back{width:34px;height:34px;border-radius:10px;background:var(--surface);
          border:1px solid var(--border);display:flex;align-items:center;justify-content:center;
          color:var(--text3);cursor:pointer;transition:var(--transition);text-decoration:none;flex-shrink:0}
        .nav-back:hover{color:var(--accent);background:var(--accent-soft2);border-color:var(--accent2)}
        .nav-brand{display:flex;align-items:center;gap:8px;min-width:0}
        .nav-brand-name{font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:600;color:var(--accent);letter-spacing:-0.5px;white-space:nowrap}
        .nav-brand-sub{font-size:9px;color:var(--text3);font-weight:600;letter-spacing:.4px;text-transform:uppercase;margin-top:1px;white-space:nowrap}
        .nav-right{display:flex;align-items:center;gap:6px;flex-shrink:0}
        .ctrl-btn{padding:0 12px;height:32px;border-radius:20px;background:var(--surface);
          border:1px solid var(--border);display:flex;align-items:center;justify-content:center;
          cursor:pointer;transition:var(--transition);color:var(--text2);
          font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;font-family:'DM Sans',sans-serif;
          -webkit-tap-highlight-color:transparent}
        .ctrl-btn:hover{background:var(--accent-soft2);color:var(--accent);border-color:var(--accent2)}

        /* ── Content ── */
        .content{max-width:480px;margin:0 auto;padding:16px 14px 0;position:relative;z-index:1;display:flex;flex-direction:column;gap:11px}

        /* ── Section card ── */
        .section-card{background:var(--surface);border-radius:var(--radius);padding:16px 14px;border:1px solid var(--border);box-shadow:var(--shadow)}
        .section-title{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:var(--accent2);margin-bottom:13px;display:flex;align-items:center;gap:6px}
        .section-title svg{opacity:.7;flex-shrink:0}

        /* ── Tipos ── */
        .tipos-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
        .tipo-btn{display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 3px;border-radius:12px;font-size:9.5px;font-weight:700;border:2px solid var(--border);background:var(--surface2);color:var(--text2);cursor:pointer;transition:var(--transition);font-family:'DM Sans',sans-serif;-webkit-tap-highlight-color:transparent;text-align:center;line-height:1.2}
        .tipo-btn:hover{border-color:var(--accent2);color:var(--accent);background:var(--accent-soft)}
        .tipo-btn.active{background:var(--accent);color:#fff;border-color:var(--accent);box-shadow:0 3px 12px rgba(124,58,237,0.38)}

        /* ── Photo portada (grande) ── */
        .photo-upload{cursor:pointer;display:block;border-radius:12px;overflow:hidden;border:2px dashed var(--border-mid);transition:var(--transition)}
        .photo-upload:hover{border-color:var(--accent2);background:var(--accent-soft)}
        .photo-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:var(--accent-soft);padding:24px 16px;text-align:center}
        .photo-empty-icon{width:48px;height:48px;border-radius:12px;background:var(--surface);border:1px solid var(--border-mid);display:flex;align-items:center;justify-content:center;color:var(--accent)}
        .photo-empty-title{font-size:12px;font-weight:700;color:var(--accent)}
        .photo-empty-sub{font-size:10px;color:var(--text3);margin-top:1px}
        /* portada: tall */
        .photo-cover .photo-empty{min-height:180px}
        .photo-cover .photo-preview{height:180px}
        /* lugar: PEQUEÑA — solo 110px */
        .photo-venue .photo-empty{min-height:110px;padding:16px}
        .photo-venue .photo-preview{height:110px}
        .photo-preview{position:relative;width:100%}
        .photo-preview-img{width:100%;height:100%;object-fit:cover;display:block}
        .photo-cover .photo-preview-img{object-fit:contain;background:#111}
        .photo-preview-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.38);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;opacity:0;transition:opacity .22s ease}
        .photo-preview:hover .photo-preview-overlay{opacity:1}
        .photo-preview-overlay-text{color:white;font-size:11px;font-weight:700}

        /* ── Badge destacada ── */
        .venue-badge{display:inline-flex;align-items:center;gap:4px;background:rgba(124,58,237,0.10);color:var(--accent2);font-size:9px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;padding:3px 9px;border-radius:100px;margin-bottom:8px;border:1px solid var(--border-mid)}

        /* ── File pick ── */
        .file-pick-row{display:flex;align-items:center;gap:9px;background:var(--accent-soft);border:2px dashed var(--border-mid);border-radius:11px;padding:10px 11px;cursor:pointer;transition:var(--transition)}
        .file-pick-row:hover{border-color:var(--accent);background:var(--surface)}
        .file-pick-icon{width:32px;height:32px;border-radius:9px;background:var(--surface);border:1px solid var(--border-mid);display:flex;align-items:center;justify-content:center;color:var(--accent);flex-shrink:0}
        .file-pick-info{flex:1;min-width:0}
        .file-name{display:block;font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .file-size{display:block;font-size:10px;color:var(--text3);margin-top:1px}
        .file-empty{font-size:12px;color:var(--text3)}
        .file-pick-btn{background:var(--accent);color:white;border-radius:7px;padding:4px 10px;font-size:11px;font-weight:700;flex-shrink:0;white-space:nowrap}
        .file-pick-btn-change{background:var(--surface2);color:var(--accent2);border:1px solid var(--border-mid)}

        /* ── Cupo — FIJO, sin desbordamiento ── */
        .cupo-wrap{display:flex;flex-direction:column;gap:8px}
        .cupo-top{display:flex;align-items:center;gap:10px}
        .cupo-input{width:110px;flex-shrink:0}
        .cupo-tag{font-size:11px;color:var(--text3);line-height:1.4;flex:1}

        /* ── Fields ── */
        .fields-group{display:flex;flex-direction:column;gap:13px}
        .field-label{font-size:10px;font-weight:700;color:var(--accent2);display:block;margin-bottom:5px;letter-spacing:.2px;text-transform:uppercase}
        .field-input{width:100%;border:2px solid var(--border-mid);border-radius:11px;padding:10px 12px;font-size:14px;background:var(--accent-soft);color:var(--text);outline:none;transition:border-color .2s,box-shadow .2s,background .2s;font-family:'DM Sans',sans-serif;-webkit-appearance:none;touch-action:manipulation}
        .field-input::placeholder{color:var(--text3)}
        .field-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(124,58,237,0.10);background:var(--surface)}
        .field-hint{font-size:10px;color:var(--text3);margin-top:4px;padding:0 2px;line-height:1.4}
        .field-textarea{resize:none}
        .input-icon-wrap{position:relative}
        .input-icon-wrap .input-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--text3);pointer-events:none}
        .input-icon-wrap .field-input{padding-left:32px}
        .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:9px}
        .error-box{background:var(--danger-bg);border:1px solid var(--danger-border);color:var(--danger);font-size:13px;padding:10px 13px;border-radius:11px;display:flex;align-items:center;gap:8px}

        /* ── Submit ── */
        .btn-submit{width:100%;padding:14px;border-radius:var(--radius);border:none;
          background:linear-gradient(135deg,var(--accent) 0%,var(--accent3) 100%);
          color:#fff;font-size:15px;font-weight:800;font-family:'DM Sans',sans-serif;
          cursor:pointer;box-shadow:0 6px 22px rgba(124,58,237,0.36);
          transition:transform .2s,box-shadow .2s,opacity .2s;position:relative;overflow:hidden;
          display:flex;align-items:center;justify-content:center;gap:8px;
          -webkit-tap-highlight-color:transparent;touch-action:manipulation;min-height:50px}
        .btn-submit::after{content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.15) 50%,transparent 60%);background-size:200% 100%;animation:shimmer 3.5s ease-in-out infinite}
        .btn-submit:not(:disabled):hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(124,58,237,0.46)}
        .btn-submit:not(:disabled):active{transform:scale(0.98)}
        .btn-submit:disabled{opacity:.55;cursor:not-allowed}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        .footer-note{text-align:center;font-size:10px;color:var(--text3);padding-bottom:6px}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spin{animation:spin .75s linear infinite}

        /* ── Responsive ── */
        @media(max-width:360px){
          .tipos-grid{grid-template-columns:repeat(3,1fr)}
          .tipo-btn{padding:9px 2px;font-size:9px}
          .grid-2{grid-template-columns:1fr}
        }
        @media(max-height:580px){.nav{height:48px}}
      `}</style>

      <div className="page">
        <div className="glow glow-1" />
        <div className="glow glow-2" />
        <Particles />

        <nav className="nav">
          <div className="nav-left">
            <Link href="/dashboard" className="nav-back">
              <IconoBack />
            </Link>
            <div className="nav-brand">
              <AppLogo size={28} />
              <div>
                <div className="nav-brand-name">Eventix</div>
                <div className="nav-brand-sub">{t.title}</div>
              </div>
            </div>
          </div>
          <div className="nav-right">
            <button
              className="ctrl-btn"
              onClick={() => setLang(lang === "es" ? "en" : "es")}
            >
              {lang === "es" ? "EN" : "ES"}
            </button>
          </div>
        </nav>

        <div className="content">
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

          {/* 1. Tipo */}
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
                  {T[lang].tipos[value as keyof typeof T.es.tipos]}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Foto portada (grande) */}
          <div className="section-card">
            <p className="section-title">
              <IconoCamera />
              {t.fotoPortada}
            </p>
            <label className="photo-upload photo-cover">
              {preview ? (
                <div className="photo-preview">
                  <img
                    src={preview}
                    alt="preview"
                    className="photo-preview-img"
                  />
                  <div className="photo-preview-overlay">
                    <IconoCamera />
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
                  <p className="photo-empty-title">{cfg.lPortada}</p>
                  <p className="photo-empty-sub">{t.fmtFoto}</p>
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

          {/* 3. Info del evento */}
          <div className="section-card">
            <p className="section-title">{t.infoEvento}</p>
            <div className="fields-group">
              <Campo label={t.nombreEvento}>
                <input
                  className="field-input"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder={cfg.pNombre}
                />
              </Campo>
              <Campo label={t.anfitriones}>
                <input
                  className="field-input"
                  type="text"
                  value={anfitriones}
                  onChange={(e) => setAnfitriones(e.target.value)}
                  placeholder={cfg.pAnf}
                />
              </Campo>
              <Campo label={t.frase}>
                <div className="input-icon-wrap">
                  <span className="input-icon">
                    <IconoQuote />
                  </span>
                  <input
                    className="field-input"
                    type="text"
                    value={frase}
                    onChange={(e) => setFrase(e.target.value)}
                    placeholder={t.frasePlaceholder}
                  />
                </div>
              </Campo>
              <Campo label={t.mensaje}>
                <textarea
                  className="field-input field-textarea"
                  value={mensajeInvitacion}
                  onChange={(e) => setMensajeInvitacion(e.target.value)}
                  placeholder={cfg.pMensaje}
                  rows={3}
                />
              </Campo>
            </div>
          </div>

          {/* 4. Fecha y lugar */}
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
                  placeholder={cfg.pLugar}
                />
              </Campo>

              <Campo label={t.mapsLink} hint={t.mapsHint}>
                <div className="input-icon-wrap">
                  <span className="input-icon">
                    <IconoMap />
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

              <Campo label={t.comoLlegar}>
                <textarea
                  className="field-input field-textarea"
                  value={comoLlegar}
                  onChange={(e) => setComoLlegar(e.target.value)}
                  placeholder={t.comoLlegarPH}
                  rows={2}
                />
              </Campo>

              {/* Foto del lugar — PEQUEÑA con badge */}
              <div>
                <label className="field-label">{t.fotoLugar}</label>
                <div className="venue-badge">
                  {lang === "es" ? "Opcional" : "Optional"}
                </div>
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
                        <IconoCamera />
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
                      <p className="photo-empty-title">{cfg.lLugar}</p>
                      <p className="photo-empty-sub">{t.fmtFoto}</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImagen(e, "lugar")}
                    style={{ display: "none" }}
                  />
                </label>
                <p className="field-hint">{t.fotoLugarHint}</p>
              </div>

              {/* Video del lugar eliminado — no requerido */}
            </div>
          </div>

          {/* 5. Música */}
          <div className="section-card">
            <p className="section-title">
              <IconoMusic />
              {t.musica}
            </p>
            <div className="fields-group">
              <FilePickRow
                icon={<IconoMusic />}
                label={t.musicaArchivo}
                hint={t.musicaArchivoHint}
                accept="audio/mpeg,audio/ogg,audio/mp3,audio/*"
                file={musicaFile}
                onChange={setMusicaFile}
                btnLabel={t.musicaBtn}
                btnCambiar={t.musicaCambiar}
              />
              <Campo label={t.musicaNombre}>
                <input
                  className="field-input"
                  type="text"
                  value={musicaNombre}
                  onChange={(e) => setMusicaNombre(e.target.value)}
                  placeholder={t.musicaNombrePH}
                />
              </Campo>
            </div>
          </div>

          {/* 6. Cupo — layout columna, sin desbordamiento */}
          <div className="section-card">
            <p className="section-title">
              <IconoPeople />
              {t.cupo}
            </p>
            <div className="fields-group">
              <Campo label={t.cupoLabel} hint={t.cupoHint}>
                <div className="cupo-wrap">
                  <div className="cupo-top">
                    <input
                      className="field-input cupo-input"
                      type="number"
                      min="1"
                      max="9999"
                      value={cupo}
                      onChange={(e) => setCupo(e.target.value)}
                      placeholder={t.cupoPH}
                    />
                    <span className="cupo-tag">{t.cupoDesc}</span>
                  </div>
                </div>
              </Campo>
            </div>
          </div>

          {/* 7. Confirmación */}
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

          {/* 8. Tema de color */}
          <div className="section-card">
            <p className="section-title">🎨 {lang === "es" ? "Tema de color" : "Color theme"}</p>
            <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 12 }}>
              {lang === "es" ? "Elige la paleta de colores de tu tarjeta de invitación" : "Choose the color palette for your invitation card"}
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {([
                { id: "clasico", label: lang === "es" ? "Clásico" : "Classic", colors: ["#1a1209", "#7C3AED", "#FAFBFF"], desc: lang === "es" ? "Dorado elegante" : "Elegant gold" },
                { id: "rosado", label: lang === "es" ? "Rosado" : "Blush", colors: ["#4a1535", "#d4847a", "#FDF5F5"], desc: lang === "es" ? "Rosa romántico" : "Romantic blush" },
                { id: "esmeralda", label: lang === "es" ? "Esmeralda" : "Emerald", colors: ["#0d2d1e", "#4caf82", "#F2FAF6"], desc: lang === "es" ? "Verde sofisticado" : "Sophisticated green" },
              ] as { id: string; label: string; colors: string[]; desc: string }[]).map((t2) => (
                <button
                  key={t2.id}
                  type="button"
                  onClick={() => setTema(t2.id)}
                  style={{
                    flex: "1 1 120px",
                    padding: "12px 10px",
                    borderRadius: 14,
                    border: tema === t2.id ? "2px solid var(--accent)" : "1.5px solid var(--border-mid)",
                    background: tema === t2.id ? "var(--accent-soft2)" : "var(--surface2)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 7,
                    transition: "all .2s",
                  }}
                >
                  {/* Color swatches */}
                  <div style={{ display: "flex", gap: 4 }}>
                    {t2.colors.map((c, i) => (
                      <div key={i} style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: "1.5px solid rgba(0,0,0,0.1)" }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{t2.label}</div>
                  <div style={{ fontSize: 10, color: "var(--text3)" }}>{t2.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Crear */}
          <button
            className="btn-submit"
            onClick={handleCrear}
            disabled={loading}
            type="button"
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
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M7 1v12M1 7h12"
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
