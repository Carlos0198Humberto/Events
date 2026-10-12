import { describe, expect, it } from "vitest";
import {
  armarDatosTarjeta,
  extrasDe,
  familiaDe,
  fraseInvitacion,
  agradecimientoDe,
  cartaDistancia,
  enReserva,
  enAgradecimiento,
  asistioAlEvento,
  sugerenciasGracias,
  sugerenciasReserva,
  textosGracias,
  textosReserva,
  enInstitucion,
  quienInvitaHablado,
  paletaDe,
  protagonistaDe,
  tintasPlanas,
  type EventoTarjeta,
} from "@/lib/tarjetaInvitacion";

const grad = (extra: Partial<EventoTarjeta> = {}): EventoTarjeta => ({
  nombre: "Graduación",
  tipo: "graduacion",
  anfitriones: "Chavarría Aparicio",
  fecha: "2026-10-31",
  hora: "20:40:00",
  lugar: "IEAPES",
  ...extra,
});

describe("protagonistaDe", () => {
  it("usa el nombre del graduando cargado a propósito antes que cualquier deducción", () => {
    const p = protagonistaDe(grad({ nombre: "Graduación de Luis", tarjeta: { graduando: "Andrea Castillo" } }));
    expect(p).toEqual({ nombre: "Andrea Castillo", esPersona: true });
  });

  it("saca el nombre del título del evento", () => {
    expect(protagonistaDe(grad({ nombre: "Graduación de Luis — Ingeniería 2025" })).nombre).toBe("Luis");
  });

  it("no toma a «Familia Ramírez» como la persona que se gradúa", () => {
    const p = protagonistaDe(grad({ nombre: "Graduación 2026", anfitriones: "Familia Ramírez" }));
    expect(p.esPersona).toBe(false);
  });
});

describe("familiaDe", () => {
  it("prefiere la familia cargada a propósito", () => {
    expect(familiaDe(grad({ tarjeta: { familia: "Familia Castillo Pérez" } }))).toBe("Familia Castillo Pérez");
  });

  it("usa a los anfitriones cuando son una familia y el protagonista es otra persona", () => {
    expect(familiaDe(grad({ nombre: "Graduación de Luis", anfitriones: "Familia Ramírez" }))).toBe("Familia Ramírez");
  });

  it("no repite la familia abajo si ya es el nombre grande de la tarjeta", () => {
    expect(familiaDe(grad({ nombre: "Graduación 2026", anfitriones: "Familia Ramírez" }))).toBeNull();
  });
});

describe("extrasDe", () => {
  it("recorta espacios, descarta vacíos y conserva «sin frase» (honor vacío)", () => {
    const ex = extrasDe({ tarjeta: { carrera: "  Licenciatura   en Derecho ", institucion: "   ", honor: "" } });
    expect(ex.carrera).toBe("Licenciatura en Derecho");
    expect(ex.institucion).toBeNull();
    expect(ex.honor).toBe("");
  });

  it("tolera una columna vacía o con basura", () => {
    expect(extrasDe({ tarjeta: null })).toEqual({});
    expect(extrasDe({ tarjeta: "x" as unknown as null })).toEqual({});
  });
});

