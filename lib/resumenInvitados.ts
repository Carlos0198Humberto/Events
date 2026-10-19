// ─── Cuántos van, de verdad ───────────────────────────────────────────────────
//
// `num_personas` significa dos cosas según el estado: al invitado pendiente es
// el cupo que se le ofreció (todavía no dijo nada); al confirmado, cuántos van
// (la confirmación lo cambia). El rechazado lo conserva aunque no va nadie. El
// Excel los sumaba todos juntos como «personas confirmadas»: contaba el cupo
// de los que no confirmaron y de los que dijeron que no.

export type InvitadoConteo = {
  estado?: string | null;
  num_personas?: number | null;
  /** Invitación especial a distancia: no confirma ni ocupa lugar */
  a_distancia?: boolean | null;
  /** El invitado elige cuántos van: mientras no confirme, no hay un número */
  cupo_elije_invitado?: boolean | null;
};

export type EstadoConteo = "confirmado" | "pendiente" | "rechazado" | "distancia";

export function estadoDe(inv: InvitadoConteo): EstadoConteo {
  if (inv.estado === "confirmado") return "confirmado";
  if (inv.estado === "rechazado") return "rechazado";
  return inv.a_distancia ? "distancia" : "pendiente";
}

const personas = (n?: number | null) => (typeof n === "number" && n > 0 ? n : 1);

/** Cuántas personas van con esta invitación (solo cuenta si confirmó). */
export function personasQueVan(inv: InvitadoConteo): number {
  return estadoDe(inv) === "confirmado" ? personas(inv.num_personas) : 0;
}

/** El cupo ofrecido que todavía no tiene respuesta (null = elige cuántos van). */
export function lugaresSinConfirmar(inv: InvitadoConteo): number | null {
  if (estadoDe(inv) !== "pendiente") return 0;
  return inv.cupo_elije_invitado ? null : personas(inv.num_personas);
}

export function resumenInvitados(invitados: InvitadoConteo[]) {
  const de = (e: EstadoConteo) => invitados.filter((i) => estadoDe(i) === e);
  const pendientes = de("pendiente");
  return {
    confirmados: { invitaciones: de("confirmado").length, personas: invitados.reduce((s, i) => s + personasQueVan(i), 0) },
    pendientes: {
      invitaciones: pendientes.length,
      lugares: pendientes.reduce((s, i) => s + (lugaresSinConfirmar(i) ?? 0), 0),
      /** Pendientes que eligen cuántos van: su cupo no se puede sumar */
      eligen: pendientes.filter((i) => lugaresSinConfirmar(i) === null).length,
    },
    rechazados: { invitaciones: de("rechazado").length },
    distancia: { invitaciones: de("distancia").length },
    invitaciones: invitados.length,
  };
}
