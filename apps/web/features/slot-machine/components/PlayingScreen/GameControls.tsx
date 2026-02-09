import { Button } from "@/components/ui/button";

interface GameControlsProps {
  onRoll: () => void;
  onCashout: () => void;
  rollDisabled: boolean;
  cashoutDisabled: boolean;
}

export default function GameControls({
  onRoll,
  onCashout,
  rollDisabled,
  cashoutDisabled,
}: GameControlsProps) {
  return (
    <div className="flex gap-4">
      <Button
        onClick={onRoll}
        disabled={rollDisabled}
        data-testid="roll-button"
      >
        Roll
      </Button>
      <Button
        variant="outline"
        onClick={onCashout}
        disabled={cashoutDisabled}
        data-testid="cashout-button"
      >
        Cash Out
      </Button>
    </div>
  );
}
