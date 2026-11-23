import { NextResponse } from "next/server";
import { error, requerir } from "@/lib/acceso";
import { query } from "@/lib/db";
import { repositorioGithub } from "@/lib/github-repositorio";
export const dynamic = "force-dynamic";
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}) {
 const a=await requerir(["administrador","jefe_area"]);if("r" in a)return a.r;
 const raw=(await params).id;if(!/^[1-9]\d*$/.test(raw)||Number(raw)>2147483647)return error("Proyecto no válido");
 const b=await req.json().catch(()=>null);
 if(!b||typeof b.repositorio_github!=="string"||Object.keys(b).length!==1)return error("Indica una URL válida o deja el campo vacío");
 let repo:string|null;try{repo=repositorioGithub(b.repositorio_github);}catch(e){return error(e instanceof Error?e.message:"URL de GitHub inválida");}
 const filas=await query<{repositorio_github:string|null}>(`UPDATE proyecto p SET repositorio_github=$4 WHERE p.id_proyecto=$3 AND ($2='administrador' OR ($2='jefe_area' AND p.id_jefe=$1)) AND EXISTS(SELECT 1 FROM usuario u JOIN rol r ON r.id_rol=u.id_rol WHERE u.id_usuario=$1 AND u.activo AND r.nombre=$2) RETURNING p.repositorio_github`,[a.s.id,a.s.rol,Number(raw),repo]);
 if(!filas.length)return error("Proyecto no disponible o sin permiso para editarlo",404);
 return NextResponse.json({repositorio_github:filas[0].repositorio_github},{headers:{"Cache-Control":"private, no-store"}});
}
