import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { error, fechaOk, requerir } from "@/lib/acceso";

// RF-04: registro de proyectos
export async function GET() {
  const a = await requerir();
  if ("r" in a) return a.r;
  const s = a.s;
  let filtro = "";
  const vals: unknown[] = [];
  if (s.rol === "jefe_area") { vals.push(s.id); filtro = "WHERE p.id_jefe=$1"; }
  if (s.rol === "colaborador") { vals.push(s.id); filtro = "WHERE EXISTS (SELECT 1 FROM proyecto_miembro m WHERE m.id_proyecto=p.id_proyecto AND m.id_usuario=$1)"; }
  const filas = await query(
    `SELECT p.*, ar.nombre AS area, (u.nombres||' '||u.apellidos) AS jefe,
            (SELECT count(*) FROM tarea t WHERE t.id_proyecto=p.id_proyecto)::int AS total_tareas,
            (SELECT count(*) FROM tarea t WHERE t.id_proyecto=p.id_proyecto AND t.estado='entregada')::int AS tareas_entregadas
       FROM proyecto p JOIN area ar ON ar.id_area=p.id_area JOIN usuario u ON u.id_usuario=p.id_jefe
       ${filtro} ORDER BY p.fecha_entrega`, vals);
  return NextResponse.json(filas);
}

export async function POST(req: Request) {
  const a = await requerir(["jefe_area", "administrador"]);
  if ("r" in a) return a.r;
  const s = a.s;
  const b = await req.json().catch(() => ({}));
  const { nombre, descripcion, fecha_inicio, fecha_entrega } = b;
  if (!nombre || !String(nombre).trim()) return error("Escribe el nombre del proyecto");
  if (!fechaOk(fecha_inicio) || !fechaOk(fecha_entrega)) return error("Las fechas no son válidas");
  if (fecha_entrega < fecha_inicio) return error("La fecha de entrega no puede ser anterior a la de inicio");

  let id_jefe = s.id;
  if (s.rol === "administrador") {
    id_jefe = Number(b.id_jefe);
    if (!id_jefe) return error("Elige el jefe de área responsable");
  }
  const jefe = await query<any>(
    "SELECT u.id_area, r.nombre AS rol FROM usuario u JOIN rol r ON r.id_rol=u.id_rol WHERE u.id_usuario=$1 AND u.activo",
    [id_jefe]
  );
  if (!jefe.length || jefe[0].rol !== "jefe_area") return error("El responsable debe ser un jefe de área activo");
  if (!jefe[0].id_area) return error("El jefe de área no tiene un área asignada");

  const r = await query(
    `INSERT INTO proyecto (id_area,id_jefe,nombre,descripcion,fecha_inicio,fecha_entrega)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id_proyecto`,
    [jefe[0].id_area, id_jefe, String(nombre).trim(), descripcion ? String(descripcion).trim() : null, fecha_inicio, fecha_entrega]
  );
  // el jefe queda como miembro del proyecto
  await query("INSERT INTO proyecto_miembro (id_proyecto,id_usuario,rol_en_proyecto) VALUES ($1,$2,'Jefe de proyecto')", [r[0].id_proyecto, id_jefe]);
  return NextResponse.json({ ok: true, id_proyecto: r[0].id_proyecto }, { status: 201 });
}
