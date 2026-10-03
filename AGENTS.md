# Document Review

Read docs/PROJECT-CONTEXT.md, docs/DECISIONS.md, docs/PROGRESS.md and docs/MASTER-PROMPT.txt before resuming. Inspect Git status. Continue the next unfinished task; do not restart or create duplicate repositories.

Scope: two supported synthetic text-layer PDF templates; deterministic, evidence-backed comparison; exact minimized request preview; local Ollama summary. React/Vite + TypeScript + loopback Node backend. No accounts, database, OCR, voice, integrations or public deployment.

Invariants: PDFs/raw text/identifiers/excerpts stay in browser memory. Only strict allowlisted enums/statuses enter the gateway. Preview binds approval to exact serialized provider request. Corrections invalidate preview and summary. AI cannot change deterministic findings. Never present a stub as a real model response. No silent cloud fallback. Preserve original screenshots locally and never commit redemption codes or secrets.

At each phase: update context/decisions/progress, record actual verification and blockers, and commit source. User preference as of 2026-10-03: do ONE phase at a time and stop at its checkpoint; do not start the next phase without a new user instruction. Finish Phase 4 only on the current request. Security and core flow tests are required; report implemented, tested, blocked and future separately.

Budget: do not spend money, enable paid usage, add billing, or upgrade services. If free credits run out, stop using that service and use the local Ollama/rule-based fallback. No sponsor/cloud service is currently enabled.

Hackathon provider decision: keep the demo local-only. Optional cloud AI is roadmap work after the hackathon, not a remaining requirement for this prototype or Phase 5. Record future capabilities honestly; do not start cloud integration without a later user instruction.

Future feature brief: read docs/FUTURE-FEATURES.md before later feature work. Proof Mode and the AI Context Firewall proposal are deferred beyond Phase 4; do not weaken the current enum-only request boundary or silently send identifiers to implement them.
