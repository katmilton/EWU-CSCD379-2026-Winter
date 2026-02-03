<template>
  <v-card class="pa-6" rounded="lg" elevation="1">
    <h1 style="margin:0 0 8px;">Potion Ledger</h1>
    <p style="opacity:.75; margin:0 0 16px;">
      Fulfill potion orders using limited ingredients. Choose the best sequence to hit the target score.
    </p>

    <v-alert type="info" variant="tonal" class="mb-4">
      Strategy tip: High-reward potions often consume rare ingredients. Plan ahead.
    </v-alert>

    <div style="display:flex; gap:12px; flex-wrap:wrap;">
      <v-btn color="primary" to="/play">Start Today’s Run</v-btn>
      <v-btn variant="outlined" to="/leaderboard">View Leaderboard</v-btn>
      <v-btn variant="text" to="/testimonials">Read Testimonials</v-btn>
    </div>
  </v-card>
</template>
