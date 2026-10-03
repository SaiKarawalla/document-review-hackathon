import { readFile } from 'node:fs/promises';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { extractDocument } from '../src/shared/extract';
export async function fixture(filename: string) {
  const task = getDocument({ data: new Uint8Array(await readFile('public/fixtures/' + filename)), useSystemFonts: true, stopAtErrors: true });
  try { return await extractDocument(await task.promise, filename.replace('.pdf',''), filename); }
  finally { await task.destroy(); }
}
export async function pair(caseId = 'matching') {
  return Promise.all(['intake','statement'].map(kind => fixture(`${caseId}-${kind}.pdf`)));
}
