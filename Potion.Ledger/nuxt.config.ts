export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? "http://localhost:3000",
    },
  },

  // Keep this if your project was created with a compatibility date
  compatibilityDate: '2025-07-15',

  ssr: false,
  pages: true,

  devtools: { enabled: true },

  // Vuetify Nuxt module
  modules: ['vuetify-nuxt-module'],

  // Global CSS (use ~ alias to avoid the Vite import-resolution issue)
  css: [
    'vuetify/styles',
    '~/assets/main.scss',
    '@mdi/font/css/materialdesignicons.css',
  ],

  // Vuetify often needs transpilation in Vite builds
  build: {
    transpile: ['vuetify'],
  },

  // Module options (vuetify-nuxt-module reads this)
  vuetify: {
    vuetifyOptions: {
      theme: {
        defaultTheme: 'light',
      },
    },
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
  },
})
