<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDrillStore } from '../stores/drill'
import { useKeybindingsStore } from '../stores/keybindings'
import { parseThrowBreak, isThrowBreakCorrect } from '../utils/frameParser'
import { useKeyHandler } from '../composables/useKeyHandler'
import TimerBar from '../components/TimerBar.vue'

const keybindingsStore = useKeybindingsStore()
keybindingsStore.load()

const router = useRouter()
const drillStore = useDrillStore()

if (drillStore.drillMoves.length === 0) router.replace('/throw-setup')

const BREAK_OPTIONS = [
  { id: '1',    label: '1',         key: '1' },
  { id: '2',    label: '2',         key: '2' },
  { id: '1+2',  label: '1+2',       key: '3' },
  { id: '1or2', label: '1 ou 2',    key: '4' },
  { id: 'none', label: '✗ Impossible', key: '5' },
]

const timerProgress = ref(1)
const feedbackState = ref(null)
const buttonStates = ref({})
const isTransitioning = ref(false)

const displayMove = ref(drillStore.currentMove())

let timerInterval = null
let timerStart = null
const pendingTimeouts = []

function scheduleTimeout(fn, delay) {
  const id = setTimeout(fn, delay)
  pendingTimeouts.push(id)
}
function clearAllTimeouts() {
  pendingTimeouts.forEach(id => clearTimeout(id))
  pendingTimeouts.length = 0
}

function startTimer() {
  timerProgress.value = 1
  clearInterval(timerInterval)
  timerStart = Date.now()
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - timerStart) / 1000
    timerProgress.value = Math.max(0, 1 - elapsed / drillStore.timerDuration)
    if (timerProgress.value <= 0) {
      clearInterval(timerInterval)
      handleTimeout()
    }
  }, 50)
}

function stopTimer() { clearInterval(timerInterval) }

function resetButtonStates() {
  const s = {}
  BREAK_OPTIONS.forEach(o => s[o.id] = 'idle')
  buttonStates.value = s
}

function handleAnswer(answerId) {
  if (feedbackState.value || isTransitioning.value) return
  stopTimer()

  const move = drillStore.currentMove()
  const correct = parseThrowBreak(move.notes)
  const isCorrect = isThrowBreakCorrect(answerId, correct)
  drillStore.recordAnswer(answerId)

  feedbackState.value = { userAnswer: answerId, correctAnswer: correct, timeout: false }

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

  isTransitioning.value = true
  scheduleTimeout(() => nextMove(), isCorrect ? 1500 : 2500)
}

function handleTimeout() {
  if (feedbackState.value || isTransitioning.value) return
  const move = drillStore.currentMove()
  const correct = parseThrowBreak(move.notes)
  drillStore.recordTimeout()

  feedbackState.value = { userAnswer: null, correctAnswer: correct, timeout: true }
  const newStates = {}
  BREAK_OPTIONS.forEach(o => newStates[o.id] = 'idle')
  if (correct) newStates[correct] = 'highlight'
  buttonStates.value = newStates

  isTransitioning.value = true
  scheduleTimeout(() => nextMove(), 2500)
}

const videoReady = ref(!displayMove.value?.video_url)

function onVideoReady() {
  if (!videoReady.value) {
    videoReady.value = true
    startTimer()
  }
}

function nextMove() {
  if (drillStore.isFinished()) {
    drillStore.saveScore(drillStore.characterId)
    scheduleTimeout(() => router.push('/results'), 2500)
    return
  }
  feedbackState.value = null
  displayMove.value = drillStore.currentMove()
  videoReady.value = !displayMove.value?.video_url
  resetButtonStates()
  if (!displayMove.value?.video_url) startTimer()
  scheduleTimeout(() => { isTransitioning.value = false }, 500)
}

useKeyHandler(
  'throw',
  (answerId) => handleAnswer(answerId),
  () => !!(feedbackState.value || isTransitioning.value)
)

onMounted(() => {
  resetButtonStates()
  if (drillStore.drillMoves.length > 0 && !displayMove.value?.video_url) startTimer()
})

onUnmounted(() => {
  stopTimer()
  clearAllTimeouts()
})

const breakLabel = computed(() => {
  if (!feedbackState.value) return ''
  const c = feedbackState.value.correctAnswer
  if (c === 'none') return '✗ Impossible à casser — throw de côté ou de dos'
  if (c === '1or2') return 'Casser avec : 1 ou 2 (au choix)'
  return `Casser avec : ${c}`
})

