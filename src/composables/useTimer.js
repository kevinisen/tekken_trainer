import { ref, onUnmounted } from 'vue'

export function useTimer(duration, onTick, onExpire) {
  const remaining = ref(duration)
  const progress = ref(1)
  let intervalId = null

  function start() {
    remaining.value = duration
    progress.value = 1
    clearInterval(intervalId)
    const startTime = Date.now()
    intervalId = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      remaining.value = Math.max(0, duration - elapsed)
      progress.value = remaining.value / duration
      if (onTick) onTick(remaining.value, progress.value)
      if (remaining.value <= 0) {
        clearInterval(intervalId)
        if (onExpire) onExpire()
      }
    }, 50)
  }

  function stop() {
    clearInterval(intervalId)
  }

  function reset() {
    stop()
    remaining.value = duration
    progress.value = 1
  }

  onUnmounted(() => clearInterval(intervalId))

  return { remaining, progress, start, stop, reset }
}
