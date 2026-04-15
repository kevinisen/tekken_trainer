<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDrillStore } from '../stores/drill'
import { useKeybindingsStore } from '../stores/keybindings'
import { ANSWER_OPTIONS, parseBlockFrame } from '../utils/frameParser'
import { useKeyHandler } from '../composables/useKeyHandler'
import TimerBar from '../components/TimerBar.vue'
import VideoPlayer from '../components/VideoPlayer.vue'
import AnswerButton from '../components/AnswerButton.vue'

const keybindingsStore = useKeybindingsStore()
keybindingsStore.load()

function keyHintFor(answerId) {
  const bindings = keybindingsStore.activeProfile?.frameDrill
  if (!bindings) return null
  const slots = bindings[answerId]
  const slot = slots?.find(s => s && s.length > 0)
  return slot ? slot.map(k => k.toUpperCase()).join('+') : null
}

const router = useRouter()
const drillStore = useDrillStore()

if (drillStore.drillMoves.length === 0) {
  router.replace('/')
}

const timerProgress = ref(1)
const feedbackState = ref(null)
const buttonStates = ref({})
const isTransitioning = ref(false)
const displayIndex = ref(0)

let timerInterval = null
let timerStart = null
const pendingTimeouts = []

function scheduleTimeout(fn, delay) {
  const id = setTimeout(fn, delay)
  pendingTimeouts.push(id)
  return id
}

function clearAllTimeouts() {
  pendingTimeouts.forEach(id => clearTimeout(id))
  pendingTimeouts.length = 0
}

const currentMove = computed(() => drillStore.currentMove())
const displayMove = ref(drillStore.currentMove())

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

function stopTimer() {
  clearInterval(timerInterval)
}

function resetButtonStates() {
  const states = {}
  ANSWER_OPTIONS.forEach(o => states[o.id] = 'idle')
  buttonStates.value = states
}

function handleAnswer(answerId) {
  if (feedbackState.value || isTransitioning.value) return
  stopTimer()

  const move = currentMove.value
  const correctAns = parseBlockFrame(move.block)
  const isCorrect = answerId === correctAns
  drillStore.recordAnswer(answerId)

  feedbackState.value = { userAnswer: answerId, correctAnswer: correctAns, timeout: false }

  const newStates = {}
  ANSWER_OPTIONS.forEach(o => newStates[o.id] = 'idle')
  if (isCorrect) {
    newStates[answerId] = 'correct'
  } else {
    newStates[answerId] = 'wrong'
    if (correctAns) newStates[correctAns] = 'highlight'
  }
  buttonStates.value = newStates

  isTransitioning.value = true
  scheduleTimeout(() => nextMove(), isCorrect ? 1500 : 2500)
}

function handleTimeout() {
  if (feedbackState.value || isTransitioning.value) return

  const move = currentMove.value
  const correctAns = parseBlockFrame(move.block)
  drillStore.recordTimeout()

  feedbackState.value = { userAnswer: null, correctAnswer: correctAns, timeout: true }
  const newStates = {}
  ANSWER_OPTIONS.forEach(o => newStates[o.id] = 'idle')
  if (correctAns) newStates[correctAns] = 'highlight'
  buttonStates.value = newStates

  isTransitioning.value = true
  scheduleTimeout(() => nextMove(), 2500)
}

function nextMove() {
  if (drillStore.isFinished()) {
    drillStore.saveScore(drillStore.characterId)
    scheduleTimeout(() => router.push('/results'), 2500)
    return
  }

  feedbackState.value = null
  displayIndex.value = drillStore.currentIndex
  displayMove.value = drillStore.currentMove()
  videoReady.value = !displayMove.value?.video_url
  resetButtonStates()
  if (!displayMove.value?.video_url) startTimer()
  scheduleTimeout(() => { isTransitioning.value = false }, 500)
}

useKeyHandler(
  'frame',
  (answerId) => handleAnswer(answerId),
  () => !!(feedbackState.value || isTransitioning.value)
)

const videoReady = ref(!displayMove.value?.video_url)

function onVideoReady() {
  if (!videoReady.value) {
    videoReady.value = true
    startTimer()
  }
}

onMounted(() => {
  resetButtonStates()
  if (drillStore.drillMoves.length > 0 && !displayMove.value?.video_url) {
    startTimer()
  }
})

