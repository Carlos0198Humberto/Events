"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

// ─── i18n ─────────────────────────────────────────────────────────────────────
const translations = {
  es: {
    tagline: "Invitaciones · Fotos · Recuerdos",
    // Splash card
    splashTitle: "Bienvenido a Eventix",
    splashSub: "Crea invitaciones digitales elegantes, recibe confirmaciones y conserva cada recuerdo en un solo lugar.",
    cta: "Continuar",
    features: [
      { label: "Invitaciones digitales", desc: "Diseños profesionales listos" },
      { label: "Confirmación automática", desc: "Tus invitados responden al instante" },
      { label: "Muro de fotos", desc: "Todas las fotos, en vivo" },
      { label: "Libro digital", desc: "Mensajes guardados para siempre" },
    ],
    // Auth choice
    chooseTitle: "¿Qué deseas hacer?",
    chooseSub: "Entra a tu cuenta o crea una nueva en segundos.",
    register: "Crear cuenta",
    newHere: "Nuevo en Eventix",
    login: "Iniciar sesión",
    haveAccount: "Ya tengo cuenta",
    back: "Volver",
  },
  en: {
    tagline: "Invitations · Photos · Memories",
    splashTitle: "Welcome to Eventix",
    splashSub: "Create elegant digital invitations, collect RSVPs, and keep every memory in one place.",
    cta: "Get Started",
    features: [
      { label: "Digital invitations", desc: "Professional designs, ready to go" },
      { label: "Automatic RSVP", desc: "Guests reply instantly" },
      { label: "Photo wall", desc: "Every photo, live" },
      { label: "Memory book", desc: "Messages saved forever" },
    ],
    chooseTitle: "What would you like to do?",
    chooseSub: "Sign in or create a new account in seconds.",
    register: "Create account",
    newHere: "New to Eventix",
    login: "Sign in",
    haveAccount: "I already have an account",
    back: "Back",
  },
};

// ─── Favicon injector ─────────────────────────────────────────────────────────
function FaviconInjector() {
  useEffect(() => {
    document.title = "Eventix";
    document
      .querySelectorAll("link[rel~='icon'], link[rel~='shortcut']")
      .forEach((el) => el.parentNode?.removeChild(el));
    const svgFavicon =
      `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fv-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#312E81"/><stop offset="100%" stop-color="#4F46E5"/></linearGradient></defs><rect width="64" height="64" rx="18" fill="url(%23fv-bg)"/><rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="1.2"/><rect x="13" y="14" width="6" height="36" rx="3" fill="#FFFFFF"/><rect x="13" y="14" width="24" height="6" rx="3" fill="#FFFFFF"/><rect x="13" y="29" width="18" height="6" rx="3" fill="#FFFFFF"/><rect x="13" y="44" width="24" height="6" rx="3" fill="#FFFFFF"/><circle cx="48" cy="19" r="3" fill="#E0E7FF"/><circle cx="48" cy="19" r="1.4" fill="#FFFFFF"/></svg>`.trim();
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = `data:image/svg+xml,${encodeURIComponent(svgFavicon)}`;
    document.head.appendChild(link);
  }, []);
  return null;
}