describe("armarDatosTarjeta", () => {
  it("pone «EN HONOR A» por defecto en graduación", () => {
    expect(armarDatosTarjeta(grad(), "María José").honor).toBe("EN HONOR A");
  });

  it("respeta «sin frase» y la frase propia", () => {
    expect(armarDatosTarjeta(grad({ tarjeta: { honor: "" } }), "X").honor).toBeNull();
    expect(armarDatosTarjeta(grad({ tarjeta: { honor: "Con orgullo presentamos a" } }), "X").honor).toBe("CON ORGULLO PRESENTAMOS A");
  });

  it("la dirección cargada manda; sin ella se parte el lugar en la coma", () => {
    const conDireccion = armarDatosTarjeta(grad({ lugar: "Hotel Real, San Salvador", tarjeta: { direccion: "Bulevar de Los Héroes" } }), "X");
    expect(conDireccion.lugar).toBe("Hotel Real, San Salvador");
    expect(conDireccion.direccion).toBe("Bulevar de Los Héroes");
    const sinDireccion = armarDatosTarjeta(grad({ lugar: "Hotel Real, San Salvador" }), "X");
    expect(sinDireccion.lugar).toBe("Hotel Real");
    expect(sinDireccion.direccion).toBe("San Salvador");
  });

  it("lleva la foto de portada salvo que se la saque", () => {
    expect(armarDatosTarjeta(grad({ imagen_url: "https://x/foto.jpg" }), "X").foto).toBe("https://x/foto.jpg");
    expect(armarDatosTarjeta(grad({ imagen_url: "https://x/foto.jpg", tarjeta: { foto: false } }), "X").foto).toBeNull();
  });

  it("habla en primera persona si organiza el mismo graduado, y en plural si firma la familia", () => {
    expect(fraseInvitacion(grad(), false)).toBe("con mucha alegría te invito a celebrar mi graduación");
    expect(fraseInvitacion(grad({ tarjeta: { familia: "Familia Chavarría" } }), false, true))
      .toBe("con mucha alegría te invitamos a celebrar este logro");
  });

  it("el llamado a confirmar respeta el trato plural", () => {
    expect(armarDatosTarjeta(grad(), "Los López", "plural").cta).toBe("Confirmen su asistencia en el enlace del mensaje");
  });
});

describe("paletaDe", () => {
  it("elige según el tipo de evento", () => {
    expect(paletaDe({ tipo: "graduacion" }).id).toBe("azul");
    expect(paletaDe({ tipo: "boda" }).id).toBe("marfil");
    expect(paletaDe({ tipo: "quinceañera" }).id).toBe("rosa");
    expect(paletaDe({ tipo: "cumpleaños" }).id).toBe("negro");
  });

  it("respeta la elegida y descarta una que no existe", () => {
    expect(paletaDe({ tipo: "graduacion", tarjeta: { paleta: "esmeralda" } }).id).toBe("esmeralda");
    expect(paletaDe({ tipo: "graduacion", tarjeta: { paleta: "violeta" } }).id).toBe("azul");
  });
});

