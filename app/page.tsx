"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

// ─── i18n ───────────────────────────────────────────────────────────────────
const translations = {
  es: {
    tagline: "Invitaciones · Fotos · Recuerdos",
    headline1: "Cada evento,",
    headline2: "una",
    headline3: "historia",
    headline4: "especial",
    sub: "Invitaciones digitales, confirmación de asistencia, muro de fotos en vivo y libro de recuerdos.",
    cta: "Continuar",
    login: "Iniciar sesión",
    register: "Crear cuenta",
    features: [
      "Invitaciones",
      "Confirmación",
      "Muro de fotos",
      "Libro digital",
    ],
    featDescs: [
      "Link único por WhatsApp",
      "Un clic, sin registro",
      "Fotos en tiempo real",
      "Recuerdo para siempre",
    ],
    ctaBlock: "Empieza hoy, gratis",
    ctaSub: "Tu primer evento listo en 5 minutos",
    ctaBtn: "Crear mi evento",
    trust: [
      "Sin registro para invitados",
      "Funciona en cualquier dispositivo",
      "Fotos en tiempo real",
      "Álbum digital al finalizar",
    ],
    copy: "© 2026 · Tu evento, tu historia",
    darkMode: "Modo oscuro",
    lightMode: "Modo claro",
    back: "Volver",
    chooseAction: "¿Qué deseas hacer?",
    or: "o",
  },
  en: {
    tagline: "Invitations · Photos · Memories",
    headline1: "Every event,",
    headline2: "a",
    headline3: "special",
    headline4: "story",
    sub: "Digital invitations, RSVP confirmation, live photo wall and memory book.",
    cta: "Get Started",
    login: "Sign in",
    register: "Create account",
    features: ["Invitations", "Confirmation", "Photo Wall", "Memory Book"],
    featDescs: [
      "Unique link via WhatsApp",
      "One click, no sign-up",
      "Real-time photos",
      "Forever keepsake",
    ],
    ctaBlock: "Start today, free",
    ctaSub: "Your first event ready in 5 minutes",
    ctaBtn: "Create my event",
    trust: [
      "No sign-up required for guests",
      "Works on any device",
      "Photos in real time",
      "Digital album at the end",
    ],
    copy: "© 2026 · Your event, your story",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    back: "Back",
    chooseAction: "What would you like to do?",
    or: "or",
  },
};

// ─── Favicon SVG ─────────────────────────────────────────────────────────────
function FaviconInjector() {
  useEffect(() => {
    const existingLinks = document.querySelectorAll(
      "link[rel~='icon'], link[rel~='shortcut']",
    );
    existingLinks.forEach((el) => el.parentNode?.removeChild(el));
    const svgFavicon = `
<svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="f-bg" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1A3A38"/>
      <stop offset="100%" stop-color="#0F2422"/>
    </linearGradient>
    <linearGradient id="f-rib" x1="10" y1="28" x2="46" y2="28" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#3AADA0"/>
      <stop offset="100%" stop-color="#2DC4A8"/>
    </linearGradient>
  </defs>
  <rect width="56" height="56" rx="16" fill="url(#f-bg)"/>
  <rect x="3" y="3" width="50" height="50" rx="14" fill="none" stroke="rgba(58,173,160,0.18)" stroke-width="1"/>
  <rect x="9" y="17" width="38" height="26" rx="3.5" fill="rgba(58,173,160,0.10)" stroke="rgba(58,173,160,0.6)" stroke-width="1.4"/>
  <path d="M9 20.5 L28 31 L47 20.5" stroke="url(#f-rib)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="14" cy="11" r="1.6" fill="#3AADA0" opacity="0.9"/>
  <circle cx="20" cy="9" r="1.1" fill="#2DC4A8" opacity="0.7"/>
  <circle cx="11" cy="15" r="0.9" fill="#3AADA0" opacity="0.5"/>
  <circle cx="42" cy="11" r="1.6" fill="#3AADA0" opacity="0.9"/>
  <circle cx="36" cy="9" r="1.1" fill="#2DC4A8" opacity="0.7"/>
  <circle cx="45" cy="15" r="0.9" fill="#3AADA0" opacity="0.5"/>
  <path d="M28 7 L29 10.2 L32.4 10.2 L29.8 12.2 L30.8 15.4 L28 13.4 L25.2 15.4 L26.2 12.2 L23.6 10.2 L27 10.2 Z" fill="#3AADA0" opacity="0.95"/>
  <path d="M24 17 Q28 14 32 17" stroke="#2DC4A8" stroke-width="1.3" stroke-linecap="round" fill="none" opacity="0.8"/>
  <circle cx="28" cy="17" r="1.3" fill="#3AADA0"/>
</svg>`.trim();
    const encoded = encodeURIComponent(svgFavicon);
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = `data:image/svg+xml,${encoded}`;
    document.head.appendChild(link);
  }, []);
  return null;
}

