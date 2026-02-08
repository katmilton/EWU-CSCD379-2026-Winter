import { mulberry32, randInt } from "./seeded"

export type IngredientKey = "herb" | "essence" | "ember" | "crystal"
export type PotionType = "stable" | "volatile" | "precision"

export type SeededOrder = {
  id: string
  title: string // ✅ TEST EXPECTS THIS
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

/**
 * Keep this as a normal readonly array (NOT tuple typing).
 * We enforce non-empty with a runtime guard to avoid TS squiggles.
 */
const ORDER_POOL: readonly {
  title: string // ✅ always present
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

export function createSetupFromSeed(seed: number): SeededSetup {
  const rng = mulberry32(seed)

  const invStart: Record<IngredientKey, number> = {
    herb: randInt(rng, 4, 6),
    essence: randInt(rng, 3, 5),
    ember: randInt(rng, 3, 5),
    crystal: randInt(rng, 1, 3),
  }

  const ordersSeed: SeededOrder[] = Array.from({ length: 5 }).map((_, i) => {
    const base = pick(rng, ORDER_POOL)

    const reward = base.baseReward + randInt(rng, -6, 10)
    const deadlineTurn = randInt(rng, 3, 6)
    const heatOnBrew = Math.max(1, base.heat + randInt(rng, -1, 1))

    return {
      id: `ord-${seed}-${i}`,       // deterministic
      title: base.title,           // ✅ never undefined
      type: base.type,
      reward,
      deadlineTurn,
      heatOnBrew,
      req: { ...base.req },
    }
  })

  return { seed, invStart, ordersSeed }
}
