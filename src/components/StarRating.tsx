import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface StarRatingProps {
  rating: number;
  onRate: (rating: number) => void;
  className?: string;
}

const StarRating = ({ rating, onRate, className }: StarRatingProps) => {
  const [hover, setHover] = React.useState<number | null>(null);

  return (
    <div className={cn("flex gap-2", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-8 h-8 cursor-pointer transition-all duration-200 ease-in-out",
            (hover !== null ? hover >= star : rating >= star)
              ? "fill-yellow-400 text-yellow-400 scale-110"
              : "text-gray-300 hover:text-gray-400"
          )}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onRate(star)}
        />
      ))}
    </div>
  );
};

export default StarRating; 