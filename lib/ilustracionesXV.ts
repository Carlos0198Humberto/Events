// ─── Ilustraciones de la tarjeta de XV años ───────────────────────────────────
//
// Ramilletes de rosas para las esquinas y la quinceañera de espaldas con su
// vestido de gala, dibujados en vector (SVG). El mismo dibujo lo usan la
// tarjeta (canvas, como imagen) y la vista previa de WhatsApp (Satori): se ve
// nítido en cualquier tamaño y toma el color de vestido que eligió el
// organizador. Dibujo propio: no reproduce ninguna ilustración comercial.

export type TonoXV = "rosa" | "lila" | "celeste" | "champana" | "vino";
export type ColoresXV = { nombre: string; claro: string; medio: string; fuerte: string; profundo: string; texto: string };

export const TONOS_XV: Record<TonoXV, ColoresXV> = {
  rosa: { nombre: "Rosa", claro: "#FBD5E2", medio: "#F294B8", fuerte: "#E15C90", profundo: "#A3285A", texto: "#8E1E46" },
  lila: { nombre: "Lila", claro: "#E8DDF8", medio: "#C4A9EE", fuerte: "#9C78DA", profundo: "#6640A8", texto: "#55308F" },
  celeste: { nombre: "Celeste", claro: "#D8EDFB", medio: "#A2CFF1", fuerte: "#62A9DF", profundo: "#2F6FA6", texto: "#245A8A" },
  champana: { nombre: "Champaña", claro: "#F7EAD5", medio: "#EACB9D", fuerte: "#D0A367", profundo: "#8F6A35", texto: "#7A5626" },
  vino: { nombre: "Rojo vino", claro: "#F5CBD1", medio: "#DB6B7D", fuerte: "#B32F47", profundo: "#7A1428", texto: "#7A1428" },
};
export const TONOS_XV_LISTA = Object.keys(TONOS_XV) as TonoXV[];
export function coloresXV(tono?: string | null): ColoresXV {
  return TONOS_XV[tono as TonoXV] ?? TONOS_XV.rosa;
}

const HOJA = { claro: "#A5C793", medio: "#729F62", oscuro: "#3E6A3B" };

// Un pétalo que sale del centro hacia arriba: largo l, ancho w
const petalo = (l: number, w: number) =>
  `M0 0C${w} ${-l * 0.25} ${w * 0.95} ${-l * 0.95} 0 ${-l}C${-w * 0.95} ${-l * 0.95} ${-w} ${-l * 0.25} 0 0Z`;

const n = (v: number) => Math.round(v * 10) / 10;

// Gradientes comunes de rosas, hojas y capullos (ids locales de cada SVG)
function defsFlores(c: ColoresXV) {
  return `
  <radialGradient id="r-base"><stop offset="0" stop-color="${c.fuerte}"/><stop offset="1" stop-color="${c.profundo}"/></radialGradient>
  <linearGradient id="r-ext" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${c.profundo}"/><stop offset=".55" stop-color="${c.fuerte}"/><stop offset="1" stop-color="${c.medio}"/></linearGradient>
  <linearGradient id="r-med" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${c.fuerte}"/><stop offset="1" stop-color="${c.medio}"/></linearGradient>
  <linearGradient id="r-int" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${c.fuerte}"/><stop offset="1" stop-color="${c.claro}"/></linearGradient>
  <linearGradient id="r-copa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.claro}"/><stop offset="1" stop-color="${c.fuerte}"/></linearGradient>
  <linearGradient id="h-hoja" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${HOJA.oscuro}"/><stop offset=".6" stop-color="${HOJA.medio}"/><stop offset="1" stop-color="${HOJA.claro}"/></linearGradient>
  <linearGradient id="c-cap" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${c.profundo}"/><stop offset="1" stop-color="${c.medio}"/></linearGradient>`;
}

