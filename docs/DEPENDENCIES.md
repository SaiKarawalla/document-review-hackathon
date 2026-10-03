# Verified dependencies — 2026-10-03

Versions below come from installed package metadata and the committed lockfile on the actual demo Mac, not assumed latest releases. Licenses were read from package metadata/local license files; upstream links identify the projects. `npm ci` installs the lockfile. Preserve applicable license/copyright notices when distributing dependencies; this is an inventory, not a legal compliance audit or a chosen license for this private application's own code.

## Direct JavaScript dependencies

| Package | Installed | License | Purpose / upstream |
| --- | --- | --- | --- |
| react | 19.3.0 | MIT | [UI components](https://github.com/facebook/react) |
| react-dom | 19.3.0 | MIT | [Browser rendering](https://github.com/facebook/react) |
| pdfjs-dist | 6.4.299 | Apache-2.0 | [PDF.js local extraction/rendering](https://github.com/mozilla/pdf.js) |
| zod | 4.6.5 | MIT | [Strict request/output validation](https://github.com/colinhacks/zod) |
| lucide-react | 1.51.0 | ISC; included Feather-derived icon notice | [Icons](https://github.com/lucide-icons/lucide) |
| @types/node | 26.6.4 | MIT | [Node types](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/node) |
| @types/react | 19.3.0 | MIT | [React types](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react) |
| @types/react-dom | 19.3.0 | MIT | [DOM types](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react-dom) |
| @vitejs/plugin-react | 6.1.1 | MIT | [React build integration](https://github.com/vitejs/vite-plugin-react) |
| tsx | 4.23.15 | MIT | [TypeScript server/scripts](https://github.com/privatenumber/tsx) |
| typescript | 7.0.2 | Apache-2.0 | [Typechecking](https://github.com/microsoft/TypeScript) |
| vite | 8.3.2 | MIT | [Dev server/build](https://github.com/vitejs/vite) |
| vitest | 5.0.3 | MIT | [Automated tests](https://github.com/vitest-dev/vitest) |

Installed LICENSE/NOTICE files also cover bundled third-party material (for example PDF.js CMaps/ICC and Vite/Vitest bundles). The table lists direct dependencies only; transitive packages and integrity hashes are recorded in package-lock.json. No CDN/runtime remote fonts are used. The removed pdf-lib is not an installed application dependency.

## Runtime and model

| Component | Verified version / identity | License / source |
| --- | --- | --- |
| Node.js | 26.5.0, macOS arm64; `.nvmrc` pins this tested runtime | [Node license and third-party notices](https://github.com/nodejs/node/blob/main/LICENSE) |
| npm | 11.17.0 | [Artistic-2.0 and notices](https://github.com/npm/cli/blob/latest/LICENSE) |
| Ollama CLI/server | 0.35.1; Homebrew installed 0.35.1_1 | [MIT license](https://github.com/ollama/ollama/blob/main/LICENSE) |
| Downloaded model | qwen2.5:1.5b; local ID prefix `65ec06548149`, 986 MB | [Qwen2.5-1.5B-Instruct official card: Apache-2.0](https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct), [Ollama tag](https://ollama.com/library/qwen2.5:1.5b) |

The model tag is a distribution tag and could change upstream; the ID records the tested download, not a pinned future pull. `ollama list` confirmed it is downloaded; real API inference was separately tested. No fine-tuning/training was performed. Official [Ollama FAQ](https://docs.ollama.com/faq) verified for cloud-disabled CLI configuration on this date. No paid API is installed/activated by setup.

## Optional fixture/verification tooling

Committed synthetic PDFs run without Python. To regenerate exactly this baseline's fixtures with a dedicated optional environment:

```sh
python3 -m venv .venv
.venv/bin/pip install reportlab==5.0.1 Pillow==12.3.0 pypdf==6.19.0
npm run fixtures
```

This writes synthetic files in public/fixtures; inspect differences before committing. Installed metadata: ReportLab 5.0.1, BSD license with local license.txt; [ReportLab source](https://hg.reportlab.com/hg-public/reportlab/). Pillow 12.3.0, MIT-CMU; [Pillow license](https://github.com/python-pillow/Pillow/blob/main/LICENSE). pypdf 6.19.0, BSD-3-Clause; [pypdf](https://github.com/py-pdf/pypdf). Poppler is local inspection tooling, not an app dependency; [upstream licensing](https://poppler.freedesktop.org/) applies independently. Browser automation through agent-browser is optional maintainer tooling downloaded via npx, not a locked application dependency or a prerequisite for `npm run check`; do not promise future tooling versions reproduce today's results unchanged.

## CI provenance and limits

The manual-only prepared workflow pins the verified official v4 tag commits: checkout `11d5960a326750d5838078e36cf38b85af677262`, setup-node `49933ea5288caeca8642d1e84afbd3f7d6820020`. The job uses the tested Node version with no cache/artifact upload or model download. This Linux hosted job has **not** run; macOS local checks are the verified result. `FREE_CI_VERIFIED` is absent, so its job is disabled. The billing endpoint returned HTTP 404 with an explicit missing `user` scope notice; token permissions were not expanded. Private runner minutes can exceed included allowance: [GitHub billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions). No automatic trigger, account variable, spending limit or billing setting was enabled/changed.
