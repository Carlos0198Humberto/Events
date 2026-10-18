import { describe, expect, it } from "vitest";
import { marcoParaFoto, medidasImagen } from "@/lib/medidasImagen";

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

describe("marco para que la foto se vea entera", () => {
  it("la quinceañera de cuerpo entero (9:16): el arco toma su proporción y el círculo pasa a retrato", () => {
    expect(marcoParaFoto(9 / 16, "arco")).toEqual({ forma: "arco", aspecto: 9 / 16 });
    expect(marcoParaFoto(9 / 16, "circulo")).toEqual({ forma: "retrato", aspecto: 9 / 16 });
  });

  it("una foto 3:4 del celular entra entera en el arco; en el círculo, el círculo queda", () => {
    expect(marcoParaFoto(0.75, "arco")).toEqual({ forma: "arco", aspecto: 0.75 });
    expect(marcoParaFoto(0.75, "circulo")).toEqual({ forma: "circulo", aspecto: 1 });
  });

  it("horizontal: marco ancho; los extremos se recortan apenas", () => {
    expect(marcoParaFoto(1.5, "arco")).toEqual({ forma: "apaisada", aspecto: 1.5 });
    expect(marcoParaFoto(3, "circulo")).toEqual({ forma: "apaisada", aspecto: 1.9 });
    expect(marcoParaFoto(0.3, "retrato")).toEqual({ forma: "retrato", aspecto: 0.5 });
  });

  it("sin medidas (o rotas): la proporción de siempre", () => {
    expect(marcoParaFoto(NaN, "arco").aspecto).toBe(0.8);
    expect(marcoParaFoto(0, "retrato").aspecto).toBe(0.8);
  });
});
