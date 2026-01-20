<template>
  <div class="wordle-keyboard">
    <div class="keyboard" aria-label="On-screen keyboard">
      <div class="kb-row">
        <button
          v-for="k in row1"
          :key="'k1-' + k"
          class="kb-key"
          :class="keyClass(k)"
          @click="$emit('key', k)"
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
          @click="$emit('key', k)"
          :aria-label="'Key ' + k"
        >
          {{ k }}
        </button>
        <div class="kb-spacer" />
      </div>

      <div class="kb-row">
        <button class="kb-key kb-key-wide kb-fn" @click="$emit('key', 'ENTER')" aria-label="Enter">
          Enter
        </button>

        <button
          v-for="k in row3"
          :key="'k3-' + k"
          class="kb-key"
          :class="keyClass(k)"
          @click="$emit('key', k)"
          :aria-label="'Key ' + k"
        >
          {{ k }}
        </button>

        <button
          class="kb-key kb-key-wide kb-fn"
          @click="$emit('key', 'BACKSPACE')"
          aria-label="Backspace"
        >
          ⌫
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  keyClass: (k: string) => Record<string, boolean>
}>()

defineEmits<{ (e: 'key', k: string): void }>()

const row1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']
const row2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L']
const row3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
</script>

