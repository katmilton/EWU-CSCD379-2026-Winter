<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { createSetupFromSeed, type IngredientKey, type PotionType, type SeededSetup, type SeededOrder } from "@/utils/gameFromSeed"

type Mode = "daily" | "random"

const route = useRoute()
const router = useRouter()

const config = useRuntimeConfig()
const apiBase = String(config.public.apiBase || "").replace(/\/+$/, "")

type DailySeedResponse = { date: string; seed: number }
type RandomSeedResponse = { seed: number }

async function getDailySeed(): Promise<DailySeedResponse> {
  return (await $fetch(`${apiBase}/api/seeds/daily`)) as DailySeedResponse
}
async function getRandomSeed(): Promise<RandomSeedResponse> {
  return (await $fetch(`${apiBase}/api/seeds/random`)) as RandomSeedResponse
}

type RunCreateRequest = {
  playerName: string
  score: number
  turnsUsed: number
  fizzles: number
  seed: number
  mode: Mode
  playedUtc: string
}
type RunCreateResponse = { allTimeRank?: number; rank?: number }

async function postRun(payload: RunCreateRequest): Promise<RunCreateResponse> {
  return (await $fetch(`${apiBase}/api/runs`, { method: "POST", body: payload })) as RunCreateResponse
}

// ----- difficulty
const turnsMax = 8
const targetScore = 190

const heatMax = 12
const baseStability = 2
const fizzleLimit = 2

const typeRiskThreshold: Record<PotionType, number> = {
  stable: 7,
  precision: 5,
  volatile: 3,
}

const curseMax = 6

function payoutMultiplier(turn: number, deadlineTurn: number) {
  const lateBy = Math.max(0, turn - deadlineTurn)
  const multiplier = Math.max(0.4, 1 - 0.15 * lateBy)
  return { lateBy, multiplier }
}

// ----- seed state
const mode = ref<Mode>((route.query.mode as Mode) || "daily")
const seed = ref<number | null>(route.query.seed ? Number(route.query.seed) : null)
const dailyDate = ref<string | null>(null)
const seedInput = ref("")

const loadingSeed = ref(false)
const seedError = ref<string | null>(null)

function normalizeSeed(n: number): number | null {
  if (!Number.isFinite(n)) return null
  const i = Math.trunc(n)
  if (i === 0) return 1
  return Math.abs(i)
}

async function setUrlQuery(next: { mode?: Mode; seed?: number | null }) {
  const q: Record<string, any> = { ...route.query }
  if (next.mode) q.mode = next.mode
  if (next.seed !== undefined) {
    if (next.seed === null) delete q.seed
    else q.seed = String(next.seed)
  }
  await router.replace({ query: q })
}

async function ensureSeedFromMode() {
  seedError.value = null

  if (seed.value && Number.isFinite(seed.value)) {
    startGameFromSeed(seed.value)
    return
  }

  loadingSeed.value = true
  try {
    if (mode.value === "random") {
      const res = await getRandomSeed()
      const s = normalizeSeed(res.seed)
      if (!s) throw new Error("Invalid seed from API.")
      seed.value = s
      dailyDate.value = null
    } else {
      const res = await getDailySeed()
      const s = normalizeSeed(res.seed)
      if (!s) throw new Error("Invalid daily seed from API.")
      seed.value = s
      dailyDate.value = res.date
    }

    await setUrlQuery({ mode: mode.value, seed: seed.value ?? null })
    startGameFromSeed(seed.value!)
  } catch (e: any) {
    seedError.value = e?.message ?? "Failed to load seed."
  } finally {
    loadingSeed.value = false
  }
}

async function selectDaily() {
  mode.value = "daily"
  seed.value = null
  dailyDate.value = null
  await setUrlQuery({ mode: "daily", seed: null })
  await ensureSeedFromMode()
}

async function selectRandom() {
  mode.value = "random"
  seed.value = null
  dailyDate.value = null
  await setUrlQuery({ mode: "random", seed: null })
  await ensureSeedFromMode()
}

