import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, GraduationCap, Star, TrendingUp, ArrowRight, BookOpen, Users, BarChart3 } from 'lucide-react';
import { search, getRecentReviews } from '../lib/api';
import type { SearchResult, Review } from '../types';
import ReviewCard from '../components/ReviewCard';

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    getRecentReviews().then(setRecentReviews).catch(() => {});
  }, []);

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
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setResults(null);
    }
  };

  const stats = [
    { icon: GraduationCap, label: 'Üniversite', value: '15+', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Users, label: 'Hoca', value: '500+', color: 'text-green-600', bg: 'bg-green-50' },
    { icon: Star, label: 'Değerlendirme', value: '10K+', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { icon: BookOpen, label: 'Ders', value: '2000+', color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const features = [
    { icon: Star, title: 'Hoca Değerlendirmeleri', desc: 'Gerçek öğrenci yorumlarıyla doğru hocayı seç.', color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { icon: BarChart3, title: 'Detaylı İstatistikler', desc: 'Zorluk, puan dağılımı ve daha fazlası.', color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: BookOpen, title: 'Ders Programı', desc: 'Üniversitelerin ders programlarını görüntüle.', color: 'text-green-500', bg: 'bg-green-50' },
    { icon: TrendingUp, title: 'Güncel Veriler', desc: 'Her dönem güncellenen değerlendirmeler.', color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            Türkiye'nin Hoca Değerlendirme Platformu
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Doğru Hocanı Bul,<br />
            <span className="text-yellow-300">Başarıya Ulaş</span>
          </h1>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
            Türkiye'deki üniversitelerin hocaları hakkında gerçek öğrenci değerlendirmeleri.
            Ders seçimini veriye dayalı yap.
          </p>

          {/* Search */}
          <div ref={searchRef} className="relative max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Hoca adı, üniversite veya ders..."
                  className="w-full pl-12 pr-4 py-4 text-gray-900 rounded-xl text-base shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <button type="submit" className="px-6 py-4 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold rounded-xl shadow-lg transition-colors whitespace-nowrap">
                Ara
              </button>
            </form>

            {/* Dropdown results */}
            {(results || searching) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-96 overflow-y-auto z-50 animate-fadeIn">
                {searching && (
                  <div className="p-4 text-center text-gray-400 text-sm">Aranıyor...</div>
                )}
                {results && !searching && (
                  <>
                    {results.professors.length === 0 && results.universities.length === 0 && results.courses.length === 0 && (
                      <div className="p-4 text-center text-gray-400 text-sm">Sonuç bulunamadı</div>
                    )}

                    {results.universities.length > 0 && (
                      <div>
                        <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">Üniversiteler</div>
                        {results.universities.map(u => (
                          <Link key={u.id} to={`/universities/${u.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors" onClick={() => { setResults(null); setQuery(''); }}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: u.logo_color }}>
                              {u.short_name.slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{u.name}</p>
                              <p className="text-xs text-gray-500">{u.city} · {u.type}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {results.professors.length > 0 && (
                      <div>
                        <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">Hocalar</div>
                        {results.professors.map(p => (
                          <Link key={p.id} to={`/professors/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors" onClick={() => { setResults(null); setQuery(''); }}>
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-sm font-bold shrink-0">
                              {p.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{p.title} {p.name}</p>
                              <p className="text-xs text-gray-500 truncate">{p.department_name} · {p.university_short}</p>
                            </div>
                            {p.avg_rating > 0 && (
                              <div className="flex items-center gap-1 shrink-0">
                                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                <span className="text-xs font-semibold">{p.avg_rating.toFixed(1)}</span>
                              </div>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}

                    {results.courses.length > 0 && (
                      <div>
                        <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">Dersler</div>
                        {results.courses.map(c => (
                          <Link key={c.id} to={`/courses?search=${encodeURIComponent(c.code)}`} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors" onClick={() => { setResults(null); setQuery(''); }}>
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                              <BookOpen className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{c.code} — {c.name}</p>
                              <p className="text-xs text-gray-500">{c.university_name} · {c.semester} {c.year}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    <Link to={`/search?q=${encodeURIComponent(query)}`} className="flex items-center justify-center gap-2 p-3 text-sm text-blue-600 font-medium hover:bg-blue-50 border-t border-gray-100 transition-colors" onClick={() => { setResults(null); setQuery(''); }}>
                      Tüm sonuçları gör <ArrowRight className="w-4 h-4" />
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-6 text-sm text-blue-200">
            <span>Popüler:</span>
            {['ODTÜ', 'Boğaziçi', 'İTÜ', 'Bilkent', 'Sabancı'].map(s => (
              <button key={s} onClick={() => { setQuery(s); }} className="hover:text-white underline underline-offset-2 transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent reviews */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Son Değerlendirmeler</h2>
              <Link to="/professors" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                Tümü <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentReviews.length > 0 ? recentReviews.slice(0, 5).map(r => (
                <ReviewCard key={r.id} review={r} showProfessor />
              )) : (
                <div className="text-center py-8 text-gray-400">Henüz değerlendirme yok</div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Features */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4">Neden Hocayı Değerlendir?</h3>
              <div className="space-y-3">
                {features.map(({ icon: Icon, title, desc, color, bg }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{title}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4">Hızlı Erişim</h3>
              <div className="space-y-2">
                <Link to="/universities" className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 transition-colors group">
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Tüm Üniversiteler</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                </Link>
                <Link to="/professors" className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 transition-colors group">
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">En İyi Hocalar</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                </Link>
                <Link to="/schedule" className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 transition-colors group">
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Ders Programı</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