function rosa(x: number, y: number, r: number, c: ColoresXV, giro = 0): string {
  const anillo = (cant: number, l: number, w: number, desfase: number, fill: string, op = 1) =>
    Array.from({ length: cant }, (_, i) =>
      `<path d="${petalo(l, w)}" transform="rotate(${n(desfase + (360 / cant) * i)})" fill="${fill}" opacity="${op}"/>`).join("");
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(giro)}) scale(${n(r / 50 * 100) / 100})">
    <circle r="44" fill="url(#r-base)"/>
    ${anillo(6, 50, 31, 0, "url(#r-ext)", 0.96)}
    ${anillo(5, 40, 26, 34, "url(#r-med)", 0.96)}
    <path d="M-38 6Q0 50 38 6Q0 28 -38 6Z" fill="url(#r-copa)" opacity=".95"/>
    ${anillo(4, 27, 19, 14, "url(#r-int)")}
    <circle r="11" fill="${c.fuerte}"/>
    <path d="M-7 1C-7-7 6-9 7-1C8 6-2 8-3 2C-4-2 2-3 2 0" fill="none" stroke="${c.profundo}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M-24-31Q-9-42 7-37" fill="none" stroke="#FFFFFF" stroke-opacity=".38" stroke-width="3" stroke-linecap="round"/>
    <path d="M18-20Q27-12 26 0" fill="none" stroke="#FFFFFF" stroke-opacity=".25" stroke-width="2.4" stroke-linecap="round"/>
  </g>`;
}

function hoja(x: number, y: number, l: number, giro: number): string {
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(giro)})">
    <path d="M0 0C${n(l * 0.3)} ${n(-l * 0.29)} ${n(l * 0.75)} ${n(-l * 0.27)} ${n(l)} 0C${n(l * 0.75)} ${n(l * 0.27)} ${n(l * 0.3)} ${n(l * 0.29)} 0 0Z" fill="url(#h-hoja)"/>
    <path d="M${n(l * 0.05)} 0L${n(l * 0.92)} 0" stroke="${HOJA.oscuro}" stroke-opacity=".5" stroke-width="${n(Math.max(1, l * 0.022))}"/>
  </g>`;
}

function capullo(x: number, y: number, l: number, giro: number): string {
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(giro)})">
    <path d="M0 0L0 ${n(l * 0.62)}" stroke="${HOJA.oscuro}" stroke-width="${n(l * 0.07)}" stroke-linecap="round"/>
    <path d="M0 0C${n(l * 0.36)} ${n(-l * 0.25)} ${n(l * 0.34)} ${n(-l * 0.72)} 0 ${n(-l)}C${n(-l * 0.34)} ${n(-l * 0.72)} ${n(-l * 0.36)} ${n(-l * 0.25)} 0 0Z" fill="url(#c-cap)"/>
    <path d="M0 0C${n(l * 0.3)} ${n(-l * 0.1)} ${n(l * 0.42)} ${n(-l * 0.35)} ${n(l * 0.22)} ${n(-l * 0.55)}C${n(l * 0.2)} ${n(-l * 0.3)} ${n(l * 0.08)} ${n(-l * 0.12)} 0 0Z" fill="${HOJA.medio}"/>
    <path d="M0 0C${n(-l * 0.3)} ${n(-l * 0.1)} ${n(-l * 0.42)} ${n(-l * 0.35)} ${n(-l * 0.22)} ${n(-l * 0.55)}C${n(-l * 0.2)} ${n(-l * 0.3)} ${n(-l * 0.08)} ${n(-l * 0.12)} 0 0Z" fill="${HOJA.oscuro}"/>
  </g>`;
}

export type EsquinaXV = "arriba-izq" | "arriba-der" | "abajo-izq" | "abajo-der";

// Ramillete de una esquina en un lienzo de 460×460, abierto hacia el centro de
// la tarjeta. Las posiciones se espejan según la esquina; las rosas quedan
// derechas (espejarlas pondría la copa de cada rosa al revés).
export function svgRamillete(c: ColoresXV, esquina: EsquinaXV): string {
  const T = 460;
  const der = esquina.endsWith("der");
  const abajo = esquina.startsWith("abajo");
  const px = (x: number) => (der ? T - x : x);
  const py = (y: number) => (abajo ? T - y : y);
  // Las hojas apuntan a la derecha (+x) y los capullos hacia arriba (−y): al
  // espejar, su giro cambia distinto
  const ang = (a: number) => { let r = a; if (der) r = 180 - r; if (abajo) r = -r; return r; };
  const angArriba = (a: number) => { let r = a; if (der) r = -r; if (abajo) r = 180 - r; return r; };
  const hojas: [number, number, number, number][] = [
    [150, 72, 124, 8], [62, 168, 134, 82], [232, 40, 104, -16], [40, 262, 116, 96],
    [262, 142, 96, 30], [128, 232, 104, 56], [318, 92, 84, 6], [88, 318, 84, 88],
  ];
  const capullos: [number, number, number, number][] = [[312, 58, 74, 74], [62, 330, 74, 166], [258, 220, 52, 40]];
  const rosas: [number, number, number, number][] = [[194, 182, 44, 12], [80, 216, 56, -14], [216, 70, 60, 18], [92, 92, 80, 0]];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${T} ${T}" width="${T}" height="${T}"><defs>${defsFlores(c)}</defs>
    ${hojas.map(([x, y, l, a]) => hoja(px(x), py(y), l, ang(a))).join("")}
    ${capullos.map(([x, y, l, a]) => capullo(px(x), py(y), l, angArriba(a))).join("")}
    ${rosas.map(([x, y, r, g]) => rosa(px(x), py(y), r, c, der ? -g : g)).join("")}
    ${hoja(px(142), py(152), 62, ang(40))}
  </svg>`;
}

