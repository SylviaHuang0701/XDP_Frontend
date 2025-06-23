import { createRouter, createWebHistory } from 'vue-router'
import Status from '../components/Status.vue'
import Rules from '../components/Rules.vue'
import Logs from '../components/Logs.vue'
const routes = [
    { path: '/', redirect: '/status' },
    { path: '/status', component: Status },
    { path: '/rules', component: Rules },
    { path: '/logs', component: Logs },
  ]
  
  const router = createRouter({
    history: createWebHistory(),
    routes,
  })
  export default router