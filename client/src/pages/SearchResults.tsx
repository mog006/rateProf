import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, GraduationCap, Users } from 'lucide-react';
import { search } from '../lib/api';
import type { SearchResult } from '../types';
import ProfessorCard from '../components/ProfessorCard';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'all' | 'professors' | 'universities'>('all');

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    search(q)
      .then(setResults)
      .finally(() => setLoading(false));
  }, [q]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setSearchParams({ q: query.trim() });
  };

  const total = results ? results.professors.length + results.universities.length : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Hoca, üniversite veya ders ara..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-coral-400 bg-white shadow-sm"
          />
        </div>
      </form>

      {q && (
        <p className="text-sm text-gray-500 mb-4">
          "<span className="font-medium text-gray-800">{q}</span>" için {loading ? '...' : `${total} sonuç`}
        </p>
      )}

      {/* Tabs */}
      {results && !loading && (
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {[
            { key: 'all', label: `Tümü (${total})` },
            { key: 'professors', label: `Hocalar (${results.professors.length})` },
            { key: 'universities', label: `Üniversiteler (${results.universities.length})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse flex gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && results && total === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Sonuç bulunamadı</p>
          <p className="text-sm mt-1">Farklı bir arama terimi deneyin</p>
        </div>
      )}

      {!loading && results && (
        <div className="space-y-6">
          {/* Professors */}
          {(tab === 'all' || tab === 'professors') && results.professors.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-gray-500" /> Hocalar
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {results.professors.map(p => <ProfessorCard key={p.id} professor={p} />)}
              </div>
            </div>
          )}

          {/* Universities */}
          {(tab === 'all' || tab === 'universities') && results.universities.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-3">
                <GraduationCap className="w-5 h-5 text-green-600" /> Üniversiteler
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {results.universities.map(u => (
                  <Link key={u.id} to={`/universities/${u.id}`} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-gray-200 hover:shadow-md transition-all flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shrink-0" style={{ backgroundColor: u.logo_color }}>
                      {u.name.split(' ').filter((w: string) => w.length > 2).slice(0, 2).map((w: string) => w[0]).join('') || u.name.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{u.name}</h3>
                      <p className="text-xs text-gray-500">{u.city} · {u.type} · {u.num_ratings} değerlendirme</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