async function newRandomNow() {
  mode.value = "random"
  seed.value = null
  dailyDate.value = null
  await setUrlQuery({ mode: "random", seed: null })
  await ensureSeedFromMode()
}

async function applySeedInput() {
  const raw = seedInput.value.trim()
  const n = Number(raw)
  const norm = normalizeSeed(n)

  if (!raw || !norm) {
    seedError.value = "Please enter a valid numeric seed (e.g. 12345)."
    return
  }

  mode.value = "random"
  dailyDate.value = null
  seedError.value = null

  seed.value = norm
  await setUrlQuery({ mode: "random", seed: norm })
  startGameFromSeed(norm)
}

async function copyShareLink() {
  if (!seed.value) return
  const url = new URL(window.location.href)
  url.searchParams.set("seed", String(seed.value))
  url.searchParams.set("mode", mode.value)
  await navigator.clipboard.writeText(url.toString())
}

// ----- gameplay state
const setup = ref<SeededSetup | null>(null)

const inventory = reactive<Record<IngredientKey, number>>({
  herb: 0,
  essence: 0,
  ember: 0,
  crystal: 0,
})

const orders = ref<SeededOrder[]>([])
const turn = ref(1)
const score = ref(0)
const fizzles = ref(0)
const log = ref<string[]>([])

const heat = ref(0)
const stability = ref(baseStability)
const curse = ref(0)

const finished = ref(false)
const outcome = ref<"win" | "loss" | null>(null)
const endReason = ref("")

// popup submit
const endDialog = ref(false)
const playerName = ref("")
const submittingScore = ref(false)
const submitError = ref<string | null>(null)
const submitResult = ref<{ allTimeRank: number } | null>(null)

// ✅ HELP MODAL
const rulesOpen = ref(false)

function startGameFromSeed(s: number) {
  const norm = normalizeSeed(s)
  if (!norm) {
    seedError.value = "Seed must be a number."
    return
  }

  seed.value = norm
  setup.value = createSetupFromSeed(norm)

  inventory.herb = setup.value.invStart.herb
  inventory.essence = setup.value.invStart.essence
  inventory.ember = setup.value.invStart.ember
  inventory.crystal = setup.value.invStart.crystal

  orders.value = [...setup.value.ordersSeed]

  turn.value = 1
  score.value = 0
  fizzles.value = 0
  log.value = []
  heat.value = 0
  stability.value = baseStability
  curse.value = 0

  finished.value = false
  outcome.value = null
  endReason.value = ""

  endDialog.value = false
  playerName.value = ""
  submittingScore.value = false
  submitError.value = null
  submitResult.value = null
}

function restartWithSameSeed() {
  if (!seed.value) return
  startGameFromSeed(seed.value)
}

function potionTypeLabel(t: PotionType) {
  if (t === "stable") return "Stable"
  if (t === "precision") return "Precision"
  return "Volatile"
}
function potionTypeColor(t: PotionType) {
  if (t === "stable") return "success"
  if (t === "precision") return "info"
  return "error"
}

function canPayReq(o: SeededOrder) {
  return (Object.keys(o.req) as IngredientKey[]).every((k) => inventory[k] >= o.req[k])
}

function riskThresholdFor(o: SeededOrder) {
  const curseTax = Math.floor(curse.value / 2)
  return typeRiskThreshold[o.type] + stability.value - curseTax
}

function cursedAutoFail(o: SeededOrder) {
  if (curse.value >= 3 && o.type === "volatile" && heat.value > 2) return true
  return false
}

function willFizzle(o: SeededOrder) {
  if (cursedAutoFail(o)) return true
  return heat.value > riskThresholdFor(o)
}

const anyBrewableOrder = computed(() => orders.value.some((o) => canPayReq(o)))
const progressText = computed(() => `${score.value} / ${targetScore}`)
const displayTurn = computed(() => Math.min(turn.value, turnsMax))

