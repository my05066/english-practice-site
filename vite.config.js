import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages project site: https://my05066.github.io/english-practice-site/
export default defineConfig({ base: '/english-practice-site/', plugins: [vue()] })
