import { describe, expect, it } from "vitest";
import {
  armarMensajeDia,
  armarMensajeDistancia,
  armarMensajeInvitacion,
  armarMensajeRecordatorio,
  type EventoMensaje,
} from "@/lib/mensajeInvitacion";

const LINK = "https://events-nine-sepia.vercel.app/confirmar/abc123";
// 1 de octubre de 2026: un mes antes de la graduación
const HOY = new Date(2026, 9, 1);

const grad = (extra: Partial<EventoMensaje> = {}): EventoMensaje => ({
  nombre: "Graduación",
  tipo: "graduacion",
  anfitriones: "Chavarría Aparicio",
  fecha: "2026-10-31",
  hora: "20:40:00",
  lugar: "IEAPES",
  fecha_limite_confirmacion: "2026-10-20",
  ...extra,
});

const enlaces = (texto: string) => texto.match(/https?:\/\/\S+/g) ?? [];

describe("armarMensajeInvitacion", () => {
  it("es corto: título, saludo, cuándo/dónde, enlace y firma", () => {
    const m = armarMensajeInvitacion(grad(), "Wendy", LINK, "f", HOY);
    expect(m).toBe([
      "🎓 Graduación de Chavarría Aparicio",
      "Querida Wendy:\nCon mucha alegría te invito a celebrar mi graduación.",
      "🗓️ Sábado 31 de octubre · 8:40 p. m.\n🏛️ IEAPES",
      `✅ Confirmá tu asistencia antes del 20 de octubre:\n${LINK}`,
      "Con cariño, Chavarría Aparicio",
    ].join("\n\n"));
  });

  it("lleva un solo enlace (WhatsApp arma la vista previa con el primero)", () => {
    const m = armarMensajeInvitacion(grad({ tarjeta: { direccion: "Calle principal", referencia: "Frente a la cancha" } }), "María José", LINK, "f", HOY, { personas: 2 });
    expect(enlaces(m)).toEqual([LINK]);
  });

  it("no repite lo que ya está en la tarjeta (carrera, referencia, versículo) ni lleva estrellitas", () => {
    const m = armarMensajeInvitacion(grad({
      versiculo_texto: "Todo lo puedo en Cristo que me fortalece.", versiculo_cita: "Filipenses 4:13",
      tarjeta: { carrera: "Licenciatura en Educación", referencia: "Frente a la cancha Bilbao" },
    }), "Ana", LINK, "f", HOY);
    expect(m).not.toContain("Licenciatura");
    expect(m).not.toContain("Referencia");
    expect(m).not.toContain("Filipenses");
    expect(m).not.toContain("✨");
  });

  it("si el título ya nombra al graduado, la frase no lo repite", () => {
    const m = armarMensajeInvitacion(grad({ tarjeta: { familia: "Familia Chavarría Aparicio" } }), "Ana", LINK, "f", HOY);
    expect(m.match(/Chavarría Aparicio/g)).toHaveLength(2); // título y firma
    expect(m).toContain("te invitamos a celebrar este logro");
    expect(m.endsWith("Con cariño, Familia Chavarría Aparicio")).toBe(true);
  });

  it("menciona los lugares solo cuando son más de uno", () => {
    expect(armarMensajeInvitacion(grad(), "Ana", LINK, "f", HOY, { personas: 2 })).toContain("2 lugares reservados");
    expect(armarMensajeInvitacion(grad(), "Ana", LINK, "f", HOY, { personas: 1 })).not.toContain("lugar");
    expect(armarMensajeInvitacion(grad(), "Ana", LINK, "f", HOY, { personas: null })).not.toContain("lugar");
  });

  it("menciona el plazo solo si es antes del evento", () => {
    expect(armarMensajeInvitacion(grad(), "Ana", LINK, "f", HOY)).toContain("antes del 20 de octubre");
    const despues = armarMensajeInvitacion(grad({ fecha_limite_confirmacion: "2026-11-03" }), "Ana", LINK, "f", HOY);
    expect(despues).not.toContain("antes del");
    expect(despues).toContain("Confirmá tu asistencia aquí:");
  });

  it("incluye la dirección junto al lugar", () => {
    const m = armarMensajeInvitacion(grad({ tarjeta: { direccion: "Calle principal, San Salvador" } }), "Ana", LINK, "f", HOY);
    expect(m).toContain("IEAPES, Calle principal, San Salvador");
  });

  it("pone el año solo si el evento no es este año", () => {
    expect(armarMensajeInvitacion(grad({ fecha: "2027-01-15" }), "Ana", LINK, "f", HOY)).toContain("15 de enero de 2027");
  });
});

