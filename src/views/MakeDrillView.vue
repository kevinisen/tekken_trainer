<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCharactersStore } from '../stores/characters'
import { parseBlockFrame, parseFrameNum } from '../utils/frameParser'
import FilterBar from '../components/FilterBar.vue'
import MoveCard from '../components/MoveCard.vue'

const charStore = useCharactersStore()
onMounted(() => {
  if (charStore.characters.length === 0) charStore.loadCharacters()
  loadAllSaved()
})

// --- persistence ---
function savedKey(charId) { return `tekken-custom-moves-${charId}` }

function loadSaved(charId) {
  return new Set(JSON.parse(localStorage.getItem(savedKey(charId)) || '[]'))
}

function saveToDisk(charId, set) {
  localStorage.setItem(savedKey(charId), JSON.stringify([...set]))
}

// count of saved moves per char (for badges)
const savedCounts = ref({})
function loadAllSaved() {
  const counts = {}
  for (const char of charStore.characters) {
    counts[char.id] = loadSaved(char.id).size
  }
  savedCounts.value = counts
}

// --- active character ---
const activeCharId = ref(null)
const activeChar = computed(() => charStore.characters.find(c => c.id === activeCharId.value))

const selected = ref(new Set())

function selectChar(id) {
  activeCharId.value = id
  selected.value = loadSaved(id)
}

// --- filters ---
const filters = ref({
  hitLevels: [],
  showSafe: true,
  showPunishable: true,
  showLaunchable: true,
  favoritesOnly: false,
  sortBy: null,
})

const filteredMoves = computed(() => {
  if (!activeChar.value) return []
  const result = activeChar.value.moves.filter(m => {
    if (filters.value.hitLevels.length > 0 && !filters.value.hitLevels.includes(m.hitLevel)) return false
    const cat = parseBlockFrame(m.block)
    if (cat === null) return false
    if (cat === 'safe' && !filters.value.showSafe) return false
    if (['-10','-11','-12','-13','-14'].includes(cat) && !filters.value.showPunishable) return false
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

function toggleMove(id) {
  if (selected.value.has(id)) selected.value.delete(id)
  else selected.value.add(id)
  selected.value = new Set(selected.value)
}

function selectAll() { filteredMoves.value.forEach(m => selected.value.add(m._id)); selected.value = new Set(selected.value) }
function selectNone() { selected.value.clear(); selected.value = new Set(selected.value) }
function selectPunishable() {
  filteredMoves.value.filter(m => {
    const cat = parseBlockFrame(m.block)
    return cat && cat !== 'safe'
  }).forEach(m => selected.value.add(m._id))
  selected.value = new Set(selected.value)
}

const saved = ref(false)
function saveSelection() {
  if (!activeCharId.value) return
  saveToDisk(activeCharId.value, selected.value)
  savedCounts.value[activeCharId.value] = selected.value.size
  saved.value = true
  setTimeout(() => saved.value = false, 2000)
}

// --- Preload videos des moves sélectionnés ---
const preloadedVideos = computed(() => {
  if (!activeChar.value) return []
  return activeChar.value.moves
    .filter(m => selected.value.has(m._id) && m.video_url)
    .map(m => m.video_url)
})
</script>

<template>
  <div class="flex h-[calc(100vh-57px)]">
    <!-- Preload caché pour les vidéos sélectionnées -->
    <div class="hidden">
      <link v-for="url in preloadedVideos" :key="url" rel="preload" as="video" :href="url" />
    </div>

    <!-- Left panel: character list -->
    <div class="w-56 flex-shrink-0 border-r border-gray-800 overflow-y-auto bg-gray-950">
      <div class="p-3 text-xs text-gray-500 uppercase tracking-wider font-semibold">Personnages</div>
      <button
        v-for="char in charStore.characters"
        :key="char.id"
        @click="selectChar(char.id)"
        :class="[
          'w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors',
          activeCharId === char.id
            ? 'bg-yellow-400/10 text-yellow-400 border-r-2 border-yellow-400'
            : 'text-gray-300 hover:bg-gray-900 hover:text-white'
        ]"
      >
        <span class="text-sm font-medium">{{ char.name }}</span>
        <span v-if="savedCounts[char.id]" class="text-xs bg-yellow-400/20 text-yellow-400 rounded px-1.5 py-0.5 font-mono">
          {{ savedCounts[char.id] }}
        </span>
      </button>
    </div>

    <!-- Right panel: moves -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <template v-if="activeChar">
        <!-- Scrollable list -->
        <div class="flex-1 overflow-y-auto">
          <div class="max-w-3xl mx-auto px-6 py-6">
            <div class="flex items-center gap-4 mb-4">
              <h2 class="text-2xl font-bold text-white">{{ activeChar.name }}</h2>
              <span class="text-gray-500 text-sm">{{ selected.size }} moves sélectionnés</span>
            </div>

            <FilterBar v-model="filters" class="mb-4" />

            <div class="flex items-center gap-2 mb-3 flex-wrap">
              <button @click="selectAll" class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-sm rounded text-white">Tout</button>
              <button @click="selectNone" class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-sm rounded text-white">Aucun</button>
              <button @click="selectPunishable" class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-sm rounded text-orange-400">Punissables</button>
              <span class="text-gray-500 text-sm ml-auto">{{ filteredMoves.length }} affichés</span>
            </div>

            <div class="space-y-2">
              <MoveCard
                v-for="move in filteredMoves"
                :key="move._id"
                :move="move"
                :selected="selected.has(move._id)"
                :favorite="false"
                :video-tooltip="true"
                @toggle-select="toggleMove(move._id)"
                @toggle-favorite="() => {}"
              />
            </div>
          </div>
        </div>

        <!-- Sticky save bar -->
        <div class="border-t border-gray-800 bg-gray-950 px-6 py-3 flex items-center gap-4">
          <span class="text-gray-400 text-sm">{{ selected.size }} moves sélectionnés</span>
          <button
            @click="saveSelection"
            :class="[
              'ml-auto px-6 py-2.5 rounded-lg font-bold transition-all',
              saved
                ? 'bg-green-600 text-white'
                : 'bg-yellow-400 hover:bg-yellow-300 text-black'
            ]"
          >
            {{ saved ? '✓ Sauvegardé' : 'Sauvegarder' }}
          </button>
        </div>
      </template>

      <div v-else class="flex items-center justify-center h-full text-gray-600">
        <div class="text-center">
          <div class="text-5xl mb-4">👈</div>
          <p class="text-lg">Sélectionne un personnage</p>
          <p class="text-sm mt-1">pour choisir ses moves</p>
        </div>
      </div>
    </div>
  </div>
</template>
