import type { NextConfig } from 'next';
import { createRequire, isBuiltin } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

// El worker carga módulos fuera del bundle de Next. Incluye también sus
// dependencias transitivas al empaquetar funciones o generar standalone.
const paquetes = new Set<string>();
function incluirPaquete(nombre: string, desde: string) {
  if (isBuiltin(nombre)) return;
  const requerir = createRequire(desde);
  let directorio = path.dirname(requerir.resolve(nombre));
  while (!existsSync(path.join(directorio, 'package.json'))) {
    const padre = path.dirname(directorio);
    if (padre === directorio) throw new Error(`No se encontró el paquete ${nombre}`);
    directorio = padre;
  }
  if (paquetes.has(directorio)) return;
  paquetes.add(directorio);
  const archivo = path.join(directorio, 'package.json');
  const paquete = JSON.parse(readFileSync(archivo, 'utf8'));
  for (const dependencia of Object.keys(paquete.dependencies || {})) incluirPaquete(dependencia, archivo);
}
for (const nombre of ['unpdf', 'mammoth', 'yauzl']) incluirPaquete(nombre, path.join(process.cwd(), 'package.json'));
const config: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['unpdf', 'mammoth', 'yauzl'],
  outputFileTracingIncludes: {
    '/api/documentos': ['./scripts/extraer-documento-worker.mjs', ...[...paquetes].map(p => path.relative(process.cwd(), p).split(path.sep).join('/') + '/**/*')],
  },
};
export default config;
