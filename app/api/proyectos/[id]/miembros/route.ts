import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { cargarProyecto, error, puedeGestionar, requerir } from "@/lib/acceso";

// RF-05: asignación de roles dentro del proyecto
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requerir(["jefe_area", "administrador"]);
  if ("r" in a) return a.r;
  const p = await cargarProyecto(Number((await params).id));
  if (!p) return error("Proyecto no encontrado", 404);
  if (!puedeGestionar(a.s, p)) return error("Solo el jefe del proyecto puede asignar miembros", 403);

  const { id_usuario, rol_en_proyecto } = await req.json().catch(() => ({}));
  if (!id_usuario || !rol_en_proyecto || !String(rol_en_proyecto).trim()) return error("Elige al usuario y escribe su rol en el proyecto");
  const u = await query<any>(
    "SELECT r.nombre AS rol FROM usuario u JOIN rol r ON r.id_rol=u.id_rol WHERE u.id_usuario=$1 AND u.activo",
    [Number(id_usuario)]
  );
  if (!u.length) return error("El usuario no existe o está inactivo", 404);
  if (u[0].rol !== "colaborador") return error("Solo se pueden asignar colaboradores");
  await query(
    `INSERT INTO proyecto_miembro (id_proyecto,id_usuario,rol_en_proyecto) VALUES ($1,$2,$3)
     ON CONFLICT (id_proyecto,id_usuario) DO UPDATE SET rol_en_proyecto=EXCLUDED.rol_en_proyecto`,
    [p.id_proyecto, Number(id_usuario), String(rol_en_proyecto).trim()]
  );
  return NextResponse.json({ ok: true }, { status: 201 });
}
