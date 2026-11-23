import { NextResponse } from "next/server";
import { error, requerir } from "@/lib/acceso";
import { consultarReportes, filtrosReportes } from "@/lib/consulta-reportes";
import { MOMENTO_TEXTO } from "@/lib/reportes";

export const dynamic = "force-dynamic";
const celda = (valor: unknown) => {
  let texto = String(valor ?? "");
  // Evita que programas de hojas de cálculo ejecuten contenido como fórmula.
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(texto)) texto = "'" + texto;
  return `"${texto.replace(/"/g, '""')}"`;
};
export async function GET(req: Request) {
  const a = await requerir(["gerencia", "jefe_area"]); if ("r" in a) return a.r;
  let filtros;
  try { filtros = filtrosReportes(new URL(req.url).searchParams); }
  catch (e) { return error(e instanceof Error ? e.message : "Filtros no válidos"); }
  const primero = await consultarReportes(a.s, { ...filtros, pagina: 1 });
  if (primero.total > 10000) return error("La consulta supera 10 000 reportes. Aplica filtros más específicos.", 413);
  const filas = [...primero.reportes];
  for (let pagina = 2; pagina <= primero.paginas; pagina++) {
    const resultado = await consultarReportes(a.s, { ...filtros, pagina });
    if (resultado.total !== primero.total) return error("Los reportes cambiaron durante la exportación. Inténtalo de nuevo.", 409);
    filas.push(...resultado.reportes);
  }
  if (filas.length !== primero.total || new Set(filas.map(r => r.id_reporte)).size !== filas.length) return error("Los reportes cambiaron durante la exportación. Inténtalo de nuevo.", 409);
  const lineas = [["Fecha", "Hora", "Proyecto", "Tarea", "Autor", "Tipo", "Avance (%)", "Detalle"], ...filas.map(r => [r.fecha_reporte, r.hora, r.proyecto, r.titulo, r.autor, MOMENTO_TEXTO[r.momento], r.porcentaje_avance, r.contenido])];
  const csv = "\ufeff" + lineas.map(fila => fila.map(celda).join(",")).join("\r\n") + "\r\n";
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="reportes-noah.csv"', "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
