<template>
  <v-container class="wordle-page">
    <WinCelebration v-if="showCelebration" @closed="showCelebration = false" :duration="3000" />
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
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useWordleGame } from '../composables/useWordleGame'
import WinCelebration from '../components/wordle/WinCelebration.vue'

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
const showCelebration = ref(false)

// Lazy WebAudio for key clicks (created on first user interaction)
let audioCtx: AudioContext | null = null
function ensureAudio() {
  if (audioCtx) return audioCtx
  try {
    const A = window.AudioContext || (window as any).webkitAudioContext
    audioCtx = new (A)()
  } catch {
    audioCtx = null
  }
  return audioCtx
}

function playKeySound() {
  const ctx = ensureAudio()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'square'
  o.frequency.value = 700
  g.gain.value = 0.0001
  o.connect(g)
  g.connect(ctx.destination)
  const now = ctx.currentTime
  g.gain.setValueAtTime(0.0001, now)
  g.gain.exponentialRampToValueAtTime(0.2, now + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.09)
  o.start(now)
  o.stop(now + 0.1)
}

watch(won, (v) => {
  if (v) showCelebration.value = true
})

function onKey(k: string) {
  // play click immediately (non-blocking)
  try { playKeySound() } catch {}
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
