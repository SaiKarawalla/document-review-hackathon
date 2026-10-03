// Run against the built local app. All uploads are committed synthetic fixtures.
// Requires the agent-browser CLI and a running server; uses real Ollama when --ai is given.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
mkdirSync('artifacts', { recursive: true });
const cli = (...args) => execFileSync('npx', ['--yes','agent-browser',...args], { encoding:'utf8', timeout:90000 }).trim();
const evaluate = code => JSON.parse(cli('eval',code));
const wait = code => cli('wait','--fn',code);
const click = name => cli('find','role','button','click','--name',name);
const reports = [];
const check = (name, code) => { assert.equal(evaluate(code), true, name); reports.push({name,passed:true}); console.log('PASS',name); };
const reset = () => click('Reset case');
const upload = (...files) => cli('upload','input[type=file]',...files.map(file=>resolve('public/fixtures',file)));
const load = scenario => {cli('select','#scenario',scenario);click('Load demo pair');wait('!!document.querySelector(".document-card.loaded") && !document.querySelector(".status-message")');};
cli('open','http://127.0.0.1:8787');
cli('errors','--clear');
cli('network','har','start');
check('Production page renders', 'document.querySelectorAll("h1").length === 1 && !document.querySelector("vite-error-overlay")');
load('address-conflict');
check('Actual PDFs produce an address conflict', 'document.querySelectorAll(".finding.conflicting").length===1 && document.querySelector(".finding.conflicting h3").textContent==="Mailing address"');
check('Two local source passages visible', 'document.querySelectorAll(".source-pair blockquote").length===2 && document.querySelector(".source-pair").textContent.includes("82 Imaginary Avenue")');
click('Statement · p. 1');wait('document.querySelector("dialog[open] canvas")?.width>0 && !document.querySelector(".pdf-page [role=status]")');
check('Source dialog shows real page and excerpt', 'document.querySelector("dialog[open]").textContent.includes("Statement mailing address: 82 Imaginary") && document.querySelector("canvas").height > 0');
cli('screenshot','artifacts/browser-evidence.png');cli('press','Escape');
click('Preview exact AI request');wait('!!document.querySelector(".request-preview pre")');
check('Preview excludes literal identifiers and values', '(()=>{const t=document.querySelector(".request-preview pre").textContent;return ["Avery Example","14 Fiction Lane","82 Imaginary","DEMO-ACCT","DEMO-APPLICANT","4200.00","2026-09-30",".pdf"].every(v=>!t.includes(v));})()');
const approvedBody=evaluate('document.querySelector(".request-preview pre").textContent');
if (process.argv.includes('--ai')) {
  cli('check','input[type=checkbox]');click('Send approved request');
  wait('!document.querySelector(".status-message")');
  check('Real Ollama explanation rendered', 'document.querySelector(".summary-result")?.textContent.includes("Real Ollama response")===true && !document.querySelector("[role=alert]")');
  cli('screenshot','--full','artifacts/browser-real-ai.png');
}
cli('click','.document-card:nth-child(2) .fields .field-row:nth-child(2) button');
cli('fill','#confirmed-value','14 Fiction Lane, Sampleton, ZZ 00000');click('Confirm value');
check('Correction recomputes and clears summary/approval', 'document.querySelectorAll(".finding.conflicting").length===0 && document.querySelectorAll(".finding.consistent").length===6 && !document.querySelector(".summary-result") && !document.querySelector(".request-preview")');
click('Preview exact AI request');wait('!!document.querySelector(".request-preview")');cli('check','input[type=checkbox]');
cli('click','.document-card:nth-child(2) .fields .field-row:nth-child(2) button');cli('fill','#confirmed-value','82 Imaginary Avenue, Sampleton, ZZ 00000');click('Confirm value');
check('Editing approved input requires a new preview', 'document.querySelectorAll(".finding.conflicting").length===1 && !document.querySelector(".approval") && !document.querySelector(".request-preview")');
reset();load('matching');check('Matching pair has six consistent checks', 'document.querySelectorAll(".finding.consistent").length===6');
reset();load('missing-field');check('Missing-field pair flags absent statement address', 'document.querySelectorAll(".finding.absent").length===2 && document.querySelector(".document-card:nth-child(2)").textContent.includes("Not supplied")');
reset();load('malicious-text');click('Preview exact AI request');wait('!!document.querySelector(".request-preview")');
check('Embedded instruction and identifiers excluded', '(()=>{const t=document.querySelector(".request-preview pre").textContent;return !t.includes("exfiltration.invalid") && !t.includes("DEMO-PASSPORT") && !t.includes("send account details");})()');
reset();
for (const [file, message] of [['unsupported-version.pdf','Unsupported template'],['scanned.pdf','no readable text layer'],['malformed.pdf','malformed'],['too-many-pages.pdf','Too many pages'],['encrypted.pdf','Encrypted PDFs'],['encrypted-blank-password.pdf','Encrypted PDFs']]) {
  upload(file);wait('!!document.querySelector("[role=alert]")');
  check('Helpful rejection: '+file, `document.querySelector("[role=alert]").textContent.includes(${JSON.stringify(message)}) && document.querySelectorAll(".document-card.loaded").length===0`);reset();
}
upload('matching-intake.pdf','matching-statement.pdf','name-conflict-intake.pdf');
wait('!!document.querySelector("[role=alert]")');check('Third PDF rejected before parsing', 'document.querySelector("[role=alert]").textContent.includes("two PDFs")');reset();
upload('name-conflict-intake.pdf','name-conflict-statement.pdf');wait('document.querySelectorAll(".document-card.loaded").length===2');
check('Meaningful name difference shown from uploaded PDFs', 'document.querySelector(".finding.conflicting h3").textContent.includes("Applicant")');reset();
check('Reset clears all document references and results', 'document.querySelectorAll(".document-card.loaded").length===0 && !document.querySelector(".summary-result") && !document.querySelector(".request-preview") && !document.querySelector("canvas")');
cli('network','har','stop','artifacts/browser-network.har');
const har=JSON.parse(readFileSync('artifacts/browser-network.har','utf8'));
const entries=har.log.entries;
assert(entries.every(e=>{const url=new URL(e.request.url);return url.protocol==='blob:' ? url.origin==='http://127.0.0.1:8787' : url.protocol==='http:' && url.hostname==='127.0.0.1';}), 'Browser requested a non-local destination');
for (const entry of entries.filter(e=>e.request.url.includes('/api/'))) {
  const body=entry.request.postData?.text ?? '';
  assert(!['Avery Example','14 Fiction Lane','82 Imaginary','DEMO-ACCT','DEMO-PASSPORT','exfiltration.invalid'].some(v=>body.includes(v)),'Raw value in browser API request');
}
reports.push({name:'Captured browser requests only use loopback/local evidence blobs and minimized API bodies',passed:true});
const axe=JSON.parse(cli('a11y','--json'));assert.equal(axe.data.violations.length,0);reports.push({name:'Reset page accessibility audit: zero violations',passed:true});
assert.equal(cli('errors'),'');reports.push({name:'No browser page errors',passed:true});
cli('set','viewport','390','844');load('address-conflict');
check('Mobile layout has no horizontal overflow','document.documentElement.scrollWidth <= window.innerWidth');cli('screenshot','--full','artifacts/browser-mobile.png');
cli('set','viewport','1280','900');reset();load('address-conflict');cli('screenshot','--full','artifacts/browser-final.png');
const loadedAxe=JSON.parse(cli('a11y','--json'));assert.equal(loadedAxe.data.violations.length,0);reports.push({name:'Loaded review accessibility audit: zero violations',passed:true});
writeFileSync('artifacts/browser-report.json',JSON.stringify({ai:process.argv.includes('--ai'),checks:reports,approvedRequestBytes:Buffer.byteLength(approvedBody),browserRequests:entries.length},null,2));
console.log(`${reports.length} browser checks passed. Real AI: ${process.argv.includes('--ai')}.`);
