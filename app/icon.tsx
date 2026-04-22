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
          background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)",
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
          {/* Star */}
          <path
            d="M48 11 L49.8 17.2 L56 19 L49.8 20.8 L48 27 L46.2 20.8 L40 19 L46.2 17.2 Z"
            fill="#FDE68A"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
