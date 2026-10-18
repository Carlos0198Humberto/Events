import { describe, expect, it } from "vitest";
import { cuposDeFotos, retoDe, retosDelEvento } from "@/lib/retosMuro";

describe("retos del muro", () => {
  it("en XV: con la quinceañera y el pastel (sin baile)", () => {
    const r = retosDelEvento("quinceañera", { nombre: "Ashley Sofía", esPersona: true });
    expect(r.map((x) => x.nombre)).toEqual(["Con la quinceañera", "El pastel"]);
    expect(r.map((x) => x.id)).toEqual(["protagonista", "pastel"]);
  });

  it("en los demás eventos, con quien se celebra", () => {
    expect(retosDelEvento("graduacion", { nombre: "Carlos Humberto", esPersona: true })[0].nombre).toBe("Con Carlos");
    expect(retosDelEvento("boda", { nombre: "Ana & Luis", esPersona: true })[0].nombre).toBe("Con los novios");
    expect(retosDelEvento("otro", { nombre: "Fiesta", esPersona: false })[0].nombre).toBe("Con los anfitriones");
  });

  it("solo acepta las claves que conoce", () => {
    expect(retoDe("pastel")).toBe("pastel");
    expect(retoDe("baile")).toBeNull();
    expect(retoDe(null)).toBeNull();
  });

  it("una foto libre y una por cada reto", () => {
    const retos = retosDelEvento("quinceañera", { nombre: "Ashley", esPersona: true });
    expect(cuposDeFotos([], retos)).toMatchObject({ libre: true, lleno: false });
    const c = cuposDeFotos([null], retos);
    expect([c.libre, c.pendientes.map((r) => r.id)]).toEqual([false, ["protagonista", "pastel"]]);
    expect(cuposDeFotos([null, "pastel"], retos).pendientes.map((r) => r.id)).toEqual(["protagonista"]);
    expect(cuposDeFotos(["protagonista", null, "pastel"], retos).lleno).toBe(true);
  });
});
