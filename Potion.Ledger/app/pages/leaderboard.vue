<script setup lang="ts">
import type { LeaderboardResponse } from "~/composables/usePotionLedgerRun"

const api = usePotionLedgerApi()

const loading = ref(true)
const error = ref<string | null>(null)
const data = ref<LeaderboardResponse | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    data.value = await api.getLeaderboardAllTime()
  } catch (e: any) {
    error.value = e?.data || e?.message || "Failed to load leaderboard."
  } finally {
    loading.value = false
  }
}

onMounted(load)

function fmtUtc(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}
</script>

<template>
  <v-card class="pl-card pa-4" rounded="lg" elevation="1">
    <div class="pl-row">
      <div>
        <h1 class="pl-title d-flex align-center ga-2">
          <v-icon icon="mdi-trophy" />
          Top Alchemists
        </h1>
        <p class="pl-sub">
          Top 10 runs (all time) • Powered by your API
          <span class="pl-muted">({{ api.baseURL }})</span>
        </p>
      </div>

      <div class="pl-actions">
        <v-btn variant="outlined" to="/play">Play</v-btn>
        <v-btn variant="outlined" to="/testimonials">Testimonials</v-btn>
        <v-btn color="primary" variant="flat" @click="load">Refresh</v-btn>
      </div>
    </div>

    <v-divider class="my-4" />

    <div v-if="loading">
      <div class="d-flex align-center ga-3 mb-3">
        <v-progress-circular indeterminate />
        <span class="pl-muted">Summoning scores…</span>
      </div>
      <v-skeleton-loader type="heading" class="mb-3" />
      <v-skeleton-loader type="table" />
    </div>

    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <template v-else>
      <div class="pl-muted mb-3">
        Generated: <b>{{ data?.generatedUtc ? fmtUtc(data.generatedUtc) : "—" }}</b>
      </div>

      <v-table density="comfortable" class="pl-table">
        <thead>
          <tr>
            <th style="width: 84px;">Rank</th>
            <th>Player</th>
            <th style="width: 110px;">Score</th>
            <th style="width: 120px;">Turns</th>
            <th style="width: 120px;">Fizzles</th>
            <th style="width: 220px;">When</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, idx) in (data?.entries || [])" :key="r.id">
            <td>
              <v-chip size="small" variant="tonal" color="secondary">
                #{{ idx + 1 }}
              </v-chip>
            </td>
            <td>
              <b>{{ r.playerName }}</b>
            </td>
            <td>
              <v-chip size="small" variant="flat" color="primary">{{ r.score }}</v-chip>
            </td>
            <td>{{ r.turnsUsed }}</td>
            <td>{{ r.fizzles }}</td>
            <td class="pl-muted">{{ fmtUtc(r.createdUtc) }}</td>
          </tr>

          <tr v-if="(data?.entries?.length || 0) === 0">
            <td colspan="6" class="pl-muted">No runs yet. Play a round and submit your score!</td>
          </tr>
        </tbody>
      </v-table>

      <v-divider class="my-4" />

      <div class="pl-muted">
        Tip: Submit your score from the end-of-run modal on <b>/play</b>.
      </div>
    </template>
  </v-card>
</template>
