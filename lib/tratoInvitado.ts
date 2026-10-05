// ─── Cómo dirigirse a cada invitado: a ella, a él o a varios ──────────────────
//
// "Estimada/o María" suena a formulario. El trato se deduce del nombre tal como
// lo escribió el organizador: un prefijo ("Sra.", "Tío", "Dra.") manda; si no,
// el primer nombre (listas de nombres frecuentes en Centroamérica y México, y
// la terminación en -a / -o). Cuando no hay forma de saberlo ("Alexis",
// "Trinidad", un apodo) el trato es neutro y el saludo no lleva género:
// equivocarse de género con un invitado es peor que no marcarlo.
//
// El organizador puede corregirlo por invitado; la corrección se guarda en el
// navegador (tratoGuardado / guardarTrato) y la usan todos los envíos.

export type Trato = "f" | "m" | "plural" | "neutro";

export const ETIQUETAS_TRATO: Record<Trato, string> = {
  f: "Ella",
  m: "Él",
  plural: "Varios",
  neutro: "Sin género",
};

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const lista = (s: string) => new Set(s.trim().split(/\s+/));

const FEMENINOS = lista(`
  abigail abril adeline alison allison amparo anabel angeles annabel arely areli ashley asuncion aydee
  danielle ivon michelle yvon
  beatriz belen betty carmen chloe cindy concepcion consuelo daisy darling deisy deysi delmy dolores
  doris dulce edith elizabeth elisabeth elsy emely emily encarnacion ester esther evelin evelyn fe flor
  gisel gisell giselle gisselle gladys grisel guadalupe haydee hazel heidi heidy ines ingrid irene iris
  isabel isis itzel ivette ivonne ivy jacqueline jackeline jaqueline janet janeth jasmin jasmine jazmin
  jeimy jenifer jennifer jenny jeny jocelyn joselin joselyn karen karin katerin katherine kathy kelly
  kimberli kimberly lady leidy leonor leslie lesly lisbet lisbeth liseth lisset lisseth lizbeth lourdes
  lucy luz mabel madelin madeline madelyn maite margot maribel mariel marilyn marisel marisol marlen
  marlene marleny mary mercedes mercy milagros miriam mirian montserrat muriel nancy naomi nayeli nelly
  nely nicol nicole nieves noemi noemy nohemi nohemy odette paz pilar raquel remedios rocio rosmery
  rosemary ruby rut ruth sharon sherly shirley sindy socorro sol soledad wendy yamilet yamileth yaneth
  yasmin yazmin yeny yenny yoselin yocelin yvette yvonne zoe
`);

const MASCULINOS = lista(`
  aaron abdiel abel abner abraham adam adan adiel adrian agustin aldair alex alexander alvin amilcar
  dante mike steve
  anderson andres andy angel anthony ariel axel baltazar bautista benjamin bladimir borja brayan brian
  bryan byron caleb carlos charles christian christopher cristian cristofer damian daniel david dennis
  denis diego douglas dylan edenilson edgar edson edwin eduardo efrain elder eleazar elias eliezer
  elmer elvis enrique eric erick erik esteban ethan ezequiel ezra fabian felipe felix fidel franklin
  freddy gabriel gael gamaliel gaspar geovanny gerson german gilberto giovanni harry heber hector henry
  hernan isaac isai isaias ismael israel ivan jack jafet jaime jair james jared jason jefferson jeferson
  jeremias jeremy jesus jhon jhonatan jhony jimmy joaquin joel johan john johnny jonathan jonatan jorge
  jose joseph josh joshua josias josue josua juan julian justin kenneth kenny kevin larry leonel lucas
  luca luis manases manuel marcos martin marvin matias max melchor melvin michael miguel milton misael
  moises nahum natanael nelson nestor nicola nicolas nixon noe noel obed omar oscar osmin peter rafael
  ramon raul reinaldo rene richard robert roger ronald rony ruben rudy samuel santos saul sebastian
  simon stanley steven stiven teddy thomas tobias tomas tony ulises uriel vicente victor vladimir
  walter wesley wesly william wilber wilfredo wilmer wilson yair yeferson yohan yonatan yonathan
`);

// Nombres que se usan para los dos: mejor no adivinar
const AMBIGUOS = lista("alexis cruz dani eli noa pat reyes rosario sasha trinidad yuri");

// Prefijos y parentescos que dicen el género por sí solos (ya sin tildes ni eñes)
const PREFIJO_F = lista("sra srta senora senorita dona dra licda inga profa mtra tia abuela prima madrina hermana hna seno pastora");
const PREFIJO_M = lista("sr senor don dr tio abuelo primo padrino hermano hno pastor");
// Títulos que no dicen el género: se saltan y se mira el nombre que sigue
const PREFIJO_NEUTRO = lista("lic ing prof arq profe");

// Palabras que hacen del invitado un grupo. "los"/"las" solo al principio:
// "María de los Ángeles" es una persona. La "e" solo como conjunción ("José e
// Isabel"), no como inicial ("Ana E. García").
const GRUPO = /(^|\s)(y|&|\+)(\s|$)|\se\s+h?i|^(los|las)\s|\b(familia|familias|flia|fam|esposos|hermanos|hermanas|senores|sres|matrimonio|amigos|amigas|primos|primas|tios|tias|padres|abuelos|novios)\b/;

