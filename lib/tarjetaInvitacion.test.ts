import { describe, expect, it } from "vitest";
import {
  armarDatosTarjeta,
  extrasDe,
  familiaDe,
  fraseInvitacion,
  agradecimientoDe,
  cartaDistancia,
  dedicatoriaDistancia,
  vinculoDe,
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
  versiculoDeEvento,
  type EventoTarjeta,
} from "@/lib/tarjetaInvitacion";
import { VERSICULO_XV } from "@/lib/versiculos";

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

  it("agradece a quien fue, con Dios en el texto", () => {
    const t = textosGracias(gracias(), "f");
    expect(t.texto).toBe("Gracias por acompañarme en mi graduación. Tu presencia hizo de ese día un recuerdo que guardaré siempre. Doy gracias a Dios por este logro y por tu vida, porque fuiste parte de este camino.");
    expect(t.fotos).toBe("Te comparto las fotos de ese día.");
  });

  it("habla como familia y en plural a varios", () => {
    const t = textosGracias(gracias({ tarjeta: { etapa: "gracias", familia: "Familia Chavarría", graduando: "Carlos Chavarría" } }), "plural");
    expect(t.texto).toBe("Gracias por acompañarnos en la graduación de Carlos. Su presencia hizo de ese día un recuerdo que guardaremos siempre. Damos gracias a Dios por este logro y por sus vidas, porque fueron parte de este camino.");
    expect(t.fotos).toBe("Les compartimos las fotos de ese día.");
    expect(t.firma).toBe("Familia Chavarría");
  });

  it("el texto propio manda", () => {
    const ev = gracias({ tarjeta: { etapa: "gracias", gracias_texto: "Gracias por venir." } });
    expect(textosGracias(ev, "f").texto).toBe("Gracias por venir.");
    expect(extrasDe(ev).gracias_texto).toBe("Gracias por venir.");
  });

  it("sugiere la gratitud a Dios y el culto de acción de gracias", () => {
    const s = sugerenciasGracias(gracias({ tarjeta: { etapa: "gracias", gracias_texto: "Propio" } }), "f");
    expect(s.map((x) => x.id)).toEqual(["gratitud", "culto"]);
    expect(s[0].texto).toBe(textosGracias(gracias(), "f").texto); // la automática, no la propia
    expect(s[1].texto).toBe("Gracias por acompañarme en el culto de acción de gracias por mi graduación. Fue una bendición compartir contigo ese momento de gratitud a Dios, que hizo posible este triunfo. Tu presencia y tus oraciones quedarán siempre en mi corazón.");
  });

  it("la tarjeta de quien fue es la gala negro y oro con «Gracias», sin hora ni lugar", () => {
    const d = armarDatosTarjeta(gracias({ imagen_url: "https://x/foto.jpg", tarjeta: { etapa: "gracias", diseno: "moderna", paleta: "marfil" } }), "Rosa", "f", { asistio: true });
    expect([d.gracias, d.reserva, d.especial]).toEqual([true, false, false]);
    expect([d.diseno, d.paleta.id, d.letraNombre, d.foto]).toEqual(["gala", "negro", "mayusculas", null]);
    expect([d.tituloScript, d.honor]).toEqual(["Gracias", "POR SER PARTE DE ESTE LOGRO"]);
    expect(d.dedicatoria).toBe(textosGracias(gracias(), "f").texto);
    expect([d.horaCorta, d.lugar, d.direccion, d.versiculo, d.aviso, d.cta]).toEqual([null, null, null, null, null, ""]);
    expect([d.fechaCorta, d.promocion]).toEqual(["31 · OCT · 2026", "2026"]);
  });

  it("a quien no llegó no le toca agradecimiento: su tarjeta sigue siendo la de antes", () => {
    const noFue = armarDatosTarjeta(gracias(), "Rosa", "f", { asistio: false });
    expect(noFue.gracias).toBe(false);
    expect(noFue.tituloScript).toBe("Invitación de Graduación");
    const lejos = armarDatosTarjeta(gracias(), "Rosa", "f", { distancia: true, asistio: false });
    expect([lejos.gracias, lejos.especial]).toEqual([false, true]); // su carta a distancia
  });
});

