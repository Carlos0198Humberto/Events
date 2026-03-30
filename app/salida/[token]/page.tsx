"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Evento = {
  nombre: string;
  tipo: string;
  anfitriones: string | null;
  frase_evento: string | null;
};

type Invitado = {
  nombre: string;
};

const COLORES_CONFETI = [
  "#ec4899",
  "#a855f7",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#fb923c",
];

export default function SalidaInvitado() {
  const params = useParams();
  const token = params.token as string;

  const [evento, setEvento] = useState<Evento | null>(null);
  const [invitado, setInvitado] = useState<Invitado | null>(null);
  const [fase, setFase] = useState<"loading" | "explosion" | "mensaje">(
    "loading",
  );
  const [confeti, setConfeti] = useState<
    {
      id: number;
      x: number;
      color: string;
      size: number;
      delay: number;
      rot: number;
      shape: "circle" | "rect" | "diamond";
    }[]
  >([]);

  useEffect(() => {
    async function cargar() {
      const { data: inv } = await supabase
        .from("invitados")
        .select("nombre, evento_id")
        .eq("token", token)
        .single();
      if (!inv) {
        setFase("mensaje");
        return;
      }
      setInvitado({ nombre: inv.nombre });
      const { data: ev } = await supabase
        .from("eventos")
        .select("nombre,tipo,anfitriones,frase_evento")
        .eq("id", inv.evento_id)
        .single();
      if (ev) setEvento(ev);

      // Lanzar confeti
      const piezas = Array.from({ length: 70 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color:
          COLORES_CONFETI[Math.floor(Math.random() * COLORES_CONFETI.length)],
        size: 6 + Math.random() * 10,
        delay: Math.random() * 0.8,
        rot: Math.random() * 360,
        shape: (["circle", "rect", "diamond"] as const)[
          Math.floor(Math.random() * 3)
        ],
      }));
      setConfeti(piezas);
      setFase("explosion");
      setTimeout(() => setFase("mensaje"), 2200);
    }
    cargar();
  }, [token]);

  if (fase === "loading")
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#fdf4ff,#eff6ff)",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            border: "3px solid #a855f7",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin .7s linear infinite",
          }}
        />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </main>
    );

  return (
    <main
      style={{
        minHeight: "100vh",
        overflow: "hidden",
        position: "relative",
        background:
          "linear-gradient(160deg,#fdf4ff 0%,#eff6ff 50%,#fce7f3 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      {/* ── Confeti animado ── */}
      {confeti.map((p) => {
        const shapeStyle =
          p.shape === "circle"
            ? { borderRadius: "50%", width: p.size, height: p.size }
            : p.shape === "diamond"
              ? {
                  width: p.size,
                  height: p.size,
                  transform: `rotate(45deg)`,
                  borderRadius: 2,
                }
              : { width: p.size * 1.4, height: p.size * 0.6, borderRadius: 2 };

        return (
          <div
            key={p.id}
            style={{
              position: "fixed",
              left: `${p.x}%`,
              top: -20,
              background: p.color,
              ...shapeStyle,
              opacity: fase === "explosion" ? 1 : 0,
              animation:
                fase === "explosion"
                  ? `caer-${p.id % 5} ${1.2 + p.delay}s ease-in ${p.delay}s forwards`
                  : "none",
              zIndex: 50,
              pointerEvents: "none",
            }}
          />
        );
      })}

      {/* Anillos de explosión */}
      {fase === "explosion" && (
        <>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                width: n * 120,
                height: n * 120,
                borderRadius: "50%",
                border: `${4 - n}px solid ${COLORES_CONFETI[n * 2]}`,
                opacity: 0,
                animation: `ring ${0.6 + n * 0.2}s ease-out ${n * 0.1}s forwards`,
                zIndex: 40,
                pointerEvents: "none",
              }}
            />
          ))}
        </>
      )}

      {/* ── Tarjeta principal ── */}
      <div
        style={{
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(20px)",
          borderRadius: 28,
          padding: "40px 28px",
          textAlign: "center",
          maxWidth: 420,
          width: "100%",
          boxShadow: "0 24px 64px rgba(168,85,247,0.18)",
          border: "1.5px solid rgba(168,85,247,0.15)",
          position: "relative",
          zIndex: 60,
          animation: fase === "mensaje" ? "aparecer .5s ease forwards" : "none",
          opacity: fase === "mensaje" ? 1 : fase === "explosion" ? 0 : 0,
        }}
      >
        {/* Ícono animado */}
        <div
          style={{
            width: 80,
            height: 80,
            margin: "0 auto 20px",
            background: "linear-gradient(135deg,#ec4899,#a855f7)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            boxShadow: "0 8px 28px rgba(168,85,247,0.4)",
            animation: fase === "mensaje" ? "latir 1.5s ease infinite" : "none",
          }}
        >
          🎊
        </div>

        {/* Texto */}
        <h1
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: "#7c3aed",
            lineHeight: 1.2,
            letterSpacing: -0.5,
            marginBottom: 10,
          }}
        >
          ¡Gracias por compartir con nosotros!
        </h1>

        {invitado && (
          <p
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#ec4899",
              marginBottom: 6,
            }}
          >
            {invitado.nombre}
          </p>
        )}

        {evento?.anfitriones && (
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>
            {evento.anfitriones} te agradece tu presencia
          </p>
        )}

        {/* Línea decorativa */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "16px 0",
          }}
        >
          <div
            style={{
              flex: 1,
              height: 1,
              background: "linear-gradient(90deg,transparent,#d8b4fe)",
            }}
          />
          <span style={{ fontSize: 18 }}>🙏</span>
          <div
            style={{
              flex: 1,
              height: 1,
              background: "linear-gradient(90deg,#d8b4fe,transparent)",
            }}
          />
        </div>

        {evento && (
          <div
            style={{
              background: "linear-gradient(135deg,#fdf4ff,#eff6ff)",
              borderRadius: 18,
              padding: "16px 20px",
              marginBottom: 20,
              border: "1px solid #e9d5ff",
            }}
          >
            <p
              style={{
                fontSize: 13,
                color: "#7c3aed",
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              {evento.nombre}
            </p>
            {evento.frase_evento && (
              <p
                style={{
                  fontSize: 12,
                  color: "#9333ea",
                  fontStyle: "italic",
                  opacity: 0.85,
                }}
              >
                "{evento.frase_evento}"
              </p>
            )}
            <p
              style={{
                fontSize: 12,
                color: "#a855f7",
                marginTop: 8,
                lineHeight: 1.6,
              }}
            >
              Que Dios guarde en tu corazón cada momento que compartimos juntos.
              Fue un honor tenerte presente en este día tan especial.
            </p>
          </div>
        )}

        {/* Estrellas decorativas */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            marginBottom: 20,
          }}
        >
          {["#f43f5e", "#f59e0b", "#a855f7", "#3b82f6", "#10b981"].map(
            (c, i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: c,
                  animation: `parpadear ${1 + i * 0.3}s ease infinite`,
                }}
              />
            ),
          )}
        </div>

        <p style={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic" }}>
          Puedes cerrar esta ventana
        </p>
      </div>

      <style>{`
        @keyframes ring { from{opacity:.8;transform:translate(-50%,-50%) scale(.3)} to{opacity:0;transform:translate(-50%,-50%) scale(1.8)} }
        @keyframes aparecer { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes latir { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes parpadear { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }
        @keyframes caer-0 { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(${Math.random() * 720}deg);opacity:0} }
        @keyframes caer-1 { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(-${Math.random() * 720}deg);opacity:0} }
        @keyframes caer-2 { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(${Math.random() * 540}deg);opacity:0} }
        @keyframes caer-3 { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(-${Math.random() * 540}deg);opacity:0} }
        @keyframes caer-4 { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(${Math.random() * 360}deg);opacity:0} }
      `}</style>
    </main>
  );
}
