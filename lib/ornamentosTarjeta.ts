// ─── Ornamentos de la tarjeta como trazados SVG ───────────────────────────────
//
// Los mismos trazados sirven en el navegador (Path2D en el canvas) y en el
// servidor (<path d> dentro del SVG de Satori): la imagen que se envía y la
// vista previa de WhatsApp son el mismo dibujo, no dos parecidos.

const f = (n: number) => Math.round(n * 10) / 10;

function circulo(cx: number, cy: number, r: number) {
  return `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
}

// Elipse girada `ang` radianes alrededor de su centro
function elipse(cx: number, cy: number, rx: number, ry: number, ang: number) {
  const dx = rx * Math.cos(ang), dy = rx * Math.sin(ang);
  const grados = f((ang * 180) / Math.PI);
  return `M${f(cx - dx)} ${f(cy - dy)}A${f(rx)} ${f(ry)} ${grados} 1 0 ${f(cx + dx)} ${f(cy + dy)}A${f(rx)} ${f(ry)} ${grados} 1 0 ${f(cx - dx)} ${f(cy - dy)}Z`;
}

export function estrella(cx: number, cy: number, r: number) {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const radio = i % 2 === 0 ? r : r * 0.42;
    d += `${i === 0 ? "M" : "L"}${f(cx + radio * Math.cos(a))} ${f(cy + radio * Math.sin(a))}`;
  }
  return d + "Z";
}

/**
 * Filigrana de una banda en coordenadas locales: `u` a lo largo de la banda,
 * `y` a lo ancho (de -h a h). Dos ondas entrelazadas forman una cadena de
 * lentes; en cada lente va una flor de cuatro pétalos o un rombo, en cada cruce
 * un nudo, y los bordes llevan festones que casi tocan las crestas.
 */
export function filigrana(h: number, desde: number, hasta: number) {
  const k = h / 64;
  const P = 76 * k;          // largo de un motivo
  const A = 40 * k;          // altura de las ondas
  const borde = h - 9 * k;   // línea fina interior
  const paso = 2 * k;

  const bordesGruesos = `M${f(desde)} ${f(-h)}H${f(hasta)}M${f(desde)} ${f(h)}H${f(hasta)}`;
  const bordesFinos = `M${f(desde)} ${f(-borde)}H${f(hasta)}M${f(desde)} ${f(borde)}H${f(hasta)}`;

  let ondas = "";
  const n = Math.ceil((hasta - desde) / paso);
  for (const s of [1, -1]) {
    for (let i = 0; i <= n; i++) {
      const u = desde + i * paso;
      ondas += `${i === 0 ? "M" : "L"}${f(u)} ${f(s * A * Math.sin((2 * Math.PI * u) / P))}`;
    }
  }

  let rellenos = "";
  let huecos = "";           // se rellenan con el color de la banda, encima del oro
  let anillos = "";
  let festones = "";
  const r = 13 * k;
  const primero = Math.floor(desde / (P / 2)) - 1;
  const ultimo = Math.ceil(hasta / (P / 2)) + 1;
  for (let j = primero; j <= ultimo; j++) {
    // Nudo donde se cruzan las ondas, con hojitas hacia los bordes
    const un = (j * P) / 2;
    rellenos += circulo(un, 0, 4 * k);
    anillos += circulo(un, 0, 8.5 * k);
    for (const s of [1, -1]) {
      rellenos += elipse(un, s * 30 * k, 7 * k, 3.2 * k, Math.PI / 2);
      rellenos += circulo(un, s * 45 * k, 2.2 * k);
    }
    // Centro de la lente: flor de cuatro lóbulos con el centro calado, o rombo,
    // alternados
    const uc = un + P / 4;
    if (j % 2 === 0) {
      for (let p = 0; p < 4; p++) {
        const a = Math.PI / 4 + (p * Math.PI) / 2;
        rellenos += circulo(uc + 7 * k * Math.cos(a), 7 * k * Math.sin(a), 6.2 * k);
      }
      huecos += circulo(uc, 0, 2.6 * k);
    } else {
      rellenos += `M${f(uc)} ${f(-13 * k)}L${f(uc + 7 * k)} 0L${f(uc)} ${f(13 * k)}L${f(uc - 7 * k)} 0Z`;
      rellenos += circulo(uc, -24 * k, 2.6 * k) + circulo(uc, 24 * k, 2.6 * k);
    }
    // Festones de los bordes, centrados sobre cada lente
    festones += `M${f(uc - r)} ${f(borde)}A${f(r)} ${f(r)} 0 0 1 ${f(uc + r)} ${f(borde)}`;
    festones += `M${f(uc - r)} ${f(-borde)}A${f(r)} ${f(r)} 0 0 0 ${f(uc + r)} ${f(-borde)}`;
  }

  return { bordesGruesos, bordesFinos, ondas, festones, anillos, rellenos, huecos };
}

/**
 * Birrete en línea dorada, centrado en el botón. Ocupa de -176 a 176 en x y de
 * -64 a 112 en y. El tablero se rellena con el color del fondo para tapar el
 * casquete que queda detrás.
 */
export const BIRRETE = {
  casquete: "M-96 12L-96 66Q0 104 96 66L96 12",
  bandaCasquete: "M-96 50Q0 88 96 50",
  tablero: "M-170 -2L0 -58L170 -2L0 40Z",
  canto: "M-170 -2L-170 7L0 49L170 7L170 -2",
  cordon: "M4 -10Q92 -16 138 6L139 66",
  borla: "M133 72L127 106L151 106L145 72Z" + circulo(139, 69, 5.5),
  boton: elipse(0, -10, 7, 5, 0),
};

/** Roseta con cintas, centrada en (0, 0), de radio R. */
export function sello(R: number) {
  let roseta = "";
  const n = 360;
  for (let i = 0; i <= n; i++) {
    const t = (2 * Math.PI * i) / n;
    const r = R * (0.93 + 0.07 * Math.cos(18 * t));
    roseta += `${i === 0 ? "M" : "L"}${f(r * Math.cos(t))} ${f(r * Math.sin(t))}`;
  }
  roseta += "Z";

  let cintas = "";
  const w = R * 0.42;
  for (const s of [-1, 1]) {
    const xt = s * R * 0.32, yt = R * 0.55, xb = s * R * 0.6, yb = R * 1.75;
    cintas += `M${f(xt - w / 2)} ${f(yt)}L${f(xt + w / 2)} ${f(yt)}L${f(xb + w / 2)} ${f(yb)}L${f(xb)} ${f(yb - w * 0.5)}L${f(xb - w / 2)} ${f(yb)}Z`;
  }

  let puntos = "";
  for (let i = 0; i < 28; i++) {
    const t = (2 * Math.PI * i) / 28;
    puntos += circulo(R * 0.855 * Math.cos(t), R * 0.855 * Math.sin(t), R * 0.022);
  }

  const estrellas = [-1, 0, 1].map((i) => estrella(i * R * 0.17, -R * 0.4, R * (i === 0 ? 0.075 : 0.06))).join("");

  return { roseta, cintas, puntos, estrellas, anillo: circulo(0, 0, R * 0.78), centro: circulo(0, 0, R * 0.72) };
}

/** Separador: dos líneas finas, un rombo al centro y dos puntos. Centrado en (0, 0). */
export function separador(ancho: number) {
  const m = ancho / 2;
  return {
    lineas: `M${f(-m)} 0H-16M16 0H${f(m)}`,
    rellenos: "M0 -7L9 0L0 7L-9 0Z" + circulo(-24, 0, 2.2) + circulo(24, 0, 2.2),
  };
}
