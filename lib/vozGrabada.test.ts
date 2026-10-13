import { describe, expect, it } from "vitest";
import { VOZ, claveVoz, textoParaVoz, urlPublicaVoz } from "@/lib/vozGrabada";

describe("la voz de las invitaciones", () => {
  it("la elegida es Sharvard (mujer)", () => {
    expect(VOZ.modelo).toContain("sharvard");
    expect(VOZ.hablante).toBe(1);
  });

  it("dice «quince» por XV y no estira el «Hola»", () => {
    expect(textoParaVoz("Los XV años de Ashley")).toBe("Los quince años de Ashley");
    expect(textoParaVoz("¡Holaaa, Rosa!")).toBe("¡Hola, Rosa!");
    expect(textoParaVoz("  dos   espacios ")).toBe("dos espacios");
  });

  it("la misma frase cae siempre en el mismo archivo (navegador y servidor)", async () => {
    const a = await claveVoz("¡Holaaa, Rosa!");
    const b = await claveVoz("¡Hola,  Rosa!");
    expect(a).toBe(b);
    expect(a).toMatch(/^voz\/sharvard-f-v1\/[0-9a-f]{64}\.wav$/);
    expect(await claveVoz("¡Hola, Juan!")).not.toBe(a);
  });

  it("arma la dirección pública del archivo", () => {
    expect(urlPublicaVoz("https://x.supabase.co/", "voz/a.wav")).toBe("https://x.supabase.co/storage/v1/object/public/musica-eventos/voz/a.wav");
  });
});
