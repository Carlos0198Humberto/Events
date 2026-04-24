"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Eventix Logo ─────────────────────────────────────────────────────────────
function AppLogo({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id={`ev-logo-${size}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#312E81" /><stop offset="100%" stopColor="#4F46E5" /></linearGradient></defs><rect width="64" height="64" rx="18" fill={`url(#ev-logo-${size})`} /><rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" /><rect x="13" y="14" width="6" height="36" rx="3" fill="#FFFFFF" /><rect x="13" y="14" width="24" height="6" rx="3" fill="#FFFFFF" /><rect x="13" y="29" width="18" height="6" rx="3" fill="#FFFFFF" /><rect x="13" y="44" width="24" height="6" rx="3" fill="#FFFFFF" /><circle cx="48" cy="19" r="3" fill="#E0E7FF" /><circle cx="48" cy="19" r="1.4" fill="#FFFFFF" /><circle cx="47" cy="46" r="2.5" fill="#FFFFFF" opacity="0.7" /></svg>
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
    forgotPass: "¿Olvidaste tu contraseña?",
    // Forgot password modal
    forgotTitle: "Recuperar contraseña",
    forgotSub: "Te enviaremos un enlace a tu correo",
    forgotCta: "Enviar enlace",
    forgotLoading: "Enviando...",
    forgotSuccess: "¡Enlace enviado! Revisa tu correo.",
    forgotError: "No encontramos ese correo. Verifica e intenta de nuevo.",
    forgotBack: "Volver al inicio de sesión",
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
    forgotPass: "Forgot your password?",
    // Forgot password modal
    forgotTitle: "Reset password",
    forgotSub: "We'll send a reset link to your email",
    forgotCta: "Send link",
    forgotLoading: "Sending...",
    forgotSuccess: "Link sent! Check your inbox.",
    forgotError: "We couldn't find that email. Please check and try again.",
    forgotBack: "Back to sign in",
  },
};

// ─── Forgot Password Modal ─────────────────────────────────────────────────────
function ForgotPasswordModal({
  lang,
  onClose,
}: {
  lang: "es" | "en";
  onClose: () => void;
}) {
  const t = translations[lang];
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleReset() {
    if (!email) return;
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) setError(t.forgotError);
    else setSent(true);
    setLoading(false);
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box">
        {/* Close button */}
        <button
          className="modal-close"
          onClick={onClose}
          type="button"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 2l12 12M14 2L2 14"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Icon */}
        <div className="modal-icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="10" fill="rgba(79,70,229,0.09)" />
            <path
              d="M6 10l8 6 8-6"
              stroke="#4F46E5"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              x="5"
              y="8"
              width="18"
              height="13"
              rx="3"
              stroke="#4F46E5"
              strokeWidth="1.6"
            />
          </svg>
        </div>

        <div className="modal-title">{t.forgotTitle}</div>
        <div className="modal-sub">{t.forgotSub}</div>

        {sent ? (
          <div className="success-box">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{ flexShrink: 0 }}
            >
              <circle cx="8" cy="8" r="7" stroke="#16a34a" strokeWidth="1.4" />
              <path
                d="M4.5 8l2.5 2.5 4.5-5"
                stroke="#16a34a"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t.forgotSuccess}
          </div>
        ) : (
          <>
            {error && <div className="error-box">{error}</div>}
            <div style={{ marginBottom: "16px" }}>
              <label className="field-label">{t.emailLabel}</label>
              <input
                className="field-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                autoComplete="email"
                inputMode="email"
                onKeyDown={(e) => e.key === "Enter" && handleReset()}
              />
            </div>
            <button
              className="btn-submit"
              onClick={handleReset}
              disabled={loading || !email}
              type="button"
            >
              <span className="btn-shimmer" />
              {loading ? t.forgotLoading : t.forgotCta}
            </button>
          </>
        )}

        <button className="modal-back-link" onClick={onClose} type="button">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M8 2L4 6l4 4"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {t.forgotBack}
        </button>
      </div>
    </div>
  );
}