// ─── Logo ────────────────────────────────────────────────────────────────────
function AppLogo({
  size = 44,
  dark = false,
}: {
  size?: number;
  dark?: boolean;
}) {
  const id = dark ? "lg-d" : "lg-l";
  const id2 = dark ? "lg2-d" : "lg2-l";
  const id3 = dark ? "lg3-d" : "lg3-l";
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
          id={id}
          x1="0"
          y1="0"
          x2="56"
          y2="56"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={dark ? "#1A3A38" : "#0D2E2B"} />
          <stop offset="100%" stopColor={dark ? "#0F2422" : "#061918"} />
        </linearGradient>
        <linearGradient
          id={id2}
          x1="10"
          y1="28"
          x2="46"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#3AADA0" />
          <stop offset="100%" stopColor="#2DC4A8" />
        </linearGradient>
        <filter id={id3} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <rect width="56" height="56" rx="16" fill={`url(#${id})`} />
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
        stroke={`url(#${id2})`}
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
        filter={`url(#${id3})`}
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

// ─── Floating Particles ───────────────────────────────────────────────────────
function Particles() {
  return (
    <div className="particles" aria-hidden="true">
      {[...Array(12)].map((_, i) => (
        <div key={i} className={`particle particle-${i + 1}`} />
      ))}
    </div>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 18,
        left: 0,
        right: 0,
        textAlign: "center",
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "1.8px",
          textTransform: "uppercase",
          color: "var(--text3)",
          opacity: 0.7,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Humb3rsec 2026
      </span>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function Home() {
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState<"es" | "en">("es");
  const [screen, setScreen] = useState<"splash" | "auth">("splash");
  const [transitioning, setTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    // Trigger mount animations
    setTimeout(() => setMounted(true), 50);
    // Mostrar claro primero, luego cambiar a oscuro
    setTimeout(() => setDark(true), 1800);
  }, []);

  const handleContinue = () => {
    setTransitioning(true);
    setTimeout(() => {
      setScreen("auth");
      setTransitioning(false);
    }, 420);
  };

  const handleBack = () => {
    setTransitioning(true);
    setTimeout(() => {
      setScreen("splash");
      setTransitioning(false);
    }, 420);
  };

  return (
    <>
      <FaviconInjector />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #F0FAF8;
          --bg2: #E4F5F2;
          --surface: #FFFFFF;
          --surface2: #F0FAF8;
          --border: rgba(58,173,160,0.15);
          --accent: #1FA896;
          --accent2: #3AADA0;
          --accent-soft: rgba(58,173,160,0.09);
          --accent-soft2: rgba(58,173,160,0.16);
          --text: #0A1E1C;
          --text2: #3D6E6A;
          --text3: #85B5B0;
          --shadow: 0 4px 32px rgba(58,173,160,0.16);
          --shadow-sm: 0 2px 12px rgba(58,173,160,0.11);
          --radius: 20px;
          --radius-sm: 14px;
          --transition: all 0.38s cubic-bezier(.4,0,.2,1);
        }
        .dark {
          --bg: #0C1A19;
          --bg2: #111F1E;
          --surface: #162422;
          --surface2: #1C2E2C;
          --border: rgba(58,173,160,0.15);
          --accent: #3AADA0;
          --accent2: #2DC4A8;
          --accent-soft: rgba(58,173,160,0.12);
          --accent-soft2: rgba(58,173,160,0.20);
          --text: #E8F8F5;
          --text2: #7ABFBA;
          --text3: #3D7070;
          --shadow: 0 4px 32px rgba(0,0,0,0.48);
          --shadow-sm: 0 2px 12px rgba(0,0,0,0.32);
        }

        body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); }

        .app {
          max-width: 420px; margin: 0 auto; min-height: 100vh;
          background: var(--bg); position: relative; overflow: hidden;
        }

        .app::before {
          content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          opacity: 0.4;
        }

        /* ── GLOWS ── */
        .glow {
          position: fixed; pointer-events: none; z-index: 0;
          border-radius: 50%; filter: blur(80px);
          transition: var(--transition);
        }
        .glow-1 {
          width: 340px; height: 340px;
          top: -100px; right: -80px;
          background: radial-gradient(circle, rgba(58,173,160,0.18) 0%, transparent 70%);
          animation: glowDrift1 8s ease-in-out infinite;
        }
        .glow-2 {
          width: 280px; height: 280px;
          bottom: 60px; left: -100px;
          background: radial-gradient(circle, rgba(45,196,168,0.12) 0%, transparent 70%);
          animation: glowDrift2 10s ease-in-out infinite;
        }
        .dark .glow-1 { background: radial-gradient(circle, rgba(58,173,160,0.20) 0%, transparent 70%); }
        .dark .glow-2 { background: radial-gradient(circle, rgba(45,196,168,0.13) 0%, transparent 70%); }

        @keyframes glowDrift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(-20px, 30px) scale(1.08); }
          66%       { transform: translate(15px, -20px) scale(0.95); }
        }
        @keyframes glowDrift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40%       { transform: translate(25px, -35px) scale(1.1); }
          70%       { transform: translate(-10px, 20px) scale(0.92); }
        }

        /* ── CONTROLS ── */
        .controls {
          position: absolute; top: 18px; right: 18px; z-index: 20;
          display: flex; gap: 8px; align-items: center;
        }
        .ctrl-btn {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--surface); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: var(--transition);
          box-shadow: var(--shadow-sm); color: var(--text2);
          font-size: 14px; font-weight: 600;
        }
        .ctrl-btn:hover { background: var(--accent-soft2); color: var(--accent); border-color: var(--accent); }
        .ctrl-lang {
          width: auto; padding: 0 12px;
          border-radius: 20px; font-size: 11px; font-weight: 600;
          letter-spacing: .5px; text-transform: uppercase;
        }

        /* ── SCREEN TRANSITIONS ── */
        .screen {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          transition: opacity 0.38s ease, transform 0.38s cubic-bezier(.4,0,.2,1);
          z-index: 1;
        }
        .screen.exit    { opacity: 0; transform: scale(0.96) translateY(-16px); pointer-events: none; }
        .screen.enter   { opacity: 1; transform: scale(1) translateY(0); }
        .screen.hidden  { opacity: 0; transform: scale(1.04) translateY(16px); pointer-events: none; }

        /* ── SPLASH ── */
        .splash { padding: 40px 32px; text-align: center; }

        /* ── LOGO ── */
        .logo-wrap {
          display: flex; flex-direction: column; align-items: center;
          gap: 16px; margin-bottom: 48px;
        }
        .logo-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 38px; font-weight: 600; letter-spacing: -1px;
          color: var(--text); line-height: 1;
        }
        .logo-tag {
          font-size: 11px; font-weight: 500; letter-spacing: 2px;
          text-transform: uppercase; color: var(--text3);
        }

        /* ── MOUNT ANIMATIONS ── */
        .anim-logo    { opacity: 0; transform: translateY(28px) scale(0.92); }
        .anim-name    { opacity: 0; transform: translateY(18px); }
        .anim-tag     { opacity: 0; transform: translateY(12px); }
        .anim-btn     { opacity: 0; transform: translateY(16px); }
        .anim-features { opacity: 0; transform: translateY(12px); }

        .mounted .anim-logo {
          animation: mountUp 0.7s cubic-bezier(.22,1,.36,1) 0.1s both;
        }
        .mounted .anim-name {
          animation: mountUp 0.6s cubic-bezier(.22,1,.36,1) 0.28s both;
        }
        .mounted .anim-tag {
          animation: mountUp 0.5s cubic-bezier(.22,1,.36,1) 0.4s both;
        }
        .mounted .anim-btn {
          animation: mountUp 0.6s cubic-bezier(.22,1,.36,1) 0.54s both;
        }
        .mounted .anim-features {
          animation: mountUp 0.5s cubic-bezier(.22,1,.36,1) 0.68s both;
        }

        @keyframes mountUp {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── LOGO ANIMATIONS ── */
        .logo-ring {
          position: absolute; border-radius: 50%;
          border: 1.5px solid rgba(58,173,160,0.22);
          animation: ringExpand 2.8s ease-out infinite;
          pointer-events: none;
        }
        .logo-ring-2 { animation-delay: 0.9s; }
        .logo-ring-3 { animation-delay: 1.8s; }

        @keyframes ringExpand {
          0%   { transform: scale(0.85); opacity: 0.7; }
          100% { transform: scale(1.9);  opacity: 0; }
        }

        .logo-container {
          position: relative;
          display: flex; align-items: center; justify-content: center;
          width: 96px; height: 96px;
        }

        .logo-pulse {
          animation: logoPulse 3.5s ease-in-out infinite;
          position: relative; z-index: 2;
          filter: drop-shadow(0 0 18px rgba(58,173,160,0.35));
        }
        .dark .logo-pulse {
          filter: drop-shadow(0 0 22px rgba(58,173,160,0.45));
        }

        @keyframes logoPulse {
          0%, 100% { transform: scale(1);    filter: drop-shadow(0 0 18px rgba(58,173,160,0.35)); }
          50%       { transform: scale(1.05); filter: drop-shadow(0 0 28px rgba(58,173,160,0.55)); }
        }

        /* ── FLOATING PARTICLES ── */
        .particles { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
        .particle {
          position: absolute;
          border-radius: 50%;
          background: var(--accent2);
          opacity: 0;
          animation: particleFloat linear infinite;
        }

        .particle-1  { width:4px;  height:4px;  left:12%;  animation-duration:12s; animation-delay:0s;    opacity:0.18; }
        .particle-2  { width:3px;  height:3px;  left:28%;  animation-duration:15s; animation-delay:2s;    opacity:0.12; }
        .particle-3  { width:5px;  height:5px;  left:45%;  animation-duration:10s; animation-delay:0.5s;  opacity:0.20; }
        .particle-4  { width:2px;  height:2px;  left:60%;  animation-duration:14s; animation-delay:3s;    opacity:0.15; }
        .particle-5  { width:4px;  height:4px;  left:75%;  animation-duration:11s; animation-delay:1s;    opacity:0.18; }
        .particle-6  { width:3px;  height:3px;  left:88%;  animation-duration:16s; animation-delay:4s;    opacity:0.10; }
        .particle-7  { width:5px;  height:5px;  left:20%;  animation-duration:13s; animation-delay:1.5s;  opacity:0.16; }
        .particle-8  { width:2px;  height:2px;  left:38%;  animation-duration:9s;  animation-delay:2.5s;  opacity:0.22; }
        .particle-9  { width:4px;  height:4px;  left:55%;  animation-duration:17s; animation-delay:0.8s;  opacity:0.14; }
        .particle-10 { width:3px;  height:3px;  left:70%;  animation-duration:12s; animation-delay:3.5s;  opacity:0.18; }
        .particle-11 { width:5px;  height:5px;  left:5%;   animation-duration:14s; animation-delay:1.2s;  opacity:0.12; }
        .particle-12 { width:2px;  height:2px;  left:92%;  animation-duration:10s; animation-delay:2.2s;  opacity:0.20; }

        @keyframes particleFloat {
          0%   { transform: translateY(110vh) translateX(0);      opacity: 0; }
          5%   { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-10vh) translateX(30px);   opacity: 0; }
        }

        /* ── FEATURES STRIP ── */
        .features-strip {
          display: flex; gap: 10px; margin-bottom: 36px;
          justify-content: center; flex-wrap: wrap;
        }
        .feat-pill {
          display: flex; align-items: center; gap: 6px;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 100px; padding: 7px 13px;
          font-size: 11px; font-weight: 500; color: var(--text2);
          box-shadow: var(--shadow-sm);
          transition: var(--transition);
          animation: pillAppear 0.5s cubic-bezier(.22,1,.36,1) both;
        }
        .feat-pill:nth-child(1) { animation-delay: 0.72s; }
        .feat-pill:nth-child(2) { animation-delay: 0.80s; }
        .feat-pill:nth-child(3) { animation-delay: 0.88s; }
        .feat-pill:nth-child(4) { animation-delay: 0.96s; }

        .feat-pill:hover {
          background: var(--accent-soft2);
          border-color: var(--accent);
          color: var(--accent);
          transform: translateY(-2px);
        }
        .feat-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--accent2); flex-shrink: 0;
          animation: dotPulse 2s ease-in-out infinite;
        }
        .feat-pill:nth-child(2) .feat-dot { animation-delay: 0.5s; }
        .feat-pill:nth-child(3) .feat-dot { animation-delay: 1s; }
        .feat-pill:nth-child(4) .feat-dot { animation-delay: 1.5s; }

        @keyframes dotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.7); }
        }
        @keyframes pillAppear {
          from { opacity: 0; transform: translateY(10px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── BUTTON ── */
        .btn-main {
          display: inline-flex; align-items: center; gap: 10px;
          background: var(--accent);
          color: white; font-family: 'DM Sans', sans-serif;
          font-size: 15px; font-weight: 600; text-decoration: none;
          padding: 16px 44px; border-radius: 100px; cursor: pointer; border: none;
          box-shadow: 0 6px 32px rgba(58,173,160,0.40);
          transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
          position: relative; overflow: hidden; letter-spacing: .2px;
        }
        .btn-main::after {
          content: '';
          position: absolute; inset: 0; border-radius: inherit;
          background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%);
          pointer-events: none;
        }
        .btn-main::before {
          content: '';
          position: absolute; inset: -2px; border-radius: inherit;
          background: linear-gradient(135deg, rgba(58,173,160,0.6), rgba(45,196,168,0.3));
          z-index: -1; opacity: 0;
          transition: opacity 0.3s ease;
          filter: blur(8px);
        }
        .btn-main:hover::before { opacity: 1; }
        .btn-main:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 14px 44px rgba(58,173,160,0.55); }
        .btn-main:active { transform: scale(0.97); }

        /* Shimmer on button */
        .btn-shimmer {
          position: absolute; inset: 0; border-radius: inherit;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%);
          background-size: 200% 100%;
          animation: shimmer 3s ease-in-out infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        .btn-arrow {
          width: 20px; height: 20px; background: rgba(255,255,255,0.22);
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          transition: transform 0.22s ease;
        }
        .btn-main:hover .btn-arrow { transform: translateX(3px); }

        /* ── AUTH SCREEN ── */
        .auth { padding: 48px 32px; width: 100%; }
        .auth-header {
          display: flex; flex-direction: column; align-items: center;
          margin-bottom: 40px; gap: 10px;
          animation: fadeUp .4s ease both;
        }
        .auth-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px; font-weight: 600; color: var(--text);
          text-align: center; letter-spacing: -.4px;
        }

        .auth-cards {
          display: flex; flex-direction: column; gap: 14px;
          animation: fadeUp .4s .08s ease both;
        }
        .auth-card {
          display: flex; align-items: center; justify-content: space-between;
          background: var(--surface); border: 1.5px solid var(--border);
          border-radius: var(--radius); padding: 22px 24px;
          text-decoration: none; transition: var(--transition);
          box-shadow: var(--shadow-sm);
        }
        .auth-card:hover {
          border-color: var(--accent); transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(58,173,160,0.18);
        }
        .auth-card.primary {
          background: var(--accent);
          border-color: transparent;
          box-shadow: 0 6px 28px rgba(58,173,160,0.38);
        }
        .auth-card.primary:hover {
          background: var(--accent2); border-color: transparent;
          box-shadow: 0 10px 36px rgba(58,173,160,0.48);
        }
        .auth-card-left { display: flex; flex-direction: column; gap: 3px; }
        .auth-card-label { font-size: 15px; font-weight: 600; color: var(--text); }
        .auth-card.primary .auth-card-label,
        .auth-card.primary .auth-card-sub { color: white; }
        .auth-card-sub { font-size: 12px; color: var(--text3); font-weight: 400; }
        .auth-card-icon {
          width: 38px; height: 38px; border-radius: 12px;
          background: var(--accent-soft2); display: flex; align-items: center;
          justify-content: center; color: var(--accent); flex-shrink: 0;
        }
        .auth-card.primary .auth-card-icon { background: rgba(255,255,255,0.2); color: white; }

        .back-btn {
          display: flex; align-items: center; gap: 6px;
          background: none; border: none; cursor: pointer;
          font-size: 13px; font-weight: 500; color: var(--text2);
          margin-top: 28px; padding: 8px 0; text-decoration: none;
          transition: color .2s;
          animation: fadeUp .4s .16s ease both;
        }
        .back-btn:hover { color: var(--accent); }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className={`app${dark ? " dark" : ""}${mounted ? " mounted" : ""}`}>
        {/* Ambient glows */}
        <div className="glow glow-1" />
        <div className="glow glow-2" />

        {/* Floating particles */}
        <Particles />

        {/* Controls */}
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

        {/* ── SPLASH SCREEN ── */}
        <div
          className={`screen splash ${screen === "splash" ? (transitioning ? "exit" : "enter") : "hidden"}`}
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {/* Logo con anillos + glow */}
          <div className="logo-wrap">
            <div className="logo-container anim-logo">
              {/* Ripple rings */}
              <div
                className="logo-ring"
                style={{ width: "80px", height: "80px" }}
              />
              <div
                className="logo-ring logo-ring-2"
                style={{ width: "80px", height: "80px" }}
              />
              <div
                className="logo-ring logo-ring-3"
                style={{ width: "80px", height: "80px" }}
              />
              {/* Logo pulsante */}
              <div className="logo-pulse">
                <AppLogo size={72} dark={dark} />
              </div>
            </div>

            <div>
              <div className="logo-name anim-name">Events</div>
              <div className="logo-tag anim-tag">{t.tagline}</div>
            </div>
          </div>

          {/* Feature pills */}
          <div className="features-strip anim-features">
            {t.features.map((f, i) => (
              <div key={i} className="feat-pill">
                <div className="feat-dot" />
                {f}
              </div>
            ))}
          </div>

          {/* CTA button */}
          <div className="anim-btn">
            <button className="btn-main" onClick={handleContinue}>
              <span className="btn-shimmer" />
              {t.cta}
              <span className="btn-arrow">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2 5h6M5.5 2.5L8 5l-2.5 2.5"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          </div>

          <Footer />
        </div>

        {/* ── AUTH SCREEN ── */}
        <div
          className={`screen auth ${screen === "auth" ? (transitioning ? "exit" : "enter") : "hidden"}`}
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="auth-header">
            <AppLogo size={44} dark={dark} />
            <div className="auth-title">{t.chooseAction}</div>
          </div>

          <div className="auth-cards" style={{ width: "100%", maxWidth: 340 }}>
            <Link href="/auth/registro" className="auth-card primary">
              <div className="auth-card-left">
                <span className="auth-card-label">{t.register}</span>
                <span className="auth-card-sub">
                  {lang === "es" ? "Nuevo en Events" : "New to Events"}
                </span>
              </div>
              <div className="auth-card-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle
                    cx="9"
                    cy="6"
                    r="3.2"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                  <path
                    d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M13 3v4M11 5h4"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </Link>

            <Link href="/auth/login" className="auth-card">
              <div className="auth-card-left">
                <span className="auth-card-label">{t.login}</span>
                <span className="auth-card-sub">
                  {lang === "es"
                    ? "Ya tengo cuenta"
                    : "I already have an account"}
                </span>
              </div>
              <div className="auth-card-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle
                    cx="9"
                    cy="6"
                    r="3.2"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                  <path
                    d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </Link>
          </div>

          <button className="back-btn" onClick={handleBack}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M9 2L4 7l5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t.back}
          </button>

          <Footer />
        </div>
      </div>
    </>
  );
}
