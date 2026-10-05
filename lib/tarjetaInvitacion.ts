// ─── Tarjeta de invitación: los textos, a partir del evento y el invitado ─────
//
// Lo usan tres lugares con el mismo contenido:
//   • app/confirmar/[token]/opengraph-image.tsx → la vista previa que WhatsApp
//     muestra arriba del mensaje (servidor, sin DOM).
//   • lib/tarjetaCanvas.ts → la imagen que el organizador envía (navegador).
//   • lib/mensajeInvitacion.ts → el texto del mensaje.
// Por eso acá no hay nada de DOM ni de librerías de dibujo.

import type { Trato } from "@/lib/tratoInvitado";
import { versiculoDe, type Versiculo } from "@/lib/versiculos";

export type EventoTarjeta = {
  nombre: string;
  tipo: string;
  anfitriones?: string | null;
  fecha?: string | null;
  hora?: string | null;
  lugar?: string | null;
  imagen_url?: string | null; // foto de portada (el graduado, la quinceañera…)
  // Columnas de supabase-envios.sql (pueden no existir todavía)
  versiculo_texto?: string | null;
  versiculo_cita?: string | null;
  // Columna de supabase-tarjeta.sql (puede no existir todavía)
  tarjeta?: ExtrasTarjeta | null;
};

/**
 * Lo que el organizador escribe a propósito para la tarjeta (columna jsonb
 * `eventos.tarjeta`). Todo es opcional: sin estos datos la tarjeta se arma
 * como antes, deduciendo del nombre del evento y de los anfitriones.
 *
 * `honor`: undefined = frase por defecto; "" = sin frase; texto = esa frase.
 */
export type ExtrasTarjeta = {
  honor?: string | null;
  graduando?: string | null;    // "Andrea Sofía Castillo"
  carrera?: string | null;      // "Licenciatura en Ciencias de la Educación"
  institucion?: string | null;  // "Universidad Centroamericana José Simeón Cañas"
  familia?: string | null;      // "Familia Castillo Pérez"
  direccion?: string | null;    // "Bulevar Los Próceres, Antiguo Cuscatlán"
  referencia?: string | null;   // "Frente a la entrada principal, portón 3"
  foto?: boolean;               // false = la tarjeta va sin la foto de portada
  paleta?: string | null;       // colores de la tarjeta (PALETAS_TARJETA); null = según el tipo
  agradecimiento?: string | null; // mensaje para los invitados a distancia (null = el de siempre)
};

/** Frases sugeridas para la línea pequeña sobre el nombre, por tipo de evento. */
export const FRASES_HONOR: Record<string, string[]> = {
  graduacion: [
    "En honor a",
    "Con orgullo presentamos a",
    "Celebramos el logro de",
    "Nuestro graduado",
    "Nuestra graduada",
    "Con gratitud a Dios celebramos a",
    "Un sueño cumplido",
  ],
  boda: ["Nos casamos", "Unimos nuestras vidas", "Con la bendición de Dios"],
  quinceañera: ["Mis XV años", "Celebramos a", "Con la bendición de Dios"],
  cumpleaños: ["Celebramos a", "En honor a", "Un año más de"],
  otro: ["En honor a", "Celebramos a", "Con alegría"],
};

const limpio = (v: unknown, max = 120) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

/** Extras de la tarjeta saneados: cadenas recortadas, vacías → null (salvo `honor`). */
export function extrasDe(evento: Pick<EventoTarjeta, "tarjeta">): ExtrasTarjeta {
  const t = evento.tarjeta;
  if (!t || typeof t !== "object") return {};
  const o = t as Record<string, unknown>;
  const ex: ExtrasTarjeta = {
    graduando: limpio(o.graduando, 60) || null,
    carrera: limpio(o.carrera, 90) || null,
    institucion: limpio(o.institucion, 90) || null,
    familia: limpio(o.familia, 70) || null,
    direccion: limpio(o.direccion, 140) || null,
    referencia: limpio(o.referencia, 140) || null,
  };
  if (typeof o.honor === "string") ex.honor = limpio(o.honor, 48);
  if (typeof o.foto === "boolean") ex.foto = o.foto;
  if (typeof o.paleta === "string") ex.paleta = limpio(o.paleta, 20) || null;
  if (typeof o.agradecimiento === "string") ex.agradecimiento = limpio(o.agradecimiento, 400) || null;
  return ex;
}

