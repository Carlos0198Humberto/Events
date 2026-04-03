"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── New Eventix Logo ────────────────────────────────────────────────────────
function AppLogo({ size = 44 }: { size?: number }) {
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
          id="evx-bg-login"
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
          id="evx-glow-login"
          x1="12"
          y1="20"
          x2="52"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#5EEAD4" />
          <stop offset="100%" stopColor="#2DD4BF" />
        </linearGradient>
        <filter
          id="evx-shadow-login"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="3"
            floodColor="rgba(13,148,136,0.4)"
          />
        </filter>
      </defs>
      <rect
        width="64"
        height="64"
        rx="18"
        fill="url(#evx-bg-login)"
        filter="url(#evx-shadow-login)"
      />
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
        stroke="url(#evx-glow-login)"
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

function Particles() {
  return (
    <div className="particles" aria-hidden="true">
      {[...Array(10)].map((_, i) => (
        <div key={i} className={`particle particle-${i + 1}`} />
      ))}
    </div>
  );
}

const translations = {
  es: {
    title: "Bienvenido de vuelta",
    sub: "Inicia sesión para gestionar tus eventos",
    emailLabel: "Correo electrónico",
    emailPlaceholder: "tu@correo.com",
    passLabel: "Contraseña",
    passPlaceholder: "••••••••",
    cta: "Iniciar sesión",
    ctaLoading: "Ingresando...",
    noAccount: "¿No tienes cuenta?",
    register: "Regístrate gratis",
    back: "Volver al inicio",
    errorMsg: "Correo o contraseña incorrectos",
    tagline: "Invitaciones · Fotos · Recuerdos",
  },
  en: {
    title: "Welcome back",
    sub: "Sign in to manage your events",
    emailLabel: "Email address",
    emailPlaceholder: "you@email.com",
    passLabel: "Password",
    passPlaceholder: "••••••••",
    cta: "Sign in",
    ctaLoading: "Signing in...",
    noAccount: "Don't have an account?",
    register: "Sign up free",
    back: "Back to home",
    errorMsg: "Incorrect email or password",
    tagline: "Invitations · Photos · Memories",
  },
};

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<"es" | "en">("es");
  const [showPass, setShowPass] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    document.title = "Eventix — Iniciar sesión";
    setTimeout(() => setMounted(true), 50);
  }, []);

  async function handleLogin() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(t.errorMsg);
    else router.push("/dashboard");
    setLoading(false);
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

        .page-wrap {
          min-height: 100vh;
          min-height: 100dvh;
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 20px;
          padding-bottom: max(24px, env(safe-area-inset-bottom));
          position: relative;
          overflow: hidden;
        }

        /* ── Glows ── */
        .glow { position: fixed; pointer-events: none; z-index: 0; border-radius: 50%; filter: blur(90px); }
        .glow-1 { width: 320px; height: 320px; top: -80px; right: -60px; background: radial-gradient(circle, rgba(13,148,136,0.16) 0%, transparent 70%); animation: glowDrift1 9s ease-in-out infinite; }
        .glow-2 { width: 260px; height: 260px; bottom: 80px; left: -80px; background: radial-gradient(circle, rgba(94,234,212,0.11) 0%, transparent 70%); animation: glowDrift2 11s ease-in-out infinite; }
        .glow-3 { width: 200px; height: 200px; bottom: -40px; right: 10px; background: radial-gradient(circle, rgba(13,148,136,0.08) 0%, transparent 70%); animation: glowDrift1 13s ease-in-out infinite reverse; }
        @keyframes glowDrift1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-18px,28px) scale(1.07)} 66%{transform:translate(14px,-18px) scale(0.95)} }
        @keyframes glowDrift2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(22px,-30px) scale(1.09)} 70%{transform:translate(-8px,18px) scale(0.93)} }

        /* ── Particles ── */
        .particles { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
        .particle { position: absolute; border-radius: 50%; background: var(--accent-light); opacity: 0; animation: particleFloat linear infinite; }
        .particle-1{width:4px;height:4px;left:10%;animation-duration:13s;animation-delay:0s}
        .particle-2{width:3px;height:3px;left:27%;animation-duration:16s;animation-delay:2.2s}
        .particle-3{width:5px;height:5px;left:44%;animation-duration:11s;animation-delay:.6s}
        .particle-4{width:2px;height:2px;left:61%;animation-duration:14s;animation-delay:3.1s}
        .particle-5{width:4px;height:4px;left:76%;animation-duration:12s;animation-delay:1.1s}
        .particle-6{width:3px;height:3px;left:89%;animation-duration:17s;animation-delay:4s}
        .particle-7{width:5px;height:5px;left:19%;animation-duration:10s;animation-delay:1.7s}
        .particle-8{width:2px;height:2px;left:37%;animation-duration:9s;animation-delay:2.7s}
        .particle-9{width:4px;height:4px;left:54%;animation-duration:15s;animation-delay:.9s}
        .particle-10{width:3px;height:3px;left:71%;animation-duration:11s;animation-delay:3.8s}
        @keyframes particleFloat { 0%{transform:translateY(105vh);opacity:0} 5%{opacity:.15} 90%{opacity:.15} 100%{transform:translateY(-8vh) translateX(25px);opacity:0} }

        /* ── Controls ── */
        .controls { position: fixed; top: 16px; right: 16px; z-index: 20; display: flex; gap: 8px; align-items: center; }
        .ctrl-btn { height: 36px; border-radius: 100px; background: var(--surface); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition); box-shadow: var(--shadow-sm); color: var(--text2); font-size: 11px; font-weight: 600; letter-spacing: .5px; text-transform: uppercase; padding: 0 14px; font-family: 'DM Sans', sans-serif; }
        .ctrl-btn:hover { background: var(--accent-soft2); color: var(--accent); border-color: var(--border-hover); }

        /* ── Card wrapper ── */
        .card-wrap { width: 100%; max-width: 380px; position: relative; z-index: 1; }

        /* ── Logo area ── */
        .logo-area { display: flex; flex-direction: column; align-items: center; gap: 14px; margin-bottom: 28px; }
        .logo-container { position: relative; display: flex; align-items: center; justify-content: center; width: 86px; height: 86px; }
        .logo-ring { position: absolute; border-radius: 50%; border: 1.5px solid rgba(13,148,136,0.18); animation: ringExpand 3s ease-out infinite; width: 72px; height: 72px; }
        .logo-ring-2 { animation-delay: 1s; }
        .logo-ring-3 { animation-delay: 2s; }
        @keyframes ringExpand { 0%{transform:scale(0.82);opacity:0.7} 100%{transform:scale(2.0);opacity:0} }
        .logo-pulse { position: relative; z-index: 2; animation: logoPulse 3.5s ease-in-out infinite; filter: drop-shadow(0 4px 20px rgba(13,148,136,0.30)); }
        @keyframes logoPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04);filter:drop-shadow(0 6px 28px rgba(13,148,136,0.46))} }
        .logo-name { font-family: 'Cormorant Garamond', serif; font-size: 34px; font-weight: 600; letter-spacing: -1.2px; color: var(--text); line-height: 1; text-align: center; }
        .logo-name span { color: var(--accent); }
        .logo-tag { font-size: 10px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: var(--text3); margin-top: 3px; text-align: center; }

        /* ── Card ── */
        .card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 24px; padding: 28px 26px; box-shadow: var(--shadow); }
        .card-title { font-family: 'Cormorant Garamond', serif; font-size: 23px; font-weight: 600; color: var(--text); margin-bottom: 4px; letter-spacing: -0.3px; }
        .card-sub { font-size: 13px; color: var(--text3); margin-bottom: 22px; line-height: 1.5; }

        /* ── Error ── */
        .error-box { background: #fff1f2; border: 1px solid #fecdd3; color: #e11d48; font-size: 13px; padding: 10px 14px; border-radius: 12px; margin-bottom: 16px; }

        /* ── Fields ── */
        .fields { display: flex; flex-direction: column; gap: 16px; }
        .field-label { font-size: 11.5px; font-weight: 600; color: var(--accent); display: block; margin-bottom: 7px; letter-spacing: 0.3px; text-transform: uppercase; }
        .field-input-wrap { position: relative; }
        .field-input {
          width: 100%; border: 2px solid var(--border-input); border-radius: 14px;
          padding: 12px 14px; font-size: 14px;
          background: var(--accent-soft); color: var(--text);
          outline: none; transition: border-color .22s, box-shadow .22s, background .22s;
          font-family: 'DM Sans', sans-serif;
          -webkit-appearance: none;
        }
        .field-input::placeholder { color: var(--text3); }
        .field-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(13,148,136,0.11); background: var(--surface); }

        .pass-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text3); padding: 4px; display: flex; align-items: center; transition: color .2s; -webkit-tap-highlight-color: transparent; }
        .pass-toggle:hover { color: var(--accent); }

        /* ── Submit button ── */
        .btn-submit {
          width: 100%; padding: 14px; border-radius: 14px; border: none;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
          color: #fff; font-size: 15px; font-weight: 600;
          font-family: 'DM Sans', sans-serif; letter-spacing: 0.3px;
          cursor: pointer; margin-top: 4px;
          box-shadow: var(--shadow-btn);
          transition: transform .2s ease, box-shadow .2s ease, opacity .2s;
          position: relative; overflow: hidden;
          -webkit-tap-highlight-color: transparent;
        }
        .btn-submit::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.16) 0%, transparent 55%); pointer-events: none; border-radius: inherit; }
        .btn-shimmer { position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.22) 50%, transparent 62%); background-size: 200% 100%; animation: shimmer 3.5s ease-in-out infinite; }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .btn-submit:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 10px 34px rgba(13,148,136,0.50); }
        .btn-submit:not(:disabled):active { transform: scale(0.97); }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Footer links ── */
        .footer-link { text-align: center; font-size: 13px; color: var(--text2); margin-top: 18px; }
        .footer-link a { color: var(--accent); font-weight: 600; text-decoration: none; }
        .footer-link a:hover { text-decoration: underline; }
        .back-link { display: flex; align-items: center; gap: 5px; justify-content: center; font-size: 12px; color: var(--text3); margin-top: 10px; text-decoration: none; transition: color .2s; -webkit-tap-highlight-color: transparent; }
        .back-link:hover { color: var(--accent); }
        .copy { text-align: center; margin-top: 24px; font-size: 10px; font-weight: 600; letter-spacing: 1.8px; text-transform: uppercase; color: var(--text3); opacity: 0.65; }

        /* ── Mount animations ── */
        .anim-logo { opacity: 0; transform: translateY(28px) scale(0.92); }
        .anim-card { opacity: 0; transform: translateY(20px); }
        .anim-foot { opacity: 0; }
        .mounted .anim-logo { animation: mountUp 0.7s cubic-bezier(.22,1,.36,1) 0.1s both; }
        .mounted .anim-card { animation: mountUp 0.6s cubic-bezier(.22,1,.36,1) 0.26s both; }
        .mounted .anim-foot { animation: mountUp 0.5s cubic-bezier(.22,1,.36,1) 0.42s both; }
        @keyframes mountUp { from{opacity:0;transform:translateY(24px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }

        @media (max-height: 680px) {
          .logo-area { margin-bottom: 18px; gap: 10px; }
          .logo-container { width: 70px; height: 70px; }
          .logo-name { font-size: 28px; }
          .card { padding: 22px 20px; }
          .card-sub { margin-bottom: 16px; }
        }
      `}</style>

      <div className={`page-wrap${mounted ? " mounted" : ""}`}>
        <div className="glow glow-1" />
        <div className="glow glow-2" />
        <div className="glow glow-3" />
        <Particles />

        {/* Language toggle */}
        <div className="controls">
          <button
            className="ctrl-btn"
            onClick={() => setLang(lang === "es" ? "en" : "es")}
            title={lang === "es" ? "Switch to English" : "Cambiar a Español"}
          >
            {lang === "es" ? "EN" : "ES"}
          </button>
        </div>

        <div className="card-wrap">
          {/* Logo */}
          <div className="logo-area anim-logo">
            <div className="logo-container">
              <div className="logo-ring" />
              <div className="logo-ring logo-ring-2" />
              <div className="logo-ring logo-ring-3" />
              <div className="logo-pulse">
                <AppLogo size={62} />
              </div>
            </div>
            <div>
              <div className="logo-name">
                Event<span>ix</span>
              </div>
              <div className="logo-tag">{t.tagline}</div>
            </div>
          </div>

          {/* Form card */}
          <div className="card anim-card">
            <div className="card-title">{t.title}</div>
            <div className="card-sub">{t.sub}</div>

            {error && <div className="error-box">{error}</div>}

            <div className="fields">
              <div>
                <label className="field-label">{t.emailLabel}</label>
                <input
                  className="field-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  autoComplete="email"
                  inputMode="email"
                />
              </div>
              <div>
                <label className="field-label">{t.passLabel}</label>
                <div className="field-input-wrap">
                  <input
                    className="field-input"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passPlaceholder}
                    style={{ paddingRight: "42px" }}
                    autoComplete="current-password"
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                  <button
                    className="pass-toggle"
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
                    type="button"
                  >
                    {showPass ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"
                          stroke="currentColor"
                          strokeWidth="1.3"
                        />
                        <circle
                          cx="8"
                          cy="8"
                          r="2"
                          stroke="currentColor"
                          strokeWidth="1.3"
                        />
                        <path
                          d="M2 2l12 12"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"
                          stroke="currentColor"
                          strokeWidth="1.3"
                        />
                        <circle
                          cx="8"
                          cy="8"
                          r="2"
                          stroke="currentColor"
                          strokeWidth="1.3"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                className="btn-submit"
                onClick={handleLogin}
                disabled={loading}
                type="button"
              >
                <span className="btn-shimmer" />
                {loading ? t.ctaLoading : t.cta}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="anim-foot">
            <p className="footer-link">
              {t.noAccount} <Link href="/auth/registro">{t.register}</Link>
            </p>
            <Link href="/" className="back-link">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M8 2L4 6l4 4"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {t.back}
            </Link>
            <p className="copy">Humb3rsec 2026</p>
          </div>
        </div>
      </div>
    </>
  );
}
