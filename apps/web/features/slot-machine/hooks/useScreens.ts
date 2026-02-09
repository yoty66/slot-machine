"use client";

import { useEffect, useState } from "react";

export type GameScreen =
  | "loading"
  | "error"
  | "playing"
  | "spinning"
  | "gameOver"
  | "cashedOut";

interface UseScreensParams {
  isLoading: boolean;
  isSessionError: boolean;
  isCashoutSuccess: boolean;
  sessionCredits: number | null;
  credits: number;
  isSpinning: boolean;
}

export function useScreens({
  isLoading,
  isSessionError,
  isCashoutSuccess,
  sessionCredits,
  credits,
  isSpinning,
}: UseScreensParams): GameScreen {
  const [screen, setScreen] = useState<GameScreen>("loading");

  useEffect(() => {
    if (isLoading) {
      setScreen("loading");
      return;
    }

    if (isSessionError) {
      setScreen("error");
      return;
    }

    if (isCashoutSuccess) {
      setScreen("cashedOut");
      return;
    }

    if (credits === 0 && !isSpinning) {
      setScreen("gameOver");
      return;
    }

    if (isSpinning) {
      setScreen("spinning");
      return;
    }

    setScreen("playing");
  }, [isLoading, isSessionError, isCashoutSuccess, sessionCredits, credits, isSpinning]);

  return screen;
}

