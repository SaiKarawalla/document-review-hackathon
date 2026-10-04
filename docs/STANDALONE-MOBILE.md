Latest user steering, 2026-10-03: Phase 6 is now in progress for iPhone / Expo Go with local Ollama Qwen on the paired Mac. Mac must stay running, same trusted Wi-Fi. Add FIVE presentation languages in Phase 6: English, Spanish, Hindi, Simplified Chinese, French. Supersedes Mac-only / standalone-phone-only / ten-language Phase 7 plans. Preserve standalone code; no paid services, no automatic Phase 7. Visa review and Proof Mode stay in Phase 6. Language display is separate from supported PDF adapters; translated canonical AI text is labeled.

Latest user decision, 2026-10-03: **demo on the Mac** and stop phone-installation work. This standalone implementation is preserved and simulator-verified, not the required current hackathon interface. Real native Qwen took 14.2 seconds; full source/preview/approval/exclusion/correction/reset/background test passed with all old Mac services off. Actual iPhone installation was not possible without device/signing/cable and is deferred by the user. The following setup remains for a later optional device install.

# Standalone iPhone app — on-device Qwen

Latest user requirement: the Mac will be off during the hackathon demo. This guide supersedes the previous Expo Go/paired-Mac setup. Work is limited to correcting the mobile checkpoint; visa/Proof Mode Phase 6 has not started. Repository is PUBLIC: https://github.com/SaiKarawalla/document-review-hackathon.

## What runs where

The installed Release app bundles its JavaScript, real synthetic PDFs, PDF.js engine, native llama.rn runtime and official Qwen2.5-0.5B-Instruct Q4_K_M GGUF. PDF extraction, deterministic comparison, evidence/corrections, exact minimized prompt preview and AI inference run within the iPhone app. No Mac server, Ollama daemon, Wi-Fi, cloud credentials or paid API is required during use. The Mac/Xcode is needed to build and install, not to process documents afterward. Expo Go cannot run this added native library.

The two supported synthetic template editions remain intake-v1 and statement-v1. Visa support/Proof Mode remain Phase 6 work. Do not imply arbitrary PDFs or scans are supported.

## Build on this Mac for free

From the repository root:

```sh
npm ci --no-audit --no-fund
cd mobile
npm ci --no-audit --no-fund
node node_modules/llama.rn/install/download-native-artifacts.js
cd ..
npm run mobile:assets
npm run mobile:model
cd mobile
npm run typecheck
npm run lint
```

The first dependency/model download needs internet; model file is 491,400,032 bytes and SHA-256 verified against pinned official metadata. Both model and generated native projects are ignored in Git. The config plugin verifies the model checksum before adding it to native resources; no increased-memory or special paid entitlements are enabled. Model notice/license/source details are in DEPENDENCIES.md.

To install on a physical iPhone, connect it with a cable, unlock/trust the Mac, enable Developer Mode if prompted, and sign into Xcode Settings → Accounts with your own Apple account. Use the free Personal Team; do not enroll in paid membership or enable billing. Never give the assistant your password. Then:

```sh
npm run ios:standalone
```

Select the connected iPhone. This uses a **Release** build: bundled JavaScript is essential to remove the Metro/dev-server dependency. If Expo reports no signing profile, open the generated ios/DocumentReview.xcworkspace in Xcode, select the app's Signing & Capabilities → your Personal Team, and run with Release configuration. Do not manually commit/edit generated iOS source. Personal Team provisioning expires after 7 days and must be reinstalled; see [Apple's free testing limits](https://developer.apple.com/help/account/basics/about-your-developer-account). A paid App Store/TestFlight account is not being purchased.

For a simulator-only Release build:

```sh
npm run ios:simulator
```

Native setup: [Expo local Release builds](https://docs.expo.dev/more/expo-cli/#compiling-ios), [llama.rn](https://github.com/mybigday/llama.rn). No EAS build/login/billing service is used.

## Demo

1. Open Document Review directly, not Expo Go. Load **Address conflict → Load demo pair**. Show the synthetic paper copies if helpful.
2. Inspect the conflicting address and original source PDF; optionally confirm a corrected value and see the checks recompute.
3. Tap **Load Qwen on this iPhone**. This loads the bundled 491 MB model into the local native runtime.
4. Tap **Preview exact AI request → View full exact request**. The preview contains the model metadata, actual formatted prompt, constrained JSON output schema and completion options. It excludes literal names, addresses, accounts, identifiers, financial values, dates, raw PDFs, notes and excerpts.
5. Explicitly approve, then **Explain on this iPhone**. Only a validated actual native completion is labeled AI. Invalid/cancelled/timed-out output is rejected. The separate **Show rule-based summary (no AI)** is always labeled accurately.
6. Reset clears the case/approval/result. Backgrounding also releases the model context; reload Qwen on return. This trades warm-start speed for bounded lifetime of context.
7. Physical demo acceptance (deferred by latest user choice): disable Wi-Fi/mobile data, close all Mac services or turn Mac off, terminate/reopen the installed app, load the pair/preview/approve and require a real validated Qwen response. This physical test is still pending.

## Privacy and practical limits

Raw documents and extracted fields are never passed to the model, even though both run on one device. The in-process gateway accepts only the strict derived-fact schema, prepares the model-formatted prompt before approval, stores/hash-verifies the exact serialized completion request and consumes approval once. Corrections/reset/provider/model changes require fresh approval. No fetch/network request, cloud fallback, pairing key or server is used by this model path. The native runtime converts the displayed JSON schema into its constrained sampling grammar; model weights/runtime defaults are separately identified, not user document content. This does not mean all native internal tensor/runtime operations are represented as JSON.

Source documents remain visible to the human. Reset/background removes app references and clears/releases the inference context; it is not forensic erasure of iOS memory, Files originals, keyboard/clipboard, OS snapshots or screen recordings. This is a synthetic prototype, not production certification or document authenticity/eligibility advice. Small model has limited freedom: it selects allowed explanations rather than deciding authoritative comparisons. Phone model size/memory/performance still requires physical-device verification.

Current verification: 107 core tests pass (including native gateway test doubles; these are not real model responses), mobile typecheck/lint pass. Standalone Release build and one complete native XCTest passed; actual on-device Qwen response 14.2 seconds. No physical phone connected and no valid signing identity found on this Mac. Prior Expo Go/Mac-Ollama tests are historical evidence for the reused document UI, not evidence of the new phone runtime.29 mobile dependency advisories remain unresolved; no incompatible force downgrade. See PROGRESS for actual native results once available.
