import { Worker } from 'node:worker_threads';
import path from 'node:path';

let procesando = 0;
export class ErrorExtraccion extends Error {
  constructor(message: string, public status = 422) { super(message); }
}

/** El hilo se termina al vencer el plazo; no se deja el parser ejecutándose. */
export async function extraerDocumento(bytes: Buffer, extension: 'pdf' | 'docx'): Promise<string> {
  if (procesando >= 2) throw new ErrorExtraccion('Hay documentos procesándose. Espera unos segundos y vuelve a intentarlo.', 429);
  procesando++;
  try {
    return await new Promise<string>((resolve, reject) => {
      const worker = new Worker(path.join(process.cwd(), 'scripts/extraer-documento-worker.mjs'), {
        workerData: { bytes, extension }, resourceLimits: { maxOldGenerationSizeMb: 192 },
      });
      let terminado = false;
      const finalizar = (error?: Error, texto?: string) => {
        if (terminado) return;
        terminado = true; clearTimeout(limite); void worker.terminate();
        if (error) reject(error); else resolve(texto!);
      };
      const limite = setTimeout(() => finalizar(new ErrorExtraccion('El documento tardó demasiado en procesarse. Prueba con un archivo más pequeño.')), 15_000);
      worker.once('message', (r: { texto?: string; error?: string }) => {
        if (r.error || typeof r.texto !== 'string') finalizar(new ErrorExtraccion(r.error || 'No se pudo extraer el texto.'));
        else finalizar(undefined, r.texto);
      });
      worker.once('error', () => finalizar(new ErrorExtraccion('No se pudo procesar el documento. Prueba con una copia más pequeña.')));
      worker.once('exit', () => { if (!terminado) finalizar(new ErrorExtraccion('El procesamiento se interrumpió. Vuelve a intentarlo.')); });
    });
  } finally { procesando--; }
}
