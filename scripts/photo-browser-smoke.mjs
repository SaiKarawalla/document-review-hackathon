// Actual OCR in a browser with the exact bundled, network-restricted phone engine.
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const cli=(...args)=>execFileSync('npx',['--yes','agent-browser',...args],{encoding:'utf8',timeout:90000}).trim();
const evaluate=code=>JSON.parse(cli('eval',code));
const html=readFileSync('artifacts/photo-engine.html','utf8');
const bridge=`<script>window.events=[];window.ReactNativeWebView={postMessage:s=>{const event=JSON.parse(s);window.events.push(event);if(event.type==='result')window.result=event;if(event.type==='error')window.error=event.message;}};</script>`;
writeFileSync('artifacts/photo-browser.html',html.replace('<script>',bridge+'<script>'));
cli('open','file://'+resolve('artifacts/photo-browser.html'));
cli('network','har','start');cli('errors','--clear');
const reports=[];
for(const [name,file,draw] of [['covered','photo-statement.png',true],['uncovered','photo-statement.png',false],['drawing','photo-drawing.png',false]]){
  const src='data:image/png;base64,'+readFileSync('public/fixtures/'+file).toString('base64');
  const loadCode=`(async()=>{window.result=undefined;window.error=undefined;window.events=[];await window.photo.load(${JSON.stringify(src)});return true;})()`;
  execFileSync('npx',['--yes','agent-browser','eval','--stdin'],{input:loadCode,encoding:'utf8',timeout:90000});
  if(draw){const rect=evaluate(`(()=>{const c=document.querySelector('canvas'),r=c.getBoundingClientRect();return {x:r.left+275/c.width*r.width,y:r.top+480/c.height*r.height,end:r.left+740/c.width*r.width};})()`);cli('mouse','move',String(rect.x),String(rect.y));cli('mouse','down');cli('mouse','move',String(rect.end),String(rect.y));cli('mouse','up');}
  // A drawn stroke uses native pointer handlers. Screenshot before OCR verifies opaque coverage.
  if(draw){cli('screenshot','artifacts/photo-browser-covered.png');assert.equal(evaluate(`Array.from(document.querySelector('canvas').getContext('2d').getImageData(450,480,1,1).data).join(',')`),'0,0,0,255');}
  cli('click','#analyse');cli('wait','--fn','!!window.result || !!window.error');
  const error=evaluate('window.error??null');assert.equal(error,null,'Actual OCR error');
  const result=evaluate('window.result');assert(result.lines.length>0);
  if(draw)assert(!JSON.stringify(result.lines).includes('DEMO-ACCT'),'Covered identifier read');
  if(name==='uncovered')assert(JSON.stringify(result.lines).includes('DEMO-ACCT'),'Uncovered control identifier must actually be read');
  cli('click','#highlights');cli('screenshot',`artifacts/photo-browser-${name}-terms.png`);
  if(name!=='drawing'){assert(evaluate('document.querySelectorAll(".term").length')>0);cli('click','.term[aria-label="Explain Closing balance"]');assert(evaluate('window.events.some(e=>e.type==="term"&&e.id==="closing-balance")'),'Highlighted OCR words must open their glossary entry');}
  assert(evaluate('document.querySelector("#undo").disabled'),'Undo locked after flatten');
  writeFileSync(`artifacts/photo-ocr-${name}.json`,JSON.stringify(result,null,2));
  reports.push({sample:name,actualOCR:true,latencyMs:result.latencyMs,visibleLines:result.lines.length,coverSegments:result.masks.length});
}
cli('network','har','stop','artifacts/photo-browser-network.har');
const har=JSON.parse(readFileSync('artifacts/photo-browser-network.har','utf8'));
assert(har.log.entries.every(e=>!/^https?:/.test(e.request.url)),'OCR requested HTTP/network');
assert.equal(cli('errors'),'');
writeFileSync('artifacts/photo-browser-report.json',JSON.stringify({reports,remoteHTTPRequests:0},null,2));
console.log(JSON.stringify({reports,remoteHTTPRequests:0}));cli('close');