export type DatosTarjeta = {
  esGraduacion: boolean;
  titulo: string;             // "Graduación" (título de la vista previa del enlace)
  tituloScript: string;       // "Invitación de Graduación" (en caligrafía)
  honor: string | null;       // "EN HONOR A" (o la frase elegida; null = sin frase)
  protagonista: string;       // "Andrea Castillo"
  carrera: string | null;     // "Licenciatura en Ciencias de la Educación"
  institucion: string | null; // "Universidad Centroamericana José Simeón Cañas"
  familia: string | null;     // "Familia Castillo Pérez" (quien invita)
  iniciales: string;          // "AC" (el sello)
  invitado: string;           // "María José Hernández"
  cta: string;                // "Confirmá tu asistencia en el enlace del mensaje"
  especial: boolean;          // invitación de agradecimiento (invitado a distancia)
  dedicatoria: string | null; // "Aunque estés lejos, fuiste parte de este logro." (solo especial)
  foto: string | null;        // URL de la foto de portada, si va en la tarjeta
  paleta: PaletaTarjeta;      // colores (azul noche y oro, marfil y oro…)
  fecha: string | null;       // "Sábado 21 de noviembre de 2026"
  fechaCorta: string | null;  // "21 · NOV · 2026"
  diaHora: string | null;     // "SÁBADO · 6:00 P. M."
  hora: string | null;        // "A las seis de la tarde"
  horaCorta: string | null;   // "6:00 p. m."
  lugar: string | null;       // "Salón Los Almendros"
  direccion: string | null;   // "Km 12 Carretera al Puerto, La Libertad"
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
export const TITULO_SCRIPT_GRATITUD = "Con gratitud";
/** Todos los títulos en caligrafía posibles (la vista previa los tiene medidos). */
export const TODOS_TITULOS_SCRIPT = [...Object.values(TITULOS_SCRIPT), TITULO_SCRIPT_GENERICO, TITULO_SCRIPT_GRATITUD];

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
  // Lo que el organizador escribió a propósito manda sobre cualquier deducción
  const graduando = extrasDe(evento).graduando;
  if (graduando) return { nombre: graduando, esPersona: true };
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

const esFamilia = (s: string) => /^(?:la\s+)?fam(?:ilia|ilias|\.)\s/i.test(s.trim());

/**
 * Quién invita, para firmar la tarjeta: "Familia Castillo Pérez". Es el campo
 * propio si existe; si no, los anfitriones cuando son una familia y no son ya
 * el protagonista (si la familia está escrita en grande, no se repite abajo).
 */
export function familiaDe(evento: EventoTarjeta): string | null {
  const propia = extrasDe(evento).familia;
  if (propia) return propia;
  const anf = evento.anfitriones?.trim() || "";
  if (!anf || !esFamilia(anf)) return null;
  const p = protagonistaDe(evento);
  return p.esPersona ? anf : null;
}

/**
 * ¿Habla el mismo protagonista? ("te invito a mi graduación"). Sí cuando
 * organiza él mismo y no firma una familia: si firma la familia, invita la familia.
 */
export function hablaElProtagonista(evento: EventoTarjeta): boolean {
  const p = protagonistaDe(evento);
  const anfitriones = normal(evento.anfitriones ?? "");
  return p.esPersona && !extrasDe(evento).familia && anfitriones !== "" && anfitriones === normal(p.nombre);
}

/**
 * Quién invita, dicho en voz alta: "Carlos Chavarría" (nombre y primer
 * apellido del protagonista) o, si no es una persona, la familia.
 */
export function quienInvitaHablado(evento: EventoTarjeta): string {
  const p = protagonistaDe(evento);
  if (p.esPersona) {
    const partes = p.nombre.split(/\s+/).filter(Boolean);
    if (/&|\sy\s/i.test(p.nombre) || partes.length <= 2) return p.nombre;
    return partes.length >= 4 ? `${partes[0]} ${partes[2]}` : `${partes[0]} ${partes[1]}`;
  }
  const familia = familiaDe(evento) || evento.anfitriones?.trim() || "";
  return /^familia\s/i.test(familia) ? `la ${familia.charAt(0).toLowerCase()}${familia.slice(1)}` : familia;
}

/**
 * El agradecimiento para los invitados a distancia: el que escribió el
 * organizador o uno según el tipo de evento, en primera persona si habla el
 * mismo protagonista.
 */
export function agradecimientoDe(evento: EventoTarjeta): string {
  const propio = extrasDe(evento).agradecimiento;
  if (propio) return propio;
  const yo = hablaElProtagonista(evento);
  const prepare = yo ? "Preparé" : "Preparamos";
  const conmigo = yo ? "conmigo" : "con nosotros";
  if (evento.tipo === "graduacion") {
    return `Aunque estés lejos, fuiste parte de este logro. Gracias por tu cariño, tus oraciones y tu apoyo en cada etapa del camino. ${prepare} esta invitación especial para que vivas la celebración ${conmigo} desde donde estés.`;
  }
  return `Aunque estés lejos, sos parte de este momento. Gracias por tu cariño de siempre. ${prepare} esta invitación especial para que vivas la celebración ${conmigo} desde donde estés.`;
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
  const esAnfitrion = hablaElProtagonista(evento);
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
  const esAnfitrion = hablaElProtagonista(evento);
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
export function armarDatosTarjeta(evento: EventoTarjeta, nombreInvitado: string, trato?: Trato | null, opciones: { distancia?: boolean } = {}): DatosTarjeta {
  const especial = !!opciones.distancia;
  const esGraduacion = evento.tipo === "graduacion";
  const protagonista = protagonistaDe(evento);
  const invitado = nombreInvitado.trim();

  let fecha: string | null = null;
  let fechaCorta: string | null = null;
  let dia: string | null = null;
  if (evento.fecha) {
    const d = fechaLocal(evento.fecha);
    fecha = fechaLarga(evento.fecha);
    fechaCorta = `${d.getDate()} · ${MESES[d.getMonth()]} · ${d.getFullYear()}`;
    dia = d.toLocaleDateString("es", { weekday: "long" }).toLocaleUpperCase("es");
  }
  const hCorta = evento.hora ? horaCorta(evento.hora) : null;
  const diaHora = [dia, hCorta?.toLocaleUpperCase("es")].filter(Boolean).join(" · ") || null;

  // "Hotel Real InterContinental, San Salvador" → lugar + dirección, como en la tarjeta impresa
  const extras = extrasDe(evento);
  let lugar: string | null = evento.lugar?.trim() || null;
  let direccion: string | null = extras.direccion ?? null;
  if (!direccion && lugar && lugar.includes(",")) {
    const i = lugar.indexOf(",");
    direccion = lugar.slice(i + 1).trim() || null;
    lugar = lugar.slice(0, i).trim();
  }

  const plural = trato === "plural";

  return {
    esGraduacion,
    titulo: TITULOS[evento.tipo] ?? "Celebración",
    tituloScript: especial ? TITULO_SCRIPT_GRATITUD : TITULOS_SCRIPT[evento.tipo] ?? TITULO_SCRIPT_GENERICO,
    honor: especial ? "INVITACIÓN ESPECIAL" : extras.honor !== undefined
      ? (extras.honor ? extras.honor.toLocaleUpperCase("es") : null)
      : esGraduacion && protagonista.esPersona ? "EN HONOR A" : null,
    protagonista: protagonista.nombre,
    carrera: extras.carrera ?? null,
    institucion: extras.institucion ?? null,
    familia: familiaDe(evento),
    iniciales: inicialesDe(protagonista.nombre),
    invitado,
    cta: especial
      ? (plural ? "Abran su invitación en el enlace del mensaje" : "Abrí tu invitación en el enlace del mensaje")
      : plural ? "Confirmen su asistencia en el enlace del mensaje" : "Confirmá tu asistencia en el enlace del mensaje",
    especial,
    dedicatoria: especial
      ? (evento.tipo === "graduacion" ? "Aunque estés lejos, fuiste parte de este logro." : "Aunque estés lejos, sos parte de este momento.")
      : null,
    foto: extras.foto === false ? null : evento.imagen_url?.trim() || null,
    paleta: paletaDe(evento),
    fecha,
    fechaCorta,
    diaHora,
    hora: evento.hora ? horaEnPalabras(evento.hora) : null,
    horaCorta: hCorta,
    lugar,
    direccion,
    versiculo: versiculoDe(evento.versiculo_texto, evento.versiculo_cita),
  };
}

// ─── Paletas de la tarjeta ────────────────────────────────────────────────────
// La tarjeta combina con el evento: azul noche y oro en graduación (la misma
// paleta de la invitación y el muro), marfil y oro en bodas, rosa vino y oro en
// XV años, negro y oro en lo demás. El organizador puede elegir otra.
export type PaletaTarjeta = {
  id: string;
  nombre: string;
  fondo: string;
  fondoCentro: string;   // la luz suave del centro
  banda: string;         // el fondo de las bandas de filigrana
  oroPlano: string;      // dorado plano: frase de honor, institución, llamado a confirmar
  textoSuave: string;    // día y hora, dirección, la frase que invita
  textoFuerte: string;   // "Para …", la carrera
  textoVersiculo: string;
  tinta: string;         // iniciales del sello
  sombra: string;        // sombra de las bandas
  dorado: [number, string][]; // paradas del dorado metálico
};

// Paradas del dorado metálico (oscuro → brillo → oscuro → brillo → oscuro)
const DORADO_CLASICO: [number, string][] = [
  [0, "#8A672C"], [0.28, "#E8CB82"], [0.5, "#B4873A"], [0.74, "#F4DD9A"], [1, "#97712F"],
];
// Sobre fondo claro el dorado tiene que ser más oscuro para leerse
const DORADO_PROFUNDO: [number, string][] = [
  [0, "#7A5718"], [0.28, "#B88E3A"], [0.5, "#8C6420"], [0.74, "#C9A04A"], [1, "#6E4E15"],
];

export const PALETAS_TARJETA: Record<string, PaletaTarjeta> = {
  negro: {
    id: "negro", nombre: "Negro y oro",
    fondo: "#0D0D0F", fondoCentro: "#1D1C20", banda: "#121110",
    oroPlano: "#D4B068", textoSuave: "#DCCBA2", textoFuerte: "#F1E3BF", textoVersiculo: "#EFE2C2",
    tinta: "#3A2A10", sombra: "rgba(0,0,0,0.7)", dorado: DORADO_CLASICO,
  },
  azul: {
    id: "azul", nombre: "Azul noche y oro",
    fondo: "#0A0F24", fondoCentro: "#1E2B5E", banda: "#0C1430",
    oroPlano: "#DBBF7C", textoSuave: "#D9D3BF", textoFuerte: "#F3E7C4", textoVersiculo: "#EDE4C8",
    tinta: "#3A2A10", sombra: "rgba(0,0,10,0.7)", dorado: DORADO_CLASICO,
  },
  marfil: {
    id: "marfil", nombre: "Marfil y oro",
    fondo: "#F7F1E4", fondoCentro: "#FFFDF8", banda: "#EFE4CC",
    oroPlano: "#93702C", textoSuave: "#5E4B2C", textoFuerte: "#3A2A10", textoVersiculo: "#4A3B22",
    tinta: "#3A2A10", sombra: "rgba(110,80,30,0.28)", dorado: DORADO_PROFUNDO,
  },
  rosa: {
    id: "rosa", nombre: "Rosa vino y oro",
    fondo: "#2B0A1D", fondoCentro: "#5A1A3D", banda: "#24081A",
    oroPlano: "#E6C27E", textoSuave: "#F0D5E0", textoFuerte: "#FCE7F1", textoVersiculo: "#F6E1EA",
    tinta: "#3A2A10", sombra: "rgba(10,0,6,0.7)", dorado: DORADO_CLASICO,
  },
  esmeralda: {
    id: "esmeralda", nombre: "Esmeralda y oro",
    fondo: "#05241B", fondoCentro: "#0F4A36", banda: "#041E16",
    oroPlano: "#DBBF7C", textoSuave: "#D3E3D8", textoFuerte: "#F1EBD0", textoVersiculo: "#E6EEDF",
    tinta: "#3A2A10", sombra: "rgba(0,8,4,0.7)", dorado: DORADO_CLASICO,
  },
};

const PALETA_POR_TIPO: Record<string, string> = { graduacion: "azul", boda: "marfil", quinceañera: "rosa" };

/** La paleta elegida por el organizador o, si no eligió, la del tipo de evento. */
export function paletaDe(evento: Pick<EventoTarjeta, "tipo" | "tarjeta">): PaletaTarjeta {
  const elegida = extrasDe(evento).paleta;
  return PALETAS_TARJETA[elegida ?? ""] ?? PALETAS_TARJETA[PALETA_POR_TIPO[evento.tipo] ?? "negro"];
}

export const doradoCss = (p: PaletaTarjeta) =>
  `linear-gradient(100deg, ${p.dorado.map(([q, c]) => `${c} ${Math.round(q * 100)}%`).join(", ")})`;
