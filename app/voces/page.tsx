"use client";
// ─── Probador de voces ────────────────────────────────────────────────────────
//
// Para elegir la voz que va a leer las invitaciones. Son voces abiertas que
// corren en el navegador: el texto no sale del teléfono ni de la compu.
//
// - Piper (rhasspy/piper, licencia MIT): voces de México y de España, ~63 MB
//   cada una, con ONNX Runtime en WASM y el eSpeak compilado a WASM que
//   publica piper-tts-web (su paquete entero no sirve desde un CDN: esm.sh lo
//   arma para Node y el eSpeak intenta leer el disco).
// - Kokoro 82M (hexgrad, Apache 2.0) con sus voces en español, Dora y Alex.
//   El modelo pesa ~92 MB y sirve para las dos. kokoro-js solo pasa a fonemas
//   el inglés: el español se pasa con el eSpeak que trae Piper ("es-419", con
//   seseo, como se habla acá) y esos fonemas van directo al modelo.
// - Las voces del teléfono, las que se usan ahora: no descargan nada.
//
// La primera vez, cada voz se descarga y queda guardada en el navegador. Las
// librerías se cargan desde el CDN recién al tocar «Escuchar»: esta página no
// agrega peso al resto de la app.

import { useEffect, useRef, useState } from "react";
import { VOZ } from "@/lib/vozGrabada";

/* eslint-disable @typescript-eslint/no-explicit-any */
// import() en tiempo de ejecución, sin que el bundler lo toque
const importar = new Function("u", "return import(u)") as (u: string) => Promise<any>;

const URL_ORT = "https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.18.0/ort.wasm.min.js";
const BASE_ORT = "https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.18.0/";
const HF_PIPER = "https://huggingface.co/diffusionstudio/piper-voices/resolve/main";
const URL_FONEMAS = "https://cdn.jsdelivr.net/npm/@mintplex-labs/piper-tts-web@1.0.5/dist/piper-o91UDS6e.js";
const URL_WASM_FONEMAS = "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize";
const URL_KOKORO = "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js";
const MODELO_KOKORO = "onnx-community/Kokoro-82M-v1.0-ONNX";

type Motor = "piper" | "kokoro";
// `modelo`: la ruta en piper-voices (Piper) o la voz (Kokoro); `hablante`: en
// los modelos de Piper con varias personas (Sharvard: 0 = hombre, 1 = mujer)
type Voz = { id: string; motor: Motor; modelo: string; hablante?: number; nombre: string; detalle: string; peso: string };

const VOCES: Voz[] = [
  { id: "claude", motor: "piper", modelo: "es/es_MX/claude/high/es_MX-claude-high.onnx", nombre: "Claude", detalle: "Piper · México · calidad alta", peso: "63 MB" },
  { id: "ald", motor: "piper", modelo: "es/es_MX/ald/medium/es_MX-ald-medium.onnx", nombre: "Ald", detalle: "Piper · México", peso: "63 MB" },
  { id: "davefx", motor: "piper", modelo: "es/es_ES/davefx/medium/es_ES-davefx-medium.onnx", nombre: "Davefx", detalle: "Piper · España", peso: "63 MB" },
  { id: "sharvard-f", motor: "piper", modelo: "es/es_ES/sharvard/medium/es_ES-sharvard-medium.onnx", hablante: 1, nombre: "Sharvard (mujer)", detalle: "Piper · España", peso: "77 MB (una vez, para las dos de Sharvard)" },
  { id: "sharvard-m", motor: "piper", modelo: "es/es_ES/sharvard/medium/es_ES-sharvard-medium.onnx", hablante: 0, nombre: "Sharvard (hombre)", detalle: "Piper · España", peso: "77 MB (una vez, para las dos de Sharvard)" },
  { id: "dora", motor: "kokoro", modelo: "ef_dora", nombre: "Dora", detalle: "Kokoro · voz de mujer · tarda más en preparar", peso: "92 MB (una vez, para Dora y Alex)" },
  { id: "alex", motor: "kokoro", modelo: "em_alex", nombre: "Alex", detalle: "Kokoro · voz de hombre · tarda más en preparar", peso: "92 MB (una vez, para Dora y Alex)" },
];

