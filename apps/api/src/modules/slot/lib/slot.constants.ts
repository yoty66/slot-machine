import type { Symbol } from "./slot.types";

export const SYMBOLS: readonly Symbol[] = ["C", "L", "O", "W"] as const;

export const ROLL_COST = 1;

export const DEFAULT_REWARD_TABLE: Record<Symbol, number> = {
  C: 10,
  L: 20,
  O: 30,
  W: 40,
};

export const DEFAULT_CHEAT_BRACKETS = [
  { min: 40, max: 60, chance: 0.3 },
  { min: 61, max: Infinity, chance: 0.6 },
] as const;
