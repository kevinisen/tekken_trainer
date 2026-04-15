<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCharactersStore } from '../stores/characters'
import { useDrillStore } from '../stores/drill'
import { parseBlockFrame, parseFrameNum } from '../utils/frameParser'
import MoveCard from '../components/MoveCard.vue'
import FilterBar from '../components/FilterBar.vue'

const route = useRoute()
const router = useRouter()
const charStore = useCharactersStore()
const drillStore = useDrillStore()

const charId = route.params.id

onMounted(() => {
  if (charStore.characters.length === 0) charStore.loadCharacters()
})

const character = computed(() => charStore.characters.find(c => c.id === charId))

// Favorites (localStorage)
const favKey = `tekken-favorites-${charId}`
const favorites = ref(new Set(JSON.parse(localStorage.getItem(favKey) || '[]')))
function saveFavorites() {
  localStorage.setItem(favKey, JSON.stringify([...favorites.value]))
}
function toggleFavorite(moveId) {
  if (favorites.value.has(moveId)) favorites.value.delete(moveId)
  else favorites.value.add(moveId)
  saveFavorites()
}

// Filters
const filters = ref({
  hitLevels: [],
  showSafe: true,
  showPunishable: true,
  showLaunchable: true,
  favoritesOnly: false,
  sortBy: null,
})

// Selection
const selected = ref(new Set())

const filteredMoves = computed(() => {
  if (!character.value) return []
  const result = character.value.moves.filter(m => {
    if (filters.value.hitLevels.length > 0 && !filters.value.hitLevels.includes(m.hitLevel)) return false
    if (filters.value.favoritesOnly && !favorites.value.has(m._id)) return false

    const cat = parseBlockFrame(m.block)
    if (cat === null) return false
    if (cat === 'safe' && !filters.value.showSafe) return false
    if ((cat === '-10' || cat === '-11' || cat === '-12' || cat === '-13' || cat === '-14') && !filters.value.showPunishable) return false
    if (cat === '-15+' && !filters.value.showLaunchable) return false

    return true
  })

  const sort = filters.value.sortBy
  if (!sort) return result

  return [...result].sort((a, b) => {
    const field = sort.startsWith('block') ? 'block' : 'hit'
    const asc = sort.endsWith('asc')
    const aVal = parseFrameNum(a[field]) ?? (asc ? Infinity : -Infinity)
    const bVal = parseFrameNum(b[field]) ?? (asc ? Infinity : -Infinity)
    return asc ? aVal - bVal : bVal - aVal
  })
})

function toggleSelect(id) {
  if (selected.value.has(id)) selected.value.delete(id)
  else selected.value.add(id)
}

function selectAll() {
  filteredMoves.value.forEach(m => selected.value.add(m._id))
}

function selectNone() {
  selected.value.clear()
}

function selectFavorites() {
  filteredMoves.value.filter(m => favorites.value.has(m._id)).forEach(m => selected.value.add(m._id))
}

function selectPunishable() {
  filteredMoves.value.filter(m => {
    const cat = parseBlockFrame(m.block)
    return cat && cat !== 'safe'
  }).forEach(m => selected.value.add(m._id))
}

const timerDuration = ref(10)

function launchDrill() {
  const moves = character.value.moves.filter(m => selected.value.has(m._id))
  drillStore.selectedMoves = moves
  drillStore.setupDrill(moves, timerDuration.value, charId)
  router.push('/drill')
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-6 py-8" v-if="character">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <router-link to="/" class="text-gray-400 hover:text-white">← Back</router-link>
      <h1 class="text-3xl font-bold text-white">{{ character.name }}</h1>
      <span class="text-gray-500 text-sm">{{ character.moves.length }} moves</span>
    </div>

    <!-- Filters -->
    <FilterBar v-model="filters" class="mb-4" />

    <!-- Toolbar -->
    <div class="flex items-center gap-2 mb-4 flex-wrap">
      <button @click="selectAll" class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-sm rounded text-white">Select All</button>
      <button @click="selectNone" class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-sm rounded text-white">Select None</button>
      <button @click="selectFavorites" class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-sm rounded text-yellow-400">⭐ Select Favorites</button>
      <button @click="selectPunishable" class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-sm rounded text-orange-400">Select Punishable</button>
      <span class="text-gray-500 text-sm ml-auto">{{ filteredMoves.length }} shown</span>
    </div>

    <!-- Moves list -->
    <div class="space-y-2 mb-6">
      <MoveCard
        v-for="move in filteredMoves"
        :key="move._id"
        :move="move"
        :selected="selected.has(move._id)"
        :favorite="favorites.has(move._id)"
        @toggle-select="toggleSelect(move._id)"
        @toggle-favorite="toggleFavorite(move._id)"
      />
    </div>

    <!-- Launch bar -->
    <div class="sticky bottom-0 bg-gray-950/95 border-t border-gray-800 -mx-6 px-6 py-4 flex items-center gap-4">
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
      <button
        @click="launchDrill"
        :disabled="selected.size === 0"
        :class="[
          'ml-auto px-6 py-3 rounded-xl font-bold text-lg transition-all',
          selected.size > 0
            ? 'bg-yellow-400 hover:bg-yellow-300 text-black cursor-pointer'
            : 'bg-gray-800 text-gray-600 cursor-not-allowed'
        ]"
      >
        Launch Drill ({{ selected.size }} moves)
      </button>
    </div>
  </div>
  <div v-else class="text-center py-20 text-gray-500">
    <p>Character not found.</p>
    <router-link to="/" class="text-yellow-400 hover:underline">← Back to home</router-link>
  </div>
</template>
