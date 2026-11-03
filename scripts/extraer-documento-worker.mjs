import { parentPort, workerData } from 'node:worker_threads';
import { extractRawText } from 'mammoth';
import yauzl from 'yauzl';
import { getDocumentProxy } from 'unpdf';

const MAX_TEXTO = 1_000_000;
const MAX_DESCOMPRIMIDO = 10 * 1024 * 1024;

// Recorre y descomprime con límite antes de entregar un ZIP a Mammoth.
async function validarDocx(buffer) {
  await new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true, validateEntrySizes: true }, (error, zip) => {
      if (error) return reject(new Error('El archivo Word está dañado o no es un DOCX válido.'));
      let entradas = 0, total = 0, principal = false, tipos = false, terminado = false;
      const fallo = e => { if (!terminado) { terminado = true; zip.close(); reject(e); } };
      zip.on('error', () => fallo(new Error('El archivo Word está dañado.')));
      zip.on('entry', entrada => {
        if (++entradas > 2000 || entrada.uncompressedSize > MAX_DESCOMPRIMIDO || (entrada.generalPurposeBitFlag & 1)) {
          return fallo(new Error('El Word está protegido o supera el límite de procesamiento (10 MB descomprimidos).'));
        }
        if (entrada.fileName === 'word/document.xml') principal = true;
        if (entrada.fileName === '[Content_Types].xml') tipos = true;
        if (/\/$/.test(entrada.fileName)) return zip.readEntry();
        zip.openReadStream(entrada, (e, stream) => {
          if (e) return fallo(new Error('El archivo Word está dañado.'));
          stream.on('data', chunk => { total += chunk.length; if (total > MAX_DESCOMPRIMIDO) { stream.destroy(); fallo(new Error('El Word supera los 10 MB descomprimidos.')); } });
          stream.on('error', () => fallo(new Error('El archivo Word está dañado.')));
          stream.on('end', () => { if (!terminado) zip.readEntry(); });
        });
      });
      zip.on('end', () => { if (!terminado) { terminado = true; principal && tipos ? resolve() : reject(new Error('No se encontró el contenido de un documento Word válido.')); } });
      zip.readEntry();
    });
  });
}

async function extraer() {
  const buffer = Buffer.from(workerData.bytes);
  let texto;
  if (workerData.extension === 'pdf') {
    if (buffer.subarray(0, 5).toString() !== '%PDF-') throw new Error('El archivo no es un PDF válido.');
    let pdf;
    try {
      pdf = await getDocumentProxy(new Uint8Array(buffer), { isEvalSupported: false, useSystemFonts: false, useWorkerFetch: false });
      if (pdf.numPages > 100) throw new Error('El PDF supera el límite de 100 páginas.');
      const paginas = []; let caracteres = 0;
      for (let i = 1; i <= pdf.numPages; i++) {
        const pagina = await pdf.getPage(i);
        const contenido = await pagina.getTextContent();
        const lineas = contenido.items.map(item => 'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '').join('');
        caracteres += lineas.length;
        if (caracteres > MAX_TEXTO) throw new Error('El documento supera un millón de caracteres extraídos.');
        paginas.push(lineas.trim()); pagina.cleanup();
      }
      texto = paginas.join('\n\n');
    } catch (e) {
      if (e.name === 'PasswordException') throw new Error('El PDF está protegido. Exporta una copia sin contraseña y vuelve a cargarla.');
      if (/supera/.test(e.message)) throw e;
      throw new Error('No se pudo leer el PDF. Comprueba que el archivo no esté dañado ni protegido.');
    } finally { if (pdf) await pdf.loadingTask.destroy(); }
  } else {
    await validarDocx(buffer);
    try { texto = (await extractRawText({ buffer }, { externalFileAccess: false })).value; }
    catch { throw new Error('No se pudo extraer el texto del Word. Guarda una copia en formato DOCX y vuelve a intentarlo.'); }
  }
  if (texto.length > MAX_TEXTO) throw new Error('El documento supera un millón de caracteres extraídos.');
  texto = texto.replace(/\r\n?/g, '\n').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '').trim();
  if (!texto) throw new Error('No se encontró texto extraíble. Si es un escaneo o contiene solo imágenes, aplica OCR antes de cargarlo.');
  return texto;
}
extraer().then(texto => parentPort.postMessage({ texto })).catch(e => parentPort.postMessage({ error: e.message }));