const EJEMPLOS = {
  xv: "¡Hola, Rosa! Bienvenida a tu invitación virtual. Genaro y Soila se complacen en invitarte a celebrar este mágico e inolvidable momento: los XV años de Ashley. La recepción será el sábado 21 de noviembre, a las seis de la tarde, en el Salón Los Almendros. ¡Te esperamos!",
  graduacion: "¡Hola, Rosa! Bienvenida a tu invitación virtual. Carlos Humberto se gradúa de Ingeniería en Sistemas Informáticos en la Universidad de El Salvador. La cita es el sábado 21 de noviembre, a las seis de la tarde. Confirmá tu asistencia con el botón de abajo.",
};

// ── Audio ─────────────────────────────────────────────────────────────────────
function aWav(muestras: Float32Array, frecuencia: number): Blob {
  const datos = new DataView(new ArrayBuffer(44 + muestras.length * 2));
  const texto = (o: number, t: string) => { for (let i = 0; i < t.length; i++) datos.setUint8(o + i, t.charCodeAt(i)); };
  texto(0, "RIFF"); datos.setUint32(4, 36 + muestras.length * 2, true); texto(8, "WAVE");
  texto(12, "fmt "); datos.setUint32(16, 16, true); datos.setUint16(20, 1, true); datos.setUint16(22, 1, true);
  datos.setUint32(24, frecuencia, true); datos.setUint32(28, frecuencia * 2, true); datos.setUint16(32, 2, true); datos.setUint16(34, 16, true);
  texto(36, "data"); datos.setUint32(40, muestras.length * 2, true);
  for (let i = 0; i < muestras.length; i++) {
    const v = Math.max(-1, Math.min(1, muestras[i]));
    datos.setInt16(44 + i * 2, v < 0 ? v * 0x8000 : v * 0x7fff, true);
  }
  return new Blob([datos], { type: "audio/wav" });
}

