import { ThumbsUp, ThumbsDown, Calendar } from 'lucide-react';
import type { Review } from '../types';
import RatingBadge from './RatingBadge';
import { voteReview } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface Props {
  review: Review;
  showProfessor?: boolean;
}

const GRADE_COLOR: Record<string, string> = {
  AA: 'bg-green-100 text-green-700',
  BA: 'bg-blue-100 text-blue-700',
  BB: 'bg-blue-100 text-blue-600',
  CB: 'bg-yellow-100 text-yellow-700',
  CC: 'bg-yellow-100 text-yellow-600',
  DC: 'bg-orange-100 text-orange-700',
  DD: 'bg-red-100 text-red-600',
  FF: 'bg-red-100 text-red-700',
};

export default function ReviewCard({ review, showProfessor = false }: Props) {
  const { user } = useAuth();
  const date = new Date(review.created_at).toLocaleDateString('tr-TR', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const handleVote = async (isHelpful: boolean) => {
    if (!user) {
      toast.error('Oy vermek için giriş yapmalısınız');
      return;
    }
    try {
      await voteReview(review.id, isHelpful);
      toast.success('Oyunuz kaydedildi');
    } catch {
      toast.error('Oy kaydedilemedi');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start gap-4">
        <RatingBadge rating={review.overall_rating} size="sm" />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              {showProfessor && review.professor_name && (
                <p className="text-sm font-semibold text-blue-600">{review.professor_name}</p>
              )}
              {showProfessor && review.university_name && (
                <p className="text-xs text-gray-500">{review.university_name}</p>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                {review.course_code && (
                  <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {review.course_code}
                  </span>
                )}
                {review.grade && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${GRADE_COLOR[review.grade] || 'bg-gray-100 text-gray-600'}`}>
                    {review.grade}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                {date}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">Zorluk:</span>
                <span className={`text-xs font-semibold ${review.difficulty >= 4 ? 'text-red-600' : review.difficulty >= 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {review.difficulty}/5
                </span>
              </div>
            </div>
          </div>

          {/* Comment */}
          <p className="text-sm text-gray-700 mt-3 leading-relaxed">{review.comment}</p>

          {/* Tags */}
          {review.tags && review.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {review.tags.map((tag, i) => (
                <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-1">
              {review.would_take_again ? (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✓ Tekrar alır</span>
              ) : (
                <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">✗ Almaz</span>
              )}
              {review.attendance && (
                <span className="text-xs text-gray-400 ml-2">Devam: {review.attendance}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">Faydalı mı?</span>
              <button onClick={() => handleVote(true)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-600 transition-colors">
                <ThumbsUp className="w-3.5 h-3.5" />
                {review.helpful_count}
              </button>
              <button onClick={() => handleVote(false)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors">
                <ThumbsDown className="w-3.5 h-3.5" />
                {review.not_helpful_count}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
