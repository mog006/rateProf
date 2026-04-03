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
      {rating > 0 ? rating.toFixed(1) : (
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '55%', height: '55%', opacity: 0.9 }}>
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
        </svg>
      )}
    </div>
  );
}
