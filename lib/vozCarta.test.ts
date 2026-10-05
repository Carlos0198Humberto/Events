import { describe, expect, it } from "vitest";
import { nombreDePila, saludoDeCarta } from "@/lib/tratoInvitado";
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
    expect(saludoDeCarta("Rosa María Pérez", "f")).toBe("Querida Rosa,");
    expect(saludoDeCarta("Alex Ramos", "neutro")).toBe("Alex,");
  });
});
