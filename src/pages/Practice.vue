<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModelAudio from '../components/ModelAudio.vue'
import SentenceRecorder from '../components/SentenceRecorder.vue'
import { lookupWordAsync } from '../data/dictionary'
import { chunksFor, dailyTopic, topics } from '../data/topics'
import { playPhoneme, stopAudio } from '../audio'
import { favorites, saveChunks } from '../storage'

const route = useRoute()
const router = useRouter()
const topic = computed(() => topics.find(item => String(item.id) === route.query.topic) ?? dailyTopic())
const chunks = computed(() => chunksFor(topic.value))
const allSaved = computed(() => chunks.value.every(chunk => favorites.value.some(saved => saved.text === chunk.text)))

const input = ref('')
const searched = ref(false)
const searching = ref(false)
const result = ref(null)
const audioStatus = ref('')
async function lookup() {
  stopAudio()
  audioStatus.value = ''
  searched.value = false
  searching.value = true
  result.value = null
  try {
    result.value = await lookupWordAsync(input.value)
  } finally {
    searching.value = false
    searched.value = true
  }
}

async function pronounce(symbol) {
  audioStatus.value = ''
  try {
    await playPhoneme(symbol === 'ər' ? 'ə' : symbol)
    audioStatus.value = `正在播放 /${symbol}/ 例词音频`
  } catch {
    audioStatus.value = '该音素音频播放失败，请重试。'
  }
}

const remaining = ref(5)
const phase = ref('prompt')
const sentenceIndex = ref(0)
const sentence = computed(() => topic.value.shadow_sentences[sentenceIndex.value])
const sentenceKey = computed(() => `${topic.value.id}-${sentenceIndex.value + 1}`)
const recordingBusy = ref(false)
const recordings = ref({})
let timer

function startCountdown() {
  clearInterval(timer)
  remaining.value = 5
  phase.value = 'countdown'
  const finish = performance.now() + 5000
  timer = setInterval(() => {
    remaining.value = Math.max(0, Math.ceil((finish - performance.now()) / 1000))
    if (remaining.value === 0) {
      clearInterval(timer)
      phase.value = 'answer'
    }
  }, 100)
}

function resetFlow() {
  clearInterval(timer)
  remaining.value = 5
  phase.value = 'prompt'
  sentenceIndex.value = 0
  recordingBusy.value = false
}

function keepRecording(url) {
  const key = sentenceKey.value
  if (recordings.value[key]) URL.revokeObjectURL(recordings.value[key])
  recordings.value[key] = url
}

function removeChunk(text) {
  favorites.value = favorites.value.filter(chunk => chunk.text !== text)
}

watch(() => topic.value.id, resetFlow)
onBeforeUnmount(() => {
  clearInterval(timer)
  stopAudio()
  Object.values(recordings.value).forEach(url => URL.revokeObjectURL(url))
})
</script>

