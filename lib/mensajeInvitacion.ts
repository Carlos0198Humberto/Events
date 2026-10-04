// ─── Textos de la invitación y del recordatorio para WhatsApp ─────────────────
//
// Sin *negritas* ni _cursivas_: WhatsApp solo las dibuja cuando los asteriscos
// quedan pegados a una palabra, y en la caja de texto antes de enviar, en la
// leyenda de una imagen compartida o en otras apps se ven tal cual. Los
// emojis hacen de títulos y no dependen de ningún formato.
//
// El enlace va solo en su línea: así WhatsApp lo reconoce entero, se puede
// tocar y genera la vista previa con la tarjeta.

import { extrasDe, familiaDe, fechaDiaMes, fechaLarga, fraseInvitacion, horaCorta, motivoCelebracion, protagonistaDe, type EventoTarjeta } from "@/lib/tarjetaInvitacion";
import { saludo, type Trato } from "@/lib/tratoInvitado";
import { versiculoDe } from "@/lib/versiculos";

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

const normal = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// "🎓 Graduación" y, debajo, de quién: el nombre del graduado (si el título
// del evento no lo dice ya), sin adornos. Un tipo sin emoji propio va sin emoji.
function encabezado(evento: EventoMensaje) {
  const emoji = EMOJI[evento.tipo];
  const titulo = emoji ? `${emoji} ${evento.nombre.trim()}` : evento.nombre.trim();
  const p = protagonistaDe(evento);
  const quien = p.esPersona && !normal(evento.nombre).includes(normal(p.nombre)) ? p.nombre : "";
  return [titulo, quien].filter(Boolean).join("\n");
}

// 🗓️ 🕰️ 🏛️ en vez de los de siempre (📅 ⏰ 📍). Los tres nacieron como
// símbolos de texto: sin el selector U+FE0F algunos teléfonos los muestran
// en blanco y negro, por eso va escrito explícito.
function detalles(evento: EventoMensaje) {
  const ex = extrasDe(evento);
  return [
    evento.fecha && `\u{1F5D3}️ ${fechaLarga(evento.fecha)}`,
    evento.hora && horaCorta(evento.hora) && `\u{1F570}️ ${horaCorta(evento.hora)}`,
    evento.lugar?.trim() && `\u{1F3DB}️ ${[evento.lugar.trim(), ex.direccion].filter(Boolean).join(", ")}`,
    ex.referencia && `\u{1F4CD} Referencia: ${ex.referencia}`,
  ].filter(Boolean).join("\n");
}

// De qué se gradúa: "Licenciatura en Enfermería · Universidad de El Salvador"
function logro(evento: EventoMensaje) {
  if (evento.tipo !== "graduacion") return "";
  const ex = extrasDe(evento);
  return [ex.carrera, ex.institucion].filter(Boolean).join(" · ");
}

// "Te reservamos 2 lugares." — el invitado sabe desde el mensaje a cuántos invitaron
function lugares(personas: number | null | undefined, plural: boolean) {
  if (!personas || personas < 1) return plural ? "Esta es su invitación personal." : "Esta es tu invitación personal.";
  if (personas === 1) return plural ? "Esta es su invitación personal." : "Te reservamos tu lugar.";
  return `${plural ? "Les" : "Te"} reservamos ${personas} lugares.`;
}

function despedida(evento: EventoMensaje) {
  const firma = familiaDe(evento) || evento.anfitriones?.trim();
  return firma ? `Con cariño,\n${firma}` : "";
}

// " antes del 10 de noviembre", solo si ese día todavía no pasó
function plazo(evento: EventoMensaje, hoy: Date) {
  const limite = evento.fecha_limite_confirmacion;
  if (!limite || diasHasta(limite, hoy) < 0) return "";
  // Un plazo el mismo día del evento o después no orienta a nadie ("confirmá
  // antes del 3 de noviembre" para una fiesta del 31 de octubre): se omite
  if (evento.fecha && diasHasta(limite, hoy) >= diasHasta(evento.fecha, hoy)) return "";
  const anio = evento.fecha ? parseInt(evento.fecha.slice(0, 4), 10) : null;
  return ` antes del ${fechaDiaMes(limite, anio)}`;
}

