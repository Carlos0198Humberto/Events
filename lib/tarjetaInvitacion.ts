// ─── Tarjeta de invitación: los textos, a partir del evento y el invitado ─────
//
// Lo usan tres lugares con el mismo contenido:
//   • app/confirmar/[token]/opengraph-image.tsx → la vista previa que WhatsApp
//     muestra arriba del mensaje (servidor, sin DOM).
//   • lib/tarjetaCanvas.ts → la imagen que el organizador envía (navegador).
//   • lib/mensajeInvitacion.ts → el texto del mensaje.
// Por eso acá no hay nada de DOM ni de librerías de dibujo.

import type { Trato } from "@/lib/tratoInvitado";
import { VERSICULO_BENDICION, versiculoDe, type Versiculo } from "@/lib/versiculos";

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
  agradecimiento?: string | null; // carta para los invitados a distancia, un párrafo por línea (null = la automática)
  entrada_qr?: boolean;         // false = sin entrada con código QR al confirmar
  foto_url?: string | null;     // foto propia de la tarjeta (ej. con toga); null = la de portada
  forma_foto?: FormaFoto | null;
  diseno?: DisenoTarjeta | null;
  metal?: MetalTarjeta | null;
  letra_nombre?: LetraNombre | null;
};

// Opciones de estilo de la tarjeta (las claves son lo que se guarda)
export type FormaFoto = "circulo" | "arco" | "retrato";
export type DisenoTarjeta = "moderna" | "gala" | "minimal" | "floral";
export type MetalTarjeta = "oro" | "plata" | "oro_rosa";
export type LetraNombre = "mayusculas" | "caligrafia" | "clasica";
export const FORMAS_FOTO: { id: FormaFoto; nombre: string }[] = [
  { id: "circulo", nombre: "Círculo" }, { id: "arco", nombre: "Arco" }, { id: "retrato", nombre: "Retrato" },
];
export const DISENOS_TARJETA: { id: DisenoTarjeta; nombre: string; detalle: string }[] = [
  { id: "moderna", nombre: "Moderna", detalle: "Foto grande, letra limpia y colores lisos, sin adornos" },
  { id: "gala", nombre: "Gala", detalle: "Bandas de filigrana" },
  { id: "minimal", nombre: "Minimal", detalle: "Limpio, mucho aire" },
  { id: "floral", nombre: "Floral", detalle: "Ramilletes en las esquinas" },
];
export const METALES_TARJETA: { id: MetalTarjeta; nombre: string }[] = [
  { id: "oro", nombre: "Oro" }, { id: "plata", nombre: "Plata" }, { id: "oro_rosa", nombre: "Oro rosa" },
];
export const LETRAS_NOMBRE: { id: LetraNombre; nombre: string }[] = [
  { id: "mayusculas", nombre: "Mayúsculas" }, { id: "caligrafia", nombre: "Caligrafía" }, { id: "clasica", nombre: "Clásica" },
];
const una = <T extends string>(v: unknown, lista: { id: T }[]): T | undefined =>
  lista.some((o) => o.id === v) ? (v as T) : undefined;

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
// Igual, pero respeta los saltos de línea: cada línea es un párrafo
const limpioParrafos = (v: unknown, max: number) => (typeof v === "string"
  ? v.split(/\n+/).map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n").slice(0, max)
  : "");

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
  if (typeof o.agradecimiento === "string") ex.agradecimiento = limpioParrafos(o.agradecimiento, 1500) || null;
  if (o.entrada_qr === false) ex.entrada_qr = false;
  if (typeof o.foto_url === "string" && /^(https?:|blob:|data:image\/)/.test(o.foto_url)) ex.foto_url = o.foto_url;
  ex.forma_foto = una(o.forma_foto, FORMAS_FOTO);
  ex.diseno = una(o.diseno, DISENOS_TARJETA);
  ex.metal = una(o.metal, METALES_TARJETA);
  ex.letra_nombre = una(o.letra_nombre, LETRAS_NOMBRE);
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
  foto: string | null;        // la foto de la tarjeta (propia o la de portada), si va
  formaFoto: FormaFoto;
  diseno: DisenoTarjeta;
  letraNombre: LetraNombre;
  paleta: PaletaTarjeta;      // colores (azul noche y oro, blanco perla y oro…)
  fecha: string | null;       // "Sábado 21 de noviembre de 2026"
  fechaCorta: string | null;  // "21 · NOV · 2026"
  fechaPartes: { semana: string; dia: string; mes: string; anio: string } | null; // SÁBADO · 21 · NOVIEMBRE · 2026
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

