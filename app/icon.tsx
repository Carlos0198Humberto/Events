import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 9,
        background: "linear-gradient(135deg, #0D9488 0%, #0F766E 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18">
        <path
          d="M9 2 L10.2 7.8 L16 9 L10.2 10.2 L9 16 L7.8 10.2 L2 9 L7.8 7.8 Z"
          fill="white"
        />
      </svg>
    </div>,
    { ...size },
  );
}
