<script setup lang="ts">
const drawer = ref(false)

const links = [
  { to: '/', label: 'Home', icon: 'mdi-home-variant-outline' },
  { to: '/play', label: 'Play', icon: 'mdi-flask-outline' },
  { to: '/leaderboard', label: 'Leaderboard', icon: 'mdi-trophy-outline' },
  { to: '/testimonials', label: 'Testimonials', icon: 'mdi-comment-quote-outline' },
]

function closeDrawer() {
  drawer.value = false
}
</script>

<template>
  <v-app>
    <v-app-bar height="64" flat class="pl-appbar">
      <v-app-bar-nav-icon class="d-sm-none" @click="drawer = !drawer" />

      <NuxtLink to="/" class="pl-brand" aria-label="Potion Ledger">
        <PotionLogo :variant="2" class="pl-brandLogo" />
        <div class="pl-brandText">
          <div class="pl-brandTitle">Potion Ledger</div>
          <div class="pl-brandSub d-none d-sm-block">Plan • Brew • Survive the curse</div>
        </div>
      </NuxtLink>

      <v-spacer />

      <div class="d-none d-sm-flex ga-2">
        <v-btn
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          variant="text"
          class="pl-navBtn"
          :prepend-icon="l.icon"
        >
          {{ l.label }}
        </v-btn>
      </div>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      location="left"
      temporary
      class="pl-drawer"
    >
      <div class="pa-4 d-flex align-center ga-3">
        <PotionLogo :variant="1" style="width:40px; height:40px" />
        <div>
          <div class="pl-brandTitle" style="font-size: 1rem">Potion Ledger</div>
          <div class="pl-muted" style="font-size:.85rem">Navigate</div>
        </div>
      </div>
      <v-divider />
      <v-list nav density="comfortable">
        <v-list-item
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          @click="closeDrawer"
          :prepend-icon="l.icon"
          :title="l.label"
        />
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container class="pl-container py-6">
        <NuxtPage />
      </v-container>
    </v-main>

    <v-footer app class="pl-footer">
      <div class="d-flex flex-wrap align-center justify-space-between w-100">
        <div class="pl-muted">© {{ new Date().getFullYear() }} Potion Ledger</div>
        <div class="pl-muted">Made with Nuxt + .NET + Azure</div>
      </div>
    </v-footer>
  </v-app>
</template>

<style scoped>
.pl-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
}

.pl-brandLogo {
  width: 34px;
  height: 34px;
}

.pl-brandText { line-height: 1.1; }
.pl-brandTitle { font-weight: 900; letter-spacing: 0.3px; }
.pl-brandSub { margin-top: 2px; }
</style>
