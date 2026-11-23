/** Configuración compartida de PostgreSQL: TLS verifica CA y nombre del servidor. */
export function configDB({url, ssl, ca, entorno} = {}) {
 if (ssl !== undefined && ssl !== '' && ssl !== 'true' && ssl !== 'false') throw new Error('DATABASE_SSL debe ser true o false.');
 let destino;
 if (url) {
  try { destino = new URL(url); } catch { throw new Error('DATABASE_URL no es una URL PostgreSQL válida.'); }
  if (!['postgres:', 'postgresql:'].includes(destino.protocol) || !destino.hostname) throw new Error('DATABASE_URL debe indicar un servidor PostgreSQL.');
  // node-postgres puede reemplazar el objeto ssl con opciones de la URL.
  const prohibidos = ['ssl', 'sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'uselibpqcompat', 'host'];
  if ([...destino.searchParams.keys()].some(k => prohibidos.includes(k.toLowerCase()))) throw new Error('DATABASE_URL no debe contener parámetros SSL ni host; configura DATABASE_SSL y DATABASE_CA_CERT por separado.');
 }
 if (ssl === 'false') {
  const local = destino && ['localhost', '127.0.0.1', '[::1]', '::1'].includes(destino.hostname.toLowerCase());
  if (entorno === 'production' || !local) throw new Error('DATABASE_SSL=false solo está permitido para una base local fuera de producción.');
  return { connectionString: url, ssl: false };
 }
 return { connectionString: url, ssl: ca ? { rejectUnauthorized: true, ca } : { rejectUnauthorized: true } };
}
export function configDBDesdeEntorno() {
 return configDB({url: process.env.DATABASE_URL,ssl: process.env.DATABASE_SSL,ca: process.env.DATABASE_CA_CERT,entorno: process.env.NODE_ENV});
}
