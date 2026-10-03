# Document Review

Read docs/PROJECT-CONTEXT.md, docs/DECISIONS.md, docs/PROGRESS.md and docs/MASTER-PROMPT.txt before resuming. Inspect Git status. Continue the next unfinished task; do not restart or create duplicate repositories.

Scope: two supported synthetic text-layer PDF templates; deterministic, evidence-backed comparison; exact minimized request preview; local Ollama summary. React/Vite + TypeScript + loopback Node backend. No accounts, database, OCR, voice, integrations or public deployment.

Invariants: PDFs/raw text/identifiers/excerpts stay in browser memory. Only strict allowlisted enums/statuses enter the gateway. Preview binds approval to exact serialized provider request. Corrections invalidate preview and summary. AI cannot change deterministic findings. Never present a stub as a real model response. No silent cloud fallback. Preserve original screenshots locally and never commit redemption codes or secrets.

At each phase: update context/decisions/progress, record actual verification and blockers, commit source, continue automatically. Security and core flow tests are required; report implemented, tested, blocked and future separately.
