<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCharactersStore } from '../stores/characters'
import { useKeybindingsStore } from '../stores/keybindings'
import { buildThrowChains, pickRandomMove, getNextStance } from '../utils/throwChainBuilder'
import { parseThrowBreak, isThrowBreakCorrect } from '../utils/frameParser'
import { useKeyHandler } from '../composables/useKeyHandler'
import TimerBar from '../components/TimerBar.vue'

const keybindingsStore = useKeybindingsStore()
keybindingsStore.load()

const router = useRouter()
const charStore = useCharactersStore()

// Load config
const config = JSON.parse(sessionStorage.getItem('chainDrillConfig') || 'null')
if (!config) router.replace('/chain-throw-setup')

onMounted(() => {
  if (charStore.characters.length === 0) charStore.loadCharacters()
})

const char = computed(() => charStore.characters.find(c => c.id === config?.charId))

const allChains = computed(() => {
  if (!char.value) return []
  return buildThrowChains(char.value.moves).chains
})

const selectedChains = computed(() =>
  allChains.value.filter(c => config?.chainIds.includes(c.id))
)

// --- Drill state ---
const BREAK_OPTIONS = [
  { id: '1',    label: '1',          key: '1' },
  { id: '2',    label: '2',          key: '2' },
  { id: '1+2',  label: '1+2',        key: '3' },
  { id: '1or2', label: '1 ou 2',     key: '4' },
  { id: 'none', label: '✗ Incassable', key: '5' },
]

const totalRounds = ref(0)
const correctBreaks = ref(0)
const chainResults = ref([]) // { chainName, steps: [{move, userAnswer, correct}] }

// Current chain session
const currentChain = ref(null)
const currentStance = ref(null)
const currentMove = ref(null)
const chainSteps = ref([]) // steps so far in current chain
const chainName = ref('')

const feedbackState = ref(null)
const buttonStates = ref({})
const isTransitioning = ref(false)
const timerProgress = ref(1)
const drillFinished = ref(false)

let timerInterval = null
const pendingTimeouts = []
function scheduleTimeout(fn, delay) {
  const id = setTimeout(fn, delay)
  pendingTimeouts.push(id)
}
function clearAllTimeouts() {
  pendingTimeouts.forEach(id => clearTimeout(id))
  pendingTimeouts.length = 0
}
function stopTimer() { clearInterval(timerInterval) }

function startTimer() {
  timerProgress.value = 1
  clearInterval(timerInterval)
  const start = Date.now()
  const duration = config?.timerDuration ?? 8
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - start) / 1000
    timerProgress.value = Math.max(0, 1 - elapsed / duration)
    if (timerProgress.value <= 0) {
      clearInterval(timerInterval)
      handleTimeout()
    }
  }, 50)
}

function resetButtonStates() {
  const s = {}
  BREAK_OPTIONS.forEach(o => s[o.id] = 'idle')
  buttonStates.value = s
}

const videoReady = ref(false)

function onVideoReady() {
  if (!videoReady.value) {
    videoReady.value = true
    startTimer()
  }
}

// Pick a random chain and start it
function startNextChain() {
  if (selectedChains.value.length === 0) { drillFinished.value = true; return }
  const chain = selectedChains.value[Math.floor(Math.random() * selectedChains.value.length)]
  currentChain.value = chain
  chainName.value = chain.name
  chainSteps.value = []

  const move = pickRandomMove(chain.nodeMap, chain.rootStance)
  if (!move) { startNextChain(); return }

  currentStance.value = chain.rootStance
  currentMove.value = { ...move, _charName: config?.charName }
  videoReady.value = !currentMove.value?.video_url
  feedbackState.value = null
  resetButtonStates()
  if (!currentMove.value?.video_url) startTimer()
}

function handleAnswer(answerId) {
  if (feedbackState.value || isTransitioning.value) return
  stopTimer()
  totalRounds.value++

  const move = currentMove.value
  const correct = parseThrowBreak(move.notes)
  const isCorrect = isThrowBreakCorrect(answerId, correct)

  if (isCorrect) correctBreaks.value++

  feedbackState.value = { userAnswer: answerId, correctAnswer: correct, timeout: false, isCorrect }

  const newStates = {}
  BREAK_OPTIONS.forEach(o => newStates[o.id] = 'idle')
  if (isCorrect) {
    newStates[answerId] = 'correct'
  } else {
    newStates[answerId] = 'wrong'
    if (correct === '1or2') { newStates['1'] = 'highlight'; newStates['2'] = 'highlight'; newStates['1or2'] = 'highlight' }
    else if (correct) newStates[correct] = 'highlight'
  }
  buttonStates.value = newStates

  chainSteps.value.push({ move, userAnswer: answerId, correctAnswer: correct, correct: isCorrect })

  isTransitioning.value = true
  scheduleTimeout(() => advance(isCorrect), isCorrect ? 1200 : 2000)
}

