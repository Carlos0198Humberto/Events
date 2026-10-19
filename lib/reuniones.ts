// ─── Reuniones del día de la graduación ───────────────────────────────────────
//
// Además de la ceremonia, el graduado (o su familia) arma encuentros más
// chicos ese día: una reunión familiar, una cena, un almuerzo con los amigos.
// Cada uno es una invitación aparte: su tarjeta, su mensaje de WhatsApp, su
// enlace, y cada invitado confirma si va (supabase-reuniones.sql). Los
// invitados salen de la lista de la graduación o se agregan nuevos.
//
// El cupo ofrecido (num_personas) y los que van (personas_confirmadas) son dos
// columnas distintas a propósito: mezclarlas hacía que el Excel de invitados
// contara lugares de gente que no confirmó.

import { armarDatosTarjeta, conMetal, extrasDe, paletaDe, PALETAS_TARJETA, type DatosTarjeta, type EventoTarjeta } from "@/lib/tarjetaInvitacion";
import type { Trato } from "@/lib/tratoInvitado";

export type Reunion = {
  id: string;
  evento_id: string;
  nombre: string;
  fecha: string | null;
  hora: string | null;
  lugar: string | null;
  direccion: string | null;
  nota: string | null;
  /** Los colores de su tarjeta (una paleta de PALETAS_TARJETA); null = el de siempre */
  color?: string | null;
  created_at?: string;
};

export type EstadoReunion = "pendiente" | "confirmado" | "rechazado";

export type InvitadoReunion = {
  id: string;
  reunion_id: string;
  invitado_id: string | null;
  nombre: string;
  telefono: string | null;
  /** Lugares que se le ofrecen */
  num_personas: number;
  token: string;
  estado: EstadoReunion;
  /** Cuántos van (solo cuando confirmó) */
  personas_confirmadas: number | null;
  respondido_at?: string | null;
  enviado_at?: string | null;
};

export const MAX_NOMBRE_REUNION = 60;
export const MAX_LUGAR_REUNION = 160;
export const MAX_DIRECCION_REUNION = 200;
export const MAX_NOTA_REUNION = 300;
/** La nota entra en la tarjeta solo si cabe en sus tres renglones */
const NOTA_EN_TARJETA = 120;

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

// ─── El color de la tarjeta de la reunión ─────────────────────────────────────
// Distinto del de la invitación de la graduación: si no, la tarjeta de la
// reunión se confundía con la de la ceremonia. Cada reunión elige el suyo.

/** Los colores que puede tener una reunión, en el orden en que se ofrecen. */
export const COLORES_REUNION = ["esmeralda", "rosa", "azul", "negro", "marfil"] as const;

/** Un color guardado que la app conoce, o null. */
export function colorValido(v: unknown): string | null {
  return typeof v === "string" && (COLORES_REUNION as readonly string[]).includes(v) ? v : null;
}

/**
 * El color de una reunión que todavía no eligió el suyo: el primero que no sea
 * el de la invitación de la graduación ni el negro de la pre-invitación.
 */
export function colorPorDefecto(evento: Pick<EventoTarjeta, "tipo" | "tarjeta">): string {
  const delEvento = paletaDe(evento).id;
  return COLORES_REUNION.find((c) => c !== delEvento && c !== "negro") ?? "esmeralda";
}

export function colorDeReunion(evento: Pick<EventoTarjeta, "tipo" | "tarjeta">, reunion: Pick<Reunion, "color">): string {
  return colorValido(reunion.color) ?? colorPorDefecto(evento);
}

/** Lo que se guarda de una reunión, ya limpio; o el motivo por el que no se puede. */
export function limpiarReunion(v: Partial<Record<"nombre" | "fecha" | "hora" | "lugar" | "direccion" | "nota" | "color", unknown>>):
  { ok: true; datos: Omit<Reunion, "id" | "evento_id" | "created_at"> } | { ok: false; error: string } {
  const nombre = texto(v.nombre, MAX_NOMBRE_REUNION);
  if (!nombre) return { ok: false, error: "Ponele un nombre a la reunión (ej. Reunión familiar)" };
  const fecha = typeof v.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.fecha) ? v.fecha : null;
  const hora = typeof v.hora === "string" && /^\d{2}:\d{2}(:\d{2})?$/.test(v.hora) ? v.hora.slice(0, 5) : null;
  if (!fecha) return { ok: false, error: "Elegí el día de la reunión" };
  if (!hora) return { ok: false, error: "Elegí la hora de la reunión" };
  return {
    ok: true,
    datos: {
      nombre, fecha, hora,
      lugar: texto(v.lugar, MAX_LUGAR_REUNION) || null,
      direccion: texto(v.direccion, MAX_DIRECCION_REUNION) || null,
      nota: texto(v.nota, MAX_NOTA_REUNION) || null,
      color: colorValido(v.color),
    },
  };
}

