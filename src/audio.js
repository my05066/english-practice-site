import { bySymbol } from './data/phonemes'

let activeClip
let request = 0

export function stopPronunciation() {
  request++
  activeClip?.pause()
  activeClip = undefined
  globalThis.speechSynthesis?.cancel()
}

export function sayWord(word) {
  return sayText(word)
}

export function sayText(text) {
  stopPronunciation()
  if (!globalThis.speechSynthesis || !globalThis.SpeechSynthesisUtterance) return false
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  const voice = speechSynthesis.getVoices().find(voice => voice.lang.toLowerCase().replace('_', '-') === 'en-us')
    || speechSynthesis.getVoices().find(voice => voice.lang.toLowerCase().replace('_', '-').startsWith('en-us'))
  if (voice) utterance.voice = voice
  speechSynthesis.speak(utterance)
  return true
}

export function audioUrl(folder, file) {
  return `${import.meta.env.BASE_URL}audio/${folder}/${encodeURIComponent(file)}.mp3`
}

export async function playPhoneme(symbol, fallbackWord) {
  const example = bySymbol[symbol]?.example ?? fallbackWord
  if (!example) return ''
  stopPronunciation()
  const current = request
  const clip = new Audio(audioUrl('phonemes', symbol))
  activeClip = clip
  try {
    await clip.play()
    return current === request ? `正在播放 /${symbol}/ 音频` : ''
  } catch {
    if (current !== request) return ''
    return sayWord(example)
      ? `浏览器例词朗读：${example}`
      : `浏览器无法朗读例词：${example}`
  }
}
