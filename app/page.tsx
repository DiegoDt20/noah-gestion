import { redirect } from "next/navigation";
import { sesionActual } from "@/lib/auth";
import { datosSeguimiento } from "@/lib/seguimiento";
import PanelSeguimiento from "@/components/PanelSeguimiento";
export const dynamic = "force-dynamic";
export default async function Inicio() {
  const s=await sesionActual(); if(!s) redirect("/login");
  return <PanelSeguimiento datos={await datosSeguimiento(s)} s={{nombre:s.nombre,rol:s.rol}} />;
}