describe("invitados a distancia", () => {
  const carlos = () => grad({ tarjeta: { graduando: "Carlos Humberto Chavarría Aparicio" } });

  it("la voz nombra a quien invita con nombre y primer apellido", () => {
    expect(quienInvitaHablado(carlos())).toBe("Carlos Chavarría");
    expect(quienInvitaHablado(grad({ tarjeta: { graduando: "Ana López" } }))).toBe("Ana López");
    expect(quienInvitaHablado(grad({ nombre: "Graduación 2026", anfitriones: "Familia Ramírez" }))).toBe("la familia Ramírez");
  });

  it("el agradecimiento usa el texto propio o uno según quién habla", () => {
    expect(agradecimientoDe(grad({ tarjeta: { agradecimiento: "Gracias por todo." } }))).toBe("Gracias por todo.");
    expect(agradecimientoDe(grad())).toContain("Preparé esta invitación especial");
    expect(agradecimientoDe(grad({ tarjeta: { familia: "Familia Chavarría" } }))).toContain("Preparamos esta invitación especial");
  });

  it("la tarjeta especial agradece en vez de pedir confirmar", () => {
    const d = armarDatosTarjeta(carlos(), "Tía Rosa", "f", { distancia: true });
    expect(d.especial).toBe(true);
    expect(d.tituloScript).toBe("Con gratitud");
    expect(d.honor).toBe("INVITACIÓN ESPECIAL");
    expect(d.dedicatoria).toBe("Aunque estés lejos, fuiste parte de este logro.");
    expect(d.cta).not.toContain("Confirm");
    expect(armarDatosTarjeta(carlos(), "X").especial).toBe(false);
    // Un solo versículo en toda la especial: la bendición de la carta, no en la tarjeta
    expect(armarDatosTarjeta(carlos(), "Tía Rosa", "f", { distancia: true }).versiculo).toBeNull();
  });

  it("la carta agradece en primera persona, habla del estudio y cierra con la bendición", () => {
    const c = cartaDistancia(grad(), "f");
    expect(c.parrafos).toHaveLength(4);
    expect(c.parrafos[0]).toBe("Hoy quiero detenerme a darte las gracias. Después de años de estudio, llegó el día de mi graduación, y este logro no es solo mío: también lleva tu nombre.");
    expect(c.parrafos[1]).toContain("en los semestres más difíciles, en las noches de estudio y en cada examen");
    expect(c.parrafos[2]).toContain("cuando reciba mi título. Por eso preparé esta invitación especial para vos");
    expect(c.oracion).toBe("Y esta es mi oración por vos:");
    expect(c.bendicion.cita).toBe("Números 6:24-26");
    expect(c.despedida).toBe("Con todo mi cariño y gratitud,");
  });

  it("la carta nombra la carrera y la universidad cargadas en la tarjeta", () => {
    const c = cartaDistancia(grad({ tarjeta: { carrera: "Ingeniería en Sistemas Informáticos", institucion: "Universidad de El Salvador" } }), "f");
    expect(c.parrafos[0]).toContain("Después de años de estudio, me gradúo de Ingeniería en Sistemas Informáticos en la Universidad de El Salvador, y este logro no es solo mío");
    expect(enInstitucion("Instituto Tecnológico de Centroamérica")).toBe("en el Instituto Tecnológico de Centroamérica");
    expect(enInstitucion("ITCA-FEPADE")).toBe("en ITCA-FEPADE");
  });

  it("la carta habla como familia y en plural a varios", () => {
    const c = cartaDistancia(grad({ tarjeta: { familia: "Familia Chavarría", graduando: "Carlos Chavarría", carrera: "Ingeniería Civil" } }), "plural");
    expect(c.parrafos[0]).toContain("Hoy queremos detenernos a darles las gracias. Después de años de estudio, Carlos se gradúa de Ingeniería Civil");
    expect(c.parrafos[2]).toContain("cuando Carlos reciba su título. Por eso preparamos esta invitación especial para ustedes: para que vean las fotos");
    expect(c.parrafos[3]).toContain("Le pedimos a Dios que les devuelva");
    expect(c.oracion).toBe("Y esta es nuestra oración por ustedes:");
    expect(c.firma).toBe("Familia Chavarría");
  });

  it("la carta editada conserva sus párrafos (uno por línea)", () => {
    const c = cartaDistancia(grad({ tarjeta: { agradecimiento: "Gracias por todo.\n\n  Te quiero mucho.  " } }), "f");
    expect(c.parrafos).toEqual(["Gracias por todo.", "Te quiero mucho.", expect.stringContaining("Le pido a Dios")]);
  });

  it("la entrada con QR va salvo que el organizador la saque", () => {
    expect(extrasDe(grad()).entrada_qr).toBeUndefined();
    expect(extrasDe(grad({ tarjeta: { entrada_qr: false } })).entrada_qr).toBe(false);
  });

  it("el agradecimiento propio reemplaza la carta, la bendición queda", () => {
    const c = cartaDistancia(grad({ tarjeta: { agradecimiento: "Gracias por todo." } }), "m");
    expect(c.parrafos).toEqual(["Gracias por todo.", expect.stringContaining("Le pido a Dios")]);
  });
});

