# Phase 4 verification — 2026-10-03

Actual host: macOS arm64 Apple M2, 8 GiB RAM; Node 26.5.0. Synthetic documents only. Production app at http://127.0.0.1:8787, local Ollama 0.35.1 / qwen2.5:1.5b on 127.0.0.1:11434 with cloud disabled. No paid usage or cloud provider enabled.

## Automated checks

`npm run check`: TypeScript passed, **82 tests in five files passed**, production build passed. Runtime `npm audit --omit=dev`: **zero reported vulnerabilities** at the time of the check; this is not a security guarantee. Latest production rebuild also passed after the empty-screen contrast correction.

Coverage includes five actual PDF pairs with predeclared findings, 20 independent synthetic field-level cases, unsupported structure/version, meaningful name changes, missing fields, image-only scans, malformed PDFs, encrypted PDFs including a blank password, page/file/text limits, MIME/signature validation, worker cancellation/timeout termination calls, filename independence and corrections preserving original evidence.

Gateway/HTTP tests cover exact request byte/hash equality, strict enums and extra-key rejection, preview expiry/hash mismatch/replay, one concurrent model call, rate limits, cancellation/timeout, malformed/oversized/contradictory model output, Host/Origin/CORS/header/body/content-type boundaries, arbitrary provider URLs and no document-content console logging. Provider responses and controlled worker instances in these tests are explicit test doubles, not real AI results.

## Real model and network checks

Real model runs passed for address-conflict, matching, missing-field and malicious-text. Recorded integration times: 4971 ms, 5040 ms, 4580 ms; latest address-conflict 4435 ms and malicious-text 6006 ms. Latency varies with host load. A real production-browser summary also passed schema/status checks and displayed its real model tag and latency.

`node --import tsx scripts/model-smoke.ts address-conflict` records actual outgoing calls at the gateway transport before forwarding them to real Ollama: GET `/api/tags`, POST `/api/generate`, both loopback; no other gateway destination. Provider body equals the stored approved bytes and its SHA-256. Address-conflict request: **5413 bytes**, **14 supported source fields**, **zero literal source field values included**, **six derived findings**. Hash: `8aadc399c30a838427c5dbc6de8e35931b00acd7b2a3824d0bf7cdfea14a7179`.

The malicious-text real run also confirmed only those two destinations, identical approved request bytes, and no account identifier, passport-like identifier, raw name/address or embedded exfiltration URL in the request. Its hash equals the matching-case hash because the notes never enter reduced context. This proves the tested gateway boundary; the model has no tools and did not attempt a tool attack. It is not proof of universal leak resistance or a system-wide packet capture.

Browser verification uses `node scripts/browser-smoke.mjs --ai` against the running production server. **25 checks passed** in the final complete run, including a real model response, source canvas/keyboard close, edits after summary and after approval, supported/missing/malicious cases, rejected uploads, reset, mobile layout, zero page errors and zero reset/loaded accessibility violations. A separate mobile accessibility scan also reported zero violations. It captures HAR before accessibility tooling, so the application's traffic is evaluated separately from the test tooling. **33 application requests** were only loopback HTTP or an app-origin local PDF blob. The blob is browser-memory evidence, not a remote destination. Results are recorded in PROGRESS.md and ignored `artifacts/browser-report.json`.

## Observed failures and fixes

- PDF.js initialization handshake was initially mistaken for a parser result; fixed typed message filtering with a regression test.
- Initial HTTP tests used Node fetch, which rewrote Host. Replaced the test adapter with raw HTTP so Host validation is actually tested.
- The first real small-model response contradicted the findings and was rejected. Provider output schema now binds sentence choices to each finding's actual ID/status and authoritative overview; subsequent real runs passed. AI deliberately selects constrained sentences rather than unrestricted factual prose.
- Browser CLI relative upload paths produced empty files; changed the test harness to absolute fixture paths. Real uploads now show the intended validation messages.
- Initial HAR assertion misclassified a browser-local `blob:` evidence URL; corrected it to allow only the app-origin local blob plus loopback HTTP.
- Axe found low-contrast secondary text and then the empty-screen heading; corrected their colors and reran verification.
- Mobile check caught upload-grid minimum-content sizing causing horizontal overflow; allowed the grid children to shrink, then verified 390 px document width at a 390 px viewport and reran the full suite.

## Practical limits and future work

Only client-intake-v1 and bank-statement-v1 synthetic text-layer templates are supported. No arbitrary PDFs, OCR, document authenticity, official eligibility decision, durable case storage, accounts or enterprise connections. Source page/excerpt references are real; no guessed bounding-box highlight. Unit timeout tests use controlled responses/worker instances; they do not benchmark every hostile PDF or OS resource scenario. App minimization cannot control unrelated host processes or browser extensions.

Phase 5 setup documentation, dependency/license handoff, rehearsal and CI remain pending. Future Proof Mode and its purpose-specific policy are saved in FUTURE-FEATURES.md. Per the user's latest instruction, stop after Phase 4 and wait for a new phase instruction.
