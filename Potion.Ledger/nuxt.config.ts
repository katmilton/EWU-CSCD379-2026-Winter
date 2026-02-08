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
        // Dark theme so component text stays readable on our dark surfaces.
        defaultTheme: 'potionDark',
        themes: {
          potionDark: {
            dark: true,
            colors: {
              background: '#07060a',
              surface: '#100c18',
              primary: '#9dffb0',
              secondary: '#b78bff',
              error: '#ff5a7a',
              warning: '#ffd56b',
              info: '#86b7ff',
              success: '#78ffa0',
            },
          },
        },
      },
    },
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
  },
})
