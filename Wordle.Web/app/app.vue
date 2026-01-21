<template>
  <v-app>
    <v-app-bar
      color="deep-purple-lighten-2"
      flat
      elevate-on-scroll
    >
      <!-- App Title / Logo -->
      <v-toolbar-title class="font-weight-bold text-white">
        🎮 Wordle Web
      </v-toolbar-title>

      <v-spacer />

      <!-- Menu Tabs -->
      <v-tabs
        align-tabs="end"
        color="white"
      >
        <v-tab to="/">Home</v-tab>
        <v-tab to="/game">Game</v-tab>
      </v-tabs>
    </v-app-bar>

    <v-main>
      <v-container class="py-6">
        <NuxtPage />
      </v-container>
    </v-main>
  </v-app>
</template>
