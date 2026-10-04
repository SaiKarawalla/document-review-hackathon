# FormBridge

A local hackathon prototype for finding missing or conflicting information across supported PDFs and showing exactly what minimized information the AI receives. Intended audience: teams handling visa/immigration paperwork.

The Expo app currently uses the display name **Document Review**. FormBridge is the hackathon submission name; both refer to this project.

**Hackathon demo: iPhone in Expo Go, with free local Qwen/Ollama on the paired Mac.** The Mac must stay running/awake on the same trusted Wi-Fi. Open the app-opening QR on this Mac (`artifacts/iphone-open.html`), then pair inside the app using the separate private companion QR. See [phone setup](docs/MOBILE.md).

**Phase 6 implemented:** selected typed German/English four-page Schengen application review, single-document missing/date checks, name comparison with the synthetic bank statement, and purpose-specific Proof Mode with measured inclusion/exclusion decisions. **Five presentation languages:** English, Spanish, Hindi, Simplified Chinese and French. Qwen’s real validated canonical response is displayed with labeled local translations; original evidence and exact request bytes stay unchanged. Supported document formats are separate from UI language.

**Photo review:** camera/import, opaque scribble covers before phone-local English OCR, visible field overview/correction, real word highlights/local definitions, clear stages and exact approved derived-only Qwen explanation. Selected English bank/intake layouts; [photo workflow and limits](docs/PHOTO-REVIEW.md). Real Qwen photo flow passed in Expo Go simulator after the redesign. Physical camera/picker rehearsal remains required. New photo UI is English; five-language PDF review stays available.

