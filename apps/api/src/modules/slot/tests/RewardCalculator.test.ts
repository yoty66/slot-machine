import { describe, it, expect } from "vitest";
import { RewardCalculator } from "../lib/RewardCalculator.class";
import type { Symbol } from "../lib/slot.types";

describe("RewardCalculator", () => {
  const calc = new RewardCalculator();

  it("all 3 match (C) -> isWin true, reward 10", () => {
    expect(calc.calculate(["C", "C", "C"])).toEqual({
      isWin: true,
      reward: 10,
    });
  });

  it("all 3 match (L) -> isWin true, reward 20", () => {
    expect(calc.calculate(["L", "L", "L"])).toEqual({
      isWin: true,
      reward: 20,
    });
  });

  it("all 3 match (O) -> isWin true, reward 30", () => {
    expect(calc.calculate(["O", "O", "O"])).toEqual({
      isWin: true,
      reward: 30,
    });
  });

  it("all 3 match (W) -> isWin true, reward 40", () => {
    expect(calc.calculate(["W", "W", "W"])).toEqual({
      isWin: true,
      reward: 40,
    });
  });

  it("no match -> isWin false, reward 0", () => {
    expect(calc.calculate(["C", "L", "O"])).toEqual({
      isWin: false,
      reward: 0,
    });
  });

  it("two match -> isWin false, reward 0", () => {
    expect(calc.calculate(["C", "C", "L"])).toEqual({
      isWin: false,
      reward: 0,
    });
  });

  it("respects a custom reward table", () => {
    const custom: Record<Symbol, number> = { C: 100, L: 200, O: 300, W: 400 };
    const customCalc = new RewardCalculator(custom);
    expect(customCalc.calculate(["C", "C", "C"])).toEqual({
      isWin: true,
      reward: 100,
    });
    expect(customCalc.calculate(["W", "W", "W"])).toEqual({
      isWin: true,
      reward: 400,
    });
  });
});
