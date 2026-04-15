<script setup>
import { computed } from 'vue'

const props = defineProps({
  progress: { type: Number, default: 1 }, // 0..1
})

const barColor = computed(() => {
  if (props.progress > 0.5) return 'bg-green-500'
  if (props.progress > 0.25) return 'bg-yellow-400'
  return 'bg-red-500'
})
</script>

<template>
  <div class="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
    <div
      :class="['h-full rounded-full transition-all duration-100', barColor]"
      :style="{ width: `${progress * 100}%` }"
    />
  </div>
</template>
