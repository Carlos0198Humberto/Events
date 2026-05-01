import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: "linear-gradient(135deg, #312E81 0%, #4F46E5 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Borde sutil */}
        <div
          style={{
            position: "absolute",
            inset: 4,
            borderRadius: 36,
            border: "2px solid rgba(255,255,255,0.22)",
          }}
        />
        {/* Letra E */}
        <svg width="110" height="110" viewBox="0 0 64 64" fill="none">
          {/* Barra vertical */}
          <rect x="13" y="14" width="6" height="36" rx="3" fill="white" />
          {/* Barra superior */}
          <rect x="13" y="14" width="24" height="6" rx="3" fill="white" />
          {/* Barra media */}
          <rect x="13" y="29" width="18" height="6" rx="3" fill="white" />
          {/* Barra inferior */}
          <rect x="13" y="44" width="24" height="6" rx="3" fill="white" />
          {/* Punto decorativo grande */}
          <circle cx="48" cy="19" r="3" fill="#E0E7FF" />
          <circle cx="48" cy="19" r="1.4" fill="white" />
          <circle cx="47" cy="46" r="2.5" fill="white" opacity="0.7" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
