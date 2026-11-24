# Codex task — English practice site v2 (real audio, long articles, real dictionary)

Work in this repo (Vue 3 + Vite, hash routing, no new dependencies). Read the
existing files first. Audio files ALREADY EXIST under public/audio/ (real mp3s
generated with a local neural TTS) and a real dictionary ALREADY EXISTS at
public/data/dict.json ({word: ["/ipa/", "syl·syl", "phoneme phoneme ..."]},
27,657 entries, CMU-derived). Your job is the frontend rewrite below.
ABSOLUTE RULE: no `speechSynthesis` / `SpeechSynthesisUtterance` may remain
anywhere in src/ — all playback is real mp3 files via one shared Audio element.

1. **src/audio.js — rewrite.** Export:
   - `audioUrl(folder, file)` → `${BASE_URL}audio/${folder}/${encodeURIComponent(file)}.mp3` (keep).
   - `playUrl(url)` → Promise that plays via ONE module-level shared Audio
     element (create once, reuse; set `preload='none'` on creation is n/a for
     programmatic Audio — just don't preload), resolves when playback ends,
     rejects on error; calling it stops any current playback first.
   - `stopAudio()` — pause + reset the shared element and cancel any sequence.
   - `playPhoneme(symbol)` → playUrl(audioUrl('phonemes', symbol)).
   - `playWord(word)` → playUrl(audioUrl('words', word)).
   - `playSequence(urls, onIndex)` → plays urls one after another, calling
     onIndex(i) when sentence i starts; returns a Promise resolving when the
     whole sequence finishes or is stopped; stopAudio() must interrupt it
     (use a generation counter).
   No other exports needed by old code may break other files you don't touch —
   you ARE touching all consumers, so update them consistently.

2. **src/components/ModelAudio.vue — rewrite.** Props: `path` (e.g.
   'topics/topic-1-2.mp3') and `label`. Render a native
   `<audio controls preload="none" :src="BASE_URL + 'audio/' + path">` always;
   on @error show the text '音频文件缺失'. No loading/missing probing states.

3. **src/pages/Phonemes.vue — update.** Quiz `listen()` becomes async and uses
   `playWord(word)` (files exist for think/sink/vest/west/ship/sheep/bad/bed);
   on play error set feedback '音频播放失败，请重试。'. `select()` uses
   playPhoneme and sets status '正在播放例词音频' on success / '音频播放失败'
   on error. Remove the sayWord import and the sentence about browser reading
   fallback ('缺少音素音频时，浏览器会朗读整个例词。' → replace with
   '点击音素播放例词的真人级录音（本地神经语音合成）。' — actually write:
   '所有发音均为音频文件，点击即可播放。'). Use stopAudio on unmount.

4. **src/data/dictionary.js — replace entirely.** New async API:
   - module-level cached promise `loadDict()` fetching
     `${import.meta.env.BASE_URL}data/dict.json`.
   - `lookupBundled(word)` (async) → from dict.json: entry [ipa, syllStr, phonStr]
     → { word, ipa, syllables: syllStr.split('·'), phonemes: phonStr.split(' '), source: 'bundled' } or null.
   - `lookupOnline(word)` (async) → check localStorage cache 'eps-dict-cache'
     (JSON object) first; else fetch
     `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
     from the first entry take phonetic text (entry.phonetic or first
     phonetics[].text) and a US audio URL (phonetics[] with audio ending
     '-us.mp3' preferred, else any audio). If found, cache {ipa, audio} and
     return { word, ipa, audio, syllables: [], phonemes: [], source: 'online' };
     on any failure return null.
   - `lookupWordAsync(word)` → bundled first, then online, else null.
   Normalise input: trim, lowercase.

5. **src/pages/Practice.vue — update the dictionary + shadowing audio parts.**
   - `lookup()` becomes async: sets a `searching` loading flag, awaits
     lookupWordAsync(input), stores result. Template: while searching show
     '查询中…'. Result block shows: word, 音节 (only if syllables.length),
     音标， a source label: bundled → '来源：内置词典（CMU 发音词典）',
     online → '来源：在线词典（Free Dictionary API）'. Phoneme buttons (only
     when phonemes.length) call playPhoneme(symbol) and on error show
     '该音素音频播放失败'. If result.audio, render
     `<audio controls preload="none" :src="result.audio">` labelled '在线词典发音'.
     Not found → '词库里还没有' (keep exact text).
   - Shadowing: remove `speakSentence`, the '浏览器朗读（非 VoiceStudio）' button
     and all sayText usage. ModelAudio usage changes to the new prop:
     `<ModelAudio :path="'topics/topic-' + sentenceKey + '.mp3'" label="本句范读" />`
     and the full-answer one `:path="'topics/topic-' + topic.id + '.mp3'"`.
     Keep the 5-second countdown flow, recorder, prev/next exactly as they are.
   - Remove now-unused imports.

6. **NEW src/pages/Articles.vue — 长文跟读.** Data from src/data/articles.js
   (articles: {id, title, intro_cn, chunks[{text, examples}], sentences[{en, cn}]}).
   - No article selected (route /articles): list the 3 articles as panels:
     title, intro_cn, sentence count + word count, button '开始跟读' →
     router push /articles?id=<id> (use query, read via useRoute).
   - Article view: back button '← 全部文章'. Header: title + intro_cn.
     Progress: '已练 x / y 句' + a progress bar; practised set persisted in
     localStorage key 'eps-article-progress' as { [articleId]: [sentenceIdx...] }
     (add a storedObject helper in src/storage.js or handle locally in this page
     with a ref + watch — keep the pattern of storage.js).
     - '▶ 全文播放' button: builds urls
       `audio/articles/article-<id>-s<n>.mp3` for all sentences and calls
       playSequence with onIndex highlighting the current sentence row
       (class 'playing') and scrolling it into view (scrollIntoView
       {block:'nearest'} is fine). While playing, the button becomes '■ 停止'
       and calls stopAudio(). Also a '整篇音频' native control:
       `<audio controls preload="none" src=.../article-<id>-full.mp3>`.
     - Sentence rows: index number, English text (tap/click the row's play
       button '🔊' to play that sentence's mp3 via playUrl), Chinese translation
       in smaller muted text, a '练过 ✓' toggle button marking it practised,
       and the existing SentenceRecorder component for record/playback
       (recordings kept in memory, keyed `<articleId>-<idx>`).
     - Chunks section at the bottom: chunk list + '一键收藏本文词块' button
       using saveChunks from storage.js (same dedupe), showing saved state like
       Practice.vue does.
   - On unmount: stopAudio().

7. **src/main.js** — add route { path: '/articles', component: Articles }.

8. **src/App.vue** — desktop nav and bottom tab bar both get 4 entries:
   今日一练 (/), 音标表 (/phonemes), 长文跟读 (/articles), 拆词 (/practice).
   Bottom tab labels exactly: 今日一练 / 音标表 / 长文跟读 / 拆词.

9. **src/style.css** — bottom-tabs becomes a 4-column grid; add styles for:
   article sentence rows (.sentence-row, .sentence-row.playing highlight with
   the site's green), progress bar (.progress-track/.progress-fill), source
   label. Reuse existing palette/classes wherever possible; keep it simple.

10. **src/pages/Home.vue** — if it mentions the browser-TTS or links that
    changed, update text minimally; add one card linking to /articles
    ('长文跟读 · 3 篇长文，逐句跟读') if there is a natural place; don't redesign.

After editing: grep src/ for 'speechSynthesis', 'sayText', 'sayWord',
'SpeechSynthesisUtterance' — zero hits allowed. Then run `npm run build` and
fix any errors until it passes. Report: files changed, grep result, build result.
