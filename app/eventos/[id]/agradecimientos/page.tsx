"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";

// ─── Tipos ────────────────────────────────────────────────────
type Invitado = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  num_personas: number;
  estado: string;
};
type Evento = {
  id: string;
  nombre: string;
  tipo: string;
  anfitriones: string | null;
  fecha: string;
  imagen_url: string | null;
  agradecimiento_enviado: boolean;
};

// ─── Plantillas ampliadas ─────────────────────────────────────
const PLANTILLAS: Record<string, string[]> = {
  boda: [
    "Gracias {nombre} por compartir con nosotros el día más especial de nuestras vidas. Tu presencia hizo este momento aún más mágico. Con todo nuestro amor, {anfitriones} 💍",
    "{nombre}, gracias de corazón por acompañarnos en nuestra boda. Cada momento que compartimos queda grabado en nuestros corazones para siempre. — {anfitriones} 🤍",
    "{nombre}, tu presencia en nuestra boda fue un regalo invaluable. Gracias por celebrar con nosotros este nuevo comienzo. — {anfitriones} 🌸",
    "Querido/a {nombre}, tu compañía en nuestra boda llenó de alegría cada instante. Gracias por ser parte de nuestra historia. Con cariño, {anfitriones} 💐",
    "{nombre}, gracias por recorrer el camino hasta llegar a celebrar con nosotros. Tu presencia fue la mejor bendición. — {anfitriones} ✨",
    "Hoy, al recordar nuestra boda, tu sonrisa es uno de los recuerdos más hermosos, {nombre}. Gracias por estar ahí. — {anfitriones} 💛",
  ],
  quinceañera: [
    "Gracias {nombre}, tu presencia hizo mi quinceañera aún más especial y llena de amor. Con cariño, {anfitriones} 🌸",
    "{nombre}, gracias por ser parte de mi fiesta de quince años y hacer este día tan mágico. — {anfitriones} 👑",
    "{nombre}, gracias por acompañarme a cumplir mis XV años. Tu apoyo significa mucho para mí. — {anfitriones} 💗",
    "Que bonito fue compartir este momento tan importante contigo, {nombre}. Gracias por tu amor y tu presencia. — {anfitriones} 🎀",
    "{nombre}, cada recuerdo de esa noche es más lindo gracias a ti. Infinitas gracias. — {anfitriones} 🌟",
    "Mis quince años serán siempre recordados como un sueño, y tú {nombre} fuiste parte de ese sueño. Gracias. — {anfitriones} 🎉",
  ],
  cumpleaños: [
    "Gracias {nombre} por celebrar conmigo. Tu presencia fue el mejor regalo que pude recibir. — {anfitriones} 🎂",
    "{nombre}, gracias por venir a celebrar conmigo y hacer este día tan especial. — {anfitriones} 🎉",
    "{nombre}, gracias por compartir este día conmigo. Cada momento a tu lado fue un regalo. — {anfitriones} 🎁",
    "Qué bonito es cumplir años rodeado de personas como tú, {nombre}. Gracias por estar. — {anfitriones} ✨",
    "{nombre}, tu presencia hizo que este cumpleaños fuera inolvidable. Gracias de corazón. — {anfitriones} 💛",
    "Gracias por los buenos deseos y por estar presente, {nombre}. Me llevo el mejor recuerdo. — {anfitriones} 🥳",
  ],
  graduacion: [
    "Gracias {nombre} por acompañarme en este logro tan importante de mi vida. — {anfitriones} 🎓",
    "{nombre}, gracias por celebrar conmigo este nuevo comienzo. Tu apoyo siempre ha sido invaluable. — {anfitriones} 🌟",
    "{nombre}, gracias por estar presente en mi graduación. Este logro también es tuyo. — {anfitriones} 🎉",
    "Alcanzar esta meta fue más dulce sabiendo que estabas ahí, {nombre}. Gracias. — {anfitriones} 🙌",
    "{nombre}, tu presencia en mi graduación fue la mejor motivación para seguir adelante. Gracias. — {anfitriones} 💪",
    "Gracias, {nombre}, por celebrar este capítulo que cierra y el nuevo que comienza. — {anfitriones} 📖",
  ],
  otro: [
    "Gracias {nombre} por acompañarnos en este momento tan especial. — {anfitriones} 🌟",
    "{nombre}, gracias por estar con nosotros. Tu presencia hizo todo más especial. — {anfitriones} 💛",
    "Qué lindo fue compartir este momento contigo, {nombre}. Gracias de corazón. — {anfitriones} ✨",
    "{nombre}, gracias por sumarte a esta celebración. Nos alegró mucho tenerte. — {anfitriones} 🎉",
    "Tu presencia, {nombre}, fue el detalle más bonito de toda la celebración. Gracias. — {anfitriones} 💐",
  ],
};