function endRun(type: "win" | "loss", reason: string) {
  finished.value = true
  outcome.value = type
  endReason.value = reason
  endDialog.value = true
}

function checkEnd() {
  if (finished.value) return
  if (score.value >= targetScore) return endRun("win", "Target score reached.")
  if (fizzles.value >= fizzleLimit) return endRun("loss", `Too many fizzles (≥ ${fizzleLimit}).`)
  if (turn.value > turnsMax) return endRun("loss", "Out of turns.")
  if (curse.value >= curseMax) return endRun("loss", "The curse consumed your ledger.")
}

function nextTurn() {
  if (finished.value) return

  if (turn.value >= turnsMax) {
    turn.value = turnsMax + 1
    checkEnd()
    return
  }

  if (heat.value > 0) heat.value = Math.max(0, heat.value - 1)

  turn.value += 1

  if (turn.value >= 5) curse.value = Math.min(curseMax, curse.value + 1)

  log.value.unshift(`Turn ${turn.value} begins...`)

  if (!anyBrewableOrder.value && curse.value >= curseMax) {
    return endRun("loss", "No brewable orders left. The curse consumed your ledger.")
  }

  checkEnd()
}

function stir() {
  if (finished.value) return
  heat.value = Math.max(0, heat.value - 3)
  log.value.unshift(`You stir the cauldron. Heat reduced to ${heat.value}.`)
}

function restock() {
  if (finished.value) return
  inventory.herb += 1
  inventory.essence += 1
  inventory.ember += 1
  inventory.crystal += 1
  curse.value = Math.min(curseMax, curse.value + 1)
  log.value.unshift("You restock supplies (+1 each). The curse deepens...")
  checkEnd()
}

function brew(o: SeededOrder) {
  if (finished.value) return
  if (!canPayReq(o)) return

  for (const k of Object.keys(o.req) as IngredientKey[]) inventory[k] -= o.req[k]
  heat.value = Math.min(heatMax, heat.value + o.heatOnBrew)

  const fizzle = willFizzle(o)
  const { lateBy, multiplier } = payoutMultiplier(turn.value, o.deadlineTurn)
  let payout = Math.round(o.reward * multiplier)

  if (!fizzle && curse.value >= 5 && o.type === "precision") payout = Math.max(0, payout - 10)

  if (fizzle) {
    fizzles.value += 1
    curse.value = Math.min(curseMax, curse.value + 1)
    log.value.unshift(`💥 FIZZLE! "${o.title}" failed. Curse rises to ${curse.value}.`)
  } else {
    score.value += payout
    if (lateBy > 0) {
      curse.value = Math.min(curseMax, curse.value + 1)
      log.value.unshift(`✅ Brewed late by ${lateBy}. Earned ${payout}. Curse rises to ${curse.value}.`)
    } else {
      log.value.unshift(`✅ Brewed "${o.title}". Earned ${payout}.`)
    }
  }

  orders.value = orders.value.filter((x) => x.id !== o.id)
  checkEnd()
}

// submit
const canSubmit = computed(() => {
  const name = playerName.value.trim()
  return !!seed.value && name.length > 0 && name.length <= 24 && !submittingScore.value
})

async function submitRun() {
  if (!seed.value) return
  submitError.value = null
  submitResult.value = null
  submittingScore.value = true

  try {
    const res = await postRun({
      playerName: playerName.value.trim(),
      score: score.value,
      turnsUsed: Math.min(turn.value, turnsMax),
      fizzles: fizzles.value,
      seed: seed.value,
      mode: mode.value,
      playedUtc: new Date().toISOString(),
    })
    submitResult.value = { allTimeRank: res.allTimeRank ?? res.rank ?? 0 }
  } catch (e: any) {
    submitError.value = e?.data || e?.message || "Failed to submit run."
  } finally {
    submittingScore.value = false
  }
}

