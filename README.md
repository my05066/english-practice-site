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

- `src/pages/` contains the four views. The home page rotates through the CSV topics using the local calendar day of year (January 1 is day 1) modulo seven. The sound chart includes a minimal-pair quiz and error book. The practice view contains the dictionary, countdown, shadowing, recording, and favorites. The articles view (`/articles`) offers three original long articles (229–240 words each) with continuous full playback, sentence-by-sentence shadowing with recording, and per-sentence progress stored in localStorage.
- `src/data/` holds the CSV snapshot, Episode 1 chunks, IPA chart, and dictionary. The chart displays the 44 individually listed sounds and four labeled consonant clusters (/ts/, /dz/, /tr/, /dr/).
- `src/components/` contains the mouth diagram, model audio player, and sentence recorder.
- `src/storage.js` stores favorite chunks and quiz mistakes in localStorage under `eps-fav-chunks` and `eps-error-book`. Microphone recordings stay in memory while the practice page is open.

## Audio

See [the audio README](public/audio/README.md) for filenames. Since v2, every sound on the site is a real MP3 file shipped with the site (generated locally with the Piper neural TTS, American voice `en_US-lessac-medium`): phoneme example words, minimal-pair quiz words, Week 1 model answers, and the long articles. Playback uses one shared `Audio` element plus native `<audio controls>` players, always started by a user tap — no browser text-to-speech is used anywhere. Microphone recording requires permission and a supported browser running on localhost or HTTPS.

## Dictionary honesty rule

The bundled dictionary (`public/data/dict.json`, loaded lazily on first lookup) holds 27,657 entries derived from the public-domain CMU Pronouncing Dictionary — see `tools/build_dict.py` for the ARPAbet→IPA mapping and word selection; nothing is invented by a language model. Words missing from the bundled dictionary fall back to the Free Dictionary API (labelled 在线词典 in the UI, results cached in localStorage). Only when both sources miss does the UI display **词库里还没有**.
