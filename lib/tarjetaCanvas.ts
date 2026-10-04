// ─── Tarjeta de invitación en imagen (navegador) ──────────────────────────────
//
// Negro y oro, como una invitación impresa de gala: marco dorado fino, dos
// bandas de filigrana cruzando las esquinas, birrete en línea dorada, el título
// en caligrafía, la fecha en mayúsculas finas y un sello con las iniciales.
//
// No lleva QR: la confirmación es el enlace del mensaje que acompaña a la
// imagen, que en WhatsApp sí se puede tocar. Una imagen no puede tener un
// enlace adentro.

import { DORADO, NEGRO_ORO, type DatosTarjeta } from "@/lib/tarjetaInvitacion";
import { BIRRETE, filigrana, sello, separador } from "@/lib/ornamentosTarjeta";

const W = 1080;
const H = 1350;
const SCRIPT = "'Great Vibes', cursive";
const CAPS = "'Cinzel', Georgia, serif";
const SERIF = "'Playfair Display', Georgia, serif";
const SANS = "'Jost', Arial, sans-serif";
const URL_FUENTES = "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cinzel:wght@500;600&family=Playfair+Display:ital,wght@0,500;1,500;1,600&family=Jost:wght@300;400&display=swap";

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
    ]);
  } catch { /* se dibuja con la fuente de respaldo */ }
}

function oro(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  DORADO.forEach(([p, c]) => g.addColorStop(p, c));
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
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 26;
  ctx.fillStyle = NEGRO_ORO.banda;
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
  ctx.fillStyle = NEGRO_ORO.banda;
  ctx.fill(new Path2D(fi.huecos));
  ctx.restore();
}

