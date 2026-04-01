import { Link } from 'react-router-dom';
import { MessageSquare, ThumbsUp } from 'lucide-react';
import type { Professor } from '../types';
import RatingBadge from './RatingBadge';

interface Props {
  professor: Professor;
}

export default function ProfessorCard({ professor }: Props) {
  return (
    <Link
      to={`/professors/${professor.id}`}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all duration-200 flex gap-4 items-start"
    >
      <RatingBadge rating={professor.avg_rating} size="sm" />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
              {professor.title} {professor.name}
            </h3>
            {professor.department_name && (
              <p className="text-xs text-blue-600 font-medium mt-0.5">{professor.department_name}</p>
            )}
            {professor.university_name && (
              <p className="text-xs text-gray-500 mt-0.5">{professor.university_short || professor.university_name}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">{professor.num_ratings} değerlendirme</span>
          </div>
          {professor.would_take_again > 0 && (
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs text-gray-500">%{Math.round(professor.would_take_again)} tekrar alır</span>
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-gray-500">Zorluk:</span>
          <div className="flex-1 max-w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-400 to-red-400"
              style={{ width: `${(professor.difficulty / 5) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-700">{professor.difficulty.toFixed(1)}/5</span>
        </div>
      </div>
    </Link>
  );
}
