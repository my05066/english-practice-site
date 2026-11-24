<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { chunksFor, dailyTopic, topics } from '../data/topics'
import { favorites } from '../storage'

const now = ref(new Date())
const today = computed(() => dailyTopic(now.value))
const dateLabel = computed(() => new Intl.DateTimeFormat('zh-CN', {
  month: 'long', day: 'numeric', weekday: 'long',
}).format(now.value))
const total = new Set(topics.flatMap(chunksFor).map(chunk => chunk.text)).size
let clock
onMounted(() => { clock = setInterval(() => { now.value = new Date() }, 1000) })
onUnmounted(() => clearInterval(clock))
</script>

<template>
  <div class="page-heading">
    <p class="eyebrow">{{ dateLabel }}</p>
    <h1>今日一练</h1>
    <p>用一道 Part 1 题开口，听一句，跟一句。</p>
  </div>
  <div class="home-grid">
    <article class="panel daily">
      <p class="eyebrow">今日题目 · Week 1</p>
      <h2 lang="en">{{ today.question_en }}</h2>
      <p>{{ today.question_cn }}</p>
      <RouterLink class="button primary" :to="{ path: '/practice', query: { topic: today.id } }">开始跟读</RouterLink>
      <details>
        <summary>查看今日范文与词块</summary>
        <p>{{ today.answer_cn }}</p>
        <p lang="en">{{ today.answer_en }}</p>
        <ul class="tags"><li v-for="chunk in today.chunks" :key="chunk" lang="en">{{ chunk }}</li></ul>
        <p>关键词 · {{ today.keywords.join(' / ') }}</p>
        <ol><li v-for="sentence in today.shadow_sentences" :key="sentence" lang="en">{{ sentence }}</li></ol>
      </details>
    </article>
    <aside class="panel progress-card">
      <h2>词块收藏</h2>
      <p><strong>{{ favorites.length }}</strong> / {{ total }}</p>
      <progress aria-label="词块收藏进度" :value="favorites.length" :max="total"></progress>
      <RouterLink to="/practice#favorites">查看收藏</RouterLink>
    </aside>
  </div>
  <section class="topics">
    <h2>第一周题库</h2>
    <ol class="topic-list">
      <li v-for="topic in topics" :key="topic.id">
        <RouterLink :to="{ path: '/practice', query: { topic: topic.id } }">
          <span class="topic-day">Day {{ topic.id }}</span>
          <span><strong lang="en">{{ topic.question_en }}</strong><small>{{ topic.question_cn }}</small></span>
          <span class="topic-action">跟读</span>
        </RouterLink>
      </li>
    </ol>
  </section>
</template>
