// ─── Vista previa de la invitación para WhatsApp (servidor) ───────────────────
//
// WhatsApp muestra arriba del mensaje la imagen og:image del enlace, y tocarla
// abre el enlace: es la tarjeta "clickeable". Como cada enlace de confirmación
// tiene su propia imagen, TODOS los envíos (uno por uno o "enviar a todos")
// llegan con la invitación visible. Formato horizontal 1200×630: es el que
// WhatsApp muestra grande.
//
// Satori (ImageResponse) no mide texto: los tamaños salen de anchos medidos en
// el navegador (Great Vibes y Cinzel a 100 px). Los ornamentos son los mismos
// trazados que dibuja el canvas (lib/ornamentosTarjeta.ts).

import { ImageResponse } from "next/og";
import { DORADO, DORADO_CSS, NEGRO_ORO, type DatosTarjeta } from "@/lib/tarjetaInvitacion";
import { BIRRETE, filigrana, separador } from "@/lib/ornamentosTarjeta";

export const TAM_OG = { width: 1200, height: 630 };

// Ancho de cada título en Great Vibes a 100 px
const ANCHO_SCRIPT: Record<string, number> = {
  "Invitación de Graduación": 789.5,
  "Invitación de Boda": 650.1,
  "Mis XV Años": 557.2,
  "Invitación de Cumpleaños": 811.9,
  "Invitación": 341.4,
};

// Ancho de cada carácter de Cinzel 600 a 100 px
const ANCHO_CINZEL: Record<string, number> = {
  A: 71.5, B: 64.5, C: 77.3, D: 82.1, E: 61.3, F: 57.7, G: 82.3, H: 84.5, I: 37, J: 36.4, K: 72.4, L: 59.8, M: 94.6,
  N: 85.7, O: 86.5, P: 63, Q: 86.7, R: 72.4, S: 54.4, T: 65, U: 80.9, V: 73.2, W: 97.5, X: 70.7, Y: 68.9, Z: 65.8,
  "Á": 71.5, "É": 61.3, "Í": 37, "Ó": 86.5, "Ú": 80.9, "Ü": 80.9, "Ñ": 85.7, " ": 25, ".": 20.8, ",": 21.5, "-": 38,
  "'": 19, "&": 75.3, 0: 63.4, 1: 37.6, 2: 59.5, 3: 54.3, 4: 60.7, 5: 53.6, 6: 60.7, 7: 53, 8: 58.6, 9: 60.7,
};

const anchoCinzel = (texto: string) => [...texto].reduce((s, c) => s + (ANCHO_CINZEL[c] ?? 75), 0);
// Tamaño de letra para que `texto` (medido a 100 px) entre en `max`
const tamano = (ancho100: number, max: number, mayor: number, menor: number) =>
  Math.max(menor, Math.min(mayor, Math.floor((max * 100) / Math.max(ancho100, 1))));

const TEXTO_ORO = { backgroundImage: DORADO_CSS, backgroundClip: "text", color: "transparent" } as const;