onUnmounted(() => {
  stopTimer()
  clearAllTimeouts()
})
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-6" v-if="displayMove">
    <!-- Header: progress + score -->
    <div class="flex items-center justify-between mb-3">
      <span class="text-gray-400 text-sm font-mono">
        {{ displayIndex + 1 }} / {{ drillStore.drillMoves.length }}
      </span>
      <span class="text-white font-bold">
        {{ drillStore.score }} / {{ displayIndex }} correct
      </span>
    </div>

    <!-- Move progress bar -->
    <div class="w-full h-1 bg-gray-800 rounded mb-2">
      <div
        class="h-full bg-blue-500 rounded transition-all"
        :style="{ width: `${(displayIndex / drillStore.drillMoves.length) * 100}%` }"
      />
    </div>

    <!-- Timer bar -->
    <div v-if="!videoReady" class="h-1.5 w-full bg-gray-800 rounded mb-4 overflow-hidden">
      <div class="h-full bg-blue-500 rounded animate-pulse w-full" />
    </div>
    <TimerBar v-else :progress="timerProgress" class="mb-4" />

    <!-- Timeout notice -->
    <div v-if="feedbackState?.timeout" class="text-center text-red-400 font-bold mb-2 text-lg">
      ⏱ Temps écoulé !
    </div>

    <!-- Move info card -->
    <div class="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-4">
      <div class="flex items-center justify-between gap-2 mb-3">
        <!-- Left: name -->
        <div class="flex flex-col min-w-0">
          <span class="text-sm text-gray-400 truncate">{{ displayMove.name || '—' }}</span>
          <span v-if="displayMove._charName" class="text-xs text-gray-600">{{ displayMove._charName }}</span>
        </div>
        <!-- Center: command (big) -->
        <div class="flex-1 text-center">
          <span class="font-mono text-3xl font-bold text-blue-300">{{ displayMove.command }}</span>
        </div>
        <!-- Right: hit level + on hit -->
        <div class="flex flex-col items-end gap-1 shrink-0">
          <span class="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded font-mono">{{ displayMove.hitLevel }}</span>
          <span class="font-mono text-2xl font-bold text-green-400">{{ displayMove.hit }}</span>
        </div>
      </div>

      <VideoPlayer :src="displayMove.video_url" :wait-for-load="true" @ready="onVideoReady" />

      <!-- Feedback overlay -->
      <div v-if="feedbackState" class="mt-3 rounded-lg overflow-hidden"
        :class="feedbackState.userAnswer === feedbackState.correctAnswer ? 'bg-green-900/30' : 'bg-red-900/30'"
      >
        <div class="text-center py-2">
          <span class="text-gray-300 text-sm">Block on frame: </span>
          <span class="font-mono font-bold text-xl" :class="feedbackState.userAnswer === feedbackState.correctAnswer ? 'text-green-400' : 'text-red-400'">
            {{ displayMove.block }}
          </span>
          <span class="text-gray-500 text-sm ml-2">→ {{ feedbackState.correctAnswer }}</span>
        </div>
        <div class="border-t border-white/10 px-4 py-2 text-xs text-gray-400 text-center">
          <span v-if="feedbackState.correctAnswer === 'safe'">
            <span class="text-green-400 font-semibold">Safe</span> — tu n'es pas punissable. L'adversaire ne peut pas te punir.
          </span>
          <span v-else-if="feedbackState.correctAnswer === '-10'">
            <span class="text-yellow-400 font-semibold">-10</span> — punissable par un jab i10 (ex: 1, 2).
          </span>
          <span v-else-if="feedbackState.correctAnswer === '-11'">
            <span class="text-yellow-400 font-semibold">-11</span> — punissable par les moves i11 de l'adversaire.
          </span>
          <span v-else-if="feedbackState.correctAnswer === '-12'">
            <span class="text-orange-400 font-semibold">-12</span> — punissable par les moves i12 (ex: certains df+1).
          </span>
          <span v-else-if="feedbackState.correctAnswer === '-13'">
            <span class="text-orange-400 font-semibold">-13</span> — punissable par les moves i13 de l'adversaire.
          </span>
          <span v-else-if="feedbackState.correctAnswer === '-14'">
            <span class="text-red-400 font-semibold">-14</span> — punissable par les moves i14 (ex: df+2 de la plupart des persos).
          </span>
          <span v-else-if="feedbackState.correctAnswer === '-15+'">
            <span class="text-red-500 font-semibold">-15+</span> — punissable par un launcher. L'adversaire peut faire un combo complet.
          </span>
        </div>
      </div>
    </div>

    <!-- Answer buttons -->
    <div class="grid grid-cols-4 gap-2 sm:grid-cols-7">
      <AnswerButton
        v-for="opt in ANSWER_OPTIONS"
        :key="opt.id"
        :option="opt"
        :state="buttonStates[opt.id] || 'idle'"
        :disabled="!!feedbackState || isTransitioning"
        :key-hint="keyHintFor(opt.id)"
        @click="handleAnswer"
      />
    </div>

    <p class="text-center text-gray-600 text-xs mt-3">Use keys 1–7 to answer quickly</p>
  </div>

  <div v-else class="text-center py-20 text-gray-500">
    <p class="mb-4">Drill not started or finished.</p>
    <router-link to="/" class="text-yellow-400 hover:underline">← Back to home</router-link>
  </div>
</template>
