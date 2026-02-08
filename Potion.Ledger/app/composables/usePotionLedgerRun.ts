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
  const base = String(config.public.apiBase || "").replace(/\/$/, "");

  // --------------------
  // Testimonials
  // --------------------
  async function getTestimonials(): Promise<TestimonialsResponse> {
    return await $fetch<TestimonialsResponse>(`${base}/api/testimonials`);
  }

  async function postTestimonial(
    payload: TestimonialCreateRequest
  ): Promise<TestimonialDto> {
    return await $fetch<TestimonialDto>(`${base}/api/testimonials`, {
      method: "POST",
      body: payload,
    });
  }

  // --------------------
  // Seeds (for /play)
  // --------------------
  async function getDailySeed(): Promise<{ date: string; seed: number }> {
    return await $fetch(`${base}/api/seeds/daily`);
  }

  async function getRandomSeed(): Promise<{ seed: number }> {
    return await $fetch(`${base}/api/seeds/random`);
  }

  // --------------------
  // Runs / Leaderboard (example)
  // --------------------
  async function postRun(payload: any) {
    return await $fetch(`${base}/api/runs`, { method: "POST", body: payload });
  }

  async function getLeaderboardAllTime() {
    return await $fetch(`${base}/api/leaderboard/alltime`);
  }

  return {
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
