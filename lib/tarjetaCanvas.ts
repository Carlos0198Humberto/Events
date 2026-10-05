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
// La tarjeta digital no lleva QR: la confirmación es el enlace del mensaje que
// la acompaña, que en WhatsApp sí se puede tocar. La impresa sí lo lleva.

import qrcode from "qrcode-generator";
import { PALETAS_TARJETA, tintasPlanas, type DatosTarjeta, type FormaFoto, type PaletaTarjeta, type TintasPlanas } from "@/lib/tarjetaInvitacion";
import { BIRRETE, filigrana, sello, separador } from "@/lib/ornamentosTarjeta";

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

/** Carga las fuentes de la tarjeta (una vez por página). */
export async function cargarFuentesTarjeta() {
  if (!document.querySelector(`link[data-fuentes-tarjeta]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = URL_FUENTES;
    link.setAttribute("data-fuentes-tarjeta", "");
    document.head.appendChild(link);
    await new Promise((r) => { link.onload = r; link.onerror = r; setTimeout(r, 4000); });
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
function marcoFoto(ctx: CanvasRenderingContext2D, img: HTMLImageElement, forma: FormaFoto, cx: number, yTop: number, R: number) {
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

/**
 * Genera la tarjeta: 1080×1350 (va con el mensaje), 1080×1920 (para estados) o
 * la de imprimir (5×7 pulgadas con `qr`, el enlace de la invitación).
 */
export async function generarTarjetaPNG(datos: DatosTarjeta, formato: FormatoTarjeta = "tarjeta", opciones: { qr?: string } = {}): Promise<Blob | null> {
  await cargarFuentesTarjeta();
  const foto = datos.foto ? await cargarImagen(datos.foto) : null;
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
        const bx = datos.formaFoto === "circulo" ? cx + RF * 0.66 : cx + mf.ancho * 0.36;
        const by = datos.formaFoto === "circulo" ? y + RF * 0.36 : y + (datos.formaFoto === "arco" ? mf.ancho * 0.16 : 10);
        birrete(ctx, bx, by, 0.5, -0.32);
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
    bloques.push({ alto: 86, antes: 10, dibujar: (y) =>
      escribir(ctx, datos.protagonista, cx, y + 70, { fuente: (px) => `${px}px ${SCRIPT}`, px: 92, min: 54, max: 800, color: "oro" }) });
  } else if (datos.letraNombre === "clasica") {
    bloques.push({ alto: 66, antes: 14, dibujar: (y) =>
      escribir(ctx, datos.protagonista, cx, y + 56, { fuente: (px) => `500 ${px}px ${SERIF}`, px: 66, min: 36, max: 800, color: "oro" }) });
  } else {
    bloques.push({ alto: 62, antes: 14, dibujar: (y) =>
      escribir(ctx, datos.protagonista.toLocaleUpperCase("es"), cx, y + 54, { fuente: (px) => `600 ${px}px ${CAPS}`, px: datos.diseno === "minimal" ? 68 : 62, min: 34, max: 760, espacio: 2, color: "oro" }) });
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
  if (datos.dedicatoria) {
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
    bloques.push({ alto: 46, antes: 34, dibujar: (y) =>
      escribir(ctx, `Para ${datos.invitado}`, cx, y + 38, { fuente: (px) => `italic 600 ${px}px ${SERIF}`, px: 42, min: 28, max: 760, color: P.textoFuerte }) });
  }
  // El llamado a confirmar es para la tarjeta personal (va con el enlace); la
  // genérica (para estados) no lleva enlace al lado
  if (qr) {
    // Impresa: el QR lleva a la invitación (en papel no hay enlace que tocar)
    const lado = 190;
    bloques.push({ alto: lado + 34, antes: 22, dibujar: (y) => {
      dibujarQR(ctx, qr, cx, y, lado);
      escribir(ctx, datos.especial ? "ESCANEÁ PARA VER TU INVITACIÓN" : "ESCANEÁ PARA CONFIRMAR TU ASISTENCIA", cx, y + lado + 28,
        { fuente: (px) => `500 ${px}px ${CAPS}`, px: 16, min: 12, max: 760, espacio: 3, color: P.oroPlano });
    } });
  } else if (datos.invitado) {
    bloques.push({ alto: 20, antes: 14, dibujar: (y) =>
      escribir(ctx, datos.cta.toLocaleUpperCase("es"), cx, y + 18, { fuente: (px) => `500 ${px}px ${CAPS}`, px: 17, min: 12, max: 760, espacio: 3, color: P.oroPlano }) });
  }

  // Quién invita, firmado en caligrafía como en una tarjeta impresa
  if (datos.familia) {
    bloques.push({ alto: 64, antes: 26, dibujar: (y) =>
      escribir(ctx, datos.familia!, cx, y + 52, { fuente: (px) => `${px}px ${SCRIPT}`, px: 66, min: 40, max: 780, color: "oro" }) });
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
    bloques.push({ alto: 44, antes: 26, dibujar: (y) =>
      escribir(ctx, `Para ${datos.invitado}`, cx, y + 36, { fuente: italica, px: 40, min: 26, max: ancho, color: T.tinta }) });
  }
  if (qr) {
    const lado = 180;
    bloques.push({ alto: lado + 30, antes: 20, dibujar: (y) => {
      dibujarQR(ctx, qr, cx, y, lado);
      escribir(ctx, datos.especial ? "ESCANEÁ PARA VER TU INVITACIÓN" : "ESCANEÁ PARA CONFIRMAR TU ASISTENCIA", cx, y + lado + 26,
        { fuente: sans(500), px: 16, min: 12, max: ancho, espacio: 4, color: T.suave });
    } });
  } else if (datos.invitado) {
    bloques.push({ alto: 18, antes: 12, dibujar: (y) =>
      escribir(ctx, datos.cta.toLocaleUpperCase("es"), cx, y + 16, { fuente: sans(500), px: 16, min: 12, max: ancho, espacio: 4, color: T.suave }) });
  }

  if (datos.familia) {
    bloques.push({ alto: 60, antes: 22, dibujar: (y) =>
      escribir(ctx, datos.familia!, cx, y + 48, { fuente: (px) => `${px}px ${SCRIPT}`, px: 62, min: 40, max: ancho, color: T.tinta }) });
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