<template>
  <div class="page-heading">
    <h1>拆词与跟读</h1>
    <p>先看中文关键词，试着回答，再逐句跟读并回听自己的录音。</p>
  </div>
  <div class="practice-layout">
    <div class="practice-main">
      <section class="panel shadowing">
        <div class="section-heading">
          <h2>逐句跟读</h2>
          <select aria-label="选择跟读题目" :value="topic.id" :disabled="recordingBusy"
            @change="router.replace({ path: '/practice', query: { topic: $event.target.value } })">
            <option v-for="item in topics" :key="item.id" :value="item.id">Day {{ item.id }} · {{ item.question_cn }}</option>
          </select>
        </div>

        <div class="practice-step">
          <p class="eyebrow">第 1 步 · 看提示</p>
          <h3>{{ topic.question_cn }}</h3>
          <ul class="tags"><li v-for="keyword in topic.keywords" :key="keyword">{{ keyword }}</li></ul>
        </div>

        <div class="practice-step">
          <p class="eyebrow">第 2 步 · 先开口</p>
          <div class="timer-row">
            <strong class="timer" role="timer" aria-label="倒计时秒数">{{ remaining }}</strong>
            <button v-if="phase === 'prompt'" type="button" class="primary" @click="startCountdown">开始 5 秒倒计时</button>
            <span v-else-if="phase === 'countdown'" role="status">现在试着回答。</span>
            <button v-else type="button" :disabled="recordingBusy" @click="resetFlow">再练一遍</button>
          </div>
        </div>

        <div v-if="phase === 'answer'" class="practice-step">
          <p class="eyebrow">第 3 步 · 跟读第 {{ sentenceIndex + 1 }} / {{ topic.shadow_sentences.length }} 句</p>
          <h3 lang="en" :key="sentenceKey">{{ sentence }}</h3>
          <ModelAudio :key="sentenceKey" :path="'topics/topic-' + sentenceKey + '.mp3'" label="本句范读" />
          <SentenceRecorder :key="sentenceKey" :url="recordings[sentenceKey]" @recorded="keepRecording" @busy="recordingBusy = $event" />
          <div class="actions">
            <button type="button" :disabled="recordingBusy || sentenceIndex === 0" @click="sentenceIndex--">上一句</button>
            <button type="button" class="primary" :disabled="recordingBusy || sentenceIndex === topic.shadow_sentences.length - 1" @click="sentenceIndex++">下一句</button>
          </div>
          <details>
            <summary>完整范文音频</summary>
            <ModelAudio :key="topic.id" :path="'topics/topic-' + topic.id + '.mp3'" label="完整范文" />
          </details>
        </div>
      </section>

      <section class="panel">
        <div class="section-heading">
          <h2 v-text="topic.id === 1 ? '本期词块 · 第 1 期' : '本期词块'"></h2>
          <button type="button" class="primary" :disabled="allSaved" @click="saveChunks(chunks)">一键收藏本期词块</button>
        </div>
        <p v-if="allSaved" class="muted" role="status">本期词块已全部收藏。</p>
        <ul class="plain-list chunks">
          <li v-for="chunk in chunks" :key="chunk.text">
            <strong lang="en">{{ chunk.text }}</strong>
            <p v-for="example in chunk.examples" :key="example" lang="en">{{ example }}</p>
          </li>
        </ul>
      </section>
    </div>

    <aside class="practice-main">
      <section class="panel">
        <h2>单词拆音</h2>
        <form @submit.prevent="lookup">
          <label for="word">输入英文单词</label>
          <div class="lookup">
            <input id="word" v-model="input" placeholder="music" spellcheck="false" autocomplete="off">
            <button type="submit" class="primary">查询</button>
          </div>
        </form>
        <p v-if="searching" role="status">查询中…</p>
        <div v-else-if="result" class="lookup-result">
          <h3 lang="en">{{ result.word }}</h3>
          <p v-if="result.syllables.length">音节 · <span lang="en">{{ result.syllables.join(' · ') }}</span></p>
          <p v-if="result.ipa">音标 · <span>{{ result.ipa }}</span></p>
          <div v-if="result.phonemes.length" class="actions">
            <button v-for="(symbol, index) in result.phonemes" :key="index" type="button" @click="pronounce(symbol)">/{{ symbol }}/</button>
          </div>
          <div v-if="result.audio" class="audio-slot">
            <p><strong>在线词典发音</strong></p>
            <audio controls preload="none" :src="result.audio"></audio>
          </div>
          <p class="muted">{{ result.source === 'bundled' ? '来源：内置词典（CMU 发音词典）' : '来源：在线词典（Free Dictionary API）' }}</p>
        </div>
        <p v-else-if="searched" role="status">词库里还没有</p>
        <p v-if="audioStatus" role="status">{{ audioStatus }}</p>
      </section>

      <section id="favorites" class="panel">
        <h2>收藏的词块 · {{ favorites.length }}</h2>
        <p v-if="!favorites.length" class="muted">还没有收藏词块。</p>
        <ul v-else class="plain-list chunks">
          <li v-for="chunk in favorites" :key="chunk.text">
            <div class="section-heading">
              <strong lang="en">{{ chunk.text }}</strong>
              <button type="button" :aria-label="'移除 ' + chunk.text" @click="removeChunk(chunk.text)">移除</button>
            </div>
            <p v-for="example in chunk.examples" :key="example" lang="en">{{ example }}</p>
          </li>
        </ul>
      </section>
    </aside>
  </div>
</template>
