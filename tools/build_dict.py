#!/usr/bin/env python3
"""Build the bundled word-breakdown dictionary from the CMU Pronouncing
Dictionary (public domain, Carnegie Mellon University).

Method (documented, no LLM invention):
- Pronunciations come from CMUdict (ARPAbet). First listed pronunciation wins.
- ARPAbet -> IPA with the fixed mapping below. AH with stress 1 -> ʌ, else ə;
  ER with stress 1/2 -> ɜː, else ər; OW -> oʊ (American).
- Stress digits mark syllable nuclei: a syllable is built around each vowel
  phoneme; consonants between two vowels start the next syllable (onset),
  trailing consonants close the last syllable. Primary stress (1) -> ˈ before
  its syllable, secondary (2) -> ˌ.
- Word selection: top 30,000 of the OpenSubtitles en_50k frequency list,
  union the Google 10,000 list, union every word used in the site's own
  content (topics/articles/phonemes data), intersected with CMUdict.
Output: public/data/dict.json  { word: ["/ipa/", "syl·syl", "p p p"] }
"""
import json, re, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "tools" / "data"

VOWELS = {
    "AA": "ɑ", "AE": "æ", "AO": "ɔ", "AW": "aʊ", "AY": "aɪ", "EH": "e",
    "EY": "eɪ", "IH": "ɪ", "IY": "iː", "OW": "oʊ", "OY": "ɔɪ", "UH": "ʊ",
    "UW": "uː",
}
CONS = {
    "B": "b", "CH": "tʃ", "D": "d", "DH": "ð", "F": "f", "G": "ɡ", "HH": "h",
    "JH": "dʒ", "K": "k", "L": "l", "M": "m", "N": "n", "NG": "ŋ", "P": "p",
    "R": "r", "S": "s", "SH": "ʃ", "T": "t", "TH": "θ", "V": "v", "W": "w",
    "Y": "j", "Z": "z", "ZH": "ʒ",
}

def convert(arpabet):
    """arpabet: list like ['D','IH0','V','EH1','L',...] -> (ipa, syllables, phonemes)"""
    phones = []  # (ipa, stress or None)
    for tok in arpabet:
        if not re.fullmatch(r"[A-Z]+[0-9]?", tok):
            continue  # skip comment markers / stray tokens in the source file
        stress = None
        if tok[-1].isdigit():
            stress = int(tok[-1]); tok = tok[:-1]
        if tok == "AH":
            ipa = "ʌ" if stress == 1 else "ə"
        elif tok == "ER":
            ipa = "ɜː" if stress in (1, 2) else "ər"
        elif tok in VOWELS:
            ipa = VOWELS[tok]
        else:
            ipa = CONS[tok]
        phones.append((ipa, stress, tok in VOWELS or tok in ("AH", "ER")))
    # group into syllables around vowel nuclei
    sylls = []  # list of [stress, [ipa,...]]
    cur = []
    cur_stress = None
    seen_vowel = False
    for ipa, stress, is_vowel in phones:
        if is_vowel and seen_vowel:
            sylls.append((cur_stress, cur)); cur = []; cur_stress = None; seen_vowel = False
        if is_vowel:
            seen_vowel = True; cur_stress = stress
        cur.append(ipa)
    if cur: sylls.append((cur_stress, cur))
    if not sylls: return None
    parts, flat = [], []
    for stress, syl in sylls:
        mark = "ˈ" if stress == 1 else ("ˌ" if stress == 2 else "")
        parts.append(mark + "".join(syl))
        flat.extend(syl)
    return "/" + "".join(parts) + "/", "·".join(parts), " ".join(flat)

def load_cmu():
    text = (DATA / "cmudict.dict").read_text(encoding="latin-1")
    cmu = {}
    for line in text.splitlines():
        if not line or line.startswith(";;;"): continue
        m = re.match(r"^(\S+)\s+(.+)$", line)
        if not m: continue
        word = m.group(1).lower()
        if "(" in word: continue  # alternate pronunciations
        if not re.fullmatch(r"[a-z][a-z'\-]*", word): continue
        cmu.setdefault(word, m.group(2).split())
    return cmu

def main():
    cmu = load_cmu()
    print(f"CMU entries: {len(cmu)}")
    wanted = set()
    freq = [l.split()[0].lower() for l in (DATA / "en_50k.txt").read_text().splitlines() if l.strip()]
    wanted.update(freq[:30000])
    wanted.update(w.strip().lower() for w in (DATA / "google10000.txt").read_text().splitlines() if w.strip())
    # every word used in the site's own content
    content = ""
    for p in [ROOT / "src/data/topics.json", ROOT / "src/data/articles.js",
              ROOT / "src/data/phonemes.js", ROOT / "src/data/topics.js"]:
        content += p.read_text()
    wanted.update(w.lower().strip(".,!?;:\"'") for w in re.findall(r"[A-Za-z][A-Za-z'\-]+", content))
    out = {}
    for w in sorted(wanted):
        if w in cmu:
            conv = convert(cmu[w])
            if conv: out[w] = list(conv)
    # site-specific names not in CMU: keep the v1 hand entries (documented)
    out["taiyuan"] = ["/ˌtaɪˈjwɑːn/", "ˌtaɪ·ˈjwɑːn", "t aɪ j w ɑː n"]
    out["shanxi"] = ["/ˌʃænˈʃiː/", "ˌʃæn·ˈʃiː", "ʃ æ n ʃ iː"]
    dest = ROOT / "public" / "data" / "dict.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
    print(f"bundled entries: {len(out)}  size: {dest.stat().st_size/1e6:.2f} MB -> {dest}")
    for probe in ["development", "environment", "particularly", "schedule", "comfortable", "music"]:
        print(probe, "->", out.get(probe))
    print("zzqqx ->", out.get("zzqqx"))

if __name__ == "__main__":
    main()
