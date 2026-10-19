// Vista previa del enlace de una reunión del día (WhatsApp, Messenger…): la
// tarjeta de la reunión con el nombre del invitado.
import { renderTarjetaOG, TAM_OG } from "@/lib/tarjetaOG";
import { datosTarjetaPorTokenReunion } from "@/lib/reunionServidor";

export const alt = "Tu invitación";
export const size = TAM_OG;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { datos } = await datosTarjetaPorTokenReunion(token);
  return renderTarjetaOG(datos);
}
