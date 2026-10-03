# Document Review

A local hackathon prototype for finding missing or conflicting information across supported PDFs and showing exactly what minimized information the AI receives. Intended audience: teams handling visa/immigration paperwork.

**Target: iPhone app in Expo Go.** Native UI and a phone-local PDF engine are in `mobile/`, sharing the existing comparison and minimization rules. Ollama stays on the paired Mac; the phone sends only approved, encrypted minimized facts. Follow the [iPhone setup and demo guide](docs/MOBILE.md). Native rehearsal status is recorded in [PROGRESS](docs/PROGRESS.md).

**Preserved baseline:** fictional client intake + bank statement, real browser-local PDF parsing, source evidence, editable fields, deterministic comparison and real local Ollama explanations. **Visa-form support and purpose-driven Proof Mode are planned for Phase 6 and are not implemented yet.** This is consistency review, not document authentication or an eligibility decision.

Private repository: [SaiKarawalla/document-review-hackathon](https://github.com/SaiKarawalla/document-review-hackathon). No public deployment or paid service is required.

## Open the existing demo on this Mac

If the server is already running, open <http://127.0.0.1:8787>. Otherwise, with Ollama running as below:

```sh
cd /Users/skarawalla/dev/projects/hackathonproject
npm run build
npm start
```

Keep the app terminal open. Press Control-C to stop that process. A second `npm start` while one is running will report a port conflict.

## Set up another macOS teammate's laptop

Tested host: Apple M2, 8 GiB RAM, macOS arm64, Node **26.5.0**, npm **11.17.0**, Ollama **0.35.1**, model **qwen2.5:1.5b**. Other operating systems/versions have not been verified. `.nvmrc` records the tested Node version; if you already use nvm, run `nvm install` then `nvm use`. Otherwise install that version from [Node.js](https://nodejs.org/en/download). The private repo requires an authorized collaborator's existing GitHub access; Ollama needs no account or API key for this local model.

```sh
git clone https://github.com/SaiKarawalla/document-review-hackathon.git
cd document-review-hackathon
node --version
npm ci --no-audit --no-fund
```

The PDFs are already committed synthetic fixtures. Python, Docker and a database are not required to run the app or automated tests. Installation and the first model download need internet; the downloaded model and built demo run locally afterward.

Install the Ollama CLI if absent. With an existing Homebrew installation:

```sh
brew install ollama
ollama --version
```

Alternatively use the [official macOS download](https://ollama.com/download/mac). The verified demo uses the CLI launch below. Quit an existing Ollama desktop instance or stop your existing Ollama service before starting a second listener; leave unrelated configuration intact.

In **terminal 1**, start the local-only model server:

```sh
OLLAMA_NO_CLOUD=1 OLLAMA_HOST=127.0.0.1:11434 OLLAMA_NUM_PARALLEL=1 OLLAMA_MAX_LOADED_MODELS=1 ollama serve
```

Keep it open. Confirm the startup log says `Ollama cloud disabled: true`. These settings belong to the Ollama process, not the app's `.env`. Restart Ollama after changing them. See [Ollama's official local-only configuration](https://docs.ollama.com/faq#how-do-i-disable-ollama-cloud-features).

In **terminal 2**, download the local model once (approximately 986 MB), verify it, and start the app:

```sh
ollama pull qwen2.5:1.5b
ollama list
npm run check
npm start
```

Open <http://127.0.0.1:8787>. In a third terminal you can check readiness:

```sh
curl --fail http://127.0.0.1:8787/api/health
```

Expected: `available: true`, `model: qwen2.5:1.5b`, destination `http://127.0.0.1:11434/api/generate`. Use **Ready · refresh** or **Check connection** in the UI after restarting Ollama. No cloud credentials, sponsor redemption or billing setup is needed.

## Configuration and development

Defaults work without `.env`. To customize the two supported settings, copy the placeholder file locally:

```sh
cp .env.example .env
```

`OLLAMA_MODEL` defaults to `qwen2.5:1.5b` and must identify a downloaded local model; other models need separate validation. `MODEL_TIMEOUT_MS` defaults to `60000`, accepts `1000`–`120000`. These values are read when the app server starts. Never put credentials in the repository. Provider URLs and cloud keys are not configurable.

For development, stop the production app process, then:

```sh
npm run dev
```

Open <http://127.0.0.1:5173>; this command starts the preserved Vite interface and local backend on port 8787. The native phone app uses its separate paired companion on private-LAN port 8790; do not expose the loopback API or Ollama. Phone-local inference is not implemented.

## Demo and supported inputs

Select **Address conflict**, click **Load demo pair**, inspect the source, then **Preview exact AI request**, approve and send. Follow the [90-second script and judge Q&A](docs/DEMO.md).

- Only `client-intake-v1` and `bank-statement-v1`, identified from PDF content/structure, are supported. Use the examples in `public/fixtures/`; renaming an arbitrary PDF does not make it supported.
- Maximum two PDFs per case, 5 MiB per file, 10 pages per file, 100,000 extracted characters, 15-second parsing timeout. Cancel/reset terminates parser work.
- Text-layer PDFs only. Scans/photos, encrypted/malformed PDFs, unsupported structures and editions are rejected. There is no OCR.
- Findings require the supported pair. Single-document visa checks, the selected Schengen adapter, Proof Mode and inclusion/exclusion reasons are Phase 6 work.
- Human source evidence shows the original PDF, including its private values. Model input excludes raw documents/text, names, literal addresses, amounts, dates, account/passport IDs, filenames, notes and excerpts. It contains validated template identifiers, field enums and derived findings.
- Corrections change comparison values, preserve the original source and invalidate summaries/approvals. Reset clears app-held references and results; this is not forensic erasure of the browser/OS.
- AI selects tightly constrained sentences tied to authoritative findings. Invalid output is rejected; AI does not decide whether literal values match. It has no tools or document-submission capability.

## Verification and CI

```sh
npm run check
```

Runs typechecking, 93 automated tests in six files and the production web build. Tests use committed fictional PDFs and explicit provider test doubles; they do not download a model or call a paid API. Mobile typecheck/lint and simulator rehearsal are separate checks in MOBILE/PROGRESS. The actual local model was separately verified on the demo laptop.

Optional real integration, with local Ollama running:

```sh
mkdir -p artifacts
node --import tsx scripts/model-smoke.ts address-conflict
```

This uses synthetic fixtures only and records actual request-byte/hash equality at the gateway transport. Browser automation is a maintainer tool requiring an installed agent-browser CLI/browser (the script invokes `npx --yes agent-browser` and may download tooling):

```sh
node scripts/browser-smoke.mjs --ai
```

Latest Phase 5 results: 82 tests/build passed; 25 browser checks passed with a real Ollama response, 33 captured local application requests, and zero checked accessibility violations. A separate real-model transport check passed at 5.376 seconds. Details and practical limits: [verification](docs/VERIFICATION.md).

CI is prepared in `.github/workflows/checks.yml` but **not enabled or tested on GitHub**. It has only a manual trigger and a job guard requiring repository variable `FREE_CI_VERIFIED=true`; that variable is currently absent. The existing account token cannot read billing usage without extra scope, so free allowance and a hard paid-usage stop were not verified. No permission upgrade, billing change or hosted run was made. Leave the gate unset; use local checks. The gate is not itself a billing cap. Private hosted-runner usage can incur costs beyond allowance; see [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions). Never enable paid usage; stop any free service when credits expire and use the local fallback.

## Feature status at the Phase 5 checkpoint

| Feature | Status |
| --- | --- |
| Two synthetic template adapters, comparison, original evidence, corrections/reset | Implemented; automated tests and actual browser flow passed |
| Strict minimized exact request and one-use approval | Implemented; unit/HTTP tests plus real gateway byte/hash equality passed |
| Downloaded local Ollama explanation | Implemented; actual model and production browser response validated |
| Rule-based backup | Implemented; controlled unavailable-health browser rehearsal passed, no model generation |
| macOS setup/demo/license handoff | Written; lockfile reinstall, build/checks and local production launch verified on this Mac |
| Native iPhone interface, local PDF engine, paired Mac AI | Implemented; two native simulator test cases verified across rehearsals, final real response 5.3 s; physical iPhone still unverified |
| Hosted CI | Prepared, gated off; billing allowance inaccessible and Linux run unverified |
| Schengen application adapter, single-visa checks, purpose-driven Proof Mode | Planned Phase 6; not implemented |
| OCR, arbitrary PDFs, phone inference, cloud hosting, accounts/storage/integrations | Not implemented |

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Model unavailable | Check terminal 1, `ollama list`, the cloud-disabled startup log, then UI **Check connection**. |
| Missing local model | With the local-only server running, use `ollama pull qwen2.5:1.5b`. Initial download needs internet. |
| Port already in use | Use the existing app/server; stop only your identified duplicate process. Do not change the host to `0.0.0.0`. |
| Page missing/old build | Stop app, run `npm run build`, restart `npm start`, reload the browser. |
| Unsupported PDF | Use the supported synthetic fixtures. Arbitrary visas/scans do not work yet. |
| Model timeout/invalid answer | Findings/evidence remain usable. Cancel/review before a new preview and approval; no hidden retry. If AI is unavailable, use the labeled rule-based backup. |
| Expired preview | Create a new preview and approve it; expiry is five minutes, and approvals are single-use. |
| Fresh install test errors | Verify Node 26.5.0, run lockfile-based `npm ci`, then `npm run check`. Other runtime versions are not verified here. |

Dependency/model versions, licenses and upstream links: [DEPENDENCIES](docs/DEPENDENCIES.md). Phase records: [PLAN](docs/PLAN.md), [PROGRESS](docs/PROGRESS.md). Screenshot originals, official blank visa reference and future feature brief are preserved in ignored local `references/` folders; they are not required for the baseline demo. Phase 6 needs that reference/provenance or the documented official source download.