Original intake/statement comparison remains available on phone and the preserved [Mac web baseline](http://127.0.0.1:8787). This is consistency review under sample rules, not authenticity or visa eligibility. Standalone phone-Qwen source/results are preserved separately; physical installation is deferred. **No paid/cloud service is enabled.**

Public repository: [SaiKarawalla/document-review-hackathon](https://github.com/SaiKarawalla/document-review-hackathon). No public deployment or paid service is required.

**Phase 7 redesign:** Home/Review/Settings, guided document and photo steps, Light/Dark/System appearance, and an offline globe with ten country preferences sharing five display languages. Country selection does not add visa rules or document formats. [Design and scope](docs/REDESIGN.md) · [No-printer demo](docs/DEMO.md) · [Synthetic screenshot PDF](output/pdf/synthetic-bank-statement-photo-demo.pdf).

**Latest verified checkpoint:** 151 automated tests in ten files, root TypeScript/production build, and mobile TypeScript/lint pass. Simulator checks verified the redesigned document workflow, a real local Qwen photo response, and globe diagonal/reverse dragging without parent scrolling or accidental selection. Source and demo fixtures are committed; generated phone engines, temporary pairing secrets, downloaded models and screenshots are intentionally ignored. Follow [phone setup](docs/MOBILE.md) to generate the local assets.

## Open the existing demo on this Mac

If the server is already running, open <http://127.0.0.1:8787>. Otherwise, with Ollama running as below:

```sh
cd /Users/skarawalla/dev/projects/hackathonproject
npm run build
npm start
```

Keep the app terminal open. Press Control-C to stop that process. A second `npm start` while one is running will report a port conflict.

## Set up another macOS teammate's laptop

Tested host: Apple M2, 8 GiB RAM, macOS arm64, Node **26.5.0**, npm **11.17.0**, Ollama **0.35.1**, model **qwen2.5:1.5b**. Other operating systems/versions have not been verified. `.nvmrc` records the tested Node version; if you already use nvm, run `nvm install` then `nvm use`. Otherwise install that version from [Node.js](https://nodejs.org/en/download). The public repo is readable without GitHub login; Ollama needs no account or API key for the preserved desktop baseline.

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

Open <http://127.0.0.1:5173>; this command starts the preserved Vite interface and local backend on port 8787. The current phone demo uses Expo Go and the Mac companion, started separately with `npm run mobile:companion`. Start Expo from `mobile/` using `npx expo start --go --lan --port 8082`; first generate/install the assets and dependencies as described in [MOBILE](docs/MOBILE.md). The older standalone on-device-Qwen implementation is preserved separately and is not the current Expo Go demo.

## Demo and supported inputs

Select **Address conflict**, click **Load demo pair**, inspect the source, then **Preview exact AI request**, approve and send. Follow the [90-second script and judge Q&A](docs/DEMO.md).

- Phone supports `client-intake-v1`, `bank-statement-v1`, and the selected typed DE/EN Schengen layout, identified from content/structure/position anchors. Web comparison keeps the original intake/statement baseline. Use the examples in `public/fixtures/`; renaming an arbitrary PDF does not make it supported.
- Maximum two PDFs per case, 5 MiB per file, 10 pages per file, 100,000 extracted characters, 15-second parsing timeout. Cancel/reset terminates parser work.
- The PDF comparison accepts text-layer PDFs only. Scanned PDFs, encrypted/malformed PDFs, unsupported structures and editions are rejected. The separate phone photo workflow supports English OCR for selected bank/intake layouts after optional opaque covering; this does not add general scanned-PDF or arbitrary visa-photo parsing.
- Phone visa checks work with one document; name comparison needs a supporting statement. Proof Mode requires confirmed relevant evidence and a fictional sample policy. No full official visa checklist or generic OCR.
- Human source evidence shows the original PDF, including its private values. Model input excludes raw documents/text, names, literal addresses, amounts, dates, account/passport IDs, filenames, notes and excerpts. It contains validated template identifiers, field enums and derived findings.
- Corrections change comparison values, preserve the original source and invalidate summaries/approvals. Reset clears app-held references and results; this is not forensic erasure of the browser/OS.
- AI selects tightly constrained sentences tied to authoritative findings. Invalid output is rejected; AI does not decide whether literal values match. It has no tools or document-submission capability.

## Verification and CI

```sh
npm run check
```

Runs typechecking, 151 automated tests in ten files and the production web build. Tests use committed fictional PDFs and explicit provider test doubles; they do not download a model or call a paid API. Mobile typecheck/lint and simulator rehearsal are separate checks in MOBILE/PROGRESS. The actual local model was separately verified on the demo laptop.

Optional real integration, with local Ollama running:

```sh
mkdir -p artifacts
node --import tsx scripts/model-smoke.ts address-conflict
```

This uses synthetic fixtures only and records actual request-byte/hash equality at the gateway transport. Browser automation is a maintainer tool requiring an installed agent-browser CLI/browser (the script invokes `npx --yes agent-browser` and may download tooling):

```sh
node scripts/browser-smoke.mjs --ai
```

Historical Phase 5 results: 82 tests/build passed; 25 browser checks passed with a real Ollama response, 33 captured local application requests, and zero checked accessibility violations. A separate real-model transport check passed at 5.376 seconds. Current phone/redesign/globe results and practical limits: [PROGRESS](docs/PROGRESS.md), [REDESIGN](docs/REDESIGN.md). Earlier browser evidence: [verification](docs/VERIFICATION.md).

CI is prepared in `.github/workflows/checks.yml` but **not enabled or tested on GitHub**. It has only a manual trigger and a job guard requiring repository variable `FREE_CI_VERIFIED=true`; that variable is currently absent. The existing account token cannot read billing usage without extra scope, so free allowance and a hard paid-usage stop were not verified. No permission upgrade, billing change or hosted run was made. Leave the gate unset; use local checks. The gate is not itself a billing cap. Private hosted-runner usage can incur costs beyond allowance; see [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions). Never enable paid usage; stop any free service when credits expire and use the local fallback.

## Current feature status

| Feature | Status |
| --- | --- |
| Two synthetic template adapters, comparison, original evidence, corrections/reset | Implemented; automated tests and actual browser flow passed |
| Strict minimized exact request and one-use approval | Implemented; unit/HTTP tests plus real gateway byte/hash equality passed |
| Downloaded local Ollama explanation | Implemented; actual model and production browser response validated |
| Rule-based backup | Implemented; controlled unavailable-health browser rehearsal passed, no model generation |
| Expo Go iPhone interface, local PDF engine and paired-Mac Qwen | Implemented; actual simulator flows and real Qwen response verified; physical device rehearsal remains |
| macOS setup/demo/license handoff | Documented; build/checks and local production launch verified on this Mac |
| Earlier standalone on-device Qwen implementation | Preserved separately; Release simulator result recorded; physical installation deferred, not current demo |
| Hosted CI | Prepared, gated off; billing allowance inaccessible and Linux run unverified |
| Selected Schengen layout, single-visa checks, Proof Mode | Implemented; actual PDF fixtures, purpose/privacy tests and Expo Go simulator flow passed |
| Five presentation languages | Implemented and simulator-captured; native-speaker translation review unverified |
| Photo covering, local English OCR, supported term definitions | Implemented for selected bank/intake photo layouts; covered-field exclusion and real Qwen simulator flow passed |
| Home/Review/Settings, appearance modes and country globe | Implemented; country/locale/theme navigation and native globe drag tests passed |
| Optional Featherless or other hosted inference | Not enabled; no paid activation or silent cloud fallback |
| Arbitrary document parsing, cloud hosting, case accounts/database | Not implemented |

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

Dependency/model versions, licenses and upstream links: [DEPENDENCIES](docs/DEPENDENCIES.md). Phase records: [PLAN](docs/PLAN.md), [PROGRESS](docs/PROGRESS.md). Screenshot originals, official blank visa reference and future feature brief are preserved in ignored local `references/` folders; they are not required for the baseline demo. Committed fictional filled examples run without the blank reference; regenerating visa fixtures requires the preserved reference/provenance or documented official download.