/** El enlace propio de cada invitado a una reunión (16 letras y números). */
export function nuevoTokenReunion(): string {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const azar = new Uint8Array(16);
  crypto.getRandomValues(azar);
  return Array.from(azar, (b) => letras[b % letras.length]).join("");
}

/** El evento visto como si fuera la reunión: su día, hora, lugar y dirección. */
export function eventoDeReunion(evento: EventoTarjeta, reunion: Pick<Reunion, "fecha" | "hora" | "lugar" | "direccion">): EventoTarjeta {
  const ex = extrasDe(evento);
  return {
    ...evento,
    fecha: reunion.fecha,
    hora: reunion.hora,
    lugar: reunion.lugar,
    // Sin etapa: la reunión no es la pre-invitación ni el agradecimiento
    tarjeta: { ...ex, etapa: null, direccion: reunion.direccion ?? null },
  };
}

const CON_MOTIVO: Record<string, string> = {
  graduacion: "CON MOTIVO DE LA GRADUACIÓN DE",
  boda: "CON MOTIVO DE LA BODA DE",
  quinceañera: "CON MOTIVO DE LOS XV AÑOS DE",
  cumpleaños: "CON MOTIVO DEL CUMPLEAÑOS DE",
};

/**
 * La tarjeta de la reunión: el diseño de gala con el nombre de la reunión en
 * letra caligráfica, «con motivo de la graduación de», el graduado, su
 * carrera, y el día, la hora y el lugar de la reunión. Sin foto (el birrete).
 * En su propio color, para que no se confunda con la invitación a la ceremonia.
 */
export function datosTarjetaReunion(evento: EventoTarjeta, reunion: Pick<Reunion, "nombre" | "fecha" | "hora" | "lugar" | "direccion" | "nota" | "color">, nombreInvitado: string, trato?: Trato | null): DatosTarjeta {
  const base = armarDatosTarjeta(eventoDeReunion(evento, reunion), nombreInvitado, trato);
  const plural = trato === "plural";
  const nota = reunion.nota?.trim() || "";
  return {
    ...base,
    tituloScript: reunion.nombre,
    honor: CON_MOTIVO[evento.tipo] ?? "CON MOTIVO DE LA CELEBRACIÓN DE",
    institucion: null,
    dedicatoria: nota && nota.length <= NOTA_EN_TARJETA ? nota : null,
    versiculo: null,
    foto: null,
    diseno: "gala",
    letraNombre: "mayusculas",
    // Su propio color, con el metal de la invitación (oro, plata u oro rosa)
    paleta: conMetal(PALETAS_TARJETA[colorDeReunion(evento, reunion)], extrasDe(evento).metal),
    especial: false,
    reserva: false,
    gracias: false,
    cta: plural ? "Confirmen si van en el enlace del mensaje" : "Confirmá si vas en el enlace del mensaje",
  };
}

/** Cuántos van, cuántos no y cuántos no respondieron todavía. */
export function resumenReunion(invitados: Pick<InvitadoReunion, "estado" | "num_personas" | "personas_confirmadas">[]) {
  const de = (e: EstadoReunion) => invitados.filter((i) => i.estado === e);
  const pendientes = de("pendiente");
  return {
    invitaciones: invitados.length,
    confirmados: de("confirmado").length,
    van: de("confirmado").reduce((s, i) => s + Math.max(1, i.personas_confirmadas ?? 1), 0),
    noVan: de("rechazado").length,
    sinRespuesta: pendientes.length,
    cupoSinRespuesta: pendientes.reduce((s, i) => s + Math.max(1, i.num_personas || 1), 0),
  };
}