/** "Universidad de El Salvador" → "en la Universidad de El Salvador". */
export function enInstitucion(institucion: string): string {
  const i = institucion.trim();
  if (/^(la|el|los|las)\s/i.test(i)) return `en ${i.charAt(0).toLowerCase()}${i.slice(1)}`;
  if (/^(universidad|escuela|academia|facultad|normal)\b/i.test(i)) return `en la ${i}`;
  if (/^(instituto|colegio|centro|seminario|liceo|polit[eé]cnico|tecnol[oó]gico)\b/i.test(i)) return `en el ${i}`;
  return `en ${i}`;
}

/**
 * Qué se estudió, dicho en una frase: "me gradúo de Ingeniería en Sistemas
 * Informáticos en la Universidad de El Salvador" (o "Carlos se gradúa de…" si
 * firma la familia). Null si no es graduación o no cargaron carrera ni institución.
 */
export function fraseGraduacion(evento: EventoTarjeta): string | null {
  if (evento.tipo !== "graduacion") return null;
  const ex = extrasDe(evento);
  if (!ex.carrera && !ex.institucion) return null;
  const que = `${ex.carrera ? ` de ${ex.carrera}` : ""}${ex.institucion ? ` ${enInstitucion(ex.institucion)}` : ""}`;
  if (hablaElProtagonista(evento)) return `me gradúo${que}`;
  const p = protagonistaDe(evento);
  return p.esPersona ? `${p.nombre.split(/\s+/)[0]} se gradúa${que}` : `nuestro graduado se gradúa${que}`;
}

export type CartaDistancia = {
  parrafos: string[];
  /** La frase que presenta la bendición: "Y esta es mi oración por vos:" */
  oracion: string;
  /** El único texto bíblico de la invitación especial */
  bendicion: Versiculo;
  despedida: string;
  firma: string;
};

/**
 * La carta de la invitación especial a distancia. En graduación habla del
 * estudio: qué carrera y dónde, los semestres y los exámenes que esa persona
 * acompañó, y el título que va a recibir. Cierra con la bendición, el único
 * versículo. En primera persona si habla el mismo protagonista; en plural
 * ("les", "ustedes") si va a varios. Si el organizador escribió (o retocó) su
 * propia carta, esa reemplaza a la automática, un párrafo por línea; la
 * bendición queda.
 */
