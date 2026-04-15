<script setup>
import { computed } from 'vue'

const props = defineProps({
  option: { type: Object, required: true }, // { id, label, key, colorClass }
  state: { type: String, default: 'idle' }, // idle | correct | wrong | highlight
  disabled: { type: Boolean, default: false },
  keyHint: { type: String, default: null }, // override from active profile
})
const emit = defineEmits(['click'])

const baseClass = 'flex flex-col items-center justify-center gap-1 px-4 py-4 rounded-xl font-bold text-lg border-2 transition-all duration-150 min-h-[70px] select-none'

const stateClass = computed(() => {
  if (props.state === 'correct') return 'bg-green-500 border-green-400 text-white scale-105 shadow-green-500/50 shadow-lg'
  if (props.state === 'wrong') return 'bg-red-600 border-red-500 text-white'
  if (props.state === 'highlight') return 'bg-green-600 border-green-400 text-white animate-pulse'
  if (props.disabled) return 'opacity-50 cursor-not-allowed border-gray-700 bg-gray-800 text-gray-400'

  // idle states by type
  const colorMap = {
    'answer-safe': 'border-green-700 bg-green-900/30 text-green-300 hover:bg-green-900/60 hover:border-green-500 cursor-pointer',
    'answer-minus10': 'border-yellow-700 bg-yellow-900/30 text-yellow-300 hover:bg-yellow-900/60 hover:border-yellow-500 cursor-pointer',
    'answer-minus11': 'border-yellow-700 bg-yellow-900/30 text-yellow-300 hover:bg-yellow-900/60 hover:border-yellow-500 cursor-pointer',
    'answer-minus12': 'border-orange-700 bg-orange-900/30 text-orange-300 hover:bg-orange-900/60 hover:border-orange-500 cursor-pointer',
    'answer-minus13': 'border-orange-700 bg-orange-900/30 text-orange-300 hover:bg-orange-900/60 hover:border-orange-500 cursor-pointer',
    'answer-minus14': 'border-red-700 bg-red-900/30 text-red-300 hover:bg-red-900/60 hover:border-red-500 cursor-pointer',
    'answer-minus15': 'border-red-800 bg-red-950/60 text-red-400 hover:bg-red-900/60 hover:border-red-600 cursor-pointer',
  }
  return colorMap[props.option.colorClass] || 'border-gray-700 bg-gray-800 text-white hover:bg-gray-700 cursor-pointer'
})
</script>

<template>
  <button
    :class="[baseClass, stateClass]"
    @click="!disabled && $emit('click', option.id)"
    :disabled="disabled"
  >
    <span>{{ option.label }}</span>
    <span class="text-xs opacity-60 font-mono">[{{ keyHint ?? option.key }}]</span>
  </button>
</template>
