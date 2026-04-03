import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, GraduationCap, Star, ArrowRight, Users, MessageSquare, Plus } from 'lucide-react';
import { search, getRecentReviews, getProfessors, getStats } from '../lib/api';
import type { SearchResult, Review, Professor } from '../types';
import ReviewCard from '../components/ReviewCard';

function getRatingColor(r: number): string {
  if (r <= 0) return '#9E9E9E';
  if (r >= 4) return '#4CAF50';
  if (r >= 3) return '#FF9800';
  return '#F44336';
}

export default function Home() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'professor' | 'university'>('professor');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [topProfessors, setTopProfessors] = useState<Professor[]>([]);
  const [stats, setStats] = useState<{ professors: number; universities: number; reviews: number } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    getRecentReviews().then(setRecentReviews).catch(() => {});
    getStats().then(setStats).catch(() => {});
    getProfessors({ sort: 'rating', limit: '5' }).then((data: any) => {
      const profs: Professor[] = Array.isArray(data) ? data : (data.professors ?? []);
      setTopProfessors(profs.slice(0, 5));
    }).catch(() => {});
  }, []);

  // Live search dropdown
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await search(query);
        setResults(data);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setResults(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}&type=${activeTab}`);
      setQuery('');
      setResults(null);
    }
  };

  const placeholder =
    activeTab === 'professor'
      ? 'Hoca adı veya bölüm girin...'
      : 'Üniversite adı girin...';

  return (
    <div>
      {/* ── HERO ── */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight tracking-tight">
            Hocanı Değerlendir
          </h1>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Türkiye'deki üniversite hocaları hakkında gerçek öğrenci değerlendirmeleri
          </p>

          {/* Tab switcher */}
          <div className="inline-flex bg-white/10 rounded-full p-1 mb-6">
            <button
              onClick={() => setActiveTab('professor')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                activeTab === 'professor'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Hoca Ara
            </button>
            <button
              onClick={() => setActiveTab('university')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                activeTab === 'university'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Üniversite Ara
            </button>
          </div>

          {/* Search box */}
          <div ref={searchRef} className="relative max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className="w-full pl-12 pr-4 py-4 text-gray-900 rounded-xl text-base shadow-lg focus:outline-none focus:ring-2 focus:ring-coral-400"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-4 bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-xl shadow-lg whitespace-nowrap"
              >
                Ara
              </button>
            </form>

            {/* Dropdown results */}
            {(results || searching) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-96 overflow-y-auto z-50 animate-fadeIn text-left">
                {searching && (
                  <div className="p-4 text-center text-gray-400 text-sm">Aranıyor...</div>
                )}
                {results && !searching && (
                  <>
                    {results.professors.length === 0 &&
                      results.universities.length === 0 &&
                      results.courses.length === 0 && (
                        <div className="p-4 text-center text-gray-400 text-sm">Sonuç bulunamadı</div>
                      )}

                    {results.universities.length > 0 && (
                      <div>
                        <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                          Üniversiteler
                        </div>
                        {results.universities.map(u => (
                          <Link
                            key={u.id}
                            to={`/universities/${u.id}`}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                            onClick={() => { setResults(null); setQuery(''); }}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                              style={{ backgroundColor: u.logo_color }}
                            >
                              {u.name
                                .split(' ')
                                .filter((w: string) => w.length > 2)
                                .slice(0, 2)
                                .map((w: string) => w[0])
                                .join('') || u.name.slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                              <p className="text-xs text-gray-500">{u.city} · {u.type}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {results.professors.length > 0 && (
                      <div>
                        <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                          Hocalar
                        </div>
                        {results.professors.map(p => (
                          <Link
                            key={p.id}
                            to={`/professors/${p.id}`}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                            onClick={() => { setResults(null); setQuery(''); }}
                          >
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 text-sm font-bold shrink-0">
                              {p.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900">
                                {p.title} {p.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {p.department_name} · {p.university_name}
                              </p>
                            </div>
                            {p.avg_rating > 0 && (
                              <div
                                className="rating-circle shrink-0"
                                style={{
                                  width: 32,
                                  height: 32,
                                  fontSize: '0.7rem',
                                  backgroundColor: getRatingColor(p.avg_rating),
                                }}
                              >
                                {p.avg_rating.toFixed(1)}
                              </div>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}

                    <Link
                      to={`/search?q=${encodeURIComponent(query)}`}
                      className="flex items-center justify-center gap-2 p-3 text-sm text-gray-500 font-medium hover:bg-gray-50 border-t border-gray-100 transition-colors"
                      onClick={() => { setResults(null); setQuery(''); }}
                    >
                      Tüm sonuçları gör <ArrowRight className="w-4 h-4" />
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* "Not listed" link */}
          <p className="mt-5 text-sm text-white/60">
            Hocan listede yok mu?{' '}
            <Link
              to="/professors/add"
              className="text-coral-300 font-semibold hover:text-coral-200 underline underline-offset-2"
            >
              Hoca ekle
            </Link>
          </p>
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
            {[
              { icon: GraduationCap, value: stats ? String(stats.universities) : '…', label: 'Üniversite', color: 'text-coral-500' },
              { icon: Users, value: stats ? stats.professors.toLocaleString('tr-TR') : '…', label: 'Hoca', color: 'text-green-600' },
              { icon: MessageSquare, value: stats ? stats.reviews.toLocaleString('tr-TR') : '…', label: 'Değerlendirme', color: 'text-amber-500' },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon className={`w-6 h-6 ${color}`} />
                <div>
                  <span className="text-xl font-extrabold text-gray-900">{value}</span>
                  <span className="text-sm text-gray-500 ml-1.5">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── LEFT: Recent reviews (2/3) ── */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Son Değerlendirmeler</h2>
              <Link
                to="/professors"
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 font-medium"
              >
                Tümünü gör <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentReviews.length > 0 ? (
                recentReviews.slice(0, 6).map(r => (
                  <ReviewCard key={r.id} review={r} showProfessor />
                ))
              ) : (
                <div className="text-center py-14 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <Star className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-500 font-medium">Henüz değerlendirme yok</p>
                  <p className="text-gray-400 text-sm mt-1">İlk değerlendirmeyi sen yap!</p>
                  <Link
                    to="/professors"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-lg"
                  >
                    <Plus className="w-4 h-4" /> Hoca Bul
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT sidebar (1/3) ── */}
          <div className="space-y-5">

            {/* Top rated professors */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">En İyi Hocalar</h3>
                <Link to="/professors?sort=rating" className="text-xs text-gray-400 hover:text-gray-600">
                  Tümü
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {topProfessors.length > 0 ? (
                  topProfessors.map((prof, idx) => (
                    <Link
                      key={prof.id}
                      to={`/professors/${prof.id}`}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                    >
                      <span className="text-sm font-bold text-gray-300 w-4 shrink-0">
                        {idx + 1}
                      </span>
                      <div
                        className="rating-circle shrink-0"
                        style={{
                          width: 36,
                          height: 36,
                          fontSize: '0.75rem',
                          backgroundColor: getRatingColor(prof.avg_rating),
                        }}
                      >
                        {prof.avg_rating > 0 ? prof.avg_rating.toFixed(1) : 'N/A'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-gray-700 transition-colors">
                          {prof.title} {prof.name}
                        </p>
                        {prof.department_name && (
                          <p className="text-xs text-gray-400 truncate">{prof.department_name}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">
                        {prof.num_ratings} oy
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="px-5 py-8 text-center text-sm text-gray-400">
                    Henüz yeterli veri yok
                  </div>
                )}
              </div>
            </div>

            {/* Quick access */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-3">Hızlı Erişim</h3>
              <div className="space-y-1">
                {[
                  { to: '/universities', label: 'Tüm Üniversiteler' },
                  { to: '/professors', label: 'Tüm Hocalar' },
                  { to: '/professors/add', label: 'Hoca Ekle' },
                  { to: '/professors?sort=rating', label: 'En Yüksek Puanlı Hocalar' },
                ].map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {label}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
