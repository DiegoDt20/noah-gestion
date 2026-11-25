export const ESTADO: Record<string, { t: string; fondo: string; texto: string; punto: string }> = {
  pendiente: { t: "Pendiente", fondo: "bg-violet-50", texto: "text-violet-800", punto: "bg-[#6250d6]" },
  en_curso: { t: "En curso", fondo: "bg-amber-50", texto: "text-amber-800", punto: "bg-[#eb8a00]" },
  entregada: { t: "Entregada", fondo: "bg-teal-50", texto: "text-teal-800", punto: "bg-[#0f9f85]" },
};

export function ChipEstado({ estado }: { estado: string }) {
  const e = ESTADO[estado];
  return <span className={`chip ${e.fondo} ${e.texto}`}><span className={`punto ${e.punto}`} />{e.t}</span>;
}

export function Progreso({ hechas, total }: { hechas: number; total: number }) {
  const pct = total ? Math.round((hechas / total) * 100) : 0;
  return (
    <div className="min-w-28">
      <div className="mb-1 flex justify-between text-xs text-suave"><span>{hechas}/{total} tareas</span><span>{pct}%</span></div>
      <div className="barra"><span style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
