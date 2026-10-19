/**
 * Exporta la lista de invitados a un archivo .xlsx con formato profesional.
 * Usa SheetJS (xlsx) en modo cliente.
 *
 * «Van» cuenta solo a quienes confirmaron; el cupo de los pendientes va en su
 * propia columna, y el de los que dijeron que no no se cuenta en ningún lado
 * (lib/resumenInvitados).
 */
import { estadoDe, lugaresSinConfirmar, personasQueVan, resumenInvitados, type InvitadoConteo } from "@/lib/resumenInvitados";

export type InvitadoExport = InvitadoConteo & {
  nombre: string;
  telefono?: string | null;
  mesa_nombre?: string | null;
  numero_confirmacion?: number | null;
  /** Quiénes marcó que van (supabase-asistentes.sql) */
  asistentes_nombres?: string[] | null;
};

const ESTADO_LABEL = {
  confirmado: "Confirmado",
  rechazado: "No va",
  pendiente: "Sin respuesta",
  distancia: "A distancia",
} as const;

export async function exportarInvitadosExcel(
  invitados: InvitadoExport[],
  nombreEvento: string,
) {
  const XLSX = await import("xlsx");

  // ── Encabezados ──────────────────────────────────────────────────────────
  const headers = [
    "#",
    "Nombre",
    "Teléfono",
    "Estado",
    "Van",
    "Cupo sin confirmar",
    "Quiénes van",
    "Mesa",
    "N° Confirmación",
  ];

  // ── Filas ────────────────────────────────────────────────────────────────
  const rows = invitados.map((inv, i) => {
    const estado = estadoDe(inv);
    const lugares = lugaresSinConfirmar(inv);
    return [
      i + 1,
      inv.nombre,
      inv.telefono || "—",
      ESTADO_LABEL[estado],
      // Solo quien confirmó tiene un número de personas que van; quien dijo que no, 0
      estado === "confirmado" ? personasQueVan(inv) : estado === "rechazado" ? 0 : "",
      // El cupo ofrecido que todavía no tiene respuesta
      estado === "pendiente" ? (lugares === null ? "Elige cuántos" : lugares) : "",
      estado === "confirmado" && inv.asistentes_nombres?.length ? inv.asistentes_nombres.join(", ") : "",
      inv.mesa_nombre || (estado === "confirmado" ? "Sin asignar" : ""),
      inv.numero_confirmacion && estado === "confirmado"
        ? `#${String(inv.numero_confirmacion).padStart(3, "0")}`
        : "—",
    ];
  });

  // ── Totales ──────────────────────────────────────────────────────────────
  const r = resumenInvitados(invitados);
  const invitaciones = (n: number) => `${n} invitaci${n === 1 ? "ón" : "ones"}`;
  const nota = (texto: string) => ["", texto, "", "", "", "", "", "", ""];
  const totales = [
    ["", "Confirmados", "", invitaciones(r.confirmados.invitaciones), r.confirmados.personas, "", "", "", ""],
    ["", "Sin respuesta", "", invitaciones(r.pendientes.invitaciones), "", r.pendientes.lugares, "", "", ""],
    ["", "No van", "", invitaciones(r.rechazados.invitaciones), 0, "", "", "", ""],
    ...(r.distancia.invitaciones ? [["", "A distancia", "", invitaciones(r.distancia.invitaciones), "", "", "", "", ""]] : []),
    [],
    ["", "PERSONAS QUE VAN", "", "", r.confirmados.personas, "", "", "", ""],
    ...(r.pendientes.eligen
      ? [nota(`+ ${r.pendientes.eligen} invitación${r.pendientes.eligen !== 1 ? "es" : ""} sin respuesta donde el invitado elige cuántos van (su cupo no se suma)`)]
      : []),
  ];

  const sheetData = [
    // Título del evento
    [`Evorix — Lista de Invitados`],
    [nombreEvento],
    [`Generado: ${new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`],
    [], // empty row
    headers,
    ...rows,
    [], // empty row
    ...totales,
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // ── Ancho de columnas ────────────────────────────────────────────────────
  ws["!cols"] = [
    { wch: 5 },   // #
    { wch: 30 },  // Nombre
    { wch: 18 },  // Teléfono
    { wch: 16 },  // Estado
    { wch: 8 },   // Van
    { wch: 18 },  // Cupo sin confirmar
    { wch: 36 },  // Quiénes van
    { wch: 20 },  // Mesa
    { wch: 16 },  // N° Confirmación
  ];

  // ── Combinar celdas del encabezado ───────────────────────────────────────
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Título
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }, // Nombre evento
    { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } }, // Fecha generación
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Invitados");

  // ── Descarga ─────────────────────────────────────────────────────────────
  const safeNombre = nombreEvento.replace(/[^a-z0-9áéíóúñ\s]/gi, "").trim();
  XLSX.writeFile(wb, `Evorix_${safeNombre}_Invitados.xlsx`);
}
