# Phase 7 — app redesign revision

The user explicitly authorized a full phone redesign after the completed photo extension, also calling this Phase 7. This is a new revision of that phase, not a restart of the app or an additional feature phase. Preserve the working parser, source evidence, privacy boundary and local AI. Stop after this design checkpoint; the user wants a separate full app rehearsal next.

## Actual visual reference

Browsed and captured [Airbnb’s official redesigned-app release](https://news.airbnb.com/product-releases/airbnb-2025-summer-release). Downloaded and visually inspected the official Explore and Profile phone images: `All-new-app-US.jpg` and `Guest-profile-US.jpg`, using 640px variants after the first larger downloads timed out. Local page screenshots and image provenance are in ignored `references/design/`. These images are research references, not app assets or GitHub content.

Observed: rounded top search panel, restrained black/gray type, white surfaces, clear section headings, generous spacing, simple cards and a persistent bottom navigation bar. Applied those patterns with an original document-review layout, own SVG icons, a restrained coral accent, and accessible text/actions. No Airbnb logo, proprietary font, listing imagery, account flow or code copied into the app.

## What changed

- Expo Router Home, Review and Settings tabs; country picker is a separate hidden route. Home exposes Compare and Photo before the globe; no fake inbox, account or saved-case dashboard.
- PDF review: Documents → Review → AI explanation. Demo scenarios, extracted fields, Proof Mode and privacy detail are revealed when requested. Source pages, corrections, confirmation, deterministic checks, the exact full request/hash, explicit approval and clearly labeled rule fallback remain.
- Photo review: Cover → Review → Explain. Actual recognition stages stay visible; covered-image view, recognized fields and text details are optional. Local definitions, covering-before-OCR, bounded English input and exact-request approval remain. New photo UI/glossary remains English.
- Light, Dark and System appearance apply across app chrome, dialogs and photo-reader controls. Source PDF/photo pixels keep their original colors. No new storage of cases, preferences or location.
- Interactive globe uses bundled Natural Earth coastline coordinates and orthographic projection. Drag horizontally to rotate, tap a marker, or use the full accessible country list. Ten countries are **display preferences**, not ten document/legal adapters. Changing them never changes a parser, sample policy or AI request schema.

| Country | Suggested display language |
| --- | --- |
| United States / United Kingdom | English |
| Spain / Mexico | Spanish |
| Mauritius | French |
| India | Hindi |
| China | Simplified Chinese |
| Singapore | English |
| France | French |
| Canada | English |

These are app defaults, not claims about everyone’s language or a country’s only/official language. All five display languages remain selectable independently in Settings, including French for Canada and English for Mauritius. Display translations are local dictionaries, not new model responses; no native-speaker review is claimed. Some detailed technical/help strings retain English. Existing document format limitations remain unchanged.

## No-printer demo

`output/pdf/synthetic-bank-statement-photo-demo.pdf` is a visually verified one-page screenshot/photo example using invented bank details. Open on the phone, screenshot, then Choose a photo. The full-resolution PNG and built-in image are reliable alternatives. This image-based PDF is not accepted by the text-PDF comparison; use the existing typed visa/statement fixtures for that flow. Regenerate with the optional `scripts/photo-fixtures.py`.

## Verification and next checkpoint

Root checks: 146 tests passed, TypeScript and production web build passed. Mobile TypeScript and lint passed during implementation; final native redesign result5 passed48.857s/0failures; redesigned actual photo/real-Qwen result3 passed47.085s. Final captures visually checked, including the corrected React Native whitespace warning. Details/failures are recorded in PROGRESS. The focused simulator check covers navigation, ten countries, five language changes, both themes and source-backed PDF/Proof Mode controls. It does not constitute physical iPhone camera/import/LAN verification. A full human rehearsal remains the next separately requested task. No cloud or paid services enabled.

Open `exp://10.171.164.143:8082` in Expo Go on the same trusted Wi-Fi as the running Mac. Connect the private Mac QR **inside the app** via Settings. Do not open `/paired` in Safari. Mac still runs Ollama/Qwen; no phone-local inference claim.
