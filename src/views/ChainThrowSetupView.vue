<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCharactersStore } from '../stores/characters'
import { buildThrowChains } from '../utils/throwChainBuilder'

const router = useRouter()
const charStore = useCharactersStore()

onMounted(() => {
  if (charStore.characters.length === 0) charStore.loadCharacters()
})

// Only show characters with chains
const charsWithChains = computed(() =>
  charStore.characters
    .map(char => {
      const { chains } = buildThrowChains(char.moves)
      return { char, chains }
    })
    .filter(({ chains }) => chains.length > 0)
)

const activeCharId = ref(null)
const activeChar = computed(() => charStore.characters.find(c => c.id === activeCharId.value))
const activeChains = computed(() => {
  if (!activeChar.value) return []
  return buildThrowChains(activeChar.value.moves).chains
})

const selectedChainIds = ref(new Set())

function selectChar(id) {
  if (activeCharId.value === id) return
  activeCharId.value = id
  selectedChainIds.value = new Set()
}

function toggleChain(id) {
  if (selectedChainIds.value.has(id)) selectedChainIds.value.delete(id)
  else selectedChainIds.value.add(id)
  selectedChainIds.value = new Set(selectedChainIds.value)
}

function selectAll() {
  selectedChainIds.value = new Set(activeChains.value.map(c => c.id))
}

function chainDepth(chain) {
  let max = 0
  function walk(stance, depth) {
    if (depth > max) max = depth
    const node = chain.nodeMap[stance]
    if (!node) return
    for (const child of node.children) walk(child, depth + 1)
  }
  walk(chain.rootStance, 1)
  return max
}

function chainMoveCount(chain) {
  return Object.values(chain.nodeMap).reduce((acc, n) => acc + n.moves.length, 0)
}

const timerDuration = ref(8)

function launch() {
  if (!activeChar.value || selectedChainIds.value.size === 0) return
  const chains = activeChains.value.filter(c => selectedChainIds.value.has(c.id))
  // Store chain drill config in sessionStorage
  sessionStorage.setItem('chainDrillConfig', JSON.stringify({
    charId: activeCharId.value,
    charName: activeChar.value.name,
    chainIds: [...selectedChainIds.value],
    timerDuration: timerDuration.value,
  }))
  router.push('/chain-throw-drill')
}
</script>

<template>
  <div class="flex h-[calc(100vh-57px)]">
    <!-- Left: character list -->
    <div class="w-56 flex-shrink-0 border-r border-gray-800 overflow-y-auto bg-gray-950">
      <div class="p-3 text-xs text-gray-500 uppercase tracking-wider font-semibold">Personnages</div>
      <button
        v-for="{ char, chains } in charsWithChains"
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
        <span class="text-xs bg-gray-800 text-gray-400 rounded px-1.5 py-0.5">{{ chains.length }}</span>
      </button>
    </div>

    <!-- Right: chains -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <template v-if="activeChar">
        <div class="flex-1 overflow-y-auto">
          <div class="max-w-3xl mx-auto px-6 py-6">
            <div class="flex items-center gap-4 mb-6">
              <h2 class="text-2xl font-bold text-white">{{ activeChar.name }}</h2>
              <button @click="selectAll" class="text-sm text-gray-400 hover:text-white underline">Tout sélectionner</button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                v-for="chain in activeChains"
                :key="chain.id"
                @click="toggleChain(chain.id)"
                :class="[
                  'border rounded-xl p-4 text-left transition-all relative',
                  selectedChainIds.has(chain.id)
                    ? 'bg-yellow-400/10 border-yellow-400'
                    : 'bg-gray-900 border-gray-700 hover:border-gray-500'
                ]"
              >
                <div v-if="selectedChainIds.has(chain.id)" class="absolute top-3 right-3 text-yellow-400">✓</div>
                <div class="font-bold text-white mb-1">{{ chain.name }}</div>
                <div class="flex items-center gap-3 text-xs text-gray-500">
                  <span>{{ chainMoveCount(chain) }} throws</span>
                  <span>{{ chainDepth(chain) }} étapes max</span>
                </div>
                <!-- Visual chain depth indicator -->
                <div class="flex items-center gap-1 mt-2">
                  <div
                    v-for="i in chainDepth(chain)"
                    :key="i"
                    class="h-1.5 rounded-full flex-1"
                    :class="selectedChainIds.has(chain.id) ? 'bg-yellow-400/60' : 'bg-gray-700'"
                  />
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Launch bar -->
        <div class="border-t border-gray-800 bg-gray-950 px-6 py-3 flex items-center gap-4">
          <div class="flex items-center gap-3">
            <span class="text-gray-400 text-sm">Timer:</span>
            <button @click="timerDuration = 5" :class="['px-3 py-1 rounded text-sm', timerDuration === 5 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700']">5s</button>
            <button @click="timerDuration = 8" :class="['px-3 py-1 rounded text-sm', timerDuration === 8 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700']">8s</button>
            <button @click="timerDuration = 10" :class="['px-3 py-1 rounded text-sm', timerDuration === 10 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700']">10s</button>
          </div>
          <span class="text-gray-400 text-sm">{{ selectedChainIds.size }} chaîne{{ selectedChainIds.size > 1 ? 's' : '' }}</span>
          <button
            @click="launch"
            :disabled="selectedChainIds.size === 0"
            :class="[
              'ml-auto px-6 py-2.5 rounded-xl font-bold text-lg transition-all',
              selectedChainIds.size > 0
                ? 'bg-yellow-400 hover:bg-yellow-300 text-black cursor-pointer'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            ]"
          >
            Lancer le drill
          </button>
        </div>
      </template>

      <div v-else class="flex items-center justify-center h-full text-gray-600">
        <div class="text-center">
          <div class="text-5xl mb-4">🔗</div>
          <p class="text-lg">Sélectionne un personnage</p>
          <p class="text-sm mt-1">pour voir ses chain throws</p>
        </div>
      </div>
    </div>
  </div>
</template>
