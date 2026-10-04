import { z } from 'zod';
import { FIELD_NAMES, FINDING_IDS, STATUSES, type Finding, type ReviewDocument } from './documents';
import type { Purpose } from './workflow';
import { photoContextSchema } from './photo';
const BASE_IDS=['name','address','account','balance','intake_fields','statement_fields'] as const;
const factSchema = z.strictObject({ id: z.enum(FINDING_IDS), status: z.enum(STATUSES), missing: z.array(z.enum(FIELD_NAMES)).max(16) });
const baselineSchema = z.strictObject({
  case: z.literal('CASE-A'),
  templates: z.tuple([z.literal('client-intake-v1'), z.literal('bank-statement-v1')]),
  findings: z.array(factSchema).length(6),
  confirmed_fields: z.number().int().min(0).max(16),
}).superRefine((v, ctx) => {
  if (new Set(v.findings.map(f => f.id)).size !== 6) ctx.addIssue({ code: 'custom', message: 'Expected every unique finding ID.' });
  for (const f of v.findings) {
    if(!(BASE_IDS as readonly string[]).includes(f.id))ctx.addIssue({code:'custom',message:'Unsupported baseline finding.'});
    if (new Set(f.missing).size !== f.missing.length) ctx.addIssue({ code: 'custom', message: 'Duplicate missing field.' });
    const validStatuses = f.id === 'balance' ? ['consistent','conflicting','not_comparable'] : ['consistent','conflicting','absent','needs_review'];
    if (!validStatuses.includes(f.status) || (f.id.endsWith('_fields') && f.status === 'conflicting')) ctx.addIssue({ code: 'custom', message: 'Invalid status for this finding.' });
    const allowedMissing = f.id === 'intake_fields' ? ['name', 'address'] : f.id === 'statement_fields' ? ['name','address','account','balance','currency','period_start','period_end'] : [f.id];
    if (f.missing.some(k => !allowedMissing.includes(k)) || (f.status === 'absent') !== (f.missing.length > 0)) ctx.addIssue({ code: 'custom', message: 'Invalid missing-field relationship.' });
  }
});
const workflowSchema=z.strictObject({
  case:z.literal('CASE-A'),templates:z.array(z.enum(['client-intake-v1','bank-statement-v1','schengen-de-demo-v1'])).min(1).max(2),
  purpose:z.enum(['consistency-review','financial-resources']),policy:z.literal('adult-tourism-demo-v1'),
  findings:z.array(factSchema).min(2).max(7),confirmed_fields:z.number().int().min(0).max(16),
}).superRefine((v,ctx)=>{
  const visa=v.templates.includes('schengen-de-demo-v1');
  if(new Set(v.templates).size!==v.templates.length || (!visa&&(v.templates.join(',')!=='client-intake-v1,bank-statement-v1'||v.purpose!=='financial-resources')) || (visa&&v.templates.some(t=>t==='client-intake-v1')))
    ctx.addIssue({code:'custom',message:'Unsupported workflow documents.'});
  const expected=visa?['visa_fields','visa_dates',...(v.templates.includes('bank-statement-v1')?['name','statement_fields']:[])]:[...BASE_IDS];
  if(v.purpose==='financial-resources')expected.push('proof_resources');
  if(v.findings.length!==expected.length || new Set(v.findings.map(f=>f.id)).size!==expected.length || v.findings.some(f=>!expected.includes(f.id)))
    ctx.addIssue({code:'custom',message:'Expected each supported workflow finding exactly once.'});
  const allowed:Record<string,readonly string[]>={name:['name'],address:['address'],account:['account'],balance:[],intake_fields:['name','address'],statement_fields:['name','address','account','balance','currency','period_start','period_end'],visa_fields:['name','birth_date','passport','passport_issued','passport_expires','destination','arrival','departure'],visa_dates:['birth_date','passport_issued','passport_expires','arrival','departure'],proof_resources:['name','account','balance','currency','as_of','period_start','period_end']};
  for(const f of v.findings){
    const statuses=f.id==='balance'?['consistent','conflicting','not_comparable']:f.id.endsWith('_fields')||f.id==='visa_dates'?['consistent','absent','needs_review']:['consistent','conflicting','absent','needs_review'];
    if(!statuses.includes(f.status)||new Set(f.missing).size!==f.missing.length||f.missing.some(k=>!allowed[f.id]?.includes(k))||(f.status==='absent')!==(f.missing.length>0))
      ctx.addIssue({code:'custom',message:'Invalid workflow finding relationship.'});
  }
});
export const contextSchema=z.union([baselineSchema,workflowSchema,photoContextSchema]);
export type ReducedContext = z.infer<typeof contextSchema>;
export function minimize(findings: Finding[], docs: ReviewDocument[],purpose: Purpose='consistency-review'): ReducedContext {
  if(purpose==='financial-resources'||docs.some(d=>d.template==='schengen-de-demo-v1'))return contextSchema.parse({case:'CASE-A',templates:docs.map(d=>d.template).sort((a,b)=>a==='client-intake-v1'?-1:b==='client-intake-v1'?1:a.localeCompare(b)),purpose,policy:'adult-tourism-demo-v1',
    findings:findings.map(f=>({id:f.id,status:f.status,missing:f.missing})),confirmed_fields:docs.flatMap(d=>Object.values(d.fields)).filter(f=>f?.confirmed).length});
  return contextSchema.parse({ case: 'CASE-A', templates: ['client-intake-v1', 'bank-statement-v1'],
    findings: findings.map(f => ({ id: f.id, status: f.status, missing: f.missing })),
    confirmed_fields: docs.flatMap(d => Object.values(d.fields)).filter(f => f?.confirmed).length });
}
export const EXPLANATIONS = {
  consistent: ['The compared information is consistent.', 'This check found no difference in the available information.'],
  conflicting: ['The documents contain different information; human review is needed.', 'This difference needs clarification and does not show which document is correct.'],
  absent: ['Required sample workflow information is missing.', 'A missing value prevents a complete consistency review.'],
  needs_review: ['The available information needs human confirmation.', 'Ambiguous extraction or dates require a source check.'],
  not_comparable: ['The balance cannot be compared with the available account, currency and date context.', 'No balance conclusion can be drawn until comparable context is confirmed.'],
} as const;
export const FOLLOW_UPS = {
  consistent: ['Keep the source evidence for the human review.'],
  conflicting: ['Ask the client to confirm the current information.', 'Review both source passages before making a correction.'],
  absent: ['Request the missing information from the client.'],
  needs_review: ['Check the original page and confirm the extracted fields.'],
  not_comparable: ['Confirm the same account, currency and as-of date before comparing balances.'],
} as const;
export const OVERVIEWS = ['Some checks need human review before this case is considered complete.', 'The available consistency checks are complete with no differences found.'] as const;
const allExplanations = Object.values(EXPLANATIONS).flat();
const allFollowUps = Object.values(FOLLOW_UPS).flat();
export const PHOTO_EXPLANATIONS={consistent:['The selected fields were read from the visible part of the photo.','The reviewer confirmed the visible OCR text.'],needs_review:['Some selected fields were not read; they may be covered, absent or unclear.','Photo text needs human confirmation; OCR can make mistakes.']} as const;
export const PHOTO_FOLLOW_UPS={consistent:['Keep the covered areas private and review the visible source.'],needs_review:['Review the visible text or retake a clearer photo. Do not uncover private details just to complete a check.']} as const;
export function allowedSentences(context:ReducedContext,fact:ReducedContext['findings'][number]){
  if('source' in context){
    const status=fact.status==='consistent'?'consistent':'needs_review';
    return {explanation:[PHOTO_EXPLANATIONS[status][fact.id==='photo_quality'?1:0]],follow_up:PHOTO_FOLLOW_UPS[status]};
  }
  return {explanation:EXPLANATIONS[fact.status],follow_up:FOLLOW_UPS[fact.status]};
}
export const summarySchema = z.strictObject({
  overview: z.enum(OVERVIEWS),
  findings: z.array(z.strictObject({ id: z.enum(FINDING_IDS), explanation: z.enum([...allExplanations,...Object.values(PHOTO_EXPLANATIONS).flat()]), follow_up: z.enum([...allFollowUps,...Object.values(PHOTO_FOLLOW_UPS).flat()]) })).min(2).max(7),
});
export type ReviewSummary = z.infer<typeof summarySchema>;
export function validateSummary(value: unknown, context: ReducedContext): ReviewSummary {
  const summary = summarySchema.parse(value);
  if (summary.findings.length!==context.findings.length || new Set(summary.findings.map(f => f.id)).size !== context.findings.length || summary.findings.some(f=>!context.findings.some(c=>c.id===f.id))) throw new Error('AI returned duplicate, unsupported or missing finding IDs.');
  const expectedOverview = context.findings.every(f => f.status === 'consistent') ? OVERVIEWS[1] : OVERVIEWS[0];
  if (summary.overview !== expectedOverview) throw new Error('AI overview contradicts the deterministic findings.');
  for (const item of summary.findings) {
    const fact = context.findings.find(f => f.id === item.id)!;
    const allowed=allowedSentences(context,fact);
    if (!(allowed.explanation as readonly string[]).includes(item.explanation) || !(allowed.follow_up as readonly string[]).includes(item.follow_up))
      throw new Error('AI explanation contradicts a finding or introduces an unsupported claim.');
  }
  return summary;
}
export function ruleSummary(context: ReducedContext): ReviewSummary {
  return { overview: context.findings.every(f => f.status === 'consistent') ? OVERVIEWS[1] : OVERVIEWS[0],
    findings: context.findings.map(f => ({ id: f.id, explanation: allowedSentences(context,f).explanation[0], follow_up: allowedSentences(context,f).follow_up[0] })) };
}
export interface RequestPreview {
  id: string; hash: string; serializedBody: string; destination: string; model: string; expiresAt: number;
}
