// Word breakdown dictionary (v2).
// Bundled source: public/data/dict.json — 27,657 entries derived from the CMU
// Pronouncing Dictionary (public domain), ARPAbet converted to IPA by
// tools/build_dict.py. Loaded lazily, only when a lookup happens.
// Fallback source: Free Dictionary API (no key), results cached in
// localStorage under 'eps-dict-cache'. A word is only "not found" when BOTH
// sources miss.
let dictPromise = null

function loadDict() {
  if (!dictPromise) {
    dictPromise = fetch(`${import.meta.env.BASE_URL}data/dict.json`)
      .then(res => (res.ok ? res.json() : {}))
      .catch(() => ({}))
  }
  return dictPromise
}

export async function lookupBundled(rawWord) {
  const word = rawWord?.trim().toLowerCase()
  if (!word) return null
  const dict = await loadDict()
  const entry = dict[word]
  if (!entry) return null
  const [ipa, syllStr, phonStr] = entry
  return {
    word,
    ipa,
    syllables: syllStr ? syllStr.split('·') : [],
    phonemes: phonStr ? phonStr.split(' ') : [],
    audio: null,
    source: 'bundled',
  }
}

const CACHE_KEY = 'eps-dict-cache'

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) ?? {} } catch { return {} }
}

export async function lookupOnline(rawWord) {
  const word = rawWord?.trim().toLowerCase()
  if (!word) return null
  const cache = readCache()
  if (cache[word]) return { word, syllables: [], phonemes: [], source: 'online', ...cache[word] }
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
    if (!res.ok) return null
    const data = await res.json()
    const entry = Array.isArray(data) ? data[0] : null
    if (!entry) return null
    const phonetics = entry.phonetics ?? []
    const ipa = entry.phonetic || phonetics.find(p => p.text)?.text || ''
    const audio = phonetics.find(p => p.audio?.endsWith('-us.mp3'))?.audio
      || phonetics.find(p => p.audio)?.audio || null
    if (!ipa && !audio) return null
    const result = { ipa, audio }
    try {
      cache[word] = result
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    } catch { /* storage full/unavailable — lookup still works */ }
    return { word, syllables: [], phonemes: [], source: 'online', ...result }
  } catch {
    return null
  }
}

export async function lookupWordAsync(rawWord) {
  return (await lookupBundled(rawWord)) ?? (await lookupOnline(rawWord))
}
