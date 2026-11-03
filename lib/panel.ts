export type TareaPanel = { id_tarea: number; titulo: string; id_proyecto: number; proyecto: string; estado: string; fecha_entrega: string; dias: number; avance: number | null };
export const PLAZOS = [
  { id: "vencidas", nombre: "Vencidas", corto: "Vencidas", color: "#b04a45" },
  { id: "hoy", nombre: "Vencen hoy", corto: "Hoy", color: "#d99115" },
  { id: "semana", nombre: "En los próximos 7 días", corto: "1–7 días", color: "#0f8b8d" },
  { id: "quincena", nombre: "Entre 8 y 14 días", corto: "8–14 días", color: "#14406b" },
  { id: "despues", nombre: "En 15 días o más", corto: "15+ días", color: "#8095ab" },
] as const;
export function coincidePlazo(t: TareaPanel, plazo: string) {
  if (plazo === "todas") return true;
  if (t.estado === "entregada") return false;
  switch (plazo) {
    case "vencidas": return t.dias < 0;
    case "hoy": return t.dias === 0;
    case "semana": return t.dias >= 1 && t.dias <= 7;
    case "quincena": return t.dias >= 8 && t.dias <= 14;
    case "despues": return t.dias >= 15;
    default: return false;
  }
}
export function tareasCSV(tareas: TareaPanel[]) {
  const estados: Record<string, string> = { pendiente: "Pendiente", en_curso: "En curso", entregada: "Entregada" };
  const celda = (v: string | number | null) => {
    let valor = v === null ? "" : String(v);
    // Impide que una celda de texto se interprete como fórmula al abrirla en Excel.
    if (typeof v === "string" && /^[\s]*[=+@\-]/.test(valor)) valor = "'" + valor;
    return '"' + valor.replace(/"/g, '""') + '"';
  };
  const filas = [
    ["ID", "Tarea", "Proyecto", "Estado", "Fecha de entrega", "Avance reportado (%)"],
    ...tareas.map(t => [t.id_tarea, t.titulo, t.proyecto, estados[t.estado] ?? t.estado, t.fecha_entrega, t.avance]),
  ];
  return "\uFEFF" + filas.map(f => f.map(celda).join(";")).join("\r\n");
}
