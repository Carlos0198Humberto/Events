import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: "linear-gradient(135deg, #312E81 0%, #4F46E5 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 64 64" fill="none">
          {/* E vertical */}
          <rect x="13" y="14" width="6" height="36" rx="3" fill="#FFFFFF" />
          {/* E top */}
          <rect x="13" y="14" width="24" height="6" rx="3" fill="#FFFFFF" />
          {/* E middle */}
          <rect x="13" y="29" width="18" height="6" rx="3" fill="#FFFFFF" />
          {/* E bottom */}
          <rect x="13" y="44" width="24" height="6" rx="3" fill="#FFFFFF" />
          {/* Accent sparkle — tono neutro, misma familia índigo */}
          <circle cx="48" cy="19" r="3" fill="#E0E7FF" />
          <circle cx="48" cy="19" r="1.4" fill="#FFFFFF" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
