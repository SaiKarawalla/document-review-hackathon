# Covered photo review — Phase 7

Google Lens-style extension in the existing Expo Go app. Photos/text stay on the phone; Qwen explains derived review facts on the paired Mac. No cloud, payment, training or new repository.

## Use

Open **exp://10.171.164.143:8082** in Expo Go on the same trusted Wi-Fi as the running Mac. Opening **http://10.171.164.143:8790/paired** in Safari returns a rejection because it is an encrypted API, not the application. The correct app-opening QR is `artifacts/iphone-open.html`. Scan the private pairing QR from `artifacts/mobile-pairing.html` **inside the app**; never share that QR/key.

Pair the Mac first if you want real Qwen explanations. Tap **Scan and cover a photo**, then Take a photo, Choose a photo, or Try synthetic statement photo. The sample is an actual image passed through OCR, not preloaded extracted text.

Drag across complete private values, including their edges. Wide/extra-wide brushes draw opaque black covers. Undo works before analysis. **Analyze visible photo** locks a flattened covered image and clears the editor's original backing canvas. Start a new photo to change covers. Inspect/correct the visible text and confirm it. **Show terms** highlights actual recognized word coordinates; tap for a local definition. A native term list is also available. Definitions and the local field overview are not AI output.

Preview the exact minimized request, approve it, then ask Qwen to explain. AI receives only the template, field read/unread states, cover-segment count and confirmation status. It does not receive the photograph, raw text, exact amounts or identities. The local overview displays readable field details; the model explains review status rather than freely summarizing the document contents.

## Scope and privacy limits

- English printed, upright JPEG/PNG; under 8 MiB and 20 megapixels; resized locally to maximum side 1,600 pixels. At most 300 OCR lines/20,000 characters/2,000 brush segments; 45-second OCR timeout. Cancel/timeout destroys the WebView/worker.
- Structured photo review recognizes selected bank statement and client intake label layouts, using multiple independent anchors. A filename or title alone is insufficient. These are bounded layouts, not every real bank form.
- Drawings/unsupported legal/SSI layouts can have visible text/glossary inspected but get no fabricated structured AI review. No photo visa/eligibility support. Existing visa PDF comparison remains a separate workflow.
- Unread fields mean covered, absent or unclear; never infer the hidden value or claim the original document has an error. Duplicate labels and malformed money/currency/ISO dates remain unresolved. No cross-document conclusion from one photo.
- Existing five-language PDF review stays available. New photo UI/OCR/glossary is English, not five-language OCR or a reviewed translation expansion.
- The phone accesses original pixels to show them for covering. Analysis sees only flattened pixels; whole OCR lines intersecting covers are discarded conservatively, including edge fragments. Complete coverage is the user's responsibility. No automatic secret detection or forensic memory/OS erasure claim. Original Photos assets are retained; temporary picker cache copies are deleted.
- Tesseract worker, portable LSTM WASM and English data are embedded. Language caching is disabled; fetch/CSP allow only local data/blob resources and the embedded language response. No runtime CDN, OCR upload, cloud vision, analytics or case database.
- Strict Zod context independently rejects image/text/extra keys/arbitrary field strings. No name/account number/balance/date/filename/excerpt/coordinates enter the model gateway. Exact preview/hash/one-use approval, semantic output validation and all existing destination/rate/size guards remain. Corrections/New photo/Back revoke previews/results. Background clears the photo, returns home and clears pairing.

## Reproduce and evidence

After root `npm ci`, run `npm run mobile:assets` and `npm run mobile:photo-assets`, then mobile `npm ci`, typecheck and lint. Use existing local-only Ollama, root `npm start`, root `npm run mobile:companion`, and Metro on 8082. Restart both API and companion after schema changes; companion forwards to loopback API. Never expose Ollama on Wi-Fi. PNG fixtures are committed; Python/Pillow is optional regeneration tooling. Generated HTML/model/test artifacts remain ignored.

Checks: `npm run check`; `node scripts/photo-browser-smoke.mjs` (actual OCR, black-pixel coverage, covered/uncovered control, word taps, drawing, no HTTP); `node --import tsx scripts/photo-model-smoke.ts` (real Qwen from actual OCR-derived facts, exact outgoing bytes). Latest core check:146 tests; mobile typecheck/lint passed. Final native Expo Go result-6 passed56.183seconds/0failures, including real Qwen, source-value exclusion, term definition, approval and reset. Browser covered/uncovered OCR1.927/1.946seconds, drawing0.831seconds;0HTTP requests. Direct Qwen7.220seconds;2derived findings;approved/provider bytes equal. See PROGRESS for failures and final checkpoints. Physical camera/photo-picker/LAN remain unverified on the user's phone.

SSI glossary checked against [Social Security Administration](https://www.ssa.gov/ssi), with no eligibility interpretation. APIs checked against [Expo SDK57 ImagePicker](https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/). OCR uses installed source and [Tesseract local options](https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md), overriding all remote defaults.
