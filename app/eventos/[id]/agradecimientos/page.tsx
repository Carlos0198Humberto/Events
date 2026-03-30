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

// ─── Plantillas ───────────────────────────────────────────────
const PLANTILLAS: Record<string, string[]> = {
  boda: [
    "Gracias {nombre} por compartir con nosotros el día más especial de nuestras vidas. Tu presencia hizo este momento aún más mágico. Con amor, {anfitriones}",
    "{nombre}, gracias de corazón por acompañarnos en nuestra boda. Cada momento que compartimos queda grabado en nuestros corazones para siempre. — {anfitriones}",
    "{nombre}, tu presencia en nuestra boda fue un regalo invaluable. Gracias por celebrar con nosotros. — {anfitriones}",
  ],
  quinceañera: [
    "Gracias {nombre}, tu presencia hizo mi quinceañera aún más especial y llena de amor. Con cariño, {anfitriones}",
    "{nombre}, gracias por ser parte de mi fiesta de quince años. — {anfitriones}",
    "{nombre}, gracias por acompañarme a cumplir mis XV años. — {anfitriones}",
  ],
  cumpleaños: [
    "Gracias {nombre} por celebrar conmigo. Tu presencia fue el mejor regalo. — {anfitriones}",
    "{nombre}, gracias por venir a celebrar conmigo. — {anfitriones}",
    "{nombre}, gracias por compartir este día conmigo. — {anfitriones}",
  ],
  graduacion: [
    "Gracias {nombre} por acompañarme en este logro tan importante. — {anfitriones}",
    "{nombre}, gracias por celebrar conmigo este nuevo comienzo. — {anfitriones}",
    "{nombre}, gracias por estar presente en mi graduación. — {anfitriones}",
  ],
  otro: [
    "Gracias {nombre} por acompañarnos en este momento tan especial. — {anfitriones}",
    "{nombre}, gracias por estar con nosotros. — {anfitriones}",
  ],
};

