import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Probador de voces · Evorix",
  description: "Escuchá las voces que pueden leer tus invitaciones y elegí la que más te guste.",
  robots: { index: false, follow: false },
};

export default function LayoutVoces({ children }: { children: React.ReactNode }) {
  return children;
}