async function playAgain() {
  endDialog.value = false
  submitError.value = null
  submitResult.value = null

  // ✅ If you WIN the DAILY, default to RANDOM next
  if (outcome.value === "win" && mode.value === "daily") {
    mode.value = "random"
    seed.value = null
    dailyDate.value = null
    await setUrlQuery({ mode: "random", seed: null })
    await ensureSeedFromMode()
    return
  }

  restartWithSameSeed()
}

watch(
  () => route.query,
  async (q) => {
    const qMode = (q.mode as Mode) || "daily"
    const qSeed = q.seed ? normalizeSeed(Number(q.seed)) : null

    mode.value = qMode
    seed.value = qSeed

    if (qSeed) {
      dailyDate.value = null
      startGameFromSeed(qSeed)
      return
    }

    await ensureSeedFromMode()
  },
  { immediate: true }
)
</script>

<template>
  <v-container class="pl-play" fluid>
    <v-row class="mb-3" align="center" justify="space-between">
      <v-col cols="12" md="7" class="d-flex flex-wrap align-center ga-2">
        <v-btn :variant="mode === 'daily' ? 'flat' : 'tonal'" color="primary" size="small" @click="selectDaily" :disabled="loadingSeed">
          Daily
        </v-btn>

        <v-btn :variant="mode === 'random' ? 'flat' : 'tonal'" color="primary" size="small" @click="selectRandom" :disabled="loadingSeed">
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

        <v-btn color="secondary" size="small" @click="applySeedInput" :disabled="loadingSeed">
          Play Seed
        </v-btn>

        <v-chip v-if="seed" class="ml-1" size="small" label>Seed: {{ seed }}</v-chip>

        <v-chip v-if="mode === 'daily' && dailyDate" class="ml-1" size="small" label>
          Daily: {{ dailyDate }} (UTC)
        </v-chip>

        <v-btn variant="text" size="small" @click="copyShareLink" :disabled="!seed">
          Copy link
        </v-btn>
      </v-col>

      <v-col cols="12" md="5" class="d-flex justify-end ga-2">
        <v-btn variant="tonal" size="small" @click="restartWithSameSeed" :disabled="!seed || loadingSeed">
          Restart
        </v-btn>

        <v-btn color="primary" size="small" @click="newRandomNow" :disabled="loadingSeed">
          New random
        </v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="seedError" type="error" variant="tonal" class="mb-3">{{ seedError }}</v-alert>

    <v-card class="pl-card" rounded="xl" elevation="8">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center ga-2">
          <span class="text-h6">Potion Ledger</span>
          <v-progress-circular v-if="loadingSeed" indeterminate size="18" width="2" />
        </div>

        <div class="d-flex align-center ga-2">
          <v-chip size="small" variant="tonal" color="secondary">
            Turn {{ Math.min(turn, turnsMax) }} / {{ turnsMax }}
          </v-chip>

          <v-tooltip text="How to play">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                icon="mdi-help-circle-outline"
                variant="text"
                size="small"
                @click="rulesOpen = true"
              />
            </template>
          </v-tooltip>
        </div>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <div v-if="!seed && !loadingSeed" class="text-body-1">
          Choose <b>Daily</b>, <b>Random</b>, or enter a seed to begin.
        </div>

        <template v-else>
          <v-row class="mb-3" dense>
            <v-col cols="12" md="4">
              <v-card variant="tonal" rounded="lg" class="pa-3">
                <div class="d-flex justify-space-between align-center">
                  <div class="text-subtitle-2">Score</div>
                  <v-chip size="small" color="primary" variant="flat">{{ progressText }}</v-chip>
                </div>
                <v-progress-linear :model-value="(score / targetScore) * 100" class="mt-2" height="10" rounded />
              </v-card>
            </v-col>

            <v-col cols="12" md="4">
              <v-card variant="tonal" rounded="lg" class="pa-3">
                <div class="d-flex justify-space-between align-center">
                  <div class="text-subtitle-2">Heat</div>
                  <v-chip size="small" :color="heat > 7 ? 'error' : heat > 4 ? 'warning' : 'success'" variant="tonal">
                    {{ heat }} / {{ heatMax }}
                  </v-chip>
                </div>
                <v-progress-linear :model-value="(heat / heatMax) * 100" class="mt-2" height="10" rounded />
              </v-card>
            </v-col>

            <v-col cols="12" md="4">
              <v-card variant="tonal" rounded="lg" class="pa-3">
                <div class="d-flex justify-space-between align-center">
                  <div class="text-subtitle-2">Curse</div>
                  <v-chip size="small" :color="curse >= 5 ? 'error' : curse >= 3 ? 'warning' : 'info'" variant="tonal">
                    {{ curse }} / {{ curseMax }}
                  </v-chip>
                </div>
                <v-progress-linear :model-value="(curse / curseMax) * 100" class="mt-2" height="10" rounded />
              </v-card>
            </v-col>
          </v-row>

          <v-card variant="tonal" rounded="lg" class="pa-3 mb-3">
            <div class="text-subtitle-2 mb-2">Inventory</div>
            <div class="d-flex flex-wrap ga-2">
              <v-chip color="success" variant="tonal">Herb: <b class="ml-1">{{ inventory.herb }}</b></v-chip>
              <v-chip color="info" variant="tonal">Essence: <b class="ml-1">{{ inventory.essence }}</b></v-chip>
              <v-chip color="warning" variant="tonal">Ember: <b class="ml-1">{{ inventory.ember }}</b></v-chip>
              <v-chip color="secondary" variant="tonal">Crystal: <b class="ml-1">{{ inventory.crystal }}</b></v-chip>
              <v-chip :color="fizzles >= 1 ? 'warning' : 'info'" variant="tonal">Fizzles: <b class="ml-1">{{ fizzles }} / {{ fizzleLimit }}</b></v-chip>
            </div>
            <div v-if="!anyBrewableOrder && !finished" class="text-caption mt-2 opacity-80">
              No brewable orders right now — try <b>Restock</b>.
            </div>
          </v-card>

          <div class="d-flex flex-wrap ga-2 mb-4">
            <v-btn variant="tonal" @click="stir" :disabled="finished">Stir (-3 heat)</v-btn>
            <v-btn variant="tonal" @click="restock" :disabled="finished">Restock (+1 each, +curse)</v-btn>
            <v-btn color="primary" @click="nextTurn" :disabled="finished">Next Turn</v-btn>
          </div>

          <div class="text-subtitle-2 mb-2">Orders</div>
          <v-row dense>
            <v-col cols="12" md="6" v-for="o in orders" :key="o.id">
              <v-card variant="tonal" rounded="lg" class="pa-3">
                <div class="d-flex align-center justify-space-between">
                  <div class="text-subtitle-1">
                    {{ o.title }}
                    <v-chip class="ml-2" size="x-small" :color="potionTypeColor(o.type)" variant="tonal">
                      {{ potionTypeLabel(o.type) }}
                    </v-chip>
                  </div>
                  <v-chip size="small" color="primary" variant="flat">+{{ o.reward }}</v-chip>
                </div>

                <div class="text-caption mt-1">
                  Deadline: Turn <b>{{ o.deadlineTurn }}</b> • Heat on brew: <b>+{{ o.heatOnBrew }}</b>
                </div>

                <div class="text-caption mt-2">
                  Req:
                  <span class="ml-2">Herb {{ o.req.herb }}</span>,
                  <span class="ml-2">Essence {{ o.req.essence }}</span>,
                  <span class="ml-2">Ember {{ o.req.ember }}</span>,
                  <span class="ml-2">Crystal {{ o.req.crystal }}</span>
                </div>

                <div class="d-flex justify-space-between align-center mt-3">
                  <div class="text-caption" :class="willFizzle(o) ? 'text-error' : 'text-success'">
                    {{ willFizzle(o) ? "High risk of fizzle!" : "Safe to brew." }}
                  </div>
                  <v-btn color="secondary" size="small" @click="brew(o)" :disabled="finished || !canPayReq(o)">
                    Brew
                  </v-btn>
                </div>
              </v-card>
            </v-col>
          </v-row>

          <v-alert v-if="finished" :type="outcome === 'win' ? 'success' : 'error'" variant="tonal" class="mt-4">
            <div class="d-flex flex-column ga-1">
              <div class="text-subtitle-1">
                {{ outcome === "win" ? "Victory!" : "Fizzle…" }}
              </div>
              <div class="text-body-2">{{ endReason }}</div>
              <div class="text-body-2">Final score: <b>{{ score }}</b></div>
            </div>
          </v-alert>
        </template>
      </v-card-text>
    </v-card>

    <!-- Rules modal -->
    <v-dialog v-model="rulesOpen" max-width="820">
      <v-card rounded="xl">
        <v-card-title class="text-h6 d-flex align-center justify-space-between">
          <span>How to play</span>
          <v-btn icon="mdi-close" variant="text" @click="rulesOpen = false" />
        </v-card-title>

        <v-divider />

        <v-card-text>
          <div class="text-subtitle-1 mb-2">Quick rules</div>
          <ul class="pl-rules">
            <li>You have <b>{{ turnsMax }}</b> turns to reach <b>{{ targetScore }}</b> score.</li>
            <li>Each order costs ingredients. If you can’t afford it, you can’t brew it.</li>
            <li>Brewing increases <b>Heat</b>. Too much Heat raises the chance of a <b>Fizzle</b>.</li>
            <li>If you fizzle <b>{{ fizzleLimit }}</b> times, you lose.</li>
            <li><b>Stir</b> reduces Heat.</li>
            <li><b>Restock</b> gives +1 of each ingredient, but increases the <b>Curse</b>.</li>
            <li>The <b>Curse</b> grows over time and makes brews riskier. Max curse ends the run.</li>
            <li>Brewing after the deadline reduces your payout.</li>
          </ul>

          <div class="text-subtitle-1 mt-4 mb-2">Detailed breakdown</div>
          <div class="text-body-2 opacity-90">
            <p><b>Goal:</b> Score <b>{{ targetScore }}</b> points within <b>{{ turnsMax }}</b> turns.</p>
            <p><b>Orders:</b> Each order has a type, requirements, a reward, a deadline, and heat gained.</p>
            <p><b>Deadlines:</b> Brewing late reduces the reward (minimum 40%).</p>
            <p><b>Heat & fizzles:</b> Heat rises when brewing; higher heat increases fizzle risk. Stir reduces heat.</p>
            <p><b>Curse:</b> Curse rises over time and when you restock or fizzle. Max curse ends the run.</p>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="tonal" @click="rulesOpen = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- End-of-run / submit dialog -->
    <v-dialog v-model="endDialog" max-width="640">
      <v-card rounded="xl">
        <v-card-title class="text-h6">
          {{ outcome === "win" ? "Victory!" : "Fizzle…" }}
        </v-card-title>

        <v-card-text>
          <div class="mb-3">
            <div class="text-body-2 opacity-80">Seed: <b>{{ seed }}</b></div>
            <div class="text-body-2 opacity-80">Final score: <b>{{ score }}</b></div>
            <div class="text-body-2 opacity-80">Turns used: <b>{{ Math.min(turn, turnsMax) }}</b></div>
            <div class="text-body-2 opacity-80">Fizzles: <b>{{ fizzles }}</b></div>
            <div class="text-body-2 mt-1">{{ endReason }}</div>
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
              <v-btn color="primary" block :loading="submittingScore" :disabled="!canSubmit" @click="submitRun">
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

<style scoped lang="scss">
.pl-play {
  padding-bottom: 32px;
}
.pl-card {
  overflow: hidden;
}
.pl-rules {
  margin: 0;
  padding-left: 18px;
}
.pl-rules li {
  margin: 6px 0;
}
</style>
