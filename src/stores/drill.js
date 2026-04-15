import { defineStore } from 'pinia'
import { ref } from 'vue'
import { parseBlockFrame } from '../utils/frameParser'

export const useDrillStore = defineStore('drill', () => {
  const selectedMoves = ref([])
  const drillMoves = ref([])
  const currentIndex = ref(0)
  const score = ref(0)
  const answers = ref([])
  const timerDuration = ref(10)
  const characterId = ref(null)

  function setupDrill(moves, duration, charId) {
    const valid = moves.filter(m => parseBlockFrame(m.block) !== null)
    drillMoves.value = [...valid].sort(() => Math.random() - 0.5)
    currentIndex.value = 0
    score.value = 0
    answers.value = []
    timerDuration.value = duration
    characterId.value = charId
  }

  function recordAnswer(userAnswer) {
    const move = drillMoves.value[currentIndex.value]
    const correctAnswer = parseBlockFrame(move.block)
    const correct = userAnswer === correctAnswer
    if (correct) score.value++
    answers.value.push({ move, userAnswer, correctAnswer, correct })
    currentIndex.value++
  }

  function recordTimeout() {
    const move = drillMoves.value[currentIndex.value]
    const correctAnswer = parseBlockFrame(move.block)
    answers.value.push({ move, userAnswer: null, correctAnswer, correct: false })
    currentIndex.value++
  }

  function currentMove() {
    return drillMoves.value[currentIndex.value] || null
  }

  function isFinished() {
    return currentIndex.value >= drillMoves.value.length
  }

  function total() {
    return drillMoves.value.length
  }

  function saveScore(charId) {
    const key = `tekken-scores-${charId}`
    const existing = JSON.parse(localStorage.getItem(key) || '{}')
    for (const ans of answers.value) {
      const moveKey = ans.move.wavu_id || ans.move._id
      if (!existing[moveKey]) existing[moveKey] = { correct: 0, total: 0 }
      existing[moveKey].total++
      if (ans.correct) existing[moveKey].correct++
    }
    localStorage.setItem(key, JSON.stringify(existing))
  }

  function getScores(charId) {
    const key = `tekken-scores-${charId}`
    return JSON.parse(localStorage.getItem(key) || '{}')
  }

  return {
    selectedMoves,
    drillMoves,
    currentIndex,
    score,
    answers,
    timerDuration,
    characterId,
    setupDrill,
    recordAnswer,
    recordTimeout,
    currentMove,
    isFinished,
    total,
    saveScore,
    getScores,
  }
})
