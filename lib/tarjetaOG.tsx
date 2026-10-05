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
import { doradoCss, tintasPlanas, type DatosTarjeta, type FormaFoto, type PaletaTarjeta } from "@/lib/tarjetaInvitacion";
import { BIRRETE, filigrana, separador } from "@/lib/ornamentosTarjeta";

export const TAM_OG = { width: 1200, height: 630 };

// Ancho de cada título en Great Vibes a 100 px
const ANCHO_SCRIPT: Record<string, number> = {
  "Invitación de Graduación": 789.5,
  "Invitación de Boda": 650.1,
  "Mis XV Años": 557.2,
  "Invitación de Cumpleaños": 811.9,
  "Invitación": 341.4,
  "Con gratitud": 425, // estimado (invitación especial a distancia)
};

// Ancho de cada carácter de Cinzel 600 a 100 px (Cinzel 500 es apenas más angosta)
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

// Los colores llegan por parámetro (P = la paleta del evento): el servidor
// arma varias vistas previas a la vez y Satori llama a los componentes tarde.
const textoOro = (P: PaletaTarjeta) => ({ backgroundImage: doradoCss(P), backgroundClip: "text", color: "transparent" } as const);

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
const paradas = (P: PaletaTarjeta) => P.dorado.map(([p, c]) => <stop key={p} offset={String(p)} stopColor={c} />);

// Banda de filigrana que cruza la esquina superior derecha
const BANDA_C = 1050;
const BANDA_H = 40;
function banda(id: string, P: PaletaTarjeta) {
  const desde = -BANDA_H - 10;
  const hasta = (1200 - BANDA_C) * Math.SQRT2 + 2 * BANDA_H;
  const fi = filigrana(BANDA_H, desde, hasta);
  const oro = `url(#${id})`;
  return (
    <g transform={`translate(${BANDA_C} 0) rotate(45)`}>
      <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={desde} y1={-BANDA_H} x2={hasta} y2={BANDA_H}>{paradas(P)}</linearGradient>
      <rect x={desde} y={-BANDA_H} width={hasta - desde} height={2 * BANDA_H} fill={P.banda} />
      <path d={fi.bordesGruesos} stroke={oro} strokeWidth="2.4" fill="none" />
      <path d={fi.bordesFinos} stroke={oro} strokeWidth="0.9" fill="none" />
      <path d={fi.ondas} stroke={oro} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={fi.festones} stroke={oro} strokeWidth="1" fill="none" />
      <path d={fi.anillos} stroke={oro} strokeWidth="0.9" fill="none" />
      <path d={fi.rellenos} fill={oro} />
      <path d={fi.huecos} fill={P.banda} />
    </g>
  );
}

function Birrete({ ancho, P }: { ancho: number; P: PaletaTarjeta }) {
  const oro = "url(#oroBirrete)";
  return (
    <svg width={ancho} height={(ancho * 176) / 352} viewBox="-176 -64 352 176">
      <defs>
        <linearGradient id="oroBirrete" gradientUnits="userSpaceOnUse" x1="-176" y1="-64" x2="176" y2="112">{paradas(P)}</linearGradient>
      </defs>
      <path d={BIRRETE.casquete} stroke={oro} strokeWidth="3.4" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <path d={BIRRETE.bandaCasquete} stroke={oro} strokeWidth="1.6" fill="none" />
      <path d={BIRRETE.tablero} stroke={oro} strokeWidth="3.4" fill={P.fondoCentro} strokeLinejoin="round" />
      <path d={BIRRETE.canto} stroke={oro} strokeWidth="2" fill="none" strokeLinejoin="round" />
      <path d={BIRRETE.cordon} stroke={oro} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d={BIRRETE.borla + BIRRETE.boton} fill={oro} />
    </svg>
  );
}

