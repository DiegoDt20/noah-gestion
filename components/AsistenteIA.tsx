"use client";
import { useRouter } from "next/navigation";
import EstadoIA from "./EstadoIA";
import {useState} from "react";
type Documento={id:number;nombre:string};
export default function AsistenteIA({proyecto,documentos,disponible}:{proyecto:number;documentos:Documento[];disponible:boolean}){
 const router=useRouter();
 const [pregunta,setPregunta]=useState('');const [respuesta,setRespuesta]=useState('');const [error,setError]=useState('');const [cargando,setCargando]=useState(false);
 async function consultar(e:React.FormEvent){e.preventDefault();setError('');setRespuesta('');setCargando(true);try{const r=await fetch('/api/asistente',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({proyecto,pregunta})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'No se pudo consultar');setRespuesta(j.respuesta);router.refresh();}catch(e){setError(e instanceof Error?e.message:'No se pudo consultar');}finally{setCargando(false);}}
 return <section className="panel mt-6"><div className="panel-cab"><div><h2 className="panel-tit">Consultar documentación con IA</h2><p className="chart-description">La pregunta y los fragmentos relevantes de los documentos del proyecto se enviarán a Anthropic.</p></div></div><div className="panel-cuerpo"><EstadoIA disponible={disponible}/>{!documentos.length?<p className="text-sm text-suave">Agrega un documento con texto para hacer consultas.</p>:<form className="space-y-4" aria-busy={cargando} onSubmit={consultar}><label className="block"><span className="etiqueta">Pregunta</span><textarea className="campo" disabled={!disponible||cargando} maxLength={2000} required rows={3} value={pregunta} onChange={e=>setPregunta(e.target.value)} /></label><button disabled={!disponible||cargando} className="btn">{cargando?'Consultando…':'Consultar'}</button></form>}{error&&<p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}{respuesta&&<div role="status" className="mt-4 whitespace-pre-wrap text-sm leading-6">{respuesta}</div>}</div></section>;
}
