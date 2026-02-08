<script setup lang="ts">
const api = usePotionLedgerApi()

const quick = [
  {
    title: 'Plan your brew',
    icon: 'mdi-sitemap-outline',
    body: 'Orders have deadlines. Rare ingredients win games — spend them with intent.',
  },
  {
    title: 'Manage heat',
    icon: 'mdi-fire-alert',
    body: 'High heat makes precision potions fizzle. Stir to cool, dilute to stabilize.',
  },
  {
    title: 'Outrun the curse',
    icon: 'mdi-skull-outline',
    body: 'Mistakes increase the curse. Keep it low or volatile brews become doomed.',
  },
]
</script>

<template>
  <v-card class="pl-card pa-6" rounded="lg" elevation="1">
    <div class="pl-hero">
      <div class="pl-heroLeft">
        <div class="pl-heroBadge">
          <PotionLogo :variant="3" style="width:26px; height:26px" />
          <span>Daily run • deterministic strategy</span>
        </div>

        <h1 class="pl-heroTitle">Brew fast. Think ahead. Don’t get cursed.</h1>
        <p class="pl-heroSub">
          Potion Ledger is a tiny tactical game about deadlines, scarcity, and heat control.
          Your scores and testimonials are saved via your .NET API.
        </p>

        <div class="pl-actions">
          <v-btn color="primary" size="large" to="/play" prepend-icon="mdi-flask-outline">
            Start Today’s Run
          </v-btn>
          <v-btn variant="outlined" size="large" to="/leaderboard" prepend-icon="mdi-trophy-outline">
            Top Alchemists
          </v-btn>
          <v-btn variant="text" size="large" to="/testimonials" prepend-icon="mdi-comment-quote-outline">
            Read Reviews
          </v-btn>
        </div>

        <div class="pl-muted mt-3" style="font-size:.92rem">
          API base: <b>{{ api.baseURL }}</b>
        </div>
      </div>

      <div class="pl-heroRight">
        <div class="pl-orb">
          <PotionLogo :variant="2" class="pl-orbLogo" />
          <div class="pl-orbText">
            <div class="pl-orbLine"><span class="pl-dot" /> Heat &gt; threshold → fizzle</div>
            <div class="pl-orbLine"><span class="pl-dot" /> Late orders pay less</div>
            <div class="pl-orbLine"><span class="pl-dot" /> Curse rises on mistakes</div>
          </div>
        </div>
      </div>
    </div>

    <v-divider class="my-6" />

    <div class="pl-grid" style="grid-template-columns: 1fr;">
      <v-card
        v-for="c in quick"
        :key="c.title"
        class="pl-panel pa-4"
        variant="tonal"
      >
        <div class="d-flex align-center ga-3">
          <v-icon :icon="c.icon" />
          <div>
            <div style="font-weight:800">{{ c.title }}</div>
            <div class="pl-muted" style="margin-top:4px">{{ c.body }}</div>
          </div>
        </div>
      </v-card>
    </div>
  </v-card>
</template>

<style scoped>
.pl-hero {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
  align-items: center;
}

.pl-heroBadge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid rgba(190, 255, 199, 0.16);
  border-radius: 999px;
  background: rgba(16, 12, 24, 0.55);
  backdrop-filter: blur(8px);
  font-weight: 700;
  width: fit-content;
}

.pl-heroTitle {
  margin: 12px 0 6px;
  font-size: clamp(1.6rem, 3.6vw, 2.4rem);
  line-height: 1.15;
}

.pl-heroSub {
  margin: 0;
  color: var(--pl-muted);
  max-width: 56ch;
}

.pl-orb {
  position: relative;
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(183, 139, 255, 0.18);
  background:
    radial-gradient(500px 220px at 10% 10%, rgba(183, 139, 255, 0.14), transparent 60%),
    radial-gradient(500px 220px at 80% 40%, rgba(157, 255, 176, 0.12), transparent 60%),
    rgba(10, 8, 16, 0.45);
  overflow: hidden;
}

.pl-orb::after {
  content: "";
  position: absolute;
  inset: -60px;
  background: radial-gradient(180px 140px at 30% 40%, rgba(255,255,255,0.06), transparent 70%);
  filter: blur(8px);
  animation: pl-orbFog 9s ease-in-out infinite alternate;
  pointer-events: none;
}

.pl-orbLogo {
  width: 64px;
  height: 64px;
}

.pl-orbText {
  margin-top: 10px;
  display: grid;
  gap: 8px;
}

.pl-orbLine {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(245, 244, 255, 0.82);
}

.pl-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #9dffb0;
  box-shadow: 0 0 18px rgba(157, 255, 176, 0.35);
}

@keyframes pl-orbFog {
  from { transform: translate3d(-10px, -6px, 0) scale(1.03); }
  to   { transform: translate3d(14px, 10px, 0) scale(1.06); }
}

@media (min-width: 960px) {
  .pl-hero { grid-template-columns: 1.2fr 0.8fr; }
}
</style>
