<template>
  <div class="wordle-stats">
    <v-dialog v-model="model" max-width="640">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="title">Statistics</div>
          <v-btn size="small" variant="text" @click="model = false">Close</v-btn>
        </v-card-title>

        <v-card-text>
          <!-- TOP STATS -->
          <v-row class="stats-row" dense>
            <v-col cols="6" sm="4" lg="2" v-for="(item, idx) in statItems" :key="idx">
              <v-sheet class="stat-tile" elevation="0" rounded>
                <div class="stat-label">{{ item.label }}</div>
                <div class="stat-value">{{ item.value }}</div>
              </v-sheet>
            </v-col>
          </v-row>

          <!-- WIN % BAR -->
          <div class="percent-wrap">
            <div class="percent-label">Win %</div>
            <div class="percent-bar">
              <v-progress-linear
                :value="winPercentComputed"
                height="18"
                rounded
                color="success"
              >
                <template #default>
                  <div class="percent-text">{{ winPercentComputed }}%</div>
                </template>
              </v-progress-linear>
            </div>
          </div>

          <!-- GUESS DISTRIBUTION -->
          <div class="dist-wrap">
            <div class="dist-title">Guess Distribution (wins)</div>
            <v-row class="dist" dense>
              <v-col cols="12" v-for="i in effectiveMaxGuesses" :key="'dist-' + i">
                <div class="dist-row">
                  <div class="dist-n">{{ i }}</div>

                  <div class="dist-bar">
                    <v-progress-linear
                      :value="distPercent(i)"
                      height="20"
                      rounded
                      :color="distColor(i)"
                    />
                  </div>

                  <div class="dist-count">
                    {{ stats.guessDist?.[i - 1] || 0 }}
                  </div>
                </div>
              </v-col>
            </v-row>
          </div>

          <div class="small-note">
            Stored locally in your browser (localStorage).
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  stats: any
  winPercent?: number
  avgGuessesToWin?: string
  dailyPlayedToday?: boolean
  maxGuesses?: number
  distWidth?: (i: number) => string
}>()

const model = defineModel<boolean>({ default: false })

const stats = props.stats ?? { played: 0, wins: 0, losses: 0, guessDist: [] }

const winPercentComputed = computed(() => {
  if (typeof props.winPercent === 'number') return Math.round(props.winPercent)
  return stats.played ? Math.round((stats.wins / stats.played) * 100) : 0
})

const avgGuessesComputed = computed(() => {
  if (props.avgGuessesToWin) return props.avgGuessesToWin
  const dist = stats.guessDist || []
  const totalWins = stats.wins || 0
  if (!totalWins) return '-'

  let sum = 0
  for (let i = 0; i < dist.length; i++) {
    sum += (dist[i] || 0) * (i + 1)
  }
  return (sum / totalWins).toFixed(2)
})

const effectiveMaxGuesses = computed(() => {
  return props.maxGuesses ?? Math.max(stats.guessDist?.length || 6, 6)
})

const maxDistCount = computed(() => {
  const arr = stats.guessDist || []
  return arr.length ? Math.max(...arr) : 1
})

function distPercent(i: number) {
  if (props.distWidth) {
    const w = props.distWidth(i)
    return Number(w.replace('%', '')) || 0
  }

  const count = stats.guessDist?.[i - 1] || 0
  const max = maxDistCount.value || 1
  return Math.round((count / max) * 100)
}

// Highlight the most common guess in green
function distColor(i: number) {
  const count = stats.guessDist?.[i - 1] || 0
  if (count === maxDistCount.value && count > 0) return 'success'
  return 'primary'
}

const statItems = computed(() => [
  { label: 'Played', value: stats.played ?? 0 },
  { label: 'Wins', value: stats.wins ?? 0 },
  { label: 'Losses', value: stats.losses ?? 0 },
  { label: 'Avg guesses (wins)', value: avgGuessesComputed.value },
  { label: 'Today played?', value: props.dailyPlayedToday ? 'Yes' : 'No' }
])
</script>

<style scoped>
.wordle-stats .title {
  font-weight: 600;
  font-size: 1.1rem;
}

.stats-row {
  margin-bottom: 12px;
}

.stat-tile {
  padding: 10px;
  text-align: center;
}

.stat-label {
  color: #6b6b6b;
  font-size: 0.85rem;
}

.stat-value {
  font-size: 1.15rem;
  font-weight: 600;
  margin-top: 6px;
}

.percent-wrap {
  margin: 8px 0 14px;
}

.percent-label {
  color: #6b6b6b;
  margin-bottom: 6px;
}

.percent-text {
  color: white;
  font-weight: 600;
  padding-left: 8px;
}

.dist-wrap {
  margin-top: 6px;
}

.dist-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.dist-row {
  display: flex;
  align-items: center;
  gap: 10px;
  transition: 0.15s ease;
}

.dist-row:hover {
  transform: scale(1.02);
}

.dist-n {
  width: 22px;
  text-align: right;
  color: #3c3c3c;
  font-weight: 600;
}

.dist-bar {
  flex: 1;
}

.dist-count {
  width: 28px;
  text-align: center;
  color: #3c3c3c;
  font-weight: 600;
}

.small-note {
  margin-top: 12px;
  color: #7a7a7a;
  font-size: 0.85rem;
}
</style>
