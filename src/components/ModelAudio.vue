<script setup>
import { computed, ref } from 'vue'

const props = defineProps({ path: String, label: String })
const failed = ref(false)
const src = computed(() => `${import.meta.env.BASE_URL}audio/${props.path}`)
</script>

<template>
  <div class="audio-slot">
    <p><strong>{{ label }}</strong></p>
    <audio v-if="!failed" controls preload="none" :src="src" @error="failed = true"></audio>
    <p v-else class="muted" role="status">音频文件缺失</p>
  </div>
</template>
