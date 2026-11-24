# Audio files

All audio on this site is REAL mp3 files in this folder (v2, 2026-11-24).
Generated locally on the build machine with Piper, a local neural TTS
(voice: en_US-lessac-medium, American English female), from the site's own
data files by `tools/gen_audio.py`. No browser text-to-speech is used
anywhere, and there are no silent placeholder files.

- `phonemes/<symbol>.mp3` — the example word for that phoneme, e.g. `phonemes/θ.mp3` ("think").
- `words/<word>.mp3` — minimal-pair quiz words (think/sink, vest/west, ship/sheep, bad/bed).
- `topics/topic-<id>.mp3` — complete Week 1 model answer; `topics/topic-<id>-<sentence>.mp3` — one sentence of it.
- `articles/article-<id>-s<n>.mp3` — sentence n of long article id; `articles/article-<id>-full.mp3` — the whole article.

To regenerate (e.g. after editing texts): run `tools/gen_audio.py` with the
Piper venv (see BUILD_REPORT.md v2 section). VoiceStudio recordings can still
replace any file later — just overwrite the mp3 with the same name.
