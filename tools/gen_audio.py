#!/usr/bin/env python3
"""Generate ALL site audio with Piper (local neural TTS, en_US-lessac-medium).

Why Piper: edge-tts was tried first on this VM and fails — the egress proxy
breaks its websocket handshake (WSServerHandshakeError 'Invalid connection
header', and direct connections are DNS-hijacked to a fake IP). Piper runs
fully locally, so every mp3 below is a real generated file.

Jobs are derived from the site's own data files (phonemes.js, topics.json,
articles.js) so audio can never drift from the displayed text.
Output layout:
  public/audio/phonemes/<symbol>.mp3   example word per phoneme
  public/audio/words/<word>.mp3       minimal-pair quiz words
  public/audio/topics/topic-<id>-<n>.mp3 / topic-<id>.mp3
  public/audio/articles/article-<id>-s<n>.mp3 / article-<id>-full.mp3
Existing files >1KB are skipped (idempotent).
"""
import json, re, subprocess, sys, wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MODEL = Path.home() / "workspace/tools/piper-voices/en_US-lessac-medium.onnx"
sys.path.insert(0, str(Path.home() / "workspace/tools/tts-venv/lib/python3.12/site-packages"))
from piper.voice import PiperVoice  # noqa: E402

def build_jobs():
    jobs = []  # (text, out_path)
    phon = (ROOT / "src/data/phonemes.js").read_text()
    for symbol, example in re.findall(r"\['([^']+)', '([^']+)', '(?:front|round|neutral|open|closed|ridge|back|lip|teeth)'\]", phon):
        jobs.append((example, ROOT / f"public/audio/phonemes/{symbol}.mp3"))
    for word in ["think", "sink", "vest", "west", "ship", "sheep", "bad", "bed"]:
        jobs.append((word, ROOT / f"public/audio/words/{word}.mp3"))
    topics = json.loads((ROOT / "src/data/topics.json").read_text())
    for t in topics:
        for i, s in enumerate(t["shadow_sentences"], 1):
            jobs.append((s, ROOT / f"public/audio/topics/topic-{t['id']}-{i}.mp3"))
        jobs.append((" ".join(t["shadow_sentences"]), ROOT / f"public/audio/topics/topic-{t['id']}.mp3"))
    art_src = (ROOT / "src/data/articles.js").read_text()
    # parse articles with node-free regex per sentence block
    blocks = re.split(r"\n    sentences: \[", art_src)[1:]
    for idx, block in enumerate(blocks, 1):
        ens = re.findall(r"\{ en: '((?:[^'\\]|\\.)*)'", block.split("],")[0])
        ens = [e.replace("\\'", "'") for e in ens]
        for i, s in enumerate(ens, 1):
            jobs.append((s, ROOT / f"public/audio/articles/article-{idx}-s{i}.mp3"))
        jobs.append((" ".join(ens), ROOT / f"public/audio/articles/article-{idx}-full.mp3"))
    return jobs

def main():
    jobs = build_jobs()
    todo = [(t, p) for t, p in jobs if not (p.exists() and p.stat().st_size > 1024)]
    print(f"jobs total={len(jobs)} to_generate={len(todo)}")
    voice = PiperVoice.load(str(MODEL))
    tmp_wav = Path("/tmp/_tts_one.wav")
    fails = []
    for text, out in todo:
        out.parent.mkdir(parents=True, exist_ok=True)
        try:
            with wave.open(str(tmp_wav), "wb") as wav:
                voice.synthesize_wav(text, wav)
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(tmp_wav),
                            "-codec:a", "libmp3lame", "-q:a", "4", str(out)], check=True)
            assert out.stat().st_size > 1024
        except Exception as e:
            fails.append((out.name, str(e)))
    done = [p for _, p in jobs if p.exists() and p.stat().st_size > 1024]
    total = sum(p.stat().st_size for _, p in jobs if p.exists())
    print(f"present={len(done)}/{len(jobs)} total_audio={total/1e6:.2f} MB fails={fails}")
    sys.exit(1 if fails or len(done) != len(jobs) else 0)

if __name__ == "__main__":
    main()
