import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { WorkerMessageHandler } from 'pdfjs-dist/legacy/build/pdf.worker.mjs';
import { extractDocument } from '../../src/shared/extract';
import { LIMITS } from '../../src/shared/documents';
// WKWebView has ReadableStream.getReader but may lack its async iterator,
// which PDF.js 6 uses when collecting text. Keep this shim inside the engine.
if (!(Symbol.asyncIterator in ReadableStream.prototype)) {
  Object.defineProperty(ReadableStream.prototype,Symbol.asyncIterator,{value:async function* (this:ReadableStream) {
    const reader=this.getReader();let done=false;
    try {while(true){const next=await reader.read();if(next.done){done=true;return;}yield next.value;}}
    finally {try{if(!done)await reader.cancel();}finally{reader.releaseLock();}}
  }});
}
// A dedicated, disposable phone-local WebView; no network/assets/links needed.
// PDF.js uses its in-page worker implementation. Unmount cancels this engine.
Object.assign(globalThis, { pdfjsWorker: { WorkerMessageHandler } });
GlobalWorkerOptions.workerSrc = '';
declare global { interface Window { ReactNativeWebView?: {postMessage:(s:string)=>void}; reviewEngine:(message:string)=>Promise<void> } }
const reply=(value:unknown)=>window.ReactNativeWebView?.postMessage(JSON.stringify(value));
window.reviewEngine=async (message:string)=>{
  const input=JSON.parse(message) as {token:string;mode:'parse'|'render';base64:string;id:string;filename:string;page?:number};
  let task:ReturnType<typeof getDocument>|undefined;
  try {
    if(input.base64.length>Math.ceil(LIMITS.bytes/3)*4)throw new Error('This PDF exceeds the 5 MiB file limit.');
    const binary=atob(input.base64), bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
    if(bytes.length>LIMITS.bytes)throw new Error('This PDF exceeds the 5 MiB file limit.');
    if(binary.slice(0,5)!=='%PDF-')throw new Error('This file does not have a valid PDF signature.');
    task=getDocument({data:bytes,useSystemFonts:true,stopAtErrors:true,isOffscreenCanvasSupported:false});
    const pdf=await task.promise;
    if(input.mode==='parse')reply({token:input.token,document:await extractDocument(pdf,input.id,input.filename)});
    else {
      if(await pdf.getPermissions()!==null || pdf.numPages>LIMITS.pages)throw new Error('Unsupported PDF');
      const page=await pdf.getPage(input.page??1), unscaled=page.getViewport({scale:1});
      const viewport=page.getViewport({scale:Math.min(1.5,800/unscaled.width)});
      const canvas=document.querySelector('canvas')!;canvas.width=viewport.width;canvas.height=viewport.height;
      await page.render({canvas,viewport}).promise;
      reply({token:input.token,rendered:true});
    }
  } catch(error) {
    const e=error as Error;
    reply({token:input.token,error:e.name==='PasswordException'?'Encrypted PDFs are not supported.':/invalid pdf|xref|format/i.test(e.message)?'This PDF is malformed or unreadable.':e.message});
  } finally {await task?.destroy();}
};
reply({ready:true});
