import { redirect } from "next/navigation";
import { sesionActual } from "@/lib/auth";
import Cabecera from "@/components/Cabecera";
import RecordatoriosPanel from "@/components/RecordatoriosPanel";
export const dynamic = "force-dynamic";
export default async function Recordatorios() {
  const s = await sesionActual(); if (!s) redirect("/login");
  return <><Cabecera titulo="Recordatorios" subtitulo="Mantén al día los reportes de inicio, cierre y avance de cada tres días."/><RecordatoriosPanel colaborador={s.rol==="colaborador"}/></>;
}
