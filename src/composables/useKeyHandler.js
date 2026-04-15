import { onMounted, onUnmounted } from 'vue'
import { useKeybindingsStore } from '../stores/keybindings'

/**
 * Handles key press detection with combo support.
 * @param {string} drillType - 'frame' or 'throw'
 * @param {function} onAnswer - called with answerId when a binding matches
 * @param {function} isBlocked - returns true if input should be ignored
 */
export function useKeyHandler(drillType, onAnswer, isBlocked) {
  const keybindingsStore = useKeybindingsStore()
  const heldKeys = new Set()

  function onKeyDown(e) {
    heldKeys.add(e.key.toLowerCase())
  }

  function onKeyUp(e) {
    const key = e.key.toLowerCase()
    if (!isBlocked()) {
      // Check match against keys held BEFORE releasing this one
      const answerId = keybindingsStore.matchAnswer(drillType, heldKeys)
      if (answerId) onAnswer(answerId)
    }
    heldKeys.delete(key)
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    heldKeys.clear()
  })
}
