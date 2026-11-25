import { redirect } from "next/navigation";
import { sesionActual } from "@/lib/auth";
import { datosSeguimiento } from "@/lib/seguimiento";
import { actividadReportes } from "@/lib/actividad";
import PanelSeguimiento from "@/components/PanelSeguimiento";
export const dynamic = "force-dynamic";
export default async function Inicio() {
  const s = await sesionActual(); if (!s) redirect("/login");
  const [datos, actividad] = await Promise.all([datosSeguimiento(s), actividadReportes(s)]);
  return <PanelSeguimiento datos={datos} actividad={actividad} s={{ nombre: s.nombre, rol: s.rol }} />;
}