// Oraciones cortas: Kokoro lee hasta ~500 fonemas por vez
function oraciones(texto: string): string[] {
  return (texto.match(/[^.!?…]+[.!?…]*["»”]?/g) ?? [texto]).map((o) => o.trim()).filter(Boolean);
}

type Progreso = (fraccion: number | null, etapa: string) => void;

// ── Descargas: con progreso y guardadas en el navegador (Cache API) ──────────
async function bajar(url: string, progreso?: (fraccion: number) => void): Promise<ArrayBuffer> {
  let cache: Cache | null = null;
  try {
    cache = await caches.open("evorix-voces");
    const guardada = await cache.match(url);
    if (guardada) return guardada.arrayBuffer();
  } catch { /* sin Cache API (ventana privada): se baja igual */ }
  const r = await fetch(url);
  if (!r.ok || !r.body) throw new Error(`No se pudo bajar ${url} (${r.status})`);
  const total = Number(r.headers.get("content-length")) || 0;
  const lector = r.body.getReader();
  const trozos: Uint8Array[] = [];
  let leidos = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    trozos.push(value);
    leidos += value.length;
    if (total && progreso) progreso(Math.min(1, leidos / total));
  }
  const todo = new Uint8Array(leidos);
  let o = 0;
  for (const t of trozos) { todo.set(t, o); o += t.length; }
  try { await cache?.put(url, new Response(todo, { headers: { "content-type": "application/octet-stream" } })); } catch { /* sin lugar: la próxima se vuelve a bajar */ }
  return todo.buffer;
}

// ── eSpeak (de Piper): texto → fonemas ────────────────────────────────────────
let modFonemas: Promise<any> | null = null;

async function fonemizar(texto: string, idioma: string): Promise<{ phonemes: unknown; phoneme_ids: number[] }> {
  modFonemas ??= importar(URL_FONEMAS).catch((e) => { modFonemas = null; throw e; });
  const { createPiperPhonemize } = await modFonemas;
  let salida = "";
  const modulo = await createPiperPhonemize({
    print: (linea: string) => { salida += linea; },
    printErr: (m: string) => console.warn("[eSpeak]", m),
    locateFile: (url: string) =>
      url.endsWith(".wasm") ? `${URL_WASM_FONEMAS}.wasm` : url.endsWith(".data") ? `${URL_WASM_FONEMAS}.data` : url,
  });
  modulo.callMain(["-l", idioma, "--input", JSON.stringify([{ text: texto }]), "--espeak_data", "/espeak-ng-data"]);
  return JSON.parse(salida);
}

// Los fonemas como texto IPA, para Kokoro
async function fonemasEspanol(texto: string): Promise<string> {
  const fon = (await fonemizar(texto, "es-419")).phonemes ?? [];
  return (Array.isArray(fon) ? (fon as unknown[]).flat(3) : [String(fon)]).join("");
}

function juntar(partes: Float32Array[]): Float32Array {
  const junto = new Float32Array(partes.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of partes) { junto.set(p, o); o += p.length; }
  return junto;
}

// ── Piper ─────────────────────────────────────────────────────────────────────
let ortPromesa: Promise<any> | null = null;
function cargarOrt(): Promise<any> {
  ortPromesa ??= new Promise((ok, mal) => {
    const listo = () => {
      const ort = (window as any).ort;
      ort.env.wasm.wasmPaths = BASE_ORT;
      ort.env.wasm.numThreads = 1; // sin aislamiento entre orígenes no hay hilos
      ok(ort);
    };
    if ((window as any).ort) { listo(); return; }
    const s = document.createElement("script");
    s.src = URL_ORT;
    s.async = true;
    s.onload = listo;
    s.onerror = () => { ortPromesa = null; mal(new Error("No se pudo cargar ONNX Runtime")); };
    document.head.appendChild(s);
  });
  return ortPromesa;
}

// Un modelo a la vez en memoria: en el teléfono dos de 63 MB ya pesan
let piperActual: { modelo: string; sesion: any; config: any } | null = null;

async function hablarPiper(voz: Voz, texto: string, progreso: Progreso): Promise<Blob> {
  progreso(null, "Cargando el motor de voz…");
  const ort = await cargarOrt();
  if (piperActual?.modelo !== voz.modelo) {
    const config = JSON.parse(new TextDecoder().decode(await bajar(`${HF_PIPER}/${voz.modelo}.json`)));
    progreso(0, "Descargando la voz…");
    const bytes = await bajar(`${HF_PIPER}/${voz.modelo}`, (f) => progreso(f, "Descargando la voz…"));
    progreso(null, "Preparando la voz…");
    const sesion = await ort.InferenceSession.create(bytes, { executionProviders: ["wasm"] });
    try { await piperActual?.sesion.release(); } catch { /* ya liberada */ }
    piperActual = { modelo: voz.modelo, sesion, config };
  }
  const { sesion, config } = piperActual!;
  const frecuencia: number = config.audio?.sample_rate ?? 22050;
  const varios = Object.keys(config.speaker_id_map ?? {}).length > 0;
  const partes: Float32Array[] = [];
  const lista = oraciones(texto);
  for (let i = 0; i < lista.length; i++) {
    progreso((i + 0.5) / lista.length, "Preparando el audio…");
    const { phoneme_ids: ids } = await fonemizar(lista[i], config.espeak?.voice ?? "es");
    const feeds: Record<string, unknown> = {
      input: new ort.Tensor("int64", BigInt64Array.from(ids.map((n) => BigInt(n))), [1, ids.length]),
      input_lengths: new ort.Tensor("int64", BigInt64Array.from([BigInt(ids.length)]), [1]),
      scales: new ort.Tensor("float32", Float32Array.from([config.inference.noise_scale, config.inference.length_scale, config.inference.noise_w]), [3]),
    };
    if (varios) feeds.sid = new ort.Tensor("int64", BigInt64Array.from([BigInt(voz.hablante ?? 0)]), [1]);
    const { output } = await sesion.run(feeds);
    partes.push(output.data as Float32Array, new Float32Array(Math.round(frecuencia * 0.18)));
  }
  return aWav(juntar(partes), frecuencia);
}

// ── Kokoro (con los fonemas en español de eSpeak) ─────────────────────────────
let modeloKokoro: Promise<any> | null = null;
let alProgresoKokoro: Progreso = () => {};

async function hablarKokoro(voz: Voz, texto: string, progreso: Progreso): Promise<Blob> {
  alProgresoKokoro = progreso;
  progreso(null, "Cargando el motor de voz…");
  modeloKokoro ??= importar(URL_KOKORO).then(({ KokoroTTS }) =>
    KokoroTTS.from_pretrained(MODELO_KOKORO, {
      dtype: "q8",
      device: "wasm",
      progress_callback: (p: any) => {
        if (p?.status === "progress" && /\.onnx$/.test(p.file ?? "")) alProgresoKokoro((p.progress ?? 0) / 100, "Descargando la voz…");
      },
    }),
  ).catch((e: unknown) => { modeloKokoro = null; throw e; });
  const tts = await modeloKokoro;
  const partes: Float32Array[] = [];
  let frecuencia = 24000;
  const lista = oraciones(texto);
  for (let i = 0; i < lista.length; i++) {
    progreso((i + 0.5) / lista.length, "Preparando el audio…");
    const fon = await fonemasEspanol(lista[i]);
    if (!fon.trim()) continue;
    const { input_ids } = tts.tokenizer(fon, { truncation: true });
    const audio = await tts.generate_from_ids(input_ids, { voice: voz.modelo, speed: 1 });
    partes.push(audio.audio as Float32Array);
    frecuencia = audio.sampling_rate ?? frecuencia;
    partes.push(new Float32Array(Math.round(frecuencia * 0.18))); // pausa entre oraciones
  }
  return aWav(juntar(partes), frecuencia);
}

// ── Página ────────────────────────────────────────────────────────────────────
type Estado = { etapa: string; fraccion: number | null; error?: string; segundos?: number };

export default function ProbadorDeVoces() {
  const [texto, setTexto] = useState(EJEMPLOS.xv);
  const [estados, setEstados] = useState<Record<string, Estado>>({});
  const [sonando, setSonando] = useState<string | null>(null);
  const [vocesTelefono, setVocesTelefono] = useState<SpeechSynthesisVoice[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cache = useRef(new Map<string, string>()); // voz + texto → URL del audio
  const ocupado = useRef(false);

  useEffect(() => {
    document.title = "Probador de voces · Evorix";
    if (typeof speechSynthesis === "undefined") return;
    const cargar = () => setVocesTelefono(speechSynthesis.getVoices().filter((v) => /^es\b|^es[-_]/i.test(v.lang)).slice(0, 8));
    cargar();
    speechSynthesis.addEventListener("voiceschanged", cargar);
    return () => speechSynthesis.removeEventListener("voiceschanged", cargar);
  }, []);

  function detener() {
    audioRef.current?.pause();
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    setSonando(null);
  }

  function reproducir(id: string, url: string) {
    detener();
    const a = audioRef.current ?? new Audio();
    audioRef.current = a;
    a.src = url;
    a.onended = () => setSonando(null);
    a.play().then(() => setSonando(id)).catch(() => setSonando(null));
  }

  async function escuchar(voz: Voz) {
    const clave = `${voz.id}|${texto}`;
    const guardado = cache.current.get(clave);
    if (guardado) { reproducir(voz.id, guardado); return; }
    if (ocupado.current) return; // de a una: dos modelos a la vez traban el teléfono
    ocupado.current = true;
    detener();
    const poner = (e: Estado) => setEstados((prev) => ({ ...prev, [voz.id]: e }));
    const progreso: Progreso = (fraccion, etapa) => poner({ etapa, fraccion });
    const inicio = performance.now();
    try {
      const blob = voz.motor === "piper" ? await hablarPiper(voz, texto, progreso) : await hablarKokoro(voz, texto, progreso);
      const url = URL.createObjectURL(blob);
      cache.current.set(clave, url);
      poner({ etapa: "Listo", fraccion: null, segundos: (performance.now() - inicio) / 1000 });
      reproducir(voz.id, url);
    } catch (e) {
      console.error(e);
      poner({ etapa: "", fraccion: null, error: "No se pudo cargar esta voz. Probá de nuevo con buena conexión." });
    } finally {
      ocupado.current = false;
    }
  }

  function escucharTelefono(v: SpeechSynthesisVoice) {
    detener();
    const partes = oraciones(texto);
    let i = 0;
    const siguiente = () => {
      if (i >= partes.length) { setSonando(null); return; }
      const u = new SpeechSynthesisUtterance(partes[i++]);
      u.voice = v;
      u.lang = v.lang;
      u.rate = 0.95;
      u.pitch = 0.96;
      u.onend = () => setTimeout(siguiente, 180);
      u.onerror = () => setSonando(null);
      speechSynthesis.speak(u);
    };
    setSonando(`tel-${v.voiceURI}`);
    siguiente();
  }

  return (
    <main className="pv">
      <style>{`
        :root{--pv-fondo:#F7F5FB;--pv-carta:#FFFFFF;--pv-tinta:#1E1B2E;--pv-suave:#5B5670;--pv-borde:rgba(79,70,229,0.16);--pv-acento:#4F46E5;--pv-acento2:#3730A3;--pv-ok:#0F7A55}
        @media (prefers-color-scheme: dark){:root{--pv-fondo:#12111A;--pv-carta:#1C1A28;--pv-tinta:#F1EFFA;--pv-suave:#B3AECB;--pv-borde:rgba(165,160,255,0.18);--pv-acento:#8B85FF;--pv-acento2:#C7C3FF;--pv-ok:#4ADE9B}}
        body{background:var(--pv-fondo)}
        .pv{max-width:640px;margin:0 auto;padding:24px 16px 48px;color:var(--pv-tinta);font-family:'DM Sans',system-ui,-apple-system,'Segoe UI',sans-serif}
        .pv h1{font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;font-weight:600;line-height:1.1;margin:0 0 6px}
        .pv-sub{font-size:14px;line-height:1.55;color:var(--pv-suave);margin:0 0 18px}
        .pv-texto{width:100%;box-sizing:border-box;min-height:120px;resize:vertical;border:1.5px solid var(--pv-borde);border-radius:14px;padding:12px 14px;font:inherit;font-size:15px;line-height:1.5;background:var(--pv-carta);color:var(--pv-tinta)}
        .pv-ejemplos{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 22px}
        .pv-chip{border:1.5px solid var(--pv-borde);background:var(--pv-carta);color:var(--pv-acento2);border-radius:999px;padding:7px 12px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer}
        .pv-grupo{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--pv-suave);margin:22px 0 10px}
        .pv-voz{display:flex;align-items:center;gap:12px;padding:14px;margin-bottom:10px;border-radius:16px;background:var(--pv-carta);border:1.5px solid var(--pv-borde)}
        .pv-voz.sonando{border-color:var(--pv-acento);box-shadow:0 0 0 3px rgba(79,70,229,0.15)}
        .pv-info{flex:1;min-width:0}
        .pv-nombre{font-size:16px;font-weight:800}
        .pv-detalle{font-size:12.5px;color:var(--pv-suave);margin-top:2px}
        .pv-estado{font-size:12px;color:var(--pv-suave);margin-top:6px}
        .pv-estado.ok{color:var(--pv-ok);font-weight:700}
        .pv-elegida{display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;background:var(--pv-acento);color:#fff;font-size:10.5px;font-weight:800;letter-spacing:.02em;vertical-align:2px}
        .pv-estado.error{color:#DC2626;font-weight:700}
        .pv-barra{height:5px;border-radius:99px;background:var(--pv-borde);overflow:hidden;margin-top:6px}
        .pv-barra span{display:block;height:100%;background:var(--pv-acento);transition:width .2s}
        .pv-boton{flex-shrink:0;min-width:96px;min-height:42px;border:none;border-radius:12px;background:var(--pv-acento);color:#fff;font:inherit;font-size:13.5px;font-weight:800;cursor:pointer}
        .pv-boton.parar{background:var(--pv-tinta);color:var(--pv-carta)}
        .pv-boton:disabled{opacity:.5;cursor:wait}
        .pv-nota{font-size:12.5px;line-height:1.55;color:var(--pv-suave);margin-top:24px;padding:12px 14px;border-radius:14px;border:1.5px dashed var(--pv-borde)}
      `}</style>

      <h1>Elegí la voz de tus invitaciones</h1>
      <p className="pv-sub">
        Tocá <strong>Escuchar</strong> en cada voz. La primera vez, cada una se descarga a este aparato (de 63 a 92 MB, mejor con wifi) y queda guardada.
        Todo pasa en tu navegador: el texto no se manda a ningún lado. Mientras arma el audio la página puede quedarse quieta unos
        segundos (Kokoro, hasta un par de minutos la primera vez): es normal.
      </p>

      <textarea className="pv-texto" aria-label="Texto que van a leer las voces" value={texto} onChange={(e) => setTexto(e.target.value)} />
      <div className="pv-ejemplos">
        <button type="button" className="pv-chip" onClick={() => setTexto(EJEMPLOS.xv)}>Ejemplo de XV años</button>
        <button type="button" className="pv-chip" onClick={() => setTexto(EJEMPLOS.graduacion)}>Ejemplo de graduación</button>
      </div>

      {(["piper", "kokoro"] as Motor[]).map((motor) => (
        <section key={motor}>
          <div className="pv-grupo">{motor === "piper" ? "Piper · voces abiertas (MIT)" : "Kokoro · voces abiertas (Apache 2.0)"}</div>
          {VOCES.filter((v) => v.motor === motor).map((v) => {
            const e = estados[v.id];
            const enCurso = !!e && !e.error && e.etapa !== "Listo" && !!e.etapa;
            return (
              <div key={v.id} className={`pv-voz${sonando === v.id ? " sonando" : ""}`}>
                <div className="pv-info">
                  <div className="pv-nombre">
                    {v.nombre}
                    {v.modelo === VOZ.modelo && v.hablante === VOZ.hablante && <span className="pv-elegida">La de tus invitaciones</span>}
                  </div>
                  <div className="pv-detalle">{v.detalle} · {v.peso}</div>
                  {e?.error && <div className="pv-estado error">{e.error}</div>}
                  {enCurso && (
                    <>
                      <div className="pv-estado">{e.etapa}{e.fraccion !== null ? ` ${Math.round(e.fraccion * 100)}%` : ""}</div>
                      <div className="pv-barra"><span style={{ width: `${Math.round((e.fraccion ?? 0.08) * 100)}%` }} /></div>
                    </>
                  )}
                  {e?.etapa === "Listo" && <div className="pv-estado ok">Lista · tardó {e.segundos?.toFixed(1)} s en preparar el audio</div>}
                </div>
                {sonando === v.id
                  ? <button type="button" className="pv-boton parar" onClick={detener}>Detener</button>
                  : <button type="button" className="pv-boton" onClick={() => escuchar(v)} disabled={enCurso}>{enCurso ? "…" : "Escuchar"}</button>}
              </div>
            );
          })}
        </section>
      ))}

      <section>
        <div className="pv-grupo">Voces de este teléfono o compu (las de ahora)</div>
        {vocesTelefono.length === 0 && <div className="pv-detalle">Este navegador no tiene voces en español instaladas.</div>}
        {vocesTelefono.map((v) => (
          <div key={v.voiceURI} className={`pv-voz${sonando === `tel-${v.voiceURI}` ? " sonando" : ""}`}>
            <div className="pv-info">
              <div className="pv-nombre">{v.name}</div>
              <div className="pv-detalle">{v.lang}{v.localService ? " · sin internet" : " · necesita internet"} · no descarga nada</div>
            </div>
            {sonando === `tel-${v.voiceURI}`
              ? <button type="button" className="pv-boton parar" onClick={detener}>Detener</button>
              : <button type="button" className="pv-boton" onClick={() => escucharTelefono(v)}>Escuchar</button>}
          </div>
        ))}
      </section>

      <p className="pv-nota">
        Las voces del teléfono cambian de un aparato a otro: en cada celular suenan distinto. Las de Piper y Kokoro suenan igual en todos,
        porque el audio se puede preparar una vez y guardarse con la invitación.
      </p>
    </main>
  );
}
