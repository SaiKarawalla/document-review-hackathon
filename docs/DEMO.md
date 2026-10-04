Latest hackathon demo target: **Mac web app at http://127.0.0.1:8787 with local Qwen/Ollama**. Follow the original 90-second baseline steps below: actual synthetic PDFs, conflicting address/source, exact minimized request, explicit approval, real validated AI response, correction/reset. Print synthetic intake/statement copies for visual evidence. Native implementation is preserved/simulator-tested; phone installation is deferred by user. Ten presentation languages/Featherless and Phase 6 visa / Proof Mode remain planned, not demo claims. Public repo unchanged URL.

Current native demo target: **standalone Qwen on iPhone, Mac off**. Use MOBILE.md's updated steps. Load PDFs, inspect differences/source, load bundled Qwen, inspect/approve actual in-process request, require validated real AI response. Print synthetic intake/statement copies for visual comparison. Public code is available at the existing GitHub URL. Expo Go and paired Mac are superseded for the final phone demo. The scripts below preserve earlier desktop/paired-Mac rehearsals, not phone-runtime verification.

# Baseline demo and judge Q&A — Phase 5

This rehearses the working intake/statement baseline. Visa-paperwork review is the product goal; the identified Schengen adapter and purpose-driven Proof Mode are planned for Phase 6, not shown as working here. Event sponsor perks are optional hackathon resources, not assumed future funding; see HACKATHON-RESOURCES.md. No paid services are enabled.

## Before presenting

Open http://127.0.0.1:8787 with the built app and local-only Ollama running (README). Confirm **Ready · refresh** reports the downloaded `qwen2.5:1.5b`. Click **Reset case** and select **Address conflict**. Use fictional fixtures only. Both teammates should rehearse the actions below; the timings are a suggested script, not measured presenter performance.

## 90-second script

| Time | Action | Say |
| --- | --- | --- |
| 0–10 s | Click **Load demo pair**. | “We want to help teams review difficult visa paperwork. This working baseline uses two fictional PDFs: a client intake and a bank statement.” |
| 10–25 s | Point to the mailing-address conflict and two passages. Open **Statement · p. 1**, then press Escape. | “The addresses differ. Comparison code finds this from the actual PDFs; you can check the original page before deciding what to do.” |
| 25–45 s | Click **Preview exact AI request**. Show destination, full JSON and SHA-256. | “The AI receives comparison statuses and field names. Names, addresses, account numbers, amounts and source PDFs stay out of this request. The human can still see the original locally.” |
| 45–60 s | Check approval, click **Send approved request**, wait for the real response. | “Only after approval do these exact bytes go to our downloaded local model. It explains existing findings; it cannot decide which address is correct or submit documents.” |
| 60–80 s | In the statement card click address **Review**. Enter `14 Fiction Lane, Sampleton, ZZ 00000`, click **Confirm value**. | “A reviewer can correct the comparison value. Findings update, and the previous AI result and approval disappear. The original PDF remains unchanged.” |
| 80–90 s | Click **Reset case**. | “These two features work: evidence-backed comparison and inspectable minimized AI input. Next is the bounded visa adapter and purpose-based Proof Mode. This prototype does not approve visas.” |

If AI takes longer, keep showing the preview and evidence; omit the correction from the timed presentation and show it in Q&A. Never narrate a cached screenshot as a new model response.

## Offline backup and clean reset

If the model is already unavailable, load the pair and show the real findings/source/preview. Click **Check connection**; then **Show rule-based summary (AI unavailable)**. Say: “This summary comes from comparison rules. No model response was generated.” The UI labels it accordingly. The preview alone sends no generation request.

If an active model request stalls, use **Cancel**. Keep the deterministic findings as the demo; refresh connection status. The rule-based button is available only when the app reports AI unavailable. An invalid model response is rejected, not relabeled as a success. Do not stop an unrelated Ollama process to manufacture an outage. To test the offline path deliberately, use your own dedicated Ollama terminal, stop it with Control-C, verify unavailability, and restart with the README local-only command afterward.

**Reset case** aborts in-flight work, revokes PDF object URLs and clears app-held fields, previews and summaries. Then select the desired scenario and **Load demo pair**. **Matching documents** should show six consistent checks; **Missing information** shows absent data. A consistent case means no differences under these sample checks, not verified authenticity or eligibility.

## Judge Q&A

