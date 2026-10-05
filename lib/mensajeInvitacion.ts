// ─── Textos de la invitación y del recordatorio para WhatsApp ─────────────────
//
// Cortos a propósito: el mensaje viaja con la tarjeta (que ya tiene todo
// escrito) y con la vista previa del enlace. Acá va lo mínimo: qué se celebra,
// un saludo, cuándo y dónde en dos líneas, y el enlace para confirmar.
//
// Sin *negritas* ni _cursivas_: WhatsApp solo las dibuja cuando los asteriscos
// quedan pegados a una palabra, y en la caja de texto antes de enviar, en la
// leyenda de una imagen compartida o en otras apps se ven tal cual. Los
// emojis hacen de títulos y no dependen de ningún formato.
//
// El enlace va solo en su línea y es el ÚNICO del mensaje: WhatsApp arma la
// vista previa con el primero que encuentra.

import { extrasDe, familiaDe, fechaDiaMes, fechaLarga, fraseGraduacion, fraseInvitacion, hablaElProtagonista, horaCorta, motivoCelebracion, protagonistaDe, type EventoTarjeta } from "@/lib/tarjetaInvitacion";
import { nombreDePila, saludo, type Trato } from "@/lib/tratoInvitado";

export type EventoMensaje = EventoTarjeta & { fecha_limite_confirmacion?: string | null };

/** Lo que se sabe del invitado además del nombre. */
export type OpcionesMensaje = {
  /** Lugares reservados; null/undefined = no se menciona (o lo elige el invitado) */
  personas?: number | null;
};

const EMOJI: Record<string, string> = {
  graduacion: "🎓",
  boda: "💍",
  quinceañera: "👑",
  cumpleaños: "🎂",
};

