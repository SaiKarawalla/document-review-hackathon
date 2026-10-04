# Hackathon language and sponsor plan — not implemented

Latest user steering, 2026-10-03: demonstrate on the Mac to avoid iPhone installation delays. Preserve the tested standalone mobile implementation; stop phone installation work. Use the event's Featherless offer when verified free. Plan approximately ten useful presentation languages with a toggle, explicitly reject unsupported documents, and keep the two core features central. This request plans the additions; it does not start another feature phase.

## Scope and order

Phase 5 is complete. Native standalone correction is preserved and simulator-verified; physical phone installation is deferred by the user. Next separately authorized **Phase 6** still delivers the selected Schengen visa adapter and Proof Mode/context minimization on the existing Mac interface. Do not discard that already requested visa feature to pursue extra sponsors.

Add a separate **Phase 7 hackathon checkpoint** for language presentation and optional verified-free Featherless. These are event features, not assumed post-event resources. One phase per instruction. First ship the four priority presentation languages, then complete the other six within the same Phase 7 only if their checks pass. A partial set must be labeled with the actual tested count, never advertised as ten until all ten work.

## Proposed ten presentation languages

| Locale | Language / toggle label | Priority |
| --- | --- | --- |
| en | English | Default / first four |
| es | Español — Spanish | First four |
| hi | हिन्दी — Hindi | First four |
| zh-Hans | 简体中文 — Simplified Chinese | First four |
| fr | Français — French | Expansion |
| pt | Português — Portuguese | Expansion |
| ar | العربية — Arabic | Expansion; right-to-left layout required |
| de | Deutsch — German | Expansion |
| ja | 日本語 — Japanese | Expansion |
| ko | 한국어 — Korean | Expansion |

This is a practical audience choice, not a claim that these are the ten most spoken languages or a measured judge preference. No claim of 201 languages. Native script labels, keyboard-accessible selector, readable wrapping and suitable fonts matter more than flag icons; do not equate countries with languages.

### Keep localization separate from document support

Translate the interface, finding labels/statuses, approved explanation vocabulary, follow-up sentences, privacy/approval messages and unsupported-input errors. Keep original source excerpts/values in their original language; do not silently translate names, addresses or IDs, or change comparison results when switching the display language. Arabic needs direction-aware layout, with hashes/JSON/source values preserved in their correct direction.

The current parser supports two specific English synthetic template editions. Phase 6 adds one inspected German/English Schengen reference layout. A Hindi/Chinese interface does **not** make arbitrary Hindi/Chinese documents supported. Do not claim multilingual extraction, OCR or translation of raw paperwork until an actual adapter and its fixtures are tested.

### Qwen and reliable explanations

The official [Qwen2.5-1.5B-Instruct model card](https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct) describes broad multilingual capability, including Chinese and Spanish. That is not evidence that this application's ten languages, especially Hindi wording, have been tested. No training/fine-tuning is needed to hide private values: code excludes those values before inference.

For the bounded demo, retain the canonical, semantically validated Qwen explanation and map its allowed sentences to reviewed display translations. Label them as translated presentation of a validated AI explanation, not a new model-generated translation. This avoids exposing raw paperwork to a translation service and preserves the current output constraints. The rule-only fallback uses the same vocabulary but remains clearly labeled **no AI response**. Never call the fallback a Qwen response.

Changing only display language can rerender an existing validated result without contacting AI. If a later implementation sends a locale enum or translated prompt/output schema to the model, bind it into the actual request and invalidate old approval on locale changes. The full exact model request stays visible as its actual bytes/text; do not substitute a translated rendering for what was actually sent. Every new cloud/model request requires explicit preview and approval.

Acceptance: all dictionary keys present; no unsupported locale silently accepted; accurate fallback message; findings/statuses/source values unchanged across toggles; no raw identifiers in either local/cloud request; Chinese/Hindi/Japanese/Korean wrapping and Arabic direction checked visually. Native-speaker review where available; disclose unreviewed translations. Real multilingual model generation is a separate claim requiring actual per-language model tests.

