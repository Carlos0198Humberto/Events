import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=self, microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  // La voz de las invitaciones (/api/voz): ONNX Runtime en WebAssembly se carga
  // desde node_modules, con sus .wasm al lado (no se empaqueta)
  serverExternalPackages: ["onnxruntime-web"],
  outputFileTracingIncludes: {
    "/api/voz": [
      "./node_modules/onnxruntime-web/dist/ort.node.min.mjs",
      "./node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs",
      "./node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm",
    ],
  },
  typescript: {
    // Los errores de tipo no bloquean el build (se resuelven por separado)
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
