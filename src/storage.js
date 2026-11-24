import { ref, watch } from 'vue'

function storedList(key) {
  let saved = []
  try {
    const parsed = JSON.parse(localStorage.getItem(key))
    if (Array.isArray(parsed)) saved = parsed
  } catch {
    // The app still works in memory when browser storage is unavailable.
  }
  const list = ref(saved)
  watch(list, value => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Keep the current session usable when storage is unavailable.
    }
  }, { deep: true, flush: 'sync' })
  return list
}

export const favorites = storedList('eps-fav-chunks')
export const errors = storedList('eps-error-book')

function storedObject(key) {
  let saved = {}
  try {
    const parsed = JSON.parse(localStorage.getItem(key))
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) saved = parsed
  } catch {
    // Keep the app usable in memory when storage is unavailable.
  }
  const obj = ref(saved)
  watch(obj, value => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Keep the current session usable when storage is unavailable.
    }
  }, { deep: true, flush: 'sync' })
  return obj
}

// { [articleId]: [practised sentence indexes] }
export const articleProgress = storedObject('eps-article-progress')

export function saveChunks(chunks) {
  const existing = new Set(favorites.value.map(chunk => chunk.text))
  favorites.value = [...favorites.value, ...chunks.filter(chunk => !existing.has(chunk.text))]
}