describe("estilos de la tarjeta", () => {
  it("por defecto: moderna, foto en arco, letra clásica y la foto de portada", () => {
    const d = armarDatosTarjeta(grad({ imagen_url: "https://x/portada.jpg" }), "X");
    expect([d.diseno, d.formaFoto, d.letraNombre, d.foto]).toEqual(["moderna", "arco", "clasica", "https://x/portada.jpg"]);
    expect(d.fechaPartes).toEqual({ semana: "SÁBADO", dia: "31", mes: "OCTUBRE", anio: "2026" });
  });

  it("los diseños clásicos conservan el círculo y las mayúsculas", () => {
    const d = armarDatosTarjeta(grad({ tarjeta: { diseno: "gala" } }), "X");
    expect([d.diseno, d.formaFoto, d.letraNombre]).toEqual(["gala", "circulo", "mayusculas"]);
  });

  it("la paleta blanca va en tinta azul marino; el oro solo si se elige", () => {
    const blanca = paletaDe({ tipo: "boda" });
    expect(blanca.nombre).toBe("Blanco y azul marino");
    expect(tintasPlanas(blanca)).toMatchObject({ fondo: "#FFFFFF", acento: "#2D4372" });
    expect(paletaDe({ tipo: "boda", tarjeta: { metal: "oro" } }).oroPlano).toBe("#8C6A26");
    expect(tintasPlanas(paletaDe({ tipo: "graduacion" })).tinta).toBe("#FFFFFF");
  });

  it("usa la foto propia de la tarjeta y los estilos elegidos", () => {
    const d = armarDatosTarjeta(grad({ imagen_url: "https://x/portada.jpg", tarjeta: {
      foto_url: "https://x/toga.jpg", diseno: "floral", forma_foto: "arco", letra_nombre: "caligrafia",
    } }), "X");
    expect([d.diseno, d.formaFoto, d.letraNombre, d.foto]).toEqual(["floral", "arco", "caligrafia", "https://x/toga.jpg"]);
  });

  it("descarta valores que no existen", () => {
    const ex = extrasDe({ tarjeta: { diseno: "neon", forma_foto: "estrella", metal: "bronce", foto_url: "javascript:alert(1)" } as never });
    expect([ex.diseno, ex.forma_foto, ex.metal, ex.foto_url]).toEqual([undefined, undefined, undefined, undefined]);
  });

  it("el metal cambia el dorado; en fondo claro usa la versión profunda", () => {
    const oro = paletaDe({ tipo: "graduacion" });
    const plata = paletaDe({ tipo: "graduacion", tarjeta: { metal: "plata" } });
    const plataMarfil = paletaDe({ tipo: "boda", tarjeta: { metal: "plata" } });
    expect(plata.id).toBe("azul");
    expect(plata.dorado).not.toEqual(oro.dorado);
    expect(plataMarfil.dorado).not.toEqual(plata.dorado);
    expect(paletaDe({ tipo: "graduacion", tarjeta: { metal: "oro" } })).toEqual(oro);
  });
});

