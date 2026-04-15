<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  useKeybindingsStore,
  FRAME_ANSWER_IDS, FRAME_ANSWER_LABELS,
  THROW_ANSWER_IDS, THROW_ANSWER_LABELS,
} from '../stores/keybindings'

const store = useKeybindingsStore()
onMounted(() => store.load())

const activeTab = ref('frame')
const editingProfileId = ref(null)
const editingProfile = computed(() => store.profiles.find(p => p.id === editingProfileId.value))

const answerIds = computed(() => activeTab.value === 'frame' ? FRAME_ANSWER_IDS : THROW_ANSWER_IDS)
const answerLabels = computed(() => activeTab.value === 'frame' ? FRAME_ANSWER_LABELS : THROW_ANSWER_LABELS)

// Select first profile by default
onMounted(() => {
  if (store.profiles.length > 0) editingProfileId.value = store.profiles[0].id
})

// --- Listening for key capture ---
const listening = ref(null) // { profileId, drillType, answerId, slotIndex }
const heldKeys = ref(new Set())
const heldDisplay = ref('')

function formatKeys(keys) {
  if (!keys || keys.length === 0) return '—'
  return keys.map(k => k.toUpperCase()).join(' + ')
}

function getBinding(profile, drillType, answerId, slotIndex) {
  const bindings = drillType === 'frame' ? profile.frameDrill : profile.throwDrill
  return bindings?.[answerId]?.[slotIndex] ?? null
}

function startListening(profileId, drillType, answerId, slotIndex) {
  heldKeys.value = new Set()
  heldDisplay.value = ''
  listening.value = { profileId, drillType, answerId, slotIndex }
}

function stopListening() {
  listening.value = null
  heldKeys.value = new Set()
  heldDisplay.value = ''
}

function onKeyDown(e) {
  if (!listening.value) return
  e.preventDefault()

  if (e.key === 'Escape') { stopListening(); return }

  const key = e.key.toLowerCase()
  heldKeys.value.add(key)
  heldDisplay.value = [...heldKeys.value].map(k => k.toUpperCase()).join(' + ')
}

function onKeyUp(e) {
  if (!listening.value) return
  const key = e.key.toLowerCase()
  // Snapshot before removing, so we capture the full combo on last key release
  const finalKeys = [...heldKeys.value]
  heldKeys.value.delete(key)
  heldDisplay.value = [...heldKeys.value].map(k => k.toUpperCase()).join(' + ')

  // Save only when all keys are released
  if (heldKeys.value.size === 0) {
    if (finalKeys.length > 0) {
      const { profileId, drillType, answerId, slotIndex } = listening.value
      store.setBinding(profileId, drillType, answerId, slotIndex, finalKeys)
    }
    stopListening()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
})

import { onUnmounted } from 'vue'
onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
})

// --- New profile ---
const newProfileName = ref('')
function createProfile() {
  if (!newProfileName.value.trim()) return
  const id = store.createProfile(newProfileName.value.trim())
  editingProfileId.value = id
  newProfileName.value = ''
}

