interface CreditDisplayProps {
  credits: number;
}

export default function CreditDisplay({ credits }: CreditDisplayProps) {
  return (
    <div className="text-lg font-semibold" data-testid="credit-display">
      Credits: <span data-testid="credit-value">{credits}</span>
    </div>
  );
}
