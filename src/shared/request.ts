import { z } from 'zod';
import { FIELD_NAMES, FINDING_IDS, STATUSES, type Finding, type ReviewDocument } from './documents';
const factSchema = z.strictObject({ id: z.enum(FINDING_IDS), status: z.enum(STATUSES), missing: z.array(z.enum(FIELD_NAMES)).max(9) });
export const contextSchema = z.strictObject({
  case: z.literal('CASE-A'),
  templates: z.tuple([z.literal('client-intake-v1'), z.literal('bank-statement-v1')]),
  findings: z.array(factSchema).length(6),
  confirmed_fields: z.number().int().min(0).max(16),
}).superRefine((v, ctx) => {
  if (new Set(v.findings.map(f => f.id)).size !== 6) ctx.addIssue({ code: 'custom', message: 'Expected every unique finding ID.' });
  for (const f of v.findings) {
    if (new Set(f.missing).size !== f.missing.length) ctx.addIssue({ code: 'custom', message: 'Duplicate missing field.' });
    const validStatuses = f.id === 'balance' ? ['consistent','conflicting','not_comparable'] : ['consistent','conflicting','absent','needs_review'];
    if (!validStatuses.includes(f.status) || (f.id.endsWith('_fields') && f.status === 'conflicting')) ctx.addIssue({ code: 'custom', message: 'Invalid status for this finding.' });
    const allowedMissing = f.id === 'intake_fields' ? ['name', 'address'] : f.id === 'statement_fields' ? ['name','address','account','balance','currency','period_start','period_end'] : [f.id];
    if (f.missing.some(k => !allowedMissing.includes(k)) || (f.status === 'absent') !== (f.missing.length > 0)) ctx.addIssue({ code: 'custom', message: 'Invalid missing-field relationship.' });
  }
});
export type ReducedContext = z.infer<typeof contextSchema>;
export function minimize(findings: Finding[], docs: ReviewDocument[]): ReducedContext {
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
export const summarySchema = z.strictObject({
  overview: z.enum(OVERVIEWS),
  findings: z.array(z.strictObject({ id: z.enum(FINDING_IDS), explanation: z.enum(allExplanations), follow_up: z.enum(allFollowUps) })).length(6),
});
export type ReviewSummary = z.infer<typeof summarySchema>;
export function validateSummary(value: unknown, context: ReducedContext): ReviewSummary {
  const summary = summarySchema.parse(value);
  if (new Set(summary.findings.map(f => f.id)).size !== 6) throw new Error('AI returned duplicate or missing finding IDs.');
  const expectedOverview = context.findings.every(f => f.status === 'consistent') ? OVERVIEWS[1] : OVERVIEWS[0];
  if (summary.overview !== expectedOverview) throw new Error('AI overview contradicts the deterministic findings.');
  for (const item of summary.findings) {
    const fact = context.findings.find(f => f.id === item.id)!;
    if (!(EXPLANATIONS[fact.status] as readonly string[]).includes(item.explanation) || !(FOLLOW_UPS[fact.status] as readonly string[]).includes(item.follow_up))
      throw new Error('AI explanation contradicts a finding or introduces an unsupported claim.');
  }
  return summary;
}
export function ruleSummary(context: ReducedContext): ReviewSummary {
  return { overview: context.findings.every(f => f.status === 'consistent') ? OVERVIEWS[1] : OVERVIEWS[0],
    findings: context.findings.map(f => ({ id: f.id, explanation: EXPLANATIONS[f.status][0], follow_up: FOLLOW_UPS[f.status][0] })) };
}
export interface RequestPreview {
  id: string; hash: string; serializedBody: string; destination: string; model: string; expiresAt: number;
}
