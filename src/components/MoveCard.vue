<script setup>
import { ref, computed } from 'vue'
import { parseBlockFrame } from '../utils/frameParser'

const props = defineProps({
  move: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  favorite: { type: Boolean, default: false },
  showCharName: { type: Boolean, default: false },
  videoTooltip: { type: Boolean, default: false },
})
const emit = defineEmits(['toggle-select', 'toggle-favorite'])

const blockCategory = computed(() => parseBlockFrame(props.move.block))

const blockColor = computed(() => {
  const c = blockCategory.value
  if (!c) return 'text-gray-500'
  if (c === 'safe') return 'text-green-400'
  if (c === '-10' || c === '-11') return 'text-yellow-400'
  if (c === '-12' || c === '-13') return 'text-orange-400'
  if (c === '-14') return 'text-red-400'
  if (c === '-15+') return 'text-red-600 font-bold'
  return 'text-gray-400'
})

const hitLevelBadge = computed(() => {
  const map = { h: 'bg-blue-900 text-blue-300', m: 'bg-purple-900 text-purple-300', l: 'bg-yellow-900 text-yellow-300' }
  return map[props.move.hitLevel] || 'bg-gray-800 text-gray-400'
})

const hovered = ref(false)
const tooltipPos = ref({ top: 0, left: 0, below: true })
const cardRef = ref(null)

function onMouseEnter() {
  if (!props.videoTooltip || !props.move.video_url) return
  hovered.value = true
  const rect = cardRef.value.getBoundingClientRect()
  const tooltipH = 200
  const below = rect.bottom + tooltipH + 8 <= window.innerHeight
  tooltipPos.value = {
    top: below ? rect.bottom + 8 : rect.top - tooltipH - 8,
    left: Math.min(rect.left, window.innerWidth - 320 - 8),
    below,
  }
}

function onMouseLeave() {
  hovered.value = false
}
</script>

<template>
<div>
  <div
    ref="cardRef"
    :class="[
      'bg-gray-900 border rounded-lg p-3 flex items-center gap-3 transition-all cursor-pointer hover:border-gray-600',
      selected ? 'border-blue-500 bg-gray-800' : 'border-gray-700'
    ]"
    @click="$emit('toggle-select')"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <!-- Checkbox -->
    <div :class="['w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0', selected ? 'border-blue-500 bg-blue-500' : 'border-gray-600']">
      <svg v-if="selected" class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
      </svg>
    </div>

    <!-- Move info -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="font-semibold text-white text-sm">{{ move.name || '—' }}</span>
        <span v-if="showCharName && move._charName" class="text-xs text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">{{ move._charName }}</span>
        <span class="font-mono text-blue-300 text-xs bg-blue-900/40 px-1.5 py-0.5 rounded">{{ move.command }}</span>
        <span :class="['text-xs px-1.5 py-0.5 rounded font-mono', hitLevelBadge]">{{ move.hitLevel }}</span>
      </div>
      <div class="flex items-center gap-3 mt-1">
        <span class="text-gray-500 text-xs">Block:</span>
        <span :class="['font-mono text-sm font-bold', blockColor]">{{ move.block || 'N/A' }}</span>
        <span v-if="move.startup" class="text-gray-600 text-xs">{{ move.startup }}</span>
        <span v-if="move.tags" class="text-xs text-gray-500 italic truncate">{{ move.tags }}</span>
      </div>
    </div>

    <!-- Favorite button -->
    <button
      @click.stop="$emit('toggle-favorite')"
      :class="['text-lg transition-transform hover:scale-110', favorite ? 'text-yellow-400' : 'text-gray-700 hover:text-gray-500']"
    >⭐</button>
  </div>

  <!-- Video tooltip (teleported to body to avoid clipping) -->
  <Teleport to="body">
    <div
      v-if="hovered && videoTooltip && move.video_url"
      class="fixed z-50 w-80 bg-gray-900 border border-gray-600 rounded-xl shadow-2xl overflow-hidden pointer-events-none"
      :style="{ top: tooltipPos.top + 'px', left: tooltipPos.left + 'px' }"
    >
      <div class="px-3 pt-2 pb-1 text-xs text-gray-400 font-mono flex items-center gap-2">
        <span class="text-white font-semibold">{{ move.name || move.command }}</span>
        <span class="text-blue-300 bg-blue-900/40 px-1.5 rounded">{{ move.command }}</span>
      </div>
      <video
        :src="move.video_url"
        autoplay
        loop
        muted
        playsinline
        class="w-full aspect-video object-contain bg-black"
      />
    </div>
  </Teleport>
</div>
</template>