// ─── Íconos ───────────────────────────────────────────────────
function IconBack({
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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
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

// ─── Logo ─────────────────────────────────────────────────────
function EventsLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient
          id="lgAgr"
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
      <rect width="40" height="40" rx="12" fill="url(#lgAgr)" />
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
        padding: 24,
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
          opacity: 0.2,
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
          opacity: 0.12,
        }}
      />

      {evento.imagen_url && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <img
            src={evento.imagen_url}
            alt=""
            style={{
              width: 64,
              height: 64,
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
          fontSize: 22,
          color: "#0f766e",
          textAlign: "center",
          marginBottom: 4,
          position: "relative",
          zIndex: 1,
        }}
      >
        Gracias
      </p>
      <p
        style={{
          fontWeight: 700,
          fontSize: 14,
          color: "#0f766e",
          opacity: 0.8,
          textAlign: "center",
          marginBottom: 16,
          position: "relative",
          zIndex: 1,
        }}
      >
        por: {evento.nombre}
      </p>

      <div
        style={{
          background: "rgba(255,255,255,0.80)",
          borderRadius: 14,
          padding: "14px 18px",
          marginBottom: 14,
          position: "relative",
          zIndex: 1,
        }}
      >
        <p
          style={{
            fontSize: 14,
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
            width: 36,
            height: 36,
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
          <p style={{ fontWeight: 700, color: "#0f766e", fontSize: 14 }}>
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
  const [enviandoTodos, setEnviandoTodos] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [invitadoPreview, setInvitadoPreview] = useState<Invitado | null>(null);

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

  const enviarWhatsApp = async (inv: Invitado, silencioso = false) => {
    if (!inv.telefono) {
      if (!silencioso) alert("Sin teléfono registrado");
      return;
    }
    const msg = generarMensaje(inv);
    const tel = inv.telefono.replace(/\D/g, "");
    if (!silencioso)
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

  const enviarTodos = async () => {
    const sinEnviar = invitados.filter(
      (i) => !enviados.has(i.id) && i.telefono,
    );
    if (!sinEnviar.length) return;
    setEnviandoTodos(true);
    setProgreso(0);
    for (let i = 0; i < sinEnviar.length; i++) {
      const inv = sinEnviar[i];
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
      setProgreso(Math.round(((i + 1) / sinEnviar.length) * 100));
      await new Promise((r) => setTimeout(r, 1200));
    }
    await supabase
      .from("eventos")
      .update({ agradecimiento_enviado: true })
      .eq("id", eventoId);
    setEnviandoTodos(false);
    setProgreso(100);
  };

  if (loading)
    return (
      <div
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

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(160deg,#f0fdfa 0%,#eff6ff 60%,#faf5ff 100%)",
        paddingBottom: 60,
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid #ccfbf1",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 10,
          boxShadow: "0 2px 12px rgba(13,148,136,0.07)",
        }}
      >
        <Link
          href="/dashboard"
          style={{
            color: "#0f766e",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 700,
            background: "#f0fdfa",
            border: "1px solid #ccfbf1",
            borderRadius: 10,
            padding: "7px 12px",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <IconBack size={16} color="#0f766e" /> Dashboard
        </Link>
        <EventsLogo size={30} />
        <div>
          <h1
            style={{
              fontWeight: 800,
              fontSize: 16,
              color: "#0f766e",
              lineHeight: 1,
            }}
          >
            Agradecimientos
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "#5eead4",
              marginTop: 2,
              fontWeight: 600,
            }}
          >
            {evento.nombre}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px" }}>
        {/* ── Stats ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 10,
            marginBottom: 24,
          }}
        >
          {[
            {
              num: invitados.length,
              label: "Confirmados",
              color: "#0f766e",
              bg: "#f0fdfa",
              border: "#ccfbf1",
            },
            {
              num: totalEnviados,
              label: "Enviados",
              color: "#1d4ed8",
              bg: "#eff6ff",
              border: "#bfdbfe",
            },
            {
              num: sinTelefono,
              label: "Sin teléfono",
              color: "#d97706",
              bg: "#fffbeb",
              border: "#fde68a",
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "white",
                borderRadius: 18,
                padding: "14px 10px",
                textAlign: "center",
                boxShadow: "0 2px 10px rgba(13,148,136,0.06)",
                border: `1px solid ${s.border}`,
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>
                {s.num}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: s.color,
                  fontWeight: 600,
                  marginTop: 2,
                  opacity: 0.8,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Barra de progreso ── */}
        {enviandoTodos && (
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: "16px 20px",
              marginBottom: 20,
              boxShadow: "0 4px 16px rgba(13,148,136,0.08)",
              border: "1px solid #ccfbf1",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 700, color: "#0D9488" }}>
                Enviando mensajes...
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#0D9488" }}>
                {progreso}%
              </p>
            </div>
            <div
              style={{
                background: "#ccfbf1",
                borderRadius: 99,
                height: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progreso}%`,
                  height: "100%",
                  borderRadius: 99,
                  background: "linear-gradient(90deg,#0D9488,#5eead4)",
                  transition: "width 0.5s ease",
                }}
              />
            </div>
            <p
              style={{
                fontSize: 11,
                color: "#0f766e",
                marginTop: 6,
                fontWeight: 500,
              }}
            >
              Se abrirá WhatsApp para cada invitado. No cierres esta ventana.
            </p>
          </div>
        )}

        {/* ── Preview tarjeta ── */}
        {invitadoPreview && (
          <div style={{ marginBottom: 20 }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#0f766e",
                marginBottom: 10,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Vista previa de la tarjeta
            </p>
            <TarjetaAgradecimiento
              invitado={invitadoPreview}
              evento={evento}
              mensaje={mensajePersonalizado}
            />
            {invitados.length > 1 && (
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  marginTop: 10,
                  overflowX: "auto",
                  paddingBottom: 4,
                }}
              >
                {invitados.slice(0, 5).map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => setInvitadoPreview(inv)}
                    style={{
                      flexShrink: 0,
                      padding: "5px 14px",
                      borderRadius: 99,
                      fontSize: 12,
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      background:
                        invitadoPreview?.id === inv.id
                          ? "linear-gradient(135deg,#0D9488,#0F766E)"
                          : "#f0fdfa",
                      color:
                        invitadoPreview?.id === inv.id ? "white" : "#0f766e",
                      boxShadow:
                        invitadoPreview?.id === inv.id
                          ? "0 2px 8px rgba(13,148,136,0.25)"
                          : "none",
                      transition: "all .15s",
                    }}
                  >
                    {inv.nombre.split(" ")[0]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Editor de mensaje ── */}
        <div
          style={{
            background: "white",
            borderRadius: 22,
            padding: 22,
            boxShadow: "0 4px 20px rgba(13,148,136,0.07)",
            marginBottom: 20,
            border: "1px solid #ccfbf1",
          }}
        >
          <h3
            style={{
              fontWeight: 700,
              color: "#0f766e",
              fontSize: 14,
              marginBottom: 14,
            }}
          >
            Personalizar mensaje
          </h3>

          {/* Selector plantillas */}
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 14,
              overflowX: "auto",
              paddingBottom: 4,
            }}
          >
            {plantillas.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setPlantillaIdx(i);
                  setMensajePersonalizado(plantillas[i]);
                }}
                style={{
                  flexShrink: 0,
                  padding: "6px 14px",
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: "none",
                  background:
                    plantillaIdx === i
                      ? "linear-gradient(135deg,#0D9488,#0F766E)"
                      : "#f0fdfa",
                  color: plantillaIdx === i ? "white" : "#0f766e",
                  boxShadow:
                    plantillaIdx === i
                      ? "0 2px 8px rgba(13,148,136,0.25)"
                      : "none",
                }}
              >
                Versión {i + 1}
              </button>
            ))}
          </div>

          <textarea
            value={mensajePersonalizado}
            onChange={(e) => setMensajePersonalizado(e.target.value)}
            rows={5}
            style={{
              width: "100%",
              border: "1.5px solid #ccfbf1",
              borderRadius: 14,
              padding: "12px 14px",
              fontSize: 13,
              resize: "none",
              outline: "none",
              fontFamily: "inherit",
              lineHeight: 1.7,
              boxSizing: "border-box",
              background: "#fafafa",
              transition: "border-color .2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#0D9488";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#ccfbf1";
            }}
          />

          <div
            style={{
              background: "#f0fdfa",
              border: "1px solid #ccfbf1",
              borderRadius: 12,
              padding: "10px 14px",
              marginTop: 10,
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "#0f766e",
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              Variables disponibles:
            </p>
            <p style={{ fontSize: 12, color: "#134e4a" }}>
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

        {/* ── Enviar todos ── */}
        {conTelefono > 0 && (
          <div
            style={{
              background: "white",
              borderRadius: 22,
              padding: "18px 22px",
              boxShadow: "0 4px 16px rgba(13,148,136,0.07)",
              marginBottom: 24,
              border: "1px solid #ccfbf1",
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, color: "#134e4a", fontSize: 15 }}>
                Enviar a todos por WhatsApp
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "#5eead4",
                  marginTop: 3,
                  fontWeight: 600,
                }}
              >
                {conTelefono} con teléfono · {totalEnviados} enviados
              </p>
            </div>
            <button
              onClick={enviarTodos}
              disabled={enviandoTodos || totalEnviados >= conTelefono}
              style={{
                background:
                  enviandoTodos || totalEnviados >= conTelefono
                    ? "#ccfbf1"
                    : "linear-gradient(135deg,#16a34a,#15803d)",
                color:
                  enviandoTodos || totalEnviados >= conTelefono
                    ? "#0f766e"
                    : "white",
                border: "none",
                borderRadius: 14,
                padding: "12px 22px",
                fontSize: 13,
                fontWeight: 700,
                cursor: enviandoTodos ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: enviandoTodos
                  ? "none"
                  : "0 4px 14px rgba(22,163,74,0.30)",
              }}
            >
              <IconWhatsApp
                size={16}
                color={
                  enviandoTodos || totalEnviados >= conTelefono
                    ? "#0f766e"
                    : "white"
                }
              />
              {enviandoTodos
                ? `Enviando (${progreso}%)`
                : totalEnviados >= conTelefono
                  ? "Todos enviados ✓"
                  : "Enviar a todos"}
            </button>
          </div>
        )}

        {/* ── Lista invitados ── */}
        <div>
          <p
            style={{
              fontWeight: 700,
              color: "#0f766e",
              fontSize: 14,
              marginBottom: 12,
            }}
          >
            Invitados confirmados ({invitados.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {invitados.map((inv) => (
              <div
                key={inv.id}
                style={{
                  background: enviados.has(inv.id) ? "#f0fdf4" : "white",
                  borderRadius: 16,
                  padding: "14px 18px",
                  border: enviados.has(inv.id)
                    ? "1.5px solid #86efac"
                    : "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  boxShadow: "0 2px 8px rgba(13,148,136,0.05)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onClick={() => setInvitadoPreview(inv)}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#0D9488,#0F766E)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 16,
                    color: "white",
                    flexShrink: 0,
                  }}
                >
                  {inv.nombre.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, color: "#111", fontSize: 14 }}>
                    {inv.nombre}
                  </p>
                  <p style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>
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
                  </p>
                </div>
                {enviados.has(inv.id) ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      color: "#16a34a",
                      fontWeight: 700,
                      fontSize: 12,
                      background: "#dcfce7",
                      borderRadius: 10,
                      padding: "6px 12px",
                    }}
                  >
                    <IconCheck size={14} color="#16a34a" /> Enviado
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      enviarWhatsApp(inv);
                    }}
                    disabled={!inv.telefono || enviando === inv.id}
                    style={{
                      background: inv.telefono
                        ? "linear-gradient(135deg,#16a34a,#15803d)"
                        : "#e2e8f0",
                      color: inv.telefono ? "white" : "#94a3b8",
                      border: "none",
                      borderRadius: 12,
                      padding: "8px 14px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: inv.telefono ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexShrink: 0,
                      boxShadow: inv.telefono
                        ? "0 2px 8px rgba(22,163,74,0.25)"
                        : "none",
                    }}
                  >
                    <IconWhatsApp
                      size={14}
                      color={inv.telefono ? "white" : "#94a3b8"}
                    />
                    {enviando === inv.id ? "..." : "Enviar"}
                  </button>
                )}
              </div>
            ))}

            {invitados.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: 64,
                  background: "white",
                  borderRadius: 20,
                  border: "1px solid #ccfbf1",
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "#f0fdfa",
                    border: "1px solid #ccfbf1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <svg
                    width={28}
                    height={28}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#5eead4"
                    strokeWidth="2"
                  >
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#0f766e" }}>
                  No hay invitados confirmados aún
                </p>
                <p style={{ fontSize: 13, marginTop: 4, color: "#5eead4" }}>
                  Los invitados deben confirmar primero
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Banner final todos enviados ── */}
        {totalEnviados > 0 &&
          totalEnviados >= conTelefono &&
          conTelefono > 0 && (
            <div
              style={{
                background: "linear-gradient(135deg,#f0fdfa,#ccfbf1)",
                border: "2px solid #5eead4",
                borderRadius: 20,
                padding: "20px 24px",
                textAlign: "center",
                marginTop: 24,
                boxShadow: "0 4px 20px rgba(13,148,136,0.12)",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#0D9488,#0F766E)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                  boxShadow: "0 4px 14px rgba(13,148,136,0.30)",
                }}
              >
                <IconCheck size={28} color="white" />
              </div>
              <p style={{ fontWeight: 800, color: "#0f766e", fontSize: 16 }}>
                Todos los agradecimientos enviados
              </p>
              <p
                style={{
                  color: "#5eead4",
                  fontSize: 13,
                  marginTop: 4,
                  fontWeight: 600,
                }}
              >
                Que Dios bendiga a todos los que compartieron este momento
                especial
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
