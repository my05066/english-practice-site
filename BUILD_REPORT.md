# Build Report — 每日雅思口语练习站 (English Practice Site)

Built: 2026-11-24. Approved by Shi 2026-11-24 17:23 CST ("算了先这样做吧") after the design gate in DESIGN.md.

## Live / Repo

- Live site: https://my05066.github.io/english-practice-site/
- Repo: https://github.com/my05066/english-practice-site (public)

## What was built

Vue 3 + Vite static site, hash routing, no login, localStorage only, deployable to GitHub Pages. Three pages:

1. **今日一练 (`/`)** — daily rotating topic from the 7 Week 1 Part 1 topics (day-of-year % 7), Chinese/English Q&A, chunks, keywords, link into shadowing.
2. **48 音素 (`/phonemes`)** — interactive phoneme chart, mouth diagrams, example words, minimal-pair listening quiz (θ/s, v/w, ɪ/iː, plus æ/e), error book in localStorage.
3. **拆词与跟读 (`/practice`)** — built-in dictionary word breakdown (syllables + IPA + per-phoneme playback), honest "词库里还没有" for unknown words; shadowing flow: Chinese prompt → 5-second countdown (model text hidden until countdown ends) → sentence-by-sentence shadowing with recording/playback → one-click chunk saving (deduped).

## The 4 design decisions applied (2026-11-24)

1. **48 phonemes accepted as-is** — 44 phonemes + ts/dz/tr/dr consonant combinations, honestly labelled on the page ("20 个元音、24 个单独辅音和 4 个辅音组合"), matching the Chinese textbook count of 48 个国际音标.
2. **Browser speech en-GB → en-US everywhere** — `src/audio.js` now sets `utterance.lang = 'en-US'` and prefers an en-US voice. No `en-GB` remains in `src/`.
3. **Mobile bottom fixed tab bar added** — 今日一练 / 音标表 / 拆词跟读, fixed to the bottom on screens ≤46rem, active tab highlighted, main content gets 6.5rem bottom padding so nothing is hidden behind it. Desktop keeps the top header.
4. **Shadowing browser-TTS fallback** — each model-answer sentence now has a button clearly labelled "浏览器朗读（非 VoiceStudio）" (en-US). The VoiceStudio MP3 slots remain primary and still show "音频还没生成" honestly when the file is absent.

These 4 changes were made by direct code edits, not a large Codex run, to preserve Shi's Codex quota reserve for the 2026-11-25 make.fun news-image final version.

## Verification (done by Muse directly, 2026-11-24)

- `npm install` — 35 packages, OK. `npm run build` — **passes** (Vite 6.4.6, 38 modules, dist ~127 KB JS / 6.3 KB CSS).
- Routes: `src/main.js` registers exactly 3 routes: `/`, `/phonemes`, `/practice`.
- Phoneme count: programmatic count = **48** (单元音 12 + 双元音 8 + 辅音 24 + 辅音组合 4).
- Minimal-pair quiz: `answer()` in Phonemes.vue compares chosen word to the played target, gives immediate feedback, and on a wrong answer unshifts `{expected, chosen}` into `errors`, which is persisted under localStorage key `eps-error-book`.
- Word lookup (run in Node against the real data module): `music` → syllables `mu·sic`, IPA `/ˈmjuːzɪk/`, phonemes `[m, j, uː, z, ɪ, k]`; `zzqqx` → `null`, and the UI renders "词库里还没有" for null. Dictionary size: 257 entries.
- Countdown: Practice.vue only renders the answer/shadowing step with `v-if="phase === 'answer'"`; phase becomes `answer` only when the 5 s timer reaches 0, so model text is hidden until then.
- Recording: `SentenceRecorder.vue` uses `navigator.mediaDevices.getUserMedia` + `MediaRecorder`, emits an object URL for in-page playback; recordings stay in memory only.
- Chunk saving: `saveChunks()` in `src/storage.js` dedupes by chunk text via a `Set`; favorites persist under `eps-fav-chunks`.
- New features in the production bundle: grepping `dist/assets/*.js` finds `en-US`, `bottom-tabs`, "浏览器朗读（非 VoiceStudio）", "词库里还没有", "音频还没生成", `MediaRecorder`, and all three tab labels.
- Live deployment: verified by polling the Pages URL until HTTP 200 for the HTML and for the JS asset (see live check in the delivery report; URL above).

## Known limits

- **VoiceStudio audio slots are empty** (`public/audio/phonemes/` and `public/audio/topics/` contain only placeholders). Shi does **not** need to record anything himself: v1 works with the clearly-labelled browser TTS (en-US). VoiceStudio files are an optional later upgrade — if Shi generates them, he can send them to Muse, who will drop them into `public/audio/` using the naming rules in `public/audio/README.md` and redeploy.
- Dictionary IPA uses broad British-style transcriptions from the source data (the site data, not the speech accent); speech output is en-US.
- Mouth diagrams are shared schematic SVGs per mouth-shape class (9 classes), not one precise diagram per phoneme.
- Recordings are not saved: refreshing the page discards them.
- No check-in/streak, progress stats, or spaced review yet (see v2 candidates).

## v2 expansion candidates (NOT built — Shi said functions feel too few)

- Daily check-in / streak calendar
- Learning progress stats (sentences shadowed, quiz accuracy, chunks mastered)
- Chunk spaced review at 1 / 3 / 7 days
- More topics beyond Week 1 (Part 1 expansion, then Part 2 cue cards)
- Per-phoneme precise mouth diagrams and recorded phoneme audio
- Saved recording history

## How to run locally

```sh
npm install
npm run dev     # local dev
npm run build   # production build to dist/
```

Deployment: pushing to `main` triggers `.github/workflows/deploy-pages.yml`, which builds and publishes to GitHub Pages.
