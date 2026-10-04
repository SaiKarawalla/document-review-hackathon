export const FIELD_NAMES = ['name', 'address', 'applicant_id', 'account', 'balance', 'currency', 'as_of', 'period_start', 'period_end', 'birth_date', 'passport', 'passport_issued', 'passport_expires', 'arrival', 'departure', 'destination'] as const;
export type FieldName = typeof FIELD_NAMES[number];
export type Template = 'client-intake-v1' | 'bank-statement-v1' | 'schengen-de-demo-v1';
export type ExtractionStatus = 'extracted' | 'absent' | 'needs_review';
export interface Field {
  documentId: string; template: Template; field: FieldName;
  raw: string; normalized: string; value: string; page: number | null;
  excerpt: string; status: ExtractionStatus; confirmed: boolean; corrected: boolean;
}
export interface ReviewDocument {
  id: string; template: Template; filename: string; pages: number;
  fields: Partial<Record<FieldName, Field>>;
}
export interface SourceLine { text: string; page: number }
export const LIMITS = { bytes: 5 * 1024 * 1024, pages: 10, text: 100_000, timeout: 15_000 };
export const LABELS: Record<FieldName, string> = {
  name: 'Name', address: 'Mailing address', applicant_id: 'Applicant ID', account: 'Account number',
  balance: 'Balance', currency: 'Currency', as_of: 'Balance as of', period_start: 'Period start', period_end: 'Period end',
  birth_date: 'Birth date', passport: 'Travel document number', passport_issued: 'Travel document issued', passport_expires: 'Travel document expires', arrival: 'Arrival date', departure: 'Departure date', destination: 'Destination',
};
export const TEMPLATE_FIELDS: Record<Template, Partial<Record<FieldName, string>>> = {
  'client-intake-v1': { name: 'Applicant name', address: 'Mailing address', applicant_id: 'Applicant ID', account: 'Supporting account', balance: 'Declared balance', currency: 'Declared currency', as_of: 'Balance as of' },
  'bank-statement-v1': { name: 'Account holder', address: 'Statement mailing address', account: 'Account number', balance: 'Closing balance', currency: 'Account currency', period_start: 'Period start', period_end: 'Period end' },
  'schengen-de-demo-v1': {}, // Coordinate adapter in visa.ts; never accepted by marker-only parsing.
};
export function normalize(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US');
}
export function validISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function fieldStatus(field: FieldName, value: string): ExtractionStatus {
  if (!value.trim()) return 'absent';
  if (value.length > 300 || /[\u0000-\u001f]/.test(value)) return 'needs_review';
  if (['as_of', 'period_start', 'period_end', 'birth_date', 'passport_issued', 'passport_expires', 'arrival', 'departure'].includes(field) && !validISODate(value.trim())) return 'needs_review';
  if (field === 'balance' && !/^\d+(\.\d{1,2})?$/.test(value.trim())) return 'needs_review';
  if (field === 'currency' && !/^[A-Z]{3}$/.test(value.trim())) return 'needs_review';
  return 'extracted';
}
export function parseLines(lines: SourceLine[], id: string, filename: string, pages: number): ReviewDocument {
  if (!lines.some(l => l.text === 'SYNTHETIC DEMO - NOT AN OFFICIAL DOCUMENT'))
    throw new Error('Unsupported document: the synthetic template notice is missing. Only the two sample v1 formats are supported.');
  const markers = lines.filter(l => /^Template:/.test(l.text));
  if (markers.length !== 1) throw new Error('Unsupported document: expected one unambiguous template/version marker.');
  const template = markers[0].text.slice('Template:'.length).trim() as Template;
  if (!Object.hasOwn(TEMPLATE_FIELDS, template) || template === 'schengen-de-demo-v1') throw new Error('Unsupported template or version. Use client-intake-v1, bank-statement-v1 or the supported Schengen demo layout.');
  const structure = template === 'client-intake-v1' ? ['CLIENT INTAKE', 'APPLICANT DETAILS', 'FINANCIAL DECLARATION'] : ['BANK STATEMENT', 'ACCOUNT PROFILE', 'PERIOD SUMMARY'];
  if (!structure.every(s => lines.some(l => l.text === s))) throw new Error('Unsupported structure: template sections are missing. A marker alone is insufficient.');
  const fields: ReviewDocument['fields'] = {};
  for (const [key, label] of Object.entries(TEMPLATE_FIELDS[template])) {
    const field = key as FieldName;
    const matches = lines.filter(l => l.text.startsWith(label + ':'));
    const raw = matches.length === 1 ? matches[0].text.slice(label.length + 1).trim() : '';
    fields[field] = { documentId: id, template, field, raw, normalized: normalize(raw), value: raw,
      page: matches[0]?.page ?? null, excerpt: matches.length ? matches.map(m => m.text).join('\n') : `No "${label}" field was found in this document.`,
      status: matches.length > 1 ? 'needs_review' : fieldStatus(field, raw), confirmed: false, corrected: false };
  }
  return { id, template, filename, pages, fields };
}
export function correctField(doc: ReviewDocument, name: FieldName, value: string): ReviewDocument {
  const previous = doc.fields[name];
  if (!previous) throw new Error('Unsupported field');
  return { ...doc, fields: { ...doc.fields, [name]: { ...previous, value, normalized: normalize(value),
    status: fieldStatus(name, value), confirmed: true, corrected: value !== previous.raw } } };
}
export const STATUSES = ['consistent', 'conflicting', 'absent', 'needs_review', 'not_comparable'] as const;
export type FindingStatus = typeof STATUSES[number];
export const FINDING_IDS = ['name', 'address', 'account', 'balance', 'intake_fields', 'statement_fields', 'visa_fields', 'visa_dates', 'proof_resources'] as const;
export type FindingId = typeof FINDING_IDS[number];
export interface Finding {
  id: FindingId; label: string; status: FindingStatus; explanation: string; evidence: Field[];
  missing: FieldName[];
}
export function compareDocuments(documents: ReviewDocument[]): Finding[] {
  const intake = documents.find(d => d.template === 'client-intake-v1');
  const bank = documents.find(d => d.template === 'bank-statement-v1');
  if (!intake || !bank || documents.length !== 2) return [];
  const findings: Finding[] = [];
  for (const key of ['name', 'address', 'account'] as const) {
    const a = intake.fields[key]!; const b = bank.fields[key]!;
    const status: FindingStatus = [a, b].some(f => f.status === 'needs_review') ? 'needs_review'
      : [a, b].some(f => f.status === 'absent') ? 'absent' : a.normalized === b.normalized ? 'consistent' : 'conflicting';
    findings.push({ id: key, label: key === 'name' ? 'Applicant / account holder' : LABELS[key], status,
      explanation: status === 'consistent' ? 'Both values match after spacing and case normalization.'
        : status === 'conflicting' ? 'The values differ. Ask the client to confirm; a difference does not establish which document is correct.'
        : status === 'absent' ? 'A value is missing from at least one document.' : 'The extraction is ambiguous. Review the source and confirm a value.',
      evidence: [a, b], missing: status === 'absent' ? [key] : [] });
  }
  for (const [id, doc, required] of [
    ['intake_fields', intake, ['name', 'address']],
    ['statement_fields', bank, ['name', 'address', 'account', 'balance', 'currency', 'period_start', 'period_end']],
  ] as [FindingId, ReviewDocument, FieldName[]][]) {
    const fields = required.map(k => doc.fields[k]!);
    const missing = fields.filter(f => f.status === 'absent').map(f => f.field);
    const ambiguous = fields.filter(f => f.status === 'needs_review');
    const reversedPeriod = id === 'statement_fields' && !missing.includes('period_start') && !missing.includes('period_end')
      && !ambiguous.length && doc.fields.period_start!.value.trim() > doc.fields.period_end!.value.trim();
    findings.push({ id, label: id === 'intake_fields' ? 'Intake required fields' : 'Statement required fields',
      status: missing.length ? 'absent' : ambiguous.length || reversedPeriod ? 'needs_review' : 'consistent',
      explanation: missing.length ? `Sample workflow fields missing: ${missing.map(k => LABELS[k]).join(', ')}.`
        : reversedPeriod ? 'The statement period starts after it ends. Review both dates.' : ambiguous.length ? 'One or more fields need human review.' : 'The sample workflow fields are present.',
      evidence: missing.length ? fields.filter(f => f.status === 'absent') : ambiguous.length ? ambiguous : fields, missing });
  }
  const a = intake.fields; const b = bank.fields;
  const balanceEvidence = [a.balance!, b.balance!, a.account!, b.account!, a.currency!, b.currency!, a.as_of!, b.period_start!, b.period_end!];
  const comparable = balanceEvidence.every(f => f.status === 'extracted')
    && a.account!.normalized === b.account!.normalized && a.currency!.normalized === b.currency!.normalized
    && a.as_of!.value.trim() === b.period_end!.value.trim() && b.period_start!.value.trim() <= b.period_end!.value.trim();
  const cents = (v: string) => { const [whole, fraction = ''] = v.split('.'); return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0')); };
  const status = comparable ? cents(a.balance!.value.trim()) === cents(b.balance!.value.trim()) ? 'consistent' : 'conflicting' : 'not_comparable';
  findings.push({ id: 'balance', label: 'Declared / closing balance', status,
    explanation: comparable ? status === 'consistent' ? 'Balances match for the same account, currency and closing date.' : 'Balances differ for the same account, currency and closing date. Review both values.'
      : 'Not comparable: account, currency and an unambiguous as-of / closing date must match, and the statement period must be valid. Monthly income is never compared.',
    evidence: balanceEvidence, missing: [] });
  return findings;
}
