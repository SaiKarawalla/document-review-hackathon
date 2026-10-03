import { LIMITS, type ReviewDocument } from './shared/documents';
export async function parsePdf(file: File, signal: AbortSignal, timeout = LIMITS.timeout): Promise<ReviewDocument> {
  if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== 'application/pdf')) throw new Error('Choose a PDF file. Other formats are unsupported.');
  if (file.size > LIMITS.bytes) throw new Error('This PDF exceeds the 5 MiB file limit.');
  if (file.size === 0) throw new Error('This file is empty.');
  const bytes = await file.arrayBuffer();
  if (signal.aborted) throw new Error('Parsing cancelled.');
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') throw new Error('This file does not have a valid PDF signature.');
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./pdf.worker.ts', import.meta.url), { type: 'module' });
    const finish = () => { clearTimeout(timer); signal.removeEventListener('abort', cancel); worker.terminate(); };
    const cancel = () => { finish(); reject(new Error('Parsing cancelled.')); };
    const timer = setTimeout(() => { finish(); reject(new Error('PDF parsing timed out. The parser was stopped; try a simpler PDF.')); }, timeout);
    signal.addEventListener('abort', cancel, { once: true });
    worker.onmessage = event => {
      // PDF.js may post its own initialization handshake in a worker. Only our result completes parsing.
      if (event.data?.type !== 'review-result') return;
      finish(); event.data.error ? reject(new Error(event.data.error)) : resolve(event.data.document);
    };
    worker.onerror = () => { finish(); reject(new Error('Could not parse this PDF. Try an unencrypted text-layer PDF.')); };
    worker.postMessage({ bytes, id: crypto.randomUUID(), filename: file.name }, [bytes]);
  });
}
