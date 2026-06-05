import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
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
            inset: 2,
            borderRadius: 16,
            border: "1.2px solid rgba(255,255,255,0.28)",
          }}
        />
        {/* Letra E con punto decorativo */}
        <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
          <rect x="13" y="14" width="6" height="36" rx="3" fill="white" />
          <rect x="13" y="14" width="24" height="6" rx="3" fill="white" />
          <rect x="13" y="29" width="18" height="6" rx="3" fill="white" />
          <rect x="13" y="44" width="24" height="6" rx="3" fill="white" />
          <circle cx="48" cy="19" r="3" fill="#E0E7FF" />
          <circle cx="48" cy="19" r="1.4" fill="white" />
          <circle cx="47" cy="46" r="2.5" fill="white" opacity="0.7" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
