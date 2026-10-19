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

import { extrasDe, familiaDe, limpiarDedicatoriaPersonal, fechaDiaMes, fechaLarga, fraseGraduacion, fraseInvitacion, hablaElProtagonista, textosGracias, textosReserva, horaCorta, motivoCelebracion, protagonistaDe, type EventoTarjeta, type VinculoDistancia } from "@/lib/tarjetaInvitacion";
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
 * Si el organizador le escribió una frase a esa persona, va en lugar del
 * agradecimiento según el vínculo.
 */
export function armarMensajeDistancia(evento: EventoMensaje, nombreInvitado: string, link: string, trato: Trato, vinculo: VinculoDistancia | null = null, dedicatoria: string | null = null): string {
  const plural = trato === "plural";
  const yo = hablaElProtagonista(evento);
  const graduacion = evento.tipo === "graduacion";
  // En graduación, qué se estudió y dónde: "Me gradúo de Ingeniería en Sistemas…, y aunque estés lejos…"
  const estudio = fraseGraduacion(evento);
  // Lo que dice "aunque estés lejos…", según a quién va
  const parte = (() => {
    const momento = graduacion ? "este logro" : "este momento";
    if (vinculo === "familia") return plural ? `son parte de esta familia y de ${momento}` : `sos parte de esta familia y de ${momento}`;
    if (vinculo === "amigos") return `${plural ? "su" : "tu"} amistad ${graduacion ? "fue" : "es"} parte de ${momento}`;
    if (vinculo === "hermanos") return `${plural ? "sus" : "tus"} oraciones ${graduacion ? "fueron" : "son"} parte de ${momento}`;
    return plural ? (graduacion ? "fueron parte de este logro" : "son parte de este momento") : (graduacion ? "fuiste parte de este logro" : "sos parte de este momento");
  })();
  const aunque = plural ? "aunque estén lejos" : "aunque estés lejos";
  const lejos = estudio
    ? `${estudio.charAt(0).toUpperCase()}${estudio.slice(1)}, y ${aunque}, ${parte}.`
    : `${aunque.charAt(0).toUpperCase()}${aunque.slice(1)}, ${parte}.`;
  const gracias = limpiarDedicatoriaPersonal(dedicatoria) ??
    (vinculo === "familia" ? (plural ? "Gracias por su cariño de familia, sus llamadas y sus oraciones." : "Gracias por tu cariño de familia, tus llamadas y tus oraciones.")
    : vinculo === "amigos" ? (plural ? "Gracias por su amistad y por estar siempre." : "Gracias por tu amistad y por estar siempre.")
    : vinculo === "hermanos" ? `${yo ? "Doy" : "Damos"} gracias a Dios por ${plural ? "sus vidas" : "tu vida"} y por la comunión que tenemos en Cristo.`
    : plural ? "Gracias por su cariño y su apoyo." : "Gracias por tu cariño y tu apoyo.");
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
 * La pre-invitación (primer momento de la graduación): que conste que está
 * invitado, la fecha para apartarla y que la invitación para confirmar llega
 * después. Sin hora, lugar ni enlace: eso va en la invitación formal.
 */
export function armarMensajeReserva(evento: EventoMensaje, nombreInvitado: string, trato: Trato): string {
  const t = textosReserva(evento, trato);
  // Sin enlace: la pre-invitación es la tarjeta y este texto. El enlace llega
  // con la invitación formal, la que se confirma
  return [
    titulo(evento).texto,
    `${saludo(nombreDePila(nombreInvitado), trato)}:\n${t.constancia}`,
    evento.fecha ? `\u{1F5D3}\u{FE0F} ${fechaLarga(evento.fecha)}\n${t.apartar}` : t.apartar,
    t.despues,
    firma(evento),
  ].filter(Boolean).join("\n\n");
}

/**
 * El agradecimiento (tercer momento, después del evento), solo para quien
 * fue. El enlace lleva a las fotos del día y a la voz que lee el agradecimiento.
 */
export function armarMensajeGracias(evento: EventoMensaje, nombreInvitado: string, link: string, trato: Trato): string {
  const t = textosGracias(evento, trato);
  return [
    titulo(evento).texto,
    `${saludo(nombreDePila(nombreInvitado), trato)}:\n${t.texto}`,
    `\u{1F4F8} ${t.fotos.replace(/\.$/, ":")}\n${link}`,
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

/** Lo que el mensaje necesita de una reunión del día (lib/reuniones). */
export type ReunionMensaje = {
  nombre: string;
  fecha?: string | null;
  hora?: string | null;
  lugar?: string | null;
  direccion?: string | null;
  nota?: string | null;
};

/**
 * La invitación aparte a una reunión del día de la graduación (una reunión
 * familiar, una cena): qué es, cuándo y dónde, los lugares, y el enlace propio
 * de la reunión para confirmar si va.
 */
export function armarMensajeReunion(evento: EventoMensaje, reunion: ReunionMensaje, nombreInvitado: string, link: string, trato: Trato, hoy = new Date(), opciones: OpcionesMensaje = {}): string {
  const plural = trato === "plural";
  const yo = hablaElProtagonista(evento);
  const te = plural ? "los" : "te";
  // El día, la hora y el lugar son los de la reunión, no los de la ceremonia
  const ev: EventoMensaje = {
    ...evento,
    fecha: reunion.fecha ?? null,
    hora: reunion.hora ?? null,
    lugar: reunion.lugar ?? null,
    tarjeta: { ...extrasDe(evento), direccion: reunion.direccion ?? null },
  };
  const lugares = opciones.personas && opciones.personas > 1 ? `\u{1F39F}️ ${opciones.personas} lugares reservados` : "";
  const confirmar = plural ? "✅ Confirmen si van aquí:" : "✅ Confirmá si vas aquí:";

  return [
    titulo(evento).texto,
    `${saludo(nombreDePila(nombreInvitado), trato)}:\nCon mucha alegría ${te} ${yo ? "invito" : "invitamos"} a celebrar ${motivoCelebracion(evento)} en un momento especial:`,
    [`✨ ${reunion.nombre.trim()}`, cuandoYDonde(ev, hoy), lugares].filter(Boolean).join("\n"),
    reunion.nota?.trim() ?? "",
    `${confirmar}\n${link}`,
    firma(evento),
  ].filter(Boolean).join("\n\n");
}
