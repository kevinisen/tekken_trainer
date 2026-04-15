<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { KING_CHAINS, generateAllPaths } from '../data/kingChainThrows'
import { ARMOR_KING_CHAINS } from '../data/armorKingChainThrows'
import { useKeybindingsStore } from '../stores/keybindings'
import { useKeyHandler } from '../composables/useKeyHandler'

const CHARACTERS = [
  { id: 'king', label: 'King', emoji: '👑', chains: KING_CHAINS },
  { id: 'armor-king', label: 'Armor King', emoji: '🖤', chains: ARMOR_KING_CHAINS },
]

const keybindingsStore = useKeybindingsStore()
keybindingsStore.load()

// ─── Break options (sans "1 ou 2") ───────────
const BREAK_OPTIONS = [
  { id: '1',    label: '1',            key: '1' },
  { id: '2',    label: '2',            key: '2' },
  { id: '1+2',  label: '1+2',          key: '3' },
  { id: '3+4',  label: '3+4',          key: '4' },
  { id: 'none', label: '✗ Incassable', key: '5' },
]

function isCorrectBreak(userAnswer, correctAnswer) {
  // Pour "1or2", les boutons 1 ET 2 sont valides directement
  if (correctAnswer === '1or2') return userAnswer === '1' || userAnswer === '2'
  return userAnswer === correctAnswer
}

// ─── Phase: setup | drill | finished ─────────
const phase = ref('setup')

// ─── Setup ───────────────────────────────────
const allChains = [...KING_CHAINS, ...ARMOR_KING_CHAINS]
const selectedChainIds = ref(new Set())

