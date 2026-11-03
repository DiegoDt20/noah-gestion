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

export type ProyectoPanel = { id_proyecto: number; nombre: string; fecha_entrega: string; total: number; entregadas: number; en_curso: number };
export type TareaSeguimiento = TareaPanel & { id_responsable: number; responsable: string; fecha_ultimo_reporte: string | null };
export function resumenPanel(proyectos: ProyectoPanel[], tareas: TareaPanel[]) {
  const entregadas = tareas.filter(t => t.estado === "entregada").length;
  return {
    proyectos: proyectos.length,
    proyectos_completos: proyectos.filter(p => p.total > 0 && p.total === p.entregadas).length,
    tareas: tareas.length,
    pendientes: tareas.filter(t => t.estado === "pendiente").length,
    en_curso: tareas.filter(t => t.estado === "en_curso").length,
    entregadas,
    porcentaje_entregado: tareas.length ? Math.round(entregadas / tareas.length * 100) : 0,
    vencidas: tareas.filter(t => t.estado !== "entregada" && t.dias < 0).length,
    vencen_hoy: tareas.filter(t => t.estado !== "entregada" && t.dias === 0).length,
    proximos_7_dias: tareas.filter(t => t.estado !== "entregada" && t.dias >= 1 && t.dias <= 7).length,
    sin_reporte: tareas.filter(t => t.avance === null).length,
  };
}
export function responsablesPanel(tareas: TareaSeguimiento[]) {
  const grupos = new Map<number, { id: number; nombre: string; total: number; entregadas: number; vencidas: number; sin_reporte: number }>();
  for (const t of tareas) {
    const r = grupos.get(t.id_responsable) ?? { id: t.id_responsable, nombre: t.responsable, total: 0, entregadas: 0, vencidas: 0, sin_reporte: 0 };
    r.total++; if (t.estado === "entregada") r.entregadas++; else if (t.dias < 0) r.vencidas++;
    if (t.avance === null) r.sin_reporte++;
    grupos.set(t.id_responsable, r);
  }
  return [...grupos.values()].sort((a,b) => b.vencidas-a.vencidas || b.total-a.total || a.nombre.localeCompare(b.nombre,"es"));
}
