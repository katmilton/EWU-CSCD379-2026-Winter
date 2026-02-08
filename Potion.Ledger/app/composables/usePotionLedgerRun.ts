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
  const config = useRuntimeConfig();
  const baseURL = String(config.public.apiBase || "").replace(/\/$/, "");
  // --------------------
  // Testimonials
  // --------------------
  async function getTestimonials(): Promise<TestimonialsResponse> {
    return await $fetch<TestimonialsResponse>(`${baseURL}/api/testimonials`);
  }

  async function postTestimonial(
    payload: TestimonialCreateRequest
  ): Promise<TestimonialDto> {
    return await $fetch<TestimonialDto>(`${baseURL}/api/testimonials`, {
      method: "POST",
      body: payload,
    });
  }

  // --------------------
  // Seeds (for /play)
  // --------------------
  async function getDailySeed(): Promise<{ date: string; seed: number }> {
    return await $fetch(`${baseURL}/api/seeds/daily`);
  }

  async function getRandomSeed(): Promise<{ seed: number }> {
    return await $fetch(`${baseURL}/api/seeds/random`);
  }

  // --------------------
  // Runs / Leaderboard (example)
  // --------------------
  async function postRun(payload: any) {
    return await $fetch(`${baseURL}/api/runs`, { method: "POST", body: payload });
  }

  

  async function getLeaderboardAllTime(): Promise<LeaderboardResponse> {
    return await $fetch<LeaderboardResponse>(`${baseURL}/api/leaderboard/alltime`);
  }

  return {
    baseURL,
    // testimonials
    getTestimonials,
    postTestimonial,

    // seeds
    getDailySeed,
    getRandomSeed,

    // runs/leaderboard (keep or remove based on what you already have)
    postRun,
    getLeaderboardAllTime,
  };
}
