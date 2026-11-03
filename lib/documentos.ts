import { createHash } from "node:crypto";
import { pool, query } from "./db";
import type { Sesion } from "./auth";
export class ErrorDocumento extends Error { constructor(message:string, public status=400){super(message);} }
export const MAX_ARCHIVO=1024*1024;
export function idDocumento(v:string){if(!/^[1-9]\d*$/.test(v)||Number(v)>2147483647)throw new ErrorDocumento("Identificador inválido.");return Number(v);}
// Se comprueba el rol actual en la base, además del token de sesión.
export const alcanceDocumento=`EXISTS(SELECT 1 FROM usuario u JOIN rol r ON r.id_rol=u.id_rol WHERE u.id_usuario=$1 AND u.activo AND r.nombre=$2) AND ($2 IN ('administrador','gerencia') OR ($2='jefe_area' AND p.id_jefe=$1) OR ($2='colaborador' AND EXISTS(SELECT 1 FROM proyecto_miembro m WHERE m.id_proyecto=p.id_proyecto AND m.id_usuario=$1)))`;
export async function proyectosDocumentos(s:Sesion){return query<{id_proyecto:number;nombre:string}>(`SELECT p.id_proyecto,p.nombre FROM proyecto p WHERE ${alcanceDocumento} ORDER BY p.nombre,p.id_proyecto`,[s.id,s.rol]);}
export async function listarDocumentos(s:Sesion,proyecto:number){
 const ps=await proyectosDocumentos(s);if(!ps.some(p=>p.id_proyecto===proyecto))throw new ErrorDocumento("Proyecto no disponible.",404);
 return query<{id_documento:number;nombre:string;autor:string;fecha:string;caracteres:number|null;fragmentos:number}>(`SELECT d.id_documento,d.nombre,u.nombres||' '||u.apellidos autor,to_char(d.fecha_subida,'DD/MM/YYYY HH24:MI') fecha,d.caracteres,(SELECT count(*)::int FROM fragmento_documento f WHERE f.id_documento=d.id_documento) fragmentos FROM documento d JOIN proyecto p USING(id_proyecto) JOIN usuario u ON u.id_usuario=d.subido_por WHERE d.id_proyecto=$3 AND ${alcanceDocumento} ORDER BY d.fecha_subida DESC,d.id_documento DESC LIMIT 100`,[s.id,s.rol,proyecto]);
}
export async function guardarDocumento(s:Sesion,proyecto:number,archivo:File){
 if(!['administrador','jefe_area'].includes(s.rol))throw new ErrorDocumento("Solo el jefe o administrador puede incorporar documentos.",403);
 if(!archivo.size||archivo.size>MAX_ARCHIVO)throw new ErrorDocumento("Selecciona un archivo de texto de hasta 1 MB.",413);
 const nombre=archivo.name.normalize('NFC');
 if(nombre.length>150||/[\/\\\x00-\x1f\x7f]/.test(nombre)||! /\.(txt|md)$/i.test(nombre))throw new ErrorDocumento("Usa un nombre de hasta 150 caracteres y extensión .txt o .md.");
 const original=Buffer.from(await archivo.arrayBuffer());let texto:string;
 try{texto=new TextDecoder('utf-8',{fatal:true}).decode(original);}catch{throw new ErrorDocumento("El archivo debe estar codificado en UTF-8.");}
 if(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(texto))throw new ErrorDocumento("El archivo contiene datos binarios, no texto válido.");
 texto=texto.replace(/\r\n?/g,'\n').trim();if(!texto)throw new ErrorDocumento("El documento no contiene texto.");
 const puntos=Array.from(texto);const fragmentos:string[]=[];for(let i=0;i<puntos.length;i+=2000)fragmentos.push(puntos.slice(i,i+2000).join(''));
 const c=await pool.connect();try{await c.query('BEGIN');
 const permiso=await c.query(`SELECT p.id_proyecto FROM proyecto p WHERE p.id_proyecto=$3 AND ${alcanceDocumento} FOR SHARE OF p`,[s.id,s.rol,proyecto]);if(!permiso.rowCount)throw new ErrorDocumento("Proyecto no disponible.",404);
 const d=await c.query(`INSERT INTO documento(id_proyecto,subido_por,nombre,ruta_archivo,contenido_original,sha256,tipo_archivo,caracteres,fecha_subida) VALUES($1,$2,$3,'almacenado_en_bd',$4,$5,$6,$7,CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima') ON CONFLICT (id_proyecto,sha256) WHERE sha256 IS NOT NULL DO NOTHING RETURNING id_documento`,[proyecto,s.id,nombre,original,createHash('sha256').update(original).digest('hex'),nombre.toLowerCase().endsWith('.md')?'text/markdown':'text/plain',puntos.length]);
 if(!d.rowCount)throw new ErrorDocumento("Este archivo ya está registrado en el proyecto.",409);
 const id=d.rows[0].id_documento;
 await c.query('INSERT INTO fragmento_documento(id_documento,orden,texto) SELECT $1,ordinality::int,valor FROM unnest($2::text[]) WITH ORDINALITY AS x(valor,ordinality)',[id,fragmentos]);await c.query('COMMIT');return {id_documento:id,fragmentos:fragmentos.length,caracteres:puntos.length};
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}
export async function leerDocumento(s:Sesion,id:number){
 const d=await query<{id_documento:number;nombre:string;contenido_original:Buffer|null;tipo_archivo:string|null}>(`SELECT d.id_documento,d.nombre,d.contenido_original,d.tipo_archivo FROM documento d JOIN proyecto p USING(id_proyecto) WHERE d.id_documento=$3 AND ${alcanceDocumento}`,[s.id,s.rol,id]);if(!d.length)throw new ErrorDocumento("Documento no disponible.",404);return d[0];
}