// --- Rename ---
const renamingId = ref(null)
const renameValue = ref('')
function startRename(p) {
  renamingId.value = p.id
  renameValue.value = p.name
}
function confirmRename() {
  if (renameValue.value.trim()) store.renameProfile(renamingId.value, renameValue.value.trim())
  renamingId.value = null
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-6 py-8">
    <h1 class="text-3xl font-bold text-white mb-1">Profils de touches</h1>
    <p class="text-gray-400 text-sm mb-8">Chaque réponse peut avoir 2 raccourcis. Tu peux utiliser des combinaisons (ex: F + 1).</p>

    <div class="flex gap-6">
      <!-- Left: profile list -->
      <div class="w-52 flex-shrink-0">
        <div class="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Profils</div>

        <div class="space-y-1 mb-4">
          <div
            v-for="p in store.profiles"
            :key="p.id"
            :class="[
              'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors group',
              editingProfileId === p.id ? 'bg-yellow-400/10 border border-yellow-400' : 'bg-gray-900 border border-gray-800 hover:border-gray-600'
            ]"
            @click="editingProfileId = p.id"
          >
            <template v-if="renamingId === p.id">
              <input
                v-model="renameValue"
                @keydown.enter="confirmRename"
                @keydown.escape="renamingId = null"
                @keydown.stop
                class="flex-1 bg-transparent text-white text-sm outline-none border-b border-yellow-400"
                autofocus
              />
            </template>
            <template v-else>
              <span :class="['flex-1 text-sm font-medium truncate', editingProfileId === p.id ? 'text-yellow-400' : 'text-gray-300']">
                {{ p.name }}
              </span>
              <button
                v-if="editingProfileId === p.id"
                @click.stop="startRename(p)"
                class="text-gray-500 hover:text-gray-300 text-xs"
                title="Renommer"
              >✏️</button>
            </template>
            <div
              v-if="store.activeProfileId === p.id"
              class="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"
              title="Profil actif"
            />
          </div>
        </div>

        <!-- New profile -->
        <div class="flex gap-1">
          <input
            v-model="newProfileName"
            @keydown.enter="createProfile"
            @keydown.stop
            placeholder="Nouveau profil..."
            class="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white placeholder-gray-600 outline-none focus:border-yellow-400"
          />
          <button @click="createProfile" class="px-2 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black rounded-lg font-bold text-sm">+</button>
        </div>

        <!-- Set active -->
        <div v-if="editingProfile && store.activeProfileId !== editingProfile.id" class="mt-3">
          <button
            @click="store.setActiveProfile(editingProfile.id)"
            class="w-full px-3 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg text-sm font-medium"
          >
            Activer ce profil
          </button>
        </div>
        <div v-else-if="editingProfile" class="mt-3 text-center text-xs text-green-400">
          ✓ Profil actif
        </div>

        <button
          v-if="editingProfile && editingProfile.id !== 'default'"
          @click="store.deleteProfile(editingProfile.id); editingProfileId = store.profiles[0]?.id"
          class="w-full mt-2 px-3 py-1.5 text-red-500 hover:bg-red-900/30 rounded-lg text-sm border border-red-900"
        >
          Supprimer
        </button>
      </div>

      <!-- Right: binding editor -->
      <div class="flex-1" v-if="editingProfile">
        <!-- Tabs -->
        <div class="flex gap-2 mb-6">
          <button
            @click="activeTab = 'frame'"
            :class="['px-4 py-2 rounded-lg font-medium text-sm transition-colors', activeTab === 'frame' ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white']"
          >Frame Drill</button>
          <button
            @click="activeTab = 'throw'"
            :class="['px-4 py-2 rounded-lg font-medium text-sm transition-colors', activeTab === 'throw' ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white']"
          >Throw Drill</button>
        </div>

        <div class="space-y-2">
          <div
            v-for="answerId in answerIds"
            :key="answerId"
            class="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 flex items-center gap-4"
          >
            <!-- Answer label -->
            <div class="w-24 font-mono font-bold text-white text-sm flex-shrink-0">
              {{ answerLabels[answerId] }}
            </div>

            <!-- Slot 1 -->
            <div class="flex-1">
              <div class="text-xs text-gray-500 mb-1">Touche 1</div>
              <div class="flex items-center gap-2">
                <button
                  @click="startListening(editingProfile.id, activeTab, answerId, 0)"
                  :class="[
                    'px-3 py-1.5 rounded-lg border font-mono text-sm transition-colors min-w-[80px] text-center',
                    listening?.profileId === editingProfile.id && listening?.answerId === answerId && listening?.slotIndex === 0
                      ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400 animate-pulse'
                      : 'border-gray-600 bg-gray-800 text-white hover:border-gray-400'
                  ]"
                >
                  <span v-if="listening?.profileId === editingProfile.id && listening?.answerId === answerId && listening?.slotIndex === 0">
                    {{ heldDisplay || '...' }}
                  </span>
                  <span v-else>{{ formatKeys(getBinding(editingProfile, activeTab, answerId, 0)) }}</span>
                </button>
                <button
                  v-if="getBinding(editingProfile, activeTab, answerId, 0)"
                  @click="store.clearBinding(editingProfile.id, activeTab, answerId, 0)"
                  class="text-gray-600 hover:text-red-400 text-xs"
                >✕</button>
              </div>
            </div>

            <!-- Slot 2 -->
            <div class="flex-1">
              <div class="text-xs text-gray-500 mb-1">Touche 2 (optionnel)</div>
              <div class="flex items-center gap-2">
                <button
                  @click="startListening(editingProfile.id, activeTab, answerId, 1)"
                  :class="[
                    'px-3 py-1.5 rounded-lg border font-mono text-sm transition-colors min-w-[80px] text-center',
                    listening?.profileId === editingProfile.id && listening?.answerId === answerId && listening?.slotIndex === 1
                      ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400 animate-pulse'
                      : 'border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-400 hover:text-white'
                  ]"
                >
                  <span v-if="listening?.profileId === editingProfile.id && listening?.answerId === answerId && listening?.slotIndex === 1">
                    {{ heldDisplay || '...' }}
                  </span>
                  <span v-else>{{ formatKeys(getBinding(editingProfile, activeTab, answerId, 1)) }}</span>
                </button>
                <button
                  v-if="getBinding(editingProfile, activeTab, answerId, 1)"
                  @click="store.clearBinding(editingProfile.id, activeTab, answerId, 1)"
                  class="text-gray-600 hover:text-red-400 text-xs"
                >✕</button>
              </div>
            </div>
          </div>
        </div>

        <p class="text-gray-600 text-xs mt-4">Cliquer sur un slot → appuyer les touches voulues → relâcher pour valider. Échap pour annuler.</p>
      </div>
    </div>

    <!-- Listening overlay -->
    <div
      v-if="listening"
      class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
      @click="stopListening"
    >
      <div class="bg-gray-900 border border-yellow-400 rounded-2xl p-10 text-center" @click.stop>
        <div class="text-gray-400 text-sm mb-2">Appuie sur les touches...</div>
        <div class="text-4xl font-mono font-bold text-yellow-400 mb-4 min-h-[3rem]">
          {{ heldDisplay || '—' }}
        </div>
        <div class="text-gray-500 text-xs">Relâche pour valider • Échap pour annuler</div>
      </div>
    </div>
  </div>
</template>
