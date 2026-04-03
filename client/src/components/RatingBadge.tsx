interface Props {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
}

function getRatingColor(r: number): string {
  if (r <= 0) return 'rating-gray';
  if (r >= 4) return 'rating-green';
  if (r >= 3) return 'rating-orange';
  return 'rating-red';
}

export default function RatingBadge({ rating, size = 'md' }: Props) {
  const colorClass = getRatingColor(rating);

  const sizeClass =
    size === 'sm' ? 'rating-circle-sm' :
    size === 'lg' ? 'rating-circle-lg' :
    'rating-circle-md';

  return (
    <div className={`rating-circle ${colorClass} ${sizeClass}`}>
      {rating > 0 ? rating.toFixed(1) : 'N/A'}
    </div>
  );
}
