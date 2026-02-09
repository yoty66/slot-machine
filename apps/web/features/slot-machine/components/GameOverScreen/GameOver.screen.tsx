import { Button } from "@/components/ui/button";

interface GameOverScreenProps {
  onNewGame: () => void;
}

export default function GameOverScreen({ onNewGame }: GameOverScreenProps) {
  return (
    <div
      className="flex flex-col items-center gap-6"
      data-testid="game-over-screen"
    >
      <h2 className="text-2xl font-bold">Game Over</h2>
      <p className="text-muted-foreground">You ran out of credits.</p>
      <Button onClick={onNewGame} data-testid="new-game-button">
        New Game
      </Button>
    </div>
  );
}
