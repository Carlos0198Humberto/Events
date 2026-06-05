// ─── Logo compartido de Eventix ───────────────────────────────────────────────
// Letra "E" con puntos decorativos — se usa en todas las páginas de la app

export function AppLogo({ size = 32 }: { size?: number }) {
  const uid = `evx-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#312E81" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
      </defs>

      {/* Fondo */}
      <rect width="64" height="64" rx="18" fill={`url(#${uid})`} />
      <rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" />

      {/* Letra E — barra vertical */}
      <rect x="13" y="14" width="6" height="36" rx="3" fill="#FFFFFF" />
      {/* Letra E — barra superior */}
      <rect x="13" y="14" width="24" height="6" rx="3" fill="#FFFFFF" />
      {/* Letra E — barra media */}
      <rect x="13" y="29" width="18" height="6" rx="3" fill="#FFFFFF" />
      {/* Letra E — barra inferior */}
      <rect x="13" y="44" width="24" height="6" rx="3" fill="#FFFFFF" />

      {/* Puntos decorativos */}
      <circle cx="48" cy="19" r="3" fill="#E0E7FF" />
      <circle cx="48" cy="19" r="1.4" fill="#FFFFFF" />
      <circle cx="47" cy="46" r="2.5" fill="#FFFFFF" opacity="0.7" />
    </svg>
  );
}
