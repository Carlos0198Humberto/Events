// ─── La voz de las invitaciones ───────────────────────────────────────────────
//
// Todas las invitaciones leen con la misma voz: Sharvard (mujer), de Piper
// (elegida en /voces). Cada frase se arma una sola vez en el servidor
// (/api/voz) y queda guardada en el almacenamiento público con un nombre que
// sale del texto: la próxima vez que alguien la necesite, se baja directo, sin
// volver a generarla. Así suena igual en cualquier celular.
//
// Este archivo lo usan el navegador y el servidor: los dos tienen que llegar al
// MISMO nombre para la misma frase.

export const VOZ = {
  id: "sharvard-f-v2", // v2: con el volumen nivelado (la v1 salía baja)
  modelo: "es/es_ES/sharvard/medium/es_ES-sharvard-medium.onnx",
  hablante: 1, // Sharvard tiene dos personas: 0 = hombre, 1 = mujer
  idioma: "es-419", // eSpeak con seseo, como se habla acá
} as const;

export const BUCKET_VOZ = "musica-eventos";
export const MAX_LETRAS_VOZ = 400;

/**
 * El texto como lo tiene que decir la voz: «XV» como «quince», «¡Holaaa!»
 * como «¡Hola!» (estirado suena raro en una voz grabada) y sin espacios de más.
 */
export function textoParaVoz(texto: string): string {
  return texto
    .replace(/\bXV\b/g, "quince")
    .replace(/\b([Hh])ola+a\b/g, "$1ola")
    .replace(/\s+/g, " ")
    .trim();
}

async function sha256(texto: string): Promise<string> {
  const datos = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest("SHA-256", datos);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Dónde queda guardada una frase (null si este navegador no puede calcularlo). */
export async function claveVoz(texto: string): Promise<string | null> {
  if (typeof crypto === "undefined" || !crypto.subtle) return null;
  return `voz/${VOZ.id}/${await sha256(textoParaVoz(texto))}.wav`;
}

export function urlPublicaVoz(base: string, clave: string): string {
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET_VOZ}/${clave}`;
}
