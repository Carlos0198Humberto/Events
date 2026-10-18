// ─── Tarjeta de invitación en imagen (navegador) ──────────────────────────────
//
// Como una invitación impresa de gala: marco dorado fino, dos bandas de
// filigrana cruzando las esquinas, la foto en un círculo dorado (o el birrete),
// el título en caligrafía, la fecha en mayúsculas finas y un sello con las
// iniciales. Los colores salen de la paleta del evento (datos.paleta).
//
// Tres formatos: "tarjeta" (1080×1350, la que va con el mensaje), "historia"
// (1080×1920, para estados) e "imprimir" (5×7 pulgadas, ~300 ppp, con QR).
//
// Estilos que elige el organizador: diseño (moderna, gala, minimal, floral),
// forma de la foto (círculo, arco, retrato), metal (en la paleta) y letra del
// nombre. La moderna es otra composición: foto grande arriba, colores lisos,
// dos familias de letra y la fecha en bloque, como la papelería de imprenta.
//
// La tarjeta no lleva QR: la confirmación es el enlace del mensaje que la
// acompaña, que en WhatsApp sí se puede tocar. La impresa tampoco (el
// organizador lo pidió así); `qr` queda como opción de quien la genere.

import qrcode from "qrcode-generator";
import { PALETAS_TARJETA, nombreEnPartes, partesPadres, tintasPlanas, type DatosTarjeta, type FormaFoto, type PaletaTarjeta, type TintasPlanas } from "@/lib/tarjetaInvitacion";
import { BIRRETE, filigrana, sello, separador } from "@/lib/ornamentosTarjeta";
import { coloresXV, svgDataUrl, svgQuinceanera, svgRamillete, type ColoresXV, type EsquinaXV } from "@/lib/ilustracionesXV";

const W = 1080;
// Alto y paleta de la tarjeta que se está dibujando. Se fijan después de todas
// las esperas (fuentes, foto) y el dibujo es sincrónico de ahí al final: dos
// tarjetas generadas a la vez no se pisan los colores.
let H = 1350;
let P: PaletaTarjeta = PALETAS_TARJETA.negro;

export type FormatoTarjeta = "tarjeta" | "historia" | "imprimir";
const ALTO: Record<FormatoTarjeta, number> = { tarjeta: 1350, historia: 1920, imprimir: 1512 };
// La impresa se dibuja igual y se escala: 1512×2117 px ≈ 5×7 pulgadas a 300 ppp
const ESCALA: Record<FormatoTarjeta, number> = { tarjeta: 1, historia: 1, imprimir: 1.4 };
const SCRIPT = "'Great Vibes', cursive";
const CAPS = "'Cinzel', Georgia, serif";
const SERIF = "'Playfair Display', Georgia, serif";
const SANS = "'Jost', Arial, sans-serif";
const URL_FUENTES = "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cinzel:wght@500;600&family=Playfair+Display:ital,wght@0,500;1,500;1,600&family=Jost:wght@300;400;500&display=swap";

// La banda superior cruza el borde de arriba con su línea central en x = 730
const BANDA_C = 730;
const BANDA_H = 64;

/**
 * Carga las fuentes de la tarjeta (una vez por página). Es UNA sola carga
 * compartida: antes, una segunda llamada veía la hoja ya agregada, no esperaba
 * a que llegara y dibujaba con la letra de respaldo (pasaba siempre al montar
 * la portada dos veces, y si se armaban dos tarjetas a la vez).
 */
