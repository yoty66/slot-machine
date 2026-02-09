"use client";

import { useState, useEffect } from "react";

interface SlotReelProps {
  symbols: [string | null, string | null, string | null];
  isSpinning: boolean;
}

function SlotBlock({
  symbol,
  isSpinning,
}: {
  symbol: string | null;
  isSpinning: boolean;
}) {
  const [displaySymbol, setDisplaySymbol] = useState<string | null>(null);

  useEffect(() => {
    if (symbol !== null) {
      // Clear display immediately when symbol becomes null (for reroll)
      setDisplaySymbol(null);
      const timer = setTimeout(() => {
        setDisplaySymbol(symbol);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Clear immediately when symbol becomes null
      setDisplaySymbol(null);
    }
  }, [symbol]);

  const blockBase =
    "w-20 h-20 border-2 border-border rounded-lg flex items-center justify-center text-3xl font-bold select-none";

  if (displaySymbol) {
    return (
      <div
        className={`${blockBase} text-foreground bg-card`}
        data-testid="slot-block"
      >
        <span style={{ animation: "slot-fade-in 0.3s ease-out" }}>
          {displaySymbol}
        </span>
      </div>
    );
  }

  if (isSpinning) {
    return (
      <div
        className={`${blockBase} text-muted-foreground`}
        data-testid="slot-block"
      >
        <span
          style={{
            animation: "slot-spin 0.5s linear infinite",
            display: "inline-block",
          }}
        >
          X
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${blockBase} text-muted-foreground`}
      data-testid="slot-block"
    >
      X
    </div>
  );
}

export default function SlotReel({
  symbols,
  isSpinning,
}: SlotReelProps) {
  return (
    <div
      className="border-2 border-border rounded-xl bg-muted/30 p-4"
      data-testid="slot-reel"
    >
      <div className="flex flex-row gap-4">
        <SlotBlock symbol={symbols[0]} isSpinning={isSpinning} />
        <SlotBlock symbol={symbols[1]} isSpinning={isSpinning} />
        <SlotBlock symbol={symbols[2]} isSpinning={isSpinning} />
      </div>
    </div>
  );
}
