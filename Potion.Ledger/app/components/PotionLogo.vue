<script setup lang="ts">
const props = withDefaults(defineProps<{ variant?: 1 | 2 | 3 }>(), {
  variant: 1,
})

// Three distinct, "hip" logos (extra credit):
// 1) Hex flask
// 2) Moon flask
// 3) Rune seal
const v = computed(() => props.variant)
</script>

<template>
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="pl-logo"
    role="img"
    aria-label="Potion Ledger logo"
  >
    <defs>
      <linearGradient id="g1" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
        <stop stop-color="#B78BFF" />
        <stop offset="1" stop-color="#9DFFB0" />
      </linearGradient>
      <linearGradient id="g2" x1="20" y1="6" x2="44" y2="60" gradientUnits="userSpaceOnUse">
        <stop stop-color="#9DFFB0" />
        <stop offset="1" stop-color="#FFD56B" />
      </linearGradient>
      <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(32 36) rotate(90) scale(26)">
        <stop stop-color="#9DFFB0" stop-opacity="0.25" />
        <stop offset="1" stop-color="#000" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- Ambient glow -->
    <circle cx="32" cy="36" r="26" fill="url(#glow)" />

    <!-- Variant 1: Hex Flask -->
    <g v-if="v === 1">
      <path
        d="M26 10h12v6l-3 3v9c0 3 2 5 4 7 3 3 6 7 6 12 0 8-6 13-13 13S19 55 19 47c0-5 3-9 6-12 2-2 4-4 4-7v-9l-3-3v-6Z"
        stroke="url(#g1)"
        stroke-width="3"
        stroke-linejoin="round"
      />
      <path
        d="M24 44c2-4 6-7 8-7 3 0 6 2 8 7"
        stroke="#F5F4FF"
        stroke-opacity="0.55"
        stroke-width="2"
        stroke-linecap="round"
      />
      <circle cx="26" cy="47" r="2" fill="#9DFFB0" />
      <circle cx="38" cy="49" r="2" fill="#B78BFF" />
    </g>

    <!-- Variant 2: Moon Flask -->
    <g v-else-if="v === 2">
      <path
        d="M26 8h12v7l-3 3v8c0 2 1 4 3 6 4 4 8 8 8 15 0 10-8 15-14 15S18 57 18 47c0-7 4-11 8-15 2-2 3-4 3-6v-8l-3-3V8Z"
        stroke="url(#g2)"
        stroke-width="3"
        stroke-linejoin="round"
      />
      <path
        d="M44 18c-3 2-8 2-10-2 0 6 4 9 10 10-3 2-7 2-10-1"
        stroke="#B78BFF"
        stroke-opacity="0.8"
        stroke-width="2"
        stroke-linecap="round"
      />
      <path
        d="M24 46c3-3 5-4 8-4 4 0 7 2 8 5"
        stroke="#F5F4FF"
        stroke-opacity="0.55"
        stroke-width="2"
        stroke-linecap="round"
      />
      <circle cx="22" cy="26" r="2" fill="#FFD56B" />
      <circle cx="42" cy="32" r="2" fill="#9DFFB0" />
    </g>

    <!-- Variant 3: Rune Seal -->
    <g v-else>
      <path
        d="M32 8l18 10v18L32 56 14 36V18L32 8Z"
        stroke="url(#g1)"
        stroke-width="3"
        stroke-linejoin="round"
      />
      <path
        d="M32 18v28"
        stroke="#F5F4FF"
        stroke-opacity="0.55"
        stroke-width="2"
        stroke-linecap="round"
      />
      <path
        d="M24 26h16"
        stroke="#9DFFB0"
        stroke-opacity="0.85"
        stroke-width="2"
        stroke-linecap="round"
      />
      <path
        d="M24 38h16"
        stroke="#B78BFF"
        stroke-opacity="0.85"
        stroke-width="2"
        stroke-linecap="round"
      />
      <circle cx="32" cy="32" r="4" fill="url(#g2)" />
    </g>
  </svg>
</template>

<style scoped>
.pl-logo {
  display: block;
  filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.35));
  animation: pl-logoFloat 4.2s ease-in-out infinite;
}

@keyframes pl-logoFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-2px); }
}
</style>
