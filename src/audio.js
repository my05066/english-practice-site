// Real-file audio playback (v2). ALL sound on this site is an mp3 file shipped
// with the site, played through ONE shared Audio element — the pattern mobile
// browsers (including in-app webviews) handle best: playback only ever starts
// from a user tap, and no browser text-to-speech is used anywhere in the site.
let clip = null
let seqToken = 0

function sharedClip() {
  if (!clip) clip = new Audio()
  return clip
}

export function audioUrl(folder, file) {
  return `${import.meta.env.BASE_URL}audio/${folder}/${encodeURIComponent(file)}.mp3`
}

export function stopAudio() {
  seqToken++
  if (clip) {
    clip.pause()
    clip.removeAttribute('src')
    clip.load()
  }
}

function playOne(url) {
  const el = sharedClip()
  el.src = url
  return new Promise((resolve, reject) => {
    const cleanup = () => { el.onended = null; el.onerror = null }
    el.onended = () => { cleanup(); resolve() }
    el.onerror = () => { cleanup(); reject(new Error(`audio failed: ${url}`)) }
    el.play().catch(err => { cleanup(); reject(err) })
  })
}

// Play a single mp3, cancelling any running sequence first.
export function playUrl(url) {
  seqToken++
  if (clip) clip.pause()
  return playOne(url)
}

export function playPhoneme(symbol) {
  return playUrl(audioUrl('phonemes', symbol))
}

export function playWord(word) {
  return playUrl(audioUrl('words', word))
}

// Play urls back to back; onIndex(i) fires when item i starts. Resolves true
// when the whole sequence finished, false when stopped or a file failed.
export async function playSequence(urls, onIndex) {
  const token = ++seqToken
  if (clip) clip.pause()
  for (let i = 0; i < urls.length; i++) {
    if (token !== seqToken) return false
    onIndex?.(i)
    try {
      await playOne(urls[i])
    } catch {
      return false
    }
  }
  return token === seqToken
}
