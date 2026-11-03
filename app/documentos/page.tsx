import { redirect } from 'next/navigation';
import { sesionActual } from '@/lib/auth';
import { proyectosDocumentos } from '@/lib/documentos';
import Cabecera from '@/components/Cabecera';
import DocumentosProyecto from '@/components/DocumentosProyecto';
export default async function Documentos(){const s=await sesionActual();if(!s)redirect('/login');const proyectos=await proyectosDocumentos(s);return <div className="space-y-6"><Cabecera titulo="Documentos" subtitulo="La información de cada proyecto, organizada y disponible para el equipo."/><DocumentosProyecto proyectos={proyectos} gestiona={['administrador','jefe_area'].includes(s.rol)}/></div>;}
