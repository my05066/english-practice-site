# 每日雅思口语练习站

A mobile-friendly IELTS Speaking practice site built with Vue 3 and Vite. It uses the seven Week 1 Part 1 topics from `seed/content-week1.csv` and five Episode 1 chunks from `seed/daily-speaking-chunks-day1.md`. It runs in the browser without an account.

## Run locally

```sh
npm install
npm run dev
npm run build
```

The production build goes to `dist/`. Publish its contents from a GitHub Pages branch or upload `dist/` as the Pages artifact in a GitHub Actions workflow. The Vite base is `./`, and Vue Router uses hash history, so topic deep links work on project sites, for example `/#/practice?topic=1` relative to the site root.

## Structure

- `src/pages/` contains the three views. The home page rotates through the CSV topics using the local calendar day of year (January 1 is day 1) modulo seven. The sound chart includes a minimal-pair quiz and error book. The practice view contains the dictionary, countdown, shadowing, recording, and favorites.
- `src/data/` holds the CSV snapshot, Episode 1 chunks, IPA chart, and dictionary. The chart displays the 44 individually listed sounds and four labeled consonant clusters (/ts/, /dz/, /tr/, /dr/).
- `src/components/` contains the mouth diagram, model audio player, and sentence recorder.
- `src/storage.js` stores favorite chunks and quiz mistakes in localStorage under `eps-fav-chunks` and `eps-error-book`. Microphone recordings stay in memory while the practice page is open.

## Audio

See [the audio README](public/audio/README.md) for filenames. Phoneme buttons try a local MP3 first. If it cannot play, they use the browser to speak an example word, preferring an American English (en-US) voice when installed. The quiz also uses browser speech (en-US). On the practice page, each model-answer sentence also has a clearly labelled browser read-aloud fallback button ("浏览器朗读（非 VoiceStudio）", en-US) for use until the VoiceStudio MP3 is added. VoiceStudio model audio comes exclusively from the corresponding MP3 slots, which show **音频还没生成** when audio is unavailable. Microphone recording requires permission and a supported browser running on localhost or HTTPS.

## Dictionary honesty rule

The bundled dictionary covers the seven Week 1 English answers and a hand-compiled list of 200 common words. Entries use broad British IPA, with approximate English pronunciations for place names. `lookupWord(word)` trims whitespace and ignores case. Unknown words return `null`, and the UI displays exactly **词库里还没有**.