/**
 * El mensaje que acompaña a la tarjeta. El enlace de confirmación es el ÚNICO
 * enlace del texto: WhatsApp arma la vista previa con el primero que encuentra,
 * y un link de Maps antes que él mostraría un mapa en lugar de la invitación.
 * La ubicación con Maps y Waze está dentro de la invitación.
 */
export function armarMensajeInvitacion(evento: EventoMensaje, nombreInvitado: string, link: string, trato: Trato, hoy = new Date(), opciones: OpcionesMensaje = {}): string {
  const plural = trato === "plural";
  const frase = fraseInvitacion(evento, plural);
  const versiculo = versiculoDe(evento.versiculo_texto, evento.versiculo_cita);
  const presencia = plural ? "Su presencia hará este día todavía más especial." : "Tu presencia hará este día todavía más especial.";
  const confirmar = plural
    ? `\u2705 Confirmen su asistencia${plazo(evento, hoy)} en este enlace:`
    : `\u2705 Confirmá tu asistencia${plazo(evento, hoy)} en este enlace:`;
  const enElEnlace = plural
    ? "Ahí también encuentran la ubicación con Google Maps y Waze y todos los detalles."
    : "Ahí también encontrás la ubicación con Google Maps y Waze y todos los detalles.";
  const logroTexto = logro(evento);

  return [
    [encabezado(evento), logroTexto].filter(Boolean).join("\n"),
    `${saludo(nombreInvitado, trato)}:\n${mayuscula(frase)}. ${presencia}`,
    versiculo ? `«${versiculo.texto}»\n— ${versiculo.cita}` : "",
    [detalles(evento), `\u{1F39F}️ ${lugares(opciones.personas, plural)}`].filter(Boolean).join("\n"),
    `${confirmar}\n${link}\n${enElEnlace}`,
    despedida(evento),
  ].filter(Boolean).join("\n\n");
}

/**
 * El día del evento (o la víspera), para quienes confirmaron: que no tengan
 * que buscar la invitación para saber la hora y cómo llegar.
 */
export function armarMensajeDia(evento: EventoMensaje, nombreInvitado: string, link: string, trato: Trato, hoy = new Date()): string {
  const plural = trato === "plural";
  const ex = extrasDe(evento);
  const motivo = motivoCelebracion(evento);
  const dias = evento.fecha ? diasHasta(evento.fecha, hoy) : null;
  const esperamos = plural ? "Los esperamos" : "Te esperamos";
  const aviso =
    dias === 0 ? `¡Hoy es el día! ${esperamos} para celebrar ${motivo}.`
    : dias === 1 ? `¡Mañana es el día! ${esperamos} para celebrar ${motivo}.`
    : `¡Ya casi es el día! ${esperamos} para celebrar ${motivo}.`;
  const cuando = [
    dias !== 0 && dias !== 1 && evento.fecha && `\u{1F5D3}️ ${fechaLarga(evento.fecha)}`,
    evento.hora && horaCorta(evento.hora) && `\u{1F570}️ ${horaCorta(evento.hora)}`,
    evento.lugar?.trim() && `\u{1F3DB}️ ${[evento.lugar.trim(), ex.direccion].filter(Boolean).join(", ")}`,
    ex.referencia && `\u{1F4CD} Referencia: ${ex.referencia}`,
  ].filter(Boolean).join("\n");
  const enlace = plural
    ? "En su invitación tienen la ubicación con Google Maps y Waze y todos los detalles:"
    : "En tu invitación tenés la ubicación con Google Maps y Waze y todos los detalles:";

  return [
    encabezado(evento),
    `${saludo(nombreInvitado, trato)}:\n${aviso}`,
    cuando,
    `${enlace}\n${link}`,
    ["¡Nos vemos pronto!", despedida(evento)].filter(Boolean).join("\n\n"),
  ].filter(Boolean).join("\n\n");
}

/**
 * Recordatorio para quien todavía no confirmó: cuánto falta, los datos y el
 * mismo enlace personal. Corto a propósito: es un empujoncito, no otra
 * invitación.
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
    ? `¿Nos acompañan? Confirmen su asistencia${plazo(evento, hoy)} en este enlace:`
    : `¿Nos acompañás? Confirmá tu asistencia${plazo(evento, hoy)} en este enlace:`;

  return [
    encabezado(evento),
    `${saludo(nombreInvitado, trato)}:`,
    recordamos,
    detalles(evento),
    `${confirmar}\n${link}`,
    despedida(evento),
  ].filter(Boolean).join("\n\n");
}
