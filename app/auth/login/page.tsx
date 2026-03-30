"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

function EventsLogo({ size = 48 }: { size?: number }) {
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
          id="logoGradLogin"
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
      <rect width="40" height="40" rx="12" fill="url(#logoGradLogin)" />
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

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError("Correo o contraseña incorrectos");
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background:
          "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 60%, #99f6e4 100%)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Manchas decorativas */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: "-100px",
          right: "-80px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(13,148,136,0.10) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "fixed",
          bottom: "-80px",
          left: "-60px",
          width: "260px",
          height: "260px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(15,118,110,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div className="w-full" style={{ maxWidth: "360px" }}>
        {/* Logo + nombre */}
        <div
          className="flex flex-col items-center mb-8"
          style={{ gap: "10px" }}
        >
          <EventsLogo size={52} />
          <div className="flex flex-col items-center" style={{ gap: "2px" }}>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "26px",
                fontWeight: 700,
                color: "#134e4a",
                letterSpacing: "-0.5px",
                lineHeight: 1,
              }}
            >
              Event<span style={{ color: "#0D9488" }}>s</span>
            </span>
            <span
              style={{
                fontSize: "11px",
                letterSpacing: "1.4px",
                textTransform: "uppercase",
                color: "#5eead4",
                fontWeight: 600,
              }}
            >
              Tu evento, tu historia
            </span>
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "24px",
            padding: "28px 26px",
            boxShadow:
              "0 4px 32px rgba(13,148,136,0.10), 0 1px 4px rgba(13,148,136,0.06)",
            border: "1px solid #ccfbf1",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#134e4a",
              marginBottom: "4px",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Bienvenido de vuelta
          </h2>
          <p
            style={{
              fontSize: "13px",
              color: "#5f9ea0",
              marginBottom: "22px",
              lineHeight: 1.5,
            }}
          >
            Inicia sesión para gestionar tus eventos
          </p>

          {error && (
            <div
              style={{
                background: "#fff1f2",
                border: "1px solid #fecdd3",
                color: "#e11d48",
                fontSize: "13px",
                padding: "10px 14px",
                borderRadius: "12px",
                marginBottom: "18px",
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#0f766e",
                  display: "block",
                  marginBottom: "6px",
                  letterSpacing: "0.2px",
                }}
              >
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                style={{
                  width: "100%",
                  border: "2px solid #ccfbf1",
                  borderRadius: "14px",
                  padding: "11px 14px",
                  fontSize: "14px",
                  background: "#f0fdfa",
                  color: "#134e4a",
                  outline: "none",
                  transition: "border-color .2s, box-shadow .2s",
                  fontFamily: "'Inter', sans-serif",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#0D9488";
                  e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.10)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#ccfbf1";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#0f766e",
                  display: "block",
                  marginBottom: "6px",
                  letterSpacing: "0.2px",
                }}
              >
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                style={{
                  width: "100%",
                  border: "2px solid #ccfbf1",
                  borderRadius: "14px",
                  padding: "11px 14px",
                  fontSize: "14px",
                  background: "#f0fdfa",
                  color: "#134e4a",
                  outline: "none",
                  transition: "border-color .2s, box-shadow .2s",
                  fontFamily: "'Inter', sans-serif",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#0D9488";
                  e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.10)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#ccfbf1";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "14px",
                border: "none",
                background: loading
                  ? "#99f6e4"
                  : "linear-gradient(135deg, #0D9488 0%, #0f766e 100%)",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Inter', sans-serif",
                letterSpacing: "0.3px",
                transition: "opacity .2s, transform .15s",
                marginTop: "4px",
                boxShadow: loading
                  ? "none"
                  : "0 4px 16px rgba(13,148,136,0.30)",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.opacity = "0.88";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </div>
        </div>

        {/* Enlace registro */}
        <p
          style={{
            textAlign: "center",
            fontSize: "13px",
            color: "#0f766e",
            marginTop: "18px",
          }}
        >
          ¿No tienes cuenta?{" "}
          <Link
            href="/auth/registro"
            style={{
              color: "#0D9488",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Regístrate gratis
          </Link>
        </p>
      </div>
    </main>
  );
}
