import assert from 'node:assert/strict';
import {consultarClaude,estadoClaude,MODELO_CLAUDE,ErrorClaude,esquemaAsistente} from '../lib/claude.mjs';
const original=globalThis.fetch;const antes={clave:process.env.ANTHROPIC_API_KEY,modelo:process.env.ANTHROPIC_MODEL};let checks=0,llamadas=0;
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const consulta=()=>consultarClaude({sistema:'Prueba ficticia',datos:{pregunta:'entrega'},esquema:esquemaAsistente});
async function falla(status){try{await consulta();assert.fail('Se esperaba un error');}catch(e){assert.ok(e instanceof ErrorClaude);eq(e.status,status);return e;}}
try {
 process.env.ANTHROPIC_API_KEY=' ';delete process.env.ANTHROPIC_MODEL;
 globalThis.fetch=async()=>{llamadas++;throw new Error('No debe llamar');};await falla(503);eq(llamadas,0,'Sin clave no sale tráfico');eq(estadoClaude(),{configurada:false,modelo:MODELO_CLAUDE});
 process.env.ANTHROPIC_API_KEY=' clave-ficticia ';process.env.ANTHROPIC_MODEL=' modelo-ficticio ';
 globalThis.fetch=async(url,init)=>{
  llamadas++;eq(url,'https://api.anthropic.com/v1/messages');eq(init.headers['x-api-key'],'clave-ficticia');const b=JSON.parse(init.body);eq(b.model,'modelo-ficticio');eq(b.max_tokens,1200);eq(b.output_config.format.type,'json_schema');eq(b.output_config.format.schema,esquemaAsistente);eq(init.signal instanceof AbortSignal,true);
  return Response.json({stop_reason:'end_turn',content:[{type:'text',text:'{"respuesta":"Prueba",'},{type:'text',text:'"citas":[]}'}]});
 };
 eq(await consulta(),{respuesta:'Prueba',citas:[]});eq(llamadas,1,'Una llamada sin reintentos automáticos');
 for(const [status,esperado] of [[400,502],[401,503],[403,503],[404,503],[429,429],[500,503],[529,503]]){
  globalThis.fetch=async()=>new Response('DETALLE_PRIVADO',{status,headers:{'retry-after':'99999'}});const e=await falla(esperado);eq(e.message.includes('DETALLE_PRIVADO'),false);if(status===429)eq(e.reintentar,300,'Espera acotada');
 }
 for(const stop_reason of ['max_tokens','refusal','tool_use']){globalThis.fetch=async()=>Response.json({stop_reason,content:[{type:'text',text:'{}'}]});await falla(502);}
 for(const body of [null,{stop_reason:'end_turn',content:null},{stop_reason:'end_turn',content:[null]},{stop_reason:'end_turn',content:[{type:'text',text:'null'}]}]){globalThis.fetch=async()=>Response.json(body);await falla(502);}
 globalThis.fetch=async()=>{throw new DOMException('Simulado','TimeoutError');};await falla(503);
 console.log(`Cliente Claude: ${checks} verificaciones correctas, sin tráfico externo.`);
}finally{globalThis.fetch=original;for(const [variable,valor] of [['ANTHROPIC_API_KEY',antes.clave],['ANTHROPIC_MODEL',antes.modelo]]){if(valor===undefined)delete process.env[variable];else process.env[variable]=valor;}}
