// Se carga únicamente en el servidor aislado de prueba: no permite tráfico exterior.
const original=globalThis.fetch;
globalThis.fetch=async function(input,init){
 const url=new URL(typeof input==='string'?input:input.url);
 if(url.hostname==='api.anthropic.com' && url.pathname==='/v1/messages'){
  const payload=JSON.parse(init.body);const datos=JSON.parse(payload.messages[0].content);
  const clave=datos.pregunta||datos.reporte;
  if(clave.includes('falloexterno'))return new Response('{}',{status:503});
  if(clave.includes('formatoinvalido'))return Response.json({content:[{type:'text',text:'no-json'}]});
  let result;
  if(datos.fragmentos){const f=datos.fragmentos.find(x=>x.texto.includes('La entrega será el viernes.'));if(!f)throw new Error('Falta el fragmento esperado');result={respuesta:'La entrega será el viernes.',citas:[{id_fragmento:f.id_fragmento,cita:clave.includes('citainventada')?'Una cita inexistente':'La entrega será el viernes.'}]};}
  else result={diferencias:[{descripcion:'El reporte indica lunes pero el documento indica viernes.',cita:clave.includes('citainventada')?'Una cita inexistente':'La entrega será el viernes.'}]};
  return Response.json({content:[{type:'text',text:JSON.stringify(result)}]});
 }
 if(url.hostname!=='127.0.0.1'&&url.hostname!=='localhost')throw new Error('Red externa bloqueada durante pruebas de IA');
 return original(input,init);
};
