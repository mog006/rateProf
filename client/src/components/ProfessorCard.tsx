import { Link } from 'react-router-dom';
import type { Professor } from '../types';

interface Props {
  professor: Professor;
}

function getRatingColor(r: number): string {
  if (r <= 0) return '#9E9E9E';
  if (r >= 4) return '#4CAF50';
  if (r >= 3) return '#FF9800';
  return '#F44336';
}

export default function ProfessorCard({ professor }: Props) {
  const ratingColor = getRatingColor(professor.avg_rating);

  return (
    <Link
      to={`/professors/${professor.id}`}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-gray-200 transition-all duration-200 flex gap-4 items-center group"
    >
      {/* Rating circle */}
      <div
        className="rating-circle rating-circle-sm flex-shrink-0"
        style={{ backgroundColor: ratingColor }}
      >
        {professor.avg_rating > 0 ? professor.avg_rating.toFixed(1) : (
          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '55%', height: '55%', opacity: 0.9 }}>
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
          </svg>
        )}
      </div>

      {/* Center info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 text-sm leading-tight group-hover:text-gray-700 transition-colors truncate">
          {professor.title} {professor.name}
        </h3>
        {professor.department_name && (
          <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
            {professor.department_name}
          </p>
        )}
        {professor.university_name && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{professor.university_name}</p>
        )}

        {/* Difficulty bar */}
        {professor.difficulty > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-400 shrink-0">Zorluk</span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(professor.difficulty / 5) * 100}%`,
                  background: `linear-gradient(to right, #4CAF50, #F44336)`,
                }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-600 shrink-0">
              {professor.difficulty.toFixed(1)}/5
            </span>
          </div>
        )}
      </div>

      {/* Right: rating count */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-gray-700">{professor.num_ratings}</p>
        <p className="text-xs text-gray-400">oy</p>
        {professor.would_take_again > 0 && (
          <p className="text-xs text-green-600 font-medium mt-1">
            %{Math.round(professor.would_take_again)}
          </p>
        )}
      </div>
    </Link>
  );
}