function handleTimeout() {
  if (feedbackState.value || isTransitioning.value) return
  stopTimer()
  totalRounds.value++

  const move = currentMove.value
  const correct = parseThrowBreak(move.notes)

  feedbackState.value = { userAnswer: null, correctAnswer: correct, timeout: true, isCorrect: false }
  const newStates = {}
  BREAK_OPTIONS.forEach(o => newStates[o.id] = 'idle')
  if (correct) newStates[correct] = 'highlight'
  buttonStates.value = newStates

  chainSteps.value.push({ move, userAnswer: null, correctAnswer: correct, correct: false })

  isTransitioning.value = true
  scheduleTimeout(() => advance(false), 2000)
}

function advance(broke) {
  const chain = currentChain.value
  if (!chain) return

  if (broke) {
    // Chain broken! Save result, start new chain after delay
    chainResults.value.push({ chainName: chainName.value, steps: [...chainSteps.value] })
    feedbackState.value = null
    isTransitioning.value = false
    resetButtonStates()
    scheduleTimeout(() => startNextChain(), 500)
    return
  }

  // Find next throw in chain
  const nextStance = getNextStance(currentMove.value, chain.nodeMap)

  if (!nextStance) {
    // End of chain (leaf node, opponent couldn't break)
    chainResults.value.push({ chainName: chainName.value, steps: [...chainSteps.value] })
    feedbackState.value = null
    isTransitioning.value = false
    resetButtonStates()
    scheduleTimeout(() => startNextChain(), 500)
    return
  }

  // Pick random next move from next stance
  const nextMove = pickRandomMove(chain.nodeMap, nextStance)
  if (!nextMove) {
    chainResults.value.push({ chainName: chainName.value, steps: [...chainSteps.value] })
    feedbackState.value = null
    isTransitioning.value = false
    resetButtonStates()
    scheduleTimeout(() => startNextChain(), 500)
    return
  }

  feedbackState.value = null
  currentStance.value = nextStance
  currentMove.value = { ...nextMove, _charName: config?.charName }
  videoReady.value = !currentMove.value?.video_url
  resetButtonStates()
  if (!currentMove.value?.video_url) startTimer()
  scheduleTimeout(() => { isTransitioning.value = false }, 400)
}

useKeyHandler(
  'throw',
  (answerId) => handleAnswer(answerId),
  () => !!(feedbackState.value || isTransitioning.value)
)

function btnClass(id) {
  const s = buttonStates.value[id] || 'idle'
  if (s === 'correct') return 'bg-green-600 border-green-400 text-white scale-105'
  if (s === 'wrong') return 'bg-red-700 border-red-500 text-white'
  if (s === 'highlight') return 'bg-yellow-500 border-yellow-300 text-black scale-105'
  return 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:border-gray-400'
}

const breakLabel = computed(() => {
  if (!feedbackState.value) return ''
  const c = feedbackState.value.correctAnswer
  if (!c) return ''
  if (c === 'none') return 'Incassable — throw de côté ou de dos'
  if (c === '1or2') return 'Casser avec : 1 ou 2'
  return `Casser avec : ${c}`
})

const chainDepthLabel = computed(() => {
  if (!currentChain.value || !currentStance.value) return ''
  const steps = chainSteps.value.length + 1
  return `Étape ${steps}`
})

onMounted(() => {
  resetButtonStates()
  scheduleTimeout(() => startNextChain(), 300)
})

onUnmounted(() => {
  stopTimer()
  clearAllTimeouts()
})
</script>

