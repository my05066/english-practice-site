<script setup>
import { computed } from 'vue'

const props = defineProps({ shape: String })
const poses = {
  front: ['M18 40 Q60 17 102 40 Q60 61 18 40Z', 'M30 45 Q49 32 65 44 T90 43', '舌位靠前'],
  round: ['M40 40 Q60 10 80 40 Q60 70 40 40Z', 'M47 48 Q60 43 73 48', '双唇收圆'],
  neutral: ['M26 40 Q60 19 94 40 Q60 62 26 40Z', 'M36 48 Q60 42 84 48', '嘴唇放松'],
  open: ['M22 39 Q60 9 98 39 Q60 80 22 39Z', 'M35 54 Q60 43 85 54', '下颌张开'],
  closed: ['M22 40 Q60 22 98 40 Q60 57 22 40Z', 'M23 40 Q60 42 97 40', '双唇闭合'],
  ridge: ['M24 40 Q60 15 96 40 Q60 65 24 40Z', 'M33 48 Q49 49 56 33 Q62 25 69 36', '舌尖靠近上齿龈'],
  back: ['M24 40 Q60 15 96 40 Q60 65 24 40Z', 'M34 49 Q57 52 66 36 Q76 23 86 40', '舌后部抬起'],
  lip: ['M22 40 Q60 18 98 40 Q60 63 22 40Z', 'M35 42 H85 M45 35 V42 M55 32 V42 M65 32 V42 M75 35 V42', '上齿靠近下唇'],
  teeth: ['M22 40 Q60 18 98 40 Q60 63 22 40Z', 'M35 37 H85 M42 45 Q60 35 78 45', '舌尖轻触上齿或伸到齿间'],
}
const pose = computed(() => poses[props.shape])
</script>

<template>
  <figure class="mouth">
    <svg viewBox="0 0 120 80" aria-hidden="true">
      <path :d="pose[0]" fill="#fee4da" stroke="#a9503b" stroke-width="2.6" />
      <path :d="pose[1]" fill="none" stroke="#a9503b" stroke-width="2.6" stroke-linecap="round" />
    </svg>
    <figcaption>{{ pose[2] }} · 口型示意</figcaption>
  </figure>
</template>
