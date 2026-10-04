// ─── Versículos bíblicos para la invitación ───────────────────────────────────
//
// Reina-Valera 1960, la versión que más se lee en las iglesias de
// Centroamérica. Son citas breves, como las de una invitación impresa. Las
// sugerencias cambian según el tipo de evento, y el organizador también puede
// escribir el suyo (otra versión, otro pasaje).

export type Versiculo = { texto: string; cita: string };

const GENERALES: Versiculo[] = [
  { texto: "Este es el día que hizo Jehová; nos gozaremos y alegraremos en él.", cita: "Salmos 118:24" },
  { texto: "Grandes cosas ha hecho Jehová con nosotros; estaremos alegres.", cita: "Salmos 126:3" },
  { texto: "Dad gracias en todo, porque esta es la voluntad de Dios para con vosotros en Cristo Jesús.", cita: "1 Tesalonicenses 5:18" },
];

const POR_TIPO: Record<string, Versiculo[]> = {
  graduacion: [
    { texto: "Encomienda a Jehová tus obras, y tus pensamientos serán afirmados.", cita: "Proverbios 16:3" },
    { texto: "Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.", cita: "Jeremías 29:11" },
    { texto: "Todo lo puedo en Cristo que me fortalece.", cita: "Filipenses 4:13" },
    { texto: "Hasta aquí nos ayudó Jehová.", cita: "1 Samuel 7:12" },
    { texto: "Reconócelo en todos tus caminos, y él enderezará tus veredas.", cita: "Proverbios 3:6" },
    { texto: "Encomienda a Jehová tu camino, y confía en él; y él hará.", cita: "Salmos 37:5" },
  ],
  boda: [
    { texto: "Cordón de tres dobleces no se rompe pronto.", cita: "Eclesiastés 4:12" },
    { texto: "Por tanto, lo que Dios juntó, no lo separe el hombre.", cita: "Marcos 10:9" },
    { texto: "Las muchas aguas no podrán apagar el amor, ni lo ahogarán los ríos.", cita: "Cantares 8:7" },
    { texto: "Todo lo sufre, todo lo cree, todo lo espera, todo lo soporta.", cita: "1 Corintios 13:7" },
    { texto: "Y ahora permanecen la fe, la esperanza y el amor, estos tres; pero el mayor de ellos es el amor.", cita: "1 Corintios 13:13" },
  ],
  quinceañera: [
    { texto: "Te alabaré; porque formidables, maravillosas son tus obras; estoy maravillado, y mi alma lo sabe muy bien.", cita: "Salmos 139:14" },
    { texto: "Engañosa es la gracia, y vana la hermosura; la mujer que teme a Jehová, ésa será alabada.", cita: "Proverbios 31:30" },
    { texto: "Deléitate asimismo en Jehová, y él te concederá las peticiones de tu corazón.", cita: "Salmos 37:4" },
    { texto: "Jehová te bendiga, y te guarde; Jehová haga resplandecer su rostro sobre ti, y tenga de ti misericordia.", cita: "Números 6:24-25" },
  ],
  cumpleaños: [
    { texto: "Enséñanos de tal modo a contar nuestros días, que traigamos al corazón sabiduría.", cita: "Salmos 90:12" },
    { texto: "Nuevas son cada mañana; grande es tu fidelidad.", cita: "Lamentaciones 3:23" },
    { texto: "Jehová te bendiga, y te guarde; Jehová haga resplandecer su rostro sobre ti, y tenga de ti misericordia.", cita: "Números 6:24-25" },
  ],
};

/** Sugerencias para el tipo de evento, seguidas de las que sirven para cualquiera. */
export function versiculosPara(tipo: string): Versiculo[] {
  const propios = POR_TIPO[tipo] ?? [];
  return [...propios, ...GENERALES.filter((g) => !propios.some((p) => p.cita === g.cita))];
}

/** Texto y cita limpios, o null si falta alguno de los dos. */
export function versiculoDe(texto?: string | null, cita?: string | null): Versiculo | null {
  const t = texto?.trim().replace(/^[«"“]+|[»"”]+$/g, "").trim();
  const c = cita?.trim();
  return t && c ? { texto: t, cita: c } : null;
}
