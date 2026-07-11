interface PriceDisplayProps {
  amount: number;
  label?: string;
  className?: string;
  amountClassName?: string;
}

export default function PriceDisplay({ amount, label, className = "", amountClassName = "" }: PriceDisplayProps) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return (
    <div className={`flex items-baseline gap-1 ${className}`}>
      <span className={`font-semibold text-gray-900 ${amountClassName}`}>{formatted}</span>
      {label && <span className="text-gray-600 text-sm">{label}</span>}
    </div>
  );
}
