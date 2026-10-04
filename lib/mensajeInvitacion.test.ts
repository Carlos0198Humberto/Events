import { describe, expect, it } from "vitest";
import {
  armarMensajeDia,
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
  it("lleva un solo enlace (WhatsApp arma la vista previa con el primero)", () => {
    const m = armarMensajeInvitacion(grad({ tarjeta: { direccion: "Calle principal", referencia: "Frente a la cancha" } }), "María José", LINK, "f", HOY, { personas: 2 });
    expect(enlaces(m)).toEqual([LINK]);
  });

  it("no lleva estrellitas alrededor del nombre", () => {
    const m = armarMensajeInvitacion(grad(), "María José", LINK, "f", HOY);
    expect(m).not.toContain("✨");
    expect(m.split("\n")[1]).toBe("Chavarría Aparicio");
  });

  it("dice para cuántas personas es la invitación", () => {
    expect(armarMensajeInvitacion(grad(), "Ana", LINK, "f", HOY, { personas: 2 })).toContain("Te reservamos 2 lugares.");
    expect(armarMensajeInvitacion(grad(), "Los López", LINK, "plural", HOY, { personas: 3 })).toContain("Les reservamos 3 lugares.");
    expect(armarMensajeInvitacion(grad(), "Ana", LINK, "f", HOY, { personas: null })).toContain("Esta es tu invitación personal.");
  });

  it("menciona el plazo solo si es antes del evento", () => {
    expect(armarMensajeInvitacion(grad(), "Ana", LINK, "f", HOY)).toContain("antes del 20 de octubre");
    const despues = armarMensajeInvitacion(grad({ fecha_limite_confirmacion: "2026-11-03" }), "Ana", LINK, "f", HOY);
    expect(despues).not.toContain("antes del");
  });

  it("incluye carrera, dirección y referencia cuando están cargadas", () => {
    const m = armarMensajeInvitacion(grad({
      tarjeta: { carrera: "Licenciatura en Ciencias de la Educación", institucion: "Universidad de El Salvador", direccion: "Calle principal", referencia: "Frente a la cancha Bilbao" },
    }), "Ana", LINK, "f", HOY);
    expect(m).toContain("Licenciatura en Ciencias de la Educación · Universidad de El Salvador");
    expect(m).toContain("IEAPES, Calle principal");
    expect(m).toContain("Referencia: Frente a la cancha Bilbao");
  });

  it("firma la familia cuando está cargada", () => {
    const m = armarMensajeInvitacion(grad({ tarjeta: { familia: "Familia Chavarría Aparicio" } }), "Ana", LINK, "f", HOY);
    expect(m.endsWith("Con cariño,\nFamilia Chavarría Aparicio")).toBe(true);
    expect(m).toContain("te invitamos a celebrar la graduación de Chavarría Aparicio");
  });
});

describe("armarMensajeDia", () => {
  it("el mismo día dice «¡Hoy es el día!» y no repite la fecha", () => {
    const m = armarMensajeDia(grad(), "Ana", LINK, "f", new Date(2026, 9, 31));
    expect(m).toContain("¡Hoy es el día!");
    expect(m).not.toContain("octubre de 2026");
    expect(m).toContain("8:40 p. m.");
    expect(enlaces(m)).toEqual([LINK]);
  });

  it("la víspera dice «¡Mañana es el día!» y respeta el plural", () => {
    const m = armarMensajeDia(grad(), "Los López", LINK, "plural", new Date(2026, 9, 30));
    expect(m).toContain("¡Mañana es el día! Los esperamos");
  });
});

describe("armarMensajeRecordatorio", () => {
  it("cuenta los días que faltan y lleva el enlace", () => {
    const m = armarMensajeRecordatorio(grad(), "Ana", LINK, "f", new Date(2026, 9, 28));
    expect(m).toContain("faltan 3 días");
    expect(enlaces(m)).toEqual([LINK]);
  });
});
