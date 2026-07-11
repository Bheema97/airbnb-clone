import { Star } from "lucide-react";

interface RatingDisplayProps {
  rating: number;
  count: number;
  className?: string;
}

export default function RatingDisplay({ rating, count, className = "" }: RatingDisplayProps) {
  if (count === 0) {
    return <span className={`text-sm text-gray-500 ${className}`}>New</span>;
  }

  return (
    <div className={`flex items-center gap-1 text-sm ${className}`}>
      <Star className="w-4 h-4 fill-current text-gray-900" />
      <span className="font-medium text-gray-900">{rating.toFixed(2)}</span>
      <span className="text-gray-500">({count})</span>
    </div>
  );
}
