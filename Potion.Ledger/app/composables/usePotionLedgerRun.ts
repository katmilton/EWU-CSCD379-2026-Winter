// --- Leaderboard types ---
export type LeaderboardEntryDto = {
  id: number | string;
  playerName: string;
  score: number;
  turnsUsed: number;
  fizzles: number;
  createdUtc: string;
  seed?: number;
  mode?: string;
};

export type LeaderboardResponse = {
  generatedUtc: string;
  entries: LeaderboardEntryDto[];
};


// app/composables/usePotionLedgerRun.ts
export type TestimonialCreateRequest = {
  name: string;
  rating: number; // 1-5
  message: string;
};

export type TestimonialDto = {
  id: number | string;
  name: string;
  rating: number;
  message: string;
  createdUtc: string;
};

export type TestimonialsResponse = {
  generatedUtc: string;
  testimonials: TestimonialDto[];
};

// If you already have these types in this file, do NOT duplicate—merge them.

export function usePotionLedgerApi() {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase.replace(/\/+$/, "") // trim trailing /

  return {
    baseURL,

    getTestimonials: () => $fetch(`${baseURL}/api/testimonials`),
    postTestimonial: (body: any) => $fetch(`${baseURL}/api/testimonials`, { method: "POST", body }),
    getLeaderboardAllTime: () => $fetch(`${baseURL}/api/leaderboard/alltime`),
    getDailySeed: () => $fetch(`${baseURL}/api/seeds/daily`),
    getRandomSeed: () => $fetch(`${baseURL}/api/seeds/random`),
    postRun: (body: any) => $fetch(`${baseURL}/api/runs`, { method: "POST", body }),
  }
}

