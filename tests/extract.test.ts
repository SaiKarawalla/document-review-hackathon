import { describe, expect, it } from 'vitest';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { extractDocument } from '../src/shared/extract';
describe('bounded text extraction',()=>{
  it('stops extraction when text budget exceeded',async()=>{
    const pdf={numPages:1,getPermissions:async()=>null,getPage:async()=>({getTextContent:async()=>({items:[{str:'x'.repeat(100001),transform:[1,0,0,1,0,0],hasEOL:true}]})})} as unknown as PDFDocumentProxy;
    await expect(extractDocument(pdf,'x','x.pdf')).rejects.toThrow('100,000');
  });
});
