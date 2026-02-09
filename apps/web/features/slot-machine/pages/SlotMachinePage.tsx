"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useSession, useCashout } from "../dao/slot.queries";
import { useRoll } from "../hooks/useRoll";
import { useScreens } from "../hooks/useScreens";
import ErrorScreen from "../components/ErrorScreen/Error.screen";
import GameOverScreen from "../components/GameOverScreen/GameOver.screen";
import CashedOutScreen from "../components/CashedOutScreen/CashedOut.screen";
import PlayingScreen from "../components/PlayingScreen/Playing.screen";

export default function SlotMachinePage() {
  const {
    data: session,
    isLoading,
    isError: isSessionError,
    refetch,
  } = useSession();
  const cashoutMutation = useCashout();
  const {
    delayedSymbols,
    rollResult,
    credits,
    isSpinning,
    handleRoll,
    reset: resetRoll,
  } = useRoll(session?.credits ?? 0);

  const screen = useScreens({
    isLoading,
    isSessionError,
    isCashoutSuccess: cashoutMutation.isSuccess,
    sessionCredits: session?.credits ?? null,
    credits,
    isSpinning,
  });

  const handleCashout = useCallback(() => {
    cashoutMutation.mutate(undefined, {
      onError: () => {
        toast.error("Something went wrong. Please try again.");
      },
    });
  }, [cashoutMutation]);

  const handleNewGame = useCallback(() => {
    resetRoll();
    cashoutMutation.reset();
    refetch();
  }, [resetRoll, cashoutMutation, refetch]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {screen === "loading" && (
        <div data-testid="loading-screen">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      )}
      {screen === "error" && <ErrorScreen onRetry={() => refetch()} />}
      {screen === "cashedOut" && (
        <CashedOutScreen
          credits={cashoutMutation.data?.credits ?? 0}
          onPlayAgain={handleNewGame}
        />
      )}
      {screen === "gameOver" && <GameOverScreen onNewGame={handleNewGame} />}
      {(screen === "playing" || screen === "spinning") && (
        <PlayingScreen
          credits={credits}
          rollResult={rollResult}
          delayedSymbols={delayedSymbols}
          isSpinning={isSpinning}
          isRollDisabled={isSpinning || credits === 0}
          isCashoutDisabled={isSpinning || cashoutMutation.isPending}
          onRoll={handleRoll}
          onCashout={handleCashout}
        />
      )}
    </div>
  );
}
