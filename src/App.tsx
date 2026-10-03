import { lazy, Suspense, useEffect, useRef, useState, type DragEvent } from 'react';
import { ArrowRight, Check, CheckCircle2, ChevronDown, FileText, Fingerprint, LockKeyhole, RotateCcw, ShieldCheck, Upload, X, AlertTriangle, Eye, LoaderCircle, CircleHelp } from 'lucide-react';
import { compareDocuments, correctField, LABELS, type Field, type FieldName, type Finding, type FindingStatus, type ReviewDocument } from './shared/documents';
import { minimize, ruleSummary, type RequestPreview, type ReviewSummary } from './shared/request';
import { parsePdf } from './parsePdf';
const PdfPage = lazy(() => import('./PdfPage').then(module => ({ default: module.PdfPage })));
const API = import.meta.env.DEV ? 'http://127.0.0.1:8787' : '';
const CASES = [{ id: 'address-conflict', label: 'Address conflict', detail: 'Two addresses, one review' }, { id: 'matching', label: 'Matching documents', detail: 'All comparable checks agree' }, { id: 'missing-field', label: 'Missing information', detail: 'Statement address left blank' }, { id: 'malicious-text', label: 'Embedded instruction', detail: 'Untrusted notes stay local' }];
const STATUS_LABEL: Record<FindingStatus, string> = { consistent: 'Consistent', conflicting: 'Conflict', absent: 'Missing', needs_review: 'Needs review', not_comparable: 'Not comparable' };
type LocalDocument = ReviewDocument & { url: string };
type Health = { available: boolean; model: string; destination: string; message: string };
type Result = { summary: ReviewSummary; source: 'ollama' | 'rules'; model?: string; latencyMs?: number; requestHash?: string };
async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(API + '/api/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Document-Review': '1' }, body: JSON.stringify(body), signal });
  const data = await response.json(); if (!response.ok) throw new Error(data.error ?? 'The local server could not complete the request.'); return data as T;
}
function StatusIcon({ status }: { status: FindingStatus }) { return status === 'consistent' ? <CheckCircle2 size={17} /> : status === 'conflicting' || status === 'absent' ? <AlertTriangle size={17} /> : <CircleHelp size={17} />; }

