"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useRoll as useRollMutation } from "../dao/slot.queries";
import { useDelayedRoll } from "./useDelayedRoll";
import type { postRoll_ResponseBody } from "@repo/network/slot/postRoll";

export function useRoll(initialCredits: number) {
  const rollMutation = useRollMutation();
  const {
    delayedSymbols,
    rollResult,
    credits,
    isSpinning: isDelayedRollSpinning,
    startRoll,
    reset: resetDelayedRoll,
  } = useDelayedRoll(initialCredits);

  const handleRoll = useCallback(() => {
    rollMutation.mutate(undefined, {
      onSuccess: (data) => {
        startRoll(data);
      },
      onError: () => {
        resetDelayedRoll();
        toast.error("Something went wrong. Please try again.");
      },
    });
  }, [rollMutation, startRoll, resetDelayedRoll]);

  const reset = useCallback(() => {
    resetDelayedRoll();
    rollMutation.reset();
  }, [resetDelayedRoll, rollMutation]);

  const isSpinning = rollMutation.isPending || isDelayedRollSpinning;

  return {
    delayedSymbols,
    rollResult,
    credits,
    isSpinning,
    isPending: rollMutation.isPending,
    handleRoll,
    reset,
  };
}
