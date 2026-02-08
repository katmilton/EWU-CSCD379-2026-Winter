import { mulberry32, randInt } from "./seeded";

export type SeededOrder = { id: string; title: string; reward: number; penalty: number };

export type SeededSetup = {
  seed: number;
  invStart: Record<string, number>;
  ordersSeed: SeededOrder[];
};

// ✅ ensures we never return undefined
function pickNonEmpty<T>(rng: () => number, arr: readonly [T, ...T[]]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

export function createSetupFromSeed(seed: number): SeededSetup {
  const rng = mulberry32(seed);

  const ingredients = ["mandrake", "nightshade", "mothWing", "stardust", "brine", "emberSalt"] as const;

  const invStart: Record<string, number> = {};
  for (const ing of ingredients) {
    invStart[ing] = randInt(rng, 1, 5);
  }

  // ✅ non-empty tuple type: readonly [string, ...string[]]
  const orderNames = [
    "Witchlight Tonic",
    "Basilisk Balm",
    "Frostveil Draught",
    "Sunfire Syrup",
    "Gravebloom Elixir",
    "Sablemist Serum",
    "Moonmilk Mixture",
    "Hexbreaker Brew",
  ] as const satisfies readonly [string, ...string[]];

  const ordersSeed: SeededOrder[] = Array.from({ length: 8 }).map((_, i) => {
    const title = pickNonEmpty(rng, orderNames);
    return {
      id: `ord-${seed}-${i}`,
      title,
      reward: randInt(rng, 8, 18),
      penalty: randInt(rng, 4, 10),
    };
  });

  return { seed, invStart, ordersSeed };
}