// La foto de portada como data URL (Satori no espera descargas lentas y no lee
// WEBP/HEIC). Si tarda, no es JPEG/PNG o pesa demasiado, la tarjeta va sin foto.
async function fotoComoDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000), next: { revalidate: 600 } });
    if (!res.ok) return null;
    const tipo = (res.headers.get("content-type") || "").split(";")[0].trim();
    if (tipo !== "image/jpeg" && tipo !== "image/png") return null;
    const datos = await res.arrayBuffer();
    if (datos.byteLength > 8 * 1024 * 1024) return null;
    return `data:${tipo};base64,${Buffer.from(datos).toString("base64")}`;
  } catch {
    return null;
  }
}

// Bordes según la forma: círculo, arco (redondo arriba) o retrato
function radios(forma: FormaFoto, ancho: number) {
  if (forma === "circulo") return { borderRadius: "50%" };
  if (forma === "arco") return { borderTopLeftRadius: ancho / 2, borderTopRightRadius: ancho / 2, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 };
  return { borderRadius: 10 };
}

function Retrato({ src, lado, P, forma }: { src: string; lado: number; P: PaletaTarjeta; forma: FormaFoto }) {
  // Arco y retrato son más altos que anchos
  const ancho = forma === "circulo" ? lado : Math.round(lado * 0.8);
  const alto = forma === "circulo" ? lado : Math.round(lado * 1.05);
  return (
    <div style={{
      display: "flex", width: ancho + 16, height: alto + 16, padding: 3, ...radios(forma, ancho + 16),
      backgroundImage: doradoCss(P), boxShadow: "0 0 30px rgba(212,176,104,0.35)",
    }}>
      <div style={{ display: "flex", width: ancho + 10, height: alto + 10, padding: 3, backgroundColor: P.fondo, ...radios(forma, ancho + 10) }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={ancho + 4} height={alto + 4} style={{ objectFit: "cover", objectPosition: "50% 22%", ...radios(forma, ancho + 4) }} alt="" />
      </div>
    </div>
  );
}

function Separador({ ancho, margen, P }: { ancho: number; margen: number; P: PaletaTarjeta }) {
  const s = separador(ancho);
  return (
    <svg width={ancho} height="16" viewBox={`${-ancho / 2} -8 ${ancho} 16`} style={{ marginTop: margen }}>
      <defs>
        <linearGradient id="oroSep" gradientUnits="userSpaceOnUse" x1={-ancho / 2} y1="0" x2={ancho / 2} y2="0">{paradas(P)}</linearGradient>
      </defs>
      <path d={s.lineas} stroke="url(#oroSep)" strokeWidth="1.2" fill="none" />
      <path d={s.rellenos} fill="url(#oroSep)" />
    </svg>
  );
}

// ─── Diseño moderno ───────────────────────────────────────────────────────────
// La misma composición que el canvas, en horizontal: la foto en arco a la
// izquierda (nunca detrás del texto) y los datos a la derecha. Colores lisos,
// Playfair y Jost, la fecha en bloque.
async function renderModernaOG(datos: DatosTarjeta) {
  const T = tintasPlanas(datos.paleta);
  const letra = datos.letraNombre;
  const nombre = letra === "mayusculas" ? datos.protagonista.toLocaleUpperCase("es") : datos.protagonista;
  const kicker = datos.tituloScript.toLocaleUpperCase("es");
  const honorBase = datos.honor && !datos.especial ? datos.honor.toLocaleLowerCase("es") : "";
  const honor = honorBase ? honorBase.charAt(0).toLocaleUpperCase("es") + honorBase.slice(1) : "";
  const institucion = datos.institucion?.toLocaleUpperCase("es") ?? "";
  const lugar = !datos.especial ? datos.lugar?.toLocaleUpperCase("es") ?? "" : "";
  const direccion = !datos.especial ? datos.direccion ?? "" : "";
  const para = datos.invitado ? `Para ${datos.invitado}` : "";
  const cta = datos.especial ? "TOCÁ PARA VER TU INVITACIÓN ESPECIAL" : "TOCÁ PARA CONFIRMAR TU ASISTENCIA";
  const fp = !datos.especial ? datos.fechaPartes : null;
  const lado = datos.horaCorta ? datos.horaCorta.toLocaleUpperCase("es") : fp?.anio ?? "";
  const fechaLinea = datos.especial ? datos.fecha ?? "" : "";
  const dedicatoria = datos.dedicatoria ?? "";
  const cursivas = `${honor}${datos.carrera ?? ""}${para}${fechaLinea}${dedicatoria}`;
  const sans5 = `${kicker}${institucion}${lugar}${cta}${fp ? `${fp.semana}${fp.mes}${fp.anio}${lado}` : ""}`;

  const [foto, serif, italica, jost5, jost3, caps, script] = await Promise.all([
    fotoComoDataUrl(datos.foto),
    fuenteGoogle("Playfair+Display:wght@500", `${letra === "clasica" ? nombre : ""}${fp?.dia ?? ""}`),
    cursivas ? fuenteGoogle("Playfair+Display:ital,wght@1,500", cursivas) : null,
    fuenteGoogle("Jost:wght@500", sans5),
    direccion ? fuenteGoogle("Jost:wght@300", direccion) : null,
    letra === "mayusculas" ? fuenteGoogle("Cinzel:wght@600", nombre) : null,
    letra === "caligrafia" || datos.familia ? fuenteGoogle("Great+Vibes", `${letra === "caligrafia" ? nombre : ""}${datos.familia ?? ""}`) : null,
  ]);
  type Fuente = { name: string; data: ArrayBuffer; weight: 300 | 400 | 500 | 600; style: "normal" | "italic" };
  const fuentes = ([
    serif && { name: "Serif", data: serif, weight: 500, style: "normal" },
    italica && { name: "Serif", data: italica, weight: 500, style: "italic" },
    jost5 && { name: "Sans", data: jost5, weight: 500, style: "normal" },
    jost3 && { name: "Sans", data: jost3, weight: 300, style: "normal" },
    caps && { name: "Caps", data: caps, weight: 600, style: "normal" },
    script && { name: "Script", data: script, weight: 400, style: "normal" },
  ] as (Fuente | null)[]).filter((x): x is Fuente => !!x);

  // Satori no mide: el nombre se achica por largo y parte solo en dos líneas
  const largo = nombre.length;
  const pxNombre = letra === "caligrafia" ? (largo > 30 ? 54 : 64) : letra === "mayusculas" ? (largo > 30 ? 34 : 40) : (largo > 36 ? 44 : 52);
  const anchoTexto = foto ? 620 : 900;
  const sep = (ancho: number, margen: number) => <div style={{ display: "flex", width: ancho, height: 2, backgroundColor: T.acento, marginTop: margen }} />;
  const columnaLado = (texto: string) => (
    <div style={{ display: "flex", width: 150, justifyContent: "center", padding: "7px 0", borderTop: `1.5px solid ${T.linea}`, borderBottom: `1.5px solid ${T.linea}`,
      fontFamily: "Sans", fontWeight: 500, fontSize: 13, letterSpacing: 3, color: T.tinta }}>{texto}</div>
  );

  // Arco vertical, como en la tarjeta (el círculo y el retrato, con su forma)
  const radiosFoto = datos.formaFoto === "circulo" ? { borderRadius: "50%" }
    : datos.formaFoto === "arco" ? { borderTopLeftRadius: 170, borderTopRightRadius: 170 } : { borderRadius: 14 };
  const fotoAncho = datos.formaFoto === "circulo" ? 400 : 340;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", backgroundColor: T.fondo }}>
        <div style={{ position: "absolute", left: 22, top: 22, width: 1156, height: 586, border: `1.5px solid ${T.linea}`, display: "flex" }} />
        {/* Marca de agua: el birrete de línea (o las iniciales) detrás del texto, apenas visible */}
        {datos.esGraduacion ? (
          <svg width="560" height="296" viewBox="-180 -70 360 186" style={{ position: "absolute", left: (foto ? 520 : 150) + anchoTexto / 2 - 280, top: 160, opacity: T.fondo === "#FFFFFF" ? 0.055 : 0.08, transform: "rotate(-8deg)" }}>
            <g fill="none" stroke={T.acento} strokeLinecap="round" strokeLinejoin="round">
              <path d={BIRRETE.casquete} strokeWidth="3" />
              <path d={BIRRETE.bandaCasquete} strokeWidth="1.4" />
              <path d={BIRRETE.tablero} strokeWidth="3" />
              <path d={BIRRETE.canto} strokeWidth="1.8" />
              <path d={BIRRETE.cordon} strokeWidth="2.2" />
            </g>
            <path d={BIRRETE.borla + BIRRETE.boton} fill={T.acento} />
          </svg>
        ) : null}
        {foto && (
          <div style={{ position: "absolute", left: 60, top: 0, width: 440, height: 630, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={foto} width={fotoAncho} height={datos.formaFoto === "circulo" ? 400 : 430} style={{ objectFit: "cover", objectPosition: "50% 22%", ...radiosFoto }} alt="" />
          </div>
        )}
        <div style={{
          position: "absolute", left: foto ? 520 : 150, top: 40, width: anchoTexto, height: 550,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center",
        }}>
          <div style={{ display: "flex", fontFamily: "Sans", fontWeight: 500, fontSize: 15, letterSpacing: 5, color: T.acento }}>{kicker}</div>
          {honor && <div style={{ display: "flex", fontFamily: "Serif", fontStyle: "italic", fontWeight: 500, fontSize: 22, color: T.suave, marginTop: 6 }}>{honor}</div>}
          <div style={{
            display: "flex", justifyContent: "center", textAlign: "center", maxWidth: anchoTexto - 20, marginTop: 6, fontSize: pxNombre, lineHeight: 1.12, color: T.tinta,
            ...(letra === "caligrafia" ? { fontFamily: "Script" } : letra === "mayusculas" ? { fontFamily: "Caps", fontWeight: 600, letterSpacing: 2 } : { fontFamily: "Serif", fontWeight: 500 }),
          }}>{nombre}</div>
          {datos.carrera && <div style={{ display: "flex", justifyContent: "center", maxWidth: anchoTexto - 40, fontFamily: "Serif", fontStyle: "italic", fontWeight: 500, fontSize: 21, lineHeight: 1.3, color: T.suave, marginTop: 10 }}>{datos.carrera}</div>}
          {institucion && <div style={{ display: "flex", fontFamily: "Sans", fontWeight: 500, fontSize: 12, letterSpacing: 3, color: T.suave, marginTop: 6 }}>{institucion}</div>}
          {fp && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 22 }}>
              <div style={{ display: "flex", fontFamily: "Sans", fontWeight: 500, fontSize: 13, letterSpacing: 4, color: T.acento }}>{fp.mes}</div>
              <div style={{ display: "flex", alignItems: "center" }}>
                {columnaLado(fp.semana)}
                <div style={{ display: "flex", width: 110, justifyContent: "center", fontFamily: "Serif", fontWeight: 500, fontSize: 58, lineHeight: 1.05, color: T.tinta }}>{fp.dia}</div>
                {columnaLado(lado)}
              </div>
              {datos.horaCorta && <div style={{ display: "flex", fontFamily: "Sans", fontWeight: 500, fontSize: 13, letterSpacing: 4, color: T.acento }}>{fp.anio}</div>}
            </div>
          )}
          {fechaLinea && <div style={{ display: "flex", fontFamily: "Serif", fontStyle: "italic", fontWeight: 500, fontSize: 22, color: T.tinta, marginTop: 16 }}>{fechaLinea}</div>}
          {dedicatoria && <div style={{ display: "flex", justifyContent: "center", maxWidth: anchoTexto - 60, fontFamily: "Serif", fontStyle: "italic", fontWeight: 500, fontSize: 22, lineHeight: 1.3, color: T.tinta, marginTop: 12 }}>{dedicatoria}</div>}
          {lugar && <div style={{ display: "flex", justifyContent: "center", maxWidth: anchoTexto - 40, fontFamily: "Sans", fontWeight: 500, fontSize: 16, letterSpacing: 3, color: T.tinta, marginTop: 18 }}>{lugar}</div>}
          {direccion && <div style={{ display: "flex", justifyContent: "center", maxWidth: anchoTexto - 60, fontFamily: "Sans", fontWeight: 300, fontSize: 15, color: T.suave, marginTop: 3 }}>{direccion}</div>}
          {sep(56, 18)}
          {para && <div style={{ display: "flex", fontFamily: "Serif", fontStyle: "italic", fontWeight: 500, fontSize: 26, color: T.tinta, marginTop: 14 }}>{para}</div>}
          <div style={{ display: "flex", fontFamily: "Sans", fontWeight: 500, fontSize: 12, letterSpacing: 3, color: T.suave, marginTop: 6 }}>{cta}</div>
          {datos.familia && <div style={{ display: "flex", fontFamily: "Script", fontSize: 34, color: T.tinta, marginTop: 8 }}>{datos.familia}</div>}
        </div>
      </div>
    ),
    { ...TAM_OG, fonts: fuentes.length ? fuentes : undefined },
  );
}

