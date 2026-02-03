<script setup lang="ts">
type IngredientKey = "herb" | "essence" | "ember" | "crystal"
type Order = {
  id: number
  name: string
  reward: number
  req: Record<IngredientKey, number>
}

const targetScore = 120
const turnsMax = 8

const invStart: Record<IngredientKey, number> = { herb: 6, essence: 5, ember: 4, crystal: 2 }

const inventory = reactive<Record<IngredientKey, number>>({ ...invStart })

const orders = ref<Order[]>([
  { id: 1, name: "Healing Draught", reward: 30, req: { herb: 2, essence: 1, ember: 0, crystal: 0 } },
  { id: 2, name: "Ember Tonic", reward: 40, req: { herb: 1, essence: 0, ember: 2, crystal: 0 } },
  { id: 3, name: "Clarity Serum", reward: 45, req: { herb: 0, essence: 2, ember: 0, crystal: 1 } },
  { id: 4, name: "Aether Elixir", reward: 65, req: { herb: 1, essence: 1, ember: 1, crystal: 1 } },
])

const turn = ref(1)
const score = ref(0)
const waste = ref(0)
const log = ref<string[]>([])

const finished = ref(false)
const outcome = ref<"win" | "loss" | null>(null)
const submitted = ref(false)

function canBrew(o: Order) {
  return (Object.keys(o.req) as IngredientKey[]).every((k) => inventory[k] >= o.req[k])
}

function endRun(type: "win" | "loss") {
  finished.value = true
  outcome.value = type
}

function nextTurn() {
  if (score.value >= targetScore) return endRun("win")
  turn.value++
  if (turn.value > turnsMax) return endRun("loss")
}

function brew(o: Order) {
  if (finished.value) return

  if (!canBrew(o)) {
    // fizzle penalty (strategy: order selection matters)
    score.value = Math.max(0, score.value - 5)
    waste.value += 1
    log.value.unshift(`Turn ${turn.value}: Fizzle ❌ (-5) — missing ingredients for ${o.name}`)
    return nextTurn()
  }

  ;(Object.keys(o.req) as IngredientKey[]).forEach((k) => (inventory[k] -= o.req[k]))

  // tiny efficiency bonus if you perfectly zero a used ingredient (encourages planning)
  const zeroBonus =
    (Object.keys(o.req) as IngredientKey[]).some((k) => o.req[k] > 0 && inventory[k] === 0) ? 5 : 0

  const gained = o.reward + zeroBonus
  score.value += gained
  log.value.unshift(`Turn ${turn.value}: Brewed ✅ ${o.name} (+${gained})`)
  nextTurn()
}

function resetRun() {
  Object.assign(inventory, invStart)
  turn.value = 1
  score.value = 0
  waste.value = 0
  log.value = []
  finished.value = false
  outcome.value = null
  submitted.value = false
}
</script>

