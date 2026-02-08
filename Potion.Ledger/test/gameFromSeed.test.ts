import { describe, it, expect } from "vitest";
import { createSetupFromSeed } from "../app/utils/gameFromSeed";

describe("createSetupFromSeed", () => {
  it("is deterministic for the same seed", () => {
    const a = createSetupFromSeed(12345);
    const b = createSetupFromSeed(12345);

    expect(a).toEqual(b);
    expect(a.ordersSeed.length).toBeGreaterThan(0);
  });

  it("differs for different seeds", () => {
    const a = createSetupFromSeed(1);
    const b = createSetupFromSeed(2);
    expect(a).not.toEqual(b);
  });

  it("always produces valid order titles", () => {
    const s = createSetupFromSeed(999);
    for (const o of s.ordersSeed) {
      expect(typeof o.title).toBe("string");
      expect(o.title.length).toBeGreaterThan(0);
    }
  });
});
