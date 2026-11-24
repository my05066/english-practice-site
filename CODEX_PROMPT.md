# Codex Prompt — 每日雅思口语练习站 (actually used 2026-11-24)

Work in stages and narrate each stage in text (Stage 1, Stage 2, ... at least 5 stages) as you build. Build the complete app, then run `npm install` and `npm run build` yourself and fix any build errors before finishing.

## Spec

Build a Vue 3 + Vite static web app "每日雅思口语练习站", mobile-friendly, no login, all progress in localStorage, deployable to GitHub Pages (set vite base to './'), English README.md. Clean simple styles, no heavy animation. Use vue-router with hash history (so GitHub Pages works). Only 3 pages:

Seeded content is in `seed/` in this project: `seed/content-week1.csv` (7 topics), `seed/week1-first-batch.md`, `seed/daily-speaking-chunks-day1.md`, `seed/countdown-ep3-shooting-sheet.md`. Use ONLY that real content for topics/answers/chunks — invent no new topics or life facts.

### Page 1 — Home (今日一练), route `/`
- Daily rotating card: pick topic by day-of-year % 7 from the 7 Week-1 Part 1 topics in the CSV. Each topic: question_en, question_cn, answer_cn, answer_en, 3 chunks, keywords, shadow_sentences.
- Show all 7 topics as a list; clicking a topic goes to the shadowing page for that topic.
- Show saved chunks count / progress from localStorage.

### Page 2 — 48 phonemes, route `/phonemes`
- Interactive chart of exactly 48 phonemes (20 vowels + 28 consonants, standard British IPA chart: monophthongs iː ɪ ʊ uː e ə ɜː ɔː æ ʌ ɑː ɒ ; diphthongs ɪə eə ʊə eɪ aɪ ɔɪ əʊ aʊ ; consonants p b t d k ɡ tʃ dʒ f v θ ð s z ʃ ʒ h m n ŋ l r w j).
- Click a phoneme: show a simple mouth diagram (inline SVG, schematic is fine), example words, and play sound. Playback mechanism: if a file exists at `public/audio/phonemes/<symbol>.mp3` play it, otherwise use browser Web Speech API (speechSynthesis) to say the example word, and be transparent about that in UI/code. For model-answer VoiceStudio audio slots (see Page 3) do NOT use speech synthesis as a substitute.
- Highlight 3 Chinese-learner trap groups: /θ/ vs /s/, /v/ vs /w/, /ɪ/ vs /iː/.
- Minimal-pair quiz for those groups (include ship/sheep, bad/bed, think/sink, vest/west etc.): play a word (Web Speech API ok here), user picks which word they heard, judge right/wrong immediately, wrong answers are saved to an error book in localStorage (key e.g. `eps-error-book`), error book is viewable and clearable on this page.

### Page 3 — Word breakdown + shadowing, route `/practice` (accept `?topic=<id>`)
Dictionary:
- Built-in small dictionary ONLY: entries for words from the 7 Week-1 answers plus a common-200-word list you compile. Each entry: word, syllables (array), full IPA string, phonemes (array of symbols). Generate this data file programmatically/by hand in `src/data/dictionary.js` — it must be real data for at least 120 words.
- Lookup: normalise to lowercase; if not found, UI must show exactly the text "词库里还没有" and must NOT invent a transcription. Include an exported function `lookupWord(word)` in dictionary.js returning null for unknown words so it can be tested.
- If found: show syllable breakdown, IPA, and per-phoneme playback buttons (Web Speech / audio file mechanism as Page 2).

Shadowing area (per topic, topic selectable, default = today's topic):
- Flow steps in order: (1) Chinese prompt (question_cn + keywords), (2) 5-second countdown timer (visible numbers, start button) for the user to speak first, (3) model answer sentence-by-sentence: show shadow_sentences one by one, each with a VoiceStudio audio slot: try to load `public/audio/topics/topic-<id>.mp3` (and per-sentence if you structure it that way); if the audio file is missing the UI must explicitly show "音频还没生成" for that slot — do not silently fail and do not substitute another voice for model-answer audio. A separate clearly-labelled "browser read-aloud (not VoiceStudio)" button using speechSynthesis is allowed as an extra, but the VoiceStudio slot must still show 音频还没生成 when missing. Also user recording per sentence: use MediaRecorder API, record, stop, play back their recording (audio element with object URL).
- Chunks: show the topic's 3 chunks plus, for Episode 1, these 5 chunks with the given examples (from daily-speaking-chunks-day1.md): "I've got into … lately" (I've got into cooking lately.), "I was supposed to …, but I ended up …" (I was supposed to finish my code last night, but I ended up watching videos.), "It turns out …" (It turns out my code actually worked on the first try. / It turns out Taiyuan is much colder in the morning than I thought.), "I'm really into … these days" (I'm really into listening to English podcasts these days.), "Long story short, …" (Long story short, I stayed in my dorm and practised English all evening.)
- "一键收藏本期词块" button saves all current chunks to localStorage favorites (key e.g. `eps-fav-chunks`), no duplicates; saved chunks viewable/removable.

### Other requirements
- Create `public/audio/phonemes/.gitkeep`, `public/audio/topics/.gitkeep` and a `public/audio/README.md` explaining naming and that VoiceStudio files are not yet generated.
- localStorage keys prefixed `eps-`.
- Do NOT build: vocab-memorisation app, full course site, AI speaking chat, social, leaderboard.
- README.md in English: what it is, how to run (npm install, npm run dev, npm run build), structure, audio notes, dictionary honesty rule.
- Verify before finishing: build passes; count phonemes = 48 in data; lookup of a nonsense word like "zzqqx" returns null; countdown and MediaRecorder code present.
