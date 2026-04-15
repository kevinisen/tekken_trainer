<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDrillStore } from '../stores/drill'
import { useKeybindingsStore } from '../stores/keybindings'
import { useKeyHandler } from '../composables/useKeyHandler'
import { ANSWER_OPTIONS, parseBlockFrame } from '../utils/frameParser'
import VideoPlayer from '../components/VideoPlayer.vue'
import AnswerButton from '../components/AnswerButton.vue'

const router = useRouter()
const drillStore = useDrillStore()
const keybindingsStore = useKeybindingsStore()
keybindingsStore.load()

function keyHintFor(answerId) {
  const bindings = keybindingsStore.activeProfile?.frameDrill
  if (!bindings) return null
  const slots = bindings[answerId]
  const slot = slots?.find(s => s && s.length > 0)
  return slot ? slot.map(k => k.toUpperCase()).join('+') : null
}

if (drillStore.answers.length === 0) {
  router.replace('/')
}

const total = computed(() => drillStore.answers.length)
const correct = computed(() => drillStore.score)
const percentage = computed(() => total.value > 0 ? Math.round((correct.value / total.value) * 100) : 0)
const mistakes = computed(() => drillStore.answers.filter(a => !a.correct))

const gradeColor = computed(() => {
  if (percentage.value >= 80) return 'text-green-400'
  if (percentage.value >= 60) return 'text-yellow-400'
  return 'text-red-400'
})

function retryMistakes() {
  const movesToRetry = mistakes.value.map(a => a.move)
  drillStore.setupDrill(movesToRetry, drillStore.timerDuration, drillStore.characterId)
  router.push('/drill')
}

function newDrill() {
  router.push(drillStore.characterId ? `/character/${drillStore.characterId}` : '/')
}

function answerLabel(ans) {
  if (ans === null) return '⏱ Timeout'
  return ans
}

// ─── Focus drill (5x repeat) ─────────────────────────────
const FOCUS_REPS = 5
const focusMove = ref(null)
const focusRep = ref(0)          // 0-based, current rep
const focusResults = ref([])     // true/false per rep
const focusFeedback = ref(null)  // { isCorrect, correctAnswer }
const focusButtonStates = ref({})
const focusTransitioning = ref(false)

const pendingTimeouts = []
function scheduleTimeout(fn, delay) {
  const id = setTimeout(fn, delay)
  pendingTimeouts.push(id)
}
function clearAllTimeouts() {
  pendingTimeouts.forEach(id => clearTimeout(id))
  pendingTimeouts.length = 0
}

function resetFocusButtons() {
  const s = {}
  ANSWER_OPTIONS.forEach(o => s[o.id] = 'idle')
  focusButtonStates.value = s
}

function startFocus(move) {
  focusMove.value = move
  focusRep.value = 0
  focusResults.value = []
  focusFeedback.value = null
  focusTransitioning.value = false
  resetFocusButtons()
}

function exitFocus() {
  clearAllTimeouts()
  focusMove.value = null
}

function focusAnswer(answerId) {
  if (focusFeedback.value || focusTransitioning.value || !focusMove.value) return

  const correct = parseBlockFrame(focusMove.value.block)
  const isCorrect = answerId === correct

  focusResults.value.push(isCorrect)
  focusFeedback.value = { isCorrect, correctAnswer: correct, userAnswer: answerId }

  const newStates = {}
  ANSWER_OPTIONS.forEach(o => newStates[o.id] = 'idle')
  if (isCorrect) {
    newStates[answerId] = 'correct'
  } else {
    newStates[answerId] = 'wrong'
    if (correct) newStates[correct] = 'highlight'
  }
  focusButtonStates.value = newStates

  focusTransitioning.value = true
  scheduleTimeout(() => {
    if (focusRep.value < FOCUS_REPS - 1) {
      focusRep.value++
      focusFeedback.value = null
      focusTransitioning.value = false
      resetFocusButtons()
    } else {
      // Done — stay on summary, don't auto-exit
      focusTransitioning.value = false
    }
  }, isCorrect ? 1200 : 2200)
}

const focusDone = computed(() => focusResults.value.length === FOCUS_REPS)

useKeyHandler(
  'frame',
  (answerId) => focusAnswer(answerId),
  () => !focusMove.value || focusDone.value || !!(focusFeedback.value || focusTransitioning.value)
)

onUnmounted(() => clearAllTimeouts())
</script>

