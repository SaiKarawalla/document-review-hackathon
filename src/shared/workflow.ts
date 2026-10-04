import { compareDocuments, type Field, type Finding, type ReviewDocument } from './documents';

export type Purpose = 'consistency-review' | 'financial-resources';
export const DEMO_POLICY = { id:'adult-tourism-demo-v1', currency:'USD', thresholdCents:300000n, reviewDate:'2026-10-03', maxAgeDays:45 } as const;
export interface EvidenceDecision { field: Field; included: boolean; reason: 'identity'|'financial'|'unrelated' }
export function evidenceDecisions(docs: ReviewDocument[], purpose: Purpose): EvidenceDecision[] {
  return docs.flatMap(doc=>Object.values(doc.fields).filter((f):f is Field=>!!f).map(field=>{
    const identity=field.field==='name';
    const financial=doc.template==='bank-statement-v1' ? ['account','balance','currency','period_start','period_end'].includes(field.field)
      : doc.template==='client-intake-v1' && ['account','balance','currency','as_of'].includes(field.field);
    return {field,included:purpose==='financial-resources'&&(identity||financial),reason:identity?'identity':financial?'financial':'unrelated'};
  }));
}
function visaChecks(docs: ReviewDocument[]): Finding[] {
  const visa=docs.find(d=>d.template==='schengen-de-demo-v1')!;
  const bank=docs.find(d=>d.template==='bank-statement-v1');
  const fields=Object.values(visa.fields).filter((f):f is Field=>!!f), missing=fields.filter(f=>f.status==='absent').map(f=>f.field);
  const findings:Finding[]=[{id:'visa_fields',label:'Selected visa fields',status:missing.length?'absent':fields.some(f=>f.status==='needs_review')?'needs_review':'consistent',
    explanation:missing.length?'Selected adult-tourism sample fields are missing. Check the source; this is not a complete official checklist.':'Selected sample fields are present. Conditional fields, checkboxes and signatures are outside this adapter.',evidence:fields,missing}];
  const dates=['birth_date','passport_issued','passport_expires','arrival','departure'].map(k=>visa.fields[k as keyof typeof visa.fields]!);
  const dateMissing=dates.filter(f=>f.status==='absent').map(f=>f.field);
  const valid=dates.every(f=>f.status==='extracted') && visa.fields.birth_date!.value<visa.fields.passport_issued!.value
    && visa.fields.passport_issued!.value<=visa.fields.arrival!.value && visa.fields.arrival!.value<=visa.fields.departure!.value
    && visa.fields.departure!.value<=visa.fields.passport_expires!.value;
  findings.push({id:'visa_dates',label:'Visa date ordering',status:dateMissing.length?'absent':valid?'consistent':'needs_review',
    explanation:valid?'Selected dates are ordered under the sample policy. No visa eligibility conclusion is made.':'Missing, ambiguous or reversed dates require a source check. No visa eligibility conclusion is made.',evidence:dates,missing:dateMissing});
  if(bank){
    const a=visa.fields.name!, b=bank.fields.name!;
    const status=[a,b].some(f=>f.status==='absent')?'absent':[a,b].some(f=>f.status==='needs_review')?'needs_review':a.normalized===b.normalized?'consistent':'conflicting';
    findings.push({id:'name',label:'Applicant / account holder',status,explanation:status==='consistent'?'Both values match after spacing and case normalization.':'Applicant and account-holder information needs human review. Compare both original passages.',evidence:[a,b],missing:status==='absent'?['name']:[]});
    const required=['name','address','account','balance','currency','period_start','period_end'].map(k=>bank.fields[k as keyof typeof bank.fields]!);
    const absent=required.filter(f=>f.status==='absent').map(f=>f.field);
    const invalid=required.some(f=>f.status==='needs_review')||bank.fields.period_start!.value>bank.fields.period_end!.value;
    findings.push({id:'statement_fields',label:'Statement required fields',status:absent.length?'absent':invalid?'needs_review':'consistent',explanation:absent.length?'Required sample workflow information is missing.':invalid?'One or more fields need human review.':'The sample workflow fields are present.',evidence:required,missing:absent});
  }
  return findings;
}
export function reviewCase(docs: ReviewDocument[],purpose: Purpose='consistency-review'): Finding[] {
  const visa=docs.some(d=>d.template==='schengen-de-demo-v1');
  if(visa && (docs.length>2 || docs.some(d=>d.template==='client-intake-v1')))return [];
  const findings=visa?visaChecks(docs):compareDocuments(docs);
  if(!findings.length || purpose!=='financial-resources')return findings;
  const selected=evidenceDecisions(docs,purpose).filter(d=>d.included).map(d=>d.field);
  const bank=docs.find(d=>d.template==='bank-statement-v1');
  let status:Finding['status']='needs_review';
  if(!bank || selected.some(f=>f.status==='absent'))status='absent';
  else if(findings.find(f=>f.id==='name')?.status==='conflicting')status='conflicting';
  else if(selected.every(f=>f.status==='extracted'&&f.confirmed) && findings.find(f=>f.id==='name')?.status==='consistent'){
    const fields=bank.fields;const end=fields.period_end!.value.trim(), start=fields.period_start!.value.trim();
    const age=(Date.parse(DEMO_POLICY.reviewDate)-Date.parse(end))/86400000;
    const [whole,fraction='']=fields.balance!.value.trim().split('.');
    const enough=BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'))>=DEMO_POLICY.thresholdCents;
    const comparable=visa || findings.find(f=>f.id==='balance')?.status==='consistent';
    if(start<=end && age>=0 && age<=DEMO_POLICY.maxAgeDays && fields.currency!.value.trim()===DEMO_POLICY.currency && comparable)
      status=enough?'consistent':'needs_review';
  }
  findings.push({id:'proof_resources',label:'Prove Financial Resources',status,
    explanation:status==='consistent'?'Confirmed evidence meets the fictional financial sample policy. This is not proof of visa eligibility.':'Financial evidence is missing, conflicting, unconfirmed or does not meet the fictional sample policy. Human review is required.',
    evidence:selected,missing:status==='absent'?(selected.some(f=>f.status==='absent')?[...new Set(selected.filter(f=>f.status==='absent').map(f=>f.field))]:['balance']):[]});
  return findings;
}
