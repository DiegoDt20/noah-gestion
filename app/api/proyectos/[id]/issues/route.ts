import { NextResponse } from "next/server";
import { requerir, error } from "@/lib/acceso";
import { query } from "@/lib/db";
import { repositorioGithub } from "@/lib/github-repositorio";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}) {
 const a=await requerir(); if('r' in a)return a.r;
 const raw=(await params).id;if(!/^[1-9]\d*$/.test(raw)||Number(raw)>2147483647)return error('Proyecto no válido');
 const id=Number(raw);
 const proyectos=await query<{repositorio_github:string|null}>(`SELECT p.repositorio_github FROM proyecto p WHERE p.id_proyecto=$3 AND EXISTS (SELECT 1 FROM usuario u JOIN rol r ON r.id_rol=u.id_rol WHERE u.id_usuario=$1 AND u.activo AND r.nombre=$2) AND ($2 IN ('administrador','gerencia') OR ($2='jefe_area' AND p.id_jefe=$1) OR ($2='colaborador' AND EXISTS(SELECT 1 FROM proyecto_miembro m WHERE m.id_proyecto=p.id_proyecto AND m.id_usuario=$1)))`,[a.s.id,a.s.rol,id]);
 if(!proyectos.length)return error('Proyecto no disponible',404);
 let repo:string|null;try{repo=repositorioGithub(proyectos[0].repositorio_github);}catch{return error('La URL del repositorio no es válida',400);}if(!repo)return error('Este proyecto no tiene un repositorio de GitHub registrado',404);
 const [owner,nombreRaw]=new URL(repo).pathname.split('/').filter(Boolean);const nombre=nombreRaw.replace(/\.git$/i,'');
 if(!nombre || nombre==='.' || nombre==='..')return error('La URL del repositorio no es válida',400);
 const api=`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(nombre)}/issues?state=all&sort=updated&direction=desc&per_page=100`;
 // El token se usa solo para repositorios autorizados explícitamente por el administrador.
 const permitidos=(process.env.GITHUB_REPOSITORIES || '').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
 const token=permitidos.includes(`${owner}/${nombre}`.toLowerCase()) ? process.env.GITHUB_READ_TOKEN : undefined;
 const ghHeaders:Record<string,string>={'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'noah-gestion'};if(token)ghHeaders.Authorization=`Bearer ${token}`;
 let response:Response;try{response=await fetch(api,{headers:ghHeaders,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});}catch{return error('No se pudo conectar con GitHub. Inténtalo de nuevo.',503);}
 if(response.status===404)return error('Repositorio no encontrado o sin acceso. Verifica la URL y la configuración del acceso privado.',404);
 if(response.status===401||response.status===403||response.status===429)return error('GitHub rechazó la consulta o se alcanzó el límite de solicitudes. Revisa el acceso e inténtalo más tarde.',503);
 if(!response.ok)return error('GitHub no pudo proporcionar los issues. Inténtalo de nuevo.',502);
 const datos:unknown=await response.json().catch(()=>null);if(!Array.isArray(datos))return error('La respuesta de GitHub no es válida.',502);
 const issues=datos.filter(x=>x && typeof x==='object' && !('pull_request' in x) && Number.isSafeInteger(x.number) && x.number>0 && typeof x.title==='string' && (x.state==='open'||x.state==='closed')).map(x=>({numero:x.number,titulo:x.title.slice(0,500),estado:x.state,responsables:Array.isArray(x.assignees)?x.assignees.map((u:{login?:unknown})=>u?.login).filter((v:unknown)=>typeof v==='string').slice(0,10):[],actualizado:typeof x.updated_at==='string'?x.updated_at:null,url:`https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(nombre)}/issues/${x.number}`}));
 // Se vuelven a comprobar cuenta, rol, pertenencia y URL antes de entregar datos privados.
 const autorizado=await query(`SELECT 1 FROM proyecto p JOIN usuario u ON u.id_usuario=$1 AND u.activo JOIN rol r ON r.id_rol=u.id_rol AND r.nombre=$2 WHERE p.id_proyecto=$3 AND p.repositorio_github=$4 AND ($2 IN ('administrador','gerencia') OR ($2='jefe_area' AND p.id_jefe=$1) OR ($2='colaborador' AND EXISTS(SELECT 1 FROM proyecto_miembro m WHERE m.id_proyecto=p.id_proyecto AND m.id_usuario=$1)))`,[a.s.id,a.s.rol,id,proyectos[0].repositorio_github]);
 if(!autorizado.length)return error('El acceso al proyecto cambió durante la consulta',403);
 return NextResponse.json({issues,hay_mas:response.headers.get('link')?.includes('rel="next"')??false},{headers});
}