<template>
  <!-- ══════════ FOCUS DRILL ══════════ -->
  <div v-if="focusMove" class="max-w-xl mx-auto px-4 py-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <span class="text-yellow-400 font-bold text-sm">Focus drill</span>
        <span class="text-gray-500 text-xs ml-2">{{ focusMove.name }}</span>
      </div>
      <button @click="exitFocus" class="text-xs text-gray-500 hover:text-white">✕ Quitter</button>
    </div>

    <!-- Rep dots -->
    <div class="flex items-center justify-center gap-2 mb-5">
      <div
        v-for="n in FOCUS_REPS" :key="n"
        :class="[
          'w-4 h-4 rounded-full border-2 transition-all',
          n - 1 < focusResults.length
            ? (focusResults[n-1] ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400')
            : n - 1 === focusRep && !focusDone ? 'border-yellow-400 bg-yellow-400/20' : 'border-gray-700 bg-gray-900'
        ]"
      />
    </div>

    <!-- Move card -->
    <div class="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-4">
      <div class="flex items-center justify-between gap-2 mb-3">
        <span class="text-sm text-gray-400">{{ focusMove.name || '—' }}</span>
        <span class="font-mono text-3xl font-bold text-blue-300">{{ focusMove.command }}</span>
        <div class="flex flex-col items-end gap-1">
          <span class="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded font-mono">{{ focusMove.hitLevel }}</span>
          <span class="font-mono text-2xl font-bold text-green-400">{{ focusMove.hit }}</span>
        </div>
      </div>

      <VideoPlayer :src="focusMove.video_url" />

      <!-- Feedback -->
      <div v-if="focusFeedback" class="mt-3 rounded-lg overflow-hidden"
        :class="focusFeedback.isCorrect ? 'bg-green-900/30' : 'bg-red-900/30'"
      >
        <div class="text-center py-2">
          <span class="font-bold" :class="focusFeedback.isCorrect ? 'text-green-400' : 'text-red-400'">
            {{ focusFeedback.isCorrect ? '✓ Correct !' : '✗ Raté' }}
          </span>
          <span class="text-gray-400 text-sm ml-2">Block: </span>
          <span class="font-mono font-bold text-yellow-400">{{ focusMove.block }}</span>
          <span class="text-gray-500 text-sm ml-1">→ {{ focusFeedback.correctAnswer }}</span>
        </div>
      </div>

      <!-- Done summary -->
      <div v-if="focusDone && !focusFeedback?.isCorrect === false || focusDone" class="mt-3 text-center">
        <p class="text-white font-bold text-lg mb-1">
          {{ focusResults.filter(Boolean).length }} / {{ FOCUS_REPS }}
          <span class="text-gray-400 font-normal text-sm">corrects</span>
        </p>
        <button @click="exitFocus" class="mt-2 px-5 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl text-sm">
          ← Retour aux erreurs
        </button>
      </div>
    </div>

    <!-- Answer buttons -->
    <div v-if="!focusDone" class="grid grid-cols-4 gap-2 sm:grid-cols-7">
      <AnswerButton
        v-for="opt in ANSWER_OPTIONS"
        :key="opt.id"
        :option="opt"
        :state="focusButtonStates[opt.id] || 'idle'"
        :disabled="!!focusFeedback || focusTransitioning"
        :key-hint="keyHintFor(opt.id)"
        @click="focusAnswer"
      />
    </div>
  </div>

  <!-- ══════════ RESULTS ══════════ -->
  <div v-else class="max-w-3xl mx-auto px-6 py-10">
    <!-- Score header -->
    <div class="text-center mb-10">
      <h1 class="text-4xl font-bold text-white mb-2">Drill Complete!</h1>
      <div :class="['text-7xl font-black my-4', gradeColor]">{{ percentage }}%</div>
      <p class="text-gray-400 text-xl">{{ correct }} / {{ total }} correct</p>
    </div>

    <!-- Action buttons -->
    <div class="flex gap-4 justify-center mb-10 flex-wrap">
      <button
        v-if="mistakes.length > 0"
        @click="retryMistakes"
        class="px-6 py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
      >
        Retry Mistakes ({{ mistakes.length }})
      </button>
      <button
        @click="newDrill"
        class="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl transition-colors"
      >
        New Drill
      </button>
      <router-link
        to="/"
        class="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors"
      >
        Home
      </router-link>
    </div>

    <!-- Mistakes list -->
    <div v-if="mistakes.length > 0">
      <h2 class="text-xl font-bold text-white mb-4">Mistakes ({{ mistakes.length }})</h2>
      <div class="space-y-4">
        <div
          v-for="(ans, i) in mistakes"
          :key="i"
          class="bg-gray-900 border border-red-900 rounded-xl p-4"
        >
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex items-center gap-3 flex-wrap">
              <span class="font-bold text-white">{{ ans.move.name || '—' }}</span>
              <span class="font-mono text-blue-300 bg-blue-900/40 px-2 py-0.5 rounded text-sm">{{ ans.move.command }}</span>
              <span class="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded font-mono">{{ ans.move.hitLevel }}</span>
            </div>
            <button
              @click="startFocus(ans.move)"
              class="shrink-0 px-3 py-1 bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/40 text-yellow-400 text-xs font-bold rounded-lg transition-colors"
            >
              ×5
            </button>
          </div>

          <div class="flex items-center gap-4 mb-3 text-sm">
            <div>
              <span class="text-gray-500">Your answer: </span>
              <span class="font-mono font-bold text-red-400">{{ answerLabel(ans.userAnswer) }}</span>
            </div>
            <div>
              <span class="text-gray-500">Correct: </span>
              <span class="font-mono font-bold text-green-400">{{ ans.correctAnswer }}</span>
            </div>
            <div>
              <span class="text-gray-500">Block: </span>
              <span class="font-mono text-yellow-400">{{ ans.move.block }}</span>
            </div>
          </div>

          <VideoPlayer :src="ans.move.video_url" />
        </div>
      </div>
    </div>

    <div v-else class="text-center py-8">
      <p class="text-green-400 text-2xl font-bold">Perfect! No mistakes! 🎉</p>
    </div>
  </div>
</template>