// ─── Logo (matches login) ─────────────────────────────────────────────────────
function AppLogo({ size = 58 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`ev-logo-${size}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#312E81" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill={`url(#ev-logo-${size})`} />
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="16"
        fill="none"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1.2"
      />
      <rect x="13" y="14" width="6" height="36" rx="3" fill="#FFFFFF" />
      <rect x="13" y="14" width="24" height="6" rx="3" fill="#FFFFFF" />
      <rect x="13" y="29" width="18" height="6" rx="3" fill="#FFFFFF" />
      <rect x="13" y="44" width="24" height="6" rx="3" fill="#FFFFFF" />
      <circle cx="48" cy="19" r="3" fill="#E0E7FF" />
      <circle cx="48" cy="19" r="1.4" fill="#FFFFFF" />
      <circle cx="47" cy="46" r="2.5" fill="#FFFFFF" opacity="0.7" />
    </svg>
  );
}

// ─── Particles ────────────────────────────────────────────────────────────────
function Particles() {
  return (
    <div className="particles" aria-hidden="true">
      {[...Array(10)].map((_, i) => (
        <div key={i} className={`particle particle-${i + 1}`} />
      ))}
    </div>
  );
}

// ─── Feature icons ────────────────────────────────────────────────────────────
const featureIcons = [
  // invitation
  (
    <svg key="inv" width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect
        x="2.5"
        y="4"
        width="13"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M2.5 5.5L9 10l6.5-4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  // check
  (
    <svg key="chk" width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M6 9.2l2.2 2.2L12 7.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  // camera
  (
    <svg key="cam" width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect
        x="2"
        y="5"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M6 5l1-1.5h4L12 5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  // book
  (
    <svg key="book" width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M3 4.5A1.5 1.5 0 014.5 3H9v11H4.5A1.5 1.5 0 013 12.5v-8z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M15 4.5A1.5 1.5 0 0013.5 3H9v11h4.5A1.5 1.5 0 0015 12.5v-8z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  ),
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [lang, setLang] = useState<"es" | "en">("es");
  const [screen, setScreen] = useState<"splash" | "auth">("splash");
  const [transitioning, setTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
  }, []);

  const goTo = (s: "splash" | "auth") => {
    setTransitioning(true);
    setTimeout(() => {
      setScreen(s);
      setTransitioning(false);
    }, 340);
  };

  return (
    <>
      <FaviconInjector />

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
          overflow-x: hidden;
          width: 100%;
        }

        body::before {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
          opacity: 0.5;
        }

        /* ── App shell — same frame for both screens ── */
        .app {
          position: relative;
          min-height: 100vh;
          min-height: 100dvh;
          background: var(--bg);
          overflow-x: hidden;
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
        .particle:nth-child(3n){ background:#A5B4FC; }
        .particle:nth-child(4n){ background:#E0E7FF; }
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

        /* ── Screen system (both share login's page-wrap layout) ── */
        .screen {
          position: absolute; inset: 0;
          min-height: 100vh; min-height: 100dvh;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 72px 16px 32px;
          padding-top: max(72px, calc(env(safe-area-inset-top) + 52px));
          padding-bottom: max(32px, env(safe-area-inset-bottom));
          overflow-y: auto;
          overflow-x: hidden;
          transition: opacity 0.34s ease, transform 0.34s cubic-bezier(.4,0,.2,1);
          z-index: 1;
        }
        @media (min-height: 760px) {
          .screen { align-items: center; padding-top: 24px; }
        }
        .screen.exit   { opacity: 0; transform: scale(0.96) translateY(-14px); pointer-events: none; }
        .screen.enter  { opacity: 1; transform: scale(1) translateY(0); }
        .screen.hidden { opacity: 0; transform: scale(1.03) translateY(14px); pointer-events: none; }

        /* ── Card wrapper (same as login) ── */
        .card-wrap {
          width: 100%;
          max-width: 380px;
          position: relative;
          z-index: 1;
        }

        /* ── Logo area (same as login) ── */
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

        /* ── Card (same as login) ── */
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
        .card-sub { font-size: 13px; color: var(--text3); margin-bottom: 20px; line-height: 1.55; }

        /* ── Features list (inside splash card) ── */
        .feat-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
        .feat-row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px; border-radius: 12px;
          background: var(--accent-soft);
          border: 1px solid var(--border);
          transition: var(--transition);
        }
        .feat-row:hover { border-color: var(--border-hover); background: var(--accent-soft2); }
        .feat-ic {
          width: 34px; height: 34px; border-radius: 10px;
          background: var(--accent-light);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent); flex-shrink: 0;
        }
        .feat-txt { display: flex; flex-direction: column; min-width: 0; }
        .feat-lbl { font-size: 13px; font-weight: 600; color: var(--text); line-height: 1.25; }
        .feat-desc { font-size: 11.5px; color: var(--text3); line-height: 1.35; }

        /* ── Primary button (same as login's btn-submit) ── */
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
          touch-action: manipulation;
          min-height: 50px;
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
        }
        .btn-submit::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.16) 0%, transparent 55%); pointer-events: none; border-radius: inherit; }
        .btn-shimmer { position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.22) 50%, transparent 62%); background-size: 200% 100%; animation: shimmer 3.5s ease-in-out infinite; }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .btn-submit:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 10px 34px rgba(79,70,229,0.28); }
        .btn-submit:not(:disabled):active { transform: scale(0.97); }
        .btn-arrow { width: 22px; height: 22px; background: rgba(255,255,255,0.22); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform .22s ease; }
        .btn-submit:hover .btn-arrow { transform: translateX(3px); }

        /* ── Auth choice rows (inside auth card) ── */
        .auth-actions { display: flex; flex-direction: column; gap: 10px; }
        .auth-card {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 16px; border-radius: 14px;
          background: var(--surface); border: 1.5px solid var(--border);
          text-decoration: none; transition: var(--transition);
          box-shadow: var(--shadow-sm);
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          min-height: 64px;
        }
        .auth-card:hover { border-color: var(--border-hover); transform: translateY(-2px); box-shadow: 0 10px 24px -8px rgba(15,23,42,0.12); }
        .auth-card.primary {
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
          border-color: transparent; box-shadow: var(--shadow-btn);
          position: relative; overflow: hidden;
        }
        .auth-card.primary::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.16) 0%, transparent 55%); pointer-events: none; border-radius: inherit; }
        .auth-card.primary:hover { transform: translateY(-2px); box-shadow: 0 14px 34px -6px rgba(79,70,229,0.42); }
        .auth-ic {
          width: 42px; height: 42px; border-radius: 12px;
          background: var(--accent-light); color: var(--accent);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .auth-card.primary .auth-ic { background: rgba(255,255,255,0.2); color: #fff; }
        .auth-txt { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
        .auth-lbl { font-size: 14.5px; font-weight: 600; color: var(--text); line-height: 1.2; }
        .auth-sub { font-size: 12px; color: var(--text3); line-height: 1.3; }
        .auth-card.primary .auth-lbl, .auth-card.primary .auth-sub { color: #fff; }
        .auth-card.primary .auth-sub { color: rgba(255,255,255,0.85); }
        .auth-chev { color: var(--text3); flex-shrink: 0; transition: transform .2s ease; }
        .auth-card.primary .auth-chev { color: rgba(255,255,255,0.9); }
        .auth-card:hover .auth-chev { transform: translateX(3px); }

        /* ── Footer links ── */
        .back-link {
          display: flex; align-items: center; gap: 5px; justify-content: center;
          font-size: 12px; color: var(--text3); margin-top: 10px;
          text-decoration: none; transition: color .2s; cursor: pointer;
          background: none; border: none; font-family: 'DM Sans', sans-serif;
          width: 100%; min-height: 36px; -webkit-tap-highlight-color: transparent;
        }
        .back-link:hover { color: var(--accent); }
        .footer-link { text-align: center; font-size: 13px; color: var(--text2); margin-top: 16px; }
        .footer-link a { color: var(--accent); font-weight: 600; text-decoration: none; }
        .footer-link a:hover { text-decoration: underline; }
        .copy { text-align: center; margin-top: 16px; font-size: 10px; font-weight: 600; letter-spacing: 1.8px; text-transform: uppercase; color: var(--text3); opacity: 0.65; }

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
          .logo-name { font-size: 27px; }
          .card { padding: 20px 16px; }
          .logo-container { width: 68px; height: 68px; }
          .feat-row { padding: 9px 10px; gap: 10px; }
          .feat-ic { width: 32px; height: 32px; }
          .auth-card { padding: 12px 14px; min-height: 60px; }
        }

        /* ── Short screens / landscape ── */
        @media (max-height: 640px) {
          .logo-area { margin-bottom: 14px; gap: 8px; }
          .logo-container { width: 60px; height: 60px; }
          .logo-ring { width: 56px; height: 56px; }
          .logo-name { font-size: 26px; }
          .logo-tag { display: none; }
          .card-sub { margin-bottom: 14px; }
          .feat-list { gap: 8px; margin-bottom: 14px; }
          .feat-row { padding: 8px 10px; }
        }
      `}</style>

      <div className={`app${mounted ? " mounted" : ""}`}>
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

        {/* ── SPLASH ── */}
        <div
          className={`screen ${screen === "splash" ? (transitioning ? "exit" : "enter") : "hidden"}`}
        >
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

            {/* Card: welcome + features + CTA */}
            <div className="card anim-card">
              <div className="card-title">{t.splashTitle}</div>
              <div className="card-sub">{t.splashSub}</div>

              <div className="feat-list">
                {t.features.map((f, i) => (
                  <div key={i} className="feat-row">
                    <div className="feat-ic">{featureIcons[i]}</div>
                    <div className="feat-txt">
                      <span className="feat-lbl">{f.label}</span>
                      <span className="feat-desc">{f.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="btn-submit"
                onClick={() => goTo("auth")}
                type="button"
              >
                <span className="btn-shimmer" />
                {t.cta}
                <span className="btn-arrow">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5h6M5.5 2.5L8 5l-2.5 2.5"
                      stroke="white"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
            </div>

            {/* Footer */}
            <div className="anim-foot">
              <p className="copy">Humb3rsec 2026</p>
            </div>
          </div>
        </div>

        {/* ── AUTH CHOICE ── */}
        <div
          className={`screen ${screen === "auth" ? (transitioning ? "exit" : "enter") : "hidden"}`}
        >
          <div className="card-wrap">
            {/* Logo (same as splash) */}
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

            {/* Card: auth choice */}
            <div className="card anim-card">
              <div className="card-title">{t.chooseTitle}</div>
              <div className="card-sub">{t.chooseSub}</div>

              <div className="auth-actions">
                {/* Register — primary */}
                <Link href="/auth/registro" className="auth-card primary">
                  <div className="auth-ic">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle
                        cx="10"
                        cy="7"
                        r="3.4"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                      <path
                        d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                      <path
                        d="M14 3v4M12 5h4"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div className="auth-txt">
                    <span className="auth-lbl">{t.register}</span>
                    <span className="auth-sub">{t.newHere}</span>
                  </div>
                  <svg
                    className="auth-chev"
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                  >
                    <path
                      d="M5 2l5 5-5 5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>

                {/* Login — secondary */}
                <Link href="/auth/login" className="auth-card">
                  <div className="auth-ic">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle
                        cx="10"
                        cy="7"
                        r="3.4"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                      <path
                        d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div className="auth-txt">
                    <span className="auth-lbl">{t.login}</span>
                    <span className="auth-sub">{t.haveAccount}</span>
                  </div>
                  <svg
                    className="auth-chev"
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                  >
                    <path
                      d="M5 2l5 5-5 5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Footer */}
            <div className="anim-foot">
              <button
                className="back-link"
                onClick={() => goTo("splash")}
                type="button"
              >
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
              </button>
              <p className="copy">Humb3rsec 2026</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
