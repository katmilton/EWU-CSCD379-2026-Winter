<template>
  <v-container class="home-bg fill-height d-flex align-center justify-center">
    <v-card class="pa-8 home-card">
      <v-card-title class="text-center title-text">
          Wordle Web
      </v-card-title>

      <v-card-text class="text-center subtitle-text">
        Guess today’s word and keep your streak going 
      </v-card-text>

      <div class="emoji-row">🟩 🟨 ⬛ 🟨 🟩</div>

      <v-btn
        color="primary"
        component="NuxtLink"
        to="/game"
        class="mt-4 play-btn"
        block
      >
        ▶ Play Now
      </v-btn>
    </v-card>
  </v-container>
</template>

<style scoped>
.home-bg {
  min-height: 100vh;
  background: linear-gradient(135deg, #fde2e4, #e0c3fc, #c2f0fc);
  display: flex;
}

.home-card {
  max-width: 380px;
  border-radius: 20px;
  transition: transform 0.2s ease;
}

.home-card:hover {
  transform: translateY(-5px);
}

.title-text {
  font-size: 2.4rem;
  font-weight: bold;
  color: #7c3aed;
}

.emoji-row {
  text-align: center;
  font-size: 1.6rem;
  margin: 12px 0;
}

.play-btn {
  font-weight: bold;
}
</style>