// Brillitos del vestido (posiciones fijas: la tarjeta sale igual cada vez)
const BRILLOS: [number, number, number][] = [
  [120, 430, 2.2], [160, 500, 1.6], [210, 470, 2.4], [252, 410, 1.8], [292, 520, 2.2], [182, 380, 1.5],
  [238, 540, 1.7], [96, 540, 1.9], [330, 470, 1.6], [204, 330, 1.4], [146, 352, 1.3], [270, 360, 1.5],
  [62, 560, 1.6], [350, 556, 1.8], [196, 560, 1.4], [116, 470, 1.2], [276, 470, 1.3],
];

// La quinceañera de espaldas, con el vestido de gala del tono elegido, en un
// lienzo de 400×600
export function svgQuinceanera(c: ColoresXV): string {
  const volados = Array.from({ length: 16 }, (_, i) =>
    `<ellipse cx="${n(20 + i * 24)}" cy="586" rx="15" ry="8.5" fill="${c.claro}" stroke="${c.medio}" stroke-width="1.2"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600"><defs>
    <linearGradient id="q-vestido" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.claro}"/><stop offset=".42" stop-color="${c.medio}"/><stop offset="1" stop-color="${c.fuerte}"/></linearGradient>
    <radialGradient id="q-luz" cx=".38" cy=".25" r=".7"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".55"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
    <linearGradient id="q-corpino" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.medio}"/><stop offset="1" stop-color="${c.fuerte}"/></linearGradient>
    <linearGradient id="q-lazo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.fuerte}"/><stop offset="1" stop-color="${c.profundo}"/></linearGradient>
    <linearGradient id="q-pelo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5E3529"/><stop offset="1" stop-color="#341A14"/></linearGradient>
    <linearGradient id="q-piel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F5CFB2"/><stop offset="1" stop-color="#E4AC8A"/></linearGradient>
    <linearGradient id="q-oro" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C99A3E"/><stop offset=".5" stop-color="#F3D88E"/><stop offset="1" stop-color="#C99A3E"/></linearGradient>
  </defs>
  <ellipse cx="200" cy="592" rx="192" ry="8" fill="${c.profundo}" opacity=".14"/>
  <!-- Falda de gala y tul -->
  <path d="M168 246C150 320 78 410 30 520C20 545 14 566 16 584L384 584C386 566 380 545 370 520C322 410 250 320 232 246Z" fill="url(#q-vestido)"/>
  <path d="M172 252C146 336 66 440 26 584L374 584C334 440 254 336 228 252Z" fill="#FFFFFF" opacity=".12"/>
  <path d="M168 246C150 320 78 410 30 520C20 545 14 566 16 584L384 584C386 566 380 545 370 520C322 410 250 320 232 246Z" fill="url(#q-luz)"/>
  <g fill="none" stroke-linecap="round">
    <path d="M186 258C172 350 118 450 84 580" stroke="#FFFFFF" stroke-opacity=".3" stroke-width="7"/>
    <path d="M214 258C228 350 282 450 316 580" stroke="#FFFFFF" stroke-opacity=".22" stroke-width="7"/>
    <path d="M200 262C198 380 196 480 200 582" stroke="${c.profundo}" stroke-opacity=".12" stroke-width="10"/>
    <path d="M176 300C150 400 120 480 112 580" stroke="${c.profundo}" stroke-opacity=".1" stroke-width="12"/>
    <path d="M224 300C250 400 280 480 288 580" stroke="${c.profundo}" stroke-opacity=".1" stroke-width="12"/>
    <path d="M160 300C126 392 82 470 58 574" stroke="#FFFFFF" stroke-opacity=".16" stroke-width="5"/>
    <path d="M240 300C274 392 318 470 342 574" stroke="#FFFFFF" stroke-opacity=".14" stroke-width="5"/>
    <path d="M104 392Q200 420 296 392" stroke="#FFFFFF" stroke-opacity=".3" stroke-width="3"/>
    <path d="M58 478Q200 512 342 478" stroke="#FFFFFF" stroke-opacity=".3" stroke-width="3"/>
    <path d="M104 396Q200 424 296 396" stroke="${c.profundo}" stroke-opacity=".1" stroke-width="2"/>
    <path d="M58 482Q200 516 342 482" stroke="${c.profundo}" stroke-opacity=".1" stroke-width="2"/>
  </g>
  ${BRILLOS.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFFFFF" opacity=".85"/>`).join("")}
  ${volados}
  <!-- Brazos y espalda -->
  <path d="M150 150C138 186 132 226 136 262C137 274 146 278 152 270C152 236 157 198 164 168Z" fill="url(#q-piel)"/>
  <path d="M250 150C262 186 268 226 264 262C263 274 254 278 248 270C248 236 243 198 236 168Z" fill="url(#q-piel)"/>
  <path d="M142 146C150 132 172 126 200 126C228 126 250 132 258 146L252 160C230 154 170 154 148 160Z" fill="url(#q-piel)"/>
  <!-- Mangas caídas -->
  <ellipse cx="146" cy="157" rx="21" ry="13" transform="rotate(-18 146 157)" fill="url(#q-vestido)" stroke="${c.medio}" stroke-width="1"/>
  <ellipse cx="254" cy="157" rx="21" ry="13" transform="rotate(18 254 157)" fill="url(#q-vestido)" stroke="${c.medio}" stroke-width="1"/>
  <path d="M134 152Q146 146 158 152" fill="none" stroke="#FFFFFF" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>
  <path d="M242 152Q254 146 266 152" fill="none" stroke="#FFFFFF" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>
  <!-- Corpiño con cordón -->
  <path d="M148 156C150 196 162 232 168 250L232 250C238 232 250 196 252 156C230 150 170 150 148 156Z" fill="url(#q-corpino)"/>
  <path d="M190 168L210 180L190 192L210 204L190 216L210 228L190 240" fill="none" stroke="${c.profundo}" stroke-opacity=".7" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M168 246Q200 254 232 246L232 257Q200 265 168 257Z" fill="${c.fuerte}"/>
  <!-- Moño -->
  <path d="M196 256C188 296 174 334 160 376L176 372C188 334 198 296 202 258Z" fill="url(#q-lazo)"/>
  <path d="M204 256C212 296 226 334 240 376L224 372C212 334 202 296 198 258Z" fill="url(#q-lazo)"/>
  <path d="M200 252C170 224 136 232 146 260C152 282 186 274 200 256Z" fill="url(#q-lazo)"/>
  <path d="M200 252C230 224 264 232 254 260C248 282 214 274 200 256Z" fill="url(#q-lazo)"/>
  <path d="M164 252Q172 244 184 246" fill="none" stroke="#FFFFFF" stroke-opacity=".4" stroke-width="2" stroke-linecap="round"/>
  <path d="M216 246Q228 244 236 252" fill="none" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>
  <ellipse cx="200" cy="254" rx="9" ry="8" fill="${c.profundo}"/>
  <!-- Cuello, cabello largo y peinado alto -->
  <path d="M188 100L212 100L215 130L185 130Z" fill="url(#q-piel)"/>
  <path d="M166 76C160 110 160 140 166 166C170 180 178 190 186 188C190 196 196 198 200 192C204 198 210 196 214 188C222 190 230 180 234 166C240 140 240 110 234 76Z" fill="url(#q-pelo)"/>
  <g fill="none" stroke-linecap="round">
    <path d="M180 92C176 122 178 152 184 178" stroke="#8A5444" stroke-opacity=".5" stroke-width="2"/>
    <path d="M220 92C224 122 222 152 216 178" stroke="#8A5444" stroke-opacity=".45" stroke-width="2"/>
    <path d="M200 94C200 130 200 160 200 186" stroke="#8A5444" stroke-opacity=".3" stroke-width="2"/>
    <path d="M178 182C172 192 176 202 184 200" stroke="#4A2620" stroke-width="3"/>
    <path d="M222 182C228 192 224 202 216 200" stroke="#4A2620" stroke-width="3"/>
  </g>
  <circle cx="200" cy="74" r="36" fill="url(#q-pelo)"/>
  <path d="M178 52Q200 40 222 52" fill="none" stroke="#8A5A48" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>
  <circle cx="200" cy="38" r="20" fill="url(#q-pelo)"/>
  <path d="M188 30Q200 22 212 30" fill="none" stroke="#8A5A48" stroke-opacity=".6" stroke-width="2.4" stroke-linecap="round"/>
  <!-- Tiara -->
  <path d="M172 54Q200 36 228 54" fill="none" stroke="url(#q-oro)" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M184 47L187 36L191 45ZM196 42L200 28L204 42ZM209 45L213 36L216 47Z" fill="url(#q-oro)"/>
  <circle cx="200" cy="40" r="2.8" fill="${c.fuerte}"/><circle cx="187.5" cy="44" r="2" fill="${c.fuerte}"/><circle cx="212.5" cy="44" r="2" fill="${c.fuerte}"/>
  <!-- Flor en el peinado -->
  ${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="222" cy="36" rx="4.6" ry="7.5" transform="rotate(${a} 222 44)" fill="${c.medio}"/>`).join("")}
  <circle cx="222" cy="44" r="3.4" fill="${c.claro}"/>
</svg>`;
}

/** SVG → data URL (sirve en el navegador y en el servidor). */
export function svgDataUrl(svg: string): string {
  const b64 = typeof Buffer !== "undefined"
    ? Buffer.from(svg, "utf8").toString("base64")
    : btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${b64}`;
}
