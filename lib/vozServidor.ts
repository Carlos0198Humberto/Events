// ─── La voz, del lado del servidor ────────────────────────────────────────────
//
// Piper en Node: eSpeak (WebAssembly) pasa el texto a fonemas y ONNX Runtime
// (la versión WebAssembly, sin binarios nativos) corre el modelo de la voz.
// Todo se baja la primera vez que la función arranca y queda en memoria para
// las frases siguientes: el modelo (~77 MB) desde piper-voices y el eSpeak
// (~18 MB) desde jsDelivr.

import { VOZ, textoParaVoz } from "@/lib/vozGrabada";

const BASE_MODELOS = "https://huggingface.co/rhasspy/piper-voices/resolve/main";
const BASE_ESPEAK = "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize";

type ConfigPiper = {
  audio: { sample_rate: number };
  inference: { noise_scale: number; length_scale: number; noise_w: number };
  speaker_id_map?: Record<string, number>;
};

type Motor = {
  ort: typeof import("onnxruntime-web");
  sesion: import("onnxruntime-web").InferenceSession;
  config: ConfigPiper;
  espeakWasm: Uint8Array;
  espeakDatos: ArrayBuffer;
  crearFonemas: typeof import("./voz/piperFonemas.cjs").createPiperPhonemize;
};

async function bajar(url: string): Promise<ArrayBuffer> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`No se pudo bajar ${url}: ${r.status}`);
  return r.arrayBuffer();
}

let motor: Promise<Motor> | null = null;

/** Deja el motor listo (para que la primera frase de un invitado no espere el arranque). */
export async function prepararVoz(): Promise<void> {
  await cargarMotor();
}

function cargarMotor(): Promise<Motor> {
  motor ??= (async () => {
    const [ort, { createPiperPhonemize }, modelo, config, espeakWasm, espeakDatos] = await Promise.all([
      import("onnxruntime-web"),
      import("./voz/piperFonemas.cjs"),
      bajar(`${BASE_MODELOS}/${VOZ.modelo}`),
      bajar(`${BASE_MODELOS}/${VOZ.modelo}.json`),
      bajar(`${BASE_ESPEAK}.wasm`),
      bajar(`${BASE_ESPEAK}.data`),
    ]);
    ort.env.wasm.numThreads = 1;
    const sesion = await ort.InferenceSession.create(new Uint8Array(modelo), { executionProviders: ["wasm"] });
    return {
      ort,
      sesion,
      config: JSON.parse(new TextDecoder().decode(config)) as ConfigPiper,
      espeakWasm: new Uint8Array(espeakWasm),
      espeakDatos,
      crearFonemas: createPiperPhonemize,
    };
  })().catch((e) => { motor = null; throw e; });
  return motor;
}

async function idsDeFonemas(m: Motor, texto: string): Promise<number[]> {
  let salida = "";
  const modulo = await m.crearFonemas({
    print: (linea) => { salida += linea; },
    printErr: () => { /* avisos de eSpeak: no importan */ },
    wasmBinary: m.espeakWasm,
    // eSpeak busca sus datos como un archivo: se le dan ya bajados
    getPreloadedPackage: () => m.espeakDatos.slice(0),
    locateFile: (url) => url,
  });
  modulo.callMain(["-l", VOZ.idioma, "--input", JSON.stringify([{ text: texto }]), "--espeak_data", "/espeak-ng-data"]);
  const ids = (JSON.parse(salida) as { phoneme_ids?: number[] }).phoneme_ids;
  if (!ids?.length) throw new Error("Sin fonemas");
  return ids;
}

function aWav(muestras: Float32Array, frecuencia: number): Uint8Array {
  const b = new DataView(new ArrayBuffer(44 + muestras.length * 2));
  const texto = (o: number, t: string) => { for (let i = 0; i < t.length; i++) b.setUint8(o + i, t.charCodeAt(i)); };
  texto(0, "RIFF"); b.setUint32(4, 36 + muestras.length * 2, true); texto(8, "WAVE");
  texto(12, "fmt "); b.setUint32(16, 16, true); b.setUint16(20, 1, true); b.setUint16(22, 1, true);
  b.setUint32(24, frecuencia, true); b.setUint32(28, frecuencia * 2, true); b.setUint16(32, 2, true); b.setUint16(34, 16, true);
  texto(36, "data"); b.setUint32(40, muestras.length * 2, true);
  for (let i = 0; i < muestras.length; i++) {
    const v = Math.max(-1, Math.min(1, muestras[i]));
    b.setInt16(44 + i * 2, v < 0 ? v * 0x8000 : v * 0x7fff, true);
  }
  return new Uint8Array(b.buffer);
}

// Volumen parejo y fuerte: Piper entrega la voz a unos −21 dBFS (pico ~0,4) y
// la música le ganaba. Se lleva a ~−14 dBFS y los picos se redondean con una
// curva suave (sin recortes que suenen a distorsión).
function nivelar(m: Float32Array): Float32Array {
  let suma = 0;
  for (let i = 0; i < m.length; i++) suma += m[i] * m[i];
  const rms = Math.sqrt(suma / Math.max(1, m.length));
  if (!rms) return m;
  const ganancia = Math.min(4, 0.2 / rms);
  const salida = new Float32Array(m.length);
  for (let i = 0; i < m.length; i++) {
    const x = m[i] * ganancia;
    const a = Math.abs(x);
    salida[i] = a <= 0.85 ? x : Math.sign(x) * (0.85 + 0.15 * Math.tanh((a - 0.85) / 0.15));
  }
  return salida;
}

/** La frase dicha con la voz de las invitaciones, como WAV. */
export async function sintetizar(textoOriginal: string): Promise<Uint8Array> {
  const texto = textoParaVoz(textoOriginal);
  const m = await cargarMotor();
  const ids = await idsDeFonemas(m, texto);
  const { ort, sesion, config } = m;
  const feeds: Record<string, import("onnxruntime-web").Tensor> = {
    input: new ort.Tensor("int64", BigInt64Array.from(ids.map((n) => BigInt(n))), [1, ids.length]),
    input_lengths: new ort.Tensor("int64", BigInt64Array.from([BigInt(ids.length)]), [1]),
    scales: new ort.Tensor("float32", Float32Array.from([config.inference.noise_scale, config.inference.length_scale, config.inference.noise_w]), [3]),
  };
  if (Object.keys(config.speaker_id_map ?? {}).length) {
    feeds.sid = new ort.Tensor("int64", BigInt64Array.from([BigInt(VOZ.hablante)]), [1]);
  }
  const salida = await sesion.run(feeds);
  return aWav(nivelar(salida.output.data as Float32Array), config.audio.sample_rate);
}
