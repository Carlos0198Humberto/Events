"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Eventix Logo ─────────────────────────────────────────────────────────────
function AppLogo({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id={`ev-logo-${size}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#7C3AED" /><stop offset="100%" stopColor="#EC4899" /></linearGradient></defs><rect width="64" height="64" rx="18" fill={`url(#ev-logo-${size})`} /><rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" /><rect x="13" y="14" width="6" height="36" rx="3" fill="#FFFFFF" /><rect x="13" y="14" width="24" height="6" rx="3" fill="#FFFFFF" /><rect x="13" y="29" width="18" height="6" rx="3" fill="#FFFFFF" /><rect x="13" y="44" width="24" height="6" rx="3" fill="#FFFFFF" /><path d="M48 11 L49.8 17.2 L56 19 L49.8 20.8 L48 27 L46.2 20.8 L40 19 L46.2 17.2 Z" fill="#FDE68A" /><circle cx="47" cy="46" r="2.5" fill="#FFFFFF" opacity="0.7" /></svg>
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

// ─── Password strength helper ─────────────────────────────────────────────────
function getStrength(pass: string): {
  level: number;
  label: string;
  color: string;
} {
  if (!pass) return { level: 0, label: "", color: "transparent" };
  let score = 0;
  if (pass.length >= 6) score++;
  if (pass.length >= 10) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  if (score <= 1) return { level: 1, label: "Débil", color: "#e11d48" };
  if (score <= 2) return { level: 2, label: "Regular", color: "#f59e0b" };
  if (score <= 3) return { level: 3, label: "Buena", color: "#22c55e" };
  return { level: 4, label: "Fuerte", color: "#7C3AED" };
}

function getStrengthEn(pass: string): string {
  const { level } = getStrength(pass);
  return ["", "Weak", "Fair", "Good", "Strong"][level] ?? "";
}

// ─── EyeIcon ─────────────────────────────────────────────────────────────────
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M2 2l12 12"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

// ─── Translations ─────────────────────────────────────────────────────────────
const translations = {
  es: {
    title: "Crear cuenta",
    sub: "Empieza a gestionar tus eventos gratis",
    nameLabel: "Tu nombre",
    namePlaceholder: "María García",
    emailLabel: "Correo electrónico",
    emailPlaceholder: "tu@correo.com",
    passLabel: "Contraseña",
    passPlaceholder: "Mínimo 6 caracteres",
    confirmPassLabel: "Confirmar contraseña",
    confirmPassPlaceholder: "Repite tu contraseña",
    termsText: "Acepto los",
    termsLink: "términos y condiciones",
    cta: "Crear cuenta gratis",
    ctaLoading: "Creando cuenta...",
    hasAccount: "¿Ya tienes cuenta?",
    login: "Inicia sesión",
    back: "Volver al inicio",
    errorEmpty: "Por favor llena todos los campos",
    errorPassMatch: "Las contraseñas no coinciden",
    errorPassLen: "La contraseña debe tener al menos 6 caracteres",
    errorTerms: "Debes aceptar los términos y condiciones",
    tagline: "Invitaciones · Fotos · Recuerdos",
    passMatch: "Contraseñas coinciden ✓",
    passNoMatch: "No coinciden",
    strengthLabel: "Seguridad:",
  },
  en: {
    title: "Create account",
    sub: "Start managing your events for free",
    nameLabel: "Your name",
    namePlaceholder: "Maria Garcia",
    emailLabel: "Email address",
    emailPlaceholder: "you@email.com",
    passLabel: "Password",
    passPlaceholder: "Minimum 6 characters",
    confirmPassLabel: "Confirm password",
    confirmPassPlaceholder: "Repeat your password",
    termsText: "I agree to the",
    termsLink: "terms and conditions",
    cta: "Create free account",
    ctaLoading: "Creating account...",
    hasAccount: "Already have an account?",
    login: "Sign in",
    back: "Back to home",
    errorEmpty: "Please fill in all fields",
    errorPassMatch: "Passwords do not match",
    errorPassLen: "Password must be at least 6 characters",
    errorTerms: "You must accept the terms and conditions",
    tagline: "Invitations · Photos · Memories",
    passMatch: "Passwords match ✓",
    passNoMatch: "Don't match",
    strengthLabel: "Strength:",
  },
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Registro() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<"es" | "en">("es");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const t = translations[lang];
  const strength = getStrength(password);
  const passMatchOk = confirmPass.length > 0 && password === confirmPass;
  const passNoMatch = confirmPass.length > 0 && password !== confirmPass;

  useEffect(() => {
    document.title = "Eventix — Crear cuenta";
    setTimeout(() => setMounted(true), 50);
  }, []);

  async function handleRegistro() {
    setError("");
    if (!nombre || !email || !password || !confirmPass) {
      setError(t.errorEmpty);
      return;
    }
    if (password.length < 6) {
      setError(t.errorPassLen);
      return;
    }
    if (password !== confirmPass) {
      setError(t.errorPassMatch);
      return;
    }
    if (!acceptTerms) {
      setError(t.errorTerms);
      return;
    }
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }
    if (data.user) {
      await supabase
        .from("profiles")
        .insert({ id: data.user.id, nombre, email });
      router.push("/dashboard");
    }
    setLoading(false);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:           #FAFBFF;
          --surface:      #FFFFFF;
          --border:       #E5E7F0;
          --border-hover: #BFC6DC;
          --border-input: #CBD5E1;
          --accent:       #7C3AED;
          --accent2:      #5B21B6;
          --accent-light: #EDE9FE;
          --accent-soft:  rgba(124,58,237,0.08);
          --accent-soft2: rgba(124,58,237,0.14);
          --text:         #0F172A;
          --text2:        #475569;
          --text3:        #64748B;
          --grad-primary: linear-gradient(135deg,#7C3AED 0%,#EC4899 100%);
          --grad-secondary: linear-gradient(135deg,#3B82F6 0%,#06B6D4 100%);
          --shadow:       0 14px 40px -10px rgba(15,23,42,0.14);
          --shadow-sm:    0 2px 10px rgba(15,23,42,0.06);
          --shadow-btn:   0 10px 30px -6px rgba(124,58,237,0.38), 0 4px 12px rgba(236,72,153,0.18);
          --transition:   all 0.36s cubic-bezier(.4,0,.2,1);
        }

        html, body {
          font-family: 'DM Sans', sans-serif;
          background: var(--bg);
          color: var(--text);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          overflow-x: hidden;
          width: 100%;
        }

        body::before {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
          opacity: 0.5;
        }

        /* ── Page — mobile-first, scrollable ── */
        .page-wrap {
          min-height: 100vh;
          min-height: 100dvh;
          background: var(--bg);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 68px 16px 40px;
          padding-top: max(68px, calc(env(safe-area-inset-top) + 52px));
          padding-bottom: max(40px, env(safe-area-inset-bottom));
          position: relative;
          overflow-x: hidden;
        }
        /* Center vertically on screens that have enough room */
        @media (min-height: 820px) {
          .page-wrap { align-items: center; padding-top: 24px; }
        }

        /* ── Glows ── */
        .glow { position: fixed; pointer-events: none; z-index: 0; border-radius: 50%; filter: blur(90px); }
        .glow-1 { width: 280px; height: 280px; top: -60px; right: -40px; background: radial-gradient(circle, rgba(124,58,237,0.16) 0%, transparent 70%); animation: glowDrift1 9s ease-in-out infinite; }
        .glow-2 { width: 220px; height: 220px; bottom: 60px; left: -60px; background: radial-gradient(circle, rgba(232,213,176,0.11) 0%, transparent 70%); animation: glowDrift2 11s ease-in-out infinite; }
        .glow-3 { width: 180px; height: 180px; bottom: -30px; right: 10px; background: radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%); animation: glowDrift1 13s ease-in-out infinite reverse; }
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

        /* ── Lang button ── */
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

        /* ── Card wrapper ── */
        .card-wrap { width: 100%; max-width: 380px; position: relative; z-index: 1; }

        /* ── Logo area ── */
        .logo-area { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 20px; }
        .logo-container { position: relative; display: flex; align-items: center; justify-content: center; width: 76px; height: 76px; }
        .logo-ring { position: absolute; border-radius: 50%; border: 1.5px solid rgba(124,58,237,0.18); animation: ringExpand 3s ease-out infinite; width: 62px; height: 62px; }
        .logo-ring-2 { animation-delay: 1s; }
        .logo-ring-3 { animation-delay: 2s; }
        @keyframes ringExpand { 0%{transform:scale(0.82);opacity:0.7} 100%{transform:scale(2.0);opacity:0} }
        .logo-pulse { position: relative; z-index: 2; animation: logoPulse 3.5s ease-in-out infinite; filter: drop-shadow(0 4px 20px rgba(124,58,237,0.20)); }
        @keyframes logoPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04);filter:drop-shadow(0 6px 28px rgba(124,58,237,0.25))} }
        .logo-name { font-family: 'Cormorant Garamond', serif; font-size: 30px; font-weight: 600; letter-spacing: -1.2px; color: var(--text); line-height: 1; text-align: center; }
        .logo-name span { color: var(--accent); }
        .logo-tag { font-size: 10px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: var(--text3); margin-top: 2px; text-align: center; }

        /* ── Card ── */
        .card {
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: 22px;
          padding: 22px 18px;
          box-shadow: var(--shadow);
        }
        @media (min-width: 400px) {
          .card { padding: 26px 24px; border-radius: 24px; }
        }
        .card-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: var(--text); margin-bottom: 3px; letter-spacing: -0.3px; }
        .card-sub { font-size: 13px; color: var(--text3); margin-bottom: 18px; line-height: 1.5; }

        /* ── Error ── */
        .error-box { background: #fff1f2; border: 1px solid #fecdd3; color: #e11d48; font-size: 13px; padding: 10px 14px; border-radius: 12px; margin-bottom: 14px; }

        /* ── Fields ── */
        .fields { display: flex; flex-direction: column; gap: 13px; }
        .field-label { font-size: 11px; font-weight: 600; color: var(--accent); display: block; margin-bottom: 6px; letter-spacing: 0.3px; text-transform: uppercase; }
        .field-input-wrap { position: relative; }
        .field-input {
          width: 100%; border: 2px solid var(--border-input); border-radius: 13px;
          padding: 13px 14px; font-size: 15px;
          background: var(--accent-soft); color: var(--text);
          outline: none; transition: border-color .22s, box-shadow .22s, background .22s;
          font-family: 'DM Sans', sans-serif;
          -webkit-appearance: none;
          touch-action: manipulation;
        }
        .field-input::placeholder { color: var(--text3); }
        .field-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(124,58,237,0.11); background: var(--surface); }
        .field-input.err { border-color: #fca5a5; }
        .field-input.ok  { border-color: #86efac; }

        .pass-toggle {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: var(--text3);
          padding: 6px; display: flex; align-items: center; transition: color .2s;
          -webkit-tap-highlight-color: transparent;
          min-width: 36px; min-height: 36px; justify-content: center;
        }
        .pass-toggle:hover { color: var(--accent); }

        /* ── Strength bar ── */
        .strength-row { display: flex; align-items: center; gap: 8px; margin-top: 7px; }
        .strength-bars { display: flex; gap: 3px; flex: 1; }
        .strength-bar { height: 3px; flex: 1; border-radius: 4px; background: var(--border-input); transition: background .3s; }
        .strength-text { font-size: 11px; font-weight: 600; min-width: 46px; text-align: right; transition: color .3s; }

        /* ── Confirm password hint ── */
        .pass-hint { font-size: 11px; font-weight: 500; margin-top: 6px; transition: color .2s; }

        /* ── Terms checkbox ── */
        .terms-row {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 12px; border-radius: 12px;
          background: var(--accent-soft); border: 1.5px solid var(--border-input);
          cursor: pointer; transition: border-color .2s, background .2s;
          -webkit-tap-highlight-color: transparent;
        }
        .terms-row:hover { border-color: var(--border-hover); background: var(--accent-soft2); }
        .terms-row.active { border-color: var(--accent); background: rgba(124,58,237,0.08); }
        .checkbox-box {
          width: 20px; height: 20px; border-radius: 6px; flex-shrink: 0;
          border: 2px solid var(--border-input); background: var(--surface);
          display: flex; align-items: center; justify-content: center;
          transition: border-color .2s, background .2s; margin-top: 1px;
        }
        .checkbox-box.checked { border-color: var(--accent); background: var(--accent); }
        .terms-text { font-size: 12.5px; color: var(--text2); line-height: 1.5; }
        .terms-text a { color: var(--accent); font-weight: 600; text-decoration: none; }
        .terms-text a:hover { text-decoration: underline; }

        /* ── Submit button ── */
        .btn-submit {
          width: 100%; padding: 15px; border-radius: 14px; border: none;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
          color: #fff; font-size: 15px; font-weight: 600;
          font-family: 'DM Sans', sans-serif; letter-spacing: 0.3px;
          cursor: pointer; margin-top: 2px;
          box-shadow: var(--shadow-btn);
          transition: transform .2s ease, box-shadow .2s ease, opacity .2s;
          position: relative; overflow: hidden;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          min-height: 50px;
        }
        .btn-submit::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.16) 0%, transparent 55%); pointer-events: none; border-radius: inherit; }
        .btn-shimmer { position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.22) 50%, transparent 62%); background-size: 200% 100%; animation: shimmer 3.5s ease-in-out infinite; }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .btn-submit:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 10px 34px rgba(124,58,237,0.25); }
        .btn-submit:not(:disabled):active { transform: scale(0.97); }
        .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        /* ── Footer ── */
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

        /* ── Very small screens ── */
        @media (max-width: 359px) {
          .logo-name { font-size: 25px; }
          .card { padding: 18px 14px; }
          .logo-container { width: 62px; height: 62px; }
        }

        /* ── Short / landscape screens ── */
        @media (max-height: 640px) {
          .logo-area { margin-bottom: 12px; gap: 7px; }
          .logo-container { width: 54px; height: 54px; }
          .logo-ring { width: 50px; height: 50px; }
          .logo-name { font-size: 24px; }
          .logo-tag { display: none; }
          .card-sub { margin-bottom: 12px; }
          .fields { gap: 10px; }
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
                <AppLogo size={54} />
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
              {/* Name */}
              <div>
                <label className="field-label">{t.nameLabel}</label>
                <input
                  className="field-input"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder={t.namePlaceholder}
                  autoComplete="name"
                  autoCapitalize="words"
                />
              </div>

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

              {/* Password + strength */}
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
                    autoComplete="new-password"
                  />
                  <button
                    className="pass-toggle"
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
                    type="button"
                    aria-label="Toggle password visibility"
                  >
                    <EyeIcon open={showPass} />
                  </button>
                </div>
                {/* Strength indicator */}
                {password.length > 0 && (
                  <div className="strength-row">
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text3)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.strengthLabel}
                    </span>
                    <div className="strength-bars">
                      {[1, 2, 3, 4].map((n) => (
                        <div
                          key={n}
                          className="strength-bar"
                          style={{
                            background:
                              n <= strength.level ? strength.color : undefined,
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className="strength-text"
                      style={{ color: strength.color }}
                    >
                      {lang === "es" ? strength.label : getStrengthEn(password)}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="field-label">{t.confirmPassLabel}</label>
                <div className="field-input-wrap">
                  <input
                    className={`field-input${passMatchOk ? " ok" : passNoMatch ? " err" : ""}`}
                    type={showConfirm ? "text" : "password"}
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder={t.confirmPassPlaceholder}
                    style={{ paddingRight: "46px" }}
                    autoComplete="new-password"
                    onKeyDown={(e) => e.key === "Enter" && handleRegistro()}
                  />
                  <button
                    className="pass-toggle"
                    onClick={() => setShowConfirm(!showConfirm)}
                    tabIndex={-1}
                    type="button"
                    aria-label="Toggle confirm password visibility"
                  >
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
                {/* Match hint */}
                {confirmPass.length > 0 && (
                  <p
                    className="pass-hint"
                    style={{ color: passMatchOk ? "#16a34a" : "#e11d48" }}
                  >
                    {passMatchOk ? t.passMatch : t.passNoMatch}
                  </p>
                )}
              </div>

              {/* Terms & Conditions */}
              <div
                className={`terms-row${acceptTerms ? " active" : ""}`}
                onClick={() => setAcceptTerms(!acceptTerms)}
                role="checkbox"
                aria-checked={acceptTerms}
                tabIndex={0}
                onKeyDown={(e) => e.key === " " && setAcceptTerms(!acceptTerms)}
              >
                <div className={`checkbox-box${acceptTerms ? " checked" : ""}`}>
                  {acceptTerms && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className="terms-text">
                  {t.termsText}{" "}
                  <a href="/terminos" onClick={(e) => e.stopPropagation()}>
                    {t.termsLink}
                  </a>
                </span>
              </div>

              {/* Submit */}
              <button
                className="btn-submit"
                onClick={handleRegistro}
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
              {t.hasAccount} <Link href="/auth/login">{t.login}</Link>
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
