# Progress

Started 2026-10-03 on the actual macOS demo host. Latest user instruction: ONE phase at a time, stop at each checkpoint. This request completes Phase 4 only. Do not start Phase 5 automatically. No spending or paid usage; expired free services must be stopped in favor of the local fallback.

## Phase 0 — complete
Read all four TXT files; visually inspected all four attached JPGs. Workspace empty, no Git repository or AGENTS.md. Confirmed Node/npm/OS/8 GiB RAM. GitHub active SaiKarawalla authenticated outside sandbox; inactive account invalid, left unchanged. Ollama initially absent/unreachable.

Commands: pwd, rg --files, ls -la, git status/remotes, uname, node/npm versions, gh auth status (sandbox denied keyring; escalated works), sysctl (sandbox denied; escalated reports 8589934592).

Originals copied unchanged, local provenance with SHA-256 saved in ignored references/screenshots/. Private repository created and initial commit pushed: https://github.com/SaiKarawalla/document-review-hackathon (72e6c1e). No screenshots/codes committed. Dependencies installed with lockfile.

## Phase 1 — complete
Browser-local PDF parser, dedicated terminable worker, strict template/structure checks, two document slots, source page/excerpt, PDF canvas, editable confirmed fields and six deterministic checks. ReportLab generated actual matching, address-conflict, missing-field, name-conflict and malicious-text fixture pairs, plus unsupported v2, image-only scan, 11-page and malformed PDFs. Typecheck passes after adapting to installed PDF.js v6 API (isEvalSupported removed). First browser check found PDF.js handshake being accepted as a result: fixed with typed review-result message filtering and added regression test. Browser now parses actual address-conflict pair and flags the expected address conflict. Source link verified with correct statement page/excerpt; original PDFs rendered with Poppler and inspected visually with no clipping/overlap.

## Phase 2 — complete
Strict Zod allowlist; loopback Node server with Host/Origin checks, bounded JSON, one-use five-minute hash-bound request preview, single model gateway, cancellation and rate/concurrency limits. No provider URL option. Browser edits invalidate requests/summaries. Exact serialized byte equality, identifier exclusion, malicious enum rejection, expiry, hash mismatch, replay, timeout, cancellation, one-at-a-time, rate limit and bounded pending previews passed in controlled-provider tests. HTTP boundary tests added and running.

## Phase 3 — complete
Homebrew installed Ollama 0.35.1_1 and required dependencies. Started CLI with OLLAMA_NO_CLOUD=1, OLLAMA_HOST=127.0.0.1:11434, OLLAMA_NUM_PARALLEL=1, OLLAMA_MAX_LOADED_MODELS=1. Downloaded qwen2.5:1.5b (986 MB; upstream Apache 2.0). Backend /api/health reports downloaded local model available. Logs explicitly confirm cloud disabled and loopback listener; ollama ps reports Apple M2, 100% GPU, 1.2 GB loaded / 4096 context. No cloud mode.

First real browser AI response was contradictory and correctly rejected. Synthetic model-smoke test confirmed overview/status mismatch. Tightened provider output JSON schema to allow only explanations appropriate to each existing ID plus authoritative overview. Real retest passed validation: 4971 ms, request hash 8aadc399c30a838427c5dbc6de8e35931b00acd7b2a3824d0bf7cdfea14a7179. This is a real Ollama response, distinct from test doubles. Production browser flow using updated server pending.

## Phase 4 — complete
Professional comparison view now shows two accurate source passages side by side, original PDF evidence with keyboard Escape/close, editable confirmation, recomputation, exact preview/approval and validated real Ollama explanation. Fixed partial object-URL cleanup on failed/cancelled multi-file parses, blank-password encrypted PDF rejection, date-trimming consistency, secondary/empty-screen contrast and mobile grid overflow. Lazy-loaded the PDF viewer; removed the unused pdf-lib dependency. Synthetic encrypted fixtures added; original source PDFs remain unchanged by user edits.

