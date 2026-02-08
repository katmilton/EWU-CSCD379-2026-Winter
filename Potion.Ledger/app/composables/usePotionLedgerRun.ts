type LeaderboardEntry = {
  id: number
  playerName: string
  score: number
  turnsUsed: number
  fizzles: number
  createdUtc: string
}

export type LeaderboardResponse = {
  generatedUtc: string
  entries: LeaderboardEntry[]
}

export type RunCreateRequest = {
  playerName: string
  score: number
  turnsUsed: number
  fizzles: number
}

export type RunCreateResponse = {
  id: number
  playerName: string
  score: number
  turnsUsed: number
  fizzles: number
  createdUtc: string
  rankAllTime: number
}

export type TestimonialsResponse = {
  generatedUtc: string
  testimonials: TestimonialDto[]
}

export type TestimonialDto = {
  id: number
  name: string
  rating: number
  message: string
  createdUtc: string
}

export type TestimonialCreateRequest = {
  name: string
  rating: number
  message: string
}

export function normalizeBaseUrl(url: string) {
  return url.replace(/\/$/, '')
}

export function usePotionLedgerApi() {
  const config = useRuntimeConfig()
  const baseURL = normalizeBaseUrl(String(config.public.apiBase || ''))

  const apiFetch = $fetch.create({
    baseURL,
    retry: 0,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return {
    baseURL,

    async getLeaderboardAllTime() {
      return await apiFetch<LeaderboardResponse>('/api/leaderboard/alltime')
    },

    async postRun(req: RunCreateRequest) {
      return await apiFetch<RunCreateResponse>('/api/runs', {
        method: 'POST',
        body: req,
      })
    },

    async getTestimonials() {
      return await apiFetch<TestimonialsResponse>('/api/testimonials')
    },

    async postTestimonial(req: TestimonialCreateRequest) {
      return await apiFetch<TestimonialDto>('/api/testimonials', {
        method: 'POST',
        body: req,
      })
    },
  }
}
