// ─── Tarjeta de invitación: los textos, a partir del evento y el invitado ─────
//
// Lo usan tres lugares con el mismo contenido:
//   • app/confirmar/[token]/opengraph-image.tsx → la vista previa que WhatsApp
//     muestra arriba del mensaje (servidor, sin DOM).
//   • lib/tarjetaCanvas.ts → la imagen que el organizador envía (navegador).
//   • lib/mensajeInvitacion.ts → el texto del mensaje.
// Por eso acá no hay nada de DOM ni de librerías de dibujo.

import { saludo, type Trato } from "@/lib/tratoInvitado";
import { versiculoDe, type Versiculo } from "@/lib/versiculos";

export type EventoTarjeta = {
  nombre: string;
  tipo: string;
  anfitriones?: string | null;
  fecha?: string | null;
  hora?: string | null;
  lugar?: string | null;
  // Columnas de supabase-envios.sql (pueden no existir todavía)
  versiculo_texto?: string | null;
  versiculo_cita?: string | null;
};

export type DatosTarjeta = {
  esGraduacion: boolean;
  titulo: string;             // "Graduación" (título de la vista previa del enlace)
  tituloScript: string;       // "Invitación de Graduación" (en caligrafía)
  honor: string | null;       // "EN HONOR A" (solo graduación, con nombre de persona)
  protagonista: string;       // "Andrea Castillo"
  iniciales: string;          // "AC" (el sello)
  invitado: string;           // "María José Hernández"
  parrafo: string;            // "Querida María José, con mucha alegría te invitamos…"
  fecha: string | null;       // "Sábado 21 de noviembre de 2026"
  fechaCorta: string | null;  // "21 · NOV · 2026"
  diaHora: string | null;     // "SÁBADO · 6:00 P. M."
  hora: string | null;        // "A las seis de la tarde"
  horaCorta: string | null;   // "6:00 p. m."
  lugar: string | null;       // "Salón Los Almendros"
  direccion: string | null;   // "Km 12 Carretera al Puerto, La Libertad"
  promocion: number | null;   // 2026 (solo graduación)
  versiculo: Versiculo | null; // texto bíblico elegido por el organizador
};

const TITULOS: Record<string, string> = {
  graduacion: "Graduación",
  boda: "Nuestra boda",
  quinceañera: "Mis XV años",
  cumpleaños: "Cumpleaños",
};

const TITULOS_SCRIPT: Record<string, string> = {
  graduacion: "Invitación de Graduación",
  boda: "Invitación de Boda",
  quinceañera: "Mis XV Años",
  cumpleaños: "Invitación de Cumpleaños",
};
export const TITULO_SCRIPT_GENERICO = "Invitación";
/** Todos los títulos en caligrafía posibles (la vista previa los tiene medidos). */
export const TODOS_TITULOS_SCRIPT = [...Object.values(TITULOS_SCRIPT), TITULO_SCRIPT_GENERICO];

const HORAS = ["doce", "una", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once"];
const MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

const normal = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function fechaLocal(fecha: string): Date {
  const [y, m, d] = fecha.split("T")[0].split("-").map((n) => parseInt(n, 10));
  return new Date(y, (m || 1) - 1, d || 1);
}

/** "2026-11-21" → "Sábado 21 de noviembre de 2026" */
export function fechaLarga(fecha: string): string {
  const f = fechaLocal(fecha).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).replace(",", "");
  return mayuscula(f);
}

/** "2026-11-10" → "10 de noviembre" (con el año solo si no es `anioReferencia`) */
export function fechaDiaMes(fecha: string, anioReferencia?: number | null): string {
  const d = fechaLocal(fecha);
  const conAnio = anioReferencia != null && d.getFullYear() !== anioReferencia;
  return d.toLocaleDateString("es", conAnio ? { day: "numeric", month: "long", year: "numeric" } : { day: "numeric", month: "long" });
}

// "18:30:00" → "A las seis y media de la tarde" (como en una invitación impresa)
export function horaEnPalabras(hora: string): string | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(hora.trim());
  if (!m) return null;
  const h24 = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const h12 = h24 % 12;
  const franja =
    h24 === 12 ? "del mediodía"
    : h24 === 0 || h24 >= 19 ? "de la noche"
    : h24 < 6 ? "de la madrugada"
    : h24 < 12 ? "de la mañana"
    : "de la tarde";
  const minutos = min === 0 ? "" : min === 15 ? " y cuarto" : min === 30 ? " y media" : min === 45 ? " y cuarenta y cinco" : `:${String(min).padStart(2, "0")}`;
  return `${h12 === 1 ? "A la" : "A las"} ${HORAS[h12]}${minutos} ${franja}`;
}

