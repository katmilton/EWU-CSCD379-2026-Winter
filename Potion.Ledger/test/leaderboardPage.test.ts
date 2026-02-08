import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import Leaderboard from "../app/pages/leaderboard.vue";

vi.mock("../app/composables/usePotionLedgerRun", () => {
  return {
    usePotionLedgerApi: () => ({
      baseURL: "http://localhost:5011",
      getLeaderboardAllTime: vi.fn().mockResolvedValue({
        generatedUtc: new Date().toISOString(),
        entries: [
          {
            id: 1,
            playerName: "Test",
            score: 42,
            turnsUsed: 7,
            fizzles: 1,
            createdUtc: new Date().toISOString(),
          },
        ],
      }),
    }),
  };
});

function stubsForVuetify() {
  const stub = { template: "<div><slot /></div>" };
  return {
    VCard: stub,
    VBtn: stub,
    VIcon: stub,
    VDivider: stub,
    VAlert: stub,
    VProgressCircular: stub,
    VSkeletonLoader: stub,
    VTable: { template: "<table><slot /></table>" },
    VChip: stub,
  };
}

describe("leaderboard page", () => {
  it("renders a row from API", async () => {
    const wrapper = mount(Leaderboard as any, {
      global: { stubs: stubsForVuetify() },
    });

    // allow onMounted + promise chain to resolve
    await Promise.resolve();
    await Promise.resolve();

    expect(wrapper.text()).toContain("Top Alchemists");
    expect(wrapper.text()).toContain("Test");
    expect(wrapper.text()).toContain("42");
  });
});