## Featherless: use the real event benefit if available

The participant-perks screenshot was visually rechecked. It advertises **one month of free Featherless inference**, with access details in event email. The **$300 credits on the prize slide are winner-only**, not existing participant credit. Other sponsor offers are recorded in HACKATHON-RESOURCES.md; no voice, workflow automation or domain feature is added merely to consume a perk.

The official [quickstart](https://featherless.ai/docs/quickstart-guide) uses an API key and OpenAI-compatible chat completions, with Qwen/Qwen2.5-7B-Instruct as its example. Treat that as a candidate, not guaranteed event-account access. Verify current model availability and plan eligibility using the [model API](https://featherless.ai/docs/api-reference-models) and [plan API](https://featherless.ai/docs/api-reference-plan), then verify the actual trial/credit expiry and no-paid-renewal/overage terms in the redeemed account. An account or endpoint listing alone does not establish a free balance or spending cap.

Credential readiness is currently unverified. Do not read email/create an account/subscribe without appropriate user authorization, and never request a key in chat. The user can redeem the emailed offer and place the API key in a local ignored environment file when Phase 7 is started. Do not print the key or commit it; screenshot originals/redemption codes remain ignored.

Implementation acceptance, once separately authorized:

1. Verify genuinely free access and a hard stop before paid usage. No payment method, paid upgrade, automatic renewal/top-up or usage outside the verified allowance. If terms cannot establish free-only operation, leave cloud unavailable and continue locally; do not promise an invented software counter prevents provider billing.
2. Offer explicit **Local Qwen on this Mac** / **Featherless cloud** selection. Keep a single protected backend gateway; fixed HTTPS endpoint, server-side key, bounded requests, timeout/cancellation and strict schema/output validation. The cloud path receives the same derived facts, never raw PDFs, literal private fields or excerpts.
3. Display that minimized facts leave the Mac for Featherless; show exact actual body/model/destination and obtain new hash-bound approval. Authentication keys stay out of both the preview and AI input.
4. On free-access expiry/exhaustion or provider 401/402/403/429/connection errors, stop that service and preserve findings. Offer local Qwen with a new preview/approval; no silent failover, top-up or hidden retry.
5. Require a real approved Featherless response plus exclusion/hash/semantic checks before claiming integration works. Test simulated quota failures as tests, never as real cloud responses. If key/terms are unavailable, report optional cloud as unimplemented and retain the working local demo.

Time box: 15 minutes to confirm credential/free-access readiness, then keep useful local work moving. Provisional implementation estimate: 45–90 minutes for presentation-language dictionaries/layout/tests, plus 45–60 minutes for a ready provider's gateway/real-response verification. These are estimates and exclude unresolved account setup, native-speaker review or arbitrary-document support. If event time is short, finish the four priority languages and the visa/privacy demonstration before cloud/extra locales.

## Unsupported documents: fail before AI

Current code already checks file/page/text limits, text layer, exact template/version markers, notice and required section structure locally. JPG/PNG drawings are not PDF inputs; an image-only drawing PDF has no supported text layer; a text-bearing drawing still fails the supported-template/structure checks. Do not use a cloud vision model to decide whether a drawing is relevant, guess a document type from its filename, or fabricate findings for unsupported input.

Phase 6/7 acceptance adds an explicit **synthetic child-style drawing** (image and PDF), random text PDF, malformed/encrypted/oversize file and unsupported visa edition rehearsal. Require a clear localized message listing supported formats, no fabricated finding/model response, no raw upload/model invocation, and invalidation of any obsolete approval. Rejecting a format is not authentication or proof that a supported document is genuine. Unsupported language/edition/scan is distinct from a missing value within a supported document. Current rejection paths/tests exist, but the specific child-drawing fixture has not been tested yet.

Current status: planning only. No language toggle, translation dictionaries or Featherless provider has been implemented or tested. Mac local Qwen remains the working hackathon runtime. Phase 6/7 require separate user instructions.
