import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, Users, ChevronLeft, ChevronRight, X, Filter } from 'lucide-react';
import { getProfessors, getUniversities, getUniversityDepartments } from '../lib/api';
import type { Professor, University } from '../types';
import ProfessorCard from '../components/ProfessorCard';

const LIMIT = 24;

interface Department { id: number; name: string; }

export default function Professors() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptLoading, setDeptLoading] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [sort, setSort] = useState('rating');
  const [onlyRated, setOnlyRated] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  // Load universities once
  useEffect(() => {
    getUniversities().then(setUniversities).catch(() => {});
  }, []);

  // Load departments when university changes
  useEffect(() => {
    setDepartmentId('');
    if (!universityId) { setDepartments([]); return; }
    setDeptLoading(true);
    getUniversityDepartments(universityId)
      .then(setDepartments)
      .catch(() => setDepartments([]))
      .finally(() => setDeptLoading(false));
  }, [universityId]);

  const fetchProfessors = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { sort, page: String(page), limit: String(LIMIT) };
      if (search) params.search = search;
      if (universityId) params.university_id = universityId;
      if (departmentId) params.department_id = departmentId;
      if (onlyRated) params.only_rated = '1';
      const data = await getProfessors(params);
      if (Array.isArray(data)) {
        setProfessors(data);
        setTotal(data.length);
        setPages(1);
      } else {
        setProfessors(data.professors);
        setTotal(data.total);
        setPages(data.pages);
      }
    } finally {
      setLoading(false);
    }
  }, [search, universityId, departmentId, sort, onlyRated, page]);

  useEffect(() => {
    const t = setTimeout(fetchProfessors, 150);
    return () => clearTimeout(t);
  }, [fetchProfessors]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, universityId, departmentId, sort, onlyRated]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const clearFilters = () => {
    setSearch(''); setSearchInput('');
    setUniversityId(''); setDepartmentId('');
    setOnlyRated(false); setSort('rating');
  };

  const hasFilters = search || universityId || departmentId || onlyRated;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hocalar</h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading ? 'Yükleniyor...' : `${total.toLocaleString('tr-TR')} hoca`}
          </p>
        </div>
        <Link to="/professors/add" className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-colors">
          + Hoca Ekle
        </Link>
      </div>

      {/* Filter panel */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 space-y-3">
        {/* Row 1: search + sort */}
        <div className="flex flex-wrap gap-3 items-center">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-52">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Hoca adı veya bölüm ara..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-400"
              />
            </div>
            <button type="submit" className="px-3 py-2 bg-coral-500 text-white text-sm rounded-lg hover:bg-coral-600 transition-colors">
              Ara
            </button>
          </form>

          <div className="flex items-center gap-2 ml-auto">
            <SlidersHorizontal className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral-400"
            >
              <option value="rating">En Çok Değerlendirilen</option>
              <option value="ratings_count">Değerlendirme Sayısı</option>
              <option value="difficulty">En Zor</option>
              <option value="name">İsme Göre (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Row 2: university + department + only-rated */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* University */}
          <select
            value={universityId}
            onChange={e => { setUniversityId(e.target.value); setDepartmentId(''); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral-400 flex-1 min-w-48"
          >
            <option value="">Tüm Üniversiteler</option>
            {universities.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          {/* Department — only visible when university selected */}
          <div className="relative flex-1 min-w-48">
            <select
              value={departmentId}
              onChange={e => setDepartmentId(e.target.value)}
              disabled={!universityId || deptLoading}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-coral-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {!universityId
                  ? 'Önce üniversite seçin'
                  : deptLoading
                  ? 'Bölümler yükleniyor...'
                  : departments.length === 0
                  ? 'Bölüm bulunamadı'
                  : `Tüm Bölümler (${departments.length})`}
              </option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Only rated toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
            <div
              onClick={() => setOnlyRated(v => !v)}
              className={`w-9 h-5 rounded-full transition-colors relative ${onlyRated ? 'bg-gray-900' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${onlyRated ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-gray-600">Sadece değerlendirilmiş</span>
          </label>

          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" /> Temizle
            </button>
          )}
        </div>

        {/* Active filter badges */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 pt-1">
            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                <Search className="w-3 h-3" /> "{search}"
                <button onClick={() => { setSearch(''); setSearchInput(''); }} className="ml-0.5 hover:text-blue-900">×</button>
              </span>
            )}
            {universityId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <Filter className="w-3 h-3" /> {universities.find(u => String(u.id) === universityId)?.name}
                <button onClick={() => { setUniversityId(''); setDepartmentId(''); }} className="ml-0.5 hover:text-green-900">×</button>
              </span>
            )}
            {departmentId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                <Filter className="w-3 h-3" /> {departments.find(d => String(d.id) === departmentId)?.name}
                <button onClick={() => setDepartmentId('')} className="ml-0.5 hover:text-purple-900">×</button>
              </span>
            )}
            {onlyRated && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                ★ Sadece değerlendirilmiş
                <button onClick={() => setOnlyRated(false)} className="ml-0.5 hover:text-yellow-900">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: LIMIT }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse flex gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : professors.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-500">Hoca bulunamadı</p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-3 text-sm text-gray-500 hover:underline">
              Filtreleri temizle
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {professors.map(p => <ProfessorCard key={p.id} professor={p} />)}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(7, pages) }, (_, i) => {
                let pg: number;
                if (pages <= 7) pg = i + 1;
                else if (page <= 4) pg = i + 1;
                else if (page >= pages - 3) pg = pages - 6 + i;
                else pg = page - 3 + i;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      pg === page ? 'bg-gray-900 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          {pages > 1 && (
            <p className="text-center text-xs text-gray-400 mt-3">
              Sayfa {page} / {pages} — Toplam {total.toLocaleString('tr-TR')} hoca
            </p>
          )}
        </>
      )}
    </div>
  );
}
