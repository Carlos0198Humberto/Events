import { describe, expect, it } from "vitest";
import { medidasImagen } from "@/lib/medidasImagen";

describe("medidas de una foto por su cabecera", () => {
  it("lee el ancho y el alto de un PNG", () => {
    const png = new Uint8Array(24);
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
    png.set([0, 0, 0x06, 0x40], 16); // 1600
    png.set([0, 0, 0x04, 0x2a], 20); // 1066
    expect(medidasImagen(png)).toEqual({ ancho: 1600, alto: 1066 });
  });

  it("lee el ancho y el alto de un JPEG, saltando los segmentos de antes", () => {
    const jpeg = new Uint8Array([
      0xff, 0xd8,
      0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, // APP0
      0xff, 0xdb, 0x00, 0x04, 0x00, 0x00, // DQT (corto)
      0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0x2c, 0x01, 0xc2, 0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, // SOF0: 300 × 450
    ]);
    expect(medidasImagen(jpeg)).toEqual({ ancho: 450, alto: 300 });
  });

  it("si no es PNG ni JPEG, no adivina", () => {
    expect(medidasImagen(new Uint8Array([0x52, 0x49, 0x46, 0x46]))).toBeNull();
  });
});
