import { describe, expect, it } from "vitest";
import { detectarTrato, nombreDePila, personasDelNombre, saludoDeCarta } from "@/lib/tratoInvitado";
import { citaHablada } from "@/lib/versiculos";

describe("la carta en voz alta", () => {
  it("dice la cita como se lee, no como se escribe", () => {
    expect(citaHablada("Números 6:24-26")).toBe("Números, capítulo 6, versículos 24 al 26");
    expect(citaHablada("Filipenses 1:3")).toBe("Filipenses, capítulo 1, versículo 3");
    expect(citaHablada("1 Tesalonicenses 5:18")).toBe("1 Tesalonicenses, capítulo 5, versículo 18");
    expect(citaHablada("Salmo 23")).toBe("Salmo 23");
  });

  it("saluda por el nombre de pila", () => {
    expect(nombreDePila("Rosa María Pérez")).toBe("Rosa");
    expect(nombreDePila("Tía Rosa María")).toBe("Tía Rosa");
    expect(nombreDePila("Juan Pérez y Ana Gómez")).toBe("Juan y Ana");
    expect(nombreDePila("Familia López Díaz")).toBe("Familia López Díaz");
    expect(nombreDePila("Los López")).toBe("Los López");
    expect(nombreDePila("María José Hernández")).toBe("María José");
    expect(nombreDePila("Juan Carlos Pérez")).toBe("Juan Carlos");
    expect(nombreDePila("María Pérez")).toBe("María");
    expect(saludoDeCarta("Rosa María Pérez", "f")).toBe("Querida Rosa,");
    expect(saludoDeCarta("Alex Ramos", "neutro")).toBe("Alex,");
  });

  it("dos personas en el mismo invitado salen las dos, se escriban como se escriban", () => {
    expect(nombreDePila("Rosa Pérez, Juan Ramos")).toBe("Rosa y Juan");
    expect(nombreDePila("Rosa Pérez & Juan Ramos")).toBe("Rosa y Juan");
    expect(nombreDePila("Rosa Pérez / Juan Ramos")).toBe("Rosa y Juan");
    expect(nombreDePila("Rosa Pérez e Isaac Ramos")).toBe("Rosa e Isaac");
    expect(nombreDePila("Rosa, Juan y Ana López")).toBe("Rosa, Juan y Ana");
    expect(nombreDePila("Tío Juan y Tía Rosa")).toBe("Tío Juan y Tía Rosa");
    expect(personasDelNombre("Familia López, de Santa Ana")).toEqual(["Familia López, de Santa Ana"]);
    expect(detectarTrato("Rosa Pérez, Juan Ramos")).toBe("plural");
    expect(saludoDeCarta("Rosa Pérez, Juan Ramos", detectarTrato("Rosa Pérez, Juan Ramos"))).toBe("Queridos Rosa y Juan,");
  });
});
