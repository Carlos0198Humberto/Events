"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";

function AppLogo({ size = 36 }: { size?: number }) {
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
          id="evx-bg-inv"
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
          id="evx-glow-inv"
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
      <rect width="64" height="64" rx="18" fill="url(#evx-bg-inv)" />
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
        stroke="url(#evx-glow-inv)"
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

export default function AgregarInvitados() {
  const params = useParams();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [agregados, setAgregados] = useState<
    { nombre: string; token: string }[]
  >([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    document.title = "Eventix — Agregar invitados";
    setTimeout(() => setMounted(true), 50);
  }, []);

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
      })
      .select()
      .single();
    if (error) {
      setError("Error al agregar invitado. Intenta de nuevo.");
    } else {
      setAgregados((prev) => [
        ...prev,
        { nombre: nombre.trim(), token: data.token },
      ]);
      setNombre("");
      setTelefono("");
    }
    setLoading(false);
  }

  function copiarLink(token: string) {
    navigator.clipboard.writeText(
      `${window.location.origin}/confirmar/${token}`,
    );
    setCopiado(token);
    setTimeout(() => setCopiado(null), 2200);
  }

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
          -moz-osx-font-smoothing: grayscale;
        }

        body::before {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
          opacity: 0.5;
        }

        /* ── Glows ── */
        .glow { position: fixed; pointer-events: none; z-index: 0; border-radius: 50%; filter: blur(90px); }
        .glow-1 { width: 320px; height: 320px; top: -80px; right: -60px; background: radial-gradient(circle, rgba(13,148,136,0.16) 0%, transparent 70%); animation: glowDrift1 9s ease-in-out infinite; }
        .glow-2 { width: 260px; height: 260px; bottom: 80px; left: -80px; background: radial-gradient(circle, rgba(94,234,212,0.11) 0%, transparent 70%); animation: glowDrift2 11s ease-in-out infinite; }
        @keyframes glowDrift1 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(-18px,28px)} 66%{transform:translate(14px,-18px)} }
        @keyframes glowDrift2 { 0%,100%{transform:translate(0,0)} 40%{transform:translate(22px,-30px)} 70%{transform:translate(-8px,18px)} }

        /* ── Page ── */
        .page-wrap {
          min-height: 100vh;
          min-height: 100dvh;
          background: var(--bg);
          display: flex;
          flex-direction: column;
          position: relative;
          overflow-x: hidden;
        }

        /* ── Header ── */
        .top-bar {
          background: rgba(240,250,249,0.93);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--border);
          padding: 13px 18px;
          padding-top: calc(13px + env(safe-area-inset-top, 0px));
          display: flex;
          align-items: center;
          gap: 11px;
          position: sticky;
          top: 0;
          z-index: 10;
          box-shadow: var(--shadow-sm);
        }
        .top-bar-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; font-weight: 600;
          color: var(--text); letter-spacing: -0.5px; line-height: 1;
        }
        .top-bar-name span { color: var(--accent); }
        .top-bar-sub {
          font-size: 10.5px; font-weight: 500;
          letter-spacing: 1.8px; text-transform: uppercase;
          color: var(--text3); margin-top: 2px;
        }

        /* ── Scroll area ── */
        .scroll-area {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 22px 16px;
          padding-bottom: calc(96px + env(safe-area-inset-bottom, 16px));
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 480px;
          width: 100%;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        /* ── Cards ── */
        .card {
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: 22px;
          padding: 22px 20px;
          box-shadow: var(--shadow);
        }
        .card-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 21px; font-weight: 600;
          color: var(--text); margin-bottom: 3px; letter-spacing: -0.3px;
        }
        .card-sub {
          font-size: 12.5px; color: var(--text3);
          margin-bottom: 20px; font-weight: 500;
        }

        /* ── Error ── */
        .error-box {
          background: #fff1f2; border: 1px solid #fecdd3;
          color: #e11d48; font-size: 13px;
          padding: 10px 14px; border-radius: 12px;
          margin-bottom: 16px; font-weight: 500;
        }

        /* ── Fields ── */
        .fields { display: flex; flex-direction: column; gap: 15px; }
        .field-label {
          font-size: 11px; font-weight: 600; color: var(--accent);
          display: block; margin-bottom: 7px;
          letter-spacing: 0.6px; text-transform: uppercase;
        }
        .field-input {
          width: 100%; border: 2px solid var(--border-input);
          border-radius: 14px; padding: 13px 15px; font-size: 15px;
          background: var(--accent-soft); color: var(--text);
          outline: none;
          transition: border-color .22s, box-shadow .22s, background .22s;
          font-family: 'DM Sans', sans-serif;
          -webkit-appearance: none;
        }
        .field-input::placeholder { color: var(--text3); }
        .field-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(13,148,136,0.11);
          background: var(--surface);
        }

        /* ── Submit ── */
        .btn-submit {
          width: 100%; padding: 15px; border-radius: 14px; border: none;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
          color: #fff; font-size: 15px; font-weight: 600;
          font-family: 'DM Sans', sans-serif; letter-spacing: 0.3px;
          cursor: pointer; margin-top: 4px;
          box-shadow: var(--shadow-btn);
          transition: transform .2s ease, box-shadow .2s ease, opacity .2s;
          position: relative; overflow: hidden;
          -webkit-tap-highlight-color: transparent;
        }
        .btn-submit::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.14) 0%, transparent 55%);
          pointer-events: none; border-radius: inherit;
        }
        .btn-shimmer {
          position: absolute; inset: 0; border-radius: inherit;
          background: linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.22) 50%, transparent 62%);
          background-size: 200% 100%; animation: shimmer 3.5s ease-in-out infinite;
        }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .btn-submit:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 10px 34px rgba(13,148,136,0.50); }
        .btn-submit:not(:disabled):active { transform: scale(0.97); }
        .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        /* ── List ── */
        .list-header {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 600; color: var(--text2);
          margin-bottom: 14px;
        }
        .list-badge {
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          color: white; border-radius: 99px;
          font-size: 11px; font-weight: 700; padding: 2px 9px;
        }
        .inv-row {
          display: flex; align-items: center; gap: 11px;
          padding: 11px 13px;
          background: var(--surface2);
          border-radius: 14px; border: 1px solid var(--border);
          margin-bottom: 8px;
        }
        .inv-row:last-child { margin-bottom: 0; }
        .inv-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 700; font-size: 15px; flex-shrink: 0;
        }
        .inv-name {
          flex: 1; font-size: 14px; font-weight: 500; color: var(--text);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          min-width: 0;
        }
        .btn-copy {
          font-size: 12px; font-weight: 700;
          border-radius: 10px; padding: 6px 13px;
          cursor: pointer; transition: all .2s; flex-shrink: 0;
          font-family: 'DM Sans', sans-serif;
          -webkit-tap-highlight-color: transparent;
          white-space: nowrap;
        }
        .btn-copy-default { color: var(--accent); background: var(--surface); border: 1.5px solid var(--border-input); }
        .btn-copy-done    { color: #16a34a; background: #f0fdf4; border: 1.5px solid #86efac; }

        /* ── Floating bottom bar ── */
        .bottom-bar {
          position: fixed;
          bottom: 0; left: 0; right: 0; z-index: 20;
          padding: 12px 16px;
          padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
          background: rgba(240,250,249,0.94);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-top: 1px solid var(--border);
          box-shadow: 0 -4px 24px rgba(13,148,136,0.09);
        }
        .btn-back {
          display: flex; align-items: center; justify-content: center; gap: 7px;
          width: 100%; max-width: 480px; margin: 0 auto;
          padding: 14px;
          background: var(--surface);
          color: var(--text2);
          border: 1.5px solid var(--border);
          border-radius: 14px;
          font-size: 14px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          text-decoration: none;
          transition: var(--transition);
          box-shadow: var(--shadow-sm);
          -webkit-tap-highlight-color: transparent;
        }
        .btn-back:hover { background: var(--accent-soft2); color: var(--accent); border-color: var(--border-hover); }

        /* ── Mount animations ── */
        .anim-header { opacity: 0; transform: translateY(-10px); }
        .anim-card   { opacity: 0; transform: translateY(20px); }
        .anim-list   { opacity: 0; transform: translateY(14px); }
        .anim-bottom { opacity: 0; transform: translateY(20px); }
        .mounted .anim-header { animation: mountUp .5s cubic-bezier(.22,1,.36,1) .05s both; }
        .mounted .anim-card   { animation: mountUp .6s cubic-bezier(.22,1,.36,1) .15s both; }
        .mounted .anim-list   { animation: mountUp .5s cubic-bezier(.22,1,.36,1) .28s both; }
        .mounted .anim-bottom { animation: mountUp .45s cubic-bezier(.22,1,.36,1) .38s both; }
        @keyframes mountUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div className={`page-wrap${mounted ? " mounted" : ""}`}>
        <div className="glow glow-1" />
        <div className="glow glow-2" />

        {/* ── Header ── */}
        <div className="top-bar anim-header">
          <AppLogo size={34} />
          <div>
            <div className="top-bar-name">
              Event<span>ix</span>
            </div>
            <div className="top-bar-sub">Agregar invitados</div>
          </div>
        </div>

        {/* ── Scroll content ── */}
        <div className="scroll-area">
          {/* Form card */}
          <div className="card anim-card">
            <div className="card-title">Nuevo invitado</div>
            <div className="card-sub">Completa los datos para agregar</div>

            {error && <div className="error-box">{error}</div>}

            <div className="fields">
              <div>
                <label className="field-label">Nombre completo *</label>
                <input
                  className="field-input"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Juan Carlos Pérez"
                  onKeyDown={(e) => e.key === "Enter" && handleAgregar()}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="field-label">Teléfono WhatsApp</label>
                <input
                  className="field-input"
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej: +503 7777 8888"
                  autoComplete="tel"
                  inputMode="tel"
                />
              </div>

              <button
                className="btn-submit"
                onClick={handleAgregar}
                disabled={loading || !nombre.trim()}
                type="button"
              >
                <span className="btn-shimmer" />
                {loading ? "Agregando..." : "+ Agregar invitado"}
              </button>
            </div>
          </div>

          {/* Added list */}
          {agregados.length > 0 && (
            <div className="card anim-list">
              <div className="list-header">
                <span className="list-badge">{agregados.length}</span>
                Agregados en esta sesión
              </div>
              {agregados.map((inv, i) => (
                <div className="inv-row" key={i}>
                  <div className="inv-avatar">
                    {inv.nombre.charAt(0).toUpperCase()}
                  </div>
                  <span className="inv-name">{inv.nombre}</span>
                  <button
                    className={`btn-copy ${copiado === inv.token ? "btn-copy-done" : "btn-copy-default"}`}
                    onClick={() => copiarLink(inv.token)}
                    type="button"
                  >
                    {copiado === inv.token ? "✓ Copiado" : "Copiar link"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Floating bottom back button ── */}
        <div className="bottom-bar anim-bottom">
          <Link href="/dashboard" className="btn-back">
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
    </>
  );
}
