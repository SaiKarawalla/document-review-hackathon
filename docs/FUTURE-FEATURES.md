# Future feature brief — FormBridge

Requested 2026-10-03 for a later phase, not Phase 4; now explicitly planned as **Phase 6** in docs/PLAN.md. Source: `/Users/skarawalla/Downloads/FormBridge_Unique_Feature.pdf`, two pages. Read extracted text and visually inspected both rendered pages. Original preserved unchanged at ignored `references/future-features/FormBridge_Unique_Feature.pdf`; provenance and SHA-256 recorded alongside it. The name FormBridge is in the brief; current temporary UI name remains Document Review until a later branding decision.

## Proposal from the PDF

**Proof Mode:** start with what the reviewer wants to demonstrate, then select the minimum evidence required for that purpose. Initial purpose: “Prove Financial Resources.” Explain why each field is included or excluded; included evidence has a source document/page. Continue comparing the synthetic intake and bank statement for missing or conflicting information.

**AI Context Firewall:** enforce minimization in code between purpose-specific structured evidence and local Ollama. Flow: document → browser-local processing → structured evidence → Proof Mode → minimum necessary evidence → validated gateway → local Ollama. Raw PDF, raw extracted/OCR text and unrelated free text must never become ordinary model input.

The PDF's illustrative package includes name, balance, statement date and source; it excludes account number, transaction history, merchants, DOB and unrelated data. Its example counts 27 found / 4 needed / 4 sent are illustrative only. Calculate all displayed counts from actual extracted evidence and actual serialized payload; do not hardcode those figures or invent a privacy percentage.

Proposed demo: upload synthetic PDFs → choose purpose → verify fields/conflicts → minimize → inspect the exact real AI request → obtain a real local explanation. Positioning: identify the minimum evidence needed for the selected purpose while keeping unnecessary data private.

## Fit with the current implementation

Already implemented: browser-local extraction, source pages/excerpts, deterministic findings, a strict enum-only input schema, an exact hash-bound preview, explicit send approval, local Ollama and validated output. This is a working foundation for the proposed firewall, not a completed Proof Mode.

Deferred: purpose selector, purpose-specific evidence policies, field inclusion/exclusion explanations, dynamically calculated purpose counts, and a financial-resource assessment. No such feature is claimed as working in Phase 4.

The current contract excludes literal names, addresses, amounts, dates, account numbers, filenames and excerpts from AI. The PDF's illustrative package would broaden that contract. Prefer locally computed predicates such as `balance_meets_demo_threshold` and `statement_date_present`, with source evidence visible only to the human. Define the supported workflow and a clearly labeled synthetic threshold before evaluating sufficiency; do not claim immigration/legal eligibility. A changed payload needs a separate reviewed schema, exact preview, invalidation on purpose/value changes and boundary tests.

## Suggested later phase and acceptance criteria

Keep Phase 5 for the existing baseline handoff/rehearsal. Phase 6 is explicitly planned for this brief and starts only on its own user instruction. Refresh the handoff/demo after Phase 6 changes. Do one phase at a time; see docs/PLAN.md for the current sequence and acceptance criteria.

Latest user correction adds visa-document review to Phase 6. The two original demo templates are a starting point, not the full intended product. The user delegated the hackathon choice: use Germany's official bilingual Schengen application, fictional adult tourism, and the existing synthetic bank statement. All four reference pages were visually inspected; local reference and structure are recorded in VISA-WORKFLOW.md. Implement a bounded local adapter with fictional fixtures; no visa support exists yet. Distinguish one-document checks from cross-document comparisons; do not silently upload visas/passport pages to AI. No country clarification remains pending. See PLAN.md for the expanded scope and time estimate.

- Define one bounded synthetic purpose and versioned evidence policy; no arbitrary text-based goals passed to AI.
- Derive purpose predicates locally from supported confirmed fields. Missing, incomparable or conflicting evidence stays unresolved.
- Show actual included/excluded field counts and reasons with original source references; document what a “field” means.
- Preview the exact purpose-specific provider request and require new approval after purpose or evidence changes.
- Test malicious notes, hidden raw identifiers, missing dates, incomparable balances, policy changes and stale approvals. Keep real model responses distinct from test doubles.
- Keep working local Ollama available. Verified free sponsor cloud may be used for the hackathon if needed under the same boundary. No paid usage or billing activation; stop any free service when credits/access end and offer the local fallback with fresh approval.

This brief is saved for planning; it is not permission to start another phase on the current request.

## Hackathon provider options and sponsor resources

Latest clarification recorded 2026-10-03: sponsor perks are hackathon resources, not something to depend on afterward. The app already works with real local Ollama; local or verified free cloud is acceptable during the event if needed. Cloud integration is not implemented and is not required for Phase 5. Phase 6 prioritizes Proof Mode; provider access must not block it. See docs/HACKATHON-RESOURCES.md and docs/PLAN.md.

Any implemented cloud capability must be user-selected with the same strict minimization boundary, explicit provider/destination display, exact serialized request preview, server-side credentials and validated output. Raw PDFs, source excerpts and literal identifiers must remain excluded. Switching providers must create a new preview and require fresh approval; never silently switch when local/cloud fails.

The no-spending rule persists: no billing activation or paid usage. If free service credits/access end, stop using it and offer the local fallback with a fresh approved request. Select and verify a provider's actual limits before claiming credit enforcement works. No provider account, credentials, usable free quota or quota behavior is assumed available today.

Only show a cloud explanation as demonstrated after an actual approved provider response passes validation. Otherwise describe it as an optional unimplemented event resource choice. Current local-only configuration follows [Ollama's official cloud-disable documentation](https://docs.ollama.com/faq#how-do-i-disable-ollama-cloud-features).
