// ─── Tarjeta de invitación en imagen (navegador) ──────────────────────────────
//
// Como una invitación impresa de gala: marco dorado fino, dos bandas de
// filigrana cruzando las esquinas, la foto en un círculo dorado (o el birrete),
// el título en caligrafía, la fecha en mayúsculas finas y un sello con las
// iniciales. Los colores salen de la paleta del evento (datos.paleta).
//
// Dos formatos: "tarjeta" (1080×1350, la que va con el mensaje) e "historia"
// (1080×1920, para estados de WhatsApp e Instagram).
//
// No lleva QR: la confirmación es el enlace del mensaje que acompaña a la
// imagen, que en WhatsApp sí se puede tocar. Una imagen no puede tener un
// enlace adentro.

import { PALETAS_TARJETA, type DatosTarjeta, type PaletaTarjeta } from "@/lib/tarjetaInvitacion";
import { BIRRETE, filigrana, sello, separador } from "@/lib/ornamentosTarjeta";

const W = 1080;
// Alto y paleta de la tarjeta que se está dibujando. Se fijan después de todas
// las esperas (fuentes, foto) y el dibujo es sincrónico de ahí al final: dos
// tarjetas generadas a la vez no se pisan los colores.
let H = 1350;
let P: PaletaTarjeta = PALETAS_TARJETA.negro;

export type FormatoTarjeta = "tarjeta" | "historia";
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

/** Genera la tarjeta: 1080×1350 (va con el mensaje) o 1080×1920 (para estados). */
export async function generarTarjetaPNG(datos: DatosTarjeta, formato: FormatoTarjeta = "tarjeta"): Promise<Blob | null> {
  await cargarFuentesTarjeta();
  const foto = datos.foto ? await cargarImagen(datos.foto) : null;
  // Sin más esperas a partir de acá (ver H y P arriba)
  H = formato === "historia" ? 1920 : 1350;
  P = datos.paleta ?? PALETAS_TARJETA.negro;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const cx = W / 2;

  // Fondo negro con una luz suave al centro
  ctx.fillStyle = P.fondo;
  ctx.fillRect(0, 0, W, H);
  const luz = ctx.createRadialGradient(cx, H * 0.44, 40, cx, H * 0.46, H * 0.64);
  luz.addColorStop(0, P.fondoCentro);
  luz.addColorStop(1, `${P.fondo}00`);
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
  // Con versículo, o con carrera, familia y dirección cargadas, la foto y el
  // birrete se achican un poco para que todo respire
  const compacta = !!datos.versiculo || [datos.carrera, datos.institucion, datos.familia, datos.direccion].filter(Boolean).length >= 3;

  // Arriba: la foto en un círculo dorado (con el birrete apoyado, en graduación)
  // o, sin foto, el birrete solo / un separador
  const RF = compacta ? 108 : 132;
  bloques.push(foto
    ? { alto: RF * 2 + 32, antes: 0, dibujar: (y) => {
      retrato(ctx, foto, cx, y + RF + 16, RF);
      if (datos.esGraduacion) birrete(ctx, cx + RF * 0.66, y + RF * 0.36, 0.5, -0.32);
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

  bloques.push({ alto: 62, antes: 14, dibujar: (y) =>
    escribir(ctx, datos.protagonista.toLocaleUpperCase("es"), cx, y + 54, { fuente: (px) => `600 ${px}px ${CAPS}`, px: 62, min: 34, max: 760, espacio: 2, color: "oro" }) });

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
  if (datos.invitado) {
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
  const medir = () => ({
    altos: bloques.reduce((s, b) => s + b.alto, 0),
    huecos: bloques.reduce((s, b) => s + b.antes, 0),
  });

  // El sello es adorno: entra solo si queda lugar
  const R = compacta ? 46 : 54;
  const bloqueSello = { alto: R * 2.75, antes: 20, dibujar: (y: number) => dibujarSello(ctx, cx, y + R, R, datos.iniciales) };
  { const m = medir(); if (m.altos + bloqueSello.alto + (m.huecos + bloqueSello.antes) * 0.45 <= disponible) bloques.push(bloqueSello); }

  // Reparte el espacio libre entre los bloques y centra el conjunto en el marco.
  // Si aun con los huecos al mínimo no entra (carrera + familia + versículo…),
  // todo el contenido se escala un poco alrededor del centro: mejor letra algo
  // más chica que un texto que pisa el marco.
  // En el formato para estados sobra alto: el contenido se agranda un poco
  // en vez de quedar flotando en el medio.
  const { altos, huecos } = medir();
  const factor = Math.min(1.5, Math.max(0.35, (disponible - altos) / Math.max(huecos, 1)));
  const total = altos + huecos * factor;
  const escala = total > disponible
    ? disponible / total
    : formato === "historia" ? Math.min(1.16, (disponible * 0.9) / total) : 1;
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

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}
