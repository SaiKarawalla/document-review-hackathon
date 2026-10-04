import { writeFile,mkdir } from 'node:fs/promises';
import { fixture } from '../tests/helpers';
import { correctField } from '../src/shared/documents';
import { evidenceDecisions,reviewCase,type Purpose } from '../src/shared/workflow';
import { minimize } from '../src/shared/request';
import { ModelGateway,DESTINATION } from '../server/gateway';
import { LOCALES,translateDisplay } from '../src/shared/locales';
await mkdir('artifacts',{recursive:true});
for(const [sample,purpose] of [['missing','consistency-review'],['matching','financial-resources']] as const){
  let docs=[await fixture(`visa-${sample}.pdf`),await fixture('matching-statement.pdf')];
  if(purpose==='financial-resources')docs=docs.map(doc=>{let next=doc;for(const d of evidenceDecisions(docs,purpose).filter(d=>d.included&&d.field.documentId===doc.id))next=correctField(next,d.field.field,d.field.value);return next;});
  const context=minimize(reviewCase(docs,purpose),docs,purpose as Purpose), calls:{url:string;body?:string}[]=[];
  const transport:typeof fetch=async(input,init)=>{calls.push({url:String(input),body:typeof init?.body==='string'?init.body:undefined});return fetch(input,init);};
  const gateway=new ModelGateway('qwen2.5:1.5b',transport),p=gateway.preview(context),r=await gateway.send(p.id,p.hash);
  if(calls.find(c=>c.url===DESTINATION)?.body!==p.serializedBody)throw new Error('Exact body mismatch');
  if(calls.some(c=>!c.url.startsWith('http://127.0.0.1:11434/')))throw new Error('Unexpected destination');
  for(const secret of ['Avery Example','DEMO-PASSPORT','DEMO-ACCT','4200.00','2026-09-30','Fiction Lane','exfiltration'])if(p.serializedBody.includes(secret))throw new Error('Literal leaked');
  const displays=Object.fromEntries(LOCALES.map(([locale])=>[locale,{overview:translateDisplay(r.summary.overview,locale),findings:r.summary.findings.map(f=>({...f,explanation:translateDisplay(f.explanation,locale),follow_up:translateDisplay(f.follow_up,locale)}))}]));
  await writeFile(`artifacts/phase6-real-${sample}.json`,JSON.stringify({preview:p,response:r,calls,displays},null,2));
  console.log(JSON.stringify({sample,purpose,realModel:r.model,latencyMs:r.latencyMs,findings:r.summary.findings.length,approvedBytesEqual:true,literalValuesSent:0,displayLanguages:LOCALES.length,requestHash:r.requestHash}));
}
