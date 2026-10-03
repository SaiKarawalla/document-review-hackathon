import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { extractDocument } from './shared/extract';
GlobalWorkerOptions.workerSrc = workerUrl;
// The parent owns this dedicated worker and terminates it on timeout/cancel.
self.onmessage = async (event: MessageEvent<{ bytes: ArrayBuffer; id: string; filename: string }>) => {
  const { bytes, id, filename } = event.data;
  let task: ReturnType<typeof getDocument> | undefined;
  try {
    task = getDocument({ data: new Uint8Array(bytes), useSystemFonts: true, stopAtErrors: true });
    const pdf = await task.promise;
    self.postMessage({ type: 'review-result', document: await extractDocument(pdf, id, filename) });
  } catch (error) {
    const e = error as Error;
    const message = e.name === 'PasswordException' ? 'Encrypted PDFs are not supported. Export an unencrypted text-layer PDF.'
      : /invalid pdf|bad|xref|format/i.test(e.message) ? 'This PDF is malformed or unreadable. Export a fresh text-layer PDF.' : e.message;
    self.postMessage({ type: 'review-result', error: message });
  } finally { await task?.destroy(); }
};
