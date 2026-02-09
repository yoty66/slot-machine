import { describe, it, expect } from "vitest";
import { SlotMachine } from "../lib/SlotMachine.class";
import type { ISymbolGenerator } from "../lib/SymbolGenerator.class";
import type { IRewardCalculator } from "../lib/RewardCalculator.class";
import type { ICheatPolicy } from "../lib/CheatPolicy.class";
import type { Symbol } from "../lib/slot.types";

const makeGenerator = (reels: [Symbol, Symbol, Symbol][]): ISymbolGenerator => {
  let callIndex = 0;
  return {
    generateReel() {
      return reels[callIndex++]!;
    },
  };
};

const makeCalculator = (
  results: { isWin: boolean; reward: number }[],
): IRewardCalculator => {
  let callIndex = 0;
  return {
    calculate() {
      return results[callIndex++]!;
    },
  };
};

const makeCheatPolicy = (shouldReRollValue: boolean): ICheatPolicy => ({
  shouldReRoll: () => shouldReRollValue,
});

describe("SlotMachine", () => {
  it("loss scenario: returns symbols, isWin false, reward 0", () => {
    const machine = new SlotMachine(
      makeGenerator([["C", "L", "O"]]),
      makeCalculator([{ isWin: false, reward: 0 }]),
      makeCheatPolicy(false),
    );
    const result = machine.roll(10);
    expect(result).toEqual({
      symbols: ["C", "L", "O"],
      isWin: false,
      reward: 0,
    });
  });

  it("win scenario, no re-roll: returns win symbols and reward", () => {
    const machine = new SlotMachine(
      makeGenerator([["W", "W", "W"]]),
      makeCalculator([{ isWin: true, reward: 40 }]),
      makeCheatPolicy(false),
    );
    const result = machine.roll(10);
    expect(result).toEqual({
      symbols: ["W", "W", "W"],
      isWin: true,
      reward: 40,
    });
  });

  it("win scenario, re-roll triggered, re-roll is loss", () => {
    const machine = new SlotMachine(
      makeGenerator([
        ["W", "W", "W"],
        ["C", "L", "O"],
      ]),
      makeCalculator([
        { isWin: true, reward: 40 },
        { isWin: false, reward: 0 },
      ]),
      makeCheatPolicy(true),
    );
    const result = machine.roll(50);
    expect(result).toEqual({
      symbols: ["C", "L", "O"],
      isWin: false,
      reward: 0,
    });
  });

  it("win scenario, re-roll triggered, re-roll is also win: returns re-rolled win", () => {
    const machine = new SlotMachine(
      makeGenerator([
        ["W", "W", "W"],
        ["C", "C", "C"],
      ]),
      makeCalculator([
        { isWin: true, reward: 40 },
        { isWin: true, reward: 10 },
      ]),
      makeCheatPolicy(true),
    );
    const result = machine.roll(50);
    expect(result).toEqual({
      symbols: ["C", "C", "C"],
      isWin: true,
      reward: 10,
    });
  });

  it("only one re-roll happens (not recursive)", () => {
    let generateCallCount = 0;
    const generator: ISymbolGenerator = {
      generateReel() {
        generateCallCount++;
        return ["W", "W", "W"];
      },
    };
    let calculateCallCount = 0;
    const calculator: IRewardCalculator = {
      calculate() {
        calculateCallCount++;
        return { isWin: true, reward: 40 };
      },
    };
    const machine = new SlotMachine(
      generator,
      calculator,
      makeCheatPolicy(true),
    );
    machine.roll(50);
    expect(generateCallCount).toBe(2);
    expect(calculateCallCount).toBe(2);
  });

  it("passes currentCredits to cheatPolicy", () => {
    let receivedCredits: number | undefined;
    const cheatPolicy: ICheatPolicy = {
      shouldReRoll(credits) {
        receivedCredits = credits;
        return false;
      },
    };
    const machine = new SlotMachine(
      makeGenerator([["W", "W", "W"]]),
      makeCalculator([{ isWin: true, reward: 40 }]),
      cheatPolicy,
    );
    machine.roll(42);
    expect(receivedCredits).toBe(42);
  });

  it("cheatPolicy is not consulted on loss", () => {
    let cheatPolicyCalled = false;
    const cheatPolicy: ICheatPolicy = {
      shouldReRoll() {
        cheatPolicyCalled = true;
        return true;
      },
    };
    const machine = new SlotMachine(
      makeGenerator([["C", "L", "O"]]),
      makeCalculator([{ isWin: false, reward: 0 }]),
      cheatPolicy,
    );
    machine.roll(50);
    expect(cheatPolicyCalled).toBe(false);
  });
});
