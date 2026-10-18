// ─── Retos de fotos del muro ──────────────────────────────────────────────────
//
// Dos misiones para que los invitados suban fotos: una con la protagonista
// («Con la quinceañera») y una del pastel. Se ven arriba del muro como
// círculos; tocar uno muestra solo esas fotos.
//
// Cada invitado sube 1 foto libre y 1 por cada reto (antes, 1 y nada más: quien
// ya había subido la suya no podía cumplir ninguno). En la base, la foto lleva
// la clave del reto en fotos.reto (supabase-retos-muro.sql); el nombre que se
// muestra cambia según el evento, la clave no.

export type RetoId = "protagonista" | "pastel";
export type IconoReto = "corona" | "birrete" | "anillos" | "estrella" | "pastel";
export type Reto = { id: RetoId; nombre: string; icono: IconoReto };

export const RETOS_IDS: readonly RetoId[] = ["protagonista", "pastel"];

/** La clave de un reto guardada en la base, o null si no es un reto. */
export function retoDe(v: unknown): RetoId | null {
  return typeof v === "string" && (RETOS_IDS as readonly string[]).includes(v) ? (v as RetoId) : null;
}

/**
 * Los retos del evento, con el nombre que corresponde: «Con la quinceañera»,
 * «Con los novios», «Con Carlos» (graduación y cumpleaños, por su nombre de
 * pila), y siempre «El pastel».
 */
export function retosDelEvento(tipo: string, protagonista: { nombre: string; esPersona: boolean }): Reto[] {
  const pila = protagonista.esPersona ? protagonista.nombre.trim().split(/\s+/)[0] : "";
  const conQuien: Reto =
    tipo === "quinceañera" ? { id: "protagonista", nombre: "Con la quinceañera", icono: "corona" }
    : tipo === "boda" ? { id: "protagonista", nombre: "Con los novios", icono: "anillos" }
    : tipo === "graduacion" ? { id: "protagonista", nombre: pila ? `Con ${pila}` : "Con quien se gradúa", icono: "birrete" }
    : { id: "protagonista", nombre: pila ? `Con ${pila}` : "Con los anfitriones", icono: "estrella" };
  return [conQuien, { id: "pastel", nombre: "El pastel", icono: "pastel" }];
}

/**
 * Qué fotos le quedan por subir a un invitado: la libre (reto null) y una por
 * cada reto que todavía no cumplió.
 */
export function cuposDeFotos(subidas: (string | null | undefined)[], retos: Reto[]) {
  const libre = !subidas.some((r) => !retoDe(r));
  const pendientes = retos.filter((r) => !subidas.includes(r.id));
  return { libre, pendientes, lleno: !libre && pendientes.length === 0 };
}
