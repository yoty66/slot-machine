import { Button } from "@/components/ui/button";

interface CashedOutScreenProps {
  credits: number;
  onPlayAgain: () => void;
}

export default function CashedOutScreen({
  credits,
  onPlayAgain,
}: CashedOutScreenProps) {
  return (
    <div
      className="flex flex-col items-center gap-6"
      data-testid="cashed-out-screen"
    >
      <h2 className="text-2xl font-bold">Cashed Out!</h2>
      <p className="text-lg">
        You cashed out with{" "}
        <span className="font-bold" data-testid="cashout-credits">
          {credits}
        </span>{" "}
        credits.
      </p>
      <Button onClick={onPlayAgain} data-testid="play-again-button">
        Play Again
      </Button>
    </div>
  );
}
