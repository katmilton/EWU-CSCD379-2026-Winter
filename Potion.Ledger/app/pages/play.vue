<script setup lang="ts">
import type { RunCreateResponse } from "~/composables/usePotionLedgerRun"

type IngredientKey = "herb" | "essence" | "ember" | "crystal"
type PotionType = "stable" | "volatile" | "precision"

type Order = {
  id: number
  name: string
  type: PotionType
  reward: number
  deadlineTurn: number
  heatOnBrew: number
  req: Record<IngredientKey, number>
}

// ---------- HARD MODE TUNABLES (balanced to be losable)
const turnsMax = 8
const targetScore = 190

const heatMax = 12
const baseStability = 2
const fizzleLimit = 2 // fewer mistakes allowed

// thresholds are LOWER => heat matters
const typeRiskThreshold: Record<PotionType, number> = {
  stable: 7,
  precision: 5,
  volatile: 3,
}

// Curse: increases when you’re late or fizzle; creates deterministic spiral pressure
// Curse thresholds:
//  3+: volatile always fizzles unless you stir this turn (heat <= 2)
//  5+: precision loses -10 reward (even if brewed successfully)
const curseMax = 6

// Late payout: harsher than before: -15%/turn late, minimum 40%
function payoutMultiplier(turn: number, deadlineTurn: number) {
  const lateBy = Math.max(0, turn - deadlineTurn)
  const multiplier = Math.max(0.4, 1 - 0.15 * lateBy)
  return { lateBy, multiplier }
}

// ---------- Scarcer “daily” seed
const invStart: Record<IngredientKey, number> = {
  herb: 5,
  essence: 4,
  ember: 4,
  crystal: 2,
}

const ordersSeed: Order[] = [
  {
    id: 1,
    name: "Verdant Healing Draught",
    type: "stable",
    reward: 38,
    deadlineTurn: 3,
    heatOnBrew: 3,
    req: { herb: 2, essence: 1, ember: 0, crystal: 0 },
  },
  {
    id: 2,
    name: "Ember Tonic",
    type: "volatile",
    reward: 58,
    deadlineTurn: 4,
    heatOnBrew: 5,
    req: { herb: 1, essence: 0, ember: 2, crystal: 0 },
  },
  {
    id: 3,
    name: "Clarity Serum",
    type: "precision",
    reward: 56,
    deadlineTurn: 5,
    heatOnBrew: 4,
    req: { herb: 0, essence: 2, ember: 0, crystal: 1 },
  },
  {
    id: 4,
    name: "Aether Elixir",
    type: "precision",
    reward: 78,
    deadlineTurn: 6,
    heatOnBrew: 4,
    req: { herb: 1, essence: 1, ember: 1, crystal: 1 },
  },
  {
    id: 5,
    name: "Cinderstorm Philter",
    type: "volatile",
    reward: 88,
    deadlineTurn: 6,
    heatOnBrew: 6,
    req: { herb: 0, essence: 1, ember: 3, crystal: 1 },
  },
]

// ---------- Reactive state
const inventory = reactive<Record<IngredientKey, number>>({ ...invStart })
const orders = ref<Order[]>([...ordersSeed])

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

// --- API submission (tie frontend -> backend)
const api = usePotionLedgerApi()
const playerName = ref("")
const submittingRun = ref(false)
const runSubmitError = ref<string | null>(null)
const runSubmitOk = ref<RunCreateResponse | null>(null)

// --- UI animation state (extra credit)
const anim = ref<'idle' | 'brewOk' | 'brewFail' | 'stir' | 'dilute'>('idle')
let animTimer: any = null
function pulse(next: typeof anim.value) {
  anim.value = next
  if (animTimer) clearTimeout(animTimer)
  animTimer = setTimeout(() => (anim.value = 'idle'), 650)
}

function turnsUsedNow() {
  // turn is incremented after each action; clamp to the max for reporting.
  return Math.min(turn.value, turnsMax)
}

async function submitRun() {
  runSubmitError.value = null
  const name = playerName.value.trim()
  if (!name) {
    runSubmitError.value = "Name is required."
    return
  }
  if (name.length > 24) {
    runSubmitError.value = "Name must be 24 characters or less."
    return
  }

  submittingRun.value = true
  try {
    runSubmitOk.value = await api.postRun({
      playerName: name,
      score: score.value,
      turnsUsed: turnsUsedNow(),
      fizzles: fizzles.value,
    })
  } catch (e: any) {
    runSubmitError.value = e?.data || e?.message || "Failed to submit run."
  } finally {
    submittingRun.value = false
  }
}

// ---------- Helpers
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

function canPayReq(o: Order) {
  return (Object.keys(o.req) as IngredientKey[]).every((k) => inventory[k] >= o.req[k])
}

