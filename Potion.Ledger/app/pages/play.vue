<template>
  <v-container class="pl-play" fluid>
    <!-- Top controls -->
    <v-row class="mb-3" align="center" justify="space-between">
      <v-col cols="12" md="7" class="d-flex flex-wrap align-center ga-2">
        <v-btn
          :variant="mode === 'daily' ? 'flat' : 'tonal'"
          color="primary"
          size="small"
          @click="selectDaily"
          :disabled="loadingSeed"
        >
          Daily
        </v-btn>

        <v-btn
          :variant="mode === 'random' ? 'flat' : 'tonal'"
          color="primary"
          size="small"
          @click="selectRandom"
          :disabled="loadingSeed"
        >
          Random
        </v-btn>

        <v-divider vertical class="mx-2" />

        <v-text-field
          v-model="seedInput"
          label="Play a seed"
          placeholder="e.g. 12345"
          density="compact"
          hide-details
          style="max-width: 220px"
          :disabled="loadingSeed"
          @keyup.enter="applySeedInput"
        />

        <v-btn
          color="secondary"
          size="small"
          @click="applySeedInput"
          :disabled="loadingSeed"
        >
          Play Seed
        </v-btn>

        <v-chip v-if="seed" class="ml-1" size="small" label>
          Seed: {{ seed }}
        </v-chip>

        <v-chip v-if="mode === 'daily' && dailyDate" class="ml-1" size="small" label>
          Daily: {{ dailyDate }} (UTC)
        </v-chip>

        <v-btn
          variant="text"
          size="small"
          @click="copyShareLink"
          :disabled="!seed"
        >
          Copy link
        </v-btn>
      </v-col>

      <v-col cols="12" md="5" class="d-flex justify-end ga-2">
        <v-btn
          variant="tonal"
          size="small"
          @click="restartWithSameSeed"
          :disabled="!seed || loadingSeed"
        >
          Restart
        </v-btn>

        <v-btn
          color="primary"
          size="small"
          @click="newRandomNow"
          :disabled="loadingSeed"
        >
          New random
        </v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="seedError" type="error" variant="tonal" class="mb-3">
      {{ seedError }}
    </v-alert>

    <!-- Main game card -->
    <v-card class="pl-card" rounded="xl" elevation="8">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center ga-2">
          <span class="text-h6">Potion Ledger</span>
          <v-progress-circular v-if="loadingSeed" indeterminate size="18" width="2" />
        </div>
        <div class="d-flex align-center ga-2"></div>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <div v-if="!seed && !loadingSeed" class="text-body-1">
          Choose <b>Daily</b>, <b>Random</b>, or enter a seed to begin.
        </div>

        <div v-else class="pl-game">
          <v-row>
            <v-col cols="12" md="6">
              <v-card variant="tonal" rounded="lg" class="mb-3">
                <v-card-title class="text-subtitle-1">Starting Inventory</v-card-title>
                <v-card-text>
                  <div v-if="setup">
                    <div
                      v-for="(qty, key) in setup.invStart"
                      :key="key"
                      class="d-flex justify-space-between py-1"
                    >
                      <span class="text-body-2">{{ key }}</span>
                      <span class="text-body-2 font-weight-medium">{{ qty }}</span>
                    </div>
                  </div>
                  <div v-else class="text-body-2">No setup yet.</div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card variant="tonal" rounded="lg" class="mb-3">
                <v-card-title class="text-subtitle-1">Orders Preview</v-card-title>
                <v-card-text>
                  <div v-if="setup">
                    <div v-for="o in setup.ordersSeed.slice(0, 5)" :key="o.id" class="py-1">
                      <div class="d-flex justify-space-between">
                        <span class="text-body-2">{{ o.title }}</span>
                        <span class="text-body-2">+{{ o.reward }} / -{{ o.penalty }}</span>
                      </div>
                    </div>

                    <div class="text-caption mt-2 opacity-70">
                      Showing 5 of {{ setup.ordersSeed.length }} generated orders.
                    </div>
                  </div>
                  <div v-else class="text-body-2">No setup yet.</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <v-alert type="info" variant="tonal" class="mt-2">
            Replace the preview panels with your existing gameplay UI.
            The seed/setup logic is now wired and stable.
          </v-alert>
        </div>
      </v-card-text>
    </v-card>

    <!-- End-of-run dialog -->
    <v-dialog v-model="endDialog" max-width="640">
      <v-card rounded="xl">
        <v-card-title class="text-h6">
          {{ didWin ? "Victory!" : "Fizzle…" }}
        </v-card-title>

        <v-card-text>
          <div class="mb-3">
            <div class="text-body-2 opacity-80">
              Seed: <b>{{ seed }}</b>
            </div>
            <div class="text-body-2 opacity-80">
              Score: <b>{{ finalScore }}</b>
            </div>
          </div>

          <v-divider class="my-3" />

          <div class="text-subtitle-2 mb-2">Submit your score</div>
          <v-row>
            <v-col cols="12" md="7">
              <v-text-field
                v-model="playerName"
                label="Player name"
                maxlength="24"
                counter
                density="comfortable"
                :disabled="submittingScore"
              />
            </v-col>
            <v-col cols="12" md="5" class="d-flex align-end">
              <v-btn
                color="primary"
                block
                :loading="submittingScore"
                :disabled="!canSubmit"
                @click="submitRun"
              >
                Submit
              </v-btn>
            </v-col>
          </v-row>

          <v-alert v-if="submitResult" type="success" variant="tonal" class="mt-2">
            Submitted! All-time rank: <b>#{{ submitResult.allTimeRank }}</b>
          </v-alert>

          <v-alert v-if="submitError" type="error" variant="tonal" class="mt-2">
            {{ submitError }}
          </v-alert>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="tonal" @click="endDialog = false">Close</v-btn>
          <v-btn color="primary" @click="playAgain">Play again</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { createSetupFromSeed, type SeededSetup } from "@/utils/gameFromSeed";