**What are the two core features?** Find missing/conflicting information from supported documents with source evidence, and show exactly the minimized AI request before sending it.

**How can AI be safe if the PDF contains passport or bank details?** The browser parses it locally. Code builds a new small object containing only allowed field/status enums; it does not redact and forward the remaining document. IDs, literal values and notes are excluded before the model is called. The original is still visible to the human reviewer. We have not trained a model to hide secrets.

**How do you know the preview matches the request?** The server serializes it once, stores those bytes in memory, hashes them, then sends those same bytes after one-use approval. We tested equality at the real gateway transport. This describes the API body; Ollama also applies its installed model template. It is not a guarantee about every process on the laptop.

**What is retained?** The app has no case database, document-content logging or analytics. PDFs, extracted fields and evidence are held in browser memory; pending reduced previews live in backend memory for up to five minutes or until used/discarded. Reset clears app references, not all possible OS/browser remnants or third-party logs. The downloaded model remains installed.

**Why use AI at all?** The experiment is a short local explanation of already established findings, within a strict sentence schema. Deterministic checks own the facts; this small model's output is deliberately constrained. We do not claim it discovers facts the rules cannot see.

**Can the model hallucinate?** Yes. An early real answer contradicted a finding and was rejected. Validation now binds explanation choices and overview to the authoritative findings. Unknown/duplicate/omitted IDs, contradictory and malformed output are rejected; it never clears human-review flags.

**What if a document says to send the account number to a URL?** Free-text instructions never enter the allowed context, and the model has no tools. The malicious synthetic fixture was tested against actual Ollama and captured gateway destinations. That tests this enforced boundary, not a model resisting a tool attack it could not attempt.

**Does it support visa paperwork today?** Not yet. The current baseline supports two explicitly versioned synthetic templates. Phase 6 is planned for one official Germany-linked German/English Schengen application layout and financial-evidence Proof Mode. Its reference was inspected, but no visa parser has been implemented or tested. We do not claim all visas, passport-page images or scans work.

**What did you actually test?** Phase 5 reran 82 automated tests, typechecking and the production build; 25 browser checks included actual PDFs, source rendering, a real AI response, correction/reset, rejected inputs, mobile layout and accessibility. A separate real transport check matched the approved 5413-byte body/hash; 14 source field records, zero literal values included, six derived findings. Those are fixture-specific measurements, not a privacy percentage or a universal accuracy score.

**Does a source viewer hide private details?** No. It displays the actual original PDF for human review. The minimized model request is separate. A visual redaction feature is not implemented.

**Does it prove financial eligibility?** No. Account/balance comparison requires matching account, currency and as-of date; otherwise it reports incomparability/review. Purpose-driven proof and sample policies are Phase 6 work, with no universal visa threshold implied.

**Can it run on a phone or in the cloud?** The phone-sized layout is tested. Currently app/API/model run on the Mac's loopback addresses; phone access, phone inference and hosted deployment are not implemented. Optional free sponsor cloud would need a verified no-paid-usage boundary, explicit destination/approval and separate real tests.

**How do login and costs work?** Local Ollama needs no account/API key. Repository operations use the Mac's existing authenticated GitHub account. No sponsor account was activated, paid usage enabled or model training performed. CI is prepared but gated off because billing allowance could not be verified with the existing token.

## Rehearsal record

Phase 5 automated rehearsal reran the full production browser flow with actual local inference: all 25 checks passed. This validates the click sequence, not that a person has performed a timed 90-second delivery. Phase 5 also rechecked real model transport, hash and literal exclusions at 5376 ms. `node scripts/offline-smoke.mjs` separately injects an explicitly labeled unavailable-health response in the test browser only: real parsed PDFs still produce the address conflict, the real rule summary is labeled as no model response, zero generation attempts occur, and reset clears it. This is a controlled UI rehearsal, not a real Ollama-daemon outage. It restores native fetch and live health afterward. No simulated output is labeled real AI.
# Native iPhone transition

Use [MOBILE.md](MOBILE.md) for Expo Go and private Mac pairing. The two core demonstrations remain supported-document comparison and the exact minimized AI request. Real PDFs parse on the phone; inference runs on the paired Mac. Explain that boundary explicitly to judges. The script below originally rehearsed the preserved desktop baseline; native verification is separately recorded in PROGRESS. Visa/Proof Mode is still Phase 6. No paid service is enabled.
