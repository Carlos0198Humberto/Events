import { defineConfig } from "vitest/config";
import path from "node:path";

// Pruebas de las funciones puras (textos del mensaje, datos de la tarjeta).
// El alias "@/" es el mismo de tsconfig.json.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: { include: ["lib/**/*.test.ts"], environment: "node" },
});
