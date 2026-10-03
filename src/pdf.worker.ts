import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { LIMITS, parseLines, type SourceLine } from './shared/documents';
GlobalWorkerOptions.workerSrc = workerUrl;
// The parent owns this dedicated worker and terminates it on timeout/cancel.
self.onmessage = async (event: MessageEvent<{ bytes: ArrayBuffer; id: string; filename: string }>) => {
  const { bytes, id, filename } = event.data;
  let task: ReturnType<typeof getDocument> | undefined;
  try {
    task = getDocument({ data: new Uint8Array(bytes), useSystemFonts: true, stopAtErrors: true });
    const pdf = await task.promise;
    if (pdf.numPages > LIMITS.pages) throw new Error('Too many pages. The limit is 10 pages per PDF.');
    const lines: SourceLine[] = []; let length = 0;
    for (let page = 1; page <= pdf.numPages; page++) {
      const content = await (await pdf.getPage(page)).getTextContent();
      let line = ''; let lastY: number | undefined;
      for (const item of content.items) {
        if (!('str' in item)) continue;
        const y = item.transform[5];
        if (lastY !== undefined && Math.abs(y - lastY) > 3 && line.trim()) { lines.push({ text: line.trim(), page }); line = ''; }
        line += (line ? ' ' : '') + item.str; lastY = y; length += item.str.length;
        if (length > LIMITS.text) throw new Error('The extracted text exceeds the 100,000 character limit.');
        if (item.hasEOL) { if (line.trim()) lines.push({ text: line.trim(), page }); line = ''; lastY = undefined; }
      }
      if (line.trim()) lines.push({ text: line.trim(), page });
    }
    if (!lines.length) throw new Error('This PDF has no readable text layer. Scans and photos need OCR, which is not supported.');
    self.postMessage({ document: parseLines(lines, id, filename, pdf.numPages) });
  } catch (error) {
    const e = error as Error;
    const message = e.name === 'PasswordException' ? 'Encrypted PDFs are not supported. Export an unencrypted text-layer PDF.'
      : /invalid pdf|bad|xref|format/i.test(e.message) ? 'This PDF is malformed or unreadable. Export a fresh text-layer PDF.' : e.message;
    self.postMessage({ error: message });
  } finally { await task?.destroy(); }
};
