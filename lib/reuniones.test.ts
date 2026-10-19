import { describe, expect, it } from "vitest";
import { datosTarjetaReunion, eventoDeReunion, limpiarReunion, nuevoTokenReunion, resumenReunion } from "@/lib/reuniones";
import { armarMensajeReunion } from "@/lib/mensajeInvitacion";
import type { EventoTarjeta } from "@/lib/tarjetaInvitacion";

const carlos = (extra: Partial<EventoTarjeta> = {}): EventoTarjeta => ({
  nombre: "Graduación de Carlos - Ingeniería 2026",
  tipo: "graduacion",
  anfitriones: "Carlos Humberto Chavarría Aparicio",
  fecha: "2026-11-21",
  hora: "15:00:00",
  lugar: "Universidad de El Salvador",
  tarjeta: { graduando: "Carlos Humberto Chavarría Aparicio", carrera: "Ingeniería en Sistemas Informáticos", direccion: "Ciudad Universitaria", etapa: "reserva" },
  ...extra,
});

const reunion = { nombre: "Reunión familiar", fecha: "2026-11-21", hora: "19:30", lugar: "Casa de la familia Chavarría", direccion: "Colonia Escalón, San Salvador", nota: "Una cena sencilla para celebrar juntos" };

describe("reuniones del día", () => {
  it("valida lo que se guarda: nombre, día y hora son obligatorios", () => {
    expect(limpiarReunion({ nombre: "  ", fecha: "2026-11-21", hora: "19:30" })).toMatchObject({ ok: false });
    expect(limpiarReunion({ nombre: "Cena", hora: "19:30" })).toMatchObject({ ok: false });
    expect(limpiarReunion({ nombre: "Cena", fecha: "2026-11-21" })).toMatchObject({ ok: false });
    const r = limpiarReunion({ nombre: "  Reunión   familiar ", fecha: "2026-11-21", hora: "19:30:00", lugar: "", nota: "x".repeat(500) });
    expect(r.ok && r.datos).toMatchObject({ nombre: "Reunión familiar", hora: "19:30", lugar: null });
    expect(r.ok && r.datos.nota?.length).toBe(300);
  });

  it("el evento visto como la reunión: su día, hora, lugar y dirección; sin etapa", () => {
    const ev = eventoDeReunion(carlos(), reunion);
    expect([ev.fecha, ev.hora, ev.lugar]).toEqual(["2026-11-21", "19:30", "Casa de la familia Chavarría"]);
    expect(ev.tarjeta).toMatchObject({ direccion: "Colonia Escalón, San Salvador", etapa: null });
  });

  it("la tarjeta: gala, el nombre de la reunión en caligrafía y los datos de la reunión", () => {
    const d = datosTarjetaReunion(carlos(), reunion, "Rosa Pérez, Juan Ramos", "plural");
    expect([d.diseno, d.tituloScript, d.honor]).toEqual(["gala", "Reunión familiar", "CON MOTIVO DE LA GRADUACIÓN DE"]);
    expect(d.protagonista).toBe("Carlos Humberto Chavarría Aparicio");
    expect(d.lugar).toBe("Casa de la familia Chavarría");
    expect(d.direccion).toBe("Colonia Escalón, San Salvador");
    expect(d.diaHora).toContain("7:30");
    expect([d.reserva, d.gracias, d.especial, d.foto]).toEqual([false, false, false, null]);
    expect(d.invitado).toBe("Rosa Pérez y Juan Ramos");
    expect(d.cta).toBe("Confirmen si van en el enlace del mensaje");
    expect(d.dedicatoria).toBe("Una cena sencilla para celebrar juntos");
    // Una nota larga no entra en los tres renglones de la tarjeta (sí en la página)
    expect(datosTarjetaReunion(carlos(), { ...reunion, nota: "x".repeat(200) }, "Rosa", "f").dedicatoria).toBeNull();
  });

  it("cuenta a los que van aparte del cupo de los que no respondieron", () => {
    const r = resumenReunion([
      { estado: "confirmado", num_personas: 4, personas_confirmadas: 3 },
      { estado: "confirmado", num_personas: 1, personas_confirmadas: 1 },
      { estado: "rechazado", num_personas: 5, personas_confirmadas: 0 },
      { estado: "pendiente", num_personas: 2, personas_confirmadas: null },
    ]);
    expect(r).toEqual({ invitaciones: 4, confirmados: 2, van: 4, noVan: 1, sinRespuesta: 1, cupoSinRespuesta: 2 });
  });

  it("cada enlace es distinto y solo lleva letras y números", () => {
    const a = nuevoTokenReunion(), b = nuevoTokenReunion();
    expect(a).toMatch(/^[A-Za-z0-9]{16}$/);
    expect(a).not.toBe(b);
  });

  it("el mensaje de WhatsApp: la reunión, su día, hora y lugar, y el enlace para confirmar", () => {
    const LINK = "https://evorix.app/reunion/abc123";
    const m = armarMensajeReunion(carlos(), reunion, "Rosa", LINK, "f", new Date(2026, 9, 1), { personas: 2 });
    expect(m).toContain("Querida Rosa:\nCon mucha alegría te invito a celebrar mi graduación en un momento especial:");
    expect(m).toContain("✨ Reunión familiar");
    expect(m).toContain("Casa de la familia Chavarría, Colonia Escalón, San Salvador");
    expect(m).not.toContain("Universidad de El Salvador, Ciudad");
    expect(m).toContain("2 lugares reservados");
    expect(m).toContain("Una cena sencilla para celebrar juntos");
    expect(m).toContain(`✅ Confirmá si vas aquí:\n${LINK}`);
    const varios = armarMensajeReunion(carlos({ tarjeta: { graduando: "Carlos", familia: "Familia Chavarría" } }), reunion, "Los López", LINK, "plural");
    expect(varios).toContain("los invitamos a celebrar la graduación de Carlos");
    expect(varios).toContain("✅ Confirmen si van aquí:");
  });
});
