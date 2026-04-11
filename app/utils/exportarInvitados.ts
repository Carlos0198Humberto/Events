/**
 * Exporta la lista de invitados a un archivo .xlsx con formato profesional.
 * Usa SheetJS (xlsx) en modo cliente.
 */
export type InvitadoExport = {
  nombre: string;
  telefono?: string | null;
  num_personas?: number | null;
  estado?: string | null;
  mesa_nombre?: string | null;
  numero_confirmacion?: number | null;
};

const ESTADO_LABEL: Record<string, string> = {
  confirmado: "Confirmado",
  rechazado: "Rechazado",
  pendiente: "Pendiente",
};

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
    "Personas",
    "Mesa",
    "N° Confirmación",
  ];

  // ── Filas ────────────────────────────────────────────────────────────────
  const rows = invitados.map((inv, i) => [
    i + 1,
    inv.nombre,
    inv.telefono || "—",
    ESTADO_LABEL[inv.estado || "pendiente"] ?? inv.estado ?? "Pendiente",
    inv.num_personas ?? 1,
    inv.mesa_nombre || "Sin asignar",
    inv.numero_confirmacion
      ? `#${String(inv.numero_confirmacion).padStart(3, "0")}`
      : "—",
  ]);

  // Totals row
  const confirmados = invitados.filter((i) => i.estado === "confirmado").length;
  const rechazados = invitados.filter((i) => i.estado === "rechazado").length;
  const pendientes = invitados.filter((i) => i.estado === "pendiente").length;
  const totalPersonas = invitados.reduce(
    (s, i) => s + (i.num_personas ?? 1),
    0,
  );

  const sheetData = [
    // Título del evento
    [`Eventix — Lista de Invitados`],
    [nombreEvento],
    [`Generado: ${new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`],
    [], // empty row
    headers,
    ...rows,
    [], // empty row
    ["", "Confirmados", "", confirmados, totalPersonas, "", ""],
    ["", "Rechazados", "", rechazados, "", "", ""],
    ["", "Pendientes", "", pendientes, "", "", ""],
    ["", "TOTAL", "", invitados.length, totalPersonas, "", ""],
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // ── Ancho de columnas ────────────────────────────────────────────────────
  ws["!cols"] = [
    { wch: 5 },   // #
    { wch: 30 },  // Nombre
    { wch: 18 },  // Teléfono
    { wch: 14 },  // Estado
    { wch: 10 },  // Personas
    { wch: 20 },  // Mesa
    { wch: 16 },  // N° Confirmación
  ];

  // ── Combinar celdas del encabezado ───────────────────────────────────────
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Título
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Nombre evento
    { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }, // Fecha generación
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Invitados");

  // ── Descarga ─────────────────────────────────────────────────────────────
  const safeNombre = nombreEvento.replace(/[^a-z0-9áéíóúñ\s]/gi, "").trim();
  XLSX.writeFile(wb, `Eventix_${safeNombre}_Invitados.xlsx`);
}