function toggleChain(id) {
  const next = new Set(selectedChainIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedChainIds.value = next
}

function toggleCharacter(charId) {
  const char = CHARACTERS.find(c => c.id === charId)
  if (!char) return
  const allSelected = char.chains.every(c => selectedChainIds.value.has(c.id))
  const next = new Set(selectedChainIds.value)
  if (allSelected) {
    char.chains.forEach(c => next.delete(c.id))
  } else {
    char.chains.forEach(c => next.add(c.id))
  }
  selectedChainIds.value = next
}

function charFullySelected(charId) {
  const char = CHARACTERS.find(c => c.id === charId)
  return char?.chains.every(c => selectedChainIds.value.has(c.id))
}

function countPaths(chain) {
  return generateAllPaths(chain.root).length
}

// ─── Drill state ─────────────────────────────
// Flat list of all paths (DFS) to visit
const allPaths = ref([])
const pathIndex = ref(0)
const stepIndex = ref(0)

// Within current step
const feedbackState = ref(null)
const buttonStates = ref({})
const isTransitioning = ref(false)

// Stats
const totalAnswers = ref(0)
const correctAnswers = ref(0)

const pendingTimeouts = []
function scheduleTimeout(fn, delay) {
  const id = setTimeout(fn, delay)
  pendingTimeouts.push(id)
}
function clearAllTimeouts() {
  pendingTimeouts.forEach(id => clearTimeout(id))
  pendingTimeouts.length = 0
}

// Timing: advance 2s after video ends (or 2s after answer if video already done)
let nodeStartTime = 0
let videoDurationMs = 0

function onVideoMeta(event) {
  videoDurationMs = (event.target?.duration ?? 0) * 1000
}

function resetForNewNode() {
  nodeStartTime = Date.now()
  videoDurationMs = 0
  feedbackState.value = null
  isTransitioning.value = false
  resetButtonStates()
}

// Current node
const currentNode = computed(() => {
  const path = allPaths.value[pathIndex.value]
  if (!path) return null
  return path[stepIndex.value] ?? null
})

// Breadcrumb of current path
const breadcrumb = computed(() => {
  const path = allPaths.value[pathIndex.value]
  if (!path) return []
  return path.slice(0, stepIndex.value + 1).map(n => n.name)
})

// Which chain does this path belong to
const currentChainName = computed(() => {
  const path = allPaths.value[pathIndex.value]
  if (!path) return ''
  const rootId = path[0].id
  const chain = allChains.find(c => c.root.id === rootId)
  if (!chain) return ''
  const char = CHARACTERS.find(ch => ch.chains.includes(chain))
  return char ? `${char.emoji} ${char.label} — ${chain.name}` : chain.name
})

// Progress across all paths
const totalPaths = computed(() => allPaths.value.length)
const completedPaths = computed(() => pathIndex.value)

// ─── Reset button states ──────────────────────
function resetButtonStates() {
  const s = {}
  BREAK_OPTIONS.forEach(o => s[o.id] = 'idle')
  buttonStates.value = s
}

// ─── Launch drill ─────────────────────────────
function startDrill() {
  const paths = []
  for (const chain of allChains) {
    if (!selectedChainIds.value.has(chain.id)) continue
    paths.push(...generateAllPaths(chain.root))
  }
  allPaths.value = paths
  pathIndex.value = 0
  stepIndex.value = 0
  totalAnswers.value = 0
  correctAnswers.value = 0
  phase.value = 'drill'
  resetForNewNode()
}

// ─── Answer ───────────────────────────────────
function handleAnswer(answerId) {
  if (feedbackState.value || isTransitioning.value || !currentNode.value) return
  totalAnswers.value++

  const node = currentNode.value
  const correct = node.breakInput
  const isCorrect = isCorrectBreak(answerId, correct)
  if (isCorrect) correctAnswers.value++

  feedbackState.value = { userAnswer: answerId, correctAnswer: correct, isCorrect }

  const newStates = {}
  BREAK_OPTIONS.forEach(o => newStates[o.id] = 'idle')
  if (isCorrect) {
    newStates[answerId] = 'correct'
  } else {
    newStates[answerId] = 'wrong'
    if (correct === '1or2') { newStates['1'] = 'highlight'; newStates['2'] = 'highlight' }
    else if (correct) newStates[correct] = 'highlight'
  }
  buttonStates.value = newStates

  isTransitioning.value = true
  const elapsed = Date.now() - nodeStartTime
  const remainingVideo = Math.max(0, videoDurationMs - elapsed)
  scheduleTimeout(() => advance(), remainingVideo + 2000)
}

function advance() {
  const path = allPaths.value[pathIndex.value]
  if (!path) return

  if (stepIndex.value < path.length - 1) {
    stepIndex.value++
    resetForNewNode()
    scheduleTimeout(() => { isTransitioning.value = false }, 400)
    return
  }

  if (pathIndex.value < allPaths.value.length - 1) {
    pathIndex.value++
    stepIndex.value = 0
    resetForNewNode()
    scheduleTimeout(() => { isTransitioning.value = false }, 400)
    return
  }

  phase.value = 'finished'
  isTransitioning.value = false
}

// ─── Key handler ──────────────────────────────
useKeyHandler(
  'throw',
  (answerId) => handleAnswer(answerId),
  () => !!(feedbackState.value || isTransitioning.value || phase.value !== 'drill')
)

onUnmounted(() => {
  clearAllTimeouts()
})

// ─── UI helpers ───────────────────────────────
function btnClass(id) {
  const s = buttonStates.value[id] || 'idle'
  if (s === 'correct') return 'bg-green-600 border-green-400 text-white scale-105'
  if (s === 'wrong') return 'bg-red-700 border-red-500 text-white'
  if (s === 'highlight') return 'bg-yellow-500 border-yellow-300 text-black scale-105'
  return 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:border-gray-400'
}

const breakExplanation = computed(() => {
  if (!feedbackState.value) return ''
  const c = feedbackState.value.correctAnswer
  if (c === 'none') return 'Cette chope est incassable'
  if (c === '1or2') return 'Casser avec 1 ou 2 (au choix)'
  if (c === '3+4') return 'Casser avec 3+4 (fenêtre spéciale)'
  return `Casser avec : ${c}`
})

function restart() {
  phase.value = 'setup'
  clearAllTimeouts()
  clearUnlockTimeout()
}
</script>

<template>
  <!-- ═══════════════ SETUP ═══════════════ -->
  <div v-if="phase === 'setup'" class="max-w-3xl mx-auto px-6 py-10">
    <div class="flex items-center gap-3 mb-2">
      <router-link to="/" class="text-gray-400 hover:text-white text-sm">← Accueil</router-link>
    </div>
    <h1 class="text-4xl font-bold text-white mb-1">Chain Throw Drill</h1>
    <p class="text-gray-400 mb-8 text-sm">Mode exploration DFS : toutes les branches seront visitées dans l'ordre.</p>

    <!-- Character sections -->
    <div v-for="char in CHARACTERS" :key="char.id" class="mb-8">
      <!-- Character header -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-2xl">{{ char.emoji }}</span>
          <h2 class="text-lg font-bold text-white">{{ char.label }}</h2>
        </div>
        <button
          @click="toggleCharacter(char.id)"
          :class="[
            'text-xs px-3 py-1 rounded-lg border font-medium transition-colors',
            charFullySelected(char.id)
              ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10'
              : 'border-gray-600 text-gray-400 hover:border-gray-400'
          ]"
        >
          {{ charFullySelected(char.id) ? 'Tout déselectionner' : 'Tout sélectionner' }}
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          v-for="chain in char.chains"
          :key="chain.id"
          @click="toggleChain(chain.id)"
          :class="[
            'border rounded-xl p-4 text-left transition-all relative',
            selectedChainIds.has(chain.id)
              ? 'bg-yellow-400/10 border-yellow-400'
              : 'bg-gray-900 border-gray-700 hover:border-gray-500'
          ]"
        >
          <div v-if="selectedChainIds.has(chain.id)" class="absolute top-3 right-3 text-yellow-400 text-sm">✓</div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-2xl">{{ chain.emoji }}</span>
            <span class="font-bold text-white">{{ chain.name }}</span>
          </div>
          <div class="text-xs text-gray-500 mb-2">{{ chain.description }}</div>
          <div class="text-xs text-gray-600">{{ countPaths(chain) }} chemin{{ countPaths(chain) > 1 ? 's' : '' }} à explorer</div>
        </button>
      </div>
    </div>

    <div class="flex justify-end">
      <button
        @click="startDrill"
        :disabled="selectedChainIds.size === 0"
        class="px-8 py-3 rounded-xl font-bold text-lg bg-yellow-400 hover:bg-yellow-300 text-black transition-all"
      >
        Commencer le Drill
      </button>
    </div>
  </div>

  <!-- ═══════════════ DRILL ════════════════ -->
  <div v-else-if="phase === 'drill'" class="max-w-xl mx-auto px-4 py-5">
    <!-- Top bar -->
    <div class="flex items-center justify-between mb-2">
      <div>
        <span class="text-yellow-400 text-sm font-bold">{{ currentChainName }}</span>
        <span class="text-gray-500 text-xs ml-2">Chemin {{ completedPaths + 1 }}/{{ totalPaths }}</span>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-white text-sm font-bold">{{ correctAnswers }}/{{ totalAnswers }}</span>
        <button @click="restart" class="text-xs text-gray-500 hover:text-white">✕ Quitter</button>
      </div>
    </div>

    <!-- Overall progress bar -->
    <div class="w-full h-1 bg-gray-800 rounded mb-2">
      <div class="h-full bg-yellow-400/60 rounded transition-all"
        :style="{ width: `${(completedPaths / totalPaths) * 100}%` }" />
    </div>

    <!-- Breadcrumb (path progress) -->
    <div class="flex items-center gap-1 flex-wrap mb-3">
      <span v-for="(name, i) in breadcrumb" :key="i" class="inline-flex items-center gap-1">
        <span :class="['text-xs px-2 py-0.5 rounded', i === breadcrumb.length - 1 ? 'bg-yellow-400/20 text-yellow-400 font-semibold' : 'bg-gray-800 text-gray-500']">{{ name }}</span>
        <span v-if="i < breadcrumb.length - 1" class="text-gray-600 text-xs">→</span>
      </span>
    </div>

    <div class="h-1.5 w-full mb-4" />

    <!-- Throw card -->
    <div v-if="currentNode" class="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-4">
      <div class="flex items-center gap-3 mb-3 flex-wrap">
        <h2 class="text-lg font-bold text-white">{{ currentNode.name }}</h2>
        <span class="font-mono text-blue-300 bg-blue-900/40 px-2 py-0.5 rounded text-xs">{{ currentNode.input }}</span>
        <span class="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded font-semibold">Chain Throw</span>
      </div>

      <!-- Video -->
      <div class="w-full aspect-video bg-black rounded-lg overflow-hidden mb-3">
        <video
          v-if="currentNode.videoUrl"
          :src="currentNode.videoUrl"
          :key="currentNode.id"
          autoplay muted playsinline
          class="w-full h-full object-contain"
          @loadedmetadata="onVideoMeta"
        />
        <div v-else class="w-full h-full flex items-center justify-center text-gray-600 text-sm">No video</div>
      </div>

      <!-- Feedback -->
      <div v-if="feedbackState" class="rounded-lg overflow-hidden"
        :class="feedbackState.isCorrect ? 'bg-green-900/30' : 'bg-red-900/30'"
      >
        <div class="text-center py-2 font-bold"
          :class="feedbackState.isCorrect ? 'text-green-400' : 'text-red-400'"
        >
          <span v-if="feedbackState.isCorrect">✓ Correct !</span>
          <span v-else>✗ Raté</span>
          <span class="text-gray-400 font-normal text-xs ml-2">
            (la chaîne continue)
          </span>
        </div>
        <div class="border-t border-white/10 px-4 py-2 text-xs text-center text-gray-300">
          {{ breakExplanation }}
        </div>
      </div>
    </div>

    <!-- Question -->
    <p class="text-center text-gray-400 text-sm mb-3">Comment tu casses ce throw ?</p>

    <!-- Buttons -->
    <div class="grid grid-cols-3 gap-2">
      <button
        v-for="opt in BREAK_OPTIONS"
        :key="opt.id"
        @click="handleAnswer(opt.id)"
        :disabled="!!feedbackState || isTransitioning"
        :class="[
          'border-2 rounded-xl py-3 font-bold text-lg transition-all duration-150',
          btnClass(opt.id),
          (!!feedbackState || isTransitioning) ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
        ]"
      >
        {{ opt.label }}
        <div class="text-xs font-normal opacity-60 mt-0.5">[{{ opt.key }}]</div>
      </button>
    </div>

    <p class="text-center text-gray-600 text-xs mt-3">Touches 1–5 • La chaîne continue même si tu rates</p>
  </div>

  <!-- ═══════════════ FINISHED ══════════════ -->
  <div v-else class="max-w-xl mx-auto px-4 py-16 text-center">
    <div class="text-6xl mb-4">🏆</div>
    <h2 class="text-3xl font-bold text-white mb-2">Exploration complète !</h2>
    <p class="text-gray-400 mb-2">Tu as parcouru toutes les branches.</p>
    <p class="text-2xl font-bold text-yellow-400 mb-8">
      {{ correctAnswers }} / {{ totalAnswers }}
      <span class="text-sm text-gray-500 font-normal">breaks corrects</span>
    </p>
    <div class="flex gap-4 justify-center">
      <button @click="restart" class="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold">
        ← Retour
      </button>
      <button @click="startDrill" class="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl font-bold">
        Rejouer
      </button>
    </div>
  </div>
</template>