function btnClass(id) {
  const s = buttonStates.value[id] || 'idle'
  if (s === 'correct') return 'bg-green-600 border-green-400 text-white scale-105'
  if (s === 'wrong') return 'bg-red-700 border-red-500 text-white'
  if (s === 'highlight') return 'bg-yellow-500 border-yellow-300 text-black scale-105'
  return 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:border-gray-400'
}
</script>

<template>
  <div class="max-w-xl mx-auto px-4 py-6" v-if="displayMove">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <span class="text-gray-400 text-sm font-mono">
        {{ drillStore.currentIndex + 1 }} / {{ drillStore.drillMoves.length }}
      </span>
      <span class="text-white font-bold">
        {{ drillStore.score }} / {{ drillStore.currentIndex }} correct
      </span>
    </div>

    <!-- Progress bar -->
    <div class="w-full h-1 bg-gray-800 rounded mb-2">
      <div class="h-full bg-blue-500 rounded transition-all"
        :style="{ width: `${(drillStore.currentIndex / drillStore.drillMoves.length) * 100}%` }"
      />
    </div>

    <div v-if="!videoReady" class="h-1.5 w-full bg-gray-800 rounded mb-4 overflow-hidden">
      <div class="h-full bg-blue-500 rounded animate-pulse w-full" />
    </div>
    <TimerBar v-else :progress="timerProgress" class="mb-4" />

    <div v-if="feedbackState?.timeout" class="text-center text-red-400 font-bold mb-2 text-lg">
      ⏱ Temps écoulé !
    </div>

    <!-- Throw card -->
    <div class="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-6">
      <div class="flex items-center gap-3 mb-3 flex-wrap">
        <h2 class="text-xl font-bold text-white">{{ displayMove.name || displayMove.command }}</h2>
        <span v-if="displayMove._charName" class="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">{{ displayMove._charName }}</span>
        <span class="font-mono text-blue-300 bg-blue-900/40 px-2 py-0.5 rounded text-sm">{{ displayMove.command }}</span>
        <span class="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded font-semibold">Throw</span>
      </div>

      <!-- Video -->
      <div class="w-full aspect-video bg-black rounded-lg overflow-hidden mb-3">
        <video
          v-if="displayMove.video_url"
          :src="displayMove.video_url"
          :key="displayMove.video_url"
          autoplay loop muted playsinline
          class="w-full h-full object-contain"
          @canplay="onVideoReady"
        />
        <div v-else class="w-full h-full flex items-center justify-center text-gray-600 text-sm">No video</div>
      </div>

      <!-- Feedback -->
      <div v-if="feedbackState" class="rounded-lg overflow-hidden"
        :class="feedbackState.userAnswer === feedbackState.correctAnswer ? 'bg-green-900/30' : 'bg-red-900/30'"
      >
        <div class="text-center py-2 font-bold text-lg"
          :class="feedbackState.userAnswer === feedbackState.correctAnswer ? 'text-green-400' : 'text-red-400'"
        >
          {{ feedbackState.userAnswer === feedbackState.correctAnswer ? '✓ Correct !' : '✗ Raté' }}
        </div>
        <div class="border-t border-white/10 px-4 py-2 text-sm text-center text-gray-300">
          {{ breakLabel }}
        </div>
      </div>
    </div>

    <!-- Question -->
    <p class="text-center text-gray-400 text-sm mb-4">Comment tu casses ce throw ?</p>

    <!-- Answer buttons -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <button
        v-for="opt in BREAK_OPTIONS"
        :key="opt.id"
        @click="handleAnswer(opt.id)"
        :disabled="!!feedbackState || isTransitioning"
        :class="['border-2 rounded-xl py-4 font-bold text-xl transition-all duration-150', btnClass(opt.id), (!!feedbackState || isTransitioning) ? 'cursor-not-allowed opacity-70' : 'cursor-pointer']"
      >
        {{ opt.label }}
        <div class="text-xs font-normal text-current opacity-60 mt-0.5">[{{ opt.key }}]</div>
      </button>
    </div>

    <p class="text-center text-gray-600 text-xs mt-4">Touches 1–5 pour répondre</p>
  </div>

  <div v-else class="text-center py-20 text-gray-500">
    <p class="mb-4">Drill non démarré.</p>
    <router-link to="/throw-setup" class="text-yellow-400 hover:underline">← Retour</router-link>
  </div>
</template>