export async function renderTarjetaOG(datos: DatosTarjeta) {
  if (datos.diseno === "moderna") return renderModernaOG(datos);
  const P = datos.paleta;
  const TEXTO_ORO = textoOro(P);
  // El nombre en la letra elegida (mayúsculas, caligrafía o clásica)
  const letra = datos.letraNombre;
  const nombre = letra === "mayusculas" ? datos.protagonista.toLocaleUpperCase("es") : datos.protagonista;
  const lugar = datos.lugar?.toLocaleUpperCase("es") ?? "";
  const honor = datos.honor ? `—  ${datos.honor}  —` : "";
  const para = datos.invitado ? `Para ${datos.invitado}` : "";
  const cta = datos.especial ? "TOCÁ PARA VER TU INVITACIÓN ESPECIAL" : "TOCÁ PARA CONFIRMAR TU ASISTENCIA";
  const dedicatoria = datos.dedicatoria ?? "";
  const versiculo = datos.versiculo ? `«${datos.versiculo.texto}»` : "";
  const cita = datos.versiculo?.cita.toLocaleUpperCase("es") ?? "";
  const institucion = datos.institucion?.toLocaleUpperCase("es") ?? "";
  const carrera = datos.carrera ?? "";
  const familia = datos.familia ? `Con cariño, ${datos.familia}` : "";

  const [foto, script, caps6, caps5, sans3, sans4, italica, nombreClasico] = await Promise.all([
    fotoComoDataUrl(datos.foto),
    fuenteGoogle("Great+Vibes", letra === "caligrafia" ? `${datos.tituloScript}${nombre}` : datos.tituloScript),
    fuenteGoogle("Cinzel:wght@600", letra === "mayusculas" ? nombre : "A"),
    fuenteGoogle("Cinzel:wght@500", `${honor}${lugar}${cita}${institucion}`),
    fuenteGoogle("Jost:wght@300", `${datos.fechaCorta ?? ""}${datos.direccion ?? ""}`),
    fuenteGoogle("Jost:wght@400", `${datos.diaHora ?? ""}${cta}`),
    para || versiculo || carrera || familia || dedicatoria
      ? fuenteGoogle("Playfair+Display:ital,wght@1,500", `${para}${versiculo}${carrera}${familia}${dedicatoria}`)
      : null,
    letra === "clasica" ? fuenteGoogle("Playfair+Display:wght@500", nombre) : null,
  ]);
  type Fuente = { name: string; data: ArrayBuffer; weight: 300 | 400 | 500 | 600; style: "normal" | "italic" };
  const fuentes = ([
    script && { name: "Script", data: script, weight: 400, style: "normal" },
    caps6 && { name: "Caps", data: caps6, weight: 600, style: "normal" },
    nombreClasico && { name: "Serif", data: nombreClasico, weight: 500, style: "normal" },
    caps5 && { name: "Caps", data: caps5, weight: 500, style: "normal" },
    sans3 && { name: "Sans", data: sans3, weight: 300, style: "normal" },
    sans4 && { name: "Sans", data: sans4, weight: 400, style: "normal" },
    italica && { name: "Serif", data: italica, weight: 500, style: "italic" },
  ] as (Fuente | null)[]).filter((x): x is Fuente => !!x);

  const pxScript = tamano(ANCHO_SCRIPT[datos.tituloScript] ?? 800, 500, 68, 44);
  // Cinzel medido; caligrafía y clásica, estimadas (son más angostas)
  const pxNombre = letra === "mayusculas" ? tamano(anchoCinzel(nombre), 470, 50, 26)
    : letra === "caligrafia" ? Math.max(34, Math.min(64, Math.floor(470 * 100 / Math.max(nombre.length * 40, 1))))
    : Math.max(28, Math.min(52, Math.floor(470 * 100 / Math.max(nombre.length * 52, 1))));
  const pxLugar = tamano(anchoCinzel(lugar), 440, 28, 18);
  // Las frases de honor largas ("CON ALEGRÍA ANUNCIAMOS…") se achican para no salirse
  const pxHonor = tamano(anchoCinzel(honor) + honor.length * 400 / 15, 490, 15, 9);
  const pxInstitucion = tamano(anchoCinzel(institucion) + institucion.length * 200 / 12, 490, 13, 9);

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", position: "relative",
        backgroundColor: P.fondo,
        backgroundImage: `radial-gradient(circle at 50% 46%, ${P.fondoCentro} 0%, ${P.fondo} 70%)`,
      }}>
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>
            <linearGradient id="oroMarco" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1200" y2="630">{paradas(P)}</linearGradient>
            <linearGradient id="regla" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={P.oroPlano} stopOpacity="0" />
              <stop offset="0.5" stopColor={P.oroPlano} stopOpacity="0.85" />
              <stop offset="1" stopColor={P.oroPlano} stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x="26" y="26" width="1148" height="578" fill="none" stroke="url(#oroMarco)" strokeWidth="3" />
          <rect x="36" y="36" width="1128" height="558" fill="none" stroke="url(#oroMarco)" strokeWidth="1" />
          {banda("oroBanda1", P)}
          <g transform="rotate(180 600 315)">{banda("oroBanda2", P)}</g>
          <rect x="639" y="140" width="1.2" height="350" fill="url(#regla)" />
        </svg>

        {/* Izquierda: birrete, título en caligrafía, a quién se honra y la promoción */}
        <div style={{
          position: "absolute", left: 64, top: 40, width: 560, height: 550,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center",
        }}>
          {foto ? <Retrato src={foto} lado={datos.carrera || datos.honor ? 118 : 132} P={P} forma={datos.formaFoto} />
            : datos.esGraduacion ? <Birrete ancho={190} P={P} /> : <Separador ancho={200} margen={0} P={P} />}
          <div style={{ display: "flex", fontFamily: "Script", fontSize: pxScript, lineHeight: 1.35, padding: "0 12px", marginTop: 4, ...TEXTO_ORO }}>{datos.tituloScript}</div>
          {honor && <div style={{ display: "flex", fontFamily: "Caps", fontWeight: 500, fontSize: pxHonor, letterSpacing: 4, whiteSpace: "nowrap", color: P.oroPlano }}>{honor}</div>}
          {letra === "caligrafia" ? (
            // En caligrafía el espacio es casi nulo: cada palabra va aparte, con aire fijo
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: Math.round(pxNombre * 0.28), marginTop: 8, padding: "0 10px" }}>
              {nombre.split(/\s+/).map((palabra, i) => (
                <span key={i} style={{ display: "flex", fontFamily: "Script", fontSize: pxNombre, lineHeight: 1.2, ...TEXTO_ORO }}>{palabra}</span>
              ))}
            </div>
          ) : (
            <div style={{
              display: "flex", marginTop: 8, lineHeight: 1.2, fontSize: pxNombre, ...TEXTO_ORO,
              ...(letra === "clasica" ? { fontFamily: "Serif", fontWeight: 500 } : { fontFamily: "Caps", fontWeight: 600, letterSpacing: 1 }),
            }}>{nombre}</div>
          )}
          {carrera && <div style={{ display: "flex", justifyContent: "center", fontFamily: "Serif", fontStyle: "italic", fontWeight: 500, fontSize: carrera.length > 48 ? 18 : 21, lineHeight: 1.3, color: P.textoFuerte, maxWidth: 520, marginTop: 6 }}>{carrera}</div>}
          {institucion && <div style={{ display: "flex", justifyContent: "center", fontFamily: "Caps", fontWeight: 500, fontSize: pxInstitucion, letterSpacing: 2, color: P.oroPlano, maxWidth: 520, marginTop: 4 }}>{institucion}</div>}
          <Separador ancho={180} margen={16} P={P} />
        </div>

        {/* Derecha: cuándo, dónde y para quién */}
        <div style={{
          position: "absolute", left: 660, top: 40, width: 476, height: 550,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center",
        }}>
          {datos.fechaCorta && (
            <div style={{ display: "flex", paddingBottom: 10, borderBottom: `1.5px solid ${P.oroPlano}` }}>
              <div style={{ display: "flex", fontFamily: "Sans", fontWeight: 300, fontSize: 46, letterSpacing: 3, lineHeight: 1.15, padding: "0 14px", ...TEXTO_ORO }}>{datos.fechaCorta}</div>
            </div>
          )}
          {dedicatoria && <div style={{ display: "flex", justifyContent: "center", fontFamily: "Serif", fontStyle: "italic", fontWeight: 500, fontSize: 24, lineHeight: 1.3, color: P.textoFuerte, maxWidth: 440, marginTop: 22 }}>{dedicatoria}</div>}
          {datos.diaHora && !datos.especial && <div style={{ display: "flex", fontFamily: "Sans", fontWeight: 400, fontSize: 19, letterSpacing: 4, color: P.textoSuave, marginTop: 14 }}>{datos.diaHora}</div>}
          {lugar && !datos.especial && <div style={{ display: "flex", justifyContent: "center", fontFamily: "Caps", fontWeight: 500, fontSize: pxLugar, letterSpacing: 1, lineHeight: 1.25, maxWidth: 460, marginTop: 30, ...TEXTO_ORO }}>{lugar}</div>}
          {datos.direccion && !datos.especial && <div style={{ display: "flex", justifyContent: "center", fontFamily: "Sans", fontWeight: 300, fontSize: 18, lineHeight: 1.35, color: P.textoSuave, maxWidth: 430, marginTop: 6 }}>{datos.direccion}</div>}
          <Separador ancho={160} margen={24} P={P} />
          {versiculo && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 14, maxWidth: 430 }}>
              <div style={{ display: "flex", justifyContent: "center", fontFamily: "Serif", fontStyle: "italic", fontWeight: 500, fontSize: versiculo.length > 110 ? 15 : 17, lineHeight: 1.35, color: P.textoVersiculo }}>{versiculo}</div>
              <div style={{ display: "flex", fontFamily: "Caps", fontWeight: 500, fontSize: 12, letterSpacing: 3, color: P.oroPlano, marginTop: 5 }}>{cita}</div>
            </div>
          )}
          {para && <div style={{ display: "flex", fontFamily: "Serif", fontStyle: "italic", fontWeight: 500, fontSize: 26, color: P.textoFuerte, marginTop: 18 }}>{para}</div>}
          <div style={{ display: "flex", fontFamily: "Sans", fontWeight: 400, fontSize: 13, letterSpacing: 3, color: P.oroPlano, marginTop: 8 }}>{cta}</div>
          {familia && <div style={{ display: "flex", justifyContent: "center", fontFamily: "Serif", fontStyle: "italic", fontWeight: 500, fontSize: 18, color: P.textoFuerte, maxWidth: 440, marginTop: 14 }}>{familia}</div>}
        </div>
      </div>
    ),
    { ...TAM_OG, fonts: fuentes.length ? fuentes : undefined },
  );
}
