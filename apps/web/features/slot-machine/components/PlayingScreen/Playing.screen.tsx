import type { postRoll_ResponseBody } from "@repo/network/slot/postRoll";
import SlotReel from "./SlotReel";
import GameControls from "./GameControls";
import CreditDisplay from "../GameOverScreen/CreditDisplay";

interface PlayingScreenProps {
  credits: number;
  rollResult: postRoll_ResponseBody | null;
  delayedSymbols: [string | null, string | null, string | null];
  isSpinning: boolean;
  isRollDisabled: boolean;
  isCashoutDisabled: boolean;
  onRoll: () => void;
  onCashout: () => void;
}

export default function PlayingScreen({
  credits,
  rollResult,
  delayedSymbols,
  isSpinning,
  onRoll,
  onCashout,
  isRollDisabled,
  isCashoutDisabled,
}: PlayingScreenProps) {
  return (
    <div className="relative flex flex-col items-center gap-8">
      <h1 className="text-3xl font-bold">Slot Machine</h1>
      <CreditDisplay credits={credits} />
      <SlotReel
        symbols={delayedSymbols}
        isSpinning={isSpinning}
      />

      <GameControls
        onRoll={onRoll}
        onCashout={onCashout}
        rollDisabled={isRollDisabled}
        cashoutDisabled={isCashoutDisabled}
      />

      {rollResult && (
        <div
          className={`absolute top-full mt-8 text-lg font-semibold ${rollResult.isWin ? "text-green-600" : "text-muted-foreground"}`}
          data-testid="result-feedback"
        >
          {rollResult.isWin
            ? `You won ${rollResult.reward} credits!`
            : "No luck this time."}
        </div>
      )}
    </div>
  );
}
