"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { postRoll_ResponseBody } from "@repo/network/slot/postRoll";

export function useDelayedRoll(initialCredits: number) {
  const [delayedSymbols, setDelayedSymbols] = useState<
    [string | null, string | null, string | null]
  >([null, null, null]);
  const [rollResult, setRollResult] = useState<postRoll_ResponseBody | null>(
    null,
  );
  const [credits, setCredits] = useState<number>(initialCredits);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Update credits when initialCredits changes (from session)
  useEffect(() => {
    if (!isSpinning && rollResult === null) {
      setCredits(initialCredits);
    }
  }, [initialCredits, isSpinning, rollResult]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const startRoll = useCallback((result: postRoll_ResponseBody) => {
    // Clear any existing timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    // Reset state - clear everything first
    setRollResult(null);
    setDelayedSymbols([null, null, null]);
    setIsSpinning(true);

    // First symbol revealed immediately (0s) - SlotReel will add 1s delay, so displays at 1s
    const timer0 = setTimeout(() => {
      setDelayedSymbols([result.symbols[0], null, null]);
    }, 0);
    timersRef.current.push(timer0);

    // Second symbol revealed after 1 second - SlotReel adds 1s delay, so displays at 2s
    const timer1 = setTimeout(() => {
      setDelayedSymbols([result.symbols[0], result.symbols[1], null]);
    }, 1000);
    timersRef.current.push(timer1);

    // Third symbol revealed after 2 seconds - SlotReel adds 1s delay, so displays at 3s
    // Update rollResult, credits, and stop spinning after third symbol is actually displayed (3s total)
    const timer2 = setTimeout(() => {
      setDelayedSymbols([
        result.symbols[0],
        result.symbols[1],
        result.symbols[2],
      ]);
    }, 2000);
    timersRef.current.push(timer2);

    // Update credits and rollResult after all symbols are displayed (3s total: 2s + 1s SlotReel delay)
    const timer3 = setTimeout(() => {
      setRollResult(result);
      setCredits(result.credits);
      setIsSpinning(false);
    }, 3000);
    timersRef.current.push(timer3);
  }, []);

  const reset = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setDelayedSymbols([null, null, null]);
    setRollResult(null);
    setIsSpinning(false);
    setCredits(initialCredits);
  }, [initialCredits]);

  return {
    delayedSymbols,
    rollResult,
    credits,
    isSpinning,
    startRoll,
    reset,
  };
}
