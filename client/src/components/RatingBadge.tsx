interface Props {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function RatingBadge({ rating, size = 'md' }: Props) {
  const getRatingClass = (r: number) => {
    if (r >= 4) return 'rating-excellent';
    if (r >= 3) return 'rating-good';
    if (r >= 2) return 'rating-average';
    return 'rating-poor';
  };

  const sizeClass = size === 'sm'
    ? 'w-12 h-12 text-lg'
    : size === 'lg'
    ? 'w-24 h-24 text-4xl'
    : 'w-16 h-16 text-2xl';

  return (
    <div className={`rating-circle ${getRatingClass(rating)} ${sizeClass}`}>
      {rating > 0 ? rating.toFixed(1) : 'N/A'}
    </div>
  );
}
