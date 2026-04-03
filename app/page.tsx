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
    back: "Back",
    chooseAction: "What would you like to do?",
    or: "or",
  },
};

// ─── Favicon + Tab Title ──────────────────────────────────────────────────────
function FaviconInjector() {
  useEffect(() => {
    // Set tab title
    document.title = "Eventix";

    // Remove existing favicons
    const existingLinks = document.querySelectorAll(
      "link[rel~='icon'], link[rel~='shortcut']",
    );
    existingLinks.forEach((el) => el.parentNode?.removeChild(el));

    // New Eventix favicon — teal "X" spark mark on dark teal background
    const svgFavicon = `
<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="18" fill="#0D9488"/>
  <rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>
  <!-- Spark / X mark -->
  <path d="M20 18 L32 32 L20 46" stroke="white" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M44 18 L32 32 L44 46" stroke="rgba(255,255,255,0.45)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <!-- Center dot -->
  <circle cx="32" cy="32" r="3.5" fill="white"/>
  <!-- Subtle corner accents -->
  <circle cx="18" cy="14" r="2" fill="rgba(255,255,255,0.35)"/>
  <circle cx="46" cy="14" r="2" fill="rgba(255,255,255,0.25)"/>
  <circle cx="18" cy="50" r="2" fill="rgba(255,255,255,0.25)"/>
  <circle cx="46" cy="50" r="2" fill="rgba(255,255,255,0.35)"/>
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
          id="evx-bg"
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
          id="evx-glow"
          x1="12"
          y1="20"
          x2="52"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#5EEAD4" />
          <stop offset="100%" stopColor="#2DD4BF" />
        </linearGradient>
        <filter id="evx-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="3"
            floodColor="rgba(13,148,136,0.4)"
          />
        </filter>
      </defs>
      {/* Background */}
      <rect
        width="64"
        height="64"
        rx="18"
        fill="url(#evx-bg)"
        filter="url(#evx-shadow)"
      />
      {/* Inner border */}
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
      {/* Left chevron / X left arm */}
      <path
        d="M18 17 L30 32 L18 47"
        stroke="url(#evx-glow)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Right chevron / X right arm — muted */}
      <path
        d="M46 17 L34 32 L46 47"
        stroke="rgba(255,255,255,0.38)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Center spark dot */}
      <circle cx="32" cy="32" r="4" fill="white" opacity="0.95" />
      {/* Tiny star accents */}
      <circle cx="17" cy="13" r="2" fill="#5EEAD4" opacity="0.8" />
      <circle cx="47" cy="13" r="1.5" fill="#5EEAD4" opacity="0.5" />
      <circle cx="47" cy="51" r="2" fill="#5EEAD4" opacity="0.8" />
      <circle cx="17" cy="51" r="1.5" fill="#5EEAD4" opacity="0.5" />
    </svg>
  );
}

// ─── Floating Particles ───────────────────────────────────────────────────────
function Particles() {
  return (
    <div className="particles" aria-hidden="true">
      {[...Array(10)].map((_, i) => (
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
        bottom: 14,
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
          letterSpacing: "1.6px",
          textTransform: "uppercase",
          color: "var(--text3)",
          opacity: 0.65,
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
  const [lang, setLang] = useState<"es" | "en">("es");
  const [screen, setScreen] = useState<"splash" | "auth">("splash");
  const [transitioning, setTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
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
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:           #F0FAF9;
          --bg2:          #E0F5F2;
          --surface:      #FFFFFF;
          --surface2:     #F7FDFB;
          --border:       rgba(13,148,136,0.14);
          --border-hover: rgba(13,148,136,0.40);
          --accent:       #0D9488;
          --accent2:      #0F766E;
          --accent-light: #5EEAD4;
          --accent-soft:  rgba(13,148,136,0.08);
          --accent-soft2: rgba(13,148,136,0.14);
          --text:         #0C1A19;
          --text2:        #2D6E68;
          --text3:        #7ABFBA;
          --shadow:       0 4px 28px rgba(13,148,136,0.13);
          --shadow-sm:    0 2px 10px rgba(13,148,136,0.09);
          --shadow-btn:   0 6px 28px rgba(13,148,136,0.38);
          --radius:       20px;
          --radius-sm:    14px;
          --transition:   all 0.36s cubic-bezier(.4,0,.2,1);
        }

        html, body {
          height: 100%;
          background: var(--bg);
          font-family: 'DM Sans', sans-serif;
          color: var(--text);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Noise texture overlay */
        body::before {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
          opacity: 0.5;
        }

        .app {
          width: 100%;
          max-width: 430px;
          margin: 0 auto;
          min-height: 100vh;
          min-height: 100dvh;
          background: var(--bg);
          position: relative;
          overflow: hidden;
        }

        /* ── GLOWS ── */
        .glow {
          position: fixed; pointer-events: none; z-index: 0;
          border-radius: 50%; filter: blur(90px);
        }
        .glow-1 {
          width: 320px; height: 320px;
          top: -80px; right: -60px;
          background: radial-gradient(circle, rgba(13,148,136,0.16) 0%, transparent 70%);
          animation: glowDrift1 9s ease-in-out infinite;
        }
        .glow-2 {
          width: 260px; height: 260px;
          bottom: 80px; left: -80px;
          background: radial-gradient(circle, rgba(94,234,212,0.11) 0%, transparent 70%);
          animation: glowDrift2 11s ease-in-out infinite;
        }
        .glow-3 {
          width: 180px; height: 180px;
          bottom: -40px; right: 20px;
          background: radial-gradient(circle, rgba(13,148,136,0.08) 0%, transparent 70%);
          animation: glowDrift1 13s ease-in-out infinite reverse;
        }

        @keyframes glowDrift1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(-18px,28px) scale(1.07); }
          66%      { transform: translate(14px,-18px) scale(0.95); }
        }
        @keyframes glowDrift2 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(22px,-30px) scale(1.09); }
          70%      { transform: translate(-8px,18px) scale(0.93); }
        }

        /* ── CONTROLS ── */
        .controls {
          position: absolute; top: 16px; right: 16px; z-index: 20;
          display: flex; gap: 8px; align-items: center;
        }
        .ctrl-btn {
          height: 36px; border-radius: 100px;
          background: var(--surface);
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: var(--transition);
          box-shadow: var(--shadow-sm); color: var(--text2);
          font-size: 11px; font-weight: 600; letter-spacing: .5px;
          text-transform: uppercase; padding: 0 14px;
          font-family: 'DM Sans', sans-serif;
        }
        .ctrl-btn:hover {
          background: var(--accent-soft2);
          color: var(--accent);
          border-color: var(--border-hover);
        }

        /* ── SCREEN TRANSITIONS ── */
        .screen {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          transition: opacity 0.38s ease, transform 0.38s cubic-bezier(.4,0,.2,1);
          z-index: 1;
          padding: 0 24px;
          min-height: 100vh;
          min-height: 100dvh;
        }
        .screen.exit   { opacity: 0; transform: scale(0.96) translateY(-14px); pointer-events: none; }
        .screen.enter  { opacity: 1; transform: scale(1) translateY(0); }
        .screen.hidden { opacity: 0; transform: scale(1.03) translateY(14px); pointer-events: none; }

        /* ── MOUNT ANIMATIONS ── */
        .anim-logo     { opacity: 0; transform: translateY(30px) scale(0.9); }
        .anim-name     { opacity: 0; transform: translateY(18px); }
        .anim-tag      { opacity: 0; transform: translateY(12px); }
        .anim-btn      { opacity: 0; transform: translateY(16px); }
        .anim-features { opacity: 0; transform: translateY(12px); }

        .mounted .anim-logo     { animation: mountUp 0.7s cubic-bezier(.22,1,.36,1) 0.1s  both; }
        .mounted .anim-name     { animation: mountUp 0.6s cubic-bezier(.22,1,.36,1) 0.26s both; }
        .mounted .anim-tag      { animation: mountUp 0.5s cubic-bezier(.22,1,.36,1) 0.38s both; }
        .mounted .anim-btn      { animation: mountUp 0.6s cubic-bezier(.22,1,.36,1) 0.52s both; }
        .mounted .anim-features { animation: mountUp 0.5s cubic-bezier(.22,1,.36,1) 0.66s both; }

        @keyframes mountUp {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }

        /* ── SPLASH ── */
        .splash { text-align: center; gap: 0; }

        /* ── LOGO SECTION ── */
        .logo-wrap {
          display: flex; flex-direction: column; align-items: center;
          gap: 18px; margin-bottom: 40px;
        }
        .logo-container {
          position: relative;
          display: flex; align-items: center; justify-content: center;
          width: 100px; height: 100px;
        }
        .logo-ring {
          position: absolute; border-radius: 50%;
          border: 1.5px solid rgba(13,148,136,0.18);
          animation: ringExpand 3s ease-out infinite;
          pointer-events: none;
        }
        .logo-ring-2 { animation-delay: 1s; }
        .logo-ring-3 { animation-delay: 2s; }

        @keyframes ringExpand {
          0%   { transform: scale(0.82); opacity: 0.7; }
          100% { transform: scale(2.0);  opacity: 0; }
        }

        .logo-pulse {
          position: relative; z-index: 2;
          animation: logoPulse 3.5s ease-in-out infinite;
          filter: drop-shadow(0 4px 20px rgba(13,148,136,0.30));
        }
        @keyframes logoPulse {
          0%,100% { transform: scale(1);    filter: drop-shadow(0 4px 20px rgba(13,148,136,0.30)); }
          50%      { transform: scale(1.04); filter: drop-shadow(0 6px 28px rgba(13,148,136,0.48)); }
        }

        .logo-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 42px; font-weight: 600; letter-spacing: -1.5px;
          color: var(--text); line-height: 1;
        }
        .logo-name span {
          color: var(--accent);
        }
        .logo-tag {
          font-size: 10.5px; font-weight: 500; letter-spacing: 2.2px;
          text-transform: uppercase; color: var(--text3);
          margin-top: 4px;
        }

        /* ── FEATURES STRIP ── */
        .features-strip {
          display: flex; gap: 8px; margin-bottom: 36px;
          justify-content: center; flex-wrap: wrap;
          max-width: 340px;
        }
        .feat-pill {
          display: flex; align-items: center; gap: 6px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 100px; padding: 7px 13px;
          font-size: 11px; font-weight: 500; color: var(--text2);
          box-shadow: var(--shadow-sm);
          transition: var(--transition);
        }
        .feat-pill:nth-child(1) { animation: pillAppear .5s .72s both; }
        .feat-pill:nth-child(2) { animation: pillAppear .5s .80s both; }
        .feat-pill:nth-child(3) { animation: pillAppear .5s .88s both; }
        .feat-pill:nth-child(4) { animation: pillAppear .5s .96s both; }
        .feat-pill:hover {
          background: var(--accent-soft2);
          border-color: var(--border-hover);
          color: var(--accent);
          transform: translateY(-2px);
        }
        .feat-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--accent-light); flex-shrink: 0;
          animation: dotPulse 2s ease-in-out infinite;
        }
        .feat-pill:nth-child(2) .feat-dot { animation-delay: 0.5s; }
        .feat-pill:nth-child(3) .feat-dot { animation-delay: 1s; }
        .feat-pill:nth-child(4) .feat-dot { animation-delay: 1.5s; }

        @keyframes dotPulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(0.65); }
        }
        @keyframes pillAppear {
          from { opacity: 0; transform: translateY(10px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── CTA BUTTON ── */
        .btn-main {
          display: inline-flex; align-items: center; gap: 10px;
          background: var(--accent);
          color: white; font-family: 'DM Sans', sans-serif;
          font-size: 15px; font-weight: 600;
          padding: 17px 48px; border-radius: 100px;
          cursor: pointer; border: none;
          box-shadow: var(--shadow-btn);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
          position: relative; overflow: hidden;
          letter-spacing: .3px;
          -webkit-tap-highlight-color: transparent;
        }
        .btn-main::after {
          content: '';
          position: absolute; inset: 0; border-radius: inherit;
          background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 55%);
          pointer-events: none;
        }
        .btn-shimmer {
          position: absolute; inset: 0; border-radius: inherit;
          background: linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.22) 50%, transparent 62%);
          background-size: 200% 100%;
          animation: shimmer 3.5s ease-in-out infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .btn-main:hover  { transform: translateY(-2px) scale(1.02); box-shadow: 0 12px 40px rgba(13,148,136,0.48); }
        .btn-main:active { transform: scale(0.97); }

        .btn-arrow {
          width: 22px; height: 22px;
          background: rgba(255,255,255,0.22);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.22s ease; flex-shrink: 0;
        }
        .btn-main:hover .btn-arrow { transform: translateX(3px); }

        /* ── FLOATING PARTICLES ── */
        .particles { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
        .particle {
          position: absolute; border-radius: 50%;
          background: var(--accent-light); opacity: 0;
          animation: particleFloat linear infinite;
        }
        .particle-1  { width:4px;  height:4px;  left:10%;  animation-duration:13s; animation-delay:0s;   opacity:.15; }
        .particle-2  { width:3px;  height:3px;  left:27%;  animation-duration:16s; animation-delay:2.2s; opacity:.10; }
        .particle-3  { width:5px;  height:5px;  left:44%;  animation-duration:11s; animation-delay:0.6s; opacity:.18; }
        .particle-4  { width:2px;  height:2px;  left:61%;  animation-duration:14s; animation-delay:3.1s; opacity:.13; }
        .particle-5  { width:4px;  height:4px;  left:76%;  animation-duration:12s; animation-delay:1.1s; opacity:.15; }
        .particle-6  { width:3px;  height:3px;  left:89%;  animation-duration:17s; animation-delay:4.0s; opacity:.09; }
        .particle-7  { width:5px;  height:5px;  left:19%;  animation-duration:10s; animation-delay:1.7s; opacity:.14; }
        .particle-8  { width:2px;  height:2px;  left:37%;  animation-duration:9s;  animation-delay:2.7s; opacity:.20; }
        .particle-9  { width:4px;  height:4px;  left:54%;  animation-duration:15s; animation-delay:0.9s; opacity:.12; }
        .particle-10 { width:3px;  height:3px;  left:71%;  animation-duration:11s; animation-delay:3.8s; opacity:.16; }

        @keyframes particleFloat {
          0%   { transform: translateY(105vh) translateX(0);    opacity: 0; }
          5%   { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-8vh) translateX(25px);  opacity: 0; }
        }

        /* ── AUTH SCREEN ── */
        .auth-inner {
          width: 100%;
          max-width: 360px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .auth-header {
          display: flex; flex-direction: column; align-items: center;
          margin-bottom: 36px; gap: 12px;
          animation: fadeUp .4s ease both;
        }
        .auth-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px; font-weight: 600; color: var(--text);
          text-align: center; letter-spacing: -.5px;
          line-height: 1.15;
        }

        .auth-cards {
          display: flex; flex-direction: column; gap: 12px;
          width: 100%;
          animation: fadeUp .4s .08s ease both;
        }
        .auth-card {
          display: flex; align-items: center; justify-content: space-between;
          background: var(--surface); border: 1.5px solid var(--border);
          border-radius: var(--radius); padding: 20px 22px;
          text-decoration: none; transition: var(--transition);
          box-shadow: var(--shadow-sm);
          -webkit-tap-highlight-color: transparent;
        }
        .auth-card:hover {
          border-color: var(--border-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(13,148,136,0.16);
        }
        .auth-card.primary {
          background: var(--accent);
          border-color: transparent;
          box-shadow: var(--shadow-btn);
        }
        .auth-card.primary:hover {
          background: var(--accent2);
          border-color: transparent;
          box-shadow: 0 10px 36px rgba(13,148,136,0.48);
        }
        .auth-card-left { display: flex; flex-direction: column; gap: 3px; }
        .auth-card-label { font-size: 15px; font-weight: 600; color: var(--text); }
        .auth-card.primary .auth-card-label,
        .auth-card.primary .auth-card-sub { color: white; }
        .auth-card-sub { font-size: 12px; color: var(--text3); font-weight: 400; }
        .auth-card-icon {
          width: 40px; height: 40px; border-radius: 13px;
          background: var(--accent-soft2);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent); flex-shrink: 0;
          transition: var(--transition);
        }
        .auth-card.primary .auth-card-icon { background: rgba(255,255,255,0.2); color: white; }
        .auth-card:hover .auth-card-icon { background: var(--accent-soft2); }

        .back-btn {
          display: flex; align-items: center; gap: 6px;
          background: none; border: none; cursor: pointer;
          font-size: 13px; font-weight: 500; color: var(--text2);
          margin-top: 26px; padding: 8px 4px; text-decoration: none;
          transition: color .2s;
          animation: fadeUp .4s .16s ease both;
          font-family: 'DM Sans', sans-serif;
          -webkit-tap-highlight-color: transparent;
        }
        .back-btn:hover { color: var(--accent); }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── SAFE AREA (notch / home indicator) ── */
        .screen { padding-bottom: max(24px, env(safe-area-inset-bottom)); }

        @media (max-height: 680px) {
          .logo-wrap     { margin-bottom: 28px; }
          .features-strip { margin-bottom: 24px; }
          .logo-name     { font-size: 36px; }
          .logo-container { width: 84px; height: 84px; }
          .auth-header   { margin-bottom: 26px; }
        }
      `}</style>

      <div className={`app${mounted ? " mounted" : ""}`}>
        {/* Ambient glows */}
        <div className="glow glow-1" />
        <div className="glow glow-2" />
        <div className="glow glow-3" />

        {/* Floating particles */}
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

        {/* ── SPLASH SCREEN ── */}
        <div
          className={`screen splash ${
            screen === "splash" ? (transitioning ? "exit" : "enter") : "hidden"
          }`}
        >
          {/* Logo */}
          <div className="logo-wrap">
            <div className="logo-container anim-logo">
              <div
                className="logo-ring"
                style={{ width: "86px", height: "86px" }}
              />
              <div
                className="logo-ring logo-ring-2"
                style={{ width: "86px", height: "86px" }}
              />
              <div
                className="logo-ring logo-ring-3"
                style={{ width: "86px", height: "86px" }}
              />
              <div className="logo-pulse">
                <AppLogo size={76} />
              </div>
            </div>

            <div>
              <div className="logo-name anim-name">
                Event<span>ix</span>
              </div>
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
                    strokeWidth="1.6"
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
          className={`screen ${
            screen === "auth" ? (transitioning ? "exit" : "enter") : "hidden"
          }`}
        >
          <div className="auth-inner">
            <div className="auth-header">
              <AppLogo size={48} />
              <div className="auth-title">{t.chooseAction}</div>
            </div>

            <div className="auth-cards">
              <Link href="/auth/registro" className="auth-card primary">
                <div className="auth-card-left">
                  <span className="auth-card-label">{t.register}</span>
                  <span className="auth-card-sub">
                    {lang === "es" ? "Nuevo en Eventix" : "New to Eventix"}
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
          </div>

          <Footer />
        </div>
      </div>
    </>
  );
}
