// Cliente de servidor: no importar desde componentes del navegador.
export const MODELO_CLAUDE = 'claude-haiku-5-5';
export function estadoClaude() {
  return { configurada: Boolean(process.env.ANTHROPIC_API_KEY?.trim()), modelo: process.env.ANTHROPIC_MODEL?.trim() || MODELO_CLAUDE };
}
export class ErrorClaude extends Error {
  constructor(message, status = 502, reintentar = 0) { super(message); this.status = status; this.reintentar = reintentar; }
}
export async function consultarClaude({ sistema, datos, esquema }) {
  const estado = estadoClaude();
  if (!estado.configurada) throw new ErrorClaude('Las consultas con IA todavía no están activadas. Contacta al administrador.', 503);
  let respuesta;
  try {
    respuesta = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY.trim(), 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: estado.modelo, max_tokens: 1200, system: sistema,
        messages: [{ role: 'user', content: JSON.stringify(datos) }],
        output_config: { format: { type: 'json_schema', schema: esquema } } }),
      signal: AbortSignal.timeout(45000),
    });
  } catch { throw new ErrorClaude('No se pudo conectar con la IA a tiempo. Vuelve a intentarlo.', 503); }
  if (respuesta.status === 401 || respuesta.status === 403) throw new ErrorClaude('La configuración de IA necesita revisión. Contacta al administrador.', 503);
  if (respuesta.status === 404) throw new ErrorClaude('El modelo de IA configurado no está disponible. Contacta al administrador.', 503);
  if (respuesta.status === 429) {
    const espera = Number(respuesta.headers.get('retry-after'));
    throw new ErrorClaude('La IA alcanzó su límite de consultas. Espera un momento y vuelve a intentarlo.', 429, Number.isFinite(espera) && espera > 0 ? Math.min(300, Math.ceil(espera)) : 60);
  }
  if (respuesta.status >= 500) throw new ErrorClaude('El servicio de IA no está disponible temporalmente. Inténtalo de nuevo más tarde.', 503);
  if (!respuesta.ok) throw new ErrorClaude('La IA no pudo procesar esta consulta. Contacta al administrador si el problema continúa.');
  let contenido;
  try { contenido = await respuesta.json(); } catch { throw new ErrorClaude('La IA devolvió una respuesta ilegible. Vuelve a intentarlo.'); }
  if (contenido?.stop_reason === 'max_tokens') throw new ErrorClaude('La respuesta de IA quedó incompleta. Prueba con una pregunta más concreta o un documento más breve.');
  if (contenido?.stop_reason === 'refusal') throw new ErrorClaude('La IA no pudo responder a esa solicitud. Reformula la pregunta.');
  if (contenido?.stop_reason !== 'end_turn' || !Array.isArray(contenido?.content)) throw new ErrorClaude('La IA no devolvió una respuesta completa. Vuelve a intentarlo.');
  const texto = contenido.content.filter(b => b?.type === 'text' && typeof b.text === 'string').map(b => b.text).join('');
  try {
    const valor = JSON.parse(texto);
    if (!valor || typeof valor !== 'object' || Array.isArray(valor)) throw new Error();
    return valor;
  } catch { throw new ErrorClaude('La respuesta de IA no tuvo el formato esperado. Vuelve a intentarlo.'); }
}
export const esquemaAsistente = {
  type: 'object', properties: { respuesta: { type: 'string' }, citas: { type: 'array', items: {
    type: 'object', properties: { id_fragmento: { type: 'integer' }, cita: { type: 'string' } }, required: ['id_fragmento', 'cita'], additionalProperties: false,
  } } }, required: ['respuesta', 'citas'], additionalProperties: false,
};
export const esquemaContraste = {
  type: 'object', properties: { diferencias: { type: 'array', items: {
    type: 'object', properties: { descripcion: { type: 'string' }, cita: { type: 'string' } }, required: ['descripcion', 'cita'], additionalProperties: false,
  } } }, required: ['diferencias'], additionalProperties: false,
};
