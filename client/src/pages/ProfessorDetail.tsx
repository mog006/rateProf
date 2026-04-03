import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, BookOpen, BarChart3, Star, Plus, Share2, Users, X } from 'lucide-react';
import { getProfessor, getProfessors, addCourse } from '../lib/api';
import type { Professor } from '../types';
import ReviewCard from '../components/ReviewCard';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

function getRatingColor(r: number): string {
  if (r <= 0) return '#9E9E9E';
  if (r >= 4) return '#4CAF50';
  if (r >= 3) return '#FF9800';
  return '#F44336';
}

function getDifficultyColor(d: number): string {
  if (d <= 0) return '#9E9E9E';
  if (d <= 2) return '#4CAF50';
  if (d <= 3) return '#FF9800';
  return '#F44336';
}

function getRatingBarColor(star: number, pct: number): string {
  if (pct === 0) return '#E5E7EB';
  if (star >= 4) return '#4CAF50';
  if (star === 3) return '#FF9800';
  return '#F44336';
}

function CoursesCard({ professor, user, onAddClick }: {
  professor: Professor;
  user: import('../types').User | null;
  onAddClick: () => void;
}) {
  const canAdd = !!user && !!user.university_id && !!professor.university_id &&
    Number(user.university_id) === Number(professor.university_id);
  const courses = professor.courses ?? [];

  if (courses.length === 0 && !canAdd) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-green-600" />
          Verdiği Dersler
        </h3>
        {canAdd && (
          <button
            onClick={onAddClick}
            className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Ders Ekle
          </button>
        )}
      </div>
      {courses.length > 0 ? (
        <div className="space-y-2">
          {courses.map(c => (
            <Link key={c.id} to={`/courses/${c.id}`} className="block text-sm leading-snug hover:bg-gray-50 rounded-lg px-1.5 py-1 -mx-1.5 transition-colors group">
              <span className="font-semibold text-gray-800 group-hover:text-green-700">{c.code}</span>
              <span className="text-gray-500 ml-1.5">{c.name}</span>
              {(c.semester || c.year) && (
                <span className="text-xs text-gray-400 ml-1">
                  ({[c.semester, c.year].filter(Boolean).join(' ')})
                </span>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">Henüz ders eklenmemiş. İlk dersi sen ekle!</p>
      )}
    </div>
  );
}

export default function ProfessorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<'newest' | 'helpful' | 'rating_high' | 'rating_low'>('newest');
  const [similar, setSimilar] = useState<Professor[]>([]);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [addingCourse, setAddingCourse] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  const loadProfessor = (profId: string) => {
    getProfessor(profId)
      .then(p => {
        setProfessor(p);
        if (p?.department_id) {
          getProfessors({ department_id: String(p.department_id), limit: '6' })
            .then((data: any) => {
              const list: Professor[] = Array.isArray(data) ? data : (data.professors ?? []);
              setSimilar(list.filter((x: Professor) => x.id !== p.id).slice(0, 4));
            })
            .catch(() => {});
        }
      })
      .catch(() => setProfessor(null));
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProfessor(id)
      .then(p => {
        setProfessor(p);
        if (p?.department_id) {
          getProfessors({ department_id: String(p.department_id), limit: '6' })
            .then((data: any) => {
              const list: Professor[] = Array.isArray(data) ? data : (data.professors ?? []);
              setSimilar(list.filter((x: Professor) => x.id !== p.id).slice(0, 4));
            })
            .catch(() => {});
        }
      })
      .catch(() => setProfessor(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !courseCode.trim() || !courseName.trim()) return;
    setAddingCourse(true);
    try {
      await addCourse(id, { code: courseCode.trim(), name: courseName.trim() });
      toast.success('Ders eklendi!');
      setShowAddCourse(false);
      setCourseCode('');
      setCourseName('');
      loadProfessor(id);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Ders eklenemedi');
    } finally {
      setAddingCourse(false);
    }
  };

  useEffect(() => {
    if (showAddCourse) setTimeout(() => codeRef.current?.focus(), 50);
  }, [showAddCourse]);

  const handleShare = async () => {
    const url = window.location.href;
    const title = professor ? `${professor.title} ${professor.name} — KampüsPuan` : 'KampüsPuan';
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Profil bağlantısı kopyalandı!');
    }
  };

  if (loading) {
    return (
      <div>
        {/* Header skeleton */}
        <div className="bg-gray-800 py-10 px-4">
          <div className="max-w-5xl mx-auto animate-pulse">
            <div className="h-4 bg-white/10 rounded w-48 mb-6" />
            <div className="flex gap-6">
              <div className="w-24 h-24 rounded-full bg-white/10" />
              <div className="flex-1 space-y-3">
                <div className="h-8 bg-white/10 rounded w-64" />
                <div className="h-4 bg-white/10 rounded w-40" />
              </div>
            </div>
          </div>
        </div>
        {/* Body skeleton */}
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-6 animate-pulse">
            <div className="space-y-4">
              <div className="h-48 bg-gray-200 rounded-xl" />
              <div className="h-32 bg-gray-200 rounded-xl" />
            </div>
            <div className="lg:col-span-2 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-200 rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!professor) {
    return (
      <div className="text-center py-24 text-gray-400">
        <Star className="w-14 h-14 mx-auto mb-4 opacity-20" />
        <p className="text-lg font-medium">Hoca bulunamadı</p>
        <Link to="/professors" className="mt-4 inline-block text-sm text-gray-500 hover:underline">
          Tüm hocalara dön
        </Link>
      </div>
    );
  }

  const reviews = professor.reviews ?? [];

  const filteredReviews = (filter
    ? reviews.filter(r => r.course_id === parseInt(filter))
    : reviews
  ).slice().sort((a, b) => {
    if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sort === 'helpful') return (b.helpful_count - b.not_helpful_count) - (a.helpful_count - a.not_helpful_count);
    if (sort === 'rating_high') return b.overall_rating - a.overall_rating;
    if (sort === 'rating_low') return a.overall_rating - b.overall_rating;
    return 0;
  });

  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => Math.round(r.overall_rating) === star).length,
    pct: reviews.length
      ? Math.round((reviews.filter(r => Math.round(r.overall_rating) === star).length / reviews.length) * 100)
      : 0,
  }));

  const ratingColor = getRatingColor(professor.avg_rating);
  const diffColor = getDifficultyColor(professor.difficulty);

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ── HEADER ── */}
      <div className="bg-gray-900 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-white/50 mb-6">
            <Link to="/professors" className="hover:text-white transition-colors">Hocalar</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white/80">{professor.name}</span>
          </div>

          {/* Main header row */}
          <div className="flex flex-col sm:flex-row items-start gap-6">

            {/* Big rating circle + label */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className="rating-circle-lg"
                style={{ backgroundColor: ratingColor }}
              >
                {professor.avg_rating > 0 ? professor.avg_rating.toFixed(1) : 'N/A'}
              </div>
              <p className="text-xs text-white/50 mt-2 font-medium">Genel Puan</p>
            </div>

            {/* Name + info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                {professor.title} {professor.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {professor.department_name && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white/90">
                    {professor.department_name}
                  </span>
                )}
                {professor.university_name && (
                  <Link
                    to={`/universities/${professor.university_id}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                  >
                    {professor.university_name}
                  </Link>
                )}
              </div>

              {/* Stats boxes */}
              <div className="flex items-center gap-3 mt-5 flex-wrap">
                <div className="bg-white/10 rounded-xl px-5 py-3 text-center min-w-[110px]">
                  <p
                    className="text-2xl font-extrabold"
                    style={{ color: professor.would_take_again > 0 ? '#4CAF50' : '#9E9E9E' }}
                  >
                    {professor.would_take_again > 0
                      ? `%${Math.round(professor.would_take_again)}`
                      : '—'}
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">Tekrar Alır</p>
                </div>
                <div className="bg-white/10 rounded-xl px-5 py-3 text-center min-w-[110px]">
                  <p
                    className="text-2xl font-extrabold"
                    style={{ color: professor.difficulty > 0 ? diffColor : '#9E9E9E' }}
                  >
                    {professor.difficulty > 0 ? professor.difficulty.toFixed(1) : '—'}
                    {professor.difficulty > 0 && (
                      <span className="text-sm font-normal text-white/40">/5</span>
                    )}
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">Zorluk</p>
                </div>
                <div className="bg-white/10 rounded-xl px-5 py-3 text-center min-w-[90px]">
                  <p className="text-2xl font-extrabold text-white">{professor.num_ratings}</p>
                  <p className="text-xs text-white/50 mt-0.5">Değerlendirme</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="shrink-0 sm:self-center flex flex-col gap-2">
              <button
                onClick={() => navigate(`/professors/${professor.id}/review`)}
                className="flex items-center gap-2 px-5 py-3 bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-xl shadow-lg whitespace-nowrap"
              >
                <Star className="w-4 h-4 fill-white" />
                Değerlendir
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 px-5 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Paylaş
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── LEFT SIDEBAR ── */}
          <div className="space-y-5">

            {/* Rating distribution */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                Puan Dağılımı
              </h3>
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-400">Henüz değerlendirme yok</p>
              ) : (
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
                            backgroundColor: getRatingBarColor(star, pct),
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-6 text-right shrink-0">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top tags */}
            {professor.tagStats && professor.tagStats.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-4">Öne Çıkan Etiketler</h3>
                <div className="flex flex-wrap gap-2">
                  {professor.tagStats.map(({ tag, count }) => (
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

            {/* Courses taught */}
            <CoursesCard
              professor={professor}
              user={user}
              onAddClick={() => setShowAddCourse(true)}
            />

            {/* Similar professors */}
            {similar.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  {professor.department_name
                    ? `${professor.department_name} Bölümü`
                    : 'Aynı Bölümdeki Hocalar'}
                </h3>
                <div className="space-y-2.5">
                  {similar.map(p => (
                    <Link
                      key={p.id}
                      to={`/professors/${p.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div
                        className="rating-circle shrink-0"
                        style={{ width: 32, height: 32, fontSize: '0.65rem', backgroundColor: getRatingColor(p.avg_rating) }}
                      >
                        {p.avg_rating > 0 ? p.avg_rating.toFixed(1) : 'N/A'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate group-hover:text-gray-600">
                          {p.title} {p.name}
                        </p>
                        <p className="text-xs text-gray-400">{p.num_ratings} değerlendirme</p>
                      </div>
                    </Link>
                  ))}
                </div>
                {professor.department_id && (
                  <Link
                    to={`/professors?department_id=${professor.department_id}`}
                    className="mt-3 block text-xs text-gray-400 hover:text-gray-600 text-center"
                  >
                    Tümünü gör →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* ── REVIEWS MAIN ── */}
          <div className="lg:col-span-2">

            {/* Reviews header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-lg font-bold text-gray-900">
                {reviews.length} Değerlendirme
              </h2>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Course filter */}
                {professor.courses && professor.courses.length > 0 && (
                  <select
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-coral-400"
                  >
                    <option value="">Tüm Dersler</option>
                    {professor.courses.map(c => (
                      <option key={c.id} value={c.id}>{c.code}</option>
                    ))}
                  </select>
                )}

                {/* Sort */}
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value as 'newest' | 'helpful' | 'rating_high' | 'rating_low')}
                  className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-coral-400"
                >
                  <option value="newest">En Yeni</option>
                  <option value="helpful">En Faydalı</option>
                  <option value="rating_high">En Yüksek</option>
                  <option value="rating_low">En Düşük</option>
                </select>

                {/* Rate button */}
                <Link
                  to={`/professors/${professor.id}/review`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-coral-500 hover:bg-coral-600 text-white text-xs font-bold rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Değerlendir
                </Link>
              </div>
            </div>

            {/* Review list */}
            {filteredReviews.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                <Star className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="text-gray-600 font-semibold text-lg">Henüz değerlendirme yok</p>
                <p className="text-gray-400 text-sm mt-2 mb-6">İlk değerlendirmeyi sen yap!</p>
                <Link
                  to={`/professors/${professor.id}/review`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                  Değerlendirme Ekle
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReviews.map(r => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Course Modal */}
      {showAddCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-green-600" />
                Ders Ekle
              </h2>
              <button onClick={() => setShowAddCourse(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ders Kodu</label>
                <input
                  ref={codeRef}
                  type="text"
                  value={courseCode}
                  onChange={e => setCourseCode(e.target.value)}
                  placeholder="örn. CENG315"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 uppercase"
                  maxLength={20}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ders Adı</label>
                <input
                  type="text"
                  value={courseName}
                  onChange={e => setCourseName(e.target.value)}
                  placeholder="örn. Algoritma Analizi"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  maxLength={100}
                  required
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddCourse(false)}
                  className="flex-1 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={addingCourse || !courseCode.trim() || !courseName.trim()}
                  className="flex-1 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-xl transition-colors"
                >
                  {addingCourse ? 'Ekleniyor...' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
