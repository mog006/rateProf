import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, Users } from 'lucide-react';
import { getProfessors, getUniversities } from '../lib/api';
import type { Professor, University } from '../types';
import ProfessorCard from '../components/ProfessorCard';

export default function Professors() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [sort, setSort] = useState('rating');

  useEffect(() => {
    getUniversities().then(setUniversities).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = { sort };
        if (search) params.search = search;
        if (universityId) params.university_id = universityId;
        setProfessors(await getProfessors(params));
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search, universityId, sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hocalar</h1>
          <p className="text-gray-500 text-sm mt-1">{professors.length} hoca listeleniyor</p>
        </div>
        <Link to="/professors/add" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
          + Hoca Ekle
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Hoca adı veya bölüm ara..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={universityId}
          onChange={e => setUniversityId(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-40"
        >
          <option value="">Tüm Üniversiteler</option>
          {universities.map(u => (
            <option key={u.id} value={u.id}>{u.short_name}</option>
          ))}
        </select>

        <div className="flex items-center gap-2 ml-auto">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="rating">En Yüksek Puan</option>
            <option value="difficulty">En Zor</option>
            <option value="ratings_count">En Fazla Değerlendirme</option>
            <option value="name">İsme Göre</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse flex gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : professors.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Hoca bulunamadı</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {professors.map(p => <ProfessorCard key={p.id} professor={p} />)}
        </div>
      )}
    </div>
  );
}
