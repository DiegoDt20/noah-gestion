import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { cargarProyecto, error, esMiembro, fechaOk, puedeGestionar, requerir } from "@/lib/acceso";

// RF-05: asignación de tareas con su responsable, rol y fecha de entrega
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requerir(["jefe_area", "administrador"]);
  if ("r" in a) return a.r;
  const p = await cargarProyecto(Number((await params).id));
  if (!p) return error("Proyecto no encontrado", 404);
  if (!puedeGestionar(a.s, p)) return error("Solo el jefe del proyecto puede asignar tareas", 403);

  const { titulo, descripcion, id_responsable, rol_asignado, fecha_entrega } = await req.json().catch(() => ({}));
  if (!titulo || !String(titulo).trim()) return error("Escribe el título de la tarea");
  if (!id_responsable) return error("Elige al responsable");
  if (!rol_asignado || !String(rol_asignado).trim()) return error("Escribe el rol asignado");
  if (!fechaOk(fecha_entrega)) return error("La fecha de entrega no es válida");
  if (fecha_entrega < p.fecha_inicio || fecha_entrega > p.fecha_entrega)
    return error(`La fecha de entrega debe estar entre el inicio y la entrega del proyecto`);
  if (!(await esMiembro(p.id_proyecto, Number(id_responsable)))) return error("El responsable debe ser miembro del proyecto");

  const r = await query(
    `INSERT INTO tarea (id_proyecto,id_responsable,titulo,descripcion,rol_asignado,fecha_entrega)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id_tarea`,
    [p.id_proyecto, Number(id_responsable), String(titulo).trim(), descripcion ? String(descripcion).trim() : null, String(rol_asignado).trim(), fecha_entrega]
  );
  return NextResponse.json({ ok: true, id_tarea: r[0].id_tarea }, { status: 201 });
}
