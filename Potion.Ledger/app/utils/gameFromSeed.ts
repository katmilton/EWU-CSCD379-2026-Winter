import { mulberry32, randInt } from "./seeded"

export type IngredientKey = "herb" | "essence" | "ember" | "crystal"
export type PotionType = "stable" | "volatile" | "precision"

export type SeededOrder = {
  id: string
  title: string
  type: PotionType
  reward: number
  deadlineTurn: number
  heatOnBrew: number
  req: Record<IngredientKey, number>
}

export type SeededSetup = {
  seed: number
  invStart: Record<IngredientKey, number>
  ordersSeed: SeededOrder[]
}

const ORDER_POOL: readonly {
  title: string
  type: PotionType
  baseReward: number
  heat: number
  req: Record<IngredientKey, number>
}[] = [
  { title: "Verdant Healing Draught", type: "stable",    baseReward: 38, heat: 3, req: { herb: 2, essence: 1, ember: 0, crystal: 0 } },
  { title: "Ember Tonic",             type: "volatile",  baseReward: 58, heat: 5, req: { herb: 1, essence: 0, ember: 2, crystal: 0 } },
  { title: "Clarity Serum",           type: "precision", baseReward: 56, heat: 4, req: { herb: 0, essence: 2, ember: 0, crystal: 1 } },
  { title: "Aether Elixir",           type: "precision", baseReward: 78, heat: 4, req: { herb: 1, essence: 1, ember: 1, crystal: 1 } },
  { title: "Cinderstorm Philter",     type: "volatile",  baseReward: 88, heat: 6, req: { herb: 0, essence: 1, ember: 3, crystal: 1 } },
]

function pick<T>(rng: () => number, arr: readonly T[]): T {
  if (arr.length === 0) throw new Error("ORDER_POOL is empty.")
  return arr[Math.floor(rng() * arr.length)] as T
}

/**
 * Balance guard:
 * If starting crystal is low, don't over-generate crystal-heavy orders.
 */
function maybeSoftenCrystal(req: Record<IngredientKey, number>, invCrystal: number, rng: () => number) {
  // If you only start with 2 crystal, occasionally reduce a crystal requirement of 1 -> 0.
  if (invCrystal <= 2 && req.crystal >= 1) {
    const roll = rng() // 0..1
    if (roll < 0.35) {
      return { ...req, crystal: Math.max(0, req.crystal - 1) }
    }
  }
  return req
}

export function createSetupFromSeed(seed: number): SeededSetup {
  const rng = mulberry32(seed)

  // Slightly more generous start; still losable
  const invStart: Record<IngredientKey, number> = {
    herb: randInt(rng, 4, 7),
    essence: randInt(rng, 3, 6),
    ember: randInt(rng, 3, 6),
    crystal: randInt(rng, 2, 4), // ✅ key change
  }

  // 6 orders so you have more choices
  const ordersSeed: SeededOrder[] = Array.from({ length: 6 }).map((_, i) => {
    const base = pick(rng, ORDER_POOL)

    const reward = base.baseReward + randInt(rng, -6, 12)

    // Deadlines: keep pressure, but not always impossible
    const deadlineTurn = randInt(rng, 3, 7)

    const heatOnBrew = Math.max(1, base.heat + randInt(rng, -1, 1))

    // Slightly vary requirements but avoid spikes
    const req = { ...base.req }
    // small chance to +1 on a non-crystal ingredient
    const bumpRoll = rng()
    if (bumpRoll < 0.25) {
      const bump: IngredientKey = pick(rng, ["herb", "essence", "ember"] as const)
      req[bump] = Math.min(4, req[bump] + 1)
    }

    const finalReq = maybeSoftenCrystal(req, invStart.crystal, rng)

    return {
      id: `ord-${seed}-${i}`,
      title: base.title,
      type: base.type,
      reward,
      deadlineTurn,
      heatOnBrew,
      req: finalReq,
    }
  })

  return { seed, invStart, ordersSeed }
}
