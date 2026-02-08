import type { Symbol } from "./slot.types";
import { SYMBOLS } from "./slot.constants";

export interface ISymbolGenerator {
  generateReel(): [Symbol, Symbol, Symbol];
}

export class SymbolGenerator implements ISymbolGenerator {
  constructor(private readonly symbols: readonly Symbol[] = SYMBOLS) {}

  generateReel(): [Symbol, Symbol, Symbol] {
    return [
      this.symbols[Math.floor(Math.random() * this.symbols.length)]!,
      this.symbols[Math.floor(Math.random() * this.symbols.length)]!,
      this.symbols[Math.floor(Math.random() * this.symbols.length)]!,
    ];
  }
}

export const symbolGenerator = new SymbolGenerator();
