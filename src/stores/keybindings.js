import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const FRAME_ANSWER_IDS = ['safe', '-10', '-11', '-12', '-13', '-14', '-15+']
export const THROW_ANSWER_IDS = ['1', '2', '1+2', '1or2', 'none']

export const FRAME_ANSWER_LABELS = {
  'safe': 'Safe',
  '-10': '-10',
  '-11': '-11',
  '-12': '-12',
  '-13': '-13',
  '-14': '-14',
  '-15+': '-15+',
}
export const THROW_ANSWER_LABELS = {
  '1': '1',
  '2': '2',
  '1+2': '1+2',
  '1or2': '1 ou 2',
  'none': '✗ Incassable',
}

function defaultFrameBindings() {
  return {
    'safe':  [['1'], null],
    '-10':   [['2'], null],
    '-11':   [['3'], null],
    '-12':   [['4'], null],
    '-13':   [['5'], null],
    '-14':   [['6'], null],
    '-15+':  [['7'], null],
  }
}

function defaultThrowBindings() {
  return {
    '1':    [['1'], null],
    '2':    [['2'], null],
    '1+2':  [['3'], null],
    '1or2': [['4'], null],
    'none': [['5'], null],
  }
}

function makeDefaultProfile() {
  return {
    id: 'default',
    name: 'Défaut',
    frameDrill: defaultFrameBindings(),
    throwDrill: defaultThrowBindings(),
  }
}

export const useKeybindingsStore = defineStore('keybindings', () => {
  const profiles = ref([])
  const activeProfileId = ref('default')

  function load() {
    const saved = localStorage.getItem('tekken-keybinding-profiles')
    if (saved) {
      profiles.value = JSON.parse(saved)
    } else {
      profiles.value = [makeDefaultProfile()]
    }
    const savedActive = localStorage.getItem('tekken-keybinding-active')
    if (savedActive) activeProfileId.value = savedActive
  }

  function save() {
    localStorage.setItem('tekken-keybinding-profiles', JSON.stringify(profiles.value))
    localStorage.setItem('tekken-keybinding-active', activeProfileId.value)
  }

  const activeProfile = computed(() =>
    profiles.value.find(p => p.id === activeProfileId.value) ?? profiles.value[0]
  )

  function setActiveProfile(id) {
    activeProfileId.value = id
    save()
  }

  function createProfile(name) {
    const id = 'profile-' + Date.now()
    profiles.value.push({
      id,
      name,
      frameDrill: defaultFrameBindings(),
      throwDrill: defaultThrowBindings(),
    })
    save()
    return id
  }

  function deleteProfile(id) {
    if (id === 'default') return
    profiles.value = profiles.value.filter(p => p.id !== id)
    if (activeProfileId.value === id) activeProfileId.value = 'default'
    save()
  }

  function renameProfile(id, name) {
    const p = profiles.value.find(p => p.id === id)
    if (p) { p.name = name; save() }
  }

  function setBinding(profileId, drillType, answerId, slotIndex, keys) {
    const p = profiles.value.find(p => p.id === profileId)
    if (!p) return
    const bindings = drillType === 'frame' ? p.frameDrill : p.throwDrill
    if (!bindings[answerId]) bindings[answerId] = [null, null]
    bindings[answerId][slotIndex] = keys
    save()
  }

  function clearBinding(profileId, drillType, answerId, slotIndex) {
    const p = profiles.value.find(p => p.id === profileId)
    if (!p) return
    const bindings = drillType === 'frame' ? p.frameDrill : p.throwDrill
    if (bindings[answerId]) bindings[answerId][slotIndex] = null
    save()
  }

  // Returns answerId matching held keys, or null
  function matchAnswer(drillType, heldKeys) {
    const p = activeProfile.value
    if (!p) return null
    const bindings = drillType === 'frame' ? p.frameDrill : p.throwDrill
    for (const [answerId, slots] of Object.entries(bindings)) {
      for (const slot of slots) {
        if (!slot || slot.length === 0) continue
        if (slot.every(k => heldKeys.has(k.toLowerCase())) && heldKeys.size === slot.length) {
          return answerId
        }
      }
    }
    return null
  }

  return {
    profiles, activeProfileId, activeProfile,
    load, save,
    setActiveProfile, createProfile, deleteProfile, renameProfile,
    setBinding, clearBinding, matchAnswer,
  }
})
