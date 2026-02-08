// app/composables/usePotionLedgerRun.ts

// --- Leaderboard types ---
export type LeaderboardEntryDto = {
  id: number | string
  playerName: string
  score: number
  turnsUsed: number
  fizzles: number
  createdUtc: string
  seed?: number
  mode?: string
}

export type LeaderboardResponse = {
  generatedUtc: string
  entries: LeaderboardEntryDto[]
}

// --- Testimonials types ---
export type TestimonialCreateRequest = {
  name: string
  rating: number // 1-5
  message: string
}

export type TestimonialDto = {
  id: number | string
  name: string
  rating: number
  message: string
  createdUtc: string
}

export type TestimonialsResponse = {
  generatedUtc: string
  testimonials: TestimonialDto[]
}

// --- Runs types (adjust if your API DTO differs) ---
export type RunCreateRequest = {
  playerName: string
  score: number
  turnsUsed: number
  fizzles: number
  seed: number
  mode: "daily" | "random"
  playedUtc: string
}

export type RunCreateResponse = {
  allTimeRank?: number
  rank?: number
}

export type DailySeedResponse = { date: string; seed: number }
export type RandomSeedResponse = { seed: number }

export function usePotionLedgerApi() {
  const config = useRuntimeConfig()
  const baseURL = String(config.public.apiBase || "").replace(/\/+$/, "")

  return {
    baseURL,

    // ✅ typed returns so leaderboard.vue assignment is valid
    getTestimonials: () => $fetch<TestimonialsResponse>(`${baseURL}/api/testimonials`),

    postTestimonial: (body: TestimonialCreateRequest) =>
      $fetch<TestimonialDto>(`${baseURL}/api/testimonials`, {
        method: "POST",
        body,
      }),

    getLeaderboardAllTime: () => $fetch<LeaderboardResponse>(`${baseURL}/api/leaderboard/alltime`),

    getDailySeed: () => $fetch<DailySeedResponse>(`${baseURL}/api/seeds/daily`),

    getRandomSeed: () => $fetch<RandomSeedResponse>(`${baseURL}/api/seeds/random`),

    postRun: (body: RunCreateRequest) =>
      $fetch<RunCreateResponse>(`${baseURL}/api/runs`, {
        method: "POST",
        body,
      }),
  }
}