describe("tarjeta de XV años", () => {
  const xv = (extra: Partial<EventoTarjeta> = {}): EventoTarjeta => ({
    nombre: "Mis XV años de Ashley", tipo: "quinceañera", anfitriones: "Genaro y Soila",
    fecha: "2026-08-10", hora: "17:00:00", lugar: "Salón Los Almendros", ...extra,
  });

  it("reconoce a la quinceañera en «Mis XV años de …»", () => {
    expect(protagonistaDe(xv()).nombre).toBe("Ashley");
  });

  it("por defecto es el diseño de la quinceañera, en rosa y sin foto", () => {
    const d = armarDatosTarjeta(xv({ imagen_url: "https://x/foto.jpg" }), "Rosa", "f");
    expect([d.diseno, d.tonoXV, d.foto]).toEqual(["xv", "rosa", null]);
    expect(armarDatosTarjeta(xv({ tarjeta: { tono_xv: "lila" } }), "Rosa", "f").tonoXV).toBe("lila");
    expect(armarDatosTarjeta(xv({ tarjeta: { diseno: "moderna" } }), "Rosa", "f").diseno).toBe("moderna");
  });

  it("invitan los papás, con la frase en plural o singular según quiénes", () => {
    const d = armarDatosTarjeta(xv(), "Rosa", "f");
    expect(d.padres).toBe("Genaro y Soila");
    expect(d.invitaXV).toBe("Se complacen en invitarte a celebrar este mágico e inolvidable momento");
    const familia = armarDatosTarjeta(xv({ anfitriones: "Familia García" }), "Los López", "plural");
    expect(familia.invitaXV).toBe("Se complace en invitarlos a celebrar este mágico e inolvidable momento");
  });

  it("cierra con «Te esperamos» (o «Te espero» si invita ella)", () => {
    expect(armarDatosTarjeta(xv(), "Rosa", "f").esperamosXV).toBe("Te esperamos");
    expect(armarDatosTarjeta(xv(), "Los López", "plural").esperamosXV).toBe("Los esperamos");
    expect(armarDatosTarjeta(xv({ anfitriones: "Ashley" }), "Rosa", "f").esperamosXV).toBe("Te espero");
    expect(armarDatosTarjeta(grad(), "Rosa", "f").esperamosXV).toBeNull();
  });

  it("si invita la misma quinceañera, habla ella", () => {
    const d = armarDatosTarjeta(xv({ anfitriones: "Ashley" }), "Rosa", "f");
    expect(d.padres).toBeNull();
    expect(d.invitaXV).toBe("Con mucho cariño te invito a celebrar mis XV años");
  });

  it("siempre lleva versículo: el elegido o, si no hay, el de la quinceañera", () => {
    expect(armarDatosTarjeta(xv(), "Rosa", "f").versiculo).toEqual(VERSICULO_XV);
    const propio = xv({ versiculo_texto: "Todo lo puedo en Cristo que me fortalece.", versiculo_cita: "Filipenses 4:13" });
    expect(versiculoDeEvento(propio)?.cita).toBe("Filipenses 4:13");
    // Quitado a propósito: sin versículo
    expect(versiculoDeEvento(xv({ tarjeta: { sin_versiculo: true } }))).toBeNull();
    // Los otros tipos no reciben uno que no eligieron
    expect(versiculoDeEvento(grad())).toBeNull();
  });

  it("los otros tipos de evento no llevan nada de XV", () => {
    const d = armarDatosTarjeta(grad(), "Rosa", "f");
    expect([d.padres, d.invitaXV, d.tonoXV]).toEqual([null, null, null]);
    expect(d.diseno).toBe("moderna");
  });
});

describe("el nombre y quién invita siempre aparecen", () => {
  it("reconoce a la quinceañera en «XV de…», «15 años de…» y «Quinceañera de…»", () => {
    for (const nombre of ["XV de Ashley", "15 años de Ashley", "Quinceañera de Ashley", "XV años de Ashley"]) {
      expect(protagonistaDe({ nombre, tipo: "quinceañera", anfitriones: "Genaro y Soila" }).nombre).toBe("Ashley");
    }
  });

  it("los papás que invitan aparecen aunque no empiecen con «Familia»", () => {
    expect(familiaDe({ nombre: "XV años de Ashley", tipo: "quinceañera", anfitriones: "Genaro y Soila" })).toBe("Genaro y Soila");
    expect(familiaDe({ nombre: "Graduación de Luis", tipo: "graduacion", anfitriones: "Carlos y María Pérez" })).toBe("Carlos y María Pérez");
  });

  it("no repite al festejado como si fuera quien invita", () => {
    expect(familiaDe({ nombre: "Graduación", tipo: "graduacion", anfitriones: "Carlos Chavarría", tarjeta: { graduando: "Carlos Humberto Chavarría Aparicio" } })).toBeNull();
    expect(familiaDe({ nombre: "Graduación", tipo: "graduacion", anfitriones: "Carlos Humberto Chavarría Aparicio" })).toBeNull();
  });
});

