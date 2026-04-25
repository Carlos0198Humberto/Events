"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type PrimaryTab = "invitados" | "muro" | "mesas" | "configurar";

interface BottomNavProps {
  eventoId: string;
  /** Pestaña activa. Si no se pasa, se detecta automáticamente por pathname. */
  active?: PrimaryTab;
}

// ─── Iconos (inline SVG — sin dependencias externas) ──────────────────────────

function IconUsers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function IconPhoto() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function IconTable() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function IconScan() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9V6a2 2 0 012-2h3M15 4h3a2 2 0 012 2v3M21 15v3a2 2 0 01-2 2h-3M9 20H6a2 2 0 01-2-2v-3M7 12h10" />
    </svg>
  );
}

function IconHome() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Detecta la pestaña activa leyendo el pathname actual. */
function detectActiveTab(pathname: string, eventoId: string): PrimaryTab {
  if (pathname.includes(`/eventos/${eventoId}/configurar`)) return "configurar";
  if (pathname.includes(`/eventos/${eventoId}/mesas`))     return "mesas";
  if (pathname.includes(`/muro/${eventoId}`))              return "muro";
  // invitados es el fallback — también es la ruta del dashboard de evento
  return "invitados";
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function BottomNav({ eventoId, active: activeProp }: BottomNavProps) {
  const pathname = usePathname();
  const active = activeProp ?? detectActiveTab(pathname, eventoId);

  const primaryTabs = [
    {
      key: "invitados" as PrimaryTab,
      label: "Invitados",
      href: `/eventos/${eventoId}/invitados`,
      icon: <IconUsers />,
    },
    {
      key: "muro" as PrimaryTab,
      label: "Muro",
      href: `/muro/${eventoId}`,
      icon: <IconPhoto />,
    },
    {
      key: "mesas" as PrimaryTab,
      label: "Mesas",
      href: `/eventos/${eventoId}/mesas`,
      icon: <IconTable />,
    },
    {
      key: "configurar" as PrimaryTab,
      label: "Ajustes",
      href: `/eventos/${eventoId}/configurar`,
      icon: <IconSettings />,
    },
  ];

  const secondaryChips = [
    {
      key: "libro",
      label: "Libro",
      href: `/libro/${eventoId}`,
      icon: <IconBook />,
    },
    {
      key: "agradecimientos",
      label: "Gracias",
      href: `/eventos/${eventoId}/agradecimientos`,
      icon: <IconHeart />,
    },
    {
      key: "scanner",
      label: "Escáner",
      href: `/eventos/${eventoId}/scanner`,
      icon: <IconScan />,
    },
  ];

  return (
    <>
      {/* ── Secondary strip (Inicio / Libro / Gracias / Escáner) ── */}
      <nav className="ev-secondary-strip" aria-label="Acciones secundarias">
        {/* Dashboard home — siempre visible */}
        <Link
          href="/dashboard"
          className="ev-secondary-chip"
          aria-label="Dashboard"
        >
          <IconHome />
          Inicio
        </Link>
        <div className="ev-strip-separator" aria-hidden="true" />
        {secondaryChips.map((chip) => (
          <Link
            key={chip.key}
            href={chip.href}
            className="ev-secondary-chip"
            data-active={pathname.includes(chip.key) ? "true" : undefined}
            aria-label={chip.label}
          >
            {chip.icon}
            {chip.label}
          </Link>
        ))}
      </nav>

      {/* ── Primary bottom tab bar ── */}
      <nav className="ev-bottom-nav" aria-label="Navegación principal">
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            height: "var(--bottom-nav-height)",
          }}
        >
          {primaryTabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className="ev-nav-tab"
              data-active={active === tab.key ? "true" : undefined}
              aria-label={tab.label}
              aria-current={active === tab.key ? "page" : undefined}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
