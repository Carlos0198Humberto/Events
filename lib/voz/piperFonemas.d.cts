// Tipos de lib/voz/piperFonemas.cjs (módulo Emscripten)
export type ModuloFonemas = { callMain(args: string[]): number };
export type OpcionesFonemas = {
  print?: (linea: string) => void;
  printErr?: (linea: string) => void;
  wasmBinary?: ArrayBuffer | Uint8Array;
  getPreloadedPackage?: (nombre: string, tamano: number) => ArrayBuffer;
  locateFile?: (url: string) => string;
};
export declare function createPiperPhonemize(opciones?: OpcionesFonemas): Promise<ModuloFonemas>;