describe("invitados a distancia por vínculo", () => {
  const carlos = () => grad({ tarjeta: { graduando: "Carlos Humberto Chavarría Aparicio" } });

  it("solo acepta los tres vínculos", () => {
    expect([vinculoDe("familia"), vinculoDe("amigos"), vinculoDe("hermanos"), vinculoDe("primos"), vinculoDe(null)])
      .toEqual(["familia", "amigos", "hermanos", null, null]);
  });

  it("a la familia: el logro es de toda la familia y la oración pide unidad", () => {
    const c = cartaDistancia(grad(), "f", "familia");
    expect(c.parrafos[0]).toBe("Hoy quiero detenerme a darte las gracias. Después de años de estudio, llegó el día de mi graduación, y este logro no es solo mío: es de toda la familia, y también lleva tu nombre.");
    expect(c.parrafos[1]).toContain("Somos familia, y eso no lo cambia ninguna distancia.");
    expect(c.parrafos[2]).toContain("como estuviste siempre. Por eso preparé esta invitación especial para vos");
    expect(c.parrafos[3]).toContain("que mantenga unida a nuestra familia");
    expect(c.oracion).toBe("Y esta es mi oración por vos:");
  });

  it("a los amigos: la amistad como regalo de Dios, en plural cuando son varios", () => {
    const c = cartaDistancia(grad({ tarjeta: { familia: "Familia Chavarría", graduando: "Carlos Chavarría" } }), "plural", "amigos");
    expect(c.parrafos[0]).toContain("Hoy queremos detenernos a darles las gracias.");
    expect(c.parrafos[0]).toContain("su amistad fue un regalo de Dios.");
    expect(c.parrafos[1]).toContain("por escucharnos cuando más lo necesitábamos");
    expect(c.parrafos[2]).toContain("A los buenos amigos no los separa la distancia.");
    expect(c.parrafos[3]).toContain("que nuestra amistad siga creciendo");
  });

  it("a los hermanos en Cristo: sus oraciones, la comunión y la oración que los nombra", () => {
    const c = cartaDistancia(grad(), "m", "hermanos");
    expect(c.parrafos[0]).toContain("y sé que detrás de este logro están tus oraciones.");
    expect(c.parrafos[1]).toContain("Doy gracias a Dios por tu vida y por la comunión que tenemos en Cristo.");
    expect(c.parrafos[2]).toContain("en mi corazón y en mis oraciones cuando reciba mi título");
    expect(c.oracion).toBe("Y esta es mi oración por vos, hermano:");
    expect(c.despedida).toBe("Con amor fraternal en Cristo,");
    expect(cartaDistancia(grad(), "f", "hermanos").oracion).toBe("Y esta es mi oración por vos, hermana:");
    expect(cartaDistancia(grad(), "neutro", "hermanos").oracion).toBe("Y esta es mi oración por vos:");
    expect(cartaDistancia(grad(), "plural", "hermanos").oracion).toBe("Y esta es mi oración por ustedes, hermanos:");
  });

  it("fuera de una graduación no habla de estudio", () => {
    const c = cartaDistancia({ nombre: "Mis XV años", tipo: "quinceañera", anfitriones: "Familia Ruiz" }, "f", "familia");
    expect(c.parrafos.join(" ")).not.toMatch(/estudio|semestre|título/);
    expect(c.parrafos[0]).toContain("Este día tan especial es de toda la familia");
  });

  it("la carta escrita para ese vínculo gana; si no hay, la general; la bendición queda", () => {
    const ev = grad({ tarjeta: { agradecimiento: "Carta general.", carta_hermanos: "Querido hermano en la fe.\nGracias por orar." } });
    expect(cartaDistancia(ev, "m", "hermanos").parrafos).toEqual(["Querido hermano en la fe.", "Gracias por orar.", expect.stringContaining("Le pido al Señor")]);
    expect(cartaDistancia(ev, "m", "amigos").parrafos).toEqual(["Carta general.", expect.stringContaining("Le pido a Dios")]);
    expect(cartaDistancia(ev, "m", "hermanos").bendicion.cita).toBe("Números 6:24-26");
  });

  it("la tarjeta lleva una dedicatoria corta para cada vínculo", () => {
    expect(armarDatosTarjeta(carlos(), "Tía Rosa", "f", { distancia: true, vinculo: "familia" }).dedicatoria).toBe("Somos familia: la distancia no nos separa.");
    expect(armarDatosTarjeta(carlos(), "Juan", "m", { distancia: true, vinculo: "amigos" }).dedicatoria).toBe("Tu amistad fue parte de este logro.");
    expect(armarDatosTarjeta(carlos(), "Hno. Pedro", "m", { distancia: true, vinculo: "hermanos" }).dedicatoria).toBe("Tus oraciones fueron parte de este logro.");
    expect(dedicatoriaDistancia(false, "hermanos", true)).toBe("Sus oraciones son parte de este momento.");
    expect(armarDatosTarjeta(carlos(), "Tía Rosa", "f", { distancia: true }).dedicatoria).toBe("Aunque estés lejos, fuiste parte de este logro.");
  });

  it("guarda la transmisión solo si es un enlace https", () => {
    expect(extrasDe(grad({ tarjeta: { transmision: "https://youtu.be/dQw4w9WgXcQ", transmision_titulo: "  Culto de acción de gracias " } })))
      .toMatchObject({ transmision: "https://youtu.be/dQw4w9WgXcQ", transmision_titulo: "Culto de acción de gracias" });
    expect(extrasDe(grad({ tarjeta: { transmision: "javascript:alert(1)" } })).transmision).toBeUndefined();
  });
});
