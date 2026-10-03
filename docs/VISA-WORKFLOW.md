# Selected hackathon visa workflow

Planning checkpoint, 2026-10-03. **Not implemented.** The user delegated format selection to the assistant. Choose a fictional adult applying for a short-stay tourism visit to Germany, using the official German/English harmonised Schengen application plus the existing synthetic bank-statement-v1. This gives a clear missing-field and cross-document conflict demo for the intended visa audience, and supports the financial-evidence purpose without needing cloud access or a new model.

## Verified reference

The [German Federal Foreign Office's visa page](https://www.auswaertiges-amt.de/en/visa-service/215870-215870) links this [bilingual application PDF](https://www.auswaertiges-amt.de/resource/blob/207836/9a9d55318d45c3f1be701084c266be99/visumantrag-data.pdf). Retrieved 2026-10-03 and preserved unchanged locally at ignored `references/official-forms/de-schengen-application-de-en.pdf`.

- SHA-256: `8e92a507b910469944689c486e477d446451f750bf758278c0861dd8f3f19482`.
- 284408 bytes; four A4 pages; text layer; unencrypted; no AcroForm fields or PDF JavaScript per pdfinfo.
- Text extracted with pdftotext; all four pdftoppm renderings visually inspected. Renderings are ignored under `artifacts/visa-reference/`.
- PDF metadata reports creation in April 2022. Do not call that a verified official form edition or assume every mission uses this layout. Identify our adapter by reference layout plus our own version, not by an invented official version.
- European Commission download was unavailable (HTTP 429); used the freely linked official alternative instead. No access/account/paywall bypass or sponsor activation.

## Planned bounded extraction

The form is not digitally fillable. Add a browser-local adapter for this four-page layout: validate labels, page geometry and positional anchors, then extract typed text within verified field regions. Generate fictional filled PDF examples with a visible synthetic-demo label. Do not make matching a filename or sample identifier the recognition algorithm. Retain actual source pages/regions/excerpts and editable confirmation. Check populated fixtures visually and in the browser before claiming parsing works.

Relevant source locations inspected:

| Page | Candidate fields |
| --- | --- |
| 1 | Surname (1), given names (3), birth date (4), travel document number (13), issue/expiry dates (14/15) |
| 2 | Home address and email in a combined region (19), purpose (23), destination (25), arrival/departure (27) |
| 3 | Accommodation/inviter (30), travel/living cost coverage and means of support (32) |
| 4 | Declarations, place/date and signature area |

Start with selected typed fields, not a complete application checklist. The combined address/email region requires separation/confirmation before any address comparison. Checkbox, handwritten-signature and scan recognition are not established. Conditional guardian/family-member/sponsor fields must not all be flagged as universally mandatory; the printed form explicitly has exemptions. Use a declared fictional adult-tourism sample policy and leave unsupported branches unresolved. Do not infer visa eligibility from names or nationality.

## Demo acceptance for Phase 6

1. **One visa form:** show a locally extracted missing travel-document-number finding and invalid date ordering under the labeled sample policy. A second document is unnecessary for these checks.
2. **Visa plus statement:** compare applicant name with account-holder name, showing both true source passages. A meaningful name difference stays unresolved for human review; normal spacing/case may be normalized. Provide matching, missing and conflicting fictional cases.
3. **Proof Mode:** select “Prove Financial Resources.” Evaluate relevant confirmed statement evidence and applicant-name consistency locally; show included/excluded fields and measured counts with reasons. The visa form has no declared bank account or balance: do not fabricate a second financial value to compare. A configurable sample threshold, if demonstrated, is a fictional policy, not Germany's legal threshold or proof that a visa will be granted. Missing/invalid currency, statement dates, identity or applicable evidence prevents a successful sample result. Existing intake/statement account/currency/as-of comparability checks remain intact.
4. **Exact AI preview:** only allowlisted derived statuses such as name consistency, selected missing-field types and evidence/policy outcomes reach the model. Passport number, birth date, name, address/email, nationality, bank details, exact amounts/dates, notes, raw pages and source passages stay local. The human may view originals; the AI receives the approved minimized request. Changing policy or confirmed evidence invalidates approval and prior output.
5. **Verification:** parse actual filled PDFs, test layout mismatch/unsupported formats, missing/conditional fields and single-document behavior, preserve baseline tests, inspect desktop/mobile evidence, and capture browser/backend model traffic for identifier exclusion and approved-body equality. Use real Ollama responses for demonstrated AI output; tests may use clearly separated test doubles.

Current state: reference research and scope choice complete; no visa fixtures, parser, single-document checks or Proof Mode exist yet. Phase 4 tests cover only the original baseline. Phase 5 and Phase 6 each await their own instruction under the user's one-phase rule. Arbitrary visas/passport-page photos and unrelated workflows remain outside the selected adapter. No paid service is required or enabled.