function birrete(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  const g = oro(ctx, -176, -64, 176, 112);
  ctx.strokeStyle = g;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  trazo(ctx, BIRRETE.casquete, 3.4);
  trazo(ctx, BIRRETE.bandaCasquete, 1.6);
  const tablero = new Path2D(BIRRETE.tablero);
  ctx.fillStyle = NEGRO_ORO.fondoCentro;
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
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 14;
  ctx.fillStyle = oro(ctx, -R, -R, R, R);
  ctx.fill(new Path2D(s.roseta));
  ctx.restore();
  ctx.strokeStyle = "rgba(70,48,14,0.75)";
  trazo(ctx, s.anillo, 1.6);
  ctx.fillStyle = oro(ctx, R, -R, -R, R);
  ctx.fill(new Path2D(s.centro));
  ctx.fillStyle = NEGRO_ORO.tinta;
  ctx.fill(new Path2D(s.puntos));
  ctx.fill(new Path2D(s.estrellas));
  ctx.textAlign = "center";
  ctx.font = `italic 600 ${Math.round(R * 0.56)}px ${SERIF}`;
  ctx.fillText(iniciales, 0, R * 0.26);
  ctx.restore();
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

/** Genera la tarjeta (1080×1350, formato vertical de WhatsApp/Instagram). */
export async function generarTarjetaPNG(datos: DatosTarjeta): Promise<Blob | null> {
  await cargarFuentesTarjeta();
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const cx = W / 2;

  // Fondo negro con una luz suave al centro
  ctx.fillStyle = NEGRO_ORO.fondo;
  ctx.fillRect(0, 0, W, H);
  const luz = ctx.createRadialGradient(cx, H * 0.44, 40, cx, H * 0.46, 860);
  luz.addColorStop(0, NEGRO_ORO.fondoCentro);
  luz.addColorStop(1, "rgba(13,13,15,0)");
  ctx.fillStyle = luz;
  ctx.fillRect(0, 0, W, H);

  // Marco dorado: línea firme y una fina por dentro
  ctx.strokeStyle = oro(ctx, 0, 0, W, H);
  ctx.lineWidth = 4;
  ctx.strokeRect(54, 54, W - 108, H - 108);
  ctx.lineWidth = 1.2;
  ctx.strokeRect(68, 68, W - 136, H - 136);

  // Bandas de filigrana sobre las esquinas del marco
  banda(ctx);
  ctx.save();
  ctx.translate(W, H);
  ctx.rotate(Math.PI);
  banda(ctx);
  ctx.restore();

  ctx.textBaseline = "alphabetic";
  const bloques: Bloque[] = [];
  // Con versículo hay un bloque más: birrete, año y sello se achican un poco
  const compacta = !!datos.versiculo;

  bloques.push(datos.esGraduacion
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
      escribir(ctx, `—  ${datos.honor}  —`, cx, y + 21, { fuente: (px) => `500 ${px}px ${CAPS}`, px: 22, min: 16, max: 600, espacio: 5, color: NEGRO_ORO.oroPlano }) });
  }

  bloques.push({ alto: 62, antes: 14, dibujar: (y) =>
    escribir(ctx, datos.protagonista.toLocaleUpperCase("es"), cx, y + 54, { fuente: (px) => `600 ${px}px ${CAPS}`, px: 62, min: 34, max: 760, espacio: 2, color: "oro" }) });

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

  // Versículo bíblico, entre comillas y con su cita
  if (datos.versiculo) {
    const v = datos.versiculo;
    ctx.font = `italic 500 25px ${SERIF}`;
    const lineasV = partirEnLineas(ctx, `«${v.texto}»`, 690).slice(0, 4);
    bloques.push({ alto: lineasV.length * 34 + 30, antes: 22, dibujar: (y) => {
      ctx.font = `italic 500 25px ${SERIF}`;
      ctx.fillStyle = "#EFE2C2";
      ctx.textAlign = "center";
      lineasV.forEach((l, i) => ctx.fillText(l, cx, y + 25 + i * 34));
      escribir(ctx, v.cita.toLocaleUpperCase("es"), cx, y + lineasV.length * 34 + 22, { fuente: (px) => `500 ${px}px ${CAPS}`, px: 17, min: 13, max: 600, espacio: 3, color: NEGRO_ORO.oroPlano });
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
  if (datos.diaHora) {
    bloques.push({ alto: 30, antes: 14, dibujar: (y) =>
      escribir(ctx, datos.diaHora!, cx, y + 26, { fuente: (px) => `400 ${px}px ${SANS}`, px: 28, min: 20, max: 720, espacio: 5, color: NEGRO_ORO.textoSuave }) });
  }

  if (datos.lugar) {
    bloques.push({ alto: 36, antes: 36, dibujar: (y) =>
      escribir(ctx, datos.lugar!.toLocaleUpperCase("es"), cx, y + 30, { fuente: (px) => `500 ${px}px ${CAPS}`, px: 32, min: 22, max: 780, espacio: 2, color: "oro" }) });
    if (datos.direccion) {
      bloques.push({ alto: 28, antes: 8, dibujar: (y) =>
        escribir(ctx, datos.direccion!, cx, y + 23, { fuente: (px) => `300 ${px}px ${SANS}`, px: 25, min: 18, max: 780, color: NEGRO_ORO.textoSuave }) });
    }
  }

  // Párrafo con el saludo y la indicación de confirmar
  ctx.font = `300 27px ${SANS}`;
  const lineas = partirEnLineas(ctx, datos.parrafo, 700).slice(0, 4);
  bloques.push({ alto: lineas.length * 39, antes: 30, dibujar: (y) => {
    ctx.font = `300 27px ${SANS}`;
    ctx.fillStyle = NEGRO_ORO.textoSuave;
    ctx.textAlign = "center";
    lineas.forEach((l, i) => ctx.fillText(l, cx, y + 28 + i * 39));
  } });

  if (datos.promocion) {
    bloques.push({ alto: 22, antes: 34, dibujar: (y) =>
      escribir(ctx, "PROMOCIÓN", cx, y + 20, { fuente: (px) => `500 ${px}px ${CAPS}`, px: 21, min: 16, max: 500, espacio: 9, color: NEGRO_ORO.oroPlano }) });
    const pxAnio = compacta ? 104 : 124;
    bloques.push({ alto: compacta ? 84 : 100, antes: 6, dibujar: (y) =>
      escribir(ctx, String(datos.promocion), cx, y + (compacta ? 80 : 96), { fuente: (px) => `500 ${px}px ${SERIF}`, px: pxAnio, min: 80, max: 500, color: "oro" }) });
  }

  const R = compacta ? 46 : 54;
  bloques.push({ alto: R * 2.75, antes: 20, dibujar: (y) => dibujarSello(ctx, cx, y + R, R, datos.iniciales) });

  // Reparte el espacio libre entre los bloques y centra el conjunto en el marco
  const arriba = 112;
  const abajo = 1262;
  const disponible = abajo - arriba;
  const altos = bloques.reduce((s, b) => s + b.alto, 0);
  const huecos = bloques.reduce((s, b) => s + b.antes, 0);
  const factor = Math.min(1.5, Math.max(0.35, (disponible - altos) / Math.max(huecos, 1)));
  let y = arriba + Math.max(0, (disponible - altos - huecos * factor) / 2);
  for (const b of bloques) {
    y += b.antes * factor;
    b.dibujar(y);
    y += b.alto;
  }

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}
