<script setup>
import { onBeforeUnmount, ref } from 'vue'

const props = defineProps({ url: String })
const emit = defineEmits(['recorded', 'busy'])
const state = ref('idle')
const message = ref('')
let recorder
let stream
let disposed = false

function release() {
  stream?.getTracks().forEach(track => track.stop())
  stream = undefined
}

function setState(value) {
  state.value = value
  emit('busy', value !== 'idle')
}

async function start() {
  if (state.value !== 'idle') return
  message.value = ''
  if (!navigator.mediaDevices?.getUserMedia || !globalThis.MediaRecorder) {
    message.value = '此浏览器无法录音，请在 localhost 或 HTTPS 页面使用支持录音的浏览器。'
    return
  }

  setState('requesting')
  try {
    const input = await navigator.mediaDevices.getUserMedia({ audio: true })
    if (disposed) {
      input.getTracks().forEach(track => track.stop())
      return
    }
    stream = input
    recorder = new MediaRecorder(stream)
    const parts = []
    let failed = false
    recorder.ondataavailable = event => {
      if (event.data.size) parts.push(event.data)
    }
    recorder.onerror = () => {
      failed = true
      message.value = '录音中断，请再试一次。'
    }
    recorder.onstop = () => {
      release()
      if (disposed) return
      if (!failed && parts.length) {
        emit('recorded', URL.createObjectURL(new Blob(parts, { type: recorder.mimeType || parts[0].type })))
      } else if (!failed) {
        message.value = '没有录到音频，请再试一次。'
      }
      setState('idle')
    }
    recorder.start()
    setState('recording')
  } catch {
    release()
    if (disposed) return
    message.value = '无法开始录音，请检查麦克风权限。'
    setState('idle')
  }
}

function stop() {
  if (recorder?.state !== 'recording') return
  setState('stopping')
  recorder.stop()
}

onBeforeUnmount(() => {
  disposed = true
  if (recorder?.state === 'recording') recorder.stop()
  release()
})
</script>

<template>
  <div class="audio-slot">
    <p><strong>我的录音</strong></p>
    <div class="actions">
      <button type="button" :disabled="state !== 'idle'" @click="start">{{ props.url ? '重新录音' : '开始录音' }}</button>
      <button type="button" :disabled="state !== 'recording'" @click="stop">停止录音</button>
    </div>
    <p v-if="state !== 'idle'" role="status">{{ { requesting: '等待麦克风权限…', recording: '正在录音…', stopping: '正在处理录音…' }[state] }}</p>
    <p v-if="message" role="status">{{ message }}</p>
    <audio v-if="props.url" controls :src="props.url" aria-label="播放我的录音"></audio>
  </div>
</template>
