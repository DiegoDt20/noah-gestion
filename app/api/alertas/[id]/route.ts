import {NextResponse} from "next/server";
import {error,requerir} from "@/lib/acceso";
import {atenderAlerta,ErrorAlerta} from "@/lib/alertas";
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 const a=await requerir(["administrador","jefe_area"]);if("r"in a)return a.r;
 const texto=(await params).id;const id=Number(texto);if(!/^\d+$/.test(texto)||!Number.isSafeInteger(id)||id<1||id>2147483647)return error("Alerta no válida");
 const b=await req.json().catch(()=>null);if(!b||typeof b!=="object"||Array.isArray(b)||typeof b.accion_tomada!=="string"||!b.accion_tomada.trim()||b.accion_tomada.trim().length>250)return error("Describe la acción tomada (entre 1 y 250 caracteres)");
 try{await atenderAlerta(a.s,id,b.accion_tomada.trim());return NextResponse.json({ok:true},{headers:{"Cache-Control":"private, no-store"}});}catch(e){if(e instanceof ErrorAlerta)return error(e.message,e.status);console.error("No se pudo atender la alerta",e);return error("No se pudo guardar la atención. Inténtalo de nuevo.",503);}
}