export default function App() {
  const [docs, setDocs] = useState<LocalDocument[]>([]); const docsRef = useRef<LocalDocument[]>([]);
  const [scenario, setScenario] = useState('address-conflict'); const [busy, setBusy] = useState('');
  const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [health, setHealth] = useState<Health>(); const [preview, setPreview] = useState<RequestPreview>();
  const previewRef = useRef<RequestPreview | undefined>(undefined);
  const [result, setResult] = useState<Result>(); const [approved, setApproved] = useState(false);
  const [edit, setEdit] = useState<{ id: string; field: FieldName; value: string }>();
  const [evidence, setEvidence] = useState<{ doc: LocalDocument; field?: Field }>();
  const dialog = useRef<HTMLDialogElement>(null); const input = useRef<HTMLInputElement>(null);
  const operation = useRef<AbortController | undefined>(undefined); const revision = useRef(0);
  const findings = compareDocuments(docs); const context = findings.length ? minimize(findings, docs) : undefined;
  const issues = findings.filter(f => f.status !== 'consistent'); const consistent = findings.filter(f => f.status === 'consistent');

  const checkHealth = async () => { try { const res = await fetch(API + '/api/health'); setHealth(await res.json() as Health); } catch { setHealth({ available: false, model: 'qwen2.5:1.5b', destination: 'http://127.0.0.1:11434/api/generate', message: 'Local backend unavailable. Start the app with npm run dev.' }); } };
  useEffect(() => { void checkHealth(); return () => { operation.current?.abort(); docsRef.current.forEach(d => URL.revokeObjectURL(d.url)); }; }, []);
  useEffect(() => { if (evidence) dialog.current?.showModal(); else dialog.current?.close(); }, [evidence]);
  const replaceDocs = (next: LocalDocument[]) => { docsRef.current = next; setDocs(next); };
  function invalidate(message = '') {
    revision.current++; operation.current?.abort();
    const p = previewRef.current; if (p) void post('cancel', { id: p.id }).catch(() => {});
    previewRef.current = undefined; setPreview(undefined); setResult(undefined); setApproved(false); setNotice(message); setBusy('');
  }
  function reset() { invalidate(); docsRef.current.forEach(d => URL.revokeObjectURL(d.url)); replaceDocs([]); setEvidence(undefined); setEdit(undefined); setError(''); if (input.current) input.current.value = ''; }
  async function loadFiles(files: File[], replace = false) {
    if (busy) return;
    const current = replace ? [] : docsRef.current;
    if (!files.length) return;
    if (current.length + files.length > 2) { setError('A case supports two PDFs. Reset or load a demo pair to start a new case.'); return; }
    invalidate(); setError(''); setBusy('Parsing PDFs locally…'); const rev = revision.current;
    const controller = new AbortController(); operation.current = controller; const added: LocalDocument[] = []; let committed = false;
    try {
      for (const file of files) {
        const doc = await parsePdf(file, controller.signal);
        if (controller.signal.aborted || rev !== revision.current) return;
        if ([...current, ...added].some(d => d.template === doc.template)) throw new Error('Choose one client intake and one bank statement. This template is already in the case.');
        added.push({ ...doc, url: URL.createObjectURL(file) });
      }
      if (replace) docsRef.current.forEach(d => URL.revokeObjectURL(d.url));
      replaceDocs([...current, ...added]); committed = true;
      setNotice('PDFs parsed in this browser. No document content was uploaded.');
    } catch (e) { if (rev === revision.current) setError((e as Error).message); }
    finally { if (!committed) added.forEach(d => URL.revokeObjectURL(d.url)); if (rev === revision.current) { setBusy(''); operation.current = undefined; } }
  }
  async function loadDemo() {
    if (busy) return;
    setError(''); const controller = new AbortController(); operation.current = controller; setBusy('Loading synthetic PDFs…'); const rev = revision.current;
    try {
      const files = await Promise.all(['intake', 'statement'].map(async kind => {
        const response = await fetch(`/fixtures/${scenario}-${kind}.pdf`, { signal: controller.signal });
        if (!response.ok) throw new Error('Demo PDF unavailable. Run npm run fixtures.');
        return new File([await response.blob()], `${scenario}-${kind}.pdf`, { type: 'application/pdf' });
      }));
      if (controller.signal.aborted || rev !== revision.current) return;
      setBusy(''); operation.current = undefined;
      await loadParsedDemo(files);
    } catch (e) { if (rev === revision.current) { setError((e as Error).message); setBusy(''); } }
  }
  async function loadParsedDemo(files: File[]) {
    invalidate(); setBusy('Parsing synthetic PDFs locally…'); const rev = revision.current; const controller = new AbortController(); operation.current = controller;
    const added: LocalDocument[] = []; let committed = false;
    try {
      for (const file of files) {
        const doc = await parsePdf(file, controller.signal);
        if (controller.signal.aborted || rev !== revision.current) return;
        added.push({ ...doc, url: URL.createObjectURL(file) });
      }
      docsRef.current.forEach(d => URL.revokeObjectURL(d.url)); replaceDocs(added); committed = true; setEvidence(undefined); setEdit(undefined);
      setNotice('Synthetic PDFs parsed locally. Findings come from their contents.');
    } catch (e) { if (rev === revision.current) setError((e as Error).message); }
    finally { if (!committed) added.forEach(d => URL.revokeObjectURL(d.url)); if (rev === revision.current) { setBusy(''); operation.current = undefined; } }
  }
  function saveEdit() {
    if (!edit) return;
    invalidate('Value confirmed. Findings recomputed; previous request and summary cleared.');
    replaceDocs(docsRef.current.map(d => d.id === edit.id ? { ...correctField(d, edit.field, edit.value), url: d.url } : d)); setEdit(undefined); setError('');
  }
  async function createPreview() {
    if (!context || busy) return;
    invalidate(); setError(''); setBusy('Preparing the exact request…'); const rev = revision.current;
    const controller = new AbortController(); operation.current = controller;
    try { const p = await post<RequestPreview>('preview', context, controller.signal); if (rev === revision.current) { previewRef.current = p; setPreview(p); } else void post('discard', { id: p.id }).catch(() => {}); }
    catch (e) { if (rev === revision.current) setError((e as Error).message); }
    finally { if (rev === revision.current) { setBusy(''); operation.current = undefined; } }
  }
  async function send() {
    if (!preview || !approved || busy) return;
    setError(''); setResult(undefined); setBusy('Local AI is reviewing reduced facts…'); const rev = revision.current;
    const controller = new AbortController(); operation.current = controller;
    try { const response = await post<Result>('send', { id: preview.id, hash: preview.hash }, controller.signal); if (rev === revision.current) { setResult(response); setNotice('A real Ollama response passed schema and finding checks.'); } }
    catch (e) { if (rev === revision.current) { setError((e as Error).message); void checkHealth(); } }
    finally { if (rev === revision.current) { setBusy(''); setApproved(false); operation.current = undefined; previewRef.current = undefined; setPreview(undefined); } }
  }
  function fallback() { if (!context) return; invalidate(); setResult({ source: 'rules', summary: ruleSummary(context) }); setNotice('Rule-based summary. No AI response was generated.'); }
  function drop(e: DragEvent) { e.preventDefault(); void loadFiles(Array.from(e.dataTransfer.files)); }
  function source(field: Field) { const doc = docs.find(d => d.id === field.documentId); if (doc) setEvidence({ doc, field }); }
  function findingCard(f: Finding) {
    return <article className={`finding ${f.status}`} key={f.id}><div className="finding-heading"><span className="status-icon"><StatusIcon status={f.status} /></span><h3>{f.label}</h3><span className={`badge ${f.status}`}>{STATUS_LABEL[f.status]}</span></div><p>{f.explanation}</p>
      {f.status !== 'consistent' && <div className="source-pair">{f.evidence.slice(0,2).map((field,i)=><div key={field.documentId+field.field+i}><span>{field.template === 'client-intake-v1' ? 'INTAKE' : 'STATEMENT'}{field.page ? ` · PAGE ${field.page}` : ' · ABSENT'}</span><blockquote>{field.excerpt}</blockquote>{field.corrected && <p>Confirmed correction: {field.value || 'Not supplied'}</p>}</div>)}</div>}
      <div className="evidence-links">{f.evidence.slice(0, 2).map((field, i) => <button className="text-button" key={field.documentId + field.field + i} onClick={() => source(field)}><Eye size={14} />{field.template === 'client-intake-v1' ? 'Intake' : 'Statement'}{field.page ? ` · p. ${field.page}` : ' · field absent'}<ArrowRight size={13} /></button>)}</div></article>;
  }
  return <><header className="header"><a className="brand" href="#main"><span className="brand-icon"><FileText size={21}/></span>Document Review<span className="brand-divider"/><span className="workspace-label">Local workspace</span></a><div className="header-actions"><span className="local-pill"><span className="dot"/>Browser-local documents</span><button className="reset" onClick={reset}><RotateCcw size={15}/>Reset case</button></div></header>
  <main id="main"><section className="hero"><div><div className="eyebrow"><span className="small-rule"/>A CLEARER CASE REVIEW</div><h1>Find the gaps.<br/><span>Keep the details here.</span></h1><p>Compare sensitive paperwork with source evidence.<br className="desktop-break"/> Give local AI only the facts it needs to explain the findings.</p></div><aside className="hero-note"><ShieldCheck size={30}/><div><strong>Built around a smaller request.</strong><p>Your PDFs stay in this browser. Names, addresses and account numbers are excluded from the AI request.</p><span>Two supported formats · No case storage</span></div></aside></section>
  <section className="setup"><div className="section-heading"><div><span className="step">01</span><h2>Bring the documents together</h2></div><span className="muted">Synthetic demo · sample workflow</span></div><div className="setup-content"><div className="demo-loader"><label htmlFor="scenario">Try a complete review</label><div className="demo-controls"><select id="scenario" value={scenario} disabled={!!busy} onChange={e => setScenario(e.target.value)}>{CASES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select><button className="primary" disabled={!!busy} onClick={() => void loadDemo()}>Load demo pair<ArrowRight size={16}/></button></div><p>{CASES.find(c => c.id === scenario)?.detail}. Uses two real synthetic PDFs.</p></div><div className="drop-zone" onDragOver={e => e.preventDefault()} onDrop={drop}><Upload size={22}/><div><button className="text-button upload-button" disabled={!!busy || docs.length === 2} onClick={() => input.current?.click()}>Choose PDFs</button><span> or drop them here</span><p>Intake v1 + statement v1 · 5 MiB each · 10 pages each</p></div><input ref={input} type="file" accept=".pdf,application/pdf" multiple aria-label="Upload supported PDF documents" hidden onChange={e => { void loadFiles(Array.from(e.target.files ?? [])); e.target.value = ''; }}/></div></div></section>
  {busy && <div className="status-message" role="status"><LoaderCircle size={17} className="spin"/>{busy}<button className="text-button" onClick={() => invalidate('Operation cancelled. The parser or AI request was stopped.')}>Cancel</button></div>}
  {error && <div className="error-message" role="alert"><AlertTriangle size={18}/><span>{error}</span><button aria-label="Dismiss error" onClick={() => setError('')}><X size={16}/></button></div>}
  {notice && !busy && <div className="notice" role="status"><Check size={15}/>{notice}</div>}
  <section className="document-grid" aria-label="Case documents">{[0, 1].map(index => {
    const doc = docs.find(d => d.template === (index === 0 ? 'client-intake-v1' : 'bank-statement-v1'));
    return <article className={`document-card ${doc ? 'loaded' : ''}`} key={index}><div className="doc-top"><span className="document-icon"><FileText size={23}/></span><div><span className="doc-role">{index === 0 ? 'CLIENT DOCUMENT' : 'SUPPORTING DOCUMENT'}</span><h3>{index === 0 ? 'Client intake' : 'Bank statement'}</h3></div>{doc && <span className="badge consistent">Parsed locally</span>}</div>
      {doc ? <><div className="doc-meta"><span title={doc.filename}>{doc.filename}</span><button className="text-button" onClick={() => setEvidence({ doc })}><Eye size={14}/>View PDF</button></div><div className="fields">{(['name', 'address'] as FieldName[]).map(k => {
        const f = doc.fields[k]!; return <div className="field-row" key={k}><label>{LABELS[k]}</label><div><span className={f.status === 'absent' ? 'missing-value' : ''}>{f.value || 'Not supplied'}{f.confirmed && <Check size={13} aria-label="Confirmed"/>}</span><button className="text-button" onClick={() => { setEdit({ id: doc.id, field: k, value: f.value }); }}>Review</button></div></div>;
      })}</div><details className="other-fields"><summary>Account, dates & other extracted fields <ChevronDown size={14}/></summary>{Object.values(doc.fields).filter(f => f && !['name','address'].includes(f.field)).map(f => f && <div className="field-row" key={f.field}><label>{LABELS[f.field]}</label><div><span>{f.value || 'Not supplied'}{f.status === 'needs_review' && <span className="tiny-warning">needs review</span>}</span><button className="text-button" onClick={() => setEdit({ id: doc.id, field: f.field, value: f.value })}>Review</button></div></div>)}</details><div className="doc-footer"><LockKeyhole size={12}/>{doc.pages} page{doc.pages !== 1 && 's'} · {doc.template} · kept in browser memory</div></> : <div className="empty-document"><span>{index === 0 ? 'Start with the client’s intake form.' : 'Add the statement that supports it.'}</span><p>Load a demo pair or choose a supported PDF above.</p></div>}</article>;
  })}</section>
  {edit && <section className="edit-panel" aria-label="Confirm extracted value"><div><strong>Confirm {LABELS[edit.field].toLowerCase()}</strong><p>The original source remains unchanged. Your confirmed value is used in the comparison.</p></div><label className="sr-only" htmlFor="confirmed-value">Confirmed value</label><input id="confirmed-value" autoFocus maxLength={300} value={edit.value} onChange={e => setEdit({ ...edit, value: e.target.value })}/><button className="primary" onClick={saveEdit}>Confirm value<Check size={15}/></button><button className="secondary" onClick={() => setEdit(undefined)}>Cancel</button></section>}
  <div className="review-grid"><section className="findings-section"><div className="section-heading"><div><span className="step">02</span><h2>Review the differences</h2></div>{findings.length > 0 && <span className="count-label">{issues.length} to review</span>}</div><p className="section-description">Deterministic checks. Every finding links back to its source.</p>{findings.length ? <><div className="findings-list">{issues.map(findingCard)}</div><details className="consistent-group" open={issues.length === 0}><summary><CheckCircle2 size={17}/>{consistent.length} consistent checks<ChevronDown size={16}/></summary>{consistent.map(findingCard)}</details><p className="workflow-note">These are sample workflow rules. A difference calls for clarification; it does not determine correctness, authenticity or eligibility.</p></> : <div className="empty-state"><Fingerprint size={31}/><h3>The evidence comes first.</h3><p>Load one intake and one bank statement to compare names, addresses, required fields and comparable balances.</p></div>}</section>
  <section className="privacy-section"><div className="section-heading"><div><span className="step">03</span><h2>Inspect. Then explain.</h2></div><LockKeyhole size={18}/></div><p className="section-description">You decide when local AI receives the reduced facts.</p><div className="boundary"><div className="boundary-heading"><ShieldCheck size={19}/><strong>What the local AI receives</strong><span className="local-tag">LOCAL ONLY</span></div><div className="boundary-columns"><div><span className="boundary-label">INCLUDED</span><p><Check size={13}/>Case alias: CASE-A</p><p><Check size={13}/>Templates & comparison statuses</p><p><Check size={13}/>Missing field names & finding IDs</p></div><div><span className="boundary-label withheld">WITHHELD</span><p><LockKeyhole size={12}/>Names & literal addresses</p><p><LockKeyhole size={12}/>IDs, account numbers & amounts</p><p><LockKeyhole size={12}/>PDFs, raw text & source excerpts</p></div></div><div className="model-status"><span className={`dot ${health?.available ? '' : 'offline'}`}/><span>{health?.model ?? 'Checking local model…'}</span><button className="text-button" onClick={() => void checkHealth()}>{health?.available ? 'Ready · refresh' : 'Check connection'}</button></div>{health && !health.available && <p className="model-help">{health.message}</p>}
    {!preview && <button className="primary wide" disabled={!context || !!busy} onClick={() => void createPreview()}>Preview exact AI request<Eye size={16}/></button>}
    {preview && <div className="request-preview"><div className="request-meta"><span>Destination</span><code>{preview.destination}</code><span>SHA-256 · expires in 5 minutes</span><code className="hash">{preview.hash}</code></div><details open><summary>Full model-visible request body<ChevronDown size={14}/></summary><pre aria-label="Exact model request">{preview.serializedBody}</pre></details><p className="preview-note">This is the exact serialized request body that will be sent. The locally installed model also has its own template. Any edit clears this approval.</p><label className="approval"><input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)} disabled={!!busy}/>I reviewed this request and approve sending it to local Ollama.</label><button className="primary wide" disabled={!approved || !!busy} onClick={() => void send()}>Send approved request<ArrowRight size={16}/></button><button className="text-button" onClick={() => invalidate('Preview discarded.')}>Discard preview</button></div>}
    <p className="boundary-footnote">Source evidence stays available to you. This preview describes this request; it is not a guarantee against every possible leak.</p></div>
    {result && <article className="summary-result"><div className="summary-title"><CheckCircle2 size={19}/><h3>{result.source === 'ollama' ? 'Local AI explanation' : 'Rule-based summary — AI unavailable'}</h3></div><p>{result.summary.overview}</p>{result.summary.findings.filter(f => issues.length === 0 || issues.some(i => i.id === f.id)).map(f => <div className="summary-finding" key={f.id}><strong>{findings.find(i => i.id === f.id)?.label}</strong><p>{f.explanation}</p><span>{f.follow_up}</span></div>)}<div className="summary-meta">{result.source === 'ollama' ? `Real Ollama response · ${result.model} · ${((result.latencyMs ?? 0) / 1000).toFixed(1)} s · validated` : 'Generated by comparison rules. No model response.'}</div>{result.requestHash && <details><summary>Request receipt</summary><code className="hash">{result.requestHash}</code></details>}</article>}
    {context && health && !health.available && !busy && <button className="text-button backup-button" onClick={fallback}>Show rule-based summary (AI unavailable)<ArrowRight size={14}/></button>}
  </section></div><footer><span><LockKeyhole size={13}/>No accounts. No stored cases. Reset clears this workspace.</span><span>Consistency review · human decisions</span></footer></main>
  <dialog ref={dialog} aria-labelledby="source-title" className="evidence-dialog" onCancel={() => setEvidence(undefined)} onClose={() => setEvidence(undefined)}>{evidence && <><div className="dialog-heading"><div><span className="eyebrow">LOCAL SOURCE EVIDENCE</span><h2 id="source-title">{evidence.doc.template === 'client-intake-v1' ? 'Client intake' : 'Bank statement'}{evidence.field && ` · ${LABELS[evidence.field.field]}`}</h2></div><button className="icon-button" aria-label="Close source evidence" onClick={() => setEvidence(undefined)}><X size={20}/></button></div><div className="dialog-content"><div className="source-notes"><span className="badge consistent">{evidence.doc.template}</span><p>Original PDF · page {evidence.field?.page ?? 1}</p>{evidence.field && <><h3>Extracted source passage</h3><blockquote>{evidence.field.excerpt}</blockquote>{evidence.field.page === null && <p>No source location exists for an absent field.</p>}<h3>Value used for comparison</h3><p className="confirmed-display">{evidence.field.value || 'Not supplied'}</p><p>{evidence.field.corrected ? 'User corrected value. The original source passage is unchanged.' : evidence.field.confirmed ? 'Confirmed by the reviewer.' : `Extraction: ${evidence.field.status.replace('_', ' ')} · not yet confirmed.`}</p><button className="secondary" onClick={() => { setEdit({ id: evidence.doc.id, field: evidence.field!.field, value: evidence.field!.value }); setEvidence(undefined); }}>Review this field</button></>}<p className="workflow-note">Page and excerpt are real source references. No bounding-box highlight is inferred.</p></div><Suspense fallback={<p role="status">Loading local PDF viewer…</p>}><PdfPage url={evidence.doc.url} page={evidence.field?.page ?? 1}/></Suspense></div></>}</dialog></>;
}
