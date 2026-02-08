import { describe, it, expect } from "vitest";
import { SymbolGenerator } from "../lib/SymbolGenerator.class";
import { SYMBOLS } from "../lib/slot.constants";
import type { Symbol } from "../lib/slot.types";

describe("SymbolGenerator", () => {
  it("generateReel returns a tuple of 3 symbols", () => {
    const gen = new SymbolGenerator();
    const reel = gen.generateReel();
    expect(reel).toHaveLength(3);
  });

  it("all returned symbols are from the default symbol list", () => {
    const gen = new SymbolGenerator();
    for (let i = 0; i < 50; i++) {
      const reel = gen.generateReel();
      for (const symbol of reel) {
        expect(SYMBOLS).toContain(symbol);
      }
    }
  });

  it("with a single-symbol list, always returns that symbol 3 times", () => {
    const gen = new SymbolGenerator(["W"] as const);
    for (let i = 0; i < 10; i++) {
      const reel = gen.generateReel();
      expect(reel).toEqual(["W", "W", "W"]);
    }
  });

  it("respects a custom symbol list", () => {
    const custom: Symbol[] = ["C", "L"];
    const gen = new SymbolGenerator(custom);
    for (let i = 0; i < 50; i++) {
      const reel = gen.generateReel();
      for (const symbol of reel) {
        expect(custom).toContain(symbol);
      }
    }
  });
});
