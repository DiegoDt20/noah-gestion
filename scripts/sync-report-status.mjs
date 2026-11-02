import pg from 'pg';
const c=new pg.Client({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='false'?false:{rejectUnauthorized:false}});
try {
 await c.connect();await c.query('BEGIN');
 await c.query('LOCK TABLE tarea IN SHARE ROW EXCLUSIVE MODE');
 const filas=(await c.query(`SELECT t.id_tarea,t.estado anterior,r.id_usuario,
   CASE WHEN r.porcentaje_avance=0 THEN 'pendiente' WHEN r.porcentaje_avance=100 THEN 'entregada' ELSE 'en_curso' END nuevo
 FROM tarea t JOIN LATERAL (
   SELECT id_usuario,porcentaje_avance FROM reporte_avance
   WHERE id_tarea=t.id_tarea AND id_usuario=t.id_responsable ORDER BY fecha_hora DESC,id_reporte DESC LIMIT 1
 ) r ON true`)).rows;
 let n=0;
 for(const t of filas) if(t.anterior!==t.nuevo){
  await c.query("UPDATE tarea SET estado=$1,actualizado_en=(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima') WHERE id_tarea=$2",[t.nuevo,t.id_tarea]);
  await c.query("INSERT INTO historial_estado(id_tarea,id_usuario,estado_anterior,estado_nuevo,fecha_hora) VALUES($1,$2,$3,$4,(CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima'))",[t.id_tarea,t.id_usuario,t.anterior,t.nuevo]);n++;
 }
 await c.query('COMMIT');console.log(`Estados sincronizados con el último reporte: ${n} tareas.`);
} catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}finally{await c.end();}
