import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const core=await readFile('node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js','utf8');
const worker=await readFile('node_modules/tesseract.js/dist/worker.min.js','utf8');
const api=await readFile('node_modules/tesseract.js/dist/tesseract.min.js','utf8');
const language=await readFile('node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz');
// Embed the portable LSTM WASM core and language data. No runtime CDN or HTTP fetch.
const workerCode=`${core}\nself.TesseractCore=TesseractCore;\nconst language=Uint8Array.from(atob(${JSON.stringify(language.toString('base64'))}),c=>c.charCodeAt(0));
const localFetch=self.fetch.bind(self);self.fetch=(url,...args)=>String(url)==='memory://ocr/eng.traineddata.gz'?Promise.resolve(new Response(language)):String(url).startsWith('data:')||String(url).startsWith('blob:')?localFetch(url,...args):Promise.reject(new Error('OCR network access blocked'));
self.importScripts=()=>{throw new Error('Remote OCR scripts blocked')};self.XMLHttpRequest=undefined;self.WebSocket=undefined;\n${worker}`;
const output=await build({entryPoints:['mobile/engine/photo-engine.ts'],bundle:true,write:false,format:'iife',platform:'browser',target:'es2022',minify:true});
const script=`window.__OCR_WORKER=${JSON.stringify(workerCode)};\n${api}\n${output.outputFiles[0].text}`.replace(/<\/script/gi,'<\\/script');
const html=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'wasm-unsafe-eval' blob:; worker-src blob:; child-src blob:; img-src data: blob:; connect-src data: blob:; style-src 'unsafe-inline';"><style>
:root{--bg:#fff;--text:#222;--muted:#646464;--surface:#f7f7f7;--accent:#d92d50;--onaccent:#fff}:root[data-theme=dark]{--bg:#1b1b1b;--text:#f5f5f5;--muted:#b4b4b4;--surface:#222;--accent:#ff718b;--onaccent:#191919}*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:var(--text);background:var(--bg)}#toolbar{display:flex;gap:8px;flex-wrap:wrap;padding:12px}button{font:600 13px -apple-system,sans-serif;border:0;border-radius:10px;padding:12px;background:var(--surface);color:var(--text)}button:disabled{opacity:.4}#analyse{background:var(--accent);color:var(--onaccent)}#tip{font-size:12px;line-height:18px;padding:0 14px 12px;color:var(--muted)}#page{position:relative;margin:0 auto;width:100%;max-width:600px}canvas{width:100%;height:auto;display:block;touch-action:none}#terms{position:absolute;inset:0;pointer-events:none}.term{position:absolute;background:rgba(231,193,66,.32);border:1px solid #927518;border-radius:3px;padding:0;pointer-events:auto;min-height:18px}#placeholder{padding:70px 20px;text-align:center;color:var(--muted)}#status{padding:12px 14px;font-size:13px;line-height:18px;color:var(--text)}#highlights{display:none}</style></head><body>
<div id="toolbar"><button id="undo" disabled>Undo cover</button><button id="brush">Wide brush</button><button id="analyse" disabled>Analyze visible photo</button><button id="highlights">Show terms</button></div>
<div id="tip">Drag over private information. Cover the entire value, including its edges. Opaque covers are applied before text recognition.</div>
<div id="placeholder">Your document photo appears here.</div><div id="page"><canvas id="canvas" role="img" aria-label="Document photo"></canvas><div id="terms"></div></div><div id="status" role="status" aria-live="polite"></div><script>${script}</script></body></html>`;
await mkdir('mobile/generated',{recursive:true});
await writeFile('mobile/generated/photo-engine.ts',`// Generated offline OCR assets; never loads remote scripts or language data.\nexport const PHOTO_HTML=${JSON.stringify(html)};\n`);
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/photo-engine.html',html);
const demo=await readFile('public/fixtures/photo-statement.png');
await writeFile('mobile/generated/photo-demo.ts',`export const PHOTO_DEMO=${JSON.stringify('data:image/png;base64,'+demo.toString('base64'))};\n`);
console.log(JSON.stringify({localOCRHTMLBytes:Buffer.byteLength(html),englishDataSHA256:createHash('sha256').update(gunzipSync(language)).digest('hex'),core:'6.1.2 portable LSTM',runtimeRemoteAssets:0}));