type Mode = "daily" | "random";

const route = useRoute();
const router = useRouter();

const config = useRuntimeConfig();
const apiBase = String(config.public.apiBase || "").replace(/\/$/, "");

type DailySeedResponse = { date: string; seed: number };
type RandomSeedResponse = { seed: number };

// --- API calls (no composable dependency)
async function getDailySeed(): Promise<DailySeedResponse> {
  return await $fetch(`${apiBase}/api/seeds/daily`) as DailySeedResponse;
}

async function getRandomSeed(): Promise<RandomSeedResponse> {
  return await $fetch(`${apiBase}/api/seeds/random`) as RandomSeedResponse;
}

// If your API uses a different DTO shape, change these keys
type RunCreateRequest = {
  playerName: string;
  score: number;
  seed: number;
  mode: Mode;
  playedUtc: string;
};

type RunCreateResponse = { allTimeRank?: number; rank?: number };

async function postRun(payload: RunCreateRequest): Promise<RunCreateResponse> {
  return await $fetch(`${apiBase}/api/runs`, {
    method: "POST",
    body: payload,
  }) as RunCreateResponse;
}

const mode = ref<Mode>((route.query.mode as Mode) || "daily");
const seed = ref<number | null>(route.query.seed ? Number(route.query.seed) : null);
const dailyDate = ref<string | null>(null);

const seedInput = ref<string>("");

const setup = ref<SeededSetup | null>(null);
const loadingSeed = ref(false);
const seedError = ref<string | null>(null);

// End-of-run / submit
const endDialog = ref(false);
const didWin = ref(false);
const finalScore = ref<number>(0);

const playerName = ref<string>("");
const submittingScore = ref(false);
const submitResult = ref<{ allTimeRank: number } | null>(null);
const submitError = ref<string | null>(null);

const canSubmit = computed(() => {
  return !!seed.value && playerName.value.trim().length > 0 && !submittingScore.value;
});

// Seed helpers
function normalizeSeed(n: number): number | null {
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i === 0) return 1;
  return Math.abs(i);
}

async function setUrlQuery(next: { mode?: Mode; seed?: number | null }) {
  const q: Record<string, any> = { ...route.query };

  if (next.mode) q.mode = next.mode;
  if (next.seed !== undefined) {
    if (next.seed === null) delete q.seed;
    else q.seed = String(next.seed);
  }

  await router.replace({ query: q });
}

