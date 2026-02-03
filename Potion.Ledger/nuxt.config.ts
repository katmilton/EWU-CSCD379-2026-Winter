import { defineNuxtConfig } from "nuxt/config";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  pages: true,
  modules: ['vuetify-nuxt-module'],
  build: { transpile: ['vuetify'] },
  css: ['@mdi/font/css/materialdesignicons.css', '~/assets/main.scss'],
})

