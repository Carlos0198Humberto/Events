// Título y descripción del enlace de confirmación para la vista previa de los
// chats ("María, te invitamos a la graduación de Andrea Castillo"). La página
// es de cliente, por eso los metadatos viven acá.
import type { Metadata } from "next";
import { headers } from "next/headers";
import { datosPorToken } from "@/lib/tarjetaServidor";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const { datos, encontrado } = await datosPorToken(token);

  // La imagen de vista previa necesita URL absoluta: se toma del dominio con el
  // que se abrió el enlace, así funciona en cualquier despliegue.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  const metadataBase = host ? new URL(`${proto}://${host}`) : undefined;

  if (!encontrado) return { metadataBase, title: "Tu invitación · Evorix" };

  const primerNombre = datos.invitado.split(" ")[0];
  const QUE_ES: Record<string, string> = {
    "Graduación": "la graduación", "Nuestra boda": "la boda", "Mis XV años": "los XV años", "Cumpleaños": "el cumpleaños",
  };
  const queEs = `${QUE_ES[datos.titulo] ?? "la celebración"} de ${datos.protagonista}`;
  const title = `${primerNombre}, te invitamos a ${queEs}`;
  const description = [datos.fecha, datos.hora, datos.lugar].filter(Boolean).join(" · ") + ". Tocá para confirmar tu asistencia.";

  return {
    metadataBase,
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function ConfirmarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
