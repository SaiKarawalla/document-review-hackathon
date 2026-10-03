# Progress

Started 2026-10-03 on the actual macOS demo host. Phase targets are checkpoints, not approval gates.

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

## Phase 4 — in progress
59 automated tests passed; initial production build succeeded. Added HTTP boundary and parser termination tests. Source dialog visual/keyboard checks underway. Axe flagged low secondary text contrast; improved colors, retest pending. Browser flow/check corrections and malformed uploads on production build next.

## Active environment
Dev server session 91383: http://127.0.0.1:5173; backend http://127.0.0.1:8787. Ollama session 75756. Python .venv with ReportLab/Pillow/pypdf; Poppler installed for visual fixture inspection. In-app browser js tool absent from tool discovery; fallback agent-browser CLI being initialized. Sandbox denies local sockets: dev server/fixtures/network checks run with approved escalation.

Next concrete task: visually verify PDFs, browser parser and complete comparison flow, add gateway and field cases, real Ollama summary, polish/handoff. Phase 4–5 pending. No simulated model output accepted as real.
