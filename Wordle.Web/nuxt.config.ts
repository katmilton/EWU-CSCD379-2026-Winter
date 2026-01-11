// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['vuetify-nuxt-module'],

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
  },
   build: {
    transpile: ['vuetify'],
  },
  css: ['@/assets/main.scss'],
})
