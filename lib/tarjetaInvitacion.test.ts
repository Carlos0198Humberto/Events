import { describe, expect, it } from "vitest";
import {
  armarDatosTarjeta,
  extrasDe,
  familiaDe,
  fraseInvitacion,
  agradecimientoDe,
  quienInvitaHablado,
  paletaDe,
  protagonistaDe,
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
  });
});

describe("estilos de la tarjeta", () => {
  it("por defecto: gala, círculo, mayúsculas y la foto de portada", () => {
    const d = armarDatosTarjeta(grad({ imagen_url: "https://x/portada.jpg" }), "X");
    expect([d.diseno, d.formaFoto, d.letraNombre, d.foto]).toEqual(["gala", "circulo", "mayusculas", "https://x/portada.jpg"]);
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
