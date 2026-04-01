import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, BookOpen, BarChart3, Plus, Star } from 'lucide-react';
import { getProfessor } from '../lib/api';
import type { Professor } from '../types';
import ReviewCard from '../components/ReviewCard';

export default function ProfessorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProfessor(id)
      .then(setProfessor)
      .catch(() => setProfessor(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse space-y-4">
        <div className="h-48 bg-gray-200 rounded-xl" />
        <div className="h-6 bg-gray-100 rounded w-1/3" />
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!professor) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>Hoca bulunamadı</p>
      </div>
    );
  }

  const reviews = professor.reviews || [];
  const filteredReviews = filter
    ? reviews.filter(r => r.course_id === parseInt(filter))
    : reviews;

  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => Math.round(r.overall_rating) === star).length,
    pct: reviews.length ? Math.round((reviews.filter(r => Math.round(r.overall_rating) === star).length / reviews.length) * 100) : 0,
  }));

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-white/60 mb-4">
            <Link to="/professors" className="hover:text-white transition-colors">Hocalar</Link>
            <ChevronRight className="w-4 h-4" />
            <span>{professor.name}</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Rating */}
            <div className="text-center">
              <div className="rating-circle rating-excellent w-24 h-24 text-4xl" style={{
                backgroundColor: professor.avg_rating >= 4 ? '#10b981' : professor.avg_rating >= 3 ? '#3b82f6' : professor.avg_rating >= 2 ? '#f59e0b' : '#ef4444'
              }}>
                {professor.avg_rating > 0 ? professor.avg_rating.toFixed(1) : 'N/A'}
              </div>
              <p className="text-xs text-white/60 mt-2">Genel Puan</p>
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-extrabold">{professor.title} {professor.name}</h1>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-white/70">
                {professor.department_name && (
                  <span className="bg-white/10 px-3 py-1 rounded-full">{professor.department_name}</span>
                )}
                {professor.university_name && (
                  <Link to={`/universities/${professor.university_id}`} className="bg-white/10 px-3 py-1 rounded-full hover:bg-white/20 transition-colors">
                    {professor.university_name}
                  </Link>
                )}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold">{professor.num_ratings}</p>
                  <p className="text-xs text-white/60">Değerlendirme</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold">{professor.difficulty > 0 ? professor.difficulty.toFixed(1) : 'N/A'}<span className="text-sm text-white/60">/5</span></p>
                  <p className="text-xs text-white/60">Zorluk</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold">%{professor.would_take_again > 0 ? Math.round(professor.would_take_again) : 0}</p>
                  <p className="text-xs text-white/60">Tekrar Alır</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate(`/professors/${professor.id}/review`)}
              className="shrink-0 flex items-center gap-2 px-5 py-3 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold rounded-xl transition-colors shadow-lg"
            >
              <Star className="w-4 h-4" />
              Değerlendir
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left sidebar */}
          <div className="space-y-5">
            {/* Rating distribution */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" /> Puan Dağılımı
              </h3>
              <div className="space-y-2">
                {ratingDist.map(({ star, count, pct }) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600 w-3">{star}</span>
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 shrink-0" />
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            {professor.tagStats && professor.tagStats.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-4">Öne Çıkan Etiketler</h3>
                <div className="flex flex-wrap gap-2">
                  {professor.tagStats.map(({ tag, count }) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {tag}
                      <span className="bg-blue-200 text-blue-800 rounded-full px-1.5 py-0.5 text-[10px] font-bold">{count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Courses taught */}
            {professor.courses && professor.courses.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-green-600" /> Verdiği Dersler
                </h3>
                <div className="space-y-2">
                  {professor.courses.map(c => (
                    <div key={c.id} className="text-sm">
                      <span className="font-medium text-gray-800">{c.code}</span>
                      <span className="text-gray-500 ml-1">{c.name}</span>
                      <span className="text-xs text-gray-400 ml-1">({c.semester} {c.year})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Değerlendirmeler ({reviews.length})
              </h2>
              <div className="flex items-center gap-2">
                {professor.courses && professor.courses.length > 0 && (
                  <select
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tüm Dersler</option>
                    {professor.courses.map(c => (
                      <option key={c.id} value={c.id}>{c.code}</option>
                    ))}
                  </select>
                )}
                <Link
                  to={`/professors/${professor.id}/review`}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Değerlendir
                </Link>
              </div>
            </div>

            {filteredReviews.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <Star className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p className="text-gray-500 font-medium">Henüz değerlendirme yok</p>
                <p className="text-gray-400 text-sm mt-1">İlk değerlendirmeyi sen yap!</p>
                <Link
                  to={`/professors/${professor.id}/review`}
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" /> Değerlendirme Ekle
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReviews.map(r => <ReviewCard key={r.id} review={r} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
