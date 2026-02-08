import { describe, it, expect, vi } from "vitest";
import { CheatPolicy } from "../lib/CheatPolicy.class";

const runTrials = (policy: CheatPolicy, credits: number, count: number) => {
  let reRolls = 0;
  for (let i = 0; i < count; i++) {
    if (policy.shouldReRoll(credits)) reRolls++;
  }
  return reRolls / count;
};

const TRIALS = 10_000;
const TOLERANCE = 0.05;

describe("CheatPolicy", () => {
  it("credits < 40 -> never re-rolls", () => {
    const policy = new CheatPolicy();
    expect(runTrials(policy, 0, TRIALS)).toBe(0);
    expect(runTrials(policy, 10, TRIALS)).toBe(0);
    expect(runTrials(policy, 39, TRIALS)).toBe(0);
  });

  it("credits 40-60 -> re-rolls ~30% of the time", () => {
    const policy = new CheatPolicy();
    const rate = runTrials(policy, 50, TRIALS);
    expect(rate).toBeGreaterThan(0.3 - TOLERANCE);
    expect(rate).toBeLessThan(0.3 + TOLERANCE);
  });

  it("credits > 60 -> re-rolls ~60% of the time", () => {
    const policy = new CheatPolicy();
    const rate = runTrials(policy, 70, TRIALS);
    expect(rate).toBeGreaterThan(0.6 - TOLERANCE);
    expect(rate).toBeLessThan(0.6 + TOLERANCE);
  });

  it("boundary: credits exactly 40 falls in 30% bracket", () => {
    const policy = new CheatPolicy();
    const rate = runTrials(policy, 40, TRIALS);
    expect(rate).toBeGreaterThan(0.3 - TOLERANCE);
    expect(rate).toBeLessThan(0.3 + TOLERANCE);
  });

  it("boundary: credits exactly 60 falls in 30% bracket", () => {
    const policy = new CheatPolicy();
    const rate = runTrials(policy, 60, TRIALS);
    expect(rate).toBeGreaterThan(0.3 - TOLERANCE);
    expect(rate).toBeLessThan(0.3 + TOLERANCE);
  });

  it("boundary: credits exactly 61 falls in 60% bracket", () => {
    const policy = new CheatPolicy();
    const rate = runTrials(policy, 61, TRIALS);
    expect(rate).toBeGreaterThan(0.6 - TOLERANCE);
    expect(rate).toBeLessThan(0.6 + TOLERANCE);
  });

  it("respects custom brackets", () => {
    const brackets = [{ min: 10, max: 20, chance: 0.5 }];
    const policy = new CheatPolicy(brackets);
    const rateInBracket = runTrials(policy, 15, TRIALS);
    expect(rateInBracket).toBeGreaterThan(0.5 - TOLERANCE);
    expect(rateInBracket).toBeLessThan(0.5 + TOLERANCE);
    expect(runTrials(policy, 25, TRIALS)).toBe(0);
  });

  it("logs info when re-roll is triggered", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const brackets = [{ min: 0, max: Infinity, chance: 1 }];
    const policy = new CheatPolicy(brackets);
    policy.shouldReRoll(50);
    expect(logSpy).toHaveBeenCalledWith(
      "CheatPolicy: re-roll triggered",
      expect.objectContaining({ credits: 50 }),
    );
    logSpy.mockRestore();
  });
});
