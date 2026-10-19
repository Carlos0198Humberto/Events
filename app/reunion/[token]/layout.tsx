// Título y descripción del enlace de una reunión para la vista previa de los
// chats («Rosa, te invitamos: Reunión familiar»). La página es de cliente,
// por eso los metadatos viven acá.
import type { Metadata } from "next";
import { headers } from "next/headers";
import { reunionPorToken } from "@/lib/reunionServidor";
import { fechaLarga, horaCorta } from "@/lib/tarjetaInvitacion";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const r = await reunionPorToken(token);

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  const metadataBase = host ? new URL(`${proto}://${host}`) : undefined;

  if (!r) return { metadataBase, title: "Tu invitación · Evorix" };

  const primerNombre = r.invitado.nombre.trim().split(/\s+/)[0];
  const title = `${primerNombre}, te invitamos: ${r.reunion.nombre}`;
  const description = [
    r.reunion.fecha ? fechaLarga(r.reunion.fecha) : null,
    r.reunion.hora ? horaCorta(r.reunion.hora) : null,
    r.reunion.lugar,
  ].filter(Boolean).join(" · ") + ". Tocá para confirmar si vas.";

  return {
    metadataBase,
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function ReunionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