/** "18:00:00" → "6:00 p. m." */
export function horaCorta(hora: string): string | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(hora.trim());
  if (!m) return null;
  const h24 = parseInt(m[1], 10);
  return `${h24 % 12 || 12}:${m[2]} ${h24 < 12 ? "a. m." : "p. m."}`;
}

// A quién se honra. El formulario sugiere "Familia Ramírez" como anfitriones y
// "Graduación de Luis — Ingeniería 2025" como nombre: el graduado está en el
// nombre del evento, no en los anfitriones. "En honor a Familia Ramírez" no se
// puede imprimir; si no hay otro nombre, la familia va sin "En honor a".
export function protagonistaDe(evento: EventoTarjeta): { nombre: string; esPersona: boolean } {
  const anfitriones = evento.anfitriones?.trim() || "";
  const m = /^\s*(?:mi\s+)?(?:graduaci[oó]n|xv\s+a[nñ]os|quince\s+a[nñ]os|cumplea[nñ]os|boda)\s+(?:de|del)\s+(.+)$/i.exec(evento.nombre);
  const delNombre = m ? m[1].split(/\s+[—–-]\s+|[,|(]/)[0].trim() : "";
  // "Graduación de la promoción 2025" no nombra a nadie
  const pareceNombre = delNombre.length > 1 && delNombre.length <= 40 && !/\d/.test(delNombre)
    && !/^(?:la|el|los|las|mi|mis|nuestra|nuestro|nuestros)\s/i.test(delNombre);
  if (pareceNombre) return { nombre: delNombre, esPersona: true };
  const esFamilia = /^(?:la\s+)?fam(?:ilia|ilias|\.)\s/i.test(anfitriones);
  if (anfitriones && !esFamilia) return { nombre: anfitriones, esPersona: true };
  return { nombre: anfitriones || evento.nombre, esPersona: false };
}

/**
 * La frase que invita, en minúscula y sin punto final:
 * "con mucha alegría te invitamos a celebrar la graduación de Andrea Castillo".
 * Si quien organiza es la misma persona que se gradúa, habla en primera
 * persona ("te invito a celebrar mi graduación"). `corta` evita repetir el
 * nombre cuando ya está escrito en grande (la tarjeta).
 */
export function fraseInvitacion(evento: EventoTarjeta, plural: boolean, corta = false): string {
  const te = plural ? "los" : "te";
  const p = protagonistaDe(evento);
  const anfitriones = normal(evento.anfitriones ?? "");
  const esAnfitrion = p.esPersona && anfitriones !== "" && anfitriones === normal(p.nombre);
  switch (evento.tipo) {
    case "graduacion":
      if (esAnfitrion) return `con mucha alegría ${te} invito a celebrar mi graduación`;
      return p.esPersona && !corta
        ? `con mucha alegría ${te} invitamos a celebrar la graduación de ${p.nombre}`
        : `con mucha alegría ${te} invitamos a celebrar este logro`;
    case "boda":
      return `con todo nuestro amor ${te} invitamos a celebrar nuestra boda`;
    case "quinceañera":
      return `con mucho cariño ${te} invito a celebrar mis XV años`;
    case "cumpleaños":
      if (esAnfitrion) return `con mucha alegría ${te} invito a celebrar mi cumpleaños`;
      return p.esPersona && !corta
        ? `con mucha alegría ${te} invitamos a celebrar el cumpleaños de ${p.nombre}`
        : `con mucha alegría ${te} invitamos a celebrar este cumpleaños`;
    default:
      return `con mucho gusto ${te} invitamos a acompañarnos en este evento especial`;
  }
}

/**
 * Qué se celebra, como complemento: "la graduación de Andrea Castillo",
 * "mi graduación", "nuestra boda", "mis XV años".
 */
export function motivoCelebracion(evento: EventoTarjeta): string {
  const p = protagonistaDe(evento);
  const anfitriones = normal(evento.anfitriones ?? "");
  const esAnfitrion = p.esPersona && anfitriones !== "" && anfitriones === normal(p.nombre);
  switch (evento.tipo) {
    case "graduacion":
      return esAnfitrion ? "mi graduación" : p.esPersona ? `la graduación de ${p.nombre}` : "esta graduación";
    case "boda":
      return "nuestra boda";
    case "quinceañera":
      return "mis XV años";
    case "cumpleaños":
      return esAnfitrion ? "mi cumpleaños" : p.esPersona ? `el cumpleaños de ${p.nombre}` : "este cumpleaños";
    default:
      return "este evento especial";
  }
}

function inicialesDe(nombre: string): string {
  const vacias = /^(de|del|la|las|los|y|e|familia|familias|flia|fam|mi|mis|xv|años)$/i;
  const letras = nombre.split(/\s+/).filter((p) => p && !vacias.test(p.replace(/\.$/, ""))).map((p) => p.charAt(0).toLocaleUpperCase("es"));
  return letras.slice(0, 2).join("") || nombre.trim().charAt(0).toLocaleUpperCase("es");
}

/**
 * Datos de la tarjeta. Con `trato`, el párrafo saluda al invitado según su
 * género ("Querida María José, …"); sin trato (la vista previa del servidor,
 * que no conoce la corrección del organizador) el párrafo no lo nombra.
 */
export function armarDatosTarjeta(evento: EventoTarjeta, nombreInvitado: string, trato?: Trato | null): DatosTarjeta {
  const esGraduacion = evento.tipo === "graduacion";
  const protagonista = protagonistaDe(evento);
  const invitado = nombreInvitado.trim();

  let fecha: string | null = null;
  let fechaCorta: string | null = null;
  let dia: string | null = null;
  let anio: number | null = null;
  if (evento.fecha) {
    const d = fechaLocal(evento.fecha);
    fecha = fechaLarga(evento.fecha);
    fechaCorta = `${d.getDate()} · ${MESES[d.getMonth()]} · ${d.getFullYear()}`;
    dia = d.toLocaleDateString("es", { weekday: "long" }).toLocaleUpperCase("es");
    anio = d.getFullYear();
  }
  const hCorta = evento.hora ? horaCorta(evento.hora) : null;
  const diaHora = [dia, hCorta?.toLocaleUpperCase("es")].filter(Boolean).join(" · ") || null;

  // "Hotel Real InterContinental, San Salvador" → lugar + dirección, como en la tarjeta impresa
  let lugar: string | null = evento.lugar?.trim() || null;
  let direccion: string | null = null;
  if (lugar && lugar.includes(",")) {
    const i = lugar.indexOf(",");
    direccion = lugar.slice(i + 1).trim() || null;
    lugar = lugar.slice(0, i).trim();
  }

  const plural = trato === "plural";
  const frase = fraseInvitacion(evento, plural, true);
  const confirmar = plural
    ? "Confirmen su asistencia en el enlace de este mensaje."
    : "Confirmá tu asistencia en el enlace de este mensaje.";
  const parrafo = trato && invitado
    ? `${trato === "neutro" ? invitado : saludo(invitado, trato)}, ${frase}. ${confirmar}`
    : `${mayuscula(frase)}. ${confirmar}`;

  return {
    esGraduacion,
    titulo: TITULOS[evento.tipo] ?? "Celebración",
    tituloScript: TITULOS_SCRIPT[evento.tipo] ?? TITULO_SCRIPT_GENERICO,
    honor: esGraduacion && protagonista.esPersona ? "EN HONOR A" : null,
    protagonista: protagonista.nombre,
    iniciales: inicialesDe(protagonista.nombre),
    invitado,
    parrafo,
    fecha,
    fechaCorta,
    diaHora,
    hora: evento.hora ? horaEnPalabras(evento.hora) : null,
    horaCorta: hCorta,
    lugar,
    direccion,
    promocion: esGraduacion ? anio : null,
    versiculo: versiculoDe(evento.versiculo_texto, evento.versiculo_cita),
  };
}

// Negro y oro, como una invitación impresa de gala
export const NEGRO_ORO = {
  fondo: "#0D0D0F",
  fondoCentro: "#1D1C20",
  banda: "#121110",
  oroPlano: "#D4B068",
  textoSuave: "#DCCBA2",
  tinta: "#3A2A10",
} as const;

/** Paradas del dorado metálico (oscuro → brillo → oscuro → brillo → oscuro). */
export const DORADO: [number, string][] = [
  [0, "#8A672C"],
  [0.28, "#E8CB82"],
  [0.5, "#B4873A"],
  [0.74, "#F4DD9A"],
  [1, "#97712F"],
];
export const DORADO_CSS = `linear-gradient(100deg, ${DORADO.map(([p, c]) => `${c} ${Math.round(p * 100)}%`).join(", ")})`;
