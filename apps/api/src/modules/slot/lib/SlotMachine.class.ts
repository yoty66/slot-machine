import type { Symbol } from "./slot.types";
import type { ISymbolGenerator } from "./SymbolGenerator.class";
import type { IRewardCalculator } from "./RewardCalculator.class";
import type { ICheatPolicy } from "./CheatPolicy.class";
import { symbolGenerator } from "./SymbolGenerator.class";
import { rewardCalculator } from "./RewardCalculator.class";
import { cheatPolicy } from "./CheatPolicy.class";

export type RollResult = {
  symbols: [Symbol, Symbol, Symbol];
  isWin: boolean;
  reward: number;
};

export class SlotMachine {
  constructor(
    private readonly symbolGenerator: ISymbolGenerator,
    private readonly rewardCalculator: IRewardCalculator,
    private readonly cheatPolicy: ICheatPolicy,
  ) {}

  roll(currentCredits: number): RollResult {
    let symbols = this.symbolGenerator.generateReel();
    let result = this.rewardCalculator.calculate(symbols);

    if (result.isWin && this.cheatPolicy.shouldReRoll(currentCredits)) {
      symbols = this.symbolGenerator.generateReel();
      result = this.rewardCalculator.calculate(symbols);
    }

    return { symbols, isWin: result.isWin, reward: result.reward };
  }
}

export const slotMachine = new SlotMachine(symbolGenerator, rewardCalculator, cheatPolicy);
