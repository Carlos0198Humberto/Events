"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

// ── Logo SVG ───────────────────────────────────────────────────────────────
function EventsLogo({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="9" fill="#0d9488" />
      <path
        d="M22 6 L23 9 L26 10 L23 11 L22 14 L21 11 L18 10 L21 9 Z"
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
        d="M5 15.5 L13 20 L21 15.5"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M13 12 C13 10.5 14 10 15 11 C16 10 17 10.5 17 12 C17 13.5 15 15 15 15 C15 15 13 13.5 13 12Z"
        fill="white"
        opacity="0.9"
      />
    </svg>
  );
}

// ── Íconos SVG por tipo ────────────────────────────────────────────────────
function IconoCrown() {
  return (
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
}
function IconoRings() {
  return (
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
}
function IconoCap() {
  return (
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
}
function IconoCake() {
  return (
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
}
function IconoStar() {
  return (
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
}

// ── Config dinámica por tipo ───────────────────────────────────────────────
const CONFIG_TIPO: Record<
  string,
  {
    placeholderNombre: string;
    placeholderAnfitriones: string;
    placeholderLugar: string;
    placeholderMensaje: string;
    labelFotoPortada: string;
    labelFotoLugar: string;
  }
> = {
  quinceañera: {
    placeholderNombre: "Ej: XV Años de Sofía",
    placeholderAnfitriones: "Ej: Familia García López",
    placeholderLugar: "Ej: Salón Versalles, San Salvador",
    placeholderMensaje:
      "Ej: Con mucha alegría los invitamos a celebrar los XV años de Sofía...",
    labelFotoPortada: "Foto de la festejada",
    labelFotoLugar: "Foto del salón o lugar",
  },
  boda: {
    placeholderNombre: "Ej: Boda de Ana & Carlos",
    placeholderAnfitriones: "Ej: Familias Martínez y López",
    placeholderLugar: "Ej: Hacienda El Paraíso, Santa Ana",
    placeholderMensaje:
      "Ej: Con amor y alegría los invitamos a compartir el día más especial de nuestras vidas...",
    labelFotoPortada: "Foto de la pareja",
    labelFotoLugar: "Foto de la iglesia o hacienda",
  },
  graduacion: {
    placeholderNombre: "Ej: Graduación de Luis — Ingeniería 2025",
    placeholderAnfitriones: "Ej: Familia Ramírez",
    placeholderLugar: "Ej: Centro de Convenciones UCA, San Salvador",
    placeholderMensaje:
      "Ej: Con gran orgullo los invitamos a celebrar este logro que tanto nos costó...",
    labelFotoPortada: "Foto del graduado",
    labelFotoLugar: "Foto del auditorio o recinto",
  },
  cumpleaños: {
    placeholderNombre: "Ej: 30 Años de María — Una nueva era",
    placeholderAnfitriones: "Ej: Diego Hernández",
    placeholderLugar: "Ej: Restaurante La Terraza, Santa Tecla",
    placeholderMensaje:
      "Ej: ¡Ven a celebrar conmigo este nuevo capítulo! Habrá música, comida y mucha alegría...",
    labelFotoPortada: "Foto del festejado",
    labelFotoLugar: "Foto del salón o restaurante",
  },
  otro: {
    placeholderNombre: "Ej: Reunión Familiar Navidad 2025",
    placeholderAnfitriones: "Ej: Familia Pérez",
    placeholderLugar: "Ej: Casa de la abuela, Soyapango",
    placeholderMensaje:
      "Ej: Los esperamos para compartir un momento especial juntos...",
    labelFotoPortada: "Foto del evento",
    labelFotoLugar: "Foto del lugar",
  },
};

const TIPOS = [
  { value: "quinceañera", label: "Quinceañera", Icono: IconoCrown },
  { value: "boda", label: "Boda", Icono: IconoRings },
  { value: "graduacion", label: "Graduación", Icono: IconoCap },
  { value: "cumpleaños", label: "Cumpleaños", Icono: IconoCake },
  { value: "otro", label: "Otro", Icono: IconoStar },
];

// ── Campo reutilizable ─────────────────────────────────────────────────────
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
      <label className="text-xs font-semibold text-gray-500 block mb-2">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-[11px] text-gray-400 mt-1.5 px-0.5">{hint}</p>
      )}
    </div>
  );
}

const inputCls =
  "w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 bg-gray-50 transition-colors placeholder:text-gray-300 text-gray-700";

// ── Página principal ───────────────────────────────────────────────────────
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

  const cfg = CONFIG_TIPO[tipo];

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
      setError("Por favor llena todos los campos obligatorios");
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

    if (insertError)
      setError("Error al crear el evento: " + insertError.message);
    else router.push("/dashboard");

    setLoading(false);
  }

  return (
    <main
      className="min-h-screen pb-16"
      style={{
        background:
          "linear-gradient(160deg, #f0fdfa 0%, #d1fae5 50%, #ccfbf1 100%)",
      }}
    >
      {/* ── Header ── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-teal-100 px-5 py-3.5 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
        <Link
          href="/dashboard"
          className="text-gray-400 hover:text-teal-600 transition-colors p-1 -ml-1 rounded-lg hover:bg-teal-50"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M13 4l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <div className="flex items-center gap-2.5">
          <EventsLogo size={30} />
          <div>
            <span className="font-bold text-gray-800 text-sm leading-none block">
              Nuevo evento
            </span>
            <span className="text-[10px] text-teal-500 font-medium leading-none">
              Events — invitaciones digitales
            </span>
          </div>
        </div>
      </header>

      <div className="px-4 pt-5 max-w-lg mx-auto space-y-4">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-2xl flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.4" />
              <path
                d="M8 5v3M8 10v1"
                stroke="#ef4444"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            {error}
          </div>
        )}

        {/* ── Sección 1: Tipo de evento ── */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-teal-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-teal-500 mb-4">
            Tipo de evento
          </p>
          <div className="grid grid-cols-5 gap-2">
            {TIPOS.map(({ value, label, Icono }) => {
              const activo = tipo === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTipo(value)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl text-[10px] font-semibold transition-all border-2 ${
                    activo
                      ? "bg-teal-500 text-white border-teal-500 shadow-md shadow-teal-200"
                      : "bg-gray-50 text-gray-500 border-gray-100 hover:border-teal-200 hover:text-teal-600 hover:bg-teal-50"
                  }`}
                >
                  <Icono />
                  <span className="leading-tight text-center">{label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Sección 2: Foto portada ── */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-teal-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-teal-500 mb-4">
            Foto de portada
          </p>
          <label className="cursor-pointer block">
            {preview ? (
              <div className="relative w-full h-52 rounded-2xl overflow-hidden">
                <Image
                  src={preview}
                  alt="preview"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-1">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path
                      d="M11 15a4 4 0 100-8 4 4 0 000 8z"
                      stroke="white"
                      strokeWidth="1.5"
                      fill="none"
                    />
                    <path
                      d="M2 8.5h1.5l2-3h11l2 3H20a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1v-8a1 1 0 011-1z"
                      stroke="white"
                      strokeWidth="1.5"
                      fill="none"
                    />
                  </svg>
                  <span className="text-white text-xs font-semibold">
                    Cambiar foto
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full h-52 rounded-2xl border-2 border-dashed border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path
                      d="M5 23l5.5-5.5 3.5 3.5 4.5-6 5 8H5z"
                      stroke="#0d9488"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    <circle
                      cx="10"
                      cy="11"
                      r="2.5"
                      stroke="#0d9488"
                      strokeWidth="1.4"
                      fill="none"
                    />
                    <rect
                      x="2"
                      y="4"
                      width="24"
                      height="20"
                      rx="3"
                      stroke="#0d9488"
                      strokeWidth="1.4"
                      fill="none"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  {/* Label dinámico por tipo */}
                  <p className="text-sm font-semibold text-teal-600">
                    {cfg.labelFotoPortada}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    JPG, PNG — máx 5 MB
                  </p>
                </div>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImagen(e, "evento")}
              className="hidden"
            />
          </label>
        </section>

        {/* ── Sección 3: Info del evento ── */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-teal-100 space-y-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-teal-500">
            Información del evento
          </p>

          <Campo label="Nombre del evento *">
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={cfg.placeholderNombre}
              className={inputCls}
            />
          </Campo>

          <Campo label="Anfitriones / Organizadores *">
            <input
              type="text"
              value={anfitriones}
              onChange={(e) => setAnfitriones(e.target.value)}
              placeholder={cfg.placeholderAnfitriones}
              className={inputCls}
            />
          </Campo>

          <Campo label="Mensaje para los invitados">
            <textarea
              value={mensajeInvitacion}
              onChange={(e) => setMensajeInvitacion(e.target.value)}
              placeholder={cfg.placeholderMensaje}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </Campo>
        </section>

        {/* ── Sección 4: Fecha, hora y lugar ── */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-teal-100 space-y-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-teal-500">
            Fecha y lugar
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Fecha *">
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className={inputCls}
              />
            </Campo>
            <Campo label="Hora *">
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className={inputCls}
              />
            </Campo>
          </div>

          <Campo label="Nombre del lugar *">
            <input
              type="text"
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
              placeholder={cfg.placeholderLugar}
              className={inputCls}
            />
          </Campo>

          <Campo
            label="Link de Google Maps"
            hint="Abre Google Maps → busca el lugar → Compartir → Copiar enlace"
          >
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path
                    d="M7.5 1A5 5 0 002.5 6c0 3.5 5 8 5 8s5-4.5 5-8a5 5 0 00-5-5z"
                    stroke="#9ca3af"
                    strokeWidth="1.3"
                    fill="none"
                  />
                  <circle
                    cx="7.5"
                    cy="6"
                    r="1.7"
                    stroke="#9ca3af"
                    strokeWidth="1.3"
                    fill="none"
                  />
                </svg>
              </span>
              <input
                type="url"
                value={mapsUrl}
                onChange={(e) => setMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/..."
                className={`${inputCls} pl-9`}
              />
            </div>
          </Campo>

          {/* Foto del lugar — label dinámico */}
          <Campo label="Foto del lugar">
            <label className="cursor-pointer block">
              {previewLugar ? (
                <div className="relative w-full h-36 rounded-2xl overflow-hidden">
                  <Image
                    src={previewLugar}
                    alt="lugar"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      Cambiar foto
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-36 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2">
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <path
                      d="M3 20l5-5 3 3 4-5.5 6 7.5H3z"
                      stroke="#d1d5db"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    <rect
                      x="1"
                      y="3"
                      width="24"
                      height="20"
                      rx="3"
                      stroke="#d1d5db"
                      strokeWidth="1.4"
                      fill="none"
                    />
                  </svg>
                  {/* Label dinámico */}
                  <span className="text-xs text-gray-400 font-medium">
                    {cfg.labelFotoLugar}
                  </span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImagen(e, "lugar")}
                className="hidden"
              />
            </label>
          </Campo>
        </section>

        {/* ── Sección 5: Confirmación ── */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-teal-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-teal-500 mb-4">
            Confirmación de asistencia
          </p>
          <Campo
            label="Fecha límite para confirmar *"
            hint="Después de esta fecha los invitados no podrán confirmar su asistencia"
          >
            <input
              type="date"
              value={fechaLimite}
              onChange={(e) => setFechaLimite(e.target.value)}
              className={inputCls}
            />
          </Campo>
        </section>

        {/* ── Botón crear ── */}
        <button
          onClick={handleCrear}
          disabled={loading}
          className="w-full bg-teal-500 hover:bg-teal-600 active:scale-[0.98] text-white py-4 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-teal-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin"
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
              Creando evento...
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
              Crear evento
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-gray-400 pb-2">
          Podrás editar los detalles del evento después de crearlo
        </p>
      </div>
    </main>
  );
}
