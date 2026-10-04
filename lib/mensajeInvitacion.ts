// ─── Textos de la invitación y del recordatorio para WhatsApp ─────────────────
//
// Sin *negritas* ni _cursivas_: WhatsApp solo las dibuja cuando los asteriscos
// quedan pegados a una palabra, y en la caja de texto antes de enviar, en la
// leyenda de una imagen compartida o en otras apps se ven tal cual. Los
// emojis hacen de títulos y no dependen de ningún formato.
//
// El enlace va solo en su línea: así WhatsApp lo reconoce entero, se puede
// tocar y genera la vista previa con la tarjeta.

import { fechaDiaMes, fechaLarga, fraseInvitacion, horaCorta, motivoCelebracion, type EventoTarjeta } from "@/lib/tarjetaInvitacion";
import { saludo, type Trato } from "@/lib/tratoInvitado";
import { versiculoDe } from "@/lib/versiculos";

export type EventoMensaje = EventoTarjeta & { fecha_limite_confirmacion?: string | null };

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

function encabezado(evento: EventoMensaje) {
  return `${EMOJI[evento.tipo] ?? "✨"} ${evento.nombre.trim()}`;
}

// 🗓️ 🕰️ 🏛️ en vez de los de siempre (📅 ⏰ 📍). Los tres nacieron como
// símbolos de texto: sin el selector U+FE0F algunos teléfonos los muestran
// en blanco y negro, por eso va escrito explícito.
function detalles(evento: EventoMensaje) {
  return [
    evento.fecha && `\u{1F5D3}️ ${fechaLarga(evento.fecha)}`,
    evento.hora && horaCorta(evento.hora) && `\u{1F570}️ ${horaCorta(evento.hora)}`,
    evento.lugar?.trim() && `\u{1F3DB}️ ${evento.lugar.trim()}`,
  ].filter(Boolean).join("\n");
}

function despedida(evento: EventoMensaje) {
  return evento.anfitriones?.trim() ? `Con cariño,\n${evento.anfitriones.trim()}` : "";
}

// " antes del 10 de noviembre", solo si ese día todavía no pasó
function plazo(evento: EventoMensaje, hoy: Date) {
  const limite = evento.fecha_limite_confirmacion;
  if (!limite || diasHasta(limite, hoy) < 0) return "";
  const anio = evento.fecha ? parseInt(evento.fecha.slice(0, 4), 10) : null;
  return ` antes del ${fechaDiaMes(limite, anio)}`;
}

export function armarMensajeInvitacion(evento: EventoMensaje, nombreInvitado: string, link: string, trato: Trato, hoy = new Date()): string {
  const plural = trato === "plural";
  const frase = fraseInvitacion(evento, plural);
  const versiculo = versiculoDe(evento.versiculo_texto, evento.versiculo_cita);
  const confirmar = plural
    ? `Confirmen su asistencia${plazo(evento, hoy)} en este enlace:`
    : `Confirmá tu asistencia${plazo(evento, hoy)} en este enlace:`;

  return [
    encabezado(evento),
    `${saludo(nombreInvitado, trato)}:`,
    `${mayuscula(frase)}. ${plural ? "Esta es su invitación personal." : "Esta es tu invitación personal."}`,
    versiculo ? `«${versiculo.texto}»\n— ${versiculo.cita}` : "",
    detalles(evento),
    `${confirmar}\n${link}`,
    despedida(evento),
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
