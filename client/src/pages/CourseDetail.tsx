import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, BookOpen, Star, BarChart3 } from 'lucide-react';
import api from '../lib/api';
import ReviewCard from '../components/ReviewCard';

function getDifficultyColor(d: number) {
  if (d <= 2) return '#4CAF50';
  if (d <= 3) return '#FF9800';
  return '#F44336';
}

function getRatingColor(r: number) {
  if (r >= 4) return '#4CAF50';
  if (r >= 3) return '#FF9800';
  return '#F44336';
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get(`/courses/${id}`)
      .then(r => setCourse(r.data))
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-48 mb-6" />
        <div className="h-32 bg-gray-200 rounded-xl mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-36 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-24 text-gray-400">
        <BookOpen className="w-14 h-14 mx-auto mb-4 opacity-20" />
        <p className="text-lg font-medium">Ders bulunamadı</p>
      </div>
    );
  }

  const reviews: any[] = course.reviews ?? [];
  const tagStats: any[] = course.tagStats ?? [];
  const stats = course.stats;

  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => Math.round(r.overall_rating) === star).length,
    pct: reviews.length
      ? Math.round(reviews.filter(r => Math.round(r.overall_rating) === star).length / reviews.length * 100)
      : 0,
  }));

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-gray-900 text-white py-10 px-4">
        <div className="max-w-4xl mx-auto">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-white/50 mb-6 flex-wrap">
            <Link to="/professors" className="hover:text-white transition-colors">Hocalar</Link>
            {course.professor_id && (
              <>
                <ChevronRight className="w-4 h-4" />
                <Link
                  to={`/professors/${course.professor_id}`}
                  className="hover:text-white transition-colors"
                >
                  {course.professor_title} {course.professor_name}
                </Link>
              </>
            )}
            <ChevronRight className="w-4 h-4" />
            <span className="text-white/80">{course.code}</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-green-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-8 h-8 text-white" />
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                {course.code} — {course.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {course.professor_name && (
                  <Link
                    to={`/professors/${course.professor_id}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white/90 hover:bg-white/25 transition-colors"
                  >
                    {course.professor_title} {course.professor_name}
                  </Link>
                )}
                {course.department_name && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/70">
                    {course.department_name}
                  </span>
                )}
                {course.university_name && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/70">
                    {course.university_name}
                  </span>
                )}
              </div>

              {/* Stats */}
              {stats && (
                <div className="flex items-center gap-3 mt-5 flex-wrap">
                  <div className="bg-white/10 rounded-xl px-5 py-3 text-center min-w-[110px]">
                    <p className="text-2xl font-extrabold" style={{ color: getRatingColor(stats.avg_rating) }}>
                      {stats.avg_rating.toFixed(1)}
                    </p>
                    <p className="text-xs text-white/50 mt-0.5">Ortalama Puan</p>
                  </div>
                  <div className="bg-white/10 rounded-xl px-5 py-3 text-center min-w-[110px]">
                    <p className="text-2xl font-extrabold" style={{ color: getDifficultyColor(stats.avg_difficulty) }}>
                      {stats.avg_difficulty.toFixed(1)}<span className="text-sm font-normal text-white/40">/5</span>
                    </p>
                    <p className="text-xs text-white/50 mt-0.5">Zorluk</p>
                  </div>
                  <div className="bg-white/10 rounded-xl px-5 py-3 text-center min-w-[110px]">
                    <p className="text-2xl font-extrabold text-green-400">
                      %{stats.would_take_again}
                    </p>
                    <p className="text-xs text-white/50 mt-0.5">Tekrar Alır</p>
                  </div>
                  <div className="bg-white/10 rounded-xl px-5 py-3 text-center min-w-[90px]">
                    <p className="text-2xl font-extrabold text-white">{reviews.length}</p>
                    <p className="text-xs text-white/50 mt-0.5">Değerlendirme</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Sidebar */}
          <div className="space-y-5">

            {/* Rating distribution */}
            {reviews.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-gray-400" />
                  Puan Dağılımı
                </h3>
                <div className="space-y-2.5">
                  {ratingDist.map(({ star, count, pct }) => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-600 w-3 shrink-0">{star}</span>
                      <Star className="w-3 h-3 text-coral-500 fill-coral-500 shrink-0" />
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: pct === 0 ? '#E5E7EB' : star >= 4 ? '#4CAF50' : star === 3 ? '#FF9800' : '#F44336',
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-6 text-right shrink-0">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {tagStats.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-4">Öne Çıkan Etiketler</h3>
                <div className="flex flex-wrap gap-2">
                  {tagStats.map(({ tag, count }: any) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200"
                    >
                      {tag}
                      <span className="bg-gray-200 text-gray-700 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none">
                        {count}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Back to professor */}
            {course.professor_id && (
              <Link
                to={`/professors/${course.professor_id}`}
                className="flex items-center justify-center gap-2 bg-white rounded-xl shadow-sm p-4 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:shadow-md transition-all"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                {course.professor_title} {course.professor_name} sayfasına dön
              </Link>
            )}
          </div>

          {/* Reviews */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {reviews.length} Değerlendirme
            </h2>

            {reviews.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                <Star className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="text-gray-600 font-semibold text-lg">Bu ders için henüz değerlendirme yok</p>
                {course.professor_id && (
                  <Link
                    to={`/professors/${course.professor_id}/review`}
                    className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-xl"
                  >
                    İlk değerlendirmeyi yap
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map(r => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
