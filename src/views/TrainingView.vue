<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCharactersStore } from '../stores/characters'
import { useDrillStore } from '../stores/drill'
import { useRouter } from 'vue-router'

const charStore = useCharactersStore()
const drillStore = useDrillStore()
const router = useRouter()

onMounted(() => {
  if (charStore.characters.length === 0) charStore.loadCharacters()
})

function savedKey(charId) { return `tekken-custom-moves-${charId}` }
function getSavedIds(charId) {
  return new Set(JSON.parse(localStorage.getItem(savedKey(charId)) || '[]'))
}
function getSavedCount(charId) { return getSavedIds(charId).size }

const selectedChars = ref(new Set())

function toggleChar(id) {
  if (getSavedCount(id) === 0) return // can't select if no saved moves
  if (selectedChars.value.has(id)) selectedChars.value.delete(id)
  else selectedChars.value.add(id)
  selectedChars.value = new Set(selectedChars.value)
}

const selectedCount = computed(() => selectedChars.value.size)

const timerDuration = ref(10)

function launchDrill() {
  if (selectedCount.value === 0) return

  const allMoves = []
  for (const charId of selectedChars.value) {
    const char = charStore.characters.find(c => c.id === charId)
    if (!char) continue
    const savedIds = getSavedIds(charId)
    const moves = char.moves
      .filter(m => savedIds.has(m._id))
      .map(m => ({ ...m, _charName: char.name, _charId: char.id }))
    allMoves.push(...moves)
  }

  const charKey = [...selectedChars.value].sort().join('+')
  drillStore.setupDrill(allMoves, timerDuration.value, charKey)
  router.push('/drill')
}

// --- Preload videos des persos cochés ---
const preloadedVideos = computed(() => {
  const urls = new Set()
  for (const charId of selectedChars.value) {
    const char = charStore.characters.find(c => c.id === charId)
    if (!char) continue
    const savedIds = getSavedIds(charId)
    char.moves.forEach(m => {
      if (savedIds.has(m._id) && m.video_url) urls.add(m.video_url)
    })
  }
  return Array.from(urls)
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-6 py-12">
    <!-- Preload caché -->
    <div class="hidden">
      <link v-for="url in preloadedVideos" :key="url" rel="preload" as="video" :href="url" />
    </div>

    <h1 class="text-4xl font-bold text-center mb-2 text-white">Training Drill</h1>
    <p class="text-center text-gray-400 mb-8">
      Sélectionne les persos à driller — les moves viennent de ton
      <router-link to="/make-drill" class="text-yellow-400 hover:underline">Make My Drill</router-link>
    </p>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
      <button
        v-for="char in charStore.characters"
        :key="char.id"
        @click="toggleChar(char.id)"
        :disabled="getSavedCount(char.id) === 0"
        :class="[
          'border rounded-xl p-5 text-center transition-all duration-200 group relative',
          getSavedCount(char.id) === 0
            ? 'bg-gray-900/40 border-gray-800 opacity-40 cursor-not-allowed'
            : selectedChars.has(char.id)
              ? 'bg-yellow-400/10 border-yellow-400 cursor-pointer'
              : 'bg-gray-900 border-gray-700 hover:border-yellow-400 hover:bg-gray-800 cursor-pointer'
        ]"
      >
        <div v-if="selectedChars.has(char.id)" class="absolute top-2 right-2 text-yellow-400 text-lg">✓</div>
        <div class="text-3xl mb-2">🥊</div>
        <div :class="['text-base font-bold transition-colors', selectedChars.has(char.id) ? 'text-yellow-400' : 'text-white group-hover:text-yellow-400']">
          {{ char.name }}
        </div>
        <div class="text-xs mt-1" :class="getSavedCount(char.id) > 0 ? 'text-yellow-400/70' : 'text-gray-600'">
          {{ getSavedCount(char.id) > 0 ? `${getSavedCount(char.id)} moves` : 'Aucun move' }}
        </div>
      </button>
    </div>

    <!-- Launch bar -->
    <div v-if="selectedCount > 0" class="sticky bottom-0 bg-gray-950/95 border-t border-gray-800 -mx-6 px-6 py-4 flex items-center gap-4">
      <div class="flex items-center gap-3">
        <span class="text-gray-400 text-sm">Timer:</span>
        <button
          @click="timerDuration = 5"
          :class="['px-3 py-1 rounded text-sm', timerDuration === 5 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700']"
        >5s</button>
        <button
          @click="timerDuration = 10"
          :class="['px-3 py-1 rounded text-sm', timerDuration === 10 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700']"
        >10s</button>
      </div>
      <span class="text-gray-400 text-sm">{{ selectedCount }} perso{{ selectedCount > 1 ? 's' : '' }}</span>
      <button
        @click="launchDrill"
        class="ml-auto px-6 py-3 rounded-xl font-bold text-lg bg-yellow-400 hover:bg-yellow-300 text-black cursor-pointer transition-all"
      >
        Launch Drill
      </button>
    </div>
  </div>
</template>