export function cartaDistancia(evento: EventoTarjeta, trato: Trato): CartaDistancia {
  const yo = hablaElProtagonista(evento);
  const pl = trato === "plural";
  const grad = evento.tipo === "graduacion";
  const p = protagonistaDe(evento);
  const pila = p.esPersona ? p.nombre.split(/\s+/)[0] : "";
  // Lo que cambia entre "vos" y "ustedes"
  const t = pl
    ? { te: "les", tu: "su", tus: "sus", vos: "ustedes", diste: "dieron", estes: "estén", vas: "van", veas: "vean", vivas: "vivan", sembraste: "sembraron" }
    : { te: "te", tu: "tu", tus: "tus", vos: "vos", diste: "diste", estes: "estés", vas: "vas", veas: "veas", vivas: "vivas", sembraste: "sembraste" };
  const me = yo ? "me" : "nos";
  const corazon = yo ? "mi corazón" : "nuestro corazón";
  const hoy = `${yo ? "Hoy quiero detenerme" : "Hoy queremos detenernos"} a dar${t.te} las gracias.`;
  const preparamos = `Por eso ${yo ? "preparé" : "preparamos"} esta invitación especial para ${t.vos}: para que ${t.veas} las fotos de este día y lo ${t.vivas} ${yo ? "conmigo" : "con nosotros"} desde donde ${t.estes}.`;

  let carta: string[];
  if (grad) {
    const estudio = fraseGraduacion(evento)
      ?? (yo ? "llegó el día de mi graduación" : `llegó el día de la graduación${pila ? ` de ${pila}` : ""}`);
    const titulo = yo ? "cuando reciba mi título" : pila ? `cuando ${pila} reciba su título` : "en cada momento";
    carta = [
      `${hoy} Después de años de estudio, ${estudio}, y este logro ${yo ? `no es solo mío: también lleva ${t.tu} nombre` : `también lleva ${t.tu} nombre`}.`,
      `Cada palabra de aliento, cada oración y cada muestra de cariño que ${me} ${t.diste}, aun desde lejos, ${me} sostuvieron en los semestres más difíciles, en las noches de estudio y en cada examen, y ${me} dieron fuerzas para llegar a la meta.`,
      `La distancia nunca pudo separarnos. Aunque no ${t.estes} en la ceremonia, ${t.vas} a estar en ${corazon} ${titulo}. ${preparamos}`,
    ];
  } else {
    carta = [
      `${hoy} Este día tan especial también lleva ${t.tu} nombre. Cada palabra de aliento, cada oración y cada muestra de cariño que ${me} ${t.diste}, aun desde lejos, ${me} acompañaron hasta acá.`,
      `La distancia nunca pudo separarnos. Aunque no ${t.estes} en la celebración, ${t.vas} a estar en ${corazon} en cada momento. ${preparamos}`,
    ];
  }

  const propio = extrasDe(evento).agradecimiento;
  const parrafos = propio ? propio.split("\n") : carta;
  parrafos.push(
    `${yo ? "Le pido" : "Le pedimos"} a Dios que ${t.te} devuelva multiplicado todo el bien que ${t.sembraste} en ${yo ? "mi vida" : "nuestras vidas"}, que guarde cada uno de ${t.tus} pasos y que llene ${t.tu} casa de paz.`,
  );

  return {
    parrafos,
    oracion: `Y esta es ${yo ? "mi" : "nuestra"} oración por ${t.vos}:`,
    bendicion: VERSICULO_BENDICION,
    despedida: yo ? "Con todo mi cariño y gratitud," : "Con todo nuestro cariño y gratitud,",
    firma: familiaDe(evento) || (p.esPersona ? p.nombre : quienInvitaHablado(evento)),
  };
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
  let fechaPartes: DatosTarjeta["fechaPartes"] = null;
  let dia: string | null = null;
  if (evento.fecha) {
    const d = fechaLocal(evento.fecha);
    fecha = fechaLarga(evento.fecha);
    fechaCorta = `${d.getDate()} · ${MESES[d.getMonth()]} · ${d.getFullYear()}`;
    dia = d.toLocaleDateString("es", { weekday: "long" }).toLocaleUpperCase("es");
    fechaPartes = {
      semana: dia,
      dia: String(d.getDate()),
      mes: d.toLocaleDateString("es", { month: "long" }).toLocaleUpperCase("es"),
      anio: String(d.getFullYear()),
    };
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
    foto: extras.foto === false ? null : extras.foto_url || evento.imagen_url?.trim() || null,
    // La moderna pide la foto en arco y el nombre en letra clásica; los demás diseños, el círculo y las mayúsculas
    formaFoto: extras.forma_foto ?? ((extras.diseno ?? "moderna") === "moderna" ? "arco" : "circulo"),
    diseno: extras.diseno ?? "moderna",
    letraNombre: extras.letra_nombre ?? ((extras.diseno ?? "moderna") === "moderna" ? "clasica" : "mayusculas"),
    paleta: paletaDe(evento),
    fecha,
    fechaCorta,
    fechaPartes,
    diaHora,
    hora: evento.hora ? horaEnPalabras(evento.hora) : null,
    horaCorta: hCorta,
    lugar,
    direccion,
    // La especial no lleva versículo en la tarjeta: el único va dentro de la carta
    versiculo: especial ? null : versiculoDe(evento.versiculo_texto, evento.versiculo_cita),
  };
}

