<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModelAudio from '../components/ModelAudio.vue'
import SentenceRecorder from '../components/SentenceRecorder.vue'
import { lookupWord } from '../data/dictionary'
import { chunksFor, dailyTopic, topics } from '../data/topics'
import { playPhoneme, sayText, stopPronunciation } from '../audio'
import { favorites, saveChunks } from '../storage'

const route = useRoute()
const router = useRouter()
const topic = computed(() => topics.find(item => String(item.id) === route.query.topic) ?? dailyTopic())
const chunks = computed(() => chunksFor(topic.value))
const allSaved = computed(() => chunks.value.every(chunk => favorites.value.some(saved => saved.text === chunk.text)))

const input = ref('')
const searched = ref(false)
const result = ref(null)
const audioStatus = ref('')
function lookup() {
  stopPronunciation()
  audioStatus.value = ''
  searched.value = true
  result.value = lookupWord(input.value)
}

async function pronounce(symbol) {
  audioStatus.value = ''
  const status = await playPhoneme(symbol, result.value.word)
  if (status) audioStatus.value = status
}

const remaining = ref(5)
const phase = ref('prompt')
const sentenceIndex = ref(0)
const sentence = computed(() => topic.value.shadow_sentences[sentenceIndex.value])
const sentenceKey = computed(() => `${topic.value.id}-${sentenceIndex.value + 1}`)
const ttsStatus = ref('')
function speakSentence() {
  ttsStatus.value = sayText(sentence.value) ? '' : '浏览器无法朗读这句话。'
}
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
  stopPronunciation()
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
          <ModelAudio :key="sentenceKey" :file="'topic-' + sentenceKey" label="VoiceStudio · 本句范读" />
          <div class="actions">
            <button type="button" @click="speakSentence">🔊 浏览器朗读（非 VoiceStudio）</button>
          </div>
          <p v-if="ttsStatus" class="muted" role="status">{{ ttsStatus }}</p>
          <SentenceRecorder :key="sentenceKey" :url="recordings[sentenceKey]" @recorded="keepRecording" @busy="recordingBusy = $event" />
          <div class="actions">
            <button type="button" :disabled="recordingBusy || sentenceIndex === 0" @click="sentenceIndex--">上一句</button>
            <button type="button" class="primary" :disabled="recordingBusy || sentenceIndex === topic.shadow_sentences.length - 1" @click="sentenceIndex++">下一句</button>
          </div>
          <details>
            <summary>完整范文音频</summary>
            <ModelAudio :key="topic.id" :file="'topic-' + topic.id" label="VoiceStudio · 完整范读" />
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
        <div v-if="result" class="lookup-result">
          <h3 lang="en">{{ result.word }}</h3>
          <p>音节 · <span lang="en">{{ result.syllables.join(' · ') }}</span></p>
          <p>音标 · <span>{{ result.ipa }}</span></p>
          <div class="actions">
            <button v-for="(symbol, index) in result.phonemes" :key="index" type="button" @click="pronounce(symbol)">/{{ symbol }}/</button>
          </div>
          <p class="muted">缺少音素音频时，浏览器朗读例词。弱元音 /i/、/u/ 缺少音频时朗读查询的单词。</p>
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