// ─── Logo ─────────────────────────────────────────────────────
function AppLogo({ size = 34 }: { size?: number }) {
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
          id="evx-bg-agr"
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
          id="evx-glow-agr"
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
      <rect width="64" height="64" rx="18" fill="url(#evx-bg-agr)" />
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
        stroke="url(#evx-glow-agr)"
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
      <circle cx="47" cy="13" r="1.5" fill="#5EEAD4" opacity="0.5" />
      <circle cx="47" cy="51" r="2" fill="#5EEAD4" opacity="0.8" />
      <circle cx="17" cy="51" r="1.5" fill="#5EEAD4" opacity="0.5" />
    </svg>
  );
}

// ─── Íconos ───────────────────────────────────────────────────
function IconWhatsApp({
  size = 16,
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
function IconCheck({
  size = 16,
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

// ─── Tarjeta preview ──────────────────────────────────────────
function TarjetaAgradecimiento({
  invitado,
  evento,
  mensaje,
}: {
  invitado: Invitado;
  evento: Evento;
  mensaje: string;
}) {
  const msg = mensaje
    .replace(/{nombre}/g, invitado.nombre)
    .replace(/{anfitriones}/g, evento.anfitriones || "Nosotros");
  const fecha = new Date(evento.fecha).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <div
      style={{
        background: "linear-gradient(135deg,#f0fdfa,#ccfbf1)",
        borderRadius: 20,
        padding: 22,
        border: "2px solid #5eead4",
        boxShadow: "0 8px 32px rgba(13,148,136,0.12)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: "#5eead4",
          opacity: 0.18,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -30,
          left: -10,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "#0D9488",
          opacity: 0.1,
        }}
      />
      {evento.imagen_url && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <img
            src={evento.imagen_url}
            alt=""
            style={{
              width: 58,
              height: 58,
              borderRadius: "50%",
              objectFit: "cover",
              border: "3px solid white",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            }}
          />
        </div>
      )}
      <p
        style={{
          fontWeight: 900,
          fontSize: 20,
          color: "#0f766e",
          textAlign: "center",
          marginBottom: 3,
          position: "relative",
          zIndex: 1,
        }}
      >
        Gracias
      </p>
      <p
        style={{
          fontWeight: 700,
          fontSize: 13,
          color: "#0f766e",
          opacity: 0.8,
          textAlign: "center",
          marginBottom: 14,
          position: "relative",
          zIndex: 1,
        }}
      >
        por: {evento.nombre}
      </p>
      <div
        style={{
          background: "rgba(255,255,255,0.82)",
          borderRadius: 14,
          padding: "13px 16px",
          marginBottom: 12,
          position: "relative",
          zIndex: 1,
        }}
      >
        <p
          style={{
            fontSize: 13.5,
            color: "#374151",
            lineHeight: 1.7,
            fontStyle: "italic",
          }}
        >
          "{msg}"
        </p>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#0D9488,#0F766E)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          {invitado.nombre.charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={{ fontWeight: 700, color: "#0f766e", fontSize: 13 }}>
            {invitado.nombre}
          </p>
          <p style={{ fontSize: 11, color: "#0f766e", opacity: 0.7 }}>
            {fecha}
          </p>
        </div>
        {invitado.num_personas > 1 && (
          <span
            style={{
              marginLeft: "auto",
              background: "#f0fdfa",
              borderRadius: 99,
              padding: "3px 10px",
              fontSize: 11,
              fontWeight: 700,
              color: "#0f766e",
              border: "1px solid #5eead4",
            }}
          >
            +{invitado.num_personas - 1} más
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────
export default function AgradecimientosPage() {
  const params = useParams();
  const eventoId = params.id as string;

  const [evento, setEvento] = useState<Evento | null>(null);
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [plantillaIdx, setPlantillaIdx] = useState(0);
  const [mensajePersonalizado, setMensajePersonalizado] = useState("");
  const [enviando, setEnviando] = useState<string | null>(null);
  const [enviados, setEnviados] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [invitadoPreview, setInvitadoPreview] = useState<Invitado | null>(null);
  const [mounted, setMounted] = useState(false);

  // Cola para "enviar a todos" uno por uno
  const [cola, setCola] = useState<Invitado[]>([]);
  const [colaIdx, setColaIdx] = useState(0);
  const [colaActiva, setColaActiva] = useState(false);
  const [esperandoConfirmacion, setEsperandoConfirmacion] = useState(false);

  useEffect(() => {
    document.title = "Eventix — Agradecimientos";
    setTimeout(() => setMounted(true), 50);
  }, []);

  useEffect(() => {
    async function cargar() {
      const [ev, inv] = await Promise.all([
        supabase.from("eventos").select("*").eq("id", eventoId).single(),
        supabase
          .from("invitados")
          .select("id,nombre,telefono,email,num_personas,estado")
          .eq("evento_id", eventoId)
          .eq("estado", "confirmado"),
      ]);
      if (ev.data) {
        setEvento(ev.data);
        const plantilla = PLANTILLAS[ev.data.tipo]?.[0] || PLANTILLAS.otro[0];
        setMensajePersonalizado(plantilla);
      }
      if (inv.data) {
        setInvitados(inv.data);
        if (inv.data.length > 0) setInvitadoPreview(inv.data[0]);
      }
      setLoading(false);
    }
    cargar();
  }, [eventoId]);

  const generarMensaje = (inv: Invitado) =>
    mensajePersonalizado
      .replace(/{nombre}/g, inv.nombre)
      .replace(/{anfitriones}/g, evento?.anfitriones || "Nosotros");

  // Envío individual
  const enviarWhatsApp = async (inv: Invitado) => {
    if (!inv.telefono) {
      alert("Sin teléfono registrado");
      return;
    }
    const msg = generarMensaje(inv);
    const tel = inv.telefono.replace(/\D/g, "");
    window.open(
      `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
    setEnviando(inv.id);
    await supabase
      .from("agradecimientos")
      .insert({
        evento_id: eventoId,
        invitado_id: inv.id,
        mensaje: msg,
        canal: "whatsapp",
      });
    setEnviados((prev) => new Set([...prev, inv.id]));
    setEnviando(null);
  };

  // ── ENVIAR A TODOS: abre uno a la vez y espera confirmación ──
  const iniciarEnvioTodos = () => {
    const sinEnviar = invitados.filter(
      (i) => !enviados.has(i.id) && i.telefono,
    );
    if (!sinEnviar.length) return;
    setCola(sinEnviar);
    setColaIdx(0);
    setColaActiva(true);
    setEsperandoConfirmacion(false);
    abrirSiguiente(sinEnviar, 0);
  };

  const abrirSiguiente = async (lista: Invitado[], idx: number) => {
    if (idx >= lista.length) {
      setColaActiva(false);
      setEsperandoConfirmacion(false);
      await supabase
        .from("eventos")
        .update({ agradecimiento_enviado: true })
        .eq("id", eventoId);
      return;
    }
    const inv = lista[idx];
    const msg = generarMensaje(inv);
    const tel = inv.telefono!.replace(/\D/g, "");
    window.open(
      `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
    await supabase
      .from("agradecimientos")
      .insert({
        evento_id: eventoId,
        invitado_id: inv.id,
        mensaje: msg,
        canal: "whatsapp",
      });
    setEnviados((prev) => new Set([...prev, inv.id]));
    setColaIdx(idx);
    setEsperandoConfirmacion(true);
  };

  const confirmarSiguiente = () => {
    const nextIdx = colaIdx + 1;
    setColaIdx(nextIdx);
    setEsperandoConfirmacion(false);
    abrirSiguiente(cola, nextIdx);
  };

  const cancelarCola = () => {
    setColaActiva(false);
    setEsperandoConfirmacion(false);
    setCola([]);
  };

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg, #F0FAF9)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <AppLogo size={44} />
          <div
            style={{
              width: 36,
              height: 36,
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
        <p>Evento no encontrado</p>
      </div>
    );

  const tipo = evento.tipo || "otro";
  const plantillas = PLANTILLAS[tipo] || PLANTILLAS.otro;
  const sinTelefono = invitados.filter((i) => !i.telefono).length;
  const conTelefono = invitados.filter((i) => i.telefono).length;
  const totalEnviados = enviados.size;
  const pendientes = invitados.filter(
    (i) => !enviados.has(i.id) && i.telefono,
  ).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:           #F0FAF9;
          --surface:      #FFFFFF;
          --surface2:     #F7FDFB;
          --border:       rgba(13,148,136,0.14);
          --border-hover: rgba(13,148,136,0.40);
          --border-input: rgba(13,148,136,0.22);
          --accent:       #0D9488;
          --accent2:      #0F766E;
          --accent-light: #5EEAD4;
          --accent-soft:  rgba(13,148,136,0.06);
          --accent-soft2: rgba(13,148,136,0.13);
          --text:         #0C1A19;
          --text2:        #2D6E68;
          --text3:        #7ABFBA;
          --shadow:       0 4px 28px rgba(13,148,136,0.13);
          --shadow-sm:    0 2px 10px rgba(13,148,136,0.09);
          --shadow-btn:   0 6px 28px rgba(13,148,136,0.38);
          --transition:   all 0.36s cubic-bezier(.4,0,.2,1);
        }

        html, body {
          font-family: 'DM Sans', sans-serif;
          background: var(--bg);
          color: var(--text);
          -webkit-font-smoothing: antialiased;
        }

        body::before {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
          opacity: 0.5;
        }

        .glow { position: fixed; pointer-events: none; z-index: 0; border-radius: 50%; filter: blur(90px); }
        .glow-1 { width: 320px; height: 320px; top: -80px; right: -60px; background: radial-gradient(circle, rgba(13,148,136,0.16) 0%, transparent 70%); animation: glowDrift1 9s ease-in-out infinite; }
        .glow-2 { width: 260px; height: 260px; bottom: 80px; left: -80px; background: radial-gradient(circle, rgba(94,234,212,0.11) 0%, transparent 70%); animation: glowDrift2 11s ease-in-out infinite; }
        @keyframes glowDrift1 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(-18px,28px)} 66%{transform:translate(14px,-18px)} }
        @keyframes glowDrift2 { 0%,100%{transform:translate(0,0)} 40%{transform:translate(22px,-30px)} 70%{transform:translate(-8px,18px)} }

        .page-wrap {
          min-height: 100vh; min-height: 100dvh;
          display: flex; flex-direction: column;
          position: relative; overflow-x: hidden;
        }

        /* ── Header ── */
        .top-bar {
          background: rgba(240,250,249,0.93);
          backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--border);
          padding: 13px 18px;
          padding-top: calc(13px + env(safe-area-inset-top, 0px));
          display: flex; align-items: center; gap: 11px;
          position: sticky; top: 0; z-index: 10;
          box-shadow: var(--shadow-sm);
        }
        .top-bar-name { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: var(--text); letter-spacing: -0.5px; line-height: 1; }
        .top-bar-name span { color: var(--accent); }
        .top-bar-sub { font-size: 10.5px; font-weight: 500; letter-spacing: 1.8px; text-transform: uppercase; color: var(--text3); margin-top: 2px; }
        .top-bar-evento { font-size: 11px; color: var(--accent); font-weight: 600; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }

        /* ── Scroll ── */
        .scroll-area {
          flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
          padding: 20px 16px;
          padding-bottom: calc(96px + env(safe-area-inset-bottom, 16px));
          display: flex; flex-direction: column; gap: 16px;
          max-width: 700px; width: 100%; margin: 0 auto;
          position: relative; z-index: 1;
        }

        /* ── Cards ── */
        .card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 22px; padding: 20px 18px; box-shadow: var(--shadow); }
        .card-title { font-family: 'Cormorant Garamond', serif; font-size: 19px; font-weight: 600; color: var(--text); margin-bottom: 3px; letter-spacing: -0.2px; }
        .card-sub { font-size: 12px; color: var(--text3); font-weight: 500; }

        /* ── Stats ── */
        .stats-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
        .stat-box { background: var(--surface); border-radius: 18px; padding: 14px 8px; text-align: center; box-shadow: var(--shadow-sm); border: 1px solid var(--border); }
        .stat-num { font-size: 24px; font-weight: 800; }
        .stat-label { font-size: 10.5px; font-weight: 600; margin-top: 2px; opacity: 0.8; }

        /* ── Plantilla selector ── */
        .chip-scroll { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .chip-scroll::-webkit-scrollbar { display: none; }
        .chip { flex-shrink: 0; padding: 6px 16px; border-radius: 99px; font-size: 12px; font-weight: 700; cursor: pointer; border: none; font-family: 'DM Sans', sans-serif; transition: all .15s; -webkit-tap-highlight-color: transparent; }
        .chip-active { background: linear-gradient(135deg, var(--accent), var(--accent2)); color: white; box-shadow: 0 2px 10px rgba(13,148,136,0.28); }
        .chip-inactive { background: var(--accent-soft); color: var(--accent2); }

        /* ── Textarea ── */
        .msg-textarea {
          width: 100%; border: 2px solid var(--border-input); border-radius: 14px;
          padding: 12px 14px; font-size: 13.5px; resize: none; outline: none;
          font-family: 'DM Sans', sans-serif; line-height: 1.7;
          background: var(--accent-soft); color: var(--text);
          transition: border-color .2s, background .2s; -webkit-appearance: none;
        }
        .msg-textarea:focus { border-color: var(--accent); background: var(--surface); box-shadow: 0 0 0 3px rgba(13,148,136,0.10); }

        /* ── Botón principal ── */
        .btn-primary {
          width: 100%; padding: 15px; border-radius: 14px; border: none;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          color: white; font-size: 15px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; box-shadow: var(--shadow-btn);
          transition: transform .2s, box-shadow .2s, opacity .2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          position: relative; overflow: hidden;
          -webkit-tap-highlight-color: transparent;
        }
        .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
        .btn-primary:not(:disabled):active { transform: scale(0.97); }
        .btn-shimmer { position: absolute; inset: 0; background: linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.22) 50%, transparent 62%); background-size: 200% 100%; animation: shimmer 3.5s ease-in-out infinite; border-radius: inherit; }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }

        .btn-secondary {
          flex: 1; padding: 13px; border-radius: 14px;
          background: var(--surface); color: var(--text2);
          border: 1.5px solid var(--border); font-size: 14px; font-weight: 600;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          transition: var(--transition); box-shadow: var(--shadow-sm);
          -webkit-tap-highlight-color: transparent;
        }
        .btn-secondary:hover { background: var(--accent-soft2); color: var(--accent); border-color: var(--border-hover); }

        /* ── Panel cola activa ── */
        .cola-panel {
          background: linear-gradient(135deg, var(--accent-soft), rgba(94,234,212,0.12));
          border: 2px solid var(--accent-light);
          border-radius: 20px; padding: 20px 18px;
          box-shadow: 0 4px 24px rgba(13,148,136,0.14);
        }
        .cola-progress-bar { background: rgba(13,148,136,0.15); border-radius: 99px; height: 8px; overflow: hidden; margin: 10px 0; }
        .cola-progress-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, var(--accent), var(--accent-light)); transition: width .5s ease; }

        /* ── Fila invitado ── */
        .inv-row {
          background: var(--surface); border-radius: 16px;
          padding: 13px 14px; border: 1px solid var(--border);
          display: flex; align-items: center; gap: 11px;
          box-shadow: 0 2px 8px rgba(13,148,136,0.05);
          transition: all .2s; cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .inv-row-sent { background: #f0fdf4; border-color: #86efac; }
        .inv-row:active { transform: scale(0.985); }
        .inv-avatar {
          width: 40px; height: 40px; border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 800; font-size: 15px; flex-shrink: 0;
        }
        .inv-name { font-weight: 700; color: var(--text); font-size: 14px; }
        .inv-phone { font-size: 12px; color: var(--text3); margin-top: 1px; }
        .badge-sent { display: flex; align-items: center; gap: 5px; color: #16a34a; font-weight: 700; font-size: 12px; background: #dcfce7; border-radius: 10px; padding: 6px 11px; flex-shrink: 0; }
        .btn-send-single {
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: white; border: none; border-radius: 11px;
          padding: 8px 13px; font-size: 12px; font-weight: 700;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          display: flex; align-items: center; gap: 5px; flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(22,163,74,0.28);
          -webkit-tap-highlight-color: transparent;
        }
        .btn-no-phone { background: #e2e8f0; color: #94a3b8; border: none; border-radius: 11px; padding: 8px 13px; font-size: 12px; font-weight: 700; cursor: not-allowed; flex-shrink: 0; }

        /* ── Bottom bar ── */
        .bottom-bar {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 20;
          padding: 12px 16px;
          padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
          background: rgba(240,250,249,0.94);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border-top: 1px solid var(--border);
          box-shadow: 0 -4px 24px rgba(13,148,136,0.09);
        }
        .bottom-inner { display: flex; gap: 10px; max-width: 700px; margin: 0 auto; }

        /* ── Empty state ── */
        .empty-state { text-align: center; padding: 52px 20px; background: var(--surface); border-radius: 20px; border: 1px solid var(--border); }

        /* ── Banner final ── */
        .banner-done { background: linear-gradient(135deg,#f0fdfa,#ccfbf1); border: 2px solid var(--accent-light); border-radius: 20px; padding: 22px; text-align: center; box-shadow: 0 4px 20px rgba(13,148,136,0.12); }

        /* ── Mounts ── */
        .anim-in { opacity: 0; transform: translateY(16px); }
        .mounted .anim-in { animation: fadeUp .6s cubic-bezier(.22,1,.36,1) both; }
        .mounted .anim-in:nth-child(1) { animation-delay: .05s; }
        .mounted .anim-in:nth-child(2) { animation-delay: .12s; }
        .mounted .anim-in:nth-child(3) { animation-delay: .19s; }
        .mounted .anim-in:nth-child(4) { animation-delay: .26s; }
        .mounted .anim-in:nth-child(5) { animation-delay: .33s; }
        .mounted .anim-in:nth-child(6) { animation-delay: .40s; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      <div className={`page-wrap${mounted ? " mounted" : ""}`}>
        <div className="glow glow-1" />
        <div className="glow glow-2" />

        {/* ── Header ── */}
        <div className="top-bar">
          <AppLogo size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="top-bar-name">
              Event<span>ix</span>
            </div>
            <div className="top-bar-sub">Agradecimientos</div>
            <div className="top-bar-evento">{evento.nombre}</div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="scroll-area">
          {/* Stats */}
          <div className="stats-grid anim-in">
            {[
              { num: invitados.length, label: "Confirmados", color: "#0f766e" },
              { num: totalEnviados, label: "Enviados", color: "#1d4ed8" },
              { num: sinTelefono, label: "Sin teléfono", color: "#d97706" },
            ].map((s) => (
              <div className="stat-box" key={s.label}>
                <div className="stat-num" style={{ color: s.color }}>
                  {s.num}
                </div>
                <div className="stat-label" style={{ color: s.color }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Preview */}
          {invitadoPreview && (
            <div className="anim-in">
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--accent)",
                  marginBottom: 10,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
                Vista previa
              </p>
              <TarjetaAgradecimiento
                invitado={invitadoPreview}
                evento={evento}
                mensaje={mensajePersonalizado}
              />
              {invitados.length > 1 && (
                <div className="chip-scroll" style={{ marginTop: 10 }}>
                  {invitados.slice(0, 6).map((inv) => (
                    <button
                      key={inv.id}
                      onClick={() => setInvitadoPreview(inv)}
                      className={`chip ${invitadoPreview?.id === inv.id ? "chip-active" : "chip-inactive"}`}
                    >
                      {inv.nombre.split(" ")[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Editor mensaje */}
          <div className="card anim-in">
            <div className="card-title">Personalizar mensaje</div>
            <div className="card-sub" style={{ marginBottom: 14 }}>
              Usa las variables para personalizar cada envío
            </div>
            <div className="chip-scroll" style={{ marginBottom: 14 }}>
              {plantillas.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPlantillaIdx(i);
                    setMensajePersonalizado(plantillas[i]);
                  }}
                  className={`chip ${plantillaIdx === i ? "chip-active" : "chip-inactive"}`}
                >
                  Versión {i + 1}
                </button>
              ))}
            </div>
            <textarea
              className="msg-textarea"
              value={mensajePersonalizado}
              onChange={(e) => setMensajePersonalizado(e.target.value)}
              rows={5}
            />
            <div
              style={{
                background: "var(--accent-soft)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "10px 14px",
                marginTop: 12,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: "var(--accent2)",
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                Variables disponibles:
              </p>
              <p style={{ fontSize: 12, color: "var(--text)" }}>
                <code
                  style={{
                    background: "#ccfbf1",
                    borderRadius: 6,
                    padding: "1px 6px",
                  }}
                >
                  {"{nombre}"}
                </code>{" "}
                → nombre del invitado &nbsp;
                <code
                  style={{
                    background: "#ccfbf1",
                    borderRadius: 6,
                    padding: "1px 6px",
                  }}
                >
                  {"{anfitriones}"}
                </code>{" "}
                → anfitrión(es)
              </p>
            </div>
          </div>

          {/* Panel cola activa */}
          {colaActiva && esperandoConfirmacion && (
            <div className="cola-panel anim-in">
              <p
                style={{
                  fontWeight: 800,
                  color: "var(--accent2)",
                  fontSize: 15,
                }}
              >
                Enviando a todos — {colaIdx + 1} / {cola.length}
              </p>
              <div className="cola-progress-bar">
                <div
                  className="cola-progress-fill"
                  style={{ width: `${((colaIdx + 1) / cola.length) * 100}%` }}
                />
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text2)",
                  marginBottom: 14,
                  fontWeight: 500,
                }}
              >
                Se abrió WhatsApp para <strong>{cola[colaIdx]?.nombre}</strong>.
                Cuando termines de enviar, presiona <strong>Siguiente</strong>.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={confirmarSiguiente}
                  className="btn-primary"
                  style={{ flex: 2 }}
                >
                  <span className="btn-shimmer" />
                  {colaIdx + 1 < cola.length
                    ? `Siguiente → ${cola[colaIdx + 1]?.nombre.split(" ")[0]}`
                    : "Finalizar ✓"}
                </button>
                <button
                  onClick={cancelarCola}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Pausar
                </button>
              </div>
            </div>
          )}

          {/* Enviar a todos */}
          {conTelefono > 0 && !colaActiva && (
            <div
              className="card anim-in"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontWeight: 700,
                    color: "var(--text)",
                    fontSize: 15,
                  }}
                >
                  Enviar a todos por WhatsApp
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text3)",
                    marginTop: 3,
                    fontWeight: 600,
                  }}
                >
                  {conTelefono} con teléfono · {totalEnviados} enviados ·{" "}
                  {pendientes} pendientes
                </p>
              </div>
              <button
                onClick={iniciarEnvioTodos}
                disabled={pendientes === 0}
                className="btn-primary"
                style={{ width: "auto", padding: "12px 20px" }}
              >
                <span className="btn-shimmer" />
                <IconWhatsApp size={15} color="white" />
                {pendientes === 0
                  ? "Todos enviados ✓"
                  : `Enviar (${pendientes})`}
              </button>
            </div>
          )}

          {/* Lista invitados */}
          <div className="anim-in">
            <p
              style={{
                fontWeight: 700,
                color: "var(--accent2)",
                fontSize: 13,
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Invitados confirmados ({invitados.length})
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {invitados.map((inv) => (
                <div
                  key={inv.id}
                  className={`inv-row ${enviados.has(inv.id) ? "inv-row-sent" : ""}`}
                  onClick={() => setInvitadoPreview(inv)}
                >
                  <div className="inv-avatar">
                    {inv.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="inv-name">{inv.nombre}</div>
                    <div className="inv-phone">
                      {inv.telefono ? (
                        inv.telefono
                      ) : (
                        <span style={{ color: "#f59e0b", fontWeight: 600 }}>
                          Sin teléfono
                        </span>
                      )}
                      {inv.num_personas > 1 && (
                        <span style={{ marginLeft: 8 }}>
                          · {inv.num_personas} personas
                        </span>
                      )}
                    </div>
                  </div>
                  {enviados.has(inv.id) ? (
                    <div className="badge-sent">
                      <IconCheck size={13} color="#16a34a" /> Enviado
                    </div>
                  ) : inv.telefono ? (
                    <button
                      className="btn-send-single"
                      onClick={(e) => {
                        e.stopPropagation();
                        enviarWhatsApp(inv);
                      }}
                      disabled={enviando === inv.id}
                    >
                      <IconWhatsApp size={13} color="white" />
                      {enviando === inv.id ? "..." : "Enviar"}
                    </button>
                  ) : (
                    <span className="btn-no-phone">Sin tel.</span>
                  )}
                </div>
              ))}

              {invitados.length === 0 && (
                <div className="empty-state">
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: "var(--accent-soft)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 14px",
                    }}
                  >
                    <svg
                      width={26}
                      height={26}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--accent-light)"
                      strokeWidth="2"
                    >
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87" />
                      <path d="M16 3.13a4 4 0 010 7.75" />
                    </svg>
                  </div>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--accent2)",
                    }}
                  >
                    No hay invitados confirmados aún
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      marginTop: 4,
                      color: "var(--text3)",
                    }}
                  >
                    Los invitados deben confirmar primero
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Banner todos enviados */}
          {totalEnviados > 0 &&
            totalEnviados >= conTelefono &&
            conTelefono > 0 && (
              <div className="banner-done anim-in">
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg,var(--accent),var(--accent2))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                    boxShadow: "0 4px 14px rgba(13,148,136,0.30)",
                  }}
                >
                  <IconCheck size={26} color="white" />
                </div>
                <p
                  style={{
                    fontWeight: 800,
                    color: "var(--accent2)",
                    fontSize: 15,
                  }}
                >
                  Todos los agradecimientos enviados
                </p>
                <p
                  style={{
                    color: "var(--text3)",
                    fontSize: 13,
                    marginTop: 4,
                    fontWeight: 500,
                  }}
                >
                  Que Dios bendiga a todos los que compartieron este momento
                  especial 🙏
                </p>
              </div>
            )}
        </div>

        {/* ── Bottom bar: volver al dashboard ── */}
        <div className="bottom-bar">
          <div className="bottom-inner">
            <Link
              href="/dashboard"
              className="btn-secondary"
              style={{ flex: 1 }}
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
              Volver al Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
