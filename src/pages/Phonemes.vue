<script setup>
import { computed, onUnmounted, ref } from 'vue'
import MouthDiagram from '../components/MouthDiagram.vue'
import { groups, bySymbol, trapGroups } from '../data/phonemes'
import { playPhoneme, sayWord, stopPronunciation } from '../audio'
import { errors } from '../storage'

const selected = ref(bySymbol['iː'])
const audioStatus = ref('')
const traps = new Set(trapGroups.flatMap(group => group.symbols))

async function select(entry) {
  selected.value = entry
  audioStatus.value = ''
  const status = await playPhoneme(entry.symbol)
  if (selected.value.symbol === entry.symbol) audioStatus.value = status
}

const pairs = [...trapGroups, { label: '/æ/ 与 /e/', words: ['bad', 'bed'] }]
const pairIndex = ref(0)
const pair = computed(() => pairs[pairIndex.value])
const target = ref('')
const answered = ref('')
const feedback = ref('')

function resetQuiz() {
  target.value = ''
  answered.value = ''
  feedback.value = ''
  stopPronunciation()
}

function listen() {
  if (answered.value) {
    answered.value = ''
    target.value = ''
  }
  const word = target.value || pair.value.words[Math.floor(Math.random() * 2)]
  if (sayWord(word)) {
    target.value = word
    feedback.value = '请选择听到的单词。'
  } else {
    target.value = ''
    feedback.value = '此浏览器不支持例词朗读。'
  }
}

function answer(word) {
  if (!target.value || answered.value) return
  answered.value = word
  const correct = word === target.value
  feedback.value = correct ? '答对了！' : `正确答案是 ${target.value}。`
  if (!correct) errors.value.unshift({ expected: target.value, chosen: word })
}

onUnmounted(stopPronunciation)
</script>

<template>
  <div class="page-heading">
    <h1>48 音素</h1>
    <p>20 个元音、24 个单独辅音和 4 个辅音组合。点击卡片查看口型并试听。</p>
  </div>
  <div class="chart-layout">
    <section class="panel">
      <div v-for="group in groups" :key="group.label" class="chart-group">
        <h2>{{ group.label }}</h2>
        <div class="phoneme-grid">
          <button v-for="entry in group.entries" :key="entry.symbol" type="button"
            :aria-pressed="selected.symbol === entry.symbol"
            :class="{ trap: traps.has(entry.symbol) }" @click="select(entry)">/{{ entry.symbol }}/</button>
        </div>
      </div>
      <p class="muted">易混音 · {{ trapGroups.map(group => group.label).join('　·　') }}</p>
    </section>
    <section class="panel sound-detail" aria-label="音素详情">
      <h2>/{{ selected.symbol }}/</h2>
      <MouthDiagram :shape="selected.shape" />
      <p>例词 · <strong lang="en">{{ selected.example }}</strong></p>
      <button type="button" class="primary" @click="select(selected)">播放发音</button>
      <p class="muted">缺少音素音频时，浏览器会朗读整个例词。</p>
      <p role="status">{{ audioStatus }}</p>
    </section>
  </div>
  <div class="home-grid section-gap">
    <section class="panel">
      <h2>最小对立词听辨</h2>
      <label for="pair">选择练习组</label>
      <select id="pair" v-model="pairIndex" @change="resetQuiz">
        <option v-for="(item, index) in pairs" :key="item.label" :value="index">{{ item.label }} · {{ item.words.join(' / ') }}</option>
      </select>
      <div class="actions">
        <button type="button" class="primary" @click="listen">{{ answered ? '再练一次' : target ? '重听单词' : '播放单词' }}</button>
        <button v-for="word in pair.words" :key="word" type="button" lang="en"
          :disabled="!target || !!answered" @click="answer(word)">{{ word }}</button>
      </div>
      <p role="status">{{ feedback }}</p>
    </section>
    <section class="panel">
      <div class="section-heading">
        <h2>错题本 · {{ errors.length }}</h2>
        <button type="button" :disabled="!errors.length" @click="errors = []">清空</button>
      </div>
      <p v-if="!errors.length" class="muted">还没有错题。</p>
      <ul v-else class="plain-list">
        <li v-for="(error, index) in errors" :key="index">
          正确 <strong lang="en">{{ error.expected }}</strong> · 选了 <span lang="en">{{ error.chosen }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>
