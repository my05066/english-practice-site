<script setup>
import { ref } from 'vue'
import { audioUrl } from '../audio'

defineProps({ file: String, label: String })
const state = ref('loading')
</script>

<template>
  <div class="audio-slot">
    <p><strong>{{ label }}</strong></p>
    <audio v-if="state !== 'missing'" v-show="state === 'ready'" controls preload="metadata" :src="audioUrl('topics', file)"
      @loadedmetadata="state = 'ready'" @error="state = 'missing'"></audio>
    <p v-if="state !== 'ready'" class="muted" role="status">{{ state === 'missing' ? '音频还没生成' : '正在检查音频…' }}</p>
  </div>
</template>
