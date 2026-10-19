import { describe, expect, it } from "vitest";
import { estadoDe, lugaresSinConfirmar, personasQueVan, resumenInvitados } from "@/lib/resumenInvitados";

describe("cuántos van de verdad", () => {
  const lista = [
    { estado: "confirmado", num_personas: 3 },          // van 3
    { estado: "confirmado", num_personas: 1 },          // va 1
    { estado: "pendiente", num_personas: 4 },           // cupo de 4, sin respuesta
    { estado: "pendiente", num_personas: 2, cupo_elije_invitado: true }, // elige cuántos
    { estado: "rechazado", num_personas: 5 },           // dijo que no: no van 5
    { estado: "pendiente", num_personas: 2, a_distancia: true },        // a distancia: no ocupa lugar
  ];

  it("solo suma a los que confirmaron: el cupo de pendientes y rechazados no cuenta", () => {
    const r = resumenInvitados(lista);
    expect(r.confirmados).toEqual({ invitaciones: 2, personas: 4 });
    expect(r.pendientes).toEqual({ invitaciones: 2, lugares: 4, eligen: 1 });
    expect(r.rechazados.invitaciones).toBe(1);
    expect(r.distancia.invitaciones).toBe(1);
    expect(r.invitaciones).toBe(6);
  });

  it("por invitación", () => {
    expect(personasQueVan({ estado: "rechazado", num_personas: 5 })).toBe(0);
    expect(personasQueVan({ estado: "pendiente", num_personas: 4 })).toBe(0);
    expect(personasQueVan({ estado: "confirmado", num_personas: null })).toBe(1);
    expect(lugaresSinConfirmar({ estado: "pendiente", num_personas: 4 })).toBe(4);
    expect(lugaresSinConfirmar({ estado: "pendiente", cupo_elije_invitado: true })).toBeNull();
    expect(lugaresSinConfirmar({ estado: "confirmado", num_personas: 3 })).toBe(0);
    expect(estadoDe({ estado: null })).toBe("pendiente");
    expect(estadoDe({ estado: "confirmado", a_distancia: true })).toBe("confirmado");
  });
});
