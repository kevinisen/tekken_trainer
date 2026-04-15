<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="max-w-2xl mx-auto px-6 py-20 text-center">
    <h1 class="text-5xl font-bold mb-3 text-white">⚡ Tekken Drill</h1>
    <p class="text-gray-400 mb-16 text-lg">Frame Data Trainer</p>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
  </div>
</template>
