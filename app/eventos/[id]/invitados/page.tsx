"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";

function EventsLogo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient
          id="lgAg"
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
      <rect width="40" height="40" rx="12" fill="url(#lgAg)" />
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid #ccfbf1",
  borderRadius: 14,
  padding: "11px 14px",
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
  background: "#f0fdfa",
  color: "#134e4a",
  transition: "border-color .2s, box-shadow .2s",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#0f766e",
  display: "block",
  marginBottom: 6,
};

export default function AgregarInvitados() {
  const params = useParams();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [agregados, setAgregados] = useState<
    { nombre: string; token: string }[]
  >([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);

  async function handleAgregar() {
    setLoading(true);
    setError("");
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("invitados")
      .insert({
        evento_id: params.id,
        nombre: nombre.trim(),
        telefono: telefono.trim() || null,
        email: email.trim() || null,
      })
      .select()
      .single();
    if (error) {
      setError("Error al agregar invitado");
    } else {
      setAgregados((prev) => [
        ...prev,
        { nombre: nombre.trim(), token: data.token },
      ]);
      setNombre("");
      setTelefono("");
      setEmail("");
    }
    setLoading(false);
  }

  function copiarLink(token: string) {
    navigator.clipboard.writeText(
      `${window.location.origin}/confirmar/${token}`,
    );
    setCopiado(token);
    setTimeout(() => setCopiado(null), 2000);
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#0D9488";
    e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.10)";
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#ccfbf1";
    e.target.style.boxShadow = "none";
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        paddingBottom: 40,
        background:
          "linear-gradient(135deg,#f0fdfa 0%,#ccfbf1 60%,#99f6e4 100%)",
        fontFamily: "'Inter',sans-serif",
      }}
    >
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
        <Link
          href="/dashboard"
          style={{
            color: "#0f766e",
            background: "#f0fdfa",
            border: "1px solid #ccfbf1",
            borderRadius: 10,
            padding: "7px 12px",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0f766e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Dashboard
        </Link>
        <EventsLogo size={28} />
        <div>
          <p
            style={{
              fontWeight: 800,
              fontSize: 15,
              color: "#0f766e",
              lineHeight: 1,
            }}
          >
            Agregar invitados
          </p>
          <p
            style={{
              fontSize: 11,
              color: "#5eead4",
              marginTop: 2,
              fontWeight: 600,
              letterSpacing: "0.3px",
            }}
          >
            Events
          </p>
        </div>
      </div>

      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* ── Formulario ── */}
        <div
          style={{
            background: "white",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 4px 24px rgba(13,148,136,0.10)",
            border: "1px solid #ccfbf1",
          }}
        >
          <h2
            style={{
              fontWeight: 800,
              fontSize: 18,
              color: "#134e4a",
              marginBottom: 4,
            }}
          >
            Nuevo invitado
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "#5eead4",
              marginBottom: 20,
              fontWeight: 600,
            }}
          >
            Completa los datos para agregar
          </p>

          {error && (
            <div
              style={{
                background: "#fff1f2",
                border: "1px solid #fecdd3",
                color: "#e11d48",
                fontSize: 13,
                padding: "10px 14px",
                borderRadius: 12,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Nombre completo *</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Juan Carlos Pérez"
                onKeyDown={(e) => e.key === "Enter" && handleAgregar()}
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
            <div>
              <label style={labelStyle}>Teléfono WhatsApp</label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: +503 7777 8888"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
            <div>
              <label style={labelStyle}>Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
            <button
              onClick={handleAgregar}
              disabled={loading || !nombre.trim()}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 14,
                border: "none",
                background: nombre.trim()
                  ? "linear-gradient(135deg,#0D9488,#0F766E)"
                  : "#e2e8f0",
                color: nombre.trim() ? "white" : "#9ca3af",
                fontSize: 14,
                fontWeight: 700,
                cursor: nombre.trim() ? "pointer" : "not-allowed",
                boxShadow: nombre.trim()
                  ? "0 4px 16px rgba(13,148,136,0.30)"
                  : "none",
                transition: "all .2s",
              }}
            >
              {loading ? "Agregando..." : "+ Agregar invitado"}
            </button>
          </div>
        </div>

        {/* ── Lista agregados ── */}
        {agregados.length > 0 && (
          <div
            style={{
              background: "white",
              borderRadius: 24,
              padding: 20,
              border: "1px solid #ccfbf1",
              boxShadow: "0 4px 24px rgba(13,148,136,0.08)",
            }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#0f766e",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  background: "#0D9488",
                  color: "white",
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "2px 8px",
                }}
              >
                {agregados.length}
              </span>
              Agregados en esta sesión
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {agregados.map((inv, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    background: "#f0fdfa",
                    borderRadius: 14,
                    border: "1px solid #ccfbf1",
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: "#0D9488",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 800,
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {inv.nombre.charAt(0).toUpperCase()}
                  </div>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#134e4a",
                      flex: 1,
                    }}
                  >
                    {inv.nombre}
                  </span>
                  <button
                    onClick={() => copiarLink(inv.token)}
                    style={{
                      fontSize: 12,
                      color: copiado === inv.token ? "#16a34a" : "#0D9488",
                      fontWeight: 700,
                      background: copiado === inv.token ? "#f0fdf4" : "white",
                      border: `1px solid ${copiado === inv.token ? "#86efac" : "#ccfbf1"}`,
                      borderRadius: 8,
                      padding: "5px 12px",
                      cursor: "pointer",
                      transition: "all .2s",
                    }}
                  >
                    {copiado === inv.token ? "✓ Copiado" : "Copiar link"}
                  </button>
                </div>
              ))}
            </div>
            <Link
              href="/dashboard"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: 14,
                background: "linear-gradient(135deg,#0D9488,#0F766E)",
                color: "white",
                padding: "13px",
                borderRadius: 14,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 3px 12px rgba(13,148,136,0.25)",
              }}
            >
              Volver al Dashboard →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
