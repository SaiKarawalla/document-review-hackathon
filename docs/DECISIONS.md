# Decisions

- 2026-10-03: Use one private repository, React/Vite TypeScript frontend and small Node server. Empty workspace means no migration or existing instructions to preserve.
- 2026-10-03: Only synthetic, explicitly marked template editions v1; browser PDF.js extraction, deterministic comparisons, editable values plus original evidence. No OCR or arbitrary document claims.
- 2026-10-03: Allowlisted statuses only; no exact financial figures or dates sent to AI. Balance comparison requires matching explicit account/currency/as-of date. Generic not-comparable state otherwise.
- 2026-10-03: Local Ollama is mandatory integration; supersedes earlier chat proposal to omit it. Cloud mode deferred for time and scope. Small local model selected after checking actual host.
- 2026-10-03: Dedicated parsing worker can be terminated on cancellation/timeout. Rendering shows page and real source excerpt, never invented highlights.
- 2026-10-03: Strict output vocabulary for model explanations/follow-up plus finding IDs prevents accepting new factual claims. Human findings remain authoritative.