describe("pre-invitación (reservá la fecha)", () => {
  const reserva = (extra: Partial<EventoTarjeta> = {}) => grad({ ...extra, tarjeta: { etapa: "reserva", ...(extra.tarjeta ?? {}) } });

  it("solo la graduación tiene etapa de pre-invitación", () => {
    expect(enReserva(reserva())).toBe(true);
    expect(enReserva(grad())).toBe(false);
    expect(enReserva({ tipo: "boda", tarjeta: { etapa: "reserva" } })).toBe(false);
  });

  it("la tarjeta anuncia la fecha y nada más: sin hora, lugar ni pedir confirmar", () => {
    const d = armarDatosTarjeta(reserva({ hora: "18:00", lugar: "Hotel Real, San Salvador" }), "Rosa", "f");
    expect(d.reserva).toBe(true);
    expect([d.horaCorta, d.lugar, d.direccion, d.versiculo]).toEqual([null, null, null, null]);
    expect(d.fechaPartes).not.toBeNull();
    expect(d.cta).not.toMatch(/confirm[aá] tu/i);
  });

  it("la tarjeta de la pre-invitación es la gala negro y oro de la referencia", () => {
    const d = armarDatosTarjeta(reserva({ imagen_url: "https://x/foto.jpg", tarjeta: { etapa: "reserva", diseno: "moderna", paleta: "marfil" } }), "Rosa", "f");
    expect([d.diseno, d.paleta.id, d.letraNombre, d.foto]).toEqual(["gala", "negro", "mayusculas", null]);
    expect(d.tituloScript).toBe("Invitación de Graduación");
    expect(d.honor).toBe("RESERVÁ LA FECHA"); // donde la gala dice «ceremony»; nunca «En honor a»
    expect(d.dedicatoria).toBe(textosReserva(reserva(), "f").constancia);
    expect(d.promocion).toBe("2026");
    expect(d.aviso).toContain("la invitación formal");
    expect(d.cta).toBe(""); // el aviso completo reemplaza el pie en mayúsculas
  });

  it("el texto propio reemplaza la constancia y la tarjeta con el enlace llega después", () => {
    const culto = sugerenciasReserva(reserva(), "f").find((x) => x.id === "culto")!.texto;
    expect(culto).toBe("Con profunda gratitud a Dios, que me ha permitido culminar esta etapa, tengo el gusto de invitarte al culto de acción de gracias con el que celebraré mi graduación. Este triunfo es obra de Su fidelidad, y será un privilegio compartirlo contigo.");
    const t = textosReserva(reserva({ tarjeta: { etapa: "reserva", pre_texto: culto } }), "f");
    expect(t.constancia).toBe(culto);
    expect(t.despues).toBe("Próximamente te haré llegar la invitación formal, con todos los detalles y el enlace para confirmar tu asistencia.");
  });

  it("quien está lejos recibe su carta aunque la etapa sea la pre-invitación", () => {
    const d = armarDatosTarjeta(reserva(), "Rosa", "f", { distancia: true });
    expect([d.especial, d.reserva]).toEqual([true, false]);
  });

  it("los textos hablan en primera persona o como familia, y en plural a varios", () => {
    const yo = textosReserva(reserva(), "f");
    expect(yo.constancia).toBe("Te envío esta pre-invitación para dejar constancia de que te invito a mi graduación.");
    expect(yo.apartar).toContain("para que apartes este día");
    expect(yo.despues).toContain("te haré llegar la invitación formal");
    const familia = textosReserva(reserva({ tarjeta: { familia: "Familia Chavarría", graduando: "Carlos Chavarría" } }), "plural");
    expect(familia.constancia).toBe("Les enviamos esta pre-invitación para dejar constancia de que los invitamos a la graduación de Carlos.");
    expect(familia.apartar).toContain("Sabemos que tienen muchas ocupaciones");
    expect(familia.firma).toBe("Familia Chavarría");
  });
});