<template>
  <section class="stack">
    <header class="row">
      <div>
        <h1>Play</h1>
        <p class="muted">Goal: {{ targetScore }} score in {{ turnsMax }} turns.</p>
      </div>
      <button class="btn" @click="resetRun">Reset</button>
    </header>

    <div class="grid">
      <div class="card">
        <h2>Status</h2>
        <p><b>Turn:</b> {{ turn }} / {{ turnsMax }}</p>
        <p><b>Score:</b> {{ score }}</p>
        <p><b>Waste:</b> {{ waste }}</p>
      </div>

      <div class="card">
        <h2>Inventory</h2>
        <ul class="inv">
          <li>🌿 Herb: <b>{{ inventory.herb }}</b></li>
          <li>💧 Essence: <b>{{ inventory.essence }}</b></li>
          <li>🔥 Ember: <b>{{ inventory.ember }}</b></li>
          <li>✨ Crystal: <b>{{ inventory.crystal }}</b></li>
        </ul>
      </div>
    </div>

    <div class="card">
      <h2>Orders</h2>
      <p class="muted">Pick an order each turn. Failed brews lose points.</p>

      <div class="orders">
        <button
          v-for="o in orders"
          :key="o.id"
          class="order"
          :disabled="finished"
          @click="brew(o)"
        >
          <div class="top">
            <b>{{ o.name }}</b>
            <span>+{{ o.reward }}</span>
          </div>
          <div class="req">
            <span v-if="o.req.herb">🌿 {{ o.req.herb }}</span>
            <span v-if="o.req.essence">💧 {{ o.req.essence }}</span>
            <span v-if="o.req.ember">🔥 {{ o.req.ember }}</span>
            <span v-if="o.req.crystal">✨ {{ o.req.crystal }}</span>
          </div>
          <div class="hint" :class="{ ok: canBrew(o) }">
            {{ canBrew(o) ? "Brewable" : "Not enough ingredients" }}
          </div>
        </button>
      </div>
    </div>

    <div class="card">
      <h2>Log</h2>
      <p v-if="log.length === 0" class="muted">No actions yet.</p>
      <ul v-else class="log">
        <li v-for="(l, i) in log" :key="i">{{ l }}</li>
      </ul>
    </div>

    <!-- End-state inside Play (your “result” without a result page) -->
    <div v-if="finished" class="overlay">
      <div class="modal">
        <h2>Run Complete</h2>
        <p class="big" :class="{ win: outcome === 'win', loss: outcome === 'loss' }">
          {{ outcome === "win" ? "WIN 🎉" : "LOSS 💥" }}
        </p>
        <p><b>Final score:</b> {{ score }}</p>
        <p><b>Waste:</b> {{ waste }}</p>

        <div class="row">
          <NuxtLink class="btn primary" to="/leaderboard">View Leaderboard</NuxtLink>
          <NuxtLink class="btn" to="/testimonials">Leave Feedback</NuxtLink>
          <button class="btn" @click="resetRun">Play Again</button>
        </div>

        <p class="muted small">
          Next step: we’ll submit this run to the API (POST) and show real DB scores on the leaderboard (GET).
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stack { display:flex; flex-direction:column; gap:12px; }
h1 { margin:0; font-size: 1.8rem; }
h2 { margin:0 0 10px; font-size: 1.1rem; }
.muted { opacity: 0.75; margin: 6px 0 0; }
.small { font-size: 0.9rem; }
.row { display:flex; justify-content:space-between; gap:10px; align-items:center; flex-wrap:wrap; }
.grid { display:grid; grid-template-columns: 1fr; gap:12px; }
@media (min-width: 720px) { .grid { grid-template-columns: 1fr 1fr; } }
.card { border:1px solid #e6e6e6; border-radius:16px; padding:14px; background:#fff; }
.btn { padding:10px 12px; border:1px solid #222; border-radius:12px; background:#fff; cursor:pointer; }
.btn.primary { background:#111; color:#fff; border-color:#111; text-decoration:none; }
.inv, .log { margin:0; padding-left: 18px; }
.orders { display:grid; grid-template-columns: 1fr; gap:10px; }
@media (min-width: 720px) { .orders { grid-template-columns: 1fr 1fr; } }
.order { text-align:left; border:1px solid #e6e6e6; border-radius:14px; padding:12px; background:#fafafa; cursor:pointer; }
.order:disabled { opacity:0.6; cursor:not-allowed; }
.top { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.req { display:flex; gap:10px; flex-wrap:wrap; }
.hint { margin-top:8px; font-size:0.9rem; opacity:0.8; }
.hint.ok { opacity: 1; }

.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; padding: 16px; }
.modal { max-width: 720px; width: 100%; background:#fff; border-radius: 18px; border:1px solid #e6e6e6; padding: 16px; }
.big { font-size: 1.4rem; font-weight: 800; margin: 6px 0 8px; }
.win { color: #0b6b2f; }
.loss { color: #9b1c1c; }
</style>
