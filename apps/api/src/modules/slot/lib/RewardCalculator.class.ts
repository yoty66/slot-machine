import type { Symbol } from "./slot.types";
import { DEFAULT_REWARD_TABLE } from "./slot.constants";

export interface IRewardCalculator {
  calculate(symbols: [Symbol, Symbol, Symbol]): { isWin: boolean; reward: number };
}

export class RewardCalculator implements IRewardCalculator {
  constructor(private readonly rewardTable: Record<Symbol, number> = DEFAULT_REWARD_TABLE) {}

  calculate(symbols: [Symbol, Symbol, Symbol]): { isWin: boolean; reward: number } {
    const [first, second, third] = symbols;
    if (first === second && second === third) {
      return { isWin: true, reward: this.rewardTable[first] };
    }
    return { isWin: false, reward: 0 };
  }
}

export const rewardCalculator = new RewardCalculator();
