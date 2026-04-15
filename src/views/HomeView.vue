<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const showBackup = ref(false)
const backupCode = ref('')
const restoreCode = ref('')
const message = ref('')

function generateCode() {
  const data = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key.startsWith('tekken-')) {
      data[key] = localStorage.getItem(key)
    }
  }
  // Convert context to base64
  const jsonStr = JSON.stringify(data)
  backupCode.value = btoa(encodeURIComponent(jsonStr))
  message.value = "Code généré ! Copie-le précieusement."
}

function copyCode() {
  navigator.clipboard.writeText(backupCode.value)
  message.value = "Code copié dans le presse-papier !"
}

function restoreFromCode() {
  try {
    const jsonStr = decodeURIComponent(atob(restoreCode.value.trim()))
    const data = JSON.parse(jsonStr)
    
    // 1. D'abord, on efface toutes les anciennes données de l'ordinateur 
    // qui commencent par "tekken-" pour faire place nette
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('tekken-')) {
        keysToRemove.push(k)
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))

    // 2. Ensuite, on réinjecte uniquement les données contenues dans le code
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith('tekken-')) {
        localStorage.setItem(key, value)
      }
    }
    
    message.value = "Données restaurées avec succès ! C'est la liste EXACTE maintenant."
    restoreCode.value = ''
  } catch (e) {
    message.value = "Erreur : Code invalide ou corrompu."
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-6 py-20 text-center">
    <h1 class="text-5xl font-bold mb-3 text-white">⚡ Tekken Drill</h1>
    <p class="text-gray-400 mb-16 text-lg">Frame Data Trainer</p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <button
        @click="router.push('/make-drill')"
        class="bg-gray-900 border border-gray-700 hover:border-yellow-400 hover:bg-gray-800 rounded-2xl p-8 text-left transition-all duration-200 group"
      >
        <div class="text-4xl mb-4">🛠️</div>
        <h2 class="text-xl font-bold text-white group-hover:text-yellow-400 mb-2">Make My Drill</h2>
        <p class="text-gray-500 text-sm">Choisis les moves de chaque perso que tu veux mémoriser.</p>
      </button>

      <button
        @click="router.push('/training')"
        class="bg-gray-900 border border-gray-700 hover:border-yellow-400 hover:bg-gray-800 rounded-2xl p-8 text-left transition-all duration-200 group"
      >
        <div class="text-4xl mb-4">🎯</div>
        <h2 class="text-xl font-bold text-white group-hover:text-yellow-400 mb-2">Training Drill</h2>
        <p class="text-gray-500 text-sm">Sélectionne tes persos et lance le drill avec tes moves sauvegardés.</p>
      </button>

      <button
        @click="router.push('/throw-setup')"
        class="bg-gray-900 border border-gray-700 hover:border-yellow-400 hover:bg-gray-800 rounded-2xl p-8 text-left transition-all duration-200 group"
      >
        <div class="text-4xl mb-4">🤼</div>
        <h2 class="text-xl font-bold text-white group-hover:text-yellow-400 mb-2">Throw Drill</h2>
        <p class="text-gray-500 text-sm">Entraîne-toi à reconnaître et casser les throws (1, 2, 1+2 ou impossible).</p>
      </button>

      <button
        @click="router.push('/king-chain-drill')"
        class="bg-gray-900 border border-gray-700 hover:border-yellow-400 hover:bg-gray-800 rounded-2xl p-8 text-left transition-all duration-200 group"
      >
        <div class="text-4xl mb-4">👑</div>
        <h2 class="text-xl font-bold text-white group-hover:text-yellow-400 mb-2">Chain Throws</h2>
        <p class="text-gray-500 text-sm">Explore toutes les branches de l'arbre de chopes de King & Armor King en mode DFS.</p>
      </button>
    </div>

    <!-- Section Backup -->
    <div class="mt-16 bg-gray-900 border border-gray-700 rounded-2xl p-6 mx-auto max-w-2xl text-left" v-if="showBackup">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-white">💾 Sauvegarde Automatique</h2>
        <button @click="showBackup = false" class="text-gray-400 hover:text-white text-2xl">&times;</button>
      </div>
      
      <p class="text-gray-400 mb-6 text-sm">Génère un code secret pour transférer tes données (moves, scores, contrôles) vers un autre appareil, ou colle un code existant pour les restaurer.</p>

      <div class="space-y-6">
        <!-- Exporter -->
        <div class="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <h3 class="text-white font-bold mb-2">1. Exporter mes choix</h3>
          <button @click="generateCode" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold transition">Générer le Code</button>
          
          <div v-if="backupCode" class="mt-4">
            <textarea readonly v-model="backupCode" class="w-full h-24 bg-gray-900 text-gray-300 p-3 rounded font-mono text-sm border border-gray-600 focus:outline-none"></textarea>
            <button @click="copyCode" class="mt-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition">📋 Copier le code</button>
          </div>
        </div>

        <!-- Importer -->
        <div class="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <h3 class="text-white font-bold mb-2">2. Restaurer mes choix</h3>
          <textarea v-model="restoreCode" placeholder="Colle ton code secret ici..." class="w-full h-24 bg-gray-900 text-gray-300 p-3 rounded font-mono text-sm border border-gray-600 focus:outline-none mb-2"></textarea>
          <button @click="restoreFromCode" class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold transition">Restaurer</button>
        </div>
      </div>

      <!-- Message -->
      <div v-if="message" class="mt-4 p-3 rounded bg-gray-800 border border-gray-700 text-yellow-400 font-bold text-center">
        {{ message }}
      </div>
    </div>

    <!-- Toggle Backup -->
    <button v-else @click="showBackup = true" class="mt-12 text-gray-500 hover:text-yellow-400 font-bold underline transition">
      Sauvegarder ou m'envoyer mes données (Code Secret)
    </button>
  </div>
</template>
