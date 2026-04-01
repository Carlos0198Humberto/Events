"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Logo ─────────────────────────────────────────────────────────────────────
function AppLogo({ size = 44 }: { size?: number }) {
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
          id="lg-login"
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
          id="lg2-login"
          x1="10"
          y1="28"
          x2="46"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#3AADA0" />
          <stop offset="100%" stopColor="#2DC4A8" />
        </linearGradient>
        <filter id="lg3-login" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <rect width="56" height="56" rx="16" fill="url(#lg-login)" />
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
        stroke="url(#lg2-login)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="11" r="1.6" fill="#3AADA0" opacity="0.9" />
      <circle cx="20" cy="9" r="1.1" fill="#2DC4A8" opacity="0.7" />
      <circle cx="11" cy="15" r="0.9" fill="#3AADA0" opacity="0.5" />
      <circle cx="42" cy="11" r="1.6" fill="#3AADA0" opacity="0.9" />
      <circle cx="36" cy="9" r="1.1" fill="#2DC4A8" opacity="0.7" />
      <circle cx="45" cy="15" r="0.9" fill="#3AADA0" opacity="0.5" />
      <path
        d="M28 7 L29 10.2 L32.4 10.2 L29.8 12.2 L30.8 15.4 L28 13.4 L25.2 15.4 L26.2 12.2 L23.6 10.2 L27 10.2 Z"
        fill="#3AADA0"
        opacity="0.95"
        filter="url(#lg3-login)"
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

function Particles() {
  return (
    <div className="particles" aria-hidden="true">
      {[...Array(12)].map((_, i) => (
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
    darkMode: "Modo oscuro",
    lightMode: "Modo claro",
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
    darkMode: "Dark mode",
    lightMode: "Light mode",
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
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState<"es" | "en">("es");
  const [showPass, setShowPass] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
    setTimeout(() => setDark(true), 1800); // claro → oscuro al entrar
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
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:#F0FAF8; --surface:#FFFFFF;
          --border:rgba(58,173,160,0.15); --border-input:#cceee9;
          --accent:#1FA896; --accent2:#3AADA0;
          --accent-soft:rgba(58,173,160,0.09); --accent-soft2:rgba(58,173,160,0.16);
          --text:#0A1E1C; --text2:#3D6E6A; --text3:#85B5B0;
          --shadow:0 4px 32px rgba(58,173,160,0.16);
          --shadow-sm:0 2px 12px rgba(58,173,160,0.11);
          --transition:all 0.38s cubic-bezier(.4,0,.2,1);
        }
        .dark {
          --bg:#0C1A19; --surface:#162422;
          --border:rgba(58,173,160,0.15); --border-input:rgba(58,173,160,0.22);
          --accent:#3AADA0; --accent2:#2DC4A8;
          --accent-soft:rgba(58,173,160,0.12); --accent-soft2:rgba(58,173,160,0.20);
          --text:#E8F8F5; --text2:#7ABFBA; --text3:#3D7070;
          --shadow:0 4px 32px rgba(0,0,0,0.48); --shadow-sm:0 2px 12px rgba(0,0,0,0.32);
        }
        body { font-family:'DM Sans',sans-serif; }

        .page-wrap { min-height:100vh; background:var(--bg); display:flex; align-items:center; justify-content:center; padding:24px; position:relative; overflow:hidden; transition:background 0.6s ease; }
        .page-wrap::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E"); opacity:0.4; }

        /* Controls */
        .controls { position:fixed; top:18px; right:18px; z-index:20; display:flex; gap:8px; align-items:center; }
        .ctrl-btn { width:36px; height:36px; border-radius:50%; background:var(--surface); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:var(--transition); box-shadow:var(--shadow-sm); color:var(--text2); font-size:14px; font-weight:600; }
        .ctrl-btn:hover { background:var(--accent-soft2); color:var(--accent); border-color:var(--accent); }
        .ctrl-lang { width:auto; padding:0 12px; border-radius:20px; font-size:11px; font-weight:600; letter-spacing:.5px; text-transform:uppercase; }

        /* Glows */
        .glow { position:fixed; pointer-events:none; z-index:0; border-radius:50%; filter:blur(80px); transition:var(--transition); }
        .glow-1 { width:340px; height:340px; top:-100px; right:-80px; background:radial-gradient(circle,rgba(58,173,160,0.18) 0%,transparent 70%); animation:glowDrift1 8s ease-in-out infinite; }
        .glow-2 { width:280px; height:280px; bottom:60px; left:-100px; background:radial-gradient(circle,rgba(45,196,168,0.12) 0%,transparent 70%); animation:glowDrift2 10s ease-in-out infinite; }
        .dark .glow-1 { background:radial-gradient(circle,rgba(58,173,160,0.22) 0%,transparent 70%); }
        .dark .glow-2 { background:radial-gradient(circle,rgba(45,196,168,0.15) 0%,transparent 70%); }
        @keyframes glowDrift1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-20px,30px) scale(1.08)} 66%{transform:translate(15px,-20px) scale(0.95)} }
        @keyframes glowDrift2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(25px,-35px) scale(1.1)} 70%{transform:translate(-10px,20px) scale(0.92)} }

        /* Particles */
        .particles { position:fixed; inset:0; pointer-events:none; z-index:0; overflow:hidden; }
        .particle { position:absolute; border-radius:50%; background:var(--accent2); opacity:0; animation:particleFloat linear infinite; }
        .particle-1{width:4px;height:4px;left:12%;animation-duration:12s;animation-delay:0s}
        .particle-2{width:3px;height:3px;left:28%;animation-duration:15s;animation-delay:2s}
        .particle-3{width:5px;height:5px;left:45%;animation-duration:10s;animation-delay:.5s}
        .particle-4{width:2px;height:2px;left:60%;animation-duration:14s;animation-delay:3s}
        .particle-5{width:4px;height:4px;left:75%;animation-duration:11s;animation-delay:1s}
        .particle-6{width:3px;height:3px;left:88%;animation-duration:16s;animation-delay:4s}
        .particle-7{width:5px;height:5px;left:20%;animation-duration:13s;animation-delay:1.5s}
        .particle-8{width:2px;height:2px;left:38%;animation-duration:9s;animation-delay:2.5s}
        .particle-9{width:4px;height:4px;left:55%;animation-duration:17s;animation-delay:.8s}
        .particle-10{width:3px;height:3px;left:70%;animation-duration:12s;animation-delay:3.5s}
        .particle-11{width:5px;height:5px;left:5%;animation-duration:14s;animation-delay:1.2s}
        .particle-12{width:2px;height:2px;left:92%;animation-duration:10s;animation-delay:2.2s}
        @keyframes particleFloat { 0%{transform:translateY(110vh);opacity:0} 5%{opacity:0.18} 90%{opacity:0.18} 100%{transform:translateY(-10vh) translateX(30px);opacity:0} }

        .card-wrap { width:100%; max-width:360px; position:relative; z-index:1; }

        /* Logo */
        .logo-area { display:flex; flex-direction:column; align-items:center; gap:12px; margin-bottom:28px; }
        .logo-container { position:relative; display:flex; align-items:center; justify-content:center; width:80px; height:80px; }
        .logo-ring { position:absolute; border-radius:50%; border:1.5px solid rgba(58,173,160,0.22); animation:ringExpand 2.8s ease-out infinite; width:68px; height:68px; }
        .logo-ring-2 { animation-delay:0.9s; }
        .logo-ring-3 { animation-delay:1.8s; }
        @keyframes ringExpand { 0%{transform:scale(0.85);opacity:0.7} 100%{transform:scale(1.9);opacity:0} }
        .logo-pulse { position:relative; z-index:2; animation:logoPulse 3.5s ease-in-out infinite; filter:drop-shadow(0 0 18px rgba(58,173,160,0.35)); }
        @keyframes logoPulse { 0%,100%{transform:scale(1);filter:drop-shadow(0 0 18px rgba(58,173,160,0.35))} 50%{transform:scale(1.05);filter:drop-shadow(0 0 28px rgba(58,173,160,0.55))} }
        .logo-name { font-family:'Cormorant Garamond',serif; font-size:32px; font-weight:600; letter-spacing:-1px; color:var(--text); line-height:1; }
        .logo-tag  { font-size:10px; font-weight:500; letter-spacing:2px; text-transform:uppercase; color:var(--text3); margin-top:2px; }

        /* Card */
        .card { background:var(--surface); border:1px solid var(--border); border-radius:24px; padding:28px 26px; box-shadow:var(--shadow); transition:background 0.6s ease,border-color 0.6s ease; }
        .card-title { font-family:'Cormorant Garamond',serif; font-size:22px; font-weight:600; color:var(--text); margin-bottom:4px; letter-spacing:-0.3px; }
        .card-sub   { font-size:13px; color:var(--text3); margin-bottom:22px; line-height:1.5; }
        .error-box { background:#fff1f2; border:1px solid #fecdd3; color:#e11d48; font-size:13px; padding:10px 14px; border-radius:12px; margin-bottom:18px; }
        .dark .error-box { background:rgba(225,29,72,0.10); border-color:rgba(225,29,72,0.25); color:#fb7185; }
        .fields { display:flex; flex-direction:column; gap:16px; }
        .field-label { font-size:12px; font-weight:600; color:var(--accent); display:block; margin-bottom:6px; letter-spacing:0.2px; }
        .field-input-wrap { position:relative; }
        .field-input { width:100%; border:2px solid var(--border-input); border-radius:14px; padding:11px 14px; font-size:14px; background:var(--accent-soft); color:var(--text); outline:none; transition:border-color .2s,box-shadow .2s,background .2s; font-family:'DM Sans',sans-serif; }
        .field-input::placeholder { color:var(--text3); }
        .field-input:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(58,173,160,0.12); background:var(--surface); }
        .pass-toggle { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:var(--text3); padding:4px; display:flex; align-items:center; transition:color .2s; }
        .pass-toggle:hover { color:var(--accent); }
        .btn-submit { width:100%; padding:13px; border-radius:14px; border:none; background:linear-gradient(135deg,var(--accent) 0%,#0f766e 100%); color:#fff; font-size:15px; font-weight:600; font-family:'DM Sans',sans-serif; letter-spacing:0.3px; cursor:pointer; margin-top:4px; box-shadow:0 6px 24px rgba(58,173,160,0.38); transition:transform .2s ease,box-shadow .2s ease,opacity .2s; position:relative; overflow:hidden; }
        .btn-submit::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,0.15) 0%,transparent 60%); pointer-events:none; }
        .btn-shimmer { position:absolute; inset:0; border-radius:inherit; background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.22) 50%,transparent 60%); background-size:200% 100%; animation:shimmer 3s ease-in-out infinite; }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .btn-submit:not(:disabled):hover { transform:translateY(-2px); box-shadow:0 10px 32px rgba(58,173,160,0.50); }
        .btn-submit:not(:disabled):active { transform:scale(0.97); }
        .btn-submit:disabled { opacity:0.6; cursor:not-allowed; }
        .footer-link { text-align:center; font-size:13px; color:var(--text2); margin-top:18px; }
        .footer-link a { color:var(--accent); font-weight:600; text-decoration:none; }
        .footer-link a:hover { text-decoration:underline; }
        .back-link { display:flex; align-items:center; gap:5px; justify-content:center; font-size:12px; color:var(--text3); margin-top:12px; text-decoration:none; transition:color .2s; }
        .back-link:hover { color:var(--accent); }
        .anim-logo { opacity:0; transform:translateY(28px) scale(0.92); }
        .anim-card { opacity:0; transform:translateY(20px); }
        .anim-foot { opacity:0; }
        .mounted .anim-logo { animation:mountUp 0.7s cubic-bezier(.22,1,.36,1) 0.1s both; }
        .mounted .anim-card { animation:mountUp 0.6s cubic-bezier(.22,1,.36,1) 0.28s both; }
        .mounted .anim-foot { animation:mountUp 0.5s cubic-bezier(.22,1,.36,1) 0.44s both; }
        @keyframes mountUp { from{opacity:0;transform:translateY(24px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        .copy { text-align:center; margin-top:28px; font-size:10px; font-weight:600; letter-spacing:1.8px; text-transform:uppercase; color:var(--text3); opacity:0.7; }
      `}</style>

      <div
        className={`page-wrap${dark ? " dark" : ""}${mounted ? " mounted" : ""}`}
      >
        <div className="glow glow-1" />
        <div className="glow glow-2" />
        <Particles />

        {/* ── Botones de control ── */}
        <div className="controls">
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
            {dark ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle
                  cx="8"
                  cy="8"
                  r="3.2"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path
                  d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M13.5 9.5A6 6 0 016.5 2.5a6 6 0 100 11 6 6 0 007-4z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>

        <div className="card-wrap">
          <div className="logo-area anim-logo">
            <div className="logo-container">
              <div className="logo-ring" />
              <div className="logo-ring logo-ring-2" />
              <div className="logo-ring logo-ring-3" />
              <div className="logo-pulse">
                <AppLogo size={60} />
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="logo-name">Events</div>
              <div className="logo-tag">{t.tagline}</div>
            </div>
          </div>

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
                    style={{ paddingRight: "40px" }}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                  <button
                    className="pass-toggle"
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
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
              >
                <span className="btn-shimmer" />
                {loading ? t.ctaLoading : t.cta}
              </button>
            </div>
          </div>

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
