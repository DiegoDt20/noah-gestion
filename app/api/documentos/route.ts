import { NextRequest, NextResponse } from "next/server";
import { requerir } from "@/lib/acceso";
import { ErrorDocumento, guardarDocumento, idDocumento, listarDocumentos, MAX_ARCHIVO } from "@/lib/documentos";
export const runtime='nodejs';
export const maxDuration=30;
const responder=(v:unknown,status=200)=>NextResponse.json(v,{status,headers:{'Cache-Control':'no-store'}});
function fallo(e:unknown){if(e instanceof ErrorDocumento)return responder({error:e.message},e.status);console.error('Documentos:',e);return responder({error:'No se pudo procesar el documento. Inténtalo de nuevo.'},503);}
export async function GET(req:NextRequest){const a=await requerir();if('r'in a)return a.r;try{const p=req.nextUrl.searchParams;if([...p.keys()].some(k=>k!=='proyecto')||p.getAll('proyecto').length!==1)throw new ErrorDocumento('Selecciona un proyecto válido.');return responder(await listarDocumentos(a.s,idDocumento(p.get('proyecto')||'')));}catch(e){return fallo(e);}}
export async function POST(req:NextRequest){const a=await requerir(['administrador','jefe_area']);if('r'in a)return a.r;try{
 if(Number(req.headers.get('content-length'))>MAX_ARCHIVO+65536)throw new ErrorDocumento('El archivo supera el límite de 1 MB.',413);
 // Limita también solicitudes sin Content-Length antes de analizar multipart.
 const lector=req.body?.getReader();if(!lector)throw new ErrorDocumento('Falta el archivo.');
 const partes:Uint8Array[]=[];let bytes=0;
 try{while(true){const paso=await lector.read();if(paso.done)break;bytes+=paso.value.byteLength;if(bytes>MAX_ARCHIVO+65536){await lector.cancel();throw new ErrorDocumento('El archivo supera el límite de 1 MB.',413);}partes.push(paso.value);}}finally{lector.releaseLock();}
 const cuerpo=new Uint8Array(bytes);let offset=0;for(const parte of partes){cuerpo.set(parte,offset);offset+=parte.length;}
 let form:FormData;try{form=await new Response(cuerpo,{headers:{'Content-Type':req.headers.get('content-type')||''}}).formData();}catch{throw new ErrorDocumento('Envía un archivo y un proyecto mediante el formulario.');}
 if([...form.keys()].some(k=>!['proyecto','archivo'].includes(k))||form.getAll('proyecto').length!==1||form.getAll('archivo').length!==1)throw new ErrorDocumento('Formulario inválido.');
 const archivo=form.get('archivo');if(!(archivo instanceof File))throw new ErrorDocumento('Selecciona un archivo.');return responder(await guardarDocumento(a.s,idDocumento(String(form.get('proyecto'))),archivo),201);
 }catch(e){return fallo(e);}}
