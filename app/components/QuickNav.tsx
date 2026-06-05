"use client";
import React from "react";
import Link from "next/link";

type Page = "invitados" | "muro" | "mesas" | "libro" | "scanner" | "configurar";

interface QuickNavProps {
  eventoId: string;
  active: Page;
  topOffset?: number;
}

export function QuickNav({ eventoId, active, topOffset = 56 }: QuickNavProps) {
  const links: { key: Page; label: string; href: string; icon: React.ReactNode }[] = [
    {
      key: "invitados",
      label: "Invitados",
      href: `/eventos/${eventoId}/invitados`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
        </svg>
      ),
    },
    {
      key: "muro",
      label: "Muro",
      href: `/muro/${eventoId}`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 9h18M9 21V9"/>
        </svg>
      ),
    },
    {
      key: "mesas",
      label: "Mesas",
      href: `/eventos/${eventoId}/mesas`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
      ),
    },
    {
      key: "libro",
      label: "Libro",
      href: `/libro/${eventoId}`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
        </svg>
      ),
    },
    {
      key: "scanner",
      label: "Escáner",
      href: `/eventos/${eventoId}/scanner`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 9V6a2 2 0 012-2h3M15 4h3a2 2 0 012 2v3M21 15v3a2 2 0 01-2 2h-3M9 20H6a2 2 0 01-2-2v-3M7 12h10"/>
        </svg>
      ),
    },
    {
      key: "configurar",
      label: "Config",
      href: `/eventos/${eventoId}/configurar`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
      ),
    },
  ];

  return (
    <>
      <style>{`
        .qnav {
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(79,70,229,0.14);
          padding: 0 10px;
          position: sticky;
          top: var(--qnav-top, 56px);
          z-index: 25;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          display: flex;
          align-items: stretch;
          gap: 0;
          box-shadow: 0 2px 8px rgba(79,70,229,0.05);
        }
        .qnav::-webkit-scrollbar { display: none; }
        .qnav-back {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          padding: 8px 12px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.3px;
          color: #64748B;
          text-decoration: none;
          white-space: nowrap;
          border-right: 1px solid rgba(79,70,229,0.12);
          margin-right: 4px;
          padding-right: 14px;
          transition: color .2s;
          flex-shrink: 0;
          font-family: 'DM Sans', sans-serif;
          -webkit-tap-highlight-color: transparent;
        }
        .qnav-back:hover { color: #4F46E5; }
        .qnav-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          padding: 8px 13px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.3px;
          color: #64748B;
          text-decoration: none;
          white-space: nowrap;
          border-bottom: 2px solid transparent;
          transition: color .2s, border-color .2s;
          -webkit-tap-highlight-color: transparent;
          flex-shrink: 0;
          font-family: 'DM Sans', sans-serif;
        }
        .qnav-link:hover { color: #4F46E5; }
        .qnav-link.qnav-active {
          color: #4F46E5;
          border-bottom-color: #4F46E5;
        }
        .qnav-link svg { flex-shrink: 0; }
        @media (max-width: 380px) {
          .qnav-link { padding: 8px 10px; font-size: 9.5px; }
          .qnav-back { padding: 8px 10px 8px 6px; font-size: 9.5px; }
        }
      `}</style>
      <nav className="qnav" style={{ "--qnav-top": `${topOffset}px` } as React.CSSProperties}>
        <Link href="/dashboard" className="qnav-back">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Dashboard
        </Link>
        {links.map((l) => (
          <Link
            key={l.key}
            href={l.href}
            className={`qnav-link${active === l.key ? " qnav-active" : ""}`}
          >
            {l.icon}
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
