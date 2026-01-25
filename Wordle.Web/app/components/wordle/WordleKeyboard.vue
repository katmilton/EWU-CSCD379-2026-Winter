<template>
  <div class="wordle-keyboard">
    <div class="keyboard" aria-label="On-screen keyboard">
      <div class="kb-row">
        <button
          v-for="k in row1"
          :key="'k1-' + k"
          class="kb-key"
          :class="keyClass(k)"
          @click="handleClick(k)"
          :aria-label="'Key ' + k"
        >
          {{ k }}
        </button>
      </div>

      <div class="kb-row">
        <div class="kb-spacer" />
        <button
          v-for="k in row2"
          :key="'k2-' + k"
          class="kb-key"
          :class="keyClass(k)"
          @click="handleClick(k)"
          :aria-label="'Key ' + k"
        >
          {{ k }}
        </button>
        <div class="kb-spacer" />
      </div>

      <div class="kb-row">
        <button class="kb-key kb-key-wide kb-fn" @click="handleClick('ENTER')" aria-label="Enter">
          Enter
        </button>

        <button
          v-for="k in row3"
          :key="'k3-' + k"
          class="kb-key"
          :class="keyClass(k)"
          @click="handleClick(k)"
          :aria-label="'Key ' + k"
        >
          {{ k }}
        </button>

        <button
          class="kb-key kb-key-wide kb-fn"
          @click="handleClick('BACKSPACE')"
          aria-label="Backspace"
        >
          ⌫
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  keyClass: (k: string) => Record<string, boolean>
}>()

const emit = defineEmits<{ (e: 'key', k: string): void }>()

const row1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']
const row2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L']
const row3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M']

let audioCtx: AudioContext | null = null

function ensureAudioContext() {
  if (audioCtx) return
  try {
    const C = (window as any).AudioContext || (window as any).webkitAudioContext
    audioCtx = new C()
  } catch (e) {
    audioCtx = null
  }
}

function playClick() {
  try {
    ensureAudioContext()
    if (!audioCtx) return
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})

    const now = audioCtx.currentTime
    const o = audioCtx.createOscillator()
    const g = audioCtx.createGain()
    o.type = 'square'
    o.frequency.value = 1000
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(0.25, now + 0.001)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.06)
    o.connect(g)
    g.connect(audioCtx.destination)
    o.start(now)
    o.stop(now + 0.07)
  } catch (e) {
    // fail silently if audio not supported
  }
}

function handleClick(k: string) {
  playClick()
  emit('key', k)
}
</script>

