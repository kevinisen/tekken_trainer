import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MakeDrillView from '../views/MakeDrillView.vue'
import TrainingView from '../views/TrainingView.vue'
import ThrowSetupView from '../views/ThrowSetupView.vue'
import ThrowDrillView from '../views/ThrowDrillView.vue'
import ChainThrowSetupView from '../views/ChainThrowSetupView.vue'
import ChainThrowDrillView from '../views/ChainThrowDrillView.vue'
import KingChainDrillView from '../views/KingChainDrillView.vue'
import ProfilesView from '../views/ProfilesView.vue'
import MovelistView from '../views/MovelistView.vue'
import MultiMovelistView from '../views/MultiMovelistView.vue'
import DrillView from '../views/DrillView.vue'
import ResultsView from '../views/ResultsView.vue'

const routes = [
  { path: '/', component: HomeView },
  { path: '/make-drill', component: MakeDrillView },
  { path: '/training', component: TrainingView },
  { path: '/throw-setup', component: ThrowSetupView },
  { path: '/throw-drill', component: ThrowDrillView },
  { path: '/chain-throw-setup', component: ChainThrowSetupView },
  { path: '/chain-throw-drill', component: ChainThrowDrillView },
  { path: '/king-chain-drill', component: KingChainDrillView },
  { path: '/profiles', component: ProfilesView },
  { path: '/character/:id', component: MovelistView },
  { path: '/multi', component: MultiMovelistView },
  { path: '/drill', component: DrillView },
  { path: '/results', component: ResultsView },
]

export default createRouter({
  history: createWebHashHistory(),
  routes,
})