// ─── Paletas de la tarjeta ────────────────────────────────────────────────────
// La tarjeta combina con el evento: azul noche y oro en graduación (la misma
// paleta de la invitación y el muro), blanco perla y oro en bodas, rosa vino y oro en
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
// Tinta azul marino para la paleta clara (lo que en las oscuras es el dorado)
const AZUL_TINTA: [number, string][] = [
  [0, "#1B2A4E"], [0.3, "#34507F"], [0.5, "#22365F"], [0.74, "#3B5A8E"], [1, "#1A284A"],
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
  // La clave sigue siendo "marfil" (es lo que guardaron los eventos), pero es
  // papel blanco con tinta azul marino: el crema y el dorado sobre claro se
  // veían viejos. El dorado vuelve solo si se elige el metal "Oro".
  marfil: {
    id: "marfil", nombre: "Blanco y azul marino",
    fondo: "#F4F6FA", fondoCentro: "#FFFFFF", banda: "#EDF0F6",
    oroPlano: "#2D4372", textoSuave: "#4E5870", textoFuerte: "#152039", textoVersiculo: "#2C3245",
    tinta: "#FFFFFF", sombra: "rgba(22,32,57,0.16)", dorado: AZUL_TINTA,
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

// Plata y oro rosa: mismas cinco paradas (oscuro → brillo → oscuro → brillo →
// oscuro). La versión "profunda" es para fondos claros (blanco perla).
const METALES: Record<Exclude<MetalTarjeta, "oro">, { brillo: [number, string][]; profundo: [number, string][]; plano: string; planoProfundo: string }> = {
  plata: {
    brillo: [[0, "#7D848C"], [0.28, "#E9EDF1"], [0.5, "#A7AEB6"], [0.74, "#F7F9FB"], [1, "#858C94"]],
    profundo: [[0, "#4E555C"], [0.28, "#8E969E"], [0.5, "#5F666D"], [0.74, "#9AA2AA"], [1, "#4A5056"]],
    plano: "#CDD3DA", planoProfundo: "#5F666D",
  },
  oro_rosa: {
    brillo: [[0, "#9A5F52"], [0.28, "#F2C7B8"], [0.5, "#C08070"], [0.74, "#FAD9CC"], [1, "#A06656"]],
    profundo: [[0, "#7A4336"], [0.28, "#B97A68"], [0.5, "#8E5546"], [0.74, "#C58B79"], [1, "#6E3B30"]],
    plano: "#E9B6A6", planoProfundo: "#8E5546",
  },
};

/** La paleta con el metal elegido (el oro es el de la propia paleta). */
export function conMetal(paleta: PaletaTarjeta, metal: MetalTarjeta | null | undefined): PaletaTarjeta {
  const claro = paleta.id === "marfil";
  // En la clara, sin metal elegido va la tinta azul; "Oro" la vuelve dorada
  if (claro && metal === "oro") return { ...paleta, dorado: DORADO_PROFUNDO, oroPlano: "#8C6A26" };
  if (!metal || metal === "oro") return paleta;
  const m = METALES[metal];
  return { ...paleta, dorado: claro ? m.profundo : m.brillo, oroPlano: claro ? m.planoProfundo : m.plano };
}

/** Colores lisos del diseño moderno: fondo, tinta, texto suave, acento y líneas finas. */
export type TintasPlanas = { fondo: string; tinta: string; suave: string; acento: string; linea: string };
const PLANAS: Record<string, Omit<TintasPlanas, "acento" | "linea">> = {
  marfil: { fondo: "#FFFFFF", tinta: "#152039", suave: "#5A6379" },
  azul: { fondo: "#0F1A36", tinta: "#FFFFFF", suave: "#B9C2D9" },
  negro: { fondo: "#121214", tinta: "#FFFFFF", suave: "#BEBEC4" },
  rosa: { fondo: "#3A0F27", tinta: "#FFFFFF", suave: "#E8C9D7" },
  esmeralda: { fondo: "#0B2E24", tinta: "#FFFFFF", suave: "#BFD6CC" },
};
export function tintasPlanas(P: PaletaTarjeta): TintasPlanas {
  const base = PLANAS[P.id] ?? PLANAS.azul;
  const h = P.oroPlano.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return { ...base, acento: P.oroPlano, linea: `rgba(${r},${g},${b},${P.id === "marfil" ? 0.22 : 0.38})` };
}

/** La paleta elegida por el organizador (o la del tipo de evento), con su metal. */
export function paletaDe(evento: Pick<EventoTarjeta, "tipo" | "tarjeta">): PaletaTarjeta {
  const ex = extrasDe(evento);
  const base = PALETAS_TARJETA[ex.paleta ?? ""] ?? PALETAS_TARJETA[PALETA_POR_TIPO[evento.tipo] ?? "negro"];
  return conMetal(base, ex.metal);
}

export const doradoCss = (p: PaletaTarjeta) =>
  `linear-gradient(100deg, ${p.dorado.map(([q, c]) => `${c} ${Math.round(q * 100)}%`).join(", ")})`;
