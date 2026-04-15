import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Dynamically import all character JSONs from src/data/characters/
const characterModules = import.meta.glob('../data/characters/*.json', { eager: true })

function normalizeCharacter(mod, filename) {
  const data = mod.default || mod
  if (Array.isArray(data)) {
    // Format: array of moves directly
    const name = filename.replace('.json', '').replace(/^\w/, c => c.toUpperCase())
    return { name, moves: data }
  }
  if (data.moves) {
    return { name: data.name || filename.replace('.json', ''), moves: data.moves }
  }
  return null
}

export const useCharactersStore = defineStore('characters', () => {
  const characters = ref([])
  const multiCharIds = ref([])

  function setMultiChars(ids) {
    multiCharIds.value = ids
  }

  function loadCharacters() {
    const loaded = []
    for (const [path, mod] of Object.entries(characterModules)) {
      const filename = path.split('/').pop().replace('.json', '')
      const char = normalizeCharacter(mod, filename)
      if (char) loaded.push({ ...char, id: filename })
    }
    characters.value = loaded
  }

  const getCharacter = computed(() => (id) => characters.value.find(c => c.id === id))

  return { characters, multiCharIds, setMultiChars, loadCharacters, getCharacter }
})