// ─── Main Login Page ───────────────────────────────────────────────────────────
export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<"es" | "en">("es");
  const [showPass, setShowPass] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    document.title = "Eventix — Iniciar sesión";
    setTimeout(() => setMounted(true), 50);
  }, []);

  async function handleLogin() {
    if (!email || !password) return;
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
          --bg:           #FFFFFF;
          --surface:      #FFFFFF;
          --surface2:     #F8FAFF;
          --border:       #E5E7F0;
          --border-hover: #BFC6DC;
          --border-input: #CBD5E1;
          --accent:       #4F46E5;
          --accent2:      #3730A3;
          --accent-light: #EEF2FF;
          --accent-soft:  rgba(79,70,229,0.06);
          --accent-soft2: rgba(79,70,229,0.12);
          --text:         #0F172A;
          --text2:        #475569;
          --text3:        #64748B;
          --grad-primary: linear-gradient(135deg,#312E81 0%,#4F46E5 100%);
          --grad-secondary: linear-gradient(135deg,#4F46E5 0%,#6366F1 100%);
          --shadow:       0 14px 40px -10px rgba(15,23,42,0.10);
          --shadow-sm:    0 2px 10px rgba(15,23,42,0.05);
          --shadow-btn:   0 10px 30px -6px rgba(79,70,229,0.38), 0 4px 12px rgba(79,70,229,0.18);
          --transition:   all 0.36s cubic-bezier(.4,0,.2,1);
        }

        html, body {
          font-family: 'DM Sans', sans-serif;
          background: var(--bg);
          color: var(--text);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          /* Prevent horizontal scroll on mobile */
          overflow-x: hidden;
          width: 100%;
        }

        body::before {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
          opacity: 0.5;
        }

        /* ── Page wrapper — mobile-first ── */
        .page-wrap {
          min-height: 100vh;
          min-height: 100dvh;
          background: var(--bg);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 72px 16px 32px;
          padding-bottom: max(32px, env(safe-area-inset-bottom));
          position: relative;
          overflow-x: hidden;
        }

        /* On taller screens, center vertically */
        @media (min-height: 700px) {
          .page-wrap { align-items: center; padding-top: 24px; }
        }

        /* ── Glows ── */
        .glow { position: fixed; pointer-events: none; z-index: 0; border-radius: 50%; filter: blur(90px); }
        .glow-1 { width: 280px; height: 280px; top: -60px; right: -40px; background: radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%); animation: glowDrift1 9s ease-in-out infinite; }
        .glow-2 { width: 220px; height: 220px; bottom: 60px; left: -60px; background: radial-gradient(circle, rgba(129,140,248,0.09) 0%, transparent 70%); animation: glowDrift2 11s ease-in-out infinite; }
        .glow-3 { width: 180px; height: 180px; bottom: -30px; right: 10px; background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%); animation: glowDrift1 13s ease-in-out infinite reverse; }
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

        /* ── Language button ── */
        .controls { position: fixed; top: 12px; right: 12px; z-index: 20; }
        .ctrl-btn {
          height: 34px; border-radius: 100px;
          background: var(--surface); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: var(--transition);
          box-shadow: var(--shadow-sm); color: var(--text2);
          font-size: 11px; font-weight: 600; letter-spacing: .5px;
          text-transform: uppercase; padding: 0 14px;
          font-family: 'DM Sans', sans-serif;
          -webkit-tap-highlight-color: transparent;
        }
        .ctrl-btn:hover { background: var(--accent-soft2); color: var(--accent); border-color: var(--border-hover); }

        /* ── Card wrapper — fluid width ── */
        .card-wrap {
          width: 100%;
          max-width: 380px;
          position: relative;
          z-index: 1;
        }

        /* ── Logo area ── */
        .logo-area { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-bottom: 24px; }
        .logo-container { position: relative; display: flex; align-items: center; justify-content: center; width: 80px; height: 80px; }
        .logo-ring { position: absolute; border-radius: 50%; border: 1.5px solid rgba(79,70,229,0.18); animation: ringExpand 3s ease-out infinite; width: 68px; height: 68px; }
        .logo-ring-2 { animation-delay: 1s; }
        .logo-ring-3 { animation-delay: 2s; }
        @keyframes ringExpand { 0%{transform:scale(0.82);opacity:0.7} 100%{transform:scale(2.0);opacity:0} }
        .logo-pulse { position: relative; z-index: 2; animation: logoPulse 3.5s ease-in-out infinite; filter: drop-shadow(0 4px 20px rgba(79,70,229,0.20)); }
        @keyframes logoPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04);filter:drop-shadow(0 6px 28px rgba(79,70,229,0.25))} }
        .logo-name { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 600; letter-spacing: -1.2px; color: var(--text); line-height: 1; text-align: center; }
        .logo-name span { color: var(--accent); }
        .logo-tag { font-size: 10px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: var(--text3); margin-top: 3px; text-align: center; }

        /* ── Card ── */
        .card {
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: 22px;
          padding: 24px 20px;
          box-shadow: var(--shadow);
        }
        @media (min-width: 400px) {
          .card { padding: 28px 26px; border-radius: 24px; }
        }
        .card-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: var(--text); margin-bottom: 4px; letter-spacing: -0.3px; }
        .card-sub { font-size: 13px; color: var(--text3); margin-bottom: 20px; line-height: 1.5; }

        /* ── Error / Success boxes ── */
        .error-box { background: #fff1f2; border: 1px solid #fecdd3; color: #e11d48; font-size: 13px; padding: 10px 14px; border-radius: 12px; margin-bottom: 16px; }
        .success-box { background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; font-size: 13px; padding: 10px 14px; border-radius: 12px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }

        /* ── Fields ── */
        .fields { display: flex; flex-direction: column; gap: 16px; }
        .field-label { font-size: 11px; font-weight: 600; color: var(--accent); display: block; margin-bottom: 7px; letter-spacing: 0.3px; text-transform: uppercase; }
        .field-input-wrap { position: relative; }
        .field-input {
          width: 100%; border: 2px solid var(--border-input); border-radius: 14px;
          padding: 13px 14px; font-size: 15px;
          background: var(--accent-soft); color: var(--text);
          outline: none; transition: border-color .22s, box-shadow .22s, background .22s;
          font-family: 'DM Sans', sans-serif;
          -webkit-appearance: none;
          /* Prevent zoom on iOS */
          touch-action: manipulation;
        }
        .field-input::placeholder { color: var(--text3); }
        .field-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(79,70,229,0.13); background: var(--surface); }

        .pass-toggle {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: var(--text3);
          padding: 6px; display: flex; align-items: center; transition: color .2s;
          -webkit-tap-highlight-color: transparent;
          /* Make tap area bigger on mobile */
          min-width: 36px; min-height: 36px; justify-content: center;
        }
        .pass-toggle:hover { color: var(--accent); }

        /* ── Forgot password link ── */
        .forgot-link {
          display: block; text-align: right; font-size: 12px; font-weight: 500;
          color: var(--text3); text-decoration: none; margin-top: 6px;
          transition: color .2s; cursor: pointer; background: none; border: none;
          font-family: 'DM Sans', sans-serif; padding: 0;
          -webkit-tap-highlight-color: transparent;
        }
        .forgot-link:hover { color: var(--accent); }

        /* ── Submit button ── */
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
          /* Prevent double-tap zoom */
          touch-action: manipulation;
          /* Better tap height on mobile */
          min-height: 50px;
        }
        .btn-submit::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.16) 0%, transparent 55%); pointer-events: none; border-radius: inherit; }
        .btn-shimmer { position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.22) 50%, transparent 62%); background-size: 200% 100%; animation: shimmer 3.5s ease-in-out infinite; }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .btn-submit:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 10px 34px rgba(79,70,229,0.28); }
        .btn-submit:not(:disabled):active { transform: scale(0.97); }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Footer links ── */
        .footer-link { text-align: center; font-size: 13px; color: var(--text2); margin-top: 16px; }
        .footer-link a { color: var(--accent); font-weight: 600; text-decoration: none; }
        .footer-link a:hover { text-decoration: underline; }
        .back-link { display: flex; align-items: center; gap: 5px; justify-content: center; font-size: 12px; color: var(--text3); margin-top: 10px; text-decoration: none; transition: color .2s; -webkit-tap-highlight-color: transparent; min-height: 36px; }
        .back-link:hover { color: var(--accent); }
        .copy { text-align: center; margin-top: 20px; font-size: 10px; font-weight: 600; letter-spacing: 1.8px; text-transform: uppercase; color: var(--text3); opacity: 0.65; }

        /* ── Mount animations ── */
        .anim-logo { opacity: 0; transform: translateY(28px) scale(0.92); }
        .anim-card { opacity: 0; transform: translateY(20px); }
        .anim-foot { opacity: 0; }
        .mounted .anim-logo { animation: mountUp 0.7s cubic-bezier(.22,1,.36,1) 0.1s both; }
        .mounted .anim-card { animation: mountUp 0.6s cubic-bezier(.22,1,.36,1) 0.26s both; }
        .mounted .anim-foot { animation: mountUp 0.5s cubic-bezier(.22,1,.36,1) 0.42s both; }
        @keyframes mountUp { from{opacity:0;transform:translateY(24px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }

        /* ── Modal ── */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(12,26,25,0.45);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px 16px;
          animation: modalFadeIn .22s ease;
        }
        @keyframes modalFadeIn { from{opacity:0} to{opacity:1} }
        .modal-box {
          width: 100%; max-width: 340px;
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: 22px;
          padding: 28px 22px 22px;
          box-shadow: 0 16px 48px rgba(79,70,229,0.14);
          position: relative;
          animation: modalSlideUp .28s cubic-bezier(.22,1,.36,1);
        }
        @keyframes modalSlideUp { from{opacity:0;transform:translateY(20px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        .modal-close {
          position: absolute; top: 14px; right: 14px;
          width: 32px; height: 32px; border-radius: 50%;
          background: var(--accent-soft); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: var(--text2); transition: var(--transition);
          -webkit-tap-highlight-color: transparent;
        }
        .modal-close:hover { background: var(--accent-soft2); color: var(--accent); }
        .modal-icon { margin-bottom: 14px; }
        .modal-title { font-family: 'Cormorant Garamond', serif; font-size: 21px; font-weight: 600; color: var(--text); margin-bottom: 4px; letter-spacing: -0.3px; }
        .modal-sub { font-size: 13px; color: var(--text3); margin-bottom: 18px; line-height: 1.5; }
        .modal-back-link {
          display: flex; align-items: center; gap: 5px; justify-content: center;
          font-size: 12px; color: var(--text3); margin-top: 14px;
          text-decoration: none; transition: color .2s; cursor: pointer;
          background: none; border: none; font-family: 'DM Sans', sans-serif;
          width: 100%; min-height: 36px; -webkit-tap-highlight-color: transparent;
        }
        .modal-back-link:hover { color: var(--accent); }

        /* ── Very small screens (< 360px) ── */
        @media (max-width: 359px) {
          .logo-name { font-size: 27px; }
          .card { padding: 20px 16px; }
          .logo-container { width: 68px; height: 68px; }
        }

        /* ── Landscape / short screens ── */
        @media (max-height: 620px) {
          .logo-area { margin-bottom: 14px; gap: 8px; }
          .logo-container { width: 60px; height: 60px; }
          .logo-ring { width: 56px; height: 56px; }
          .logo-name { font-size: 26px; }
          .logo-tag { display: none; }
          .card-sub { margin-bottom: 14px; }
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

        {/* Forgot password modal */}
        {showForgot && (
          <ForgotPasswordModal
            lang={lang}
            onClose={() => setShowForgot(false)}
          />
        )}

        <div className="card-wrap">
          {/* Logo */}
          <div className="logo-area anim-logo">
            <div className="logo-container">
              <div className="logo-ring" />
              <div className="logo-ring logo-ring-2" />
              <div className="logo-ring logo-ring-3" />
              <div className="logo-pulse">
                <AppLogo size={58} />
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
              {/* Email */}
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

              {/* Password */}
              <div>
                <label className="field-label">{t.passLabel}</label>
                <div className="field-input-wrap">
                  <input
                    className="field-input"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passPlaceholder}
                    style={{ paddingRight: "46px" }}
                    autoComplete="current-password"
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                  <button
                    className="pass-toggle"
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
                    type="button"
                    aria-label={
                      showPass ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
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
                {/* Forgot password */}
                <button
                  className="forgot-link"
                  onClick={() => setShowForgot(true)}
                  type="button"
                >
                  {t.forgotPass}
                </button>
              </div>

              {/* Submit */}
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