async function ensureSeedFromMode() {
  seedError.value = null;
  submitResult.value = null;
  submitError.value = null;

  if (seed.value && Number.isFinite(seed.value)) {
    startGameFromSeed(seed.value);
    return;
  }

  loadingSeed.value = true;
  try {
    if (mode.value === "random") {
      const res = await getRandomSeed();
      const s = normalizeSeed(res.seed);
      if (!s) throw new Error("Invalid seed from API.");
      seed.value = s;
      dailyDate.value = null;
    } else {
      const res = await getDailySeed();
      const s = normalizeSeed(res.seed);
      if (!s) throw new Error("Invalid daily seed from API.");
      seed.value = s;
      dailyDate.value = res.date;
    }

    await setUrlQuery({ mode: mode.value, seed: seed.value ?? null });
    startGameFromSeed(seed.value!);
  } catch (e: any) {
    seedError.value = e?.message ?? "Failed to load seed.";
  } finally {
    loadingSeed.value = false;
  }
}

function startGameFromSeed(s: number) {
  const norm = normalizeSeed(s);
  if (!norm) {
    seedError.value = "Seed must be a number.";
    return;
  }

  seed.value = norm;
  setup.value = createSetupFromSeed(norm);

  endDialog.value = false;
  submitResult.value = null;
  submitError.value = null;
}

async function applySeedInput() {
  const raw = seedInput.value.trim();
  const n = Number(raw);
  const norm = normalizeSeed(n);

  if (!raw || !norm) {
    seedError.value = "Please enter a valid numeric seed (e.g. 12345).";
    return;
  }

  mode.value = "random";
  dailyDate.value = null;
  seedError.value = null;

  seed.value = norm;
  await setUrlQuery({ mode: "random", seed: norm });
  startGameFromSeed(norm);
}

async function selectDaily() {
  mode.value = "daily";
  seed.value = null;
  dailyDate.value = null;
  await setUrlQuery({ mode: "daily", seed: null });
  await ensureSeedFromMode();
}

async function selectRandom() {
  mode.value = "random";
  seed.value = null;
  dailyDate.value = null;
  await setUrlQuery({ mode: "random", seed: null });
  await ensureSeedFromMode();
}

async function newRandomNow() {
  mode.value = "random";
  seed.value = null;
  dailyDate.value = null;
  await setUrlQuery({ mode: "random", seed: null });
  await ensureSeedFromMode();
}

function restartWithSameSeed() {
  if (!seed.value) return;
  startGameFromSeed(seed.value);
}

async function copyShareLink() {
  if (!seed.value) return;
  const url = new URL(window.location.href);
  url.searchParams.set("seed", String(seed.value));
  url.searchParams.set("mode", mode.value);
  await navigator.clipboard.writeText(url.toString());
}

// Submit
async function submitRun() {
  if (!seed.value) return;

  submittingScore.value = true;
  submitError.value = null;

  try {
    const res = await postRun({
      playerName: playerName.value.trim(),
      score: finalScore.value,
      seed: seed.value,
      mode: mode.value,
      playedUtc: new Date().toISOString(),
    });

    submitResult.value = { allTimeRank: res.allTimeRank ?? res.rank ?? 0 };
  } catch (e: any) {
    submitError.value = e?.message ?? "Failed to submit run.";
  } finally {
    submittingScore.value = false;
  }
}

function playAgain() {
  endDialog.value = false;
  submitResult.value = null;
  submitError.value = null;
  restartWithSameSeed();
}

// Boot sync with query params
watch(
  () => route.query,
  async (q) => {
    const qMode = (q.mode as Mode) || "daily";
    const qSeed = q.seed ? normalizeSeed(Number(q.seed)) : null;

    mode.value = qMode;
    seed.value = qSeed;

    if (qSeed) {
      dailyDate.value = null;
      startGameFromSeed(qSeed);
      return;
    }

    await ensureSeedFromMode();
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.pl-play {
  padding-bottom: 32px;
}

.pl-card {
  overflow: hidden;
}

.pl-game {
  min-height: 360px;
}
</style>
