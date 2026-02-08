import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePotionLedgerApi } from "../app/composables/usePotionLedgerRun";

describe("usePotionLedgerApi", () => {
  beforeEach(() => {
    (globalThis as any).$fetch = vi.fn();
  });

  it("exposes baseURL from runtime config", () => {
    const api = usePotionLedgerApi();
    expect(api.baseURL).toBe("http://localhost:5011");
  });

  it("calls leaderboard endpoint", async () => {
    const api = usePotionLedgerApi();
    (globalThis as any).$fetch.mockResolvedValueOnce({
      generatedUtc: new Date().toISOString(),
      entries: [],
    });

    const res = await api.getLeaderboardAllTime();

    expect((globalThis as any).$fetch).toHaveBeenCalledWith(
      "http://localhost:5011/api/leaderboard/alltime"
    );
    expect(res.entries).toEqual([]);
  });

  it("calls testimonials endpoint", async () => {
    const api = usePotionLedgerApi();
    (globalThis as any).$fetch.mockResolvedValueOnce({
      generatedUtc: new Date().toISOString(),
      testimonials: [],
    });

    const res = await api.getTestimonials();

    expect((globalThis as any).$fetch).toHaveBeenCalledWith(
      "http://localhost:5011/api/testimonials"
    );
    expect(res.testimonials).toEqual([]);
  });

  it("posts a testimonial", async () => {
    const api = usePotionLedgerApi();
    (globalThis as any).$fetch.mockResolvedValueOnce({
      id: 1,
      name: "A",
      rating: 5,
      message: "Hi",
      createdUtc: new Date().toISOString(),
    });

    await api.postTestimonial({ name: "A", rating: 5, message: "Hi" });

    expect((globalThis as any).$fetch).toHaveBeenCalledWith(
      "http://localhost:5011/api/testimonials",
      expect.objectContaining({
        method: "POST",
        body: { name: "A", rating: 5, message: "Hi" },
      })
    );
  });
});