// Fuentes de Google en TTF (Satori no lee WOFF2), recortadas a los caracteres usados
const cacheFuentes = new Map<string, ArrayBuffer>();
async function fuenteGoogle(familia: string, texto: string): Promise<ArrayBuffer | null> {
  const clave = `${familia}|${texto}`;
  if (cacheFuentes.has(clave)) return cacheFuentes.get(clave)!;
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${familia}&text=${encodeURIComponent(texto)}`)).text();
    const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!src) return null;
    const res = await fetch(src[1]);
    if (!res.ok) return null;
    const datos = await res.arrayBuffer();
    cacheFuentes.set(clave, datos);
    return datos;
  } catch {
    return null;
  }
}

// Dentro de un <svg> Satori solo entiende elementos SVG, no componentes ni
// fragmentos: los trozos repetidos se arman con funciones comunes
const paradas = () => DORADO.map(([p, c]) => <stop key={p} offset={String(p)} stopColor={c} />);

// Banda de filigrana que cruza la esquina superior derecha
const BANDA_C = 1050;
const BANDA_H = 40;
function banda(id: string) {
  const desde = -BANDA_H - 10;
  const hasta = (1200 - BANDA_C) * Math.SQRT2 + 2 * BANDA_H;
  const fi = filigrana(BANDA_H, desde, hasta);
  const oro = `url(#${id})`;
  return (
    <g transform={`translate(${BANDA_C} 0) rotate(45)`}>
      <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={desde} y1={-BANDA_H} x2={hasta} y2={BANDA_H}>{paradas()}</linearGradient>
      <rect x={desde} y={-BANDA_H} width={hasta - desde} height={2 * BANDA_H} fill={NEGRO_ORO.banda} />
      <path d={fi.bordesGruesos} stroke={oro} strokeWidth="2.4" fill="none" />
      <path d={fi.bordesFinos} stroke={oro} strokeWidth="0.9" fill="none" />
      <path d={fi.ondas} stroke={oro} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={fi.festones} stroke={oro} strokeWidth="1" fill="none" />
      <path d={fi.anillos} stroke={oro} strokeWidth="0.9" fill="none" />
      <path d={fi.rellenos} fill={oro} />
      <path d={fi.huecos} fill={NEGRO_ORO.banda} />
    </g>
  );
}

function Birrete({ ancho }: { ancho: number }) {
  const oro = "url(#oroBirrete)";
  return (
    <svg width={ancho} height={(ancho * 176) / 352} viewBox="-176 -64 352 176">
      <defs>
        <linearGradient id="oroBirrete" gradientUnits="userSpaceOnUse" x1="-176" y1="-64" x2="176" y2="112">{paradas()}</linearGradient>
      </defs>
      <path d={BIRRETE.casquete} stroke={oro} strokeWidth="3.4" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <path d={BIRRETE.bandaCasquete} stroke={oro} strokeWidth="1.6" fill="none" />
      <path d={BIRRETE.tablero} stroke={oro} strokeWidth="3.4" fill={NEGRO_ORO.fondoCentro} strokeLinejoin="round" />
      <path d={BIRRETE.canto} stroke={oro} strokeWidth="2" fill="none" strokeLinejoin="round" />
      <path d={BIRRETE.cordon} stroke={oro} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d={BIRRETE.borla + BIRRETE.boton} fill={oro} />
    </svg>
  );
}

function Separador({ ancho, margen }: { ancho: number; margen: number }) {
  const s = separador(ancho);
  return (
    <svg width={ancho} height="16" viewBox={`${-ancho / 2} -8 ${ancho} 16`} style={{ marginTop: margen }}>
      <defs>
        <linearGradient id="oroSep" gradientUnits="userSpaceOnUse" x1={-ancho / 2} y1="0" x2={ancho / 2} y2="0">{paradas()}</linearGradient>
      </defs>
      <path d={s.lineas} stroke="url(#oroSep)" strokeWidth="1.2" fill="none" />
      <path d={s.rellenos} fill="url(#oroSep)" />
    </svg>
  );
}

export async function renderTarjetaOG(datos: DatosTarjeta) {
  const nombre = datos.protagonista.toLocaleUpperCase("es");
  const lugar = datos.lugar?.toLocaleUpperCase("es") ?? "";
  const honor = datos.honor ? `—  ${datos.honor}  —` : "";
  const para = datos.invitado ? `Para ${datos.invitado}` : "";
  const cta = "TOCÁ PARA CONFIRMAR TU ASISTENCIA";
  const versiculo = datos.versiculo ? `«${datos.versiculo.texto}»` : "";
  const cita = datos.versiculo?.cita.toLocaleUpperCase("es") ?? "";

  const [script, caps6, caps5, sans3, sans4, anio, italica] = await Promise.all([
    fuenteGoogle("Great+Vibes", datos.tituloScript),
    fuenteGoogle("Cinzel:wght@600", nombre),
    fuenteGoogle("Cinzel:wght@500", `${honor}${lugar}${cita}PROMOCIÓN`),
    fuenteGoogle("Jost:wght@300", `${datos.fechaCorta ?? ""}${datos.direccion ?? ""}`),
    fuenteGoogle("Jost:wght@400", `${datos.diaHora ?? ""}${cta}`),
    datos.promocion ? fuenteGoogle("Playfair+Display:wght@500", String(datos.promocion)) : null,
    para || versiculo ? fuenteGoogle("Playfair+Display:ital,wght@1,500", `${para}${versiculo}`) : null,
  ]);
  type Fuente = { name: string; data: ArrayBuffer; weight: 300 | 400 | 500 | 600; style: "normal" | "italic" };
  const fuentes = ([
    script && { name: "Script", data: script, weight: 400, style: "normal" },
    caps6 && { name: "Caps", data: caps6, weight: 600, style: "normal" },
    caps5 && { name: "Caps", data: caps5, weight: 500, style: "normal" },
    sans3 && { name: "Sans", data: sans3, weight: 300, style: "normal" },
    sans4 && { name: "Sans", data: sans4, weight: 400, style: "normal" },
    anio && { name: "Serif", data: anio, weight: 500, style: "normal" },
    italica && { name: "Serif", data: italica, weight: 500, style: "italic" },
  ] as (Fuente | null)[]).filter((x): x is Fuente => !!x);

  const pxScript = tamano(ANCHO_SCRIPT[datos.tituloScript] ?? 800, 500, 68, 44);
  const pxNombre = tamano(anchoCinzel(nombre), 470, 50, 26);
  const pxLugar = tamano(anchoCinzel(lugar), 440, 28, 18);

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", position: "relative",
        backgroundColor: NEGRO_ORO.fondo,
        backgroundImage: `radial-gradient(circle at 50% 46%, ${NEGRO_ORO.fondoCentro} 0%, ${NEGRO_ORO.fondo} 70%)`,
      }}>
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>
            <linearGradient id="oroMarco" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1200" y2="630">{paradas()}</linearGradient>
            <linearGradient id="regla" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#D4B068" stopOpacity="0" />
              <stop offset="0.5" stopColor="#D4B068" stopOpacity="0.85" />
              <stop offset="1" stopColor="#D4B068" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x="26" y="26" width="1148" height="578" fill="none" stroke="url(#oroMarco)" strokeWidth="3" />
          <rect x="36" y="36" width="1128" height="558" fill="none" stroke="url(#oroMarco)" strokeWidth="1" />
          {banda("oroBanda1")}
          <g transform="rotate(180 600 315)">{banda("oroBanda2")}</g>
          <rect x="639" y="140" width="1.2" height="350" fill="url(#regla)" />
        </svg>

        {/* Izquierda: birrete, título en caligrafía, a quién se honra y la promoción */}
        <div style={{
          position: "absolute", left: 64, top: 40, width: 560, height: 550,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center",
        }}>
          {datos.esGraduacion ? <Birrete ancho={190} /> : <Separador ancho={200} margen={0} />}
          <div style={{ display: "flex", fontFamily: "Script", fontSize: pxScript, lineHeight: 1.35, padding: "0 12px", marginTop: 4, ...TEXTO_ORO }}>{datos.tituloScript}</div>
          {honor && <div style={{ display: "flex", fontFamily: "Caps", fontWeight: 500, fontSize: 15, letterSpacing: 4, color: NEGRO_ORO.oroPlano }}>{honor}</div>}
          <div style={{ display: "flex", fontFamily: "Caps", fontWeight: 600, fontSize: pxNombre, letterSpacing: 1, lineHeight: 1.2, marginTop: 8, ...TEXTO_ORO }}>{nombre}</div>
          <Separador ancho={180} margen={16} />
          {datos.promocion && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 18 }}>
              <div style={{ display: "flex", fontFamily: "Caps", fontWeight: 500, fontSize: 14, letterSpacing: 7, color: NEGRO_ORO.oroPlano }}>PROMOCIÓN</div>
              <div style={{ display: "flex", fontFamily: "Serif", fontWeight: 500, fontSize: 76, lineHeight: 1.1, ...TEXTO_ORO }}>{String(datos.promocion)}</div>
            </div>
          )}
        </div>

        {/* Derecha: cuándo, dónde y para quién */}
        <div style={{
          position: "absolute", left: 660, top: 40, width: 476, height: 550,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center",
        }}>
          {datos.fechaCorta && (
            <div style={{ display: "flex", paddingBottom: 10, borderBottom: "1.5px solid #C9A55A" }}>
              <div style={{ display: "flex", fontFamily: "Sans", fontWeight: 300, fontSize: 46, letterSpacing: 3, lineHeight: 1.15, padding: "0 14px", ...TEXTO_ORO }}>{datos.fechaCorta}</div>
            </div>
          )}
          {datos.diaHora && <div style={{ display: "flex", fontFamily: "Sans", fontWeight: 400, fontSize: 19, letterSpacing: 4, color: NEGRO_ORO.textoSuave, marginTop: 14 }}>{datos.diaHora}</div>}
          {lugar && <div style={{ display: "flex", justifyContent: "center", fontFamily: "Caps", fontWeight: 500, fontSize: pxLugar, letterSpacing: 1, lineHeight: 1.25, maxWidth: 460, marginTop: 30, ...TEXTO_ORO }}>{lugar}</div>}
          {datos.direccion && <div style={{ display: "flex", justifyContent: "center", fontFamily: "Sans", fontWeight: 300, fontSize: 18, lineHeight: 1.35, color: NEGRO_ORO.textoSuave, maxWidth: 430, marginTop: 6 }}>{datos.direccion}</div>}
          <Separador ancho={160} margen={24} />
          {versiculo && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 14, maxWidth: 430 }}>
              <div style={{ display: "flex", justifyContent: "center", fontFamily: "Serif", fontStyle: "italic", fontWeight: 500, fontSize: versiculo.length > 110 ? 15 : 17, lineHeight: 1.35, color: "#EFE2C2" }}>{versiculo}</div>
              <div style={{ display: "flex", fontFamily: "Caps", fontWeight: 500, fontSize: 12, letterSpacing: 3, color: NEGRO_ORO.oroPlano, marginTop: 5 }}>{cita}</div>
            </div>
          )}
          {para && <div style={{ display: "flex", fontFamily: "Serif", fontStyle: "italic", fontWeight: 500, fontSize: 26, color: "#F1E3BF", marginTop: 18 }}>{para}</div>}
          <div style={{ display: "flex", fontFamily: "Sans", fontWeight: 400, fontSize: 13, letterSpacing: 3, color: NEGRO_ORO.oroPlano, marginTop: 8 }}>{cta}</div>
        </div>
      </div>
    ),
    { ...TAM_OG, fonts: fuentes.length ? fuentes : undefined },
  );
}
