<template>
  <div class="min-h-screen bg-gray-950 text-white">
    <nav class="border-b border-gray-800 px-6 py-3 flex items-center gap-4">
      <router-link to="/" class="text-xl font-bold tracking-wider text-yellow-400 hover:text-yellow-300">
        ⚡ TEKKEN DRILL
      </router-link>
      <div class="flex items-center gap-1 ml-auto">
        <router-link to="/make-drill" class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
          🛠️ Make My Drill
        </router-link>
        <router-link to="/training" class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
          🎯 Training
        </router-link>
        <router-link to="/throw-setup" class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
          🤼 Throws
        </router-link>
        <router-link to="/king-chain-drill" class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
          👑 Chain Throws
        </router-link>
        <router-link to="/profiles" class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
          ⌨️ Touches
        </router-link>
      </div>
    </nav>
    <router-view />
  </div>
</template>