function riskThresholdFor(o: Order) {
  // Curse makes everything riskier
  const curseTax = Math.floor(curse.value / 2) // 0,0,1,1,2,2,3...
  return typeRiskThreshold[o.type] + stability.value - curseTax
}

function cursedAutoFail(o: Order) {
  // deterministic “doom” rule for volatile at high curse
  // if curse>=3, volatile potions require heat<=2 to succeed
  if (curse.value >= 3 && o.type === "volatile" && heat.value > 2) return true
  return false
}

function willFizzle(o: Order) {
  if (cursedAutoFail(o)) return true
  return heat.value > riskThresholdFor(o)
}

function endRun(type: "win" | "loss", reason: string) {
  finished.value = true
  outcome.value = type
  endReason.value = reason
}

function checkEnd() {
  if (score.value >= targetScore) return endRun("win", "Target score reached.")
  if (fizzles.value >= fizzleLimit) return endRun("loss", `Too many fizzles (≥ ${fizzleLimit}).`)
  if (turn.value > turnsMax) return endRun("loss", "Out of turns.")
  if (curse.value >= curseMax) return endRun("loss", "The curse consumed your ledger.")
}

function nextTurn() {
  turn.value++
  checkEnd()
}

// ---------- Actions
function stir() {
  if (finished.value) return
  pulse('stir')
  const before = heat.value
  // weaker than before: -2 heat
  heat.value = Math.max(0, heat.value - 2)
  // tiny curse relief so it’s a strategic “reset”
  const beforeCurse = curse.value
  curse.value = Math.max(0, curse.value - 1)
  log.value.unshift(`Turn ${turn.value}: Stirred 🌀 (Heat ${before}→${heat.value}, Curse ${beforeCurse}→${curse.value})`)
  nextTurn()
}

function dilute() {
  if (finished.value) return
  pulse('dilute')
  // stronger cost: needs 2 essence
  if (inventory.essence < 2) {
    log.value.unshift(`Turn ${turn.value}: Dilute failed ❌ (need 2 Essence)`)
    score.value = Math.max(0, score.value - 5)
    curse.value = Math.min(curseMax, curse.value + 1)
    nextTurn()
    return
  }
  inventory.essence -= 2
  const before = stability.value
  stability.value = Math.min(7, stability.value + 1)
  log.value.unshift(`Turn ${turn.value}: Diluted 💧 (Stability ${before}→${stability.value}, -2 Essence)`)
  nextTurn()
}

function brew(o: Order) {
  if (finished.value) return

  if (!canPayReq(o)) {
    pulse('brewFail')
    fizzles.value += 1
    curse.value = Math.min(curseMax, curse.value + 1)
    score.value = Math.max(0, score.value - 10)
    log.value.unshift(`Turn ${turn.value}: Fizzle ❌ (-10, +1 Curse) — missing ingredients for ${o.name}`)
    nextTurn()
    return
  }

  if (willFizzle(o)) {
    pulse('brewFail')
    fizzles.value += 1
    curse.value = Math.min(curseMax, curse.value + 2) // fizzles hurt more

    // ruined batch cost: burn 1 ember if possible, else 1 crystal
    if (inventory.ember > 0) inventory.ember -= 1
    else if (inventory.crystal > 0) inventory.crystal -= 1

    score.value = Math.max(0, score.value - 14)
    const thr = riskThresholdFor(o)
    const doom = cursedAutoFail(o) ? " (curse doom)" : ""
    log.value.unshift(`Turn ${turn.value}: Fizzle 💥 (-14, +2 Curse) — Heat ${heat.value} > Thr ${thr}${doom} for ${o.name}`)

    heat.value = Math.min(heatMax, heat.value + 2) // lab gets hotter when you mess up
    nextTurn()
    return
  }

  // Pay ingredients
  ;(Object.keys(o.req) as IngredientKey[]).forEach((k) => (inventory[k] -= o.req[k]))

  const { lateBy, multiplier } = payoutMultiplier(turn.value, o.deadlineTurn)

  // curse penalty for being late
  if (lateBy > 0) curse.value = Math.min(curseMax, curse.value + lateBy)

  // precision penalty at high curse
  const precisionTax = (curse.value >= 5 && o.type === "precision") ? 10 : 0

  const baseGain = Math.max(0, Math.round(o.reward * multiplier) - precisionTax)

  // smaller bonus now: +2 for zeroing used ingredient
  const zeroBonus =
    (Object.keys(o.req) as IngredientKey[]).some((k) => o.req[k] > 0 && inventory[k] === 0) ? 2 : 0

  const gained = baseGain + zeroBonus
  score.value += gained

  pulse('brewOk')

  const beforeHeat = heat.value
  heat.value = Math.min(heatMax, heat.value + o.heatOnBrew) // heats up a lot

  const lateText = lateBy > 0 ? ` (late +${lateBy} curse, payout x${multiplier.toFixed(2)})` : ""
  const curseText = precisionTax > 0 ? ` (-${precisionTax} cursed precision)` : ""
  log.value.unshift(
    `Turn ${turn.value}: Brewed ✅ ${o.name} +${gained} | Heat ${beforeHeat}→${heat.value}${lateText}${curseText}`
  )

  pulse('brewOk')

  nextTurn()
}

