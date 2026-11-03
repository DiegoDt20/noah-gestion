import {NextResponse} from "next/server";
import {error,requerir} from "@/lib/acceso";
import {consultarAlertas,filtrosAlertas} from "@/lib/alertas";
export const dynamic="force-dynamic";
export async function GET(req:Request){const a=await requerir();if("r"in a)return a.r;let f;try{f=filtrosAlertas(new URL(req.url).searchParams);}catch(e){return error(e instanceof Error?e.message:"Filtros inválidos");}try{return NextResponse.json(await consultarAlertas(a.s,f),{headers:{"Cache-Control":"private, no-store"}});}catch(e){console.error("No se pudieron consultar las alertas",e);return error("No se pudieron actualizar las alertas. Inténtalo de nuevo.",503);}}
