# Current phase plan — 2026-10-03

This file supplements the original master prompt with the user's latest instructions. Continue the existing repository; do not restart. Execute **one phase per user instruction** and stop at its checkpoint. The user plans to compact context, then separately request Phase 5. This documentation update does not start Phase 5 or Phase 6.

## Phase status

| Phase | Work | Status |
| --- | --- | --- |
| 0 | Requirements, visual screenshot inspection, durable records, private repository and environment | Complete |
| 1 | Real browser-local supported PDF extraction, deterministic comparison, evidence and corrections | Complete |
| 2 | Strict minimization gateway, exact request preview and hash-bound approval | Complete |
| 3 | Real downloaded local Ollama model, validated explanations and error/cancel handling | Complete |
| 4 | Full-flow verification, security boundary checks, desktop/mobile polish | Complete |
| 5 | Reproducible setup, dependencies/licenses, baseline demo/rehearsal and CI within free allowance | Pending — wait for user instruction |
| 6 | Proof Mode, purpose-specific AI Context Firewall, dynamic minimization explanation and verification | Planned — wait for its own user instruction |

Original phases 0–5 remain intact; Phase 6 is now explicitly in the plan. Broader product features stay future work. The original master prompt's automatic-continuation language is superseded by the user's one-phase rule.

## Phase 5 — setup and baseline handoff

Target approximately 30–45 minutes, adjusted to actual remaining hackathon time. Prepare the current verified demo so a teammate can reproduce it:

- README for the actual macOS setup: dependency install, downloaded Ollama with cloud disabled, local model check, development/production commands, supported PDF limits and troubleshooting.
- Verify installed dependency/model versions and licenses; record upstream sources in docs/DEPENDENCIES.md.
- Write docs/DEMO.md with a 90-second baseline script, source evidence, exact preview, real AI response, correction/reset and honestly labeled offline backup. Include judge Q&A and current limitations.
- Record sponsor perks as **hackathon resources** from docs/HACKATHON-RESOURCES.md. Use them only if needed during the event; do not assume post-hackathon access or describe sponsor credits as future product funding.
- Add minimal install/typecheck/test/build CI if it can run within included/free allowance. Do not enable paid runner usage, paid minutes, upgrades or billing. If free allowance is unavailable/exhausted, stop hosted checks and run local checks instead; report CI as unverified.
- Run appropriate baseline checks/build, verify the private repository/commit, update durable records and push. Clearly label Phase 6 features as planned, not demonstrated.

Stop after Phase 5. Do not automatically implement Phase 6 or cloud integration. Phase 5 is a handoff of the current baseline, not a claim that planned Phase 6 is complete.

## Phase 6 — Proof Mode and AI Context Firewall

Use the already read/visually inspected FormBridge_Unique_Feature.pdf and docs/FUTURE-FEATURES.md. Target roughly 60–90 minutes for the focused local enhancement; reassess remaining event time when this phase actually starts. No general OCR, new document formats, accounts, database, voice or enterprise integrations.

1. Add one bounded purpose: **Prove Financial Resources**. Define a versioned synthetic sample workflow and any example threshold explicitly as demo rules, not official requirements or an eligibility determination.
2. Select the minimum relevant supported evidence locally. Keep original sources, conflicting/missing information and human corrections visible. Financial comparison requires valid matching account/currency/date context; unresolved evidence cannot become a successful proof.
3. Show why fields are included or excluded and link included evidence to the original page/excerpt. Compute counts dynamically from actual records and the actual payload; define source-field counts separately from derived model facts. Never copy the PDF's illustrative 27/4/4 as measured numbers.
4. Extend the **single** gateway with a strict purpose/policy/derived-predicate schema. Preserve exclusion of raw PDFs, names, literal addresses, amounts, dates, identifiers, filenames, notes and excerpts. Prefer local evaluation plus bounded enums/booleans over sending literal financial data. The PDF's example with name/amount/date does not authorize silently weakening this contract.
5. Show the exact real provider request and require new approval after purpose, policy, field, prompt/model or provider changes. Validate model output against authoritative findings/purpose predicates. No model tools and no invented model actions.
6. Test purpose selection, inclusion/exclusion counts, missing/conflicting/incomparable evidence, synthetic threshold boundaries, malicious notes, raw identifier exclusion, stale approvals and real model inference. Check desktop/mobile readability and actual network boundaries.
7. Refresh README/demo/architecture/context/decisions/progress and CI checks affected by the new behavior. Commit/push actual source and tests. Show the completed phase and distinguish tested, blocked and deferred items.

### Provider choice and sponsor resources

Local Ollama is already working and remains available. **Local or verified free sponsor cloud access is acceptable for the hackathon if needed.** The user corrected the earlier suggestion to save event perks for future use. Cloud is not a prerequisite for Proof Mode and is not currently implemented.

If a real need for cloud arises during Phase 6, use only available redeemed access with verified free limits. Optional cloud integration was estimated at an additional 1–2 hours; it is not included in the 60–90-minute local feature estimate. Do not let unavailable credentials or quota consume the feature budget: time-box access troubleshooting to 15 minutes and continue with Ollama. Do not claim an advertised API key, access offer or free quota is already usable.

Any cloud path must use server-side credentials, an allowlisted destination, explicit local/cloud selection, accurate “what leaves this device” labeling, exact preview/approval, output validation and appropriate tests. No silent provider switch. If credits expire or no hard free-only boundary can be verified, stop that service and offer the local fallback with a fresh request approval. **No spending, billing activation, automatic top-ups or paid usage.** Never commit credentials or redemption codes. A cloud feature is complete only after a real provider response passes the same boundary checks.

## Resume after compaction

Read AGENTS.md, docs/PROJECT-CONTEXT.md, docs/DECISIONS.md, docs/PROGRESS.md, this plan and the original docs/MASTER-PROMPT.txt. Read FUTURE-FEATURES.md before Phase 6 and HACKATHON-RESOURCES.md before considering sponsor access. Inspect Git status/remotes and actual app/model availability; session IDs alone are not proof a process still runs.

Current baseline: Phase 4 complete, 82 automated tests and 25 browser checks passed, production build passed, actual local Ollama responses verified. Private repository: https://github.com/SaiKarawalla/document-review-hackathon. App target: http://127.0.0.1:8787. Next phase is **5, only when the user requests it**; Phase 6 is planned afterward with its own checkpoint.
