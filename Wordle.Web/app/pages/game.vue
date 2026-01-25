<template>
  <v-container class="wordle-page">
    <v-card class="mx-auto wordle-card" elevation="6">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="wordle-title-wrap">
          <div class="wordle-game-title">Wordle for Cool Kids</div>
          <div class="wordle-game-subtitle">
            <span v-if="mode === 'daily'">Daily • {{ todayKey }}</span>
            <span v-else>Random</span>
          </div>
        </div>

        <div class="wordle-top-actions">
          <v-btn size="small" variant="tonal" @click="openStats = true">Stats</v-btn>
          <v-btn size="small" variant="tonal" @click="giveHint" :disabled="gameOver">
            Hint
          </v-btn>
        </div>
      </v-card-title>

      <v-card-text>
        <WordleBoard
          :board="board"
          :word-len="WORD_LEN"
          :max-guesses="MAX_GUESSES"
          :shake-row-index="shakeRowIndex"
          :cell-class="cellClass"
        />

        <div class="wordle-status-area">
          <div class="wordle-status-line" role="status" aria-live="polite">
            {{ statusMessage }}
          </div>

          <div v-if="hintText" class="wordle-hint-line">
            {{ hintText }}
          </div>

          <div v-if="won && definition" class="wordle-definition">
            <div class="wordle-definition-title">Definition</div>
            <div class="wordle-definition-body">{{ definition }}</div>
            <div v-if="definitionSource" class="wordle-definition-source">
              Source: {{ definitionSource }}
            </div>
          </div>
        </div>

        <div class="wordle-controls">
          <v-btn
            v-if="mode === 'daily' && dailyAlreadyFinished"
            variant="flat"
            color="primary"
            @click="startRandom"
          >
            Play Random
          </v-btn>

          <v-btn v-else-if="gameOver" variant="flat" color="primary" @click="startRandom">
            New Random Game
          </v-btn>

          <v-btn v-if="mode === 'random'" variant="tonal" @click="startDaily">
            Go to Daily
          </v-btn>
        </div>

        <WordleKeyboard :key-class="keyClass" @key="onKey" />
      </v-card-text>
    </v-card>

    <WordleStatsDialog
      v-model="openStats"
      :stats="stats"
      :win-percent="winPercent"
      :avg-guesses-to-win="avgGuessesToWin"
      :daily-played-today="dailyPlayedToday"
      :max-guesses="MAX_GUESSES"
      :dist-width="distWidth"
    />
  </v-container>
</template>

<script setup lang="ts">
import WordleBoard from '../components/wordle/WordleBoard.vue'
import WordleKeyboard from '../components/wordle/WordleKeyboard.vue'
import WordleStatsDialog from '../components/wordle/WordleStatsDialog.vue'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useWordleGame } from '../composables/useWordleGame'

const {
  WORD_LEN,
  MAX_GUESSES,

  mode,
  board,
  shakeRowIndex,

  gameOver,
  won,
  statusMessage,
  hintText,

  definition,
  definitionSource,

  stats,
  todayKey,
  dailyPlayedToday,
  dailyAlreadyFinished,
  winPercent,
  avgGuessesToWin,

  startDaily,
  startRandom,
  typeLetter,
  backspace,
  submitGuess,
  giveHint,

  cellClass,
  keyClass,
  distWidth,
} = useWordleGame()

const openStats = ref(false)

function onKey(k: string) {
  if (k === 'ENTER') return submitGuess()
  if (k === 'BACKSPACE') return backspace()
  if (/^[A-Z]$/.test(k)) return typeLetter(k)
}

// Physical keyboard support
function onKeydown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey) return

  if (e.key === 'Enter') {
    e.preventDefault()
    onKey('ENTER')
    return
  }
  if (e.key === 'Backspace') {
    e.preventDefault()
    onKey('BACKSPACE')
    return
  }

  const ch = e.key.toUpperCase()
  if (/^[A-Z]$/.test(ch)) {
    e.preventDefault()
    onKey(ch)
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  startDaily()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>
