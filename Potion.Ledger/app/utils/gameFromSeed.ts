import { mulberry32, randInt } from "./seeded"

export type IngredientKey = "herb" | "essence" | "ember" | "crystal"
export type PotionType = "stable" | "volatile" | "precision"

export type Order = {
  id: number
  name: string
  type: PotionType
  reward: number
  deadlineTurn: number
  heatOnBrew: number
  req: Record<IngredientKey, number>
}

export type SeededSetup = {
  seed: number
  invStart: Record<IngredientKey, number>
  ordersSeed: Order[]
}

/**
 * IMPORTANT:
 * Do NOT use tuple typing here — it causes IDE squiggles in Nuxt projects.
 * Instead, we enforce non-empty at runtime with a guard.
 */
const ORDER_POOL: readonly {
  name: string
  type: PotionType
  baseReward: number
  heat: number
  req: Record<IngredientKey, number>
}[] = [
  { name: "Verdant Healing Draught", type: "stable",    baseReward: 38, heat: 3, req: { herb: 2, essence: 1, ember: 0, crystal: 0 } },
  { name: "Ember Tonic",             type: "volatile",  baseReward: 58, heat: 5, req: { herb: 1, essence: 0, ember: 2, crystal: 0 } },
  { name: "Clarity Serum",           type: "precision", baseReward: 56, heat: 4, req: { herb: 0, essence: 2, ember: 0, crystal: 1 } },
  { name: "Aether Elixir",           type: "precision", baseReward: 78, heat: 4, req: { herb: 1, essence: 1, ember: 1, crystal: 1 } },
  { name: "Cinderstorm Philter",     type: "volatile",  baseReward: 88, heat: 6, req: { herb: 0, essence: 1, ember: 3, crystal: 1 } },
]

// safer picker — no tuple tricks required
function pick<T>(rng: () => number, arr: readonly T[]): T {
  if (arr.length === 0) {
    throw new Error("ORDER_POOL is empty — this should never happen.")
  }
  return arr[Math.floor(rng() * arr.length)]!
}

export function createSetupFromSeed(seed: number): SeededSetup {
  const rng = mulberry32(seed)

  const invStart: Record<IngredientKey, number> = {
    herb: randInt(rng, 4, 6),
    essence: randInt(rng, 3, 5),
    ember: randInt(rng, 3, 5),
    crystal: randInt(rng, 1, 3),
  }

  const ordersSeed: Order[] = Array.from({ length: 5 }).map((_, i) => {
    const pickOrder = pick(rng, ORDER_POOL)

    const reward = pickOrder.baseReward + randInt(rng, -6, 10)
    const deadlineTurn = randInt(rng, 3, 6)
    const heatOnBrew = Math.max(1, pickOrder.heat + randInt(rng, -1, 1))

    return {
      id: i + 1,
      name: pickOrder.name,
      type: pickOrder.type,
      reward,
      deadlineTurn,
      heatOnBrew,
      req: { ...pickOrder.req },
    }
  })

  return { seed, invStart, ordersSeed }
}
