// Diagnóstico local: no llama a Anthropic ni muestra valores de claves.
import pg from 'pg';
import { configDBDesdeEntorno } from '../lib/db-config.mjs';
import { estadoClaude } from '../lib/claude.mjs';
const estado=estadoClaude();
console.log('Modelo de IA: '+estado.modelo);
console.log('Clave del proveedor: '+(estado.configurada?'configurada (valor oculto)':'pendiente de configurar'));
const c=new pg.Client({...configDBDesdeEntorno(),connectionTimeoutMillis:5000});
try {
 await c.connect();
 const tablas=['proyecto','usuario','rol','tarea','reporte_avance','documento','fragmento_documento','observacion_ia','consulta_asistente'];
 for(const tabla of tablas){
  const r=await c.query('SELECT to_regclass($1) tabla',['public.'+tabla]);
  if(!r.rows[0].tabla)throw new Error('Falta la tabla '+tabla);
  // Los nombres provienen exclusivamente de la lista constante anterior.
  await c.query('SELECT 1 FROM public.'+tabla+' LIMIT 0');
 }
 for(const tabla of ['observacion_ia','consulta_asistente']){
  const r=await c.query("SELECT has_table_privilege(current_user,$1,'INSERT') permitido",['public.'+tabla]);
  if(!r.rows[0].permitido)throw new Error('Falta permiso para guardar resultados');
 }
 console.log('Conexión, tablas, lectura y permisos para guardar resultados: correctos.');
 console.log(estado.configurada?'Configuración preparada. Falta validar el proveedor real cuando se autorice.':'Preparado para añadir ANTHROPIC_API_KEY y reiniciar el servidor.');
 if(process.argv.includes('--require-key')&&!estado.configurada)process.exitCode=1;
} catch(e) {console.error('No se pudo verificar la base de IA. Revisa conexión, TLS, tablas y permisos.');process.exitCode=1;}
finally{await c.end();}
console.log('Diagnóstico terminado sin llamadas a Anthropic.');