/** Deduce el trato a partir del nombre escrito por el organizador. */
export function detectarTrato(nombre: string): Trato {
  const limpio = sinTildes(nombre).replace(/[.,;:]/g, " ").replace(/\s+/g, " ").trim();
  if (!limpio) return "neutro";
  if (GRUPO.test(limpio)) return "plural";

  const palabras = limpio.split(" ");
  let i = 0;
  while (i < palabras.length - 1 && PREFIJO_NEUTRO.has(palabras[i])) i++;
  const primera = palabras[i];
  if (PREFIJO_F.has(primera)) return "f";
  if (PREFIJO_M.has(primera)) return "m";

  // "Ma." / "Ma" es la abreviatura de María
  if (primera === "ma") return "f";
  if (AMBIGUOS.has(primera)) return "neutro";
  if (FEMENINOS.has(primera)) return "f";
  if (MASCULINOS.has(primera)) return "m";
  if (primera.length < 2) return "neutro";
  if (/a$/.test(primera)) return "f";
  if (/o$/.test(primera)) return "m";
  if (/(eth|ith)$/.test(primera)) return "f";
  if (/(an|on|el|er|os|as|us|ar|or)$/.test(primera)) return "m";
  return "neutro";
}

const PLURAL_FEMENINO = /^(hermanas|amigas|primas|tias|tías|señoras|senoras|sras)\b/i;

/**
 * Saludo de una carta o un mensaje, sin puntuación final:
 * "Querida María José", "Querido Carlos", "Queridos Juan y Ana",
 * "Querida familia López", "Hola, Alex".
 */
export function saludo(nombre: string, trato: Trato): string {
  const n = nombre.trim();
  if (/^(la\s+)?(familia|flia\.?|fam\.)\s/i.test(n)) return `Querida ${n}`;
  if (/^(el\s+)?matrimonio\s/i.test(n)) return `Querido ${n}`;
  if (trato === "f") return `Querida ${n}`;
  if (trato === "m") return `Querido ${n}`;
  if (trato === "plural") return `${PLURAL_FEMENINO.test(n) ? "Queridas" : "Queridos"} ${n}`;
  return `Hola, ${n}`;
}

// "Tía Rosa María" → "Tía Rosa"; "Rosa María Pérez" → "Rosa"; "Juan Pérez y Ana Gómez" → "Juan y Ana".
// En una carta se escribe el nombre de pila, no el de la lista.
const TITULO = /^(t[ií][oa]|abuel[oa]|prim[oa]|herman[oa]|padrin[oa]|madrina|don|doña|sr\.?|sra\.?|srta\.?|dr\.?|dra\.?|lic\.?|licda\.?|ing\.?|pastor|pastora|hno\.?|hna\.?)$/i;
export function nombreDePila(nombre: string): string {
  const limpio = nombre.trim();
  if (/^(la\s+)?(familia|flia\.?|fam\.)\s/i.test(limpio)) return limpio;
  if (/\s+y\s+/i.test(limpio)) return limpio.split(/\s+y\s+/i).map(nombreDePila).join(" y ");
  const partes = limpio.split(/\s+/);
  return TITULO.test(partes[0]) && partes[1] ? `${partes[0]} ${partes[1]}` : partes[0];
}

/** El encabezado de una carta: "Querida Rosa," o, sin género, "Alex,". */
export function saludoDeCarta(nombre: string, trato: Trato): string {
  const n = nombreDePila(nombre);
  return trato === "neutro" ? `${n},` : `${saludo(n, trato)},`;
}

/**
 * Cambia "Querido/a", "Bienvenido/a", "invitado/a" por la forma que
 * corresponde. Con trato neutro el texto queda como está.
 */
export function generoEnTexto(texto: string, trato: Trato): string {
  if (trato === "neutro") return texto;
  return texto.replace(/([A-Za-zÁÉÍÓÚáéíóúÑñÜü]+?)(?:o\/a|a\/o|o\(a\))(?![A-Za-zÁÉÍÓÚáéíóúÑñ])/g, (_, raiz: string) =>
    raiz + (trato === "f" ? "a" : trato === "m" ? "o" : "os"),
  );
}

// ── Corrección manual, por invitado (en este navegador) ─────────────────────
const CLAVE = (token: string) => `evorix_trato_${token}`;

export function tratoGuardado(token: string): Trato | null {
  try {
    const v = localStorage.getItem(CLAVE(token));
    return v === "f" || v === "m" || v === "plural" || v === "neutro" ? v : null;
  } catch {
    return null;
  }
}

export function guardarTrato(token: string, trato: Trato) {
  try { localStorage.setItem(CLAVE(token), trato); } catch { /* sin almacenamiento: vale solo para este envío */ }
}

/** El trato corregido por el organizador o, si no lo corrigió, el deducido. */
export function tratoDe(nombre: string, token?: string): Trato {
  return (token && tratoGuardado(token)) || detectarTrato(nombre);
}
