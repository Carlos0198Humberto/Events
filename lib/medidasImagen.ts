// ─── Ancho y alto de una foto, leyendo su cabecera ───────────────────────────
//
// La vista previa de WhatsApp (Satori, en el servidor) no puede medir una
// imagen: hay que saber de antemano si la foto es horizontal para elegir el
// marco (si no, una foto del graduado con sus papás se recortaba al del medio).
// Se leen solo los bytes del encabezado de PNG y JPEG; sin dependencias.

export type Medidas = { ancho: number; alto: number };

export function medidasImagen(b: Uint8Array): Medidas | null {
  // PNG: firma de 8 bytes y el bloque IHDR con ancho y alto (32 bits, big endian)
  if (b.length >= 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    const leer = (i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
    const ancho = leer(16), alto = leer(20);
    return ancho && alto ? { ancho, alto } : null;
  }
  // JPEG: se recorren los segmentos hasta el SOF (start of frame), que trae alto y ancho
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const marca = b[i + 1];
      if (marca === 0xff) { i++; continue; }
      if (marca === 0xd8 || marca === 0x01 || (marca >= 0xd0 && marca <= 0xd7)) { i += 2; continue; }
      const largo = (b[i + 2] << 8) | b[i + 3];
      const esSof = marca >= 0xc0 && marca <= 0xcf && marca !== 0xc4 && marca !== 0xc8 && marca !== 0xcc;
      if (esSof) {
        const alto = (b[i + 5] << 8) | b[i + 6];
        const ancho = (b[i + 7] << 8) | b[i + 8];
        return ancho && alto ? { ancho, alto } : null;
      }
      if (largo < 2) return null;
      i += 2 + largo;
    }
  }
  return null;
}

// ─── El marco que deja ver la foto ENTERA ─────────────────────────────────────
//
// Cada forma tiene su proporción (el arco es 0,76 de ancho por 1 de alto), y
// una foto que no la tiene se recortaba. La quinceañera de cuerpo entero con su
// vestido (una foto del celular, 9:16 = 0,56) perdía la cabeza y los pies; el
// graduado con sus papás (horizontal) perdía a los de los costados. Ahora el
// marco toma la proporción de la foto: el arco y el retrato se angostan o se
// ensanchan (siguen siendo arco y retrato), una foto horizontal va en un marco
// ancho, y una muy alta no se mete en un círculo: va en un retrato.

/** Más ancha que esto: marco ancho (horizontal) */
export const PROPORCION_HORIZONTAL = 1.1;
/** Más angosta que esto (cuerpo entero): no entra en un círculo sin cortar */
export const PROPORCION_ALTA = 0.74;

export type FormaMarco = "circulo" | "arco" | "retrato" | "apaisada";

/**
 * La forma y la proporción (ancho / alto) del marco para una foto de esa
 * proporción. Entre 0,5 y 1,9 la foto entra entera; más extrema, se recorta
 * apenas por los bordes.
 */
export function marcoParaFoto(proporcion: number, forma: "circulo" | "arco" | "retrato"): { forma: FormaMarco; aspecto: number } {
  const p = Number.isFinite(proporcion) && proporcion > 0 ? proporcion : 0.8;
  if (p > PROPORCION_HORIZONTAL) return { forma: "apaisada", aspecto: Math.min(p, 1.9) };
  const aspecto = Math.max(p, 0.5);
  if (forma === "circulo") return p < PROPORCION_ALTA ? { forma: "retrato", aspecto } : { forma: "circulo", aspecto: 1 };
  return { forma, aspecto };
}
