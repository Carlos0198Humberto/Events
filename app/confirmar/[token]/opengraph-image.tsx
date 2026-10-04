// Vista previa del enlace de confirmación (WhatsApp, Telegram, Messenger…):
// la tarjeta de invitación con los datos de este invitado. En WhatsApp, tocarla
// abre el enlace.
import { renderTarjetaOG, TAM_OG } from "@/lib/tarjetaOG";
import { datosPorToken } from "@/lib/tarjetaServidor";

export const alt = "Tu invitación";
export const size = TAM_OG;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { datos } = await datosPorToken(token);
  return renderTarjetaOG(datos);
}
