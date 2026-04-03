import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Flag, X } from 'lucide-react';
import type { Review } from '../types';
import { voteReview, reportReview } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface Props {
  review: Review;
  showProfessor?: boolean;
}

const GRADE_COLOR: Record<string, string> = {
  AA: 'bg-green-100 text-green-700',
  BA: 'bg-green-100 text-green-600',
  BB: 'bg-blue-100 text-blue-700',
  CB: 'bg-blue-100 text-blue-600',
  CC: 'bg-yellow-100 text-yellow-700',
  DC: 'bg-orange-100 text-orange-700',
  DD: 'bg-red-100 text-red-600',
  FF: 'bg-red-100 text-red-700',
};

const REPORT_REASONS = [
  'Hakaret / Küfür içeriyor',
  'Kişisel bilgi paylaşımı',
  'Spam / Alakasız içerik',
  'Asılsız / Yanıltıcı bilgi',
  'Diğer',
];

function getRatingColor(r: number): string {
  if (r <= 0) return '#9E9E9E';
  if (r >= 4) return '#4CAF50';
  if (r >= 3) return '#FF9800';
  return '#F44336';
}

function getBorderClass(r: number): string {
  if (r <= 0) return 'review-border-gray';
  if (r >= 4) return 'review-border-green';
  if (r >= 3) return 'review-border-orange';
  return 'review-border-red';
}

export default function ReviewCard({ review, showProfessor = false }: Props) {
  const { user } = useAuth();
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count);
  const [notHelpfulCount, setNotHelpfulCount] = useState(review.not_helpful_count);
  const [voted, setVoted] = useState<boolean | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);

  const date = new Date(review.created_at).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const ratingColor = getRatingColor(review.overall_rating);
  const borderClass = getBorderClass(review.overall_rating);

  const handleVote = async (isHelpful: boolean) => {
    if (!user) {
      toast.error('Oy vermek için giriş yapmalısınız');
      return;
    }
    if (voted === isHelpful) return;

    const prevHelpful = helpfulCount;
    const prevNotHelpful = notHelpfulCount;
    const prevVoted = voted;

    if (voted !== null) {
      if (isHelpful) {
        setHelpfulCount(c => c + 1);
        setNotHelpfulCount(c => c - 1);
      } else {
        setNotHelpfulCount(c => c + 1);
        setHelpfulCount(c => c - 1);
      }
    } else {
      if (isHelpful) setHelpfulCount(c => c + 1);
      else setNotHelpfulCount(c => c + 1);
    }
    setVoted(isHelpful);

    try {
      await voteReview(review.id, isHelpful);
      toast.success('Oyunuz kaydedildi');
    } catch {
      setHelpfulCount(prevHelpful);
      setNotHelpfulCount(prevNotHelpful);
      setVoted(prevVoted);
      toast.error('Oy kaydedilemedi');
    }
  };

  const handleReport = async () => {
    if (!reportReason) { toast.error('Lütfen bir sebep seçin'); return; }
    setReporting(true);
    try {
      await reportReview(review.id, reportReason);
      toast.success('Bildiriminiz alındı, incelenecektir.');
      setReportOpen(false);
      setReportReason('');
    } catch {
      toast.error('Bildirim gönderilemedi');
    } finally {
      setReporting(false);
    }
  };

  return (
    <>
      <div className={`bg-white rounded-xl shadow-sm ${borderClass} overflow-hidden`}>
        <div className="flex items-start gap-4 p-5">
          {/* Quality score circle */}
          <div
            className="rating-circle rating-circle-sm flex-shrink-0"
            style={{ backgroundColor: ratingColor }}
          >
            {review.overall_rating > 0 ? review.overall_rating.toFixed(1) : 'N/A'}
          </div>

          <div className="flex-1 min-w-0">
            {/* Professor info (when shown from home page) */}
            {showProfessor && review.professor_name && (
              <div className="mb-2">
                <Link
                  to={`/professors/${review.professor_id}`}
                  className="text-sm font-bold text-gray-800 hover:underline"
                >
                  {review.professor_name}
                </Link>
                {review.university_name && (
                  <span className="text-xs text-gray-400 ml-1">— {review.university_name}</span>
                )}
              </div>
            )}

            {/* Header row: course + grade + date */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {review.course_code && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                    {review.course_code}
                    {review.course_name && (
                      <span className="ml-1 font-normal text-gray-500 hidden sm:inline">— {review.course_name}</span>
                    )}
                  </span>
                )}
                {review.grade && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${GRADE_COLOR[review.grade] ?? 'bg-gray-100 text-gray-600'}`}>
                    {review.grade}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400 shrink-0">{date}</span>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-xs text-gray-500">
                Zorluk:{' '}
                <span
                  className="font-semibold"
                  style={{
                    color:
                      review.difficulty >= 4 ? '#F44336' :
                      review.difficulty >= 3 ? '#FF9800' :
                      '#4CAF50',
                  }}
                >
                  {review.difficulty}/5
                </span>
              </span>
              <span className="text-gray-200">|</span>
              <span className="text-xs text-gray-500">
                Tekrar Alır:{' '}
                <span className={`font-semibold ${review.would_take_again ? 'text-green-600' : 'text-red-500'}`}>
                  {review.would_take_again ? 'Evet' : 'Hayır'}
                </span>
              </span>
              {review.attendance && (
                <>
                  <span className="text-gray-200">|</span>
                  <span className="text-xs text-gray-500">
                    Devam: <span className="font-medium text-gray-700">{review.attendance}</span>
                  </span>
                </>
              )}
            </div>

            {/* Tags */}
            {review.tags && review.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {review.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Comment */}
            <p className="text-sm text-gray-800 mt-3 leading-relaxed">{review.comment}</p>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">Faydalı mı?</span>
                <button
                  onClick={() => handleVote(true)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    voted === true
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-600 hover:bg-green-50'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  {helpfulCount}
                </button>
                <button
                  onClick={() => handleVote(false)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    voted === false
                      ? 'bg-red-50 border-red-300 text-red-600'
                      : 'border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50'
                  }`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  {notHelpfulCount}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {review.user_name && (
                  <span className="text-xs text-gray-400">{review.user_name}</span>
                )}
                {Boolean(review.is_graduate) && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-700">
                    Mezun
                  </span>
                )}
                <button
                  onClick={() => setReportOpen(true)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Bildir"
                >
                  <Flag className="w-3 h-3" />
                  <span className="hidden sm:inline">Bildir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Değerlendirmeyi Bildir</h3>
              <button onClick={() => setReportOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Bu değerlendirme neden uygunsuz?</p>
            <div className="space-y-2 mb-5">
              {REPORT_REASONS.map(r => (
                <label key={r} className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reportReason === r}
                    onChange={() => setReportReason(r)}
                    className="accent-coral-500"
                  />
                  <span className="text-sm text-gray-700">{r}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setReportOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleReport}
                disabled={reporting || !reportReason}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl disabled:opacity-50"
              >
                {reporting ? 'Gönderiliyor...' : 'Bildir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
