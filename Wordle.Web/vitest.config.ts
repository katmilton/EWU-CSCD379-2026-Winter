import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    css: true,
    include: ['app/tests/**/*.test.ts'],
    deps: {
      inline: ['vuetify'], // 👈 REQUIRED for Vuetify
    },
  },
})
