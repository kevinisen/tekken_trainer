<script setup>
const props = defineProps({
  modelValue: { type: Object, required: true }
})
const emit = defineEmits(['update:modelValue'])

const hitLevels = ['h', 'm', 'l', 'sm', 'sh', 'sl']

const sortOptions = [
  { id: null,         label: 'Défaut' },
  { id: 'block-asc',  label: 'Block ↑' },
  { id: 'block-desc', label: 'Block ↓' },
  { id: 'hit-asc',    label: 'Hit ↑' },
  { id: 'hit-desc',   label: 'Hit ↓' },
]

function setSort(id) {
  emit('update:modelValue', { ...props.modelValue, sortBy: id })
}

function toggle(key, value) {
  const current = { ...props.modelValue }
  if (Array.isArray(current[key])) {
    const idx = current[key].indexOf(value)
    if (idx >= 0) current[key] = current[key].filter(v => v !== value)
    else current[key] = [...current[key], value]
  } else {
    current[key] = !current[key]
  }
  emit('update:modelValue', current)
}
</script>

<template>
  <div class="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
    <div class="flex items-center gap-2 flex-wrap">
      <span class="text-gray-400 text-sm font-medium w-20">Hit Level:</span>
      <button
        v-for="level in hitLevels"
        :key="level"
        @click="toggle('hitLevels', level)"
        :class="[
          'px-3 py-1 rounded text-sm font-mono transition-colors',
          modelValue.hitLevels.includes(level)
            ? 'bg-blue-600 text-white'
            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
        ]"
      >{{ level }}</button>
    </div>

    <div class="flex items-center gap-2 flex-wrap">
      <span class="text-gray-400 text-sm font-medium w-20">Safety:</span>
      <button
        @click="toggle('showSafe', true)"
        :class="['px-3 py-1 rounded text-sm transition-colors', modelValue.showSafe ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700']"
      >Safe (≥0)</button>
      <button
        @click="toggle('showPunishable', true)"
        :class="['px-3 py-1 rounded text-sm transition-colors', modelValue.showPunishable ? 'bg-orange-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700']"
      >Punishable (-10 to -14)</button>
      <button
        @click="toggle('showLaunchable', true)"
        :class="['px-3 py-1 rounded text-sm transition-colors', modelValue.showLaunchable ? 'bg-red-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700']"
      >Launch Punish (-15+)</button>
    </div>

    <div class="flex items-center gap-2">
      <span class="text-gray-400 text-sm font-medium w-20">Other:</span>
      <button
        @click="toggle('favoritesOnly', true)"
        :class="['px-3 py-1 rounded text-sm transition-colors', modelValue.favoritesOnly ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700']"
      >⭐ Favorites only</button>
    </div>

    <div class="flex items-center gap-2 flex-wrap">
      <span class="text-gray-400 text-sm font-medium w-20">Sort:</span>
      <button
        v-for="opt in sortOptions"
        :key="opt.id"
        @click="setSort(opt.id)"
        :class="['px-3 py-1 rounded text-sm transition-colors', modelValue.sortBy === opt.id ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700']"
      >{{ opt.label }}</button>
    </div>
  </div>
</template>
