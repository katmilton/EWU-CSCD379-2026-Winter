<template>
  <div class="wordle-board">
    <div class="board" :style="{ '--cols': wordLen }">
      <div
        v-for="r in maxGuesses"
        :key="'row-' + r"
        class="row"
        :class="{ shake: shakeRowIndex === r - 1 }"
      >
        <div
          v-for="c in wordLen"
          :key="'cell-' + r + '-' + c"
          class="cell"
          :class="cellClass(r - 1, c - 1)"
        >
          {{ board[r - 1]?.[c - 1] || '' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  board: string[][]
  wordLen: number
  maxGuesses: number
  shakeRowIndex: number | null
  cellClass: (r: number, c: number) => Record<string, boolean>
}>()
</script>