describe("armarMensajeDia", () => {
  it("el mismo día dice «¡Hoy es el día!» y no repite la fecha", () => {
    const m = armarMensajeDia(grad({ tarjeta: { referencia: "Frente a la cancha" } }), "Ana", LINK, "f", new Date(2026, 9, 31));
    expect(m).toContain("¡Hoy es el día! Te esperamos.");
    expect(m).not.toContain("octubre");
    expect(m).toContain("8:40 p. m.");
    expect(m).toContain("Referencia: Frente a la cancha");
    expect(enlaces(m)).toEqual([LINK]);
  });

  it("la víspera dice «¡Mañana es el día!» y respeta el plural", () => {
    const m = armarMensajeDia(grad(), "Los López", LINK, "plural", new Date(2026, 9, 30));
    expect(m).toContain("¡Mañana es el día! Los esperamos.");
  });
});

describe("armarMensajeRecordatorio", () => {
  it("cuenta los días que faltan y lleva el enlace", () => {
    const m = armarMensajeRecordatorio(grad(), "Ana", LINK, "f", new Date(2026, 9, 28));
    expect(m).toContain("faltan 3 días");
    expect(enlaces(m)).toEqual([LINK]);
  });
});

describe("saludo del mensaje", () => {
  it("saluda por el nombre de pila, no por el nombre completo de la lista", () => {
    const m = armarMensajeInvitacion(grad(), "Rosa María Pérez", LINK, "f", HOY);
    expect(m).toContain("Querida Rosa:");
    expect(m).not.toContain("Pérez:");
  });
});

describe("armarMensajeDistancia", () => {
  it("agradece, no pide confirmar y lleva un solo enlace", () => {
    const m = armarMensajeDistancia(grad({ tarjeta: { graduando: "Carlos Humberto Chavarría Aparicio" } }), "Rosa", LINK, "f");
    expect(m).toContain("Querida Rosa:\nAunque estés lejos, fuiste parte de este logro. Gracias por tu cariño y tu apoyo.");
    expect(m).toContain("invitación especial");
    expect(m).not.toContain("Confirm");
    expect(enlaces(m)).toEqual([LINK]);
  });

  it("en graduación dice qué se estudió y dónde, sin versículo", () => {
    const m = armarMensajeDistancia(grad({ tarjeta: { carrera: "Ingeniería en Sistemas Informáticos", institucion: "Universidad de El Salvador" } }), "Rosa", LINK, "f");
    expect(m).toContain("Querida Rosa:\nMe gradúo de Ingeniería en Sistemas Informáticos en la Universidad de El Salvador, y aunque estés lejos, fuiste parte de este logro.");
    expect(m).not.toMatch(/Filipenses|«/);
  });

  it("habla en plural a varios y como familia si firma la familia", () => {
    const m = armarMensajeDistancia(grad({ tarjeta: { familia: "Familia Chavarría" } }), "Los López", LINK, "plural");
    expect(m).toContain("Aunque estén lejos, fueron parte de este logro.");
    expect(m).toContain("Les preparamos una invitación especial para que vivan la celebración");
  });
});

describe("título del mensaje", () => {
  it("no repite al graduado si el nombre del evento ya lo menciona", () => {
    const m = armarMensajeInvitacion(grad({ nombre: "Graduación de Carlos - Ingeniería 2026", tarjeta: { graduando: "Carlos Humberto Chavarría Aparicio" } }), "Ana", LINK, "f", HOY);
    expect(m.split("\n")[0]).toBe("🎓 Graduación de Carlos - Ingeniería 2026");
  });
});
