import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import Home from './pages/Home.vue'
import Phonemes from './pages/Phonemes.vue'
import Practice from './pages/Practice.vue'
import Articles from './pages/Articles.vue'
import './style.css'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/phonemes', component: Phonemes },
    { path: '/practice', component: Practice },
    { path: '/articles', component: Articles },
  ],
  scrollBehavior: (to, from) => {
    if (to.hash === '#favorites') return { el: to.hash }
    if (to.path !== from.path) return { top: 0 }
  },
})

createApp(App).use(router).mount('#app')
