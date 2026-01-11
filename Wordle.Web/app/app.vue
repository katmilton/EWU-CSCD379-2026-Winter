<template>
  <v-app>
    <v-app-bar>
      <v-tabs>
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

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
