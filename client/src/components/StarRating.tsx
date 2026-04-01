import { Star } from 'lucide-react';

interface Props {
  rating: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (r: number) => void;
}

export default function StarRating({ rating, max = 5, size = 16, interactive = false, onChange }: Props) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={`${i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
          onClick={() => interactive && onChange && onChange(i + 1)}
        />
      ))}
    </div>
  );
}
