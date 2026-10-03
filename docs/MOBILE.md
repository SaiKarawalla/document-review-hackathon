# iPhone demo — Expo Go

The mobile target is a native React Native interface in Expo Go. Supported PDFs are parsed on the phone inside a disposable, network-disabled PDF.js WebView. Comparison and minimization use the same shared rules as the verified web baseline. Ollama runs on the paired Mac, not inside the iPhone. Visa support and Proof Mode remain the separately planned Phase 6.

## Start on the existing Mac

Keep the iPhone and Mac on the same trusted Wi-Fi or hotspot. Install the free Expo Go app on the iPhone. No Apple developer subscription, EAS build or cloud model key is required. The current iOS Expo Go app requires a free Expo login on both Mac CLI and iPhone, using the same account. This Mac is already signed in as **karawalla** (`npx expo whoami` verified); sign into that account in Expo Go on your phone. No login was created or password requested. [Expo's September 2026 login change](https://expo.dev/changelog/expo-go-57-login) exempts simulators, so the simulator passing does not verify your phone login.

From the repository root, install/generate assets once:

```sh
npm ci --no-audit --no-fund
npm --prefix mobile ci --no-audit --no-fund
npm run mobile:assets
```

Keep the existing cloud-disabled Ollama process running; see README for installation/model download. In separate terminals:

```sh
npm run build
npm start
```

```sh
npm run mobile:companion
```

```sh
cd mobile
npx expo start --port 8082
```

Scan the **Expo terminal QR** with the iPhone Camera to open Document Review in Expo Go. Allow local-network access when iOS asks. Then open the separate private pairing page on the Mac:

```sh
open artifacts/mobile-pairing.html
```

Inside Document Review, tap **Pair Mac for local AI → Scan Mac pairing QR** and scan that page. The pairing QR contains a temporary secret: keep it private, do not screenshot/share/commit it. Manual JSON paste is available for the simulator. Pairing expires after one hour; stop/restart the companion to revoke/renew it. Backgrounding the app clears the case and pairing; return and pair again.

Current development address is `exp://10.171.164.143:8082`; this changes with Wi-Fi. The companion binds only the Mac's private address on 8790. The app API (8787) and Ollama (11434) remain loopback-only. Do not expose Ollama or use a public tunnel. If the venue Wi-Fi isolates devices, use a trusted personal hotspot rather than a public deployment.

## Review flow

1. Tap **Load demo pair**. These are actual bundled fictional PDFs, parsed locally; scenario selection does not inject precomputed findings.
2. Inspect the address conflict, tap **Source** for the actual PDF/excerpt, or **Review** to confirm a value. Corrections recompute findings and clear any prior AI approval/result.
3. Pair the Mac, tap **Preview exact AI request**, then **View full exact request**. The iPhone verifies the request SHA-256. Names, literal addresses, accounts, amounts, dates, filenames, notes and source excerpts are excluded.
4. Explicitly approve and send. A successful result is labeled **AI explanation • Ollama on Mac**, with model, latency and matching request receipt. Unavailable/invalid inference is an error; the separate rule-based summary says **no AI response**.
5. Reset clears app-held case data, results and approval. Cancel aborts outstanding operations. The original PDF remains visible to its human reviewer; the prototype does not visually redact it.

**Choose PDFs from Files** accepts only the two supported text-layer template editions. The picker temporarily copies a file into Expo app cache to read it, then removes the app copy even on validation failure. It does not delete the user's original file. Raw documents and extracted values are then held in app/WebView memory; there is no case database. Reset is not forensic memory/OS erasure.

## Security boundary and development limits

Only strict derived facts enter the companion. Requests/responses use authenticated AES-256-GCM encryption with a random temporary key delivered through the private pairing QR, correlated request IDs and replay/expiry checks. The companion has no upload route, rejects browser origins, limits bodies/rates, and forwards only allowlisted actions to the existing single loopback gateway. Exact preview approval, output validation and the model concurrency limit remain there.

This local development connection is HTTP with encrypted application payloads, **not TLS**. Network metadata is visible; Expo's development bundle delivery uses the trusted LAN. A compromised phone/Mac, malicious development server, someone with the pairing QR, screenshots/backups or OS tooling can defeat this prototype's assumptions. It is not a production security/compliance certification. Use synthetic documents for the hackathon.

No phone-local inference, OCR, arbitrary PDF/visa adapter, accounts, cloud hosting or paid build is implemented. Real-device Camera/Files permissions and venue connectivity require a rehearsal on the user's physical iPhone; simulator results alone cannot prove them.

## Local checks

```sh
npm run check
npm --prefix mobile run typecheck
npm --prefix mobile run lint
cd mobile
npx expo install --check
```

Root tests include strict mobile schemas, encrypted transport/interoperability, replay/expiry, origin/host rejection, preview ownership and raw-value exclusion. Native simulator verification is separately recorded in PROGRESS; do not count controlled provider test doubles as actual model inference. Expo dependency audit currently reports unresolved upstream/transitive advisories; see DEPENDENCIES. Hosted CI remains disabled and no paid usage is enabled.

Optional local XCTest runner: `python3 scripts/ios-smoke-project.py` generates a private ignored runner using the current pairing. It requires installed Xcode, Expo Go and the documented booted simulator; generated reports may contain private pairing data and must not be shared. No Apple signing subscription is needed for this installed-app simulator rehearsal.
