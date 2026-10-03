import type { PDFDocumentProxy } from 'pdfjs-dist';
import { LIMITS, parseLines, type SourceLine } from './documents';
export async function extractDocument(pdf: PDFDocumentProxy, id: string, filename: string) {
  if (await pdf.getPermissions() !== null) throw new Error('Encrypted PDFs are not supported. Export an unencrypted text-layer PDF.');
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
  return parseLines(lines, id, filename, pdf.numPages);
}
