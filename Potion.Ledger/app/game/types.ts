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

export type RunOutcome = "win" | "loss" | null