function fechaLocal(fecha: string): Date {
  const [y, m, d] = fecha.split("T")[0].split("-").map((n) => parseInt(n, 10));
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Días de calendario que faltan para `fecha` (0 = hoy, negativo = ya pasó). */
export function diasHasta(fecha: string, hoy = new Date()): number {
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((fechaLocal(fecha).getTime() - inicioHoy.getTime()) / 86_400_000);
}

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const normal = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Nombres de evento que solo dicen el tipo: a esos se les suma "de Andrea"
const SOLO_TIPO = /^(mi |la |el )?(graduacion|boda|cumpleanos|xv anos|quinceanera|fiesta|celebracion)$/;

// "🎓 Graduación de Andrea Castillo": qué se celebra y de quién, en una línea.
// `nombra` dice si el título ya nombra al protagonista (la frase no lo repite).
function titulo(evento: EventoMensaje): { texto: string; nombra: boolean } {
  const emoji = EMOJI[evento.tipo];
  const nombre = evento.nombre.trim();
  const p = protagonistaDe(evento);
  // "Graduación de Carlos - Ingeniería 2026" ya nombra a Carlos Humberto Chavarría
  const primerNombre = normal(p.nombre).split(/\s+/)[0] ?? "";
  const yaLoDice = normal(nombre).includes(normal(p.nombre))
    || (primerNombre.length >= 3 && new RegExp(`\\b${primerNombre}\\b`).test(normal(nombre)));
  const texto = !p.esPersona || yaLoDice ? nombre
    : SOLO_TIPO.test(normal(nombre)) ? `${nombre} de ${p.nombre}`
    : `${nombre} · ${p.nombre}`;
  return { texto: emoji ? `${emoji} ${texto}` : texto, nombra: p.esPersona };
}

// "Sábado 31 de octubre" (con el año solo si no es el de hoy)
function fechaCorta(fecha: string, hoy: Date) {
  const dia = fechaLarga(fecha).split(" ")[0];
  return `${dia} ${fechaDiaMes(fecha, hoy.getFullYear())}`;
}

// Cuándo y dónde, en dos líneas. Los tres íconos nacieron como símbolos de
// texto: sin el selector U+FE0F algunos teléfonos los muestran en blanco y
// negro, por eso va escrito explícito.
function cuandoYDonde(evento: EventoMensaje, hoy: Date, conFecha = true) {
  const ex = extrasDe(evento);
  const hora = evento.hora ? horaCorta(evento.hora) : null;
  const cuando = [conFecha && evento.fecha ? fechaCorta(evento.fecha, hoy) : null, hora].filter(Boolean).join(" · ");
  const donde = [evento.lugar?.trim(), ex.direccion].filter(Boolean).join(", ");
  return [
    cuando && `\u{1F5D3}️ ${cuando}`,
    donde && `\u{1F3DB}️ ${donde}`,
  ].filter(Boolean).join("\n");
}

function firma(evento: EventoMensaje) {
  const quien = familiaDe(evento) || evento.anfitriones?.trim();
  return quien ? `Con cariño, ${quien}` : "";
}

// " antes del 10 de noviembre", solo si ese día todavía no pasó y es antes del evento
function plazo(evento: EventoMensaje, hoy: Date) {
  const limite = evento.fecha_limite_confirmacion;
  if (!limite || diasHasta(limite, hoy) < 0) return "";
  // Un plazo el mismo día del evento o después no orienta a nadie ("confirmá
  // antes del 3 de noviembre" para una fiesta del 31 de octubre): se omite
  if (evento.fecha && diasHasta(limite, hoy) >= diasHasta(evento.fecha, hoy)) return "";
  const anio = evento.fecha ? parseInt(evento.fecha.slice(0, 4), 10) : null;
  return ` antes del ${fechaDiaMes(limite, anio)}`;
}

/** El mensaje que acompaña a la tarjeta. */
export function armarMensajeInvitacion(evento: EventoMensaje, nombreInvitado: string, link: string, trato: Trato, hoy = new Date(), opciones: OpcionesMensaje = {}): string {
  const plural = trato === "plural";
  const t = titulo(evento);
  // Si el título ya nombra al graduado, la frase no lo repite ("…celebrar este logro")
  const frase = fraseInvitacion(evento, plural, t.nombra);
  const lugares = opciones.personas && opciones.personas > 1 ? `\u{1F39F}️ ${opciones.personas} lugares reservados` : "";
  const confirmar = plural
    ? `✅ Confirmen su asistencia${plazo(evento, hoy) || " aquí"}:`
    : `✅ Confirmá tu asistencia${plazo(evento, hoy) || " aquí"}:`;

  return [
    t.texto,
    `${saludo(nombreDePila(nombreInvitado), trato)}:\n${mayuscula(frase)}.`,
    [cuandoYDonde(evento, hoy), lugares].filter(Boolean).join("\n"),
    `${confirmar}\n${link}`,
    firma(evento),
  ].filter(Boolean).join("\n\n");
}

/**
 * Invitación especial para quien está lejos pero fue parte del logro: no se
 * le pide confirmar; se le agradece y se lo invita a ver las fotos y dejar su
 * mensaje. Mismo enlace personal: la página sabe que es "a distancia".
 */
export function armarMensajeDistancia(evento: EventoMensaje, nombreInvitado: string, link: string, trato: Trato): string {
  const plural = trato === "plural";
  const yo = hablaElProtagonista(evento);
  const graduacion = evento.tipo === "graduacion";
  // En graduación, qué se estudió y dónde: "Me gradúo de Ingeniería en Sistemas…, y aunque estés lejos…"
  const estudio = fraseGraduacion(evento);
  const lejos = estudio
    ? `${estudio.charAt(0).toUpperCase()}${estudio.slice(1)}, y aunque ${plural ? "estén lejos, fueron" : "estés lejos, fuiste"} parte de este logro.`
    : plural
    ? (graduacion ? "Aunque estén lejos, fueron parte de este logro." : "Aunque estén lejos, son parte de este momento.")
    : (graduacion ? "Aunque estés lejos, fuiste parte de este logro." : "Aunque estés lejos, sos parte de este momento.");
  const gracias = plural ? "Gracias por su cariño y su apoyo." : "Gracias por tu cariño y tu apoyo.";
  const preparamos = `${plural ? "Les" : "Te"} ${yo ? "preparé" : "preparamos"}`;
  const invitacion = plural
    ? `${preparamos} una invitación especial para que vivan la celebración desde donde estén: las fotos del gran día y un espacio para su mensaje.`
    : `${preparamos} una invitación especial para que vivas la celebración desde donde estés: las fotos del gran día y un espacio para tu mensaje.`;

  return [
    titulo(evento).texto,
    `${saludo(nombreDePila(nombreInvitado), trato)}:\n${lejos} ${gracias}`,
    invitacion,
    `\u{1F48C} ${plural ? "Su" : "Tu"} invitación especial:\n${link}`,
    firma(evento),
  ].filter(Boolean).join("\n\n");
}

/**
 * El día del evento (o la víspera), para quienes confirmaron: la hora, el
 * lugar y cómo llegar, sin tener que buscar la invitación.
 */
export function armarMensajeDia(evento: EventoMensaje, nombreInvitado: string, link: string, trato: Trato, hoy = new Date()): string {
  const plural = trato === "plural";
  const ex = extrasDe(evento);
  const dias = evento.fecha ? diasHasta(evento.fecha, hoy) : null;
  const esperamos = plural ? "Los esperamos" : "Te esperamos";
  const aviso = dias === 0 ? `¡Hoy es el día! ${esperamos}.`
    : dias === 1 ? `¡Mañana es el día! ${esperamos}.`
    : `¡Ya casi es el día! ${esperamos}.`;
  const datos = [
    cuandoYDonde(evento, hoy, dias !== 0 && dias !== 1),
    ex.referencia && `\u{1F4CD} Referencia: ${ex.referencia}`,
  ].filter(Boolean).join("\n");
  const enlace = plural ? "Cómo llegar (Google Maps y Waze), en su invitación:" : "Cómo llegar (Google Maps y Waze), en tu invitación:";

  return [
    titulo(evento).texto,
    `${saludo(nombreDePila(nombreInvitado), trato)}:\n${aviso}`,
    datos,
    `${enlace}\n${link}`,
    firma(evento),
  ].filter(Boolean).join("\n\n");
}

/**
 * Recordatorio para quien todavía no confirmó: cuánto falta, cuándo y dónde,
 * y el mismo enlace personal. Un empujoncito, no otra invitación.
 */
export function armarMensajeRecordatorio(evento: EventoMensaje, nombreInvitado: string, link: string, trato: Trato, hoy = new Date()): string {
  const plural = trato === "plural";
  const motivo = motivoCelebracion(evento);
  const dias = evento.fecha ? diasHasta(evento.fecha, hoy) : null;
  const cuando =
    dias === 0 ? `hoy celebramos ${motivo}`
    : dias === 1 ? `mañana celebramos ${motivo}`
    : dias === 7 ? `falta una semana para celebrar ${motivo}`
    : dias !== null && dias > 1 && dias < 7 ? `faltan ${dias} días para celebrar ${motivo}`
    : `se acerca el día de celebrar ${motivo}`;
  const recordamos = plural
    ? `Les recordamos con cariño que ${cuando}, y todavía no recibimos su confirmación.`
    : `Te recordamos con cariño que ${cuando}, y todavía no recibimos tu confirmación.`;
  const confirmar = plural
    ? `¿Nos acompañan? Confirmen${plazo(evento, hoy)} aquí:`
    : `¿Nos acompañás? Confirmá${plazo(evento, hoy)} aquí:`;

  return [
    titulo(evento).texto,
    `${saludo(nombreDePila(nombreInvitado), trato)}:\n${recordamos}`,
    cuandoYDonde(evento, hoy),
    `${confirmar}\n${link}`,
    firma(evento),
  ].filter(Boolean).join("\n\n");
}
