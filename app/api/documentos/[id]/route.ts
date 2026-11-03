import { NextRequest, NextResponse } from "next/server";
import { requerir } from "@/lib/acceso";
import { ErrorDocumento, idDocumento, leerDocumento } from "@/lib/documentos";
import { query } from "@/lib/db";
export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const a=await requerir();if('r'in a)return a.r;try{
 const q=req.nextUrl.searchParams;if([...q.keys()].some(k=>k!=='descargar')||q.getAll('descargar').length>1||(q.has('descargar')&&q.get('descargar')!=='1'))throw new ErrorDocumento('Consulta inválida.');
 const d=await leerDocumento(a.s,idDocumento((await params).id));
 if(q.has('descargar')){if(!d.contenido_original)throw new ErrorDocumento('El original de este registro histórico no está disponible.',404);return new NextResponse(new Uint8Array(d.contenido_original),{headers:{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename="documento.txt"; filename*=UTF-8''${encodeURIComponent(d.nombre).replace(/['()*]/g,c=>'%'+c.charCodeAt(0).toString(16))}`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
 const fragmentos=await query('SELECT orden,texto FROM fragmento_documento WHERE id_documento=$1 ORDER BY orden',[d.id_documento]);return NextResponse.json({id_documento:d.id_documento,nombre:d.nombre,original_disponible:!!d.contenido_original,fragmentos},{headers:{'Cache-Control':'no-store'}});
 }catch(e){if(e instanceof ErrorDocumento)return NextResponse.json({error:e.message},{status:e.status,headers:{'Cache-Control':'no-store'}});console.error(e);return NextResponse.json({error:'No se pudo abrir el documento.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
