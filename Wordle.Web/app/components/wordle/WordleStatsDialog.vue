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
                  <div class="percent-text">{{ winPercentComputed }}% </div>
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
                    <div class="dist-fill" :style="{ width: distWidthComputed(i) }" :class="{ 'dist-fill--success': distColor(i) === 'success', 'dist-fill--primary': distColor(i) !== 'success' }"></div>
                    <v-progress-linear
                      :value="0"
                      height="20"
                      rounded
                      style="visibility: hidden; position: absolute; left: 0; right: 0;"
                    />
                  </div>

                  <div class="dist-count">
                    {{ getGuessCount(i) }}
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
  const gd = stats.guessDist || []
  if (Array.isArray(gd)) return gd.length ? Math.max(...gd.map(v => Number(v) || 0)) : 1
  const vals = Object.values(gd).map(v => Number(v) || 0)
  return vals.length ? Math.max(...vals) : 1
})

function getGuessCount(i: number) {
  const gd = stats.guessDist || []
  if (Array.isArray(gd)) return Number(gd[i - 1]) || 0
  // support object keyed by 1-based indexes (strings or numbers)
  if (gd && typeof gd === 'object') return Number(gd[i] ?? gd[String(i)] ?? gd[i - 1] ?? 0) || 0
  return 0
}

function distPercent(i: number) {
  if (props.distWidth) {
    const w = props.distWidth(i)
    return Number(String(w).replace('%', '')) || 0
  }
  const count = getGuessCount(i)
  const max = maxDistCount.value || 1
  return Math.round((count / max) * 100)
}

function distWidthComputed(i: number) {
  if (props.distWidth) return props.distWidth(i)
  return `${distPercent(i)}%`
}

// Highlight the most common guess in green
function distColor(i: number) {
  const count = getGuessCount(i)
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

.dist-fill {
  height: 20px;
  border-radius: 4px;
  background-color: var(--v-primary-base, #1976d2);
  transition: width 0.18s ease;
}

.dist-fill--success {
  background-color: var(--v-success-base, #2e7d32);
}

.dist-fill--primary {
  background-color: var(--v-primary-base, #1976d2);
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
