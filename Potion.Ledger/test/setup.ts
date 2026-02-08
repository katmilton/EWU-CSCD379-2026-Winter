import { vi } from "vitest";

// Nuxt globals you’ll want available in tests
(globalThis as any).useRuntimeConfig = () => ({
  public: { apiBase: "http://localhost:5011" },
});

// mock Nuxt $fetch by default (tests can override per-test)
(globalThis as any).$fetch = vi.fn();