let cargaFuentes: Promise<void> | null = null;
export function cargarFuentesTarjeta(): Promise<void> {
  return (cargaFuentes ??= cargar());
}
async function cargar() {
  if (!document.querySelector(`link[data-fuentes-tarjeta]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = URL_FUENTES;
    link.setAttribute("data-fuentes-tarjeta", "");
    document.head.appendChild(link);
    await new Promise((r) => { link.onload = r; link.onerror = r; setTimeout(r, 4000); });
  }
  // Si la hoja todavía no se aplicó, la caligrafía no aparece entre las fuentes:
  // se reintenta un momento antes de dibujar con la de respaldo
  for (let i = 0; i < 15; i++) {
    try { if ((await document.fonts.load(`80px 'Great Vibes'`, "Aa")).length) break; } catch { break; }
    await new Promise((r) => setTimeout(r, 200));
  }
  try {
    await Promise.all([
      document.fonts.load(`80px 'Great Vibes'`),
      document.fonts.load(`500 40px 'Cinzel'`),
      document.fonts.load(`600 40px 'Cinzel'`),
      document.fonts.load(`500 40px 'Playfair Display'`),
      document.fonts.load(`italic 500 40px 'Playfair Display'`),
      document.fonts.load(`italic 600 40px 'Playfair Display'`),
      document.fonts.load(`300 40px 'Jost'`),
      document.fonts.load(`400 40px 'Jost'`),
      document.fonts.load(`500 40px 'Jost'`),
    ]);
  } catch { /* se dibuja con la fuente de respaldo */ }
}

function oro(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  P.dorado.forEach(([p, c]) => g.addColorStop(p, c));
  return g;
}

function trazo(ctx: CanvasRenderingContext2D, d: string, ancho: number) {
  ctx.lineWidth = ancho;
  ctx.stroke(new Path2D(d));
}

// Banda de filigrana que cruza la esquina superior derecha. La inferior
// izquierda es la misma dibujada con el lienzo girado 180°.
function banda(ctx: CanvasRenderingContext2D) {
  const h = BANDA_H;
  const desde = -h - 10;
  const hasta = (W - BANDA_C) * Math.SQRT2 + 2 * h;
  const fi = filigrana(h, desde, hasta);
  ctx.save();
  ctx.translate(BANDA_C, 0);
  ctx.rotate(Math.PI / 4);
  ctx.save();
  ctx.shadowColor = P.sombra;
  ctx.shadowBlur = 26;
  ctx.fillStyle = P.banda;
  ctx.fillRect(desde, -h, hasta - desde, 2 * h);
  ctx.restore();
  const g = oro(ctx, desde, -h, hasta, h);
  ctx.strokeStyle = g;
  ctx.fillStyle = g;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  trazo(ctx, fi.bordesGruesos, 3.2);
  trazo(ctx, fi.bordesFinos, 1.2);
  trazo(ctx, fi.ondas, 2.2);
  trazo(ctx, fi.festones, 1.4);
  trazo(ctx, fi.anillos, 1.3);
  ctx.fill(new Path2D(fi.rellenos));
  ctx.fillStyle = P.banda;
  ctx.fill(new Path2D(fi.huecos));
  ctx.restore();
}

// Ramillete del diseño floral: dos ramas que salen de la esquina, con hojas y
// tres flores chicas. Se dibuja en la esquina superior izquierda; la inferior
// derecha es la misma con el lienzo girado 180°.
function ramillete(ctx: CanvasRenderingContext2D) {
  const L = 330;
  ctx.save();
  ctx.translate(84, 84);
  const g = oro(ctx, 0, 0, L, L);
  ctx.strokeStyle = g;
  ctx.fillStyle = g;
  ctx.lineCap = "round";
  for (const eje of [0, 1]) {
    // Rama: casi recta, con una curva suave
    const punto = (t: number) => {
      const a = t * L, b = 22 * Math.sin(t * Math.PI);
      return eje === 0 ? [a, b] : [b, a];
    };
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const [px, py] = punto(t);
      if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // Hojas a los dos lados, cada vez más chicas hacia la punta
    for (let i = 1; i <= 8; i++) {
      const t = i / 9;
      const [px, py] = punto(t);
      const [qx, qy] = punto(t + 0.01);
      const ang = Math.atan2(qy - py, qx - px);
      const tam = 1.35 - t * 0.7;
      for (const lado of [-1, 1]) {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(ang + lado * 0.75);
        ctx.beginPath();
        ctx.ellipse(16 * tam, 0, 19 * tam, 7.5 * tam, 0, 0, Math.PI * 2);
        ctx.globalAlpha = 0.92;
        ctx.fill();
        ctx.restore();
      }
    }
  }
  // Flores cerca de la esquina
  for (const [fx, fy, r] of [[26, 26, 21], [88, 18, 14], [18, 88, 14]] as const) {
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(fx + Math.cos(a) * r * 0.9, fy + Math.sin(a) * r * 0.9, r * 0.7, r * 0.42, a, 0, Math.PI * 2);
      ctx.globalAlpha = 0.9;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(fx, fy, r * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = P.fondoCentro;
    ctx.fill();
    ctx.fillStyle = g;
  }
  ctx.restore();
}

// Código QR (para la tarjeta impresa) sobre un recuadro claro, como para que
// cualquier celular lo lea aunque el fondo de la tarjeta sea oscuro
function dibujarQR(ctx: CanvasRenderingContext2D, texto: string, cx: number, y: number, lado: number) {
  const qr = qrcode(0, "M");
  qr.addData(texto);
  qr.make();
  const n = qr.getModuleCount();
  const margen = 14;
  const celda = (lado - margen * 2) / n;
  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  rectRedondo(ctx, cx - lado / 2, y, lado, lado, 14);
  ctx.fill();
  ctx.fillStyle = "#111111";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) ctx.fillRect(cx - lado / 2 + margen + c * celda, y + margen + r * celda, Math.ceil(celda), Math.ceil(celda));
    }
  }
  ctx.restore();
}

function birrete(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, giro = 0) {
  ctx.save();
  ctx.translate(cx, cy);
  if (giro) ctx.rotate(giro);
  ctx.scale(s, s);
  const g = oro(ctx, -176, -64, 176, 112);
  ctx.strokeStyle = g;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  trazo(ctx, BIRRETE.casquete, 3.4);
  trazo(ctx, BIRRETE.bandaCasquete, 1.6);
  const tablero = new Path2D(BIRRETE.tablero);
  ctx.fillStyle = P.fondoCentro;
  ctx.fill(tablero);
  ctx.lineWidth = 3.4;
  ctx.stroke(tablero);
  trazo(ctx, BIRRETE.canto, 2);
  trazo(ctx, BIRRETE.cordon, 2.6);
  ctx.fillStyle = g;
  ctx.fill(new Path2D(BIRRETE.borla));
  ctx.fill(new Path2D(BIRRETE.boton));
  ctx.restore();
}

function dibujarSello(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, iniciales: string) {
  const s = sello(R);
  ctx.save();
  ctx.translate(cx, cy);
  const cintas = new Path2D(s.cintas);
  ctx.fillStyle = oro(ctx, -R, R * 0.5, R, R * 1.8);
  ctx.fill(cintas);
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fill(cintas);
  ctx.save();
  ctx.shadowColor = P.sombra;
  ctx.shadowBlur = 14;
  ctx.fillStyle = oro(ctx, -R, -R, R, R);
  ctx.fill(new Path2D(s.roseta));
  ctx.restore();
  ctx.strokeStyle = "rgba(70,48,14,0.75)";
  trazo(ctx, s.anillo, 1.6);
  ctx.fillStyle = oro(ctx, R, -R, -R, R);
  ctx.fill(new Path2D(s.centro));
  ctx.fillStyle = P.tinta;
  ctx.fill(new Path2D(s.puntos));
  ctx.fill(new Path2D(s.estrellas));
  ctx.textAlign = "center";
  ctx.font = `italic 600 ${Math.round(R * 0.56)}px ${SERIF}`;
  ctx.fillText(iniciales, 0, R * 0.26);
  ctx.restore();
}

// La foto de portada (Supabase Storage la sirve con CORS abierto). Si el
// navegador la tiene en caché de una carga sin CORS, se pide de nuevo con otra
// URL; si igual falla, la tarjeta sale sin foto: nunca se queda sin generar.
function cargarImagen(url: string): Promise<HTMLImageElement | null> {
  const intento = (src: string) => new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    const t = setTimeout(() => resolve(null), 9000);
    img.onload = () => { clearTimeout(t); resolve(img.naturalWidth > 0 ? img : null); };
    img.onerror = () => { clearTimeout(t); resolve(null); };
    img.src = src;
  });
  return intento(url).then((img) => img ?? intento(`${url}${url.includes("?") ? "&" : "?"}tarjeta=1`));
}

// Rectángulo con esquinas redondeadas (ctx.roundRect no existe en iOS < 16)
function rectRedondo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Medidas de la foto según su forma (R = radio del círculo de referencia)
function medidasFoto(forma: FormaFoto, R: number) {
  if (forma === "arco") return { ancho: R * 1.62, alto: R * 2.12 };
  if (forma === "retrato") return { ancho: R * 1.6, alto: R * 2.02 };
  return { ancho: R * 2, alto: R * 2 };
}

// La silueta de la foto: arco (rectángulo con medio círculo arriba) o
// rectángulo apenas redondeado
function silueta(ctx: CanvasRenderingContext2D, forma: FormaFoto, x: number, y: number, w: number, h: number, extra = 0) {
  const x0 = x - extra, y0 = y - extra, w0 = w + extra * 2, h0 = h + extra * 2;
  ctx.beginPath();
  if (forma === "arco") {
    const r = w0 / 2;
    ctx.moveTo(x0, y0 + h0);
    ctx.lineTo(x0, y0 + r);
    ctx.arc(x0 + r, y0 + r, r, Math.PI, 0);
    ctx.lineTo(x0 + w0, y0 + h0);
    ctx.closePath();
  } else {
    rectRedondo(ctx, x0, y0, w0, h0, 10 + extra * 0.4);
  }
}

// La foto con su marco dorado. El recorte favorece la parte de arriba de la
// foto, que es donde suele estar la cara.
// Una foto horizontal (el graduado con sus papás) no entra en un arco ni en un
// círculo sin cortar a la gente de los costados: va en un marco ancho con su
// propia proporción, del mismo alto que tendría el arco (no mueve el resto)
const proporcionDe = (img: HTMLImageElement) => (img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1);
export const esHorizontal = (img: HTMLImageElement) => proporcionDe(img) > 1.1;
function medidasApaisada(img: HTMLImageElement, altoDisponible: number, anchoMax: number) {
  const r = Math.min(proporcionDe(img), 1.9);
  const ancho = Math.min(anchoMax, altoDisponible * r);
  return { ancho, alto: ancho / r };
}

function marcoFoto(ctx: CanvasRenderingContext2D, img: HTMLImageElement, forma: FormaFoto, cx: number, yTop: number, R: number) {
  if (esHorizontal(img)) { marcoApaisado(ctx, img, forma, cx, yTop, R); return; }
  if (forma === "circulo") { retrato(ctx, img, cx, yTop + R + 16, R); return; }
  const { ancho, alto } = medidasFoto(forma, R);
  const x = cx - ancho / 2, y = yTop + 16;

  ctx.save();
  ctx.shadowColor = "rgba(212,176,104,0.35)";
  ctx.shadowBlur = 40;
  silueta(ctx, forma, x, y, ancho, alto, 12);
  ctx.fillStyle = P.fondoCentro;
  ctx.fill();
  ctx.restore();

  ctx.save();
  silueta(ctx, forma, x, y, ancho, alto);
  ctx.clip();
  const w = img.naturalWidth, h = img.naturalHeight;
  const escala = Math.max(ancho / w, alto / h);
  const dw = w * escala, dh = h * escala;
  const dy = h * escala > alto ? (dh - alto) * 0.18 : (dh - alto) / 2;
  ctx.drawImage(img, x - (dw - ancho) / 2, y - dy, dw, dh);
  ctx.restore();

  ctx.strokeStyle = oro(ctx, x, y, x + ancho, y + alto);
  ctx.lineWidth = 6;
  silueta(ctx, forma, x, y, ancho, alto, 3);
  ctx.stroke();
  ctx.lineWidth = 1.4;
  silueta(ctx, forma, x, y, ancho, alto, 15);
  ctx.stroke();
}

function marcoApaisado(ctx: CanvasRenderingContext2D, img: HTMLImageElement, forma: FormaFoto, cx: number, yTop: number, R: number) {
  const disponible = medidasFoto(forma, R).alto;
  const { ancho, alto } = medidasApaisada(img, disponible, 760);
  const x = cx - ancho / 2, y = yTop + 16 + (disponible - alto) / 2;
  const marco = (extra: number) => { ctx.beginPath(); rectRedondo(ctx, x - extra, y - extra, ancho + extra * 2, alto + extra * 2, 14 + extra * 0.4); };

  ctx.save();
  ctx.shadowColor = "rgba(212,176,104,0.35)";
  ctx.shadowBlur = 40;
  marco(12);
  ctx.fillStyle = P.fondoCentro;
  ctx.fill();
  ctx.restore();

  ctx.save();
  marco(0);
  ctx.clip();
  const r = proporcionDe(img);
  // Más ancha que 1,9 (panorámica): se recorta apenas de los costados
  const sw = r > 1.9 ? img.naturalHeight * 1.9 : img.naturalWidth;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, 0, sw, img.naturalHeight, x, y, ancho, alto);
  ctx.restore();

  ctx.strokeStyle = oro(ctx, x, y, x + ancho, y + alto);
  ctx.lineWidth = 6;
  marco(3);
  ctx.stroke();
  ctx.lineWidth = 1.4;
  marco(15);
  ctx.stroke();
}

// Retrato redondo con doble anillo dorado. El recorte favorece la parte de
// arriba de la foto, que es donde suele estar la cara.
function retrato(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, cy: number, R: number) {
  ctx.save();
  ctx.shadowColor = "rgba(212,176,104,0.35)";
  ctx.shadowBlur = 40;
  ctx.beginPath();
  ctx.arc(cx, cy, R + 14, 0, Math.PI * 2);
  ctx.fillStyle = P.fondoCentro;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();
  const w = img.naturalWidth, h = img.naturalHeight;
  const lado = Math.min(w, h);
  const sx = (w - lado) / 2;
  const sy = h > w ? (h - lado) * 0.18 : 0;
  ctx.drawImage(img, sx, sy, lado, lado, cx - R, cy - R, R * 2, R * 2);
  ctx.restore();

  ctx.strokeStyle = oro(ctx, cx - R, cy - R, cx + R, cy + R);
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, R + 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(cx, cy, R + 16, 0, Math.PI * 2);
  ctx.stroke();
}

type Opciones = {
  fuente: (px: number) => string;
  px: number;
  min: number;
  max: number;
  espacio?: number;
  color: string | "oro";
};

function anchoTexto(ctx: CanvasRenderingContext2D, texto: string, espacio: number) {
  if (!espacio) return ctx.measureText(texto).width;
  const letras = [...texto];
  return letras.reduce((s, c) => s + ctx.measureText(c).width, 0) + espacio * (letras.length - 1);
}

// Escribe una línea centrada en cx, achicando la letra si no entra en `max`.
// Con `espacio` las letras van separadas (mayúsculas espaciadas).
function escribir(ctx: CanvasRenderingContext2D, texto: string, cx: number, y: number, o: Opciones) {
  const espacio = o.espacio ?? 0;
  let px = o.px;
  ctx.font = o.fuente(px);
  while (anchoTexto(ctx, texto, espacio) > o.max && px > o.min) { px -= 1; ctx.font = o.fuente(px); }
  const ancho = anchoTexto(ctx, texto, espacio);
  ctx.fillStyle = o.color === "oro" ? oro(ctx, cx - ancho / 2, y - px, cx + ancho / 2, y) : o.color;
  if (!espacio) {
    ctx.textAlign = "center";
    ctx.fillText(texto, cx, y);
  } else {
    ctx.textAlign = "left";
    let x = cx - ancho / 2;
    for (const c of texto) {
      ctx.fillText(c, x, y);
      x += ctx.measureText(c).width + espacio;
    }
  }
  return ancho;
}

// Mismo número de renglones que el corte común, pero parejos: achica el ancho
// mientras no aparezca un renglón más (así no queda una palabra sola al final)
function partirParejo(ctx: CanvasRenderingContext2D, texto: string, max: number) {
  const base = partirEnLineas(ctx, texto, max);
  if (base.length < 2) return base;
  let mejor = base;
  for (let ancho = max - 10; ancho > max * 0.5; ancho -= 10) {
    const prueba = partirEnLineas(ctx, texto, ancho);
    if (prueba.length > base.length) break;
    mejor = prueba;
  }
  return mejor;
}

function partirEnLineas(ctx: CanvasRenderingContext2D, texto: string, max: number) {
  const lineas: string[] = [];
  let actual = "";
  for (const palabra of texto.split(/\s+/)) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (ctx.measureText(prueba).width > max && actual) { lineas.push(actual); actual = palabra; }
    else actual = prueba;
  }
  if (actual) lineas.push(actual);
  return lineas;
}

type Bloque = { alto: number; antes: number; dibujar: (y: number) => void };

// El nombre o quién invita: en un renglón si entra con la letra achicada hasta
// `min`; si no, en dos renglones parejos. Nunca se sale de la tarjeta (antes un
// nombre o una familia largos quedaban cortados en los costados).
function bloqueQueEntra(ctx: CanvasRenderingContext2D, texto: string, o: Opciones & { alto: number; antes: number; base: number }): Bloque {
  const espacio = o.espacio ?? 0;
  ctx.font = o.fuente(o.min);
  let lineas = [texto];
  const palabras = texto.split(/\s+/);
  if (anchoTexto(ctx, texto, espacio) > o.max && palabras.length > 1) {
    let mejor = Infinity;
    for (let i = 1; i < palabras.length; i++) {
      const a = palabras.slice(0, i).join(" "), b = palabras.slice(i).join(" ");
      const ancho = Math.max(anchoTexto(ctx, a, espacio), anchoTexto(ctx, b, espacio));
      if (ancho < mejor) { mejor = ancho; lineas = [a, b]; }
    }
  }
  const paso = lineas.length > 1 ? o.alto * 0.86 : o.alto;
  return {
    alto: o.alto + paso * (lineas.length - 1),
    antes: o.antes,
    dibujar: (y) => lineas.forEach((l, i) => escribir(ctx, l, W / 2, y + o.base + i * paso, o)),
  };
}

/**
 * Genera la tarjeta: 1080×1350 (va con el mensaje), 1080×1920 (para estados) o
 * la de imprimir (5×7 pulgadas con `qr`, el enlace de la invitación).
 */
export async function generarTarjetaPNG(datos: DatosTarjeta, formato: FormatoTarjeta = "tarjeta", opciones: { qr?: string } = {}): Promise<Blob | null> {
  await cargarFuentesTarjeta();
  const foto = datos.foto ? await cargarImagen(datos.foto) : null;
  // XV años: los ramilletes y la quinceañera (SVG) se cargan antes de dibujar
  const ilustraciones = datos.diseno === "xv" ? await ilustracionesXV(datos.tonoXV) : null;
  // Sin más esperas a partir de acá (ver H y P arriba)
  H = ALTO[formato];
  P = datos.paleta ?? PALETAS_TARJETA.negro;
  const esc = ESCALA[formato];
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(W * esc);
  canvas.height = Math.round(H * esc);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(esc, esc);
  const cx = W / 2;
  const qr = formato === "imprimir" ? opciones.qr : undefined;

  if (datos.diseno === "moderna") {
    dibujarModerna(ctx, datos, foto, formato, qr);
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
  }
  if (datos.diseno === "xv" && ilustraciones) {
    dibujarXV(ctx, datos, ilustraciones, formato);
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
  }

  // Fondo negro con una luz suave al centro
  ctx.fillStyle = P.fondo;
  ctx.fillRect(0, 0, W, H);
  const luz = ctx.createRadialGradient(cx, H * 0.44, 40, cx, H * 0.46, H * 0.64);
  luz.addColorStop(0, P.fondoCentro);
  luz.addColorStop(1, `${P.fondo}00`);
  ctx.fillStyle = luz;
  ctx.fillRect(0, 0, W, H);

  // Marco y adornos según el diseño
  ctx.strokeStyle = oro(ctx, 0, 0, W, H);
  if (datos.diseno === "minimal") {
    // Un solo filete fino, sin adornos: el aire es el diseño
    ctx.lineWidth = 1.6;
    ctx.strokeRect(62, 62, W - 124, H - 124);
  } else {
    // Línea firme y una fina por dentro
    ctx.lineWidth = 4;
    ctx.strokeRect(54, 54, W - 108, H - 108);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(68, 68, W - 136, H - 136);
    // Gala: bandas de filigrana; floral: ramilletes. Arriba a la izquierda y abajo a la derecha
    const adorno = datos.diseno === "floral" ? ramillete : banda;
    adorno(ctx);
    ctx.save();
    ctx.translate(W, H);
    ctx.rotate(Math.PI);
    adorno(ctx);
    ctx.restore();
  }

  ctx.textBaseline = "alphabetic";
  const bloques: Bloque[] = [];
  // Con versículo, o con carrera, familia y dirección cargadas, la foto y el
  // birrete se achican un poco para que todo respire
  const compacta = !!datos.versiculo || [datos.carrera, datos.institucion, datos.familia, datos.direccion].filter(Boolean).length >= 3;

  // Arriba: la foto con su marco dorado (con el birrete apoyado, en graduación)
  // o, sin foto, el birrete solo / un separador
  const RF = (compacta ? 108 : 132) * (datos.formaFoto === "circulo" ? 1 : 0.92);
  const mf = medidasFoto(datos.formaFoto, RF);
  bloques.push(foto
    ? { alto: mf.alto + 32, antes: 0, dibujar: (y) => {
      marcoFoto(ctx, foto, datos.formaFoto, cx, y, RF);
      if (datos.esGraduacion) {
        // Apoyado en el borde superior derecho del marco
        if (esHorizontal(foto)) {
          const ap = medidasApaisada(foto, mf.alto, 760);
          birrete(ctx, cx + ap.ancho / 2 - 34, y + 16 + (mf.alto - ap.alto) / 2 - 6, 0.5, -0.32);
        } else {
          const bx = datos.formaFoto === "circulo" ? cx + RF * 0.66 : cx + mf.ancho * 0.36;
          const by = datos.formaFoto === "circulo" ? y + RF * 0.36 : y + (datos.formaFoto === "arco" ? mf.ancho * 0.16 : 10);
          birrete(ctx, bx, by, 0.5, -0.32);
        }
      }
    } }
    : datos.esGraduacion
    ? compacta
      ? { alto: 128, antes: 0, dibujar: (y) => birrete(ctx, cx, y + 52, 0.78) }
      : { alto: 150, antes: 0, dibujar: (y) => birrete(ctx, cx, y + 60, 0.92) }
    : { alto: 20, antes: 0, dibujar: (y) => {
      const sep = separador(300);
      ctx.save();
      ctx.translate(cx, y + 10);
      ctx.strokeStyle = oro(ctx, -150, 0, 150, 0);
      ctx.fillStyle = ctx.strokeStyle;
      trazo(ctx, sep.lineas, 1.2);
      ctx.fill(new Path2D(sep.rellenos));
      ctx.restore();
    } });

  bloques.push({ alto: 104, antes: 28, dibujar: (y) =>
    escribir(ctx, datos.tituloScript, cx, y + 82, { fuente: (px) => `${px}px ${SCRIPT}`, px: 104, min: 64, max: 720, color: "oro" }) });

  if (datos.honor) {
    bloques.push({ alto: 24, antes: 18, dibujar: (y) =>
      escribir(ctx, `—  ${datos.honor}  —`, cx, y + 21, { fuente: (px) => `500 ${px}px ${CAPS}`, px: 22, min: 13, max: 800, espacio: 4, color: P.oroPlano }) });
  }

  // El nombre en la letra elegida: mayúsculas elegantes, caligrafía o clásica
  if (datos.letraNombre === "caligrafia") {
    bloques.push(bloqueQueEntra(ctx, datos.protagonista, { alto: 86, antes: 10, base: 70, fuente: (px) => `${px}px ${SCRIPT}`, px: 92, min: 54, max: 800, color: "oro" }));
  } else if (datos.letraNombre === "clasica") {
    bloques.push(bloqueQueEntra(ctx, datos.protagonista, { alto: 66, antes: 14, base: 56, fuente: (px) => `500 ${px}px ${SERIF}`, px: 66, min: 36, max: 800, color: "oro" }));
  } else {
    bloques.push(bloqueQueEntra(ctx, datos.protagonista.toLocaleUpperCase("es"), { alto: 62, antes: 14, base: 54, fuente: (px) => `600 ${px}px ${CAPS}`, px: datos.diseno === "minimal" ? 68 : 62, min: 34, max: 760, espacio: 2, color: "oro" }));
  }

  // De qué se gradúa y dónde: la carrera en cursiva clara, la institución en mayúsculas finas
  if (datos.carrera) {
    ctx.font = `italic 500 34px ${SERIF}`;
    const lineasC = partirEnLineas(ctx, datos.carrera, 760).slice(0, 2);
    bloques.push({ alto: lineasC.length * 42, antes: 14, dibujar: (y) => {
      lineasC.forEach((l, i) =>
        escribir(ctx, l, cx, y + 33 + i * 42, { fuente: (px) => `italic 500 ${px}px ${SERIF}`, px: 34, min: 24, max: 780, color: P.textoFuerte }));
    } });
  }
  if (datos.institucion) {
    bloques.push({ alto: 22, antes: datos.carrera ? 8 : 14, dibujar: (y) =>
      escribir(ctx, datos.institucion!.toLocaleUpperCase("es"), cx, y + 19, { fuente: (px) => `500 ${px}px ${CAPS}`, px: 19, min: 13, max: 780, espacio: 3, color: P.oroPlano }) });
  }

  bloques.push({ alto: 16, antes: 22, dibujar: (y) => {
    const sep = separador(220);
    ctx.save();
    ctx.translate(cx, y + 8);
    ctx.strokeStyle = oro(ctx, -110, 0, 110, 0);
    ctx.fillStyle = ctx.strokeStyle;
    trazo(ctx, sep.lineas, 1.2);
    ctx.fill(new Path2D(sep.rellenos));
    ctx.restore();
  } });

  // Invitación especial (a distancia): la dedicatoria, en cursiva clara
  if (datos.dedicatoria && !datos.reserva && !datos.gracias) {
    ctx.font = `italic 500 34px ${SERIF}`;
    const lineasD = partirEnLineas(ctx, datos.dedicatoria, 760).slice(0, 3);
    bloques.push({ alto: lineasD.length * 44, antes: 22, dibujar: (y) => {
      lineasD.forEach((l, i) =>
        escribir(ctx, l, cx, y + 34 + i * 44, { fuente: (px) => `italic 500 ${px}px ${SERIF}`, px: 34, min: 24, max: 780, color: P.textoFuerte }));
    } });
  }

  // Versículo bíblico, entre comillas y con su cita
  if (datos.versiculo) {
    const v = datos.versiculo;
    ctx.font = `italic 500 25px ${SERIF}`;
    const lineasV = partirEnLineas(ctx, `«${v.texto}»`, 690).slice(0, 4);
    bloques.push({ alto: lineasV.length * 34 + 30, antes: 22, dibujar: (y) => {
      ctx.font = `italic 500 25px ${SERIF}`;
      ctx.fillStyle = P.textoVersiculo;
      ctx.textAlign = "center";
      lineasV.forEach((l, i) => ctx.fillText(l, cx, y + 25 + i * 34));
      escribir(ctx, v.cita.toLocaleUpperCase("es"), cx, y + lineasV.length * 34 + 22, { fuente: (px) => `500 ${px}px ${CAPS}`, px: 17, min: 13, max: 600, espacio: 3, color: P.oroPlano });
    } });
  }

  if (datos.fechaCorta) {
    bloques.push({ alto: 72, antes: 26, dibujar: (y) => {
      const ancho = escribir(ctx, datos.fechaCorta!, cx, y + 50, { fuente: (px) => `300 ${px}px ${SANS}`, px: 58, min: 36, max: 700, espacio: 4, color: "oro" });
      ctx.strokeStyle = oro(ctx, cx - ancho / 2, 0, cx + ancho / 2, 0);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - ancho / 2 - 18, y + 70);
      ctx.lineTo(cx + ancho / 2 + 18, y + 70);
      ctx.stroke();
    } });
  }
  // Pre-invitación: el texto del organizador bajo la fecha y, como el «Class
  // of» de la gala, «Promoción» con el año grande
  if (datos.dedicatoria && (datos.reserva || datos.gracias)) {
    // El texto del organizador nunca se corta: si pasa de 7 renglones, la
    // letra baja un poco (el agradecimiento admite hasta 500 caracteres)
    let px = 28;
    ctx.font = `italic 500 ${px}px ${SERIF}`;
    let lineasT = partirEnLineas(ctx, datos.dedicatoria, 740);
    if (lineasT.length > 7) {
      px = 24;
      ctx.font = `italic 500 ${px}px ${SERIF}`;
      lineasT = partirEnLineas(ctx, datos.dedicatoria, 740);
    }
    lineasT = lineasT.slice(0, 10);
    const paso = Math.round(px * 1.36);
    bloques.push({ alto: lineasT.length * paso, antes: 26, dibujar: (y) => {
      lineasT.forEach((l, i) =>
        escribir(ctx, l, cx, y + px + i * paso, { fuente: (n) => `italic 500 ${n}px ${SERIF}`, px, min: 18, max: 760, color: P.textoFuerte }));
    } });
  }
  if (datos.aviso) {
    ctx.font = `italic 500 26px ${SERIF}`;
    const lineasA = partirEnLineas(ctx, datos.aviso, 740).slice(0, 3);
    bloques.push({ alto: lineasA.length * 35, antes: 14, dibujar: (y) => {
      lineasA.forEach((l, i) =>
        escribir(ctx, l, cx, y + 26 + i * 35, { fuente: (px) => `italic 500 ${px}px ${SERIF}`, px: 26, min: 19, max: 760, color: P.textoSuave }));
    } });
  }
  if (datos.promocion) {
    bloques.push({ alto: 22, antes: 26, dibujar: (y) =>
      escribir(ctx, "PROMOCIÓN", cx, y + 19, { fuente: (px) => `500 ${px}px ${CAPS}`, px: 20, min: 14, max: 400, espacio: 5, color: P.oroPlano }) });
    bloques.push({ alto: 86, antes: 6, dibujar: (y) =>
      escribir(ctx, datos.promocion!, cx, y + 76, { fuente: (px) => `500 ${px}px ${SERIF}`, px: 92, min: 56, max: 420, color: "oro" }) });
  }
  // La especial no lleva hora ni lugar: quien la recibe está lejos
  if (datos.diaHora && !datos.especial) {
    bloques.push({ alto: 30, antes: 14, dibujar: (y) =>
      escribir(ctx, datos.diaHora!, cx, y + 26, { fuente: (px) => `400 ${px}px ${SANS}`, px: 28, min: 20, max: 720, espacio: 5, color: P.textoSuave }) });
  }

  if (datos.lugar && !datos.especial) {
    bloques.push({ alto: 36, antes: 36, dibujar: (y) =>
      escribir(ctx, datos.lugar!.toLocaleUpperCase("es"), cx, y + 30, { fuente: (px) => `500 ${px}px ${CAPS}`, px: 32, min: 22, max: 780, espacio: 2, color: "oro" }) });
    if (datos.direccion) {
      ctx.font = `300 25px ${SANS}`;
      const lineasD = partirEnLineas(ctx, datos.direccion, 780).slice(0, 2);
      bloques.push({ alto: lineasD.length * 32 - 4, antes: 8, dibujar: (y) => {
        lineasD.forEach((l, i) =>
          escribir(ctx, l, cx, y + 23 + i * 32, { fuente: (px) => `300 ${px}px ${SANS}`, px: 25, min: 18, max: 780, color: P.textoSuave }));
      } });
    }
  }

  // Para quién es (como el sobre de una invitación impresa), la frase que
  // invita y qué hacer: confirmar en el enlace que acompaña a la imagen
  if (datos.invitado) {
    bloques.push(bloqueQueEntra(ctx, `Para ${datos.invitado}`, { alto: 46, antes: 34, base: 38, fuente: (px) => `italic 600 ${px}px ${SERIF}`, px: 42, min: 28, max: 760, color: P.textoFuerte }));
  }
  // El llamado a confirmar es para la tarjeta personal (va con el enlace); la
  // genérica (para estados) no lleva enlace al lado
  if (qr) {
    // Impresa: el QR lleva a la invitación (en papel no hay enlace que tocar)
    const lado = 190;
    bloques.push({ alto: lado + 34, antes: 22, dibujar: (y) => {
      dibujarQR(ctx, qr, cx, y, lado);
      escribir(ctx, datos.especial ? "ESCANEÁ PARA VER TU INVITACIÓN" : datos.reserva ? "ESCANEÁ PARA VER TU PRE-INVITACIÓN" : datos.gracias ? "ESCANEÁ PARA VER LAS FOTOS" : "ESCANEÁ PARA CONFIRMAR TU ASISTENCIA", cx, y + lado + 28,
        { fuente: (px) => `500 ${px}px ${CAPS}`, px: 16, min: 12, max: 760, espacio: 3, color: P.oroPlano });
    } });
  } else if (datos.invitado && datos.cta) {
    bloques.push({ alto: 20, antes: 14, dibujar: (y) =>
      escribir(ctx, datos.cta.toLocaleUpperCase("es"), cx, y + 18, { fuente: (px) => `500 ${px}px ${CAPS}`, px: 17, min: 12, max: 760, espacio: 3, color: P.oroPlano }) });
  }

  // Quién invita, firmado en caligrafía como en una tarjeta impresa
  if (datos.familia) {
    bloques.push(bloqueQueEntra(ctx, datos.familia, { alto: 64, antes: 26, base: 52, fuente: (px) => `${px}px ${SCRIPT}`, px: 66, min: 40, max: 780, color: "oro" }));
  }


  const arriba = 112;
  const abajo = H - 88;
  const disponible = abajo - arriba;

  // El sello es adorno: entra solo si queda lugar
  const R = compacta ? 46 : 54;
  const bloqueSello = { alto: R * 2.75, antes: 20, dibujar: (y: number) => dibujarSello(ctx, cx, y + R, R, datos.iniciales) };
  { const m = medirBloques(bloques); if (m.altos + bloqueSello.alto + (m.huecos + bloqueSello.antes) * 0.45 <= disponible) bloques.push(bloqueSello); }

  repartir(ctx, bloques, arriba, abajo, formato === "historia" ? 1.16 : 1);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

function medirBloques(bloques: Bloque[]) {
  return { altos: bloques.reduce((s, b) => s + b.alto, 0), huecos: bloques.reduce((s, b) => s + b.antes, 0) };
}

// Reparte el espacio libre entre los bloques y centra el conjunto entre
// `arriba` y `abajo`. Si aun con los huecos al mínimo no entra (carrera +
// familia + versículo…), todo el contenido se escala un poco alrededor del
// centro: mejor letra algo más chica que un texto que pisa el marco. Con alto
// de sobra (formato para estados) se agranda hasta `agrandar`.
function repartir(ctx: CanvasRenderingContext2D, bloques: Bloque[], arriba: number, abajo: number, agrandar: number) {
  const cx = W / 2;
  const disponible = abajo - arriba;
  const { altos, huecos } = medirBloques(bloques);
  const factor = Math.min(1.5, Math.max(0.35, (disponible - altos) / Math.max(huecos, 1)));
  const total = altos + huecos * factor;
  const escala = total > disponible ? disponible / total : agrandar > 1 ? Math.max(1, Math.min(agrandar, (disponible * 0.9) / total)) : 1;
  ctx.save();
  ctx.translate(cx, arriba + (disponible - total * escala) / 2);
  ctx.scale(escala, escala);
  ctx.translate(-cx, 0);
  let y = 0;
  for (const b of bloques) {
    y += b.antes * factor;
    b.dibujar(y);
    y += b.alto;
  }
  ctx.restore();
}

// ─── Diseño moderno ───────────────────────────────────────────────────────────
// Papel liso (blanco con tinta azul marino, o el color oscuro de la paleta con
// letras blancas), un filete fino, la foto grande arriba y el texto debajo:
// Playfair para el nombre y las frases, Jost para los datos. Un solo acento de
// color, sin degradados metálicos, sin filigranas ni sello.

// Alto de la foto según el formato (la de estados tiene alto de sobra)
const ALTO_FOTO: Record<FormatoTarjeta, number> = { tarjeta: 450, historia: 780, imprimir: 380 };
const MARGEN = 40;   // filete
const INTERIOR = 76; // borde de la foto

function fotoModerna(ctx: CanvasRenderingContext2D, img: HTMLImageElement, forma: FormaFoto, alto: number) {
  const cx = W / 2;
  if (esHorizontal(img)) {
    // Entera y con su proporción, en el mismo espacio de la foto vertical
    const { ancho: wa, alto: ha } = medidasApaisada(img, alto, W - 2 * 110);
    const xa = cx - wa / 2, ya = INTERIOR + (alto - ha) / 2;
    ctx.save();
    ctx.beginPath();
    rectRedondo(ctx, xa, ya, wa, ha, 18);
    ctx.clip();
    const r = proporcionDe(img);
    const sw = r > 1.9 ? img.naturalHeight * 1.9 : img.naturalWidth;
    ctx.drawImage(img, (img.naturalWidth - sw) / 2, 0, sw, img.naturalHeight, xa, ya, wa, ha);
    ctx.restore();
    return;
  }
  // Vertical (como las fotos de toga): el arco y el retrato a 4:5, el círculo del alto
  const h = alto;
  const w = forma === "circulo" ? alto : Math.round(alto * 0.8);
  const x = cx - w / 2;
  const y = INTERIOR + (alto - h) / 2;
  ctx.save();
  ctx.beginPath();
  if (forma === "circulo") ctx.arc(cx, y + h / 2, h / 2, 0, Math.PI * 2);
  else if (forma === "arco") { ctx.moveTo(x, y + h); ctx.lineTo(x, y + w / 2); ctx.arc(cx, y + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.closePath(); }
  else rectRedondo(ctx, x, y, w, h, 18);
  ctx.clip();
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const esc = Math.max(w / iw, h / ih);
  const dw = iw * esc, dh = ih * esc;
  // El recorte favorece la parte de arriba: ahí suele estar la cara
  ctx.drawImage(img, x - (dw - w) / 2, y - (dh - h) * 0.2, dw, dh);
  ctx.restore();
}

// Una o dos líneas parejas para el nombre: parte por la palabra que deja las
// dos mitades más parecidas, y achica la letra hasta que entren
function lineasNombre(ctx: CanvasRenderingContext2D, nombre: string, fuente: (px: number) => string, px: number, min: number, max: number) {
  ctx.font = fuente(px);
  if (ctx.measureText(nombre).width <= max) return { lineas: [nombre], px };
  const palabras = nombre.split(/\s+/);
  let lineas = [nombre];
  if (palabras.length > 1) {
    let mejor = Infinity;
    for (let i = 1; i < palabras.length; i++) {
      const a = palabras.slice(0, i).join(" "), b = palabras.slice(i).join(" ");
      const dif = Math.abs(ctx.measureText(a).width - ctx.measureText(b).width);
      if (dif < mejor) { mejor = dif; lineas = [a, b]; }
    }
  }
  const ancho = () => Math.max(...lineas.map((l) => ctx.measureText(l).width));
  while (ancho() > max && px > min) { px -= 2; ctx.font = fuente(px); }
  return { lineas, px };
}

// Línea corta, el adorno de la moderna
function filete(ctx: CanvasRenderingContext2D, y: number, largo: number, color: string, grosor = 2) {
  ctx.fillStyle = color;
  ctx.fillRect(W / 2 - largo / 2, y - grosor / 2, largo, grosor);
}

function dibujarModerna(ctx: CanvasRenderingContext2D, datos: DatosTarjeta, foto: HTMLImageElement | null, formato: FormatoTarjeta, qr?: string) {
  const T: TintasPlanas = tintasPlanas(P);
  const cx = W / 2;
  // El birrete de línea se dibuja con la tinta lisa del acento
  P = { ...P, dorado: [[0, T.acento], [1, T.acento]], fondoCentro: T.fondo };

  ctx.fillStyle = T.fondo;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = T.linea;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(MARGEN, MARGEN, W - MARGEN * 2, H - MARGEN * 2);

  const altoFoto = ALTO_FOTO[formato];
  if (foto) fotoModerna(ctx, foto, datos.formaFoto, altoFoto);

  const bloques: Bloque[] = [];
  const ancho = W - 2 * 130;
  const sans = (peso: number) => (px: number) => `${peso} ${px}px ${SANS}`;
  const italica = (px: number) => `italic 500 ${px}px ${SERIF}`;

  if (!foto && datos.esGraduacion) {
    bloques.push({ alto: 96, antes: 0, dibujar: (y) => birrete(ctx, cx, y + 40, 0.62) });
  }

  // Qué es: en mayúsculas espaciadas, del color del acento
  bloques.push({ alto: 24, antes: foto ? 0 : 18, dibujar: (y) =>
    escribir(ctx, datos.tituloScript.toLocaleUpperCase("es"), cx, y + 21, { fuente: sans(500), px: 23, min: 15, max: ancho, espacio: 7, color: T.acento }) });

  // La frase de honor, en cursiva y en minúsculas ("en honor a")
  if (datos.honor && !datos.especial) {
    const frase = datos.honor.toLocaleLowerCase("es");
    bloques.push({ alto: 34, antes: 16, dibujar: (y) =>
      escribir(ctx, frase.charAt(0).toLocaleUpperCase("es") + frase.slice(1), cx, y + 28, { fuente: italica, px: 32, min: 22, max: ancho, color: T.suave }) });
  }

  // El nombre: protagonista de la tarjeta, en una o dos líneas
  const fuenteNombre = datos.letraNombre === "caligrafia" ? (px: number) => `${px}px ${SCRIPT}`
    : datos.letraNombre === "mayusculas" ? (px: number) => `600 ${px}px ${CAPS}`
    : (px: number) => `500 ${px}px ${SERIF}`;
  const textoNombre = datos.letraNombre === "mayusculas" ? datos.protagonista.toLocaleUpperCase("es") : datos.protagonista;
  const base = datos.letraNombre === "caligrafia" ? 100 : datos.letraNombre === "mayusculas" ? 60 : 76;
  const nombre = lineasNombre(ctx, textoNombre, fuenteNombre, base, Math.round(base * 0.6), ancho + 40);
  const interlinea = Math.round(nombre.px * (datos.letraNombre === "caligrafia" ? 1.0 : 1.12));
  bloques.push({ alto: nombre.lineas.length * interlinea, antes: 14, dibujar: (y) => {
    ctx.font = fuenteNombre(nombre.px);
    ctx.fillStyle = T.tinta;
    ctx.textAlign = "center";
    nombre.lineas.forEach((l, i) => ctx.fillText(l, cx, y + nombre.px * 0.86 + i * interlinea));
  } });

  if (datos.carrera) {
    ctx.font = italica(34);
    const lineasC = partirEnLineas(ctx, datos.carrera, ancho).slice(0, 2);
    bloques.push({ alto: lineasC.length * 42, antes: 16, dibujar: (y) =>
      lineasC.forEach((l, i) => escribir(ctx, l, cx, y + 32 + i * 42, { fuente: italica, px: 34, min: 24, max: ancho, color: T.suave })) });
  }
  if (datos.institucion) {
    bloques.push({ alto: 20, antes: datos.carrera ? 10 : 16, dibujar: (y) =>
      escribir(ctx, datos.institucion!.toLocaleUpperCase("es"), cx, y + 18, { fuente: sans(500), px: 19, min: 13, max: ancho, espacio: 4, color: T.suave }) });
  }

  // La fecha como en la papelería impresa: el día grande al centro, el día de
  // la semana y la hora a los lados entre dos líneas
  const fp = datos.fechaPartes;
  if (fp && !datos.especial) {
    const lado = datos.horaCorta ? datos.horaCorta.toLocaleUpperCase("es") : fp.anio;
    bloques.push({ alto: datos.horaCorta ? 150 : 124, antes: 34, dibujar: (y) => {
      escribir(ctx, fp.mes, cx, y + 20, { fuente: sans(500), px: 21, min: 15, max: 300, espacio: 6, color: T.acento });
      ctx.font = `500 92px ${SERIF}`;
      ctx.fillStyle = T.tinta;
      ctx.textAlign = "center";
      ctx.fillText(fp.dia, cx, y + 114);
      if (datos.horaCorta) escribir(ctx, fp.anio, cx, y + 148, { fuente: sans(500), px: 21, min: 15, max: 300, espacio: 6, color: T.acento });
      const medio = y + 80;
      for (const [texto, centro] of [[fp.semana, cx - 230], [lado, cx + 230]] as const) {
        ctx.fillStyle = T.linea;
        ctx.fillRect(centro - 120, medio - 34, 240, 1.5);
        ctx.fillRect(centro - 120, medio + 24, 240, 1.5);
        escribir(ctx, texto, centro, medio + 4, { fuente: sans(500), px: 22, min: 14, max: 230, espacio: 5, color: T.tinta });
      }
    } });
  } else if (datos.fecha) {
    bloques.push({ alto: 40, antes: 30, dibujar: (y) =>
      escribir(ctx, datos.fecha!, cx, y + 32, { fuente: italica, px: 34, min: 24, max: ancho, color: T.tinta }) });
  }

  if (datos.lugar && !datos.especial) {
    bloques.push({ alto: 28, antes: 30, dibujar: (y) =>
      escribir(ctx, datos.lugar!.toLocaleUpperCase("es"), cx, y + 25, { fuente: sans(500), px: 26, min: 17, max: ancho, espacio: 4, color: T.tinta }) });
    if (datos.direccion) {
      ctx.font = `300 24px ${SANS}`;
      const lineasD = partirEnLineas(ctx, datos.direccion, ancho).slice(0, 2);
      bloques.push({ alto: lineasD.length * 32 - 4, antes: 8, dibujar: (y) =>
        lineasD.forEach((l, i) => escribir(ctx, l, cx, y + 23 + i * 32, { fuente: sans(300), px: 24, min: 18, max: ancho, color: T.suave })) });
    }
  }

  if (datos.dedicatoria) {
    ctx.font = italica(34);
    const lineasD = partirEnLineas(ctx, datos.dedicatoria, ancho).slice(0, 3);
    bloques.push({ alto: lineasD.length * 44, antes: 24, dibujar: (y) =>
      lineasD.forEach((l, i) => escribir(ctx, l, cx, y + 34 + i * 44, { fuente: italica, px: 34, min: 24, max: ancho, color: T.tinta })) });
  }

  if (datos.versiculo) {
    const v = datos.versiculo;
    ctx.font = italica(25);
    const lineasV = partirEnLineas(ctx, `«${v.texto}»`, ancho - 40).slice(0, 4);
    bloques.push({ alto: lineasV.length * 34 + 28, antes: 26, dibujar: (y) => {
      lineasV.forEach((l, i) => escribir(ctx, l, cx, y + 25 + i * 34, { fuente: italica, px: 25, min: 18, max: ancho, color: T.suave }));
      escribir(ctx, v.cita.toLocaleUpperCase("es"), cx, y + lineasV.length * 34 + 22, { fuente: sans(500), px: 16, min: 12, max: ancho, espacio: 4, color: T.acento });
    } });
  }

  bloques.push({ alto: 2, antes: 30, dibujar: (y) => filete(ctx, y + 1, 72, T.acento) });

  if (datos.invitado) {
    bloques.push(bloqueQueEntra(ctx, `Para ${datos.invitado}`, { alto: 44, antes: 26, base: 36, fuente: italica, px: 40, min: 26, max: ancho, color: T.tinta }));
  }
  if (qr) {
    const lado = 180;
    bloques.push({ alto: lado + 30, antes: 20, dibujar: (y) => {
      dibujarQR(ctx, qr, cx, y, lado);
      escribir(ctx, datos.especial ? "ESCANEÁ PARA VER TU INVITACIÓN" : datos.reserva ? "ESCANEÁ PARA VER TU PRE-INVITACIÓN" : datos.gracias ? "ESCANEÁ PARA VER LAS FOTOS" : "ESCANEÁ PARA CONFIRMAR TU ASISTENCIA", cx, y + lado + 26,
        { fuente: sans(500), px: 16, min: 12, max: ancho, espacio: 4, color: T.suave });
    } });
  } else if (datos.invitado) {
    bloques.push({ alto: 18, antes: 12, dibujar: (y) =>
      escribir(ctx, datos.cta.toLocaleUpperCase("es"), cx, y + 16, { fuente: sans(500), px: 16, min: 12, max: ancho, espacio: 4, color: T.suave }) });
  }

  if (datos.familia) {
    bloques.push(bloqueQueEntra(ctx, datos.familia, { alto: 60, antes: 22, base: 48, fuente: (px) => `${px}px ${SCRIPT}`, px: 62, min: 40, max: ancho, color: T.tinta }));
  }

  const arriba = foto ? INTERIOR + altoFoto + 44 : 100;
  marcaDeAgua(ctx, datos, T, (arriba + H - 84) / 2);
  repartir(ctx, bloques, arriba, H - 84, formato === "historia" ? 1.18 : 1.06);
}

// Marca de agua detrás del texto: un birrete grande de línea (o las
// iniciales, si no es graduación), apenas visible, como el sello de un papel fino
function marcaDeAgua(ctx: CanvasRenderingContext2D, datos: DatosTarjeta, T: TintasPlanas, cy: number) {
  ctx.save();
  ctx.globalAlpha = T.fondo === "#FFFFFF" ? 0.055 : 0.08;
  if (datos.esGraduacion) {
    birrete(ctx, W / 2, cy - 40, 1.9, -0.14);
  } else {
    ctx.translate(W / 2, cy);
    ctx.rotate(-0.14);
    ctx.font = `600 380px ${SERIF}`;
    ctx.fillStyle = T.acento;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(datos.iniciales, 0, 0);
  }
  ctx.restore();
}


// ─── Diseño de XV años ────────────────────────────────────────────────────────
// Papel blanco con un rubor suave, ramilletes de rosas en las cuatro esquinas,
// una cinta arriba con «Mis XV Años», quienes invitan en caligrafía, la frase,
// «Quinceañera» y el nombre grande; abajo, a los lados de la quinceañera de
// espaldas con su vestido, la recepción y la fecha en dos columnas.

type IlustracionesXV = Record<EsquinaXV | "chica", HTMLImageElement>;
const cacheXV = new Map<string, Promise<IlustracionesXV | null>>();

function ilustracionesXV(tono: string | null): Promise<IlustracionesXV | null> {
  const clave = tono ?? "rosa";
  if (!cacheXV.has(clave)) {
    const c = coloresXV(tono);
    const esquinas: EsquinaXV[] = ["arriba-izq", "arriba-der", "abajo-izq", "abajo-der"];
    cacheXV.set(clave, Promise.all([
      ...esquinas.map((e) => cargarImagen(svgDataUrl(svgRamillete(c, e)))),
      cargarImagen(svgDataUrl(svgQuinceanera(c))),
    ]).then((imgs) => {
      if (imgs.some((i) => !i)) { cacheXV.delete(clave); return null; }
      const [ai, ad, bi, bd, chica] = imgs as HTMLImageElement[];
      return { "arriba-izq": ai, "arriba-der": ad, "abajo-izq": bi, "abajo-der": bd, chica };
    }));
  }
  return cacheXV.get(clave)!;
}

function conAlfa(hex: string, a: number) {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${a})`;
}

// La cinta de arriba, con las puntas dobladas por detrás
function cintaXV(ctx: CanvasRenderingContext2D, cx: number, cy: number, ancho: number, alto: number, c: ColoresXV) {
  const x0 = cx - ancho / 2, x1 = cx + ancho / 2, y0 = cy - alto / 2, y1 = cy + alto / 2;
  ctx.save();
  ctx.fillStyle = conAlfa(c.medio, 0.55);
  for (const lado of [-1, 1]) {
    const xb = lado < 0 ? x0 : x1;
    ctx.beginPath();
    ctx.moveTo(xb - lado * 22, y0 + 16);
    ctx.lineTo(xb + lado * 52, y0 + 16);
    ctx.lineTo(xb + lado * 30, cy + 8);
    ctx.lineTo(xb + lado * 52, y1 + 12);
    ctx.lineTo(xb - lado * 22, y1 + 12);
    ctx.closePath();
    ctx.fill();
  }
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, "#FFFFFF");
  g.addColorStop(1, conAlfa(c.claro, 1));
  ctx.fillStyle = g;
  ctx.shadowColor = conAlfa(c.profundo, 0.18);
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  rectRedondo(ctx, x0, y0, ancho, alto, 8);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = conAlfa(c.medio, 0.7);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  rectRedondo(ctx, x0 + 7, y0 + 7, ancho - 14, alto - 14, 5);
  ctx.stroke();
  ctx.restore();
}

// Dorado de los adornos de los XV (tiara, brillos, filete)
const ORO_XV = ["#F6E7B4", "#D4A94E", "#B98A34"] as const;

// La tiara sobre «Quinceañera»: cinco puntas de oro con perlas y una gema
// del color del vestido en el centro
function tiaraXV(ctx: CanvasRenderingContext2D, cx: number, base: number, ancho: number, c: ColoresXV) {
  const a = ancho / 2, alto = ancho * 0.4;
  const puntas: [number, number][] = [[-0.8, 0.46], [-0.4, 0.76], [0, 1], [0.4, 0.76], [0.8, 0.46]];
  ctx.save();
  const oroG = ctx.createLinearGradient(cx - a, base - alto, cx + a, base);
  oroG.addColorStop(0, ORO_XV[0]);
  oroG.addColorStop(0.5, ORO_XV[1]);
  oroG.addColorStop(1, ORO_XV[0]);
  ctx.shadowColor = "rgba(150,110,40,0.28)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  ctx.beginPath();
  ctx.moveTo(cx - a, base);
  ctx.lineTo(cx - a, base - alto * 0.24);
  puntas.forEach(([px, h], i) => {
    ctx.lineTo(cx + px * a, base - alto * h);
    const valle = i === puntas.length - 1 ? 1 : (px + puntas[i + 1][0]) / 2;
    ctx.lineTo(cx + valle * a, base - alto * (i === puntas.length - 1 ? 0.24 : 0.34));
  });
  ctx.lineTo(cx + a, base);
  ctx.quadraticCurveTo(cx, base + alto * 0.2, cx - a, base);
  ctx.closePath();
  ctx.fillStyle = oroG;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = ORO_XV[2];
  ctx.lineWidth = 1.3;
  ctx.stroke();
  // Filigrana: la banda de abajo
  ctx.beginPath();
  ctx.moveTo(cx - a * 0.94, base - alto * 0.1);
  ctx.quadraticCurveTo(cx, base + alto * 0.08, cx + a * 0.94, base - alto * 0.1);
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  // Perlas en las puntas
  for (const [px, h] of puntas) {
    const r = ancho * (h === 1 ? 0.048 : 0.036);
    ctx.beginPath();
    ctx.arc(cx + px * a, base - alto * h - r * 0.6, r, 0, Math.PI * 2);
    const perla = ctx.createRadialGradient(cx + px * a - r * 0.35, base - alto * h - r, r * 0.1, cx + px * a, base - alto * h - r * 0.6, r);
    perla.addColorStop(0, "#FFFFFF");
    perla.addColorStop(1, "#EADFD2");
    ctx.fillStyle = perla;
    ctx.fill();
    ctx.strokeStyle = ORO_XV[2];
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  // Gema del centro
  const gx = cx, gy = base - alto * 0.42, gr = ancho * 0.07;
  ctx.beginPath();
  ctx.moveTo(gx, gy - gr * 1.25);
  ctx.lineTo(gx + gr, gy);
  ctx.lineTo(gx, gy + gr * 1.25);
  ctx.lineTo(gx - gr, gy);
  ctx.closePath();
  const gema = ctx.createLinearGradient(gx - gr, gy - gr, gx + gr, gy + gr);
  gema.addColorStop(0, c.medio);
  gema.addColorStop(1, c.profundo);
  ctx.fillStyle = gema;
  ctx.fill();
  ctx.strokeStyle = ORO_XV[2];
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

// Un brillo de cuatro puntas (estrellita)
function brilloXV(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(255,255,255,0.9)";
  ctx.shadowBlur = r * 0.8;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
  ctx.restore();
}

// Un renglón con su etiqueta en otro color, centrado: «Lugar: Salón Los Almendros»
function renglonConEtiqueta(ctx: CanvasRenderingContext2D, etiqueta: string, texto: string, cx: number, y: number, px: number, colorEtiqueta: string, color: string) {
  const fEtiqueta = `600 ${px}px ${SERIF}`, fTexto = `500 ${px}px ${SERIF}`;
  ctx.font = fEtiqueta;
  const aE = etiqueta ? ctx.measureText(`${etiqueta} `).width : 0;
  ctx.font = fTexto;
  const aT = ctx.measureText(texto).width;
  let x = cx - (aE + aT) / 2;
  ctx.textAlign = "left";
  if (etiqueta) {
    ctx.font = fEtiqueta;
    ctx.fillStyle = colorEtiqueta;
    ctx.fillText(`${etiqueta} `, x, y);
    x += aE;
  }
  ctx.font = fTexto;
  ctx.fillStyle = color;
  ctx.fillText(texto, x, y);
  ctx.textAlign = "center";
}

// La tarjeta de XV: todo el texto en una sola columna centrada, en orden
// (como la papelería de imprenta), con la quinceañera de fondo, suave, y los
// ramilletes en las esquinas, donde nunca hay letras. Sin QR: la tarjeta es
// para verse bonita; se confirma con el enlace del mensaje.
function dibujarXV(ctx: CanvasRenderingContext2D, datos: DatosTarjeta, il: IlustracionesXV, formato: FormatoTarjeta) {
  const c = coloresXV(datos.tonoXV);
  const cx = W / 2;
  const tinta = "#3F3438";
  const suave = "#6E5C63";
  const ancho = 720; // ningún renglón pasa de acá: los ramilletes quedan libres

  // Papel blanco con un rubor del tono arriba y abajo
  ctx.fillStyle = "#FFFDFC";
  ctx.fillRect(0, 0, W, H);
  for (const [y, r] of [[H * 0.16, H * 0.62], [H * 0.95, H * 0.5]] as const) {
    const rubor = ctx.createRadialGradient(cx, y, 30, cx, y, r);
    rubor.addColorStop(0, conAlfa(c.claro, 0.42));
    rubor.addColorStop(1, conAlfa(c.claro, 0));
    ctx.fillStyle = rubor;
    ctx.fillRect(0, 0, W, H);
  }

  // La quinceañera de fondo, grande y lavada (como una marca de agua): se ve
  // el vestido, pero ni el pelo oscuro queda detrás de las letras con fuerza
  const altoChica = Math.round(H * (formato === "historia" ? 0.6 : 0.7));
  const anchoChica = Math.round((altoChica * 400) / 600);
  const lavada = document.createElement("canvas");
  lavada.width = anchoChica;
  lavada.height = altoChica;
  const lc = lavada.getContext("2d");
  if (lc) {
    lc.drawImage(il.chica, 0, 0, anchoChica, altoChica);
    lc.globalCompositeOperation = "source-atop";
    lc.fillStyle = "rgba(255,253,252,0.76)";
    lc.fillRect(0, 0, anchoChica, altoChica);
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.drawImage(lavada, cx - anchoChica / 2, H - altoChica - 36);
    ctx.restore();
  }

  ctx.strokeStyle = conAlfa(c.medio, 0.4);
  ctx.lineWidth = 2;
  ctx.strokeRect(34, 34, W - 68, H - 68);
  ctx.strokeStyle = conAlfa(ORO_XV[1], 0.45);
  ctx.lineWidth = 1.2;
  ctx.strokeRect(46, 46, W - 92, H - 92);

  // Ramilletes: grandes arriba, chicos abajo (justo en las esquinas)
  const tamA = 380, tamB = 290;
  ctx.drawImage(il["arriba-izq"], -30, -30, tamA, tamA);
  ctx.drawImage(il["arriba-der"], W - tamA + 30, -30, tamA, tamA);
  ctx.drawImage(il["abajo-izq"], -40, H - tamB + 40, tamB, tamB);
  ctx.drawImage(il["abajo-der"], W - tamB + 40, H - tamB + 40, tamB, tamB);

  ctx.textBaseline = "alphabetic";
  const bloques: Bloque[] = [];
  bloques.push({ alto: 86, antes: 0, dibujar: (y) => {
    cintaXV(ctx, cx, y + 43, 480, 86, c);
    escribir(ctx, "Mis XV Años", cx, y + 62, { fuente: (px) => `${px}px ${SCRIPT}`, px: 64, min: 44, max: 400, color: c.texto });
  } });
  if (datos.invitado) {
    // Dos personas con nombre largo: en dos renglones, nunca afuera de la tarjeta
    bloques.push(bloqueQueEntra(ctx, `Para ${datos.invitado}`, { alto: 34, antes: 20, base: 28, fuente: (px) => `italic 500 ${px}px ${SERIF}`, px: 30, min: 22, max: 640, color: suave }));
  }
  if (datos.versiculo) {
    const v = datos.versiculo;
    ctx.font = `italic 500 24px ${SERIF}`;
    const lineasV = partirParejo(ctx, `«${v.texto}»`, 620).slice(0, 3);
    bloques.push({ alto: lineasV.length * 32 + 26, antes: 14, dibujar: (y) => {
      lineasV.forEach((l, i) =>
        escribir(ctx, l, cx, y + 24 + i * 32, { fuente: (px) => `italic 500 ${px}px ${SERIF}`, px: 24, min: 18, max: 640, color: suave }));
      escribir(ctx, v.cita.toLocaleUpperCase("es"), cx, y + lineasV.length * 32 + 20, { fuente: (px) => `500 ${px}px ${CAPS}`, px: 16, min: 12, max: 500, espacio: 3, color: c.texto });
    } });
  }
  // Quienes invitan, uno por renglón y con una «y» en caligrafía entre ellos:
  // escritos de corrido, el nombre de la mamá quedaba partido en dos renglones
  if (datos.padres) {
    const padres = partesPadres(datos.padres);
    const fuentePadres = (px: number) => `italic 500 ${px}px ${SERIF}`;
    if (padres.length === 1) {
      bloques.push(bloqueQueEntra(ctx, padres[0], { alto: 46, antes: 18, base: 36, fuente: fuentePadres, px: 36, min: 26, max: 680, color: tinta }));
    } else {
      const RENGLON = 46, Y = 44;
      bloques.push({ alto: padres.length * RENGLON + Y + (padres.length - 2) * 8, antes: 18, dibujar: (y) => {
        let yy = y;
        padres.forEach((nombre, i) => {
          if (i > 0 && i === padres.length - 1) {
            escribir(ctx, "y", cx, yy + 28, { fuente: (px) => `${px}px ${SCRIPT}`, px: 46, min: 34, max: 120, color: c.texto });
            yy += Y;
          } else if (i > 0) yy += 8;
          escribir(ctx, nombre, cx, yy + 36, { fuente: fuentePadres, px: 36, min: 24, max: 680, color: tinta });
          yy += RENGLON;
        });
      } });
    }
  }
  if (datos.invitaXV) {
    ctx.font = `italic 500 30px ${SERIF}`;
    const lineasI = partirParejo(ctx, datos.invitaXV, 660).slice(0, 3);
    bloques.push({ alto: lineasI.length * 40, antes: 8, dibujar: (y) => {
      lineasI.forEach((l, i) =>
        escribir(ctx, l, cx, y + 30 + i * 40, { fuente: (px) => `italic 500 ${px}px ${SERIF}`, px: 30, min: 22, max: 680, color: tinta }));
    } });
  }
  bloques.push({ alto: 52, antes: 18, dibujar: (y) => {
    tiaraXV(ctx, cx, y + 44, 118, c);
    brilloXV(ctx, cx - 100, y + 16, 10, ORO_XV[1]);
    brilloXV(ctx, cx + 102, y + 26, 8, ORO_XV[1]);
  } });
  bloques.push({ alto: 70, antes: 2, dibujar: (y) =>
    escribir(ctx, "Quinceañera", cx, y + 56, { fuente: (px) => `${px}px ${SCRIPT}`, px: 72, min: 48, max: 600, color: c.texto }) });
  // Sus nombres en caligrafía y los apellidos debajo, en versalitas (todo el
  // nombre en caligrafía gigante ocupaba dos renglones pesados)
  const nombreXV = nombreEnPartes(datos.protagonista);
  bloques.push(bloqueQueEntra(ctx, nombreXV.nombres, { alto: 140, antes: 0, base: 112, fuente: (px) => `${px}px ${SCRIPT}`, px: 150, min: 96, max: ancho, color: c.texto }));
  if (nombreXV.apellidos) {
    const apellidos = nombreXV.apellidos.toLocaleUpperCase("es");
    bloques.push({ alto: 38, antes: 4, dibujar: (y) =>
      escribir(ctx, apellidos, cx, y + 30, { fuente: (px) => `600 ${px}px ${CAPS}`, px: 30, min: 20, max: ancho - 40, espacio: 8, color: tinta }) });
  }

  // El día, la fecha y la hora en una fila, separados por filetes:
  // «Sábado | NOVIEMBRE 21 2026 | 6:00 p. m.»
  const fp = datos.fechaPartes;
  if (fp || datos.horaCorta) {
    bloques.push({ alto: fp ? 150 : 50, antes: 26, dibujar: (y) => {
      const lado = (t: string, x: number, yy: number) =>
        escribir(ctx, t, x, yy, { fuente: (px) => `italic 600 ${px}px ${SERIF}`, px: 36, min: 24, max: 200, color: c.texto });
      if (!fp) { lado(datos.horaCorta!, cx, y + 40); return; }
      const semana = fp.semana.charAt(0) + fp.semana.slice(1).toLocaleLowerCase("es");
      const sep = 122;
      ctx.strokeStyle = conAlfa(c.medio, 0.75);
      ctx.lineWidth = 1.6;
      for (const s of datos.horaCorta ? [-1, 1] : [-1]) {
        ctx.beginPath();
        ctx.moveTo(cx + s * sep, y + 14);
        ctx.lineTo(cx + s * sep, y + 136);
        ctx.stroke();
      }
      escribir(ctx, fp.mes.toLocaleUpperCase("es"), cx, y + 34, { fuente: (n) => `500 ${n}px ${CAPS}`, px: 24, min: 16, max: 2 * sep - 24, espacio: 4, color: tinta });
      escribir(ctx, String(fp.dia), cx, y + 112, { fuente: (n) => `600 ${n}px ${SERIF}`, px: 80, min: 56, max: 2 * sep - 30, color: c.texto });
      escribir(ctx, String(fp.anio), cx, y + 144, { fuente: (n) => `500 ${n}px ${CAPS}`, px: 19, min: 14, max: 2 * sep - 30, espacio: 4, color: suave });
      lado(semana, cx - sep - 110, y + 88);
      if (datos.horaCorta) lado(datos.horaCorta, cx + sep + 110, y + 88);
    } });
  }

  // El lugar entero (nunca cortado: si es largo, letra más chica) y su dirección
  if (datos.lugar) {
    let px = 30;
    let lineasL: string[] = [];
    for (; px >= 22; px -= 2) {
      ctx.font = `500 ${px}px ${SERIF}`;
      lineasL = partirParejo(ctx, `Lugar: ${datos.lugar}`, ancho);
      if (lineasL.length <= 2) break;
    }
    px = Math.max(px, 22);
    ctx.font = `400 23px ${SANS}`;
    const lineasD = datos.direccion ? partirParejo(ctx, datos.direccion, ancho - 60).slice(0, 2) : [];
    const pasoL = px + 10;
    bloques.push({ alto: lineasL.length * pasoL + lineasD.length * 31, antes: 24, dibujar: (y) => {
      lineasL.forEach((l, i) => {
        const conEtiqueta = i === 0 && l.startsWith("Lugar: ");
        renglonConEtiqueta(ctx, conEtiqueta ? "Lugar:" : "", conEtiqueta ? l.slice(7) : l, cx, y + px + i * pasoL, px, c.texto, tinta);
      });
      lineasD.forEach((l, i) =>
        escribir(ctx, l, cx, y + lineasL.length * pasoL + 22 + i * 31, { fuente: (n) => `400 ${n}px ${SANS}`, px: 23, min: 16, max: ancho - 40, color: suave }));
    } });
  }

  // Confirmar: en la digital, con el enlace del mensaje (la impresa no lo dice)
  if (datos.invitado && datos.cta && formato !== "imprimir") {
    bloques.push({ alto: 22, antes: 22, dibujar: (y) =>
      escribir(ctx, datos.cta.toLocaleUpperCase("es"), cx, y + 18, { fuente: (px) => `500 ${px}px ${CAPS}`, px: 15, min: 11, max: ancho - 60, espacio: 3, color: suave }) });
  }

  if (datos.esperamosXV) {
    bloques.push({ alto: 84, antes: 16, dibujar: (y) =>
      escribir(ctx, datos.esperamosXV!, cx, y + 66, { fuente: (px) => `${px}px ${SCRIPT}`, px: 84, min: 56, max: 600, color: c.texto }) });
  }

  repartir(ctx, bloques, 66, H - 70, formato === "historia" ? 1.14 : 1);
}