Verification: `npm run check` passed TypeScript, **82 tests in five files** (including **20 independent field-level cases**) and production build. Production rebuilt successfully after final CSS changes. `npm audit --omit=dev`: zero reported vulnerabilities. **25 browser checks passed** in the final `node scripts/browser-smoke.mjs --ai` run: actual PDF parsing/conflicts/missing/name cases, real source canvas, exact preview, real Ollama response, corrections and stale approval removal, six unsupported upload rejections, third-file rejection, reset, no page errors, mobile overflow and accessibility. Reset/loaded/mobile accessibility audits report zero violations. Final HAR contains **33 application requests**, all loopback HTTP or the browser's local evidence blob; no raw identifiers in API bodies.

Actual gateway transport capture forwarded requests to real Ollama: only GET tags and POST generate on 127.0.0.1:11434. Approved serialized body equals outgoing bytes/hash. Address-conflict run **4435 ms**, **5413 request bytes**, **14 extracted field records**, **zero literal field values sent**, **six derived findings**. Real matching/missing/malicious runs also passed; latest malicious run **6006 ms**, no instruction/exfiltration URL or raw identifiers in input. Detailed limits and earlier failures/fixes: docs/VERIFICATION.md. Test doubles are confined to automated tests; displayed AI results are actual local inference.

Browser harness initially failed on relative upload paths and local blob classification; corrected both. Axe caught an empty-state heading contrast issue; fixed. Mobile check caught a grid's intrinsic minimum-width overflow; fixed and reran the complete browser suite successfully. These were actual failures, not omitted checks.

New FormBridge_Unique_Feature.pdf copied unchanged locally with matching SHA-256, extracted and visually inspected both pages. Proof Mode/purpose selection, inclusion/exclusion reasons, dynamic counts and the proposed AI Context Firewall recorded in docs/FUTURE-FEATURES.md. Current strict gateway provides a foundation; Proof Mode is not implemented. User no-spending/one-phase rules added to AGENTS/context/decisions.

Elapsed wall time: first source checkpoint 12:58:14 PDT; final verification/captures around 13:55 PDT, approximately one hour since that checkpoint, including user interruptions. Phase 4 source checkpoint: **cce1397** (`Complete Phase 4 browser verification and demo polish`). Final desktop capture shows a real validated response at 4.7 seconds. No Phase 4 blocker remains.

## Phase 5 — not started
Setup README, verified dependency/license handoff, 90-second demo script/rehearsal and CI remain pending. Wait for a new user instruction. A separate later phase may implement the new Proof Mode brief.

## Active environment
Production server session 14232: http://127.0.0.1:8787 (`npm start`, serves latest dist). Dev server 91383 stopped. Ollama session 75756 remains local-only. Python .venv with ReportLab/Pillow/pypdf; Poppler installed for visual inspection. In-app browser js tool absent; agent-browser fallback verified actual production UI. Sandbox denies local sockets; network/browser checks used approved escalation.

App is built; if the current server stops, run `npm start` from the project directory. If dist is absent, `npm run build` first. Development: `npm run dev`. Ollama is a separate running prerequisite; configured downloaded model qwen2.5:1.5b, OLLAMA_NO_CLOUD=1 and OLLAMA_HOST=127.0.0.1:11434. No sponsor service or paid API was activated.

Local ignored artifacts: browser-report.json, browser-network.har, browser-mobile.png, browser-evidence.png and final desktop/review captures; actual model/network receipts under artifacts/. Original event photos in ignored references/screenshots/; future PDF in ignored references/future-features/ with provenance. Do not commit any of these originals/debug traces.

Implemented: both core features and local model integration. Tested: counts above and real inference. Blocked: none for Phase 4. Remaining limitations: only the two synthetic text-layer template editions, no OCR/arbitrary PDFs, no authenticity/eligibility decisions, no case storage; constrained AI sentence choices. Future: Proof Mode and original broader integrations, each requiring later phase instructions.

Next concrete task: stop after showing Phase 4 to the user. On a later Phase 5 instruction, read the durable records and prepare the handoff without restarting the project or creating a second repository. Source baseline before Phase 4: f33b626; existing private repository remains https://github.com/SaiKarawalla/document-review-hackathon.
