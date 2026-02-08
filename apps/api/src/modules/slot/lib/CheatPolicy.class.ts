import logger from "../../../capabilities/logger";
import { DEFAULT_CHEAT_BRACKETS } from "./slot.constants";

export type CheatBracket = { min: number; max: number; chance: number };

export interface ICheatPolicy {
  shouldReRoll(credits: number): boolean;
}

export class CheatPolicy implements ICheatPolicy {
  constructor(
    private readonly brackets: readonly CheatBracket[] = DEFAULT_CHEAT_BRACKETS,
  ) {}

  shouldReRoll(credits: number): boolean {
    const bracket = this.brackets.find((b) => credits >= b.min && credits <= b.max);
    if (!bracket) return false;

    const roll = Math.random();
    console.log("CheatPolicy: roll", roll);
    if (roll <= bracket.chance) {
      logger.info("CheatPolicy: re-roll triggered", { credits, bracket });
      return true;
    }
    return false;
  }
}

export const cheatPolicy = new CheatPolicy();
