import { describe, expect, it, beforeAll } from 'vitest';
import { compareDocuments, correctField, parseLines, TEMPLATE_FIELDS, type FieldName, type FindingId, type FindingStatus, type ReviewDocument } from '../src/shared/documents';
import { minimize } from '../src/shared/request';
import expected from '../public/fixtures/expected.json';
import { pair, fixture } from './helpers';
describe('Actual PDF fixtures, predeclared outcomes', () => {
  for (const [scenario, checks] of Object.entries(expected)) it(scenario, async () => {
    const docs = await pair(scenario); const findings = compareDocuments(docs);
    for (const [id, status] of Object.entries(checks)) expect(findings.find(f => f.id === id)?.status).toBe(status);
    expect(docs[0].template).toBe('client-intake-v1'); expect(docs[1].template).toBe('bank-statement-v1');
    expect(docs[0].fields.name?.page).toBe(1);
    expect(docs[1].fields.account?.excerpt).toContain('DEMO-ACCT-0042');
  });
  it.each([['unsupported-version.pdf', /Unsupported template/], ['scanned.pdf', /no readable text layer/], ['too-many-pages.pdf', /Too many pages/], ['malformed.pdf', /Invalid PDF/], ['encrypted.pdf', /password/i], ['encrypted-blank-password.pdf', /Encrypted PDFs/]])('rejects %s', async (file, message) => { await expect(fixture(file as string)).rejects.toThrow(message as RegExp); });
  it('filename cannot set findings', async () => {
    const docs = await pair('address-conflict'); docs.forEach(d => d.filename = 'matching.pdf');
    expect(compareDocuments(docs).find(f => f.id === 'address')?.status).toBe('conflicting');
  });
  it('correction recomputes while preserving original source', async () => {
    const docs = await pair('address-conflict'); const raw = docs[1].fields.address!.raw;
    const corrected = correctField(docs[1], 'address', docs[0].fields.address!.value);
    expect(compareDocuments([docs[0], corrected]).find(f => f.id === 'address')?.status).toBe('consistent');
    expect(corrected.fields.address).toMatchObject({ raw, corrected: true, confirmed: true, page: 1 });
    expect(corrected.fields.address!.excerpt).toContain('82 Imaginary Avenue');
  });
  it('malicious raw text cannot reach minimized facts', async () => {
    const docs = await pair('malicious-text'); const body = JSON.stringify(minimize(compareDocuments(docs), docs));
    for (const literal of ['Avery', 'Fiction', 'DEMO-ACCT', 'DEMO-APPLICANT', 'DEMO-PASSPORT', '4200', '2026-09', 'exfiltration', 'Reviewer notes', '.pdf']) expect(body).not.toContain(literal);
  });
});
// Expected field cases defined independently before running comparisons.
const fieldCases: [string, number, FieldName, string, FindingId, FindingStatus][] = [
  ['case-insensitive name',1,'name','AVERY EXAMPLE','name','consistent'],
  ['spacing normalization',1,'name','  Avery   Example  ','name','consistent'],
  ['meaningful name difference',1,'name','Avery Examples','name','conflicting'],
  ['punctuation preserved',1,'name','Avery-Example','name','conflicting'],
  ['missing name',1,'name','','name','absent'],
  ['missing intake address',0,'address','','address','absent'],
  ['different apartment',1,'address','14 Fiction Lane Apt 2, Sampleton, ZZ 00000','address','conflicting'],
  ['address case and space',1,'address','14 FICTION LANE,  Sampleton, ZZ 00000','address','consistent'],
  ['missing account',1,'account','','account','absent'],
  ['different account',1,'account','DEMO-ACCT-9999','balance','not_comparable'],
  ['different currency',1,'currency','EUR','balance','not_comparable'],
  ['missing currency',1,'currency','','statement_fields','absent'],
  ['ambiguous date',0,'as_of','09/30/2026','balance','not_comparable'],
  ['invalid calendar date',0,'as_of','2026-02-30','balance','not_comparable'],
  ['different date',0,'as_of','2026-09-29','balance','not_comparable'],
  ['different balance with comparable context',0,'balance','4201.00','balance','conflicting'],
  ['whole amount equals decimal',0,'balance','4200','balance','consistent'],
  ['invalid amount',0,'balance','$4200','balance','not_comparable'],
  ['reversed period',1,'period_start','2026-10-01','statement_fields','needs_review'],
  ['missing closing balance',1,'balance','','statement_fields','absent'],
];
describe('20 synthetic field-level cases', () => {
  let docs: ReviewDocument[]; beforeAll(async () => { docs = await pair(); });
  it.each(fieldCases)('%s', (_label, index, field, value, finding, expectedStatus) => {
    const changed = docs.map((doc,i) => i === index ? correctField(doc,field,value) : doc);
    expect(compareDocuments(changed).find(f=>f.id===finding)?.status).toBe(expectedStatus);
  });
});
describe('template validation', () => {
  function lines(template = 'client-intake-v1') { return ['SYNTHETIC DEMO - NOT AN OFFICIAL DOCUMENT', `Template: ${template}`, 'CLIENT INTAKE','APPLICANT DETAILS','FINANCIAL DECLARATION', ...Object.values(TEMPLATE_FIELDS['client-intake-v1']).map(label=>label+': Avery Example')].map(text=>({text,page:1})); }
  it('a marker alone is insufficient',()=>expect(()=>parseLines(lines().filter(l=>!l.text.includes('DETAILS')),'x','x.pdf',1)).toThrow('structure'));
  it('duplicate field values need review',()=>expect(parseLines([...lines(),{text:'Applicant name: Jordan',page:1}],'x','x.pdf',1).fields.name?.status).toBe('needs_review'));
  it('duplicate template markers rejected',()=>expect(()=>parseLines([...lines(),{text:'Template: bank-statement-v1',page:1}],'x','x.pdf',1)).toThrow('unambiguous'));
  it('prototype names cannot act as templates',()=>expect(()=>parseLines(lines('__proto__'),'x','x.pdf',1)).toThrow('Unsupported template'));
});
