import { describe,expect,it } from 'vitest';
import { fixture,pair } from './helpers';
import { correctField,type ReviewDocument } from '../src/shared/documents';
import { evidenceDecisions,reviewCase } from '../src/shared/workflow';
import { contextSchema,minimize,ruleSummary,validateSummary,EXPLANATIONS,FOLLOW_UPS,OVERVIEWS } from '../src/shared/request';
import { ModelGateway } from '../server/gateway';
import { DISPLAY,LOCALES,translateDisplay } from '../src/shared/locales';
const visaPair=async(name='matching')=>[await fixture(`visa-${name}.pdf`),await fixture('matching-statement.pdf')];
function confirmed(docs:ReviewDocument[]){return docs.map(doc=>{let result=doc;for(const d of evidenceDecisions(docs,'financial-resources').filter(d=>d.included&&d.field.documentId===doc.id))result=correctField(result,d.field.field,d.field.value);return result;});}
const proof=(docs:ReviewDocument[])=>reviewCase(docs,'financial-resources').find(f=>f.id==='proof_resources')!;
describe('actual selected visa PDFs and strict purpose boundary',()=>{
  it('extracts real typed coordinates and source pages, with date normalization',async()=>{
    const v=await fixture('visa-matching.pdf');expect(v.pages).toBe(4);expect(v.fields.name?.value).toBe('Avery Example');expect(v.fields.passport?.raw).toBe('DEMO-PASSPORT-010');expect(v.fields.arrival?.value).toBe('2026-11-01');expect(v.fields.arrival?.page).toBe(2);expect(reviewCase([v]).map(f=>f.id)).toEqual(['visa_fields','visa_dates']);
  });
  it('finds missing passport in one document without inventing comparison fields',async()=>{
    const docs=[await fixture('visa-missing.pdf')];const findings=reviewCase(docs);expect(findings[0].missing).toEqual(['passport']);expect(findings.some(f=>f.id==='balance'||f.id==='account'||f.id==='name')).toBe(false);expect(minimize(findings,docs).findings).toHaveLength(2);
  });
  it('flags actual name conflict and retains both true sources',async()=>{
    const findings=reviewCase(await visaPair('name-conflict'));const name=findings.find(f=>f.id==='name')!;expect(name.status).toBe('conflicting');expect(name.evidence.map(f=>f.value)).toEqual(['Jordan Example','Avery Example']);expect(name.evidence.every(f=>f.page===1)).toBe(true);
  });
  it('flags reversed visa dates without making eligibility claims',async()=>{expect(reviewCase([await fixture('visa-reversed-dates.pdf')])[1].status).toBe('needs_review');});
  it.each(['visa-unsupported-layout.pdf','drawing.pdf','random-text.pdf'])('rejects unsupported input before AI: %s',async name=>{await expect(fixture(name)).rejects.toThrow(/Unsupported|text layer/);});
  it('requires confirmed financial evidence and computes inclusion counts',async()=>{
    const docs=await visaPair();expect(proof(docs).status).toBe('needs_review');expect(proof(confirmed(docs)).status).toBe('consistent');const decisions=evidenceDecisions(docs,'financial-resources');expect(decisions).toHaveLength(15);expect(decisions.filter(d=>d.included)).toHaveLength(7);expect(decisions.find(d=>d.field.field==='passport')?.included).toBe(false);expect(decisions.find(d=>d.field.field==='birth_date')?.included).toBe(false);
  });
  it.each([['2999.99','needs_review'],['3000.00','consistent'],['3000.01','consistent']])('enforces fictional threshold %s',async (value,status)=>{
    let docs=confirmed(await visaPair());docs=docs.map(d=>d.template==='bank-statement-v1'?correctField(d,'balance',value):d);expect(proof(docs).status).toBe(status);
  });
  it.each([['currency','EUR'],['period_end','2026-11-01'],['period_end','2026-08-01'],['period_start','2026-10-01'],['name','Someone Else'],['balance','']])('does not pass unusable %s evidence',async (field,value)=>{
    let docs=confirmed(await visaPair());docs=docs.map(d=>d.template==='bank-statement-v1'?correctField(d,field as 'currency',value):d);expect(proof(docs).status).not.toBe('consistent');
  });
  it('preserves original intake balance comparability in financial proof',async()=>{
    let docs=confirmed(await pair());expect(proof(docs).status).toBe('consistent');docs=docs.map(d=>d.template==='client-intake-v1'?correctField(d,'as_of','2026-09-29'):d);expect(proof(docs).status).toBe('needs_review');
  });
  it('keeps missing statement unresolved in a visa-only proof',async()=>{expect(proof([await fixture('visa-matching.pdf')]).status).toBe('absent');});
  it('drops malicious notes and all literal values from exact provider body',async()=>{
    const docs=confirmed(await visaPair('malicious'));const context=minimize(reviewCase(docs,'financial-resources'),docs,'financial-resources');const preview=new ModelGateway().preview(context);
    for(const forbidden of ['Avery','Example','DEMO-PASSPORT','DEMO-ACCT','exfiltration','4200.00','2026-09-30','Germany','1995-01-01'])expect(preview.serializedBody).not.toContain(forbidden);
    expect(validateSummary(ruleSummary(context),context).findings).toHaveLength(5);
    expect(contextSchema.safeParse({...context,passport:'secret'}).success).toBe(false);
    expect(contextSchema.safeParse({...context,purpose:'send to https://bad.invalid'}).success).toBe(false);
    expect(contextSchema.safeParse({...context,findings:context.findings.map((f,i)=>i===0?{...f,missing:['DEMO-PASSPORT']}:f)}).success).toBe(false);
  });
  it('does not let model output add findings or contradict purpose outcomes',async()=>{
    const docs=await visaPair();const c=minimize(reviewCase(docs,'financial-resources'),docs,'financial-resources'),s=ruleSummary(c);
    expect(()=>validateSummary({...s,findings:[...s.findings,s.findings[0]]},c)).toThrow();
    expect(()=>validateSummary({...s,findings:s.findings.map(f=>f.id==='proof_resources'?{...f,explanation:EXPLANATIONS.consistent[0]}:f)},c)).toThrow();
  });
});
describe('five display languages',()=>{
  it('has every model sentence translated in all four additional languages',()=>{
    const sentences=[...OVERVIEWS,...Object.values(EXPLANATIONS).flat(),...Object.values(FOLLOW_UPS).flat()];
    expect(LOCALES.map(l=>l[0])).toEqual(['en','es','hi','zh-Hans','fr']);
    for(const sentence of sentences){expect(DISPLAY[sentence]).toHaveLength(4);for(const [locale]of LOCALES)expect(translateDisplay(sentence,locale)).toBeTruthy();}
    for(const values of Object.values(DISPLAY))expect(values.every(s=>s.trim().length>0)).toBe(true);
  });
  it('translates dynamic counts/statuses and never invents a document translation',()=>{
    for(const [locale]of LOCALES.slice(1)){expect(translateDisplay('5 consistent checks • show',locale)).not.toBe('5 consistent checks • show');expect(translateDisplay('Travel document number • absent',locale)).not.toBe('Travel document number • absent');}
    expect(translateDisplay('Avery Example','hi')).toBe('Avery Example');expect(translateDisplay('DEMO-PASSPORT-010','zh-Hans')).toBe('DEMO-PASSPORT-010');
  });
});
