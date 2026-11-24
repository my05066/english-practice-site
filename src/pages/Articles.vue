<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SentenceRecorder from '../components/SentenceRecorder.vue'
import { articles } from '../data/articles'
import { audioUrl, playSequence, playUrl, stopAudio } from '../audio'
import { articleProgress, favorites, saveChunks } from '../storage'

const route = useRoute()
const router = useRouter()
const article = computed(() => articles.find(a => String(a.id) === route.query.id) ?? null)

function wordCount(a) {
  return a.sentences.reduce((n, s) => n + s.en.split(/\s+/).length, 0)
}

const practised = computed(() => new Set(articleProgress.value[article.value?.id] ?? []))
const doneCount = computed(() => (article.value ? practised.value.size : 0))
const allChunksSaved = computed(() =>
  article.value?.chunks.every(c => favorites.value.some(f => f.text === c.text)) ?? false)

function togglePractised(idx) {
  if (!article.value) return
  const set = new Set(practised.value)
  if (set.has(idx)) set.delete(idx)
  else set.add(idx)
  articleProgress.value = { ...articleProgress.value, [article.value.id]: [...set].sort((a, b) => a - b) }
}

const playingAll = ref(false)
const currentIdx = ref(-1)
const playError = ref('')
const sentenceRefs = ref([])

async function playAll() {
  if (!article.value) return
  if (playingAll.value) {
    stopAudio()
    playingAll.value = false
    currentIdx.value = -1
    return
  }
  playError.value = ''
  playingAll.value = true
  const urls = article.value.sentences.map((_, i) => audioUrl('articles', `article-${article.value.id}-s${i + 1}`))
  const ok = await playSequence(urls, i => {
    currentIdx.value = i
    sentenceRefs.value[i]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
  playingAll.value = false
  currentIdx.value = -1
  if (!ok) playError.value = '全文播放中断，可能是某个音频加载失败，请重试。'
}

async function playSentence(idx) {
  if (!article.value) return
  playError.value = ''
  playingAll.value = false
  currentIdx.value = idx
  try {
    await playUrl(audioUrl('articles', `article-${article.value.id}-s${idx + 1}`))
  } catch {
    playError.value = '这句音频播放失败，请重试。'
  }
  if (currentIdx.value === idx) currentIdx.value = -1
}

const recordings = ref({})
function keepRecording(key, url) {
  if (recordings.value[key]) URL.revokeObjectURL(recordings.value[key])
  recordings.value[key] = url
}

onBeforeUnmount(() => {
  stopAudio()
  Object.values(recordings.value).forEach(url => URL.revokeObjectURL(url))
})
</script>

<template>
  <template v-if="!article">
    <div class="page-heading">
      <h1>长文跟读</h1>
      <p>整篇听、逐句练。每篇 220 词以上，全部配有音频文件。</p>
    </div>
    <div class="practice-main">
      <section v-for="a in articles" :key="a.id" class="panel">
        <h2 lang="en">{{ a.title }}</h2>
        <p>{{ a.intro_cn }}</p>
        <p class="muted">{{ a.sentences.length }} 句 · 约 {{ wordCount(a) }} 词</p>
        <div class="actions">
          <button type="button" class="primary" @click="router.push({ path: '/articles', query: { id: a.id } })">开始跟读</button>
        </div>
      </section>
    </div>
  </template>

  <template v-else>
    <div class="page-heading">
      <button type="button" @click="router.push({ path: '/articles' })">← 全部文章</button>
      <h1 lang="en">{{ article.title }}</h1>
      <p>{{ article.intro_cn }} · {{ article.sentences.length }} 句 · 约 {{ wordCount(article) }} 词</p>
    </div>

    <section class="panel">
      <div class="section-heading">
        <h2>全文播放</h2>
        <button type="button" class="primary" @click="playAll">{{ playingAll ? '■ 停止' : '▶ 连续播放全文' }}</button>
      </div>
      <p v-if="playingAll" role="status">正在播放第 {{ currentIdx + 1 }} / {{ article.sentences.length }} 句</p>
      <p v-if="playError" role="status">{{ playError }}</p>
      <div class="audio-slot">
        <p><strong>整篇音频（可拖动进度）</strong></p>
        <audio controls preload="none" :src="audioUrl('articles', `article-${article.id}-full`)"></audio>
      </div>
      <p>练习进度 · 已练 {{ doneCount }} / {{ article.sentences.length }} 句</p>
      <div class="progress-track"><div class="progress-fill" :style="{ width: `${(doneCount / article.sentences.length) * 100}%` }"></div></div>
    </section>

    <section class="panel section-gap">
      <h2>逐句跟读</h2>
      <p class="muted">点 🔊 听原声，再录下自己读的，回放对比。读完一句点「练过 ✓」。</p>
      <div v-for="(s, idx) in article.sentences" :key="idx"
        :ref="el => { sentenceRefs[idx] = el }"
        class="sentence-row" :class="{ playing: currentIdx === idx, done: practised.has(idx) }">
        <div class="sentence-head">
          <strong>{{ idx + 1 }}.</strong>
          <span lang="en">{{ s.en }}</span>
          <button type="button" aria-label="播放这一句" @click="playSentence(idx)">🔊</button>
          <button type="button" :aria-pressed="practised.has(idx)" @click="togglePractised(idx)">{{ practised.has(idx) ? '已练 ✓' : '练过 ✓' }}</button>
        </div>
        <p class="muted sentence-cn">{{ s.cn }}</p>
        <SentenceRecorder :url="recordings[`${article.id}-${idx}`]"
          @recorded="url => keepRecording(`${article.id}-${idx}`, url)" />
      </div>
    </section>

    <section class="panel section-gap">
      <div class="section-heading">
        <h2>本文词块</h2>
        <button type="button" class="primary" :disabled="allChunksSaved" @click="saveChunks(article.chunks)">一键收藏本文词块</button>
      </div>
      <p v-if="allChunksSaved" class="muted" role="status">本文词块已全部收藏。</p>
      <ul class="plain-list chunks">
        <li v-for="chunk in article.chunks" :key="chunk.text">
          <strong lang="en">{{ chunk.text }}</strong>
          <p v-for="example in chunk.examples" :key="example" lang="en">{{ example }}</p>
        </li>
      </ul>
    </section>
  </template>
</template>
