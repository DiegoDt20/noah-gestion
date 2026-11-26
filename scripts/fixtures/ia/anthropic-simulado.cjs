// Se carga únicamente en el servidor aislado de prueba: no permite tráfico exterior.
const original=globalThis.fetch;
globalThis.fetch=async function(input,init){
 const url=new URL(typeof input==='string'?input:input.url);
 if(url.hostname==='api.anthropic.com' && url.pathname==='/v1/messages'){
  const responder=body=>Response.json({stop_reason:"end_turn",...body});
  const payload=JSON.parse(init.body);const datos=JSON.parse(payload.messages[0].content);
  const clave=datos.pregunta||datos.reporte;
  if(!payload.output_config?.format?.schema||payload.output_config.format.type!=='json_schema')throw new Error('Falta salida estructurada');
  if(clave.includes('limitedeia'))return new Response('{}',{status:429,headers:{'retry-after':'9'}});
  if(clave.includes('credencialinvalida'))return new Response('{"error":"DETALLE_PRIVADO_DEL_PROVEEDOR"}',{status:401});
  if(clave.includes('respuestacortada'))return responder({stop_reason:'max_tokens',content:[{type:'text',text:'{}'}]});
  if(clave.includes('tiempoagotado'))throw new DOMException('Plazo simulado','TimeoutError');
  if(clave.includes('falloexterno'))return new Response('{}',{status:503});
  if(clave.includes('formatoinvalido'))return responder({content:[{type:'text',text:'no-json'}]});
  if(clave.includes('jsonnulo'))return responder({content:[{type:'text',text:'null'}]});
  if(clave.includes('bloqueinvalido'))return responder({content:{type:'text',text:'{}'}});
  if(clave.includes('elementonulo'))return responder({content:[{type:'text',text:JSON.stringify(datos.fragmentos?{respuesta:'x',citas:[null]}:{diferencias:[null]})}]});
  if(clave.includes('cambiardocumento')||clave.includes('cambiarreporte')||clave.includes('sinacceso')||clave.includes('cambiarnombre')){
   const {Client}=require('pg');const {configDBDesdeEntorno}=await import('../../../lib/db-config.mjs');const c=new Client(configDBDesdeEntorno());
   try{await c.connect();
    if(clave.includes('cambiarnombre'))await c.query("UPDATE documento SET nombre='Documento renombrado.txt' WHERE id_documento=(SELECT id_documento FROM fragmento_documento WHERE id_fragmento=$1)",[datos.fragmentos[0].id_fragmento]);
    if(clave.includes('cambiardocumento'))await c.query("UPDATE fragmento_documento SET texto='La entrega será el sábado.' WHERE id_documento=$1",[datos.id_documento]);
    if(clave.includes('cambiarreporte'))await c.query("UPDATE reporte_avance SET contenido='Contenido modificado durante la consulta' WHERE id_reporte=$1",[datos.id_reporte]);
    if(clave.includes('sinacceso'))await c.query("UPDATE proyecto SET id_jefe=(SELECT id_usuario FROM usuario WHERE correo='admin@noahtech.pe') WHERE id_proyecto=(SELECT id_proyecto FROM documento WHERE id_documento=$1)",[datos.id_documento]);
   }finally{await c.end();}
  }
  let result;
  if(datos.fragmentos){const f=datos.fragmentos.find(x=>x.texto.includes('La entrega será el viernes.'));if(!f)throw new Error('Falta el fragmento esperado');result={respuesta:'La entrega será el viernes.',citas:[{id_fragmento:f.id_fragmento,cita:clave.includes('citainventada')?'Una cita inexistente':'La entrega será el viernes.'}]};}
  else result={diferencias:[{descripcion:'El reporte indica lunes pero el documento indica viernes.',cita:clave.includes('citainventada')?'Una cita inexistente':'La entrega será el viernes.'}]};
  if(clave.includes('sindiferencias'))result={diferencias:[]};
  return responder({content:[{type:'text',text:JSON.stringify(result)}]});
 }
 if(url.hostname!=='127.0.0.1'&&url.hostname!=='localhost')throw new Error('Red externa bloqueada durante pruebas de IA');
 return original(input,init);
};
