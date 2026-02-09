import { Button } from "@/components/ui/button";

interface ErrorScreenProps {
  onRetry: () => void;
}

export default function ErrorScreen({ onRetry }: ErrorScreenProps) {
  return (
    <div
      className="flex flex-col items-center gap-4"
      data-testid="error-screen"
    >
      <p className="text-destructive font-semibold">
        Something went wrong. Please try again.
      </p>
      <Button onClick={onRetry} data-testid="retry-button">
        Retry
      </Button>
    </div>
  );
}