<template>
  <div class="max-w-xl mx-auto px-4 py-6" v-if="currentMove && !drillFinished">
    <!-- Header -->
    <div class="flex items-center justify-between mb-2">
      <div>
        <span class="text-yellow-400 text-sm font-semibold">{{ chainName }}</span>
        <span class="text-gray-500 text-xs ml-2">{{ chainDepthLabel }}</span>
      </div>
      <span class="text-white font-bold text-sm">{{ correctBreaks }}/{{ totalRounds }} cassés</span>
    </div>

    <!-- Chain step indicators -->
    <div class="flex items-center gap-1.5 mb-3">
      <div
        v-for="(step, i) in chainSteps"
        :key="i"
        :class="['h-2 w-6 rounded-full', step.correct ? 'bg-green-500' : 'bg-red-500']"
        :title="step.move.name"
      />
      <div class="h-2 w-6 rounded-full bg-yellow-400 animate-pulse" />
    </div>

    <div v-if="!videoReady" class="h-1.5 w-full bg-gray-800 rounded mb-4 overflow-hidden">
      <div class="h-full bg-blue-500 rounded animate-pulse w-full" />
    </div>
    <TimerBar v-else :progress="timerProgress" class="mb-4" />

    <div v-if="feedbackState?.timeout" class="text-center text-red-400 font-bold mb-2">
      ⏱ Temps écoulé !
    </div>

    <!-- Throw card -->
    <div class="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-5">
      <div class="flex items-center gap-3 mb-3 flex-wrap">
        <h2 class="text-xl font-bold text-white">{{ currentMove.name || currentMove.command }}</h2>
        <span v-if="currentMove._charName" class="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">{{ currentMove._charName }}</span>
        <span class="font-mono text-blue-300 bg-blue-900/40 px-2 py-0.5 rounded text-sm">{{ currentMove.command }}</span>
        <span class="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded font-semibold">Throw</span>
      </div>

      <div class="w-full aspect-video bg-black rounded-lg overflow-hidden mb-3">
        <video
          v-if="currentMove.video_url"
          :src="currentMove.video_url"
          :key="currentMove.video_url"
          autoplay loop muted playsinline
          class="w-full h-full object-contain"
          @canplay="onVideoReady"
        />
        <div v-else class="w-full h-full flex items-center justify-center text-gray-600 text-sm">No video</div>
      </div>

      <!-- Feedback -->
      <div v-if="feedbackState" class="rounded-lg overflow-hidden"
        :class="feedbackState.isCorrect ? 'bg-green-900/30' : 'bg-red-900/30'"
      >
        <div class="text-center py-2 font-bold text-lg"
          :class="feedbackState.isCorrect ? 'text-green-400' : 'text-red-400'"
        >
          <span v-if="feedbackState.isCorrect">✓ Cassé ! Prochaine chaîne...</span>
          <span v-else-if="feedbackState.timeout">Chaîne continue...</span>
          <span v-else>✗ Raté — la chaîne continue !</span>
        </div>
        <div v-if="breakLabel" class="border-t border-white/10 px-4 py-2 text-sm text-center text-gray-300">
          {{ breakLabel }}
        </div>
      </div>
    </div>

    <p class="text-center text-gray-400 text-sm mb-4">Comment tu casses ce throw ?</p>

    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <button
        v-for="opt in BREAK_OPTIONS"
        :key="opt.id"
        @click="handleAnswer(opt.id)"
        :disabled="!!feedbackState || isTransitioning"
        :class="['border-2 rounded-xl py-4 font-bold text-xl transition-all duration-150', btnClass(opt.id), (!!feedbackState || isTransitioning) ? 'cursor-not-allowed opacity-70' : 'cursor-pointer']"
      >
        {{ opt.label }}
        <div class="text-xs font-normal opacity-60 mt-0.5">[{{ opt.key }}]</div>
      </button>
    </div>

    <p class="text-center text-gray-600 text-xs mt-4">Touches 1–5 • Si tu rates, la chaîne continue</p>
  </div>

  <!-- Results summary -->
  <div v-else-if="drillFinished" class="max-w-2xl mx-auto px-4 py-12">
    <h2 class="text-3xl font-bold text-center text-white mb-2">Drill terminé</h2>
    <p class="text-center text-gray-400 mb-8">{{ correctBreaks }} / {{ totalRounds }} throws cassés</p>
    <div class="flex gap-4 justify-center">
      <button @click="router.push('/chain-throw-setup')" class="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold">
        ← Retour
      </button>
      <button @click="() => { chainResults = []; totalRounds = 0; correctBreaks = 0; drillFinished = false; startNextChain() }" class="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-black rounded-xl font-bold">
        Rejouer
      </button>
    </div>
  </div>

  <div v-else class="text-center py-20 text-gray-500">
    <p>Chargement...</p>
  </div>
</template>
