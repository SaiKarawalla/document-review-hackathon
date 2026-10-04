## Opening repair — latest instructions

Companion startup now generates `artifacts/iphone-open.html` (Step1, scan with iPhone Camera to open Expo Go) and `artifacts/mobile-pairing.html` (Step2, scan only inside app Settings → Pair Mac for local AI → Scan Mac pairing QR). Safari GET of the companion address now shows an Open in Expo Go button, never a key. Refresh Safari if an old rejection is cached. Restarting companion revokes prior pairings: use its new private QR. Same Wi-Fi, Mac awake, Expo port8082. This is local development, not a cloud deployment.

# Latest phone redesign revision
Expo Go now opens Home, with Review and Settings tabs. Pair Mac and change appearance/language in Settings. Home country/globe selection is a preference, not country-specific visa support. PDF: Documents -> Review -> AI. Photo: Cover -> Review -> Explain. Optional fields/source/privacy/Proof details remain accessible. No-printer demo files/script: DEMO.md; current design: REDESIGN.md. Older layout/platform instructions below are historical.

# iPhone demo — Expo Go with Ollama on the Mac

Latest user-selected target. **The Mac must stay awake/running and share trusted Wi-Fi/hotspot with the iPhone.** No Xcode, cable, paid build or inference account is needed for this path. Standalone phone-Qwen source is preserved in StandaloneReviewScreen.tsx; its older setup/results are in STANDALONE-MOBILE.md, not the current demo.

## Start/reproduce

From this existing repository:

```sh
npm ci --no-audit --no-fund
npm run build
npm run mobile:assets
npm run mobile:photo-assets
cd mobile
npm ci --no-audit --no-fund
npm run typecheck
npm run lint
```

Keep these separate terminals running:

```sh
# Ollama; model is already downloaded on this Mac
OLLAMA_NO_CLOUD=1 OLLAMA_HOST=127.0.0.1:11434 ollama serve
# Repository root
npm start
# Repository root
npm run mobile:companion
# mobile/ directory
EXPO_NO_TELEMETRY=1 npx expo start --go --lan --port 8082
```

Do not start a duplicate Ollama daemon if already listening. New machines need Ollama and `ollama pull qwen2.5:1.5b` once, with internet for initial setup. No paid keys.

1. Install/open current Expo Go on iPhone. Current physical iOS Expo Go requires the **same free Expo account** as CLI; Mac already authenticated as `karawalla`. Sign in yourself; never share a password with the assistant. Simulator is exempt. [Official Expo Go changelog](https://expo.dev/changelog/expo-go-login).
2. Scan Metro’s **app-opening QR** with iPhone Camera. Current LAN URL: `exp://10.171.164.143:8082` (IP can change; use the current terminal/QR).
   `http://10.171.164.143:8790/paired` is the companion address. Safari now shows a public **Open in Expo Go** button and instructions; encrypted API requests still require private pairing. Use the Step 1 Expo URL/QR, then scan the separate private pairing QR inside the app.
3. In Document Review, open **Settings → Pair Mac for local AI → Scan Mac pairing QR** and scan the separate **Step 2 private pairing QR** from `artifacts/mobile-pairing.html` on the Mac. This expires one hour after companion startup; restart companion and re-pair if expired. Do not share/commit that page or pairing JSON. Manual paste is available for simulator/testing.
4. Choose language: English / Español / हिन्दी / 简体中文 / Français. Load Address conflict for the original demo; Visa name conflict or Visa only for the new review; Visa + statement then Prove Financial Resources for Proof Mode.
5. Inspect evidence and original PDF pages. For Proof Mode, expand inclusion/exclusion decisions, check selected values and confirm selected evidence. Policy is explicitly fictional: USD3,000, statement within45days of2026-10-03; no visa eligibility conclusion.
6. Preview exact AI request, inspect full bytes, explicitly approve, then send. Real Qwen runs on the Mac. Translated display is labeled; request/source data stays unchanged. Corrections/purpose changes/reset revoke preview/summary; display-only language switching does not make another request.
7. Reset/background clears case references, preview/summary and background pairing; re-pair afterward. Original Files PDFs remain yours. Choose PDFs briefly creates/deletes a private cache copy.

## Where data goes

Phone-local PDF.js runs in a disposable network-disabled WebView, with page/excerpt evidence and confirmation. Only strict enum/derived context enters AES-256-GCM companion over private-LAN HTTP; no original document upload route. Application encryption is **not TLS** or production certification. Trusted Expo bundle delivery/LAN, iOS/keyboard/screenshots and device security remain assumptions. Ollama is never exposed on Wi-Fi; gateway stays loopback. No cloud fallback, logs of document content, case database or paid service.

Accepted: English client-intake-v1 and bank-statement-v1; selected four-page DE/EN Schengen typed reference layout. Not arbitrary visas, passport-page photos, scans/handwriting, drawing PDFs or unrelated files. Five UI languages do not imply five-language document parsing. No training required to hide data: code excludes values before model access.

## Verification status

Phase 7 adds separate English photo OCR/cover/word-highlight/glossary review. See [PHOTO-REVIEW](PHOTO-REVIEW.md) and latest PROGRESS. Final Expo Go photo flow passed56.183seconds/0failures, including real Qwen;146 core tests and mobile typecheck/lint passed. Existing text-layer visa PDF support is preserved; photo support does not add arbitrary visa/legal/SSI parsing. Physical camera/picker remains unverified.

130 core tests, web build and mobile typecheck/lint passed; real Phase6 model checks passed (5.85s missing visa;4.19s confirmed proof), exact approved/outgoing body equality and checked raw-value exclusion. Full ExpoGo Phase6 UI rehearsal passed:116.186seconds,0failures; all5 languages, visa evidence/missing/name cases, proof counts/confirmation, exact preview/approval and real paired Ollama. See PROGRESS. Physical iPhone Camera/Files/login/network remains unverified until the actual phone opens the app. Previous simulator/native Release checks are recorded separately. Mobile dependency advisories remain unresolved (29,19high/10moderate); no paid service or incompatible forced upgrade enabled.