function resetRun() {
  pulse('idle')
  Object.assign(inventory, invStart)
  orders.value = [...ordersSeed]
  turn.value = 1
  score.value = 0
  fizzles.value = 0
  heat.value = 0
  stability.value = baseStability
  curse.value = 0
  log.value = []
  finished.value = false
  outcome.value = null
  endReason.value = ""

  // reset submission state
  playerName.value = ""
  submittingRun.value = false
  runSubmitError.value = null
  runSubmitOk.value = null
}

function orderChipText(o: Order) {
  const thr = riskThresholdFor(o)
  const fz = willFizzle(o) ? "FIZZLE" : "OK"
  const { lateBy } = payoutMultiplier(turn.value, o.deadlineTurn)
  const lateText = lateBy > 0 ? `Late+${lateBy}` : `Due T${o.deadlineTurn}`
  const doom = cursedAutoFail(o) ? " DOOM" : ""
  return `${lateText} • Heat+${o.heatOnBrew} • Thr ${thr} • ${fz}${doom}`
}
</script>

<template>
  <v-card class="pl-card pa-4" rounded="lg" elevation="1">
    <div class="pl-row">
      <div>
        <h1 class="pl-title">The Cauldron Ledger</h1>
        <p class="pl-sub">
          Reach {{ targetScore }} in {{ turnsMax }} turns • Lose at {{ fizzleLimit }} fizzles • Curse ends you at {{ curseMax }}
        </p>
      </div>

      <div class="pl-actions">
        <v-btn variant="outlined" @click="resetRun">Reset</v-btn>
        <v-btn color="primary" to="/leaderboard">Leaderboard</v-btn>
      </div>
    </div>

    <v-divider class="my-4" />

    <div class="pl-grid">
      <v-card class="pl-panel pa-3" variant="tonal">
        <h3 class="pl-h">Status</h3>
        <div class="pl-cauldronWrap" :data-anim="anim">
          <div class="pl-cauldron">
            <div class="pl-bubbles">
              <span v-for="i in 7" :key="i" class="pl-bubble" />
            </div>
            <div class="pl-liquid" />
            <div class="pl-rim" />
            <div class="pl-feet">
              <span /><span /><span />
            </div>
          </div>
          <div class="pl-cauldronHint">
            <v-chip size="small" variant="tonal" color="warning">Heat {{ heat }}</v-chip>
            <v-chip size="small" variant="tonal" color="info">Stability {{ stability }}</v-chip>
          </div>
        </div>
        <div><b>Turn:</b> {{ turn }} / {{ turnsMax }}</div>
        <div><b>Score:</b> {{ score }}</div>
        <div><b>Fizzles:</b> {{ fizzles }} / {{ fizzleLimit }}</div>
        <div><b>Curse:</b> {{ curse }} / {{ curseMax }}</div>
      </v-card>

      <v-card class="pl-panel pa-3" variant="tonal">
        <h3 class="pl-h">Lab Conditions</h3>

        <div class="pl-chips">
          <v-chip color="warning" variant="tonal">
            Heat: <b class="pl-chipval">{{ heat }}</b>/{{ heatMax }}
          </v-chip>
          <v-chip color="info" variant="tonal">
            Stability: <b class="pl-chipval">{{ stability }}</b>
          </v-chip>
          <v-chip color="error" variant="tonal">
            Curse: <b class="pl-chipval">{{ curse }}</b>
          </v-chip>
        </div>

        <div class="pl-muted mt-2">
          Curse rule: at <b>3+</b>, volatile potions require <b>Heat ≤ 2</b>. At <b>5+</b>, precision potions lose reward.
        </div>

        <div class="pl-actions mt-3">
          <v-btn variant="outlined" @click="stir">Stir (Heat -2, Curse -1)</v-btn>
          <v-btn variant="outlined" @click="dilute">Dilute (-2 Essence, +1 Stability)</v-btn>
        </div>
      </v-card>

      <v-card class="pl-panel pa-3" variant="tonal">
        <h3 class="pl-h">Inventory</h3>
        <div>🌿 Herb: <b>{{ inventory.herb }}</b></div>
        <div>💧 Essence: <b>{{ inventory.essence }}</b></div>
        <div>🔥 Ember: <b>{{ inventory.ember }}</b></div>
        <div>✨ Crystal: <b>{{ inventory.crystal }}</b></div>
      </v-card>
    </div>

    <v-card class="pl-panel pa-3 mt-4">
      <h3 class="pl-h">Orders</h3>
      <p class="pl-muted mb-3">
        This run is tight: you’ll need at least one Stir and you can’t ignore deadlines.
      </p>

      <div class="pl-orders">
        <v-btn
          v-for="o in orders"
          :key="o.id"
          :disabled="finished"
          variant="outlined"
          class="justify-start"
          style="text-transform:none; white-space:normal; height:auto; padding:12px;"
          @click="brew(o)"
        >
          <div style="width:100%;">
            <div class="pl-orderTop">
              <div class="pl-orderName">
                <b>{{ o.name }}</b>
                <v-chip :color="'primary'" size="small" variant="tonal">
                  {{ potionTypeLabel(o.type) }}
                </v-chip>
              </div>
              <span>+{{ o.reward }}</span>
            </div>

            <div class="pl-req">
              <span v-if="o.req.herb">🌿 {{ o.req.herb }}</span>
              <span v-if="o.req.essence">💧 {{ o.req.essence }}</span>
              <span v-if="o.req.ember">🔥 {{ o.req.ember }}</span>
              <span v-if="o.req.crystal">✨ {{ o.req.crystal }}</span>
            </div>

            <div class="pl-chipRow">
              <v-chip size="small" variant="tonal">{{ orderChipText(o) }}</v-chip>

              <v-chip v-if="!canPayReq(o)" size="small" color="error" variant="tonal">
                Missing ingredients
              </v-chip>

              <v-chip v-else-if="willFizzle(o)" size="small" color="error" variant="flat">
                Will fizzle
              </v-chip>

              <v-chip v-else size="small" color="success" variant="tonal">
                Safe
              </v-chip>
            </div>
          </div>
        </v-btn>
      </div>
    </v-card>

    <v-card class="pl-panel pa-3 mt-4">
      <h3 class="pl-h">Grimoire Log</h3>
      <div v-if="log.length === 0" class="pl-muted">No actions yet.</div>
      <ul v-else class="pl-log">
        <li v-for="(l,i) in log" :key="i">{{ l }}</li>
      </ul>
    </v-card>

    <v-dialog v-model="finished" persistent width="620">
      <v-card class="pa-5 pl-modal">
        <h2 class="pl-modalTitle">Run Complete</h2>
        <div class="pl-modalOutcome">
          {{ outcome === 'win' ? 'WIN 🎉' : 'LOSS 💥' }}
        </div>
        <div class="pl-muted mb-3">{{ endReason }}</div>

        <div><b>Final score:</b> {{ score }}</div>
        <div><b>Turns used:</b> {{ Math.min(turn, turnsMax) }} / {{ turnsMax }}</div>
        <div><b>Fizzles:</b> {{ fizzles }} / {{ fizzleLimit }}</div>
        <div><b>Curse:</b> {{ curse }} / {{ curseMax }}</div>

        <v-divider class="my-4" />

        <v-card class="pl-panel pa-4" variant="tonal">
          <h3 class="pl-h">Submit your score</h3>
          <div class="pl-muted mb-3">
            This saves your run to the database and updates the leaderboard.
          </div>

          <v-alert v-if="runSubmitOk" type="success" variant="tonal" class="mb-3">
            Saved! Your all-time rank: <b>#{{ runSubmitOk.rankAllTime }}</b>
          </v-alert>

          <v-alert v-if="runSubmitError" type="error" variant="tonal" class="mb-3">
            {{ runSubmitError }}
          </v-alert>

          <div class="d-flex flex-wrap ga-3 align-center">
            <v-text-field
              v-model="playerName"
              label="Name"
              maxlength="24"
              counter
              density="comfortable"
              variant="outlined"
              style="min-width: 240px; flex: 1 1 240px;"
              :disabled="!!runSubmitOk || submittingRun"
            />

            <v-btn
              color="primary"
              :loading="submittingRun"
              :disabled="!!runSubmitOk"
              @click="submitRun"
            >
              {{ runSubmitOk ? 'Submitted' : 'Submit run' }}
            </v-btn>
          </div>
        </v-card>

        <div class="pl-actions">
          <v-btn color="primary" to="/leaderboard">View Leaderboard</v-btn>
          <v-btn variant="outlined" to="/testimonials">Leave Feedback</v-btn>
          <v-btn variant="text" @click="resetRun">Play Again</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-card>
</template>
