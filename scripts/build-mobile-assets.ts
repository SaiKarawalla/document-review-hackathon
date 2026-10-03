import { build } from 'esbuild';
import { mkdir,readFile,writeFile } from 'node:fs/promises';
const output=await build({entryPoints:['mobile/engine/pdf-engine.ts'],bundle:true,write:false,format:'iife',platform:'browser',target:'es2022',minify:true});
const js=output.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const html=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; font-src data:;"><style>body{margin:0;background:white}canvas{max-width:100%;height:auto}</style></head><body><canvas></canvas><script>${js}</script></body></html>`;
await mkdir('mobile/generated',{recursive:true});
await writeFile('mobile/generated/engine.ts',`// Generated locally; no remote PDF assets.\nexport const ENGINE_HTML=${JSON.stringify(html)};\n`);
const fixtures:Record<string,{filename:string;base64:string}[]>={};
for(const scenario of ['address-conflict','matching','missing-field','malicious-text']) {
  fixtures[scenario]=await Promise.all(['intake','statement'].map(async kind=>({filename:`${scenario}-${kind}.pdf`,base64:(await readFile(`public/fixtures/${scenario}-${kind}.pdf`)).toString('base64')})));
}
await writeFile('mobile/generated/fixtures.ts',`// Actual committed synthetic PDFs, bundled for phone-local parsing.\nexport const FIXTURES:Record<string,{filename:string;base64:string}[]>=${JSON.stringify(fixtures)};\n`);
console.log('Built self-contained phone-local PDF engine and real synthetic fixtures.');
