<template>
  <div class="wordle-stats">
    <v-dialog v-model="model" max-width="520">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div>Statistics</div>
          <v-btn size="small" variant="text" @click="model = false">Close</v-btn>
        </v-card-title>

        <v-card-text>
          <div class="stats-grid">
            <div class="stat">
              <div class="stat-label">Played</div>
              <div class="stat-value">{{ stats.played }}</div>
            </div>
            <div class="stat">
              <div class="stat-label">Wins</div>
              <div class="stat-value">{{ stats.wins }}</div>
            </div>
            <div class="stat">
              <div class="stat-label">Losses</div>
              <div class="stat-value">{{ stats.losses }}</div>
            </div>
            <div class="stat">
              <div class="stat-label">Win %</div>
              <div class="stat-value">{{ winPercent }}%</div>
            </div>
            <div class="stat">
              <div class="stat-label">Avg guesses (wins)</div>
              <div class="stat-value">{{ avgGuessesToWin }}</div>
            </div>
            <div class="stat">
              <div class="stat-label">Today played?</div>
              <div class="stat-value">{{ dailyPlayedToday ? 'Yes' : 'No' }}</div>
            </div>
          </div>

          <div class="dist-wrap">
            <div class="dist-title">Guess Distribution (wins)</div>
            <div class="dist">
              <div v-for="i in maxGuesses" :key="'dist-' + i" class="dist-row">
                <div class="dist-n">{{ i }}</div>
                <div class="dist-bar">
                  <div class="dist-fill" :style="{ width: distWidth(i) }" />
                </div>
                <div class="dist-count">{{ stats.guessDist[i] || 0 }}</div>
              </div>
            </div>
          </div>

          <div class="small-note">Stored locally in your browser (localStorage).</div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  stats: any
  winPercent: number
  avgGuessesToWin: string
  dailyPlayedToday: boolean
  maxGuesses: number
  distWidth: (i: number) => string
}>()

const model = defineModel<boolean>({ default: false })
</script>
