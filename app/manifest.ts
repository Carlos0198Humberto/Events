import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Eventix — Invitaciones Digitales",
    short_name: "Eventix",
    description: "Tu invitación digital elegante para eventos especiales",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAFBFF",
    theme_color: "#7C3AED",
    categories: ["lifestyle", "social"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
