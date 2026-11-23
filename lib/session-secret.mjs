const desarrollo = 'dev-secreto-cambiar-en-produccion-123456';
/** No utiliza el valor de desarrollo en producción. No registra el secreto. */
export function secretoSesion(valor, entorno) {
 if (entorno === 'production') {
  if (typeof valor !== 'string' || valor.trim().length < 32 || valor === desarrollo || valor === 'cambia-esto-por-un-texto-largo-y-secreto-de-32-caracteres') {
   throw new Error('JWT_SECRET debe estar configurado con al menos 32 caracteres y no puede ser un valor de ejemplo.');
  }
  return valor;
 }
 return valor || desarrollo;
}