describe("agradecimiento (tercer momento)", () => {
  const gracias = (extra: Partial<EventoTarjeta> = {}) => grad({ ...extra, tarjeta: { etapa: "gracias", ...(extra.tarjeta ?? {}) } });

  it("solo la graduación tiene etapa de agradecimiento, y no es la pre-invitación", () => {
    expect(enAgradecimiento(gracias())).toBe(true);
    expect(enReserva(gracias())).toBe(false);
    expect(enAgradecimiento(grad())).toBe(false);
    expect(enAgradecimiento({ tipo: "boda", tarjeta: { etapa: "gracias" } })).toBe(false);
  });

  it("fue quien confirmó; con escáner, solo quien entró con su código; quien estaba lejos, no", () => {
    expect(asistioAlEvento(gracias(), { estado: "confirmado" })).toBe(true);
    expect(asistioAlEvento(gracias(), { estado: "rechazado" })).toBe(false);
    expect(asistioAlEvento(gracias(), { estado: "pendiente", presente: true })).toBe(true);
    const escaner = gracias({ tarjeta: { etapa: "gracias", asistencia: "escaner" } });
    expect(asistioAlEvento(escaner, { estado: "confirmado", presente: false })).toBe(false);
    expect(asistioAlEvento(escaner, { estado: "confirmado", presente: true })).toBe(true);
    expect(asistioAlEvento(gracias(), { estado: "confirmado", a_distancia: true })).toBe(false);
  });

  it("agradece a quien fue y a quien no pudo ir, con Dios en el texto", () => {
    const fue = textosGracias(gracias(), "f", true);
    expect(fue.texto).toBe("Gracias por acompañarme en mi graduación. Tu presencia hizo de ese día un recuerdo que guardaré siempre. Doy gracias a Dios por este logro y por tu vida, porque fuiste parte de este camino.");
    const noFue = textosGracias(gracias(), "f", false);
    expect(noFue.texto).toBe("Aunque no pudiste acompañarme en mi graduación, tu cariño y tus buenos deseos llegaron hasta mí. Doy gracias a Dios por este logro y por tu vida, porque también fuiste parte de este camino.");
    expect(fue.fotos).toBe("Te comparto las fotos de ese día.");
  });

  it("habla como familia y en plural a varios", () => {
    const t = textosGracias(gracias({ tarjeta: { etapa: "gracias", familia: "Familia Chavarría", graduando: "Carlos Chavarría" } }), "plural", true);
    expect(t.texto).toBe("Gracias por acompañarnos en la graduación de Carlos. Su presencia hizo de ese día un recuerdo que guardaremos siempre. Damos gracias a Dios por este logro y por sus vidas, porque fueron parte de este camino.");
    expect(t.fotos).toBe("Les compartimos las fotos de ese día.");
    expect(t.firma).toBe("Familia Chavarría");
  });

  it("los textos propios mandan, cada uno para su grupo", () => {
    const ev = gracias({ tarjeta: { etapa: "gracias", gracias_texto: "Gracias por venir.", gracias_ausente: "Te extrañé." } });
    expect(textosGracias(ev, "f", true).texto).toBe("Gracias por venir.");
    expect(textosGracias(ev, "f", false).texto).toBe("Te extrañé.");
    expect(extrasDe(ev).gracias_texto).toBe("Gracias por venir.");
  });

  it("sugiere la gratitud a Dios y el culto de acción de gracias", () => {
    const fue = sugerenciasGracias(gracias({ tarjeta: { etapa: "gracias", gracias_texto: "Propio" } }), "f", true);
    expect(fue.map((x) => x.id)).toEqual(["gratitud", "culto"]);
    expect(fue[0].texto).toBe(textosGracias(gracias(), "f", true).texto); // la automática, no la propia
    expect(fue[1].texto).toBe("Gracias por acompañarme en el culto de acción de gracias por mi graduación. Fue una bendición compartir contigo ese momento de gratitud a Dios, que hizo posible este triunfo. Tu presencia y tus oraciones quedarán siempre en mi corazón.");
    const noFue = sugerenciasGracias(gracias(), "plural", false);
    expect(noFue[1].texto).toBe("Aunque no pudieron acompañarme en el culto de acción de gracias por mi graduación, los tuve presentes. Gracias por su cariño y sus oraciones: que Dios, que hizo posible este triunfo, los bendiga siempre.");
  });

  it("la tarjeta es la gala negro y oro con «Gracias», sin hora ni lugar", () => {
    const d = armarDatosTarjeta(gracias({ imagen_url: "https://x/foto.jpg", tarjeta: { etapa: "gracias", diseno: "moderna", paleta: "marfil" } }), "Rosa", "f", { asistio: true });
    expect([d.gracias, d.reserva, d.especial]).toEqual([true, false, false]);
    expect([d.diseno, d.paleta.id, d.letraNombre, d.foto]).toEqual(["gala", "negro", "mayusculas", null]);
    expect([d.tituloScript, d.honor]).toEqual(["Gracias", "POR SER PARTE DE ESTE LOGRO"]);
    expect(d.dedicatoria).toBe(textosGracias(gracias(), "f", true).texto);
    expect([d.horaCorta, d.lugar, d.direccion, d.versiculo, d.aviso, d.cta]).toEqual([null, null, null, null, null, ""]);
    expect([d.fechaCorta, d.promocion]).toEqual(["31 · OCT · 2026", "2026"]);
  });

  it("quien estuvo lejos también recibe el agradecimiento (el de no pudo ir)", () => {
    const d = armarDatosTarjeta(gracias(), "Rosa", "f", { distancia: true, asistio: false });
    expect([d.gracias, d.especial]).toEqual([true, false]);
    expect(d.dedicatoria).toContain("Aunque no pudiste acompañarme");
  });
});
