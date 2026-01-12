<template>
  <v-container class="text-center">
    <v-card class="pa-6" max-width="400">
      <v-card-title>Quick Guess</v-card-title>

      <v-card-text>
        <div> Hint: The course you are taking </div>
        <v-text-field
          v-model="guess"
          label="Enter your guess"
          maxlength="10"
        />

        <div class="mt-2">
          {{ message }}
        </div>
      </v-card-text>

      <v-card-actions class="justify-space-between">
        <v-btn color="primary" @click="checkGuess">
          Guess
        </v-btn>

        <v-btn to="/" variant="text">
          Home
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">

import { ref } from 'vue'

const secret = 'CSCD379'
const guess = ref('')
const message = ref('')

function checkGuess() {
  if (guess.value.toUpperCase() === secret) {
    message.value = 'Correct!'
  } else {
    message.value = 'Try again'
  }
}
</script>
