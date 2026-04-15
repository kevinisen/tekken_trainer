<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  src: { type: String, default: '' },
  waitForLoad: { type: Boolean, default: false },
})

const emit = defineEmits(['ready'])
const videoEl = ref(null)

function onCanPlay() {
  emit('ready')
}

watch(() => props.src, () => {
  if (videoEl.value) {
    videoEl.value.load()
    if (!props.waitForLoad) {
      videoEl.value.play().catch(() => {})
      emit('ready')
    }
  }
})

import { onMounted } from 'vue'
onMounted(() => {
  if (videoEl.value && props.src) {
    if (!props.waitForLoad) {
      videoEl.value.play().catch(() => {})
      emit('ready')
    }
  }
})
</script>

<template>
  <div class="w-full aspect-video bg-black rounded-lg overflow-hidden">
    <video
      v-if="src"
      ref="videoEl"
      :src="src"
      autoplay
      loop
      muted
      playsinline
      class="w-full h-full object-contain"
      @canplay="onCanPlay"
    />
    <div v-else class="w-full h-full flex items-center justify-center text-gray-600 text-sm">
      No video available
    </div>
  </div>
</template>
