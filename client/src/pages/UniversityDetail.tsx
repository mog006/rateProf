import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Globe, GraduationCap, Star, BookOpen,
  ChevronRight, Building2, Search, ChevronLeft, ChevronRight as ChevronRightIcon,
  Users
} from 'lucide-react';
import { getUniversity, getUniversityProfessors } from '../lib/api';
import type { University } from '../types';
import RatingBadge from '../components/RatingBadge';

interface Faculty { id: number; name: string; dept_count: number; prof_count: number; }
interface Department { id: number; name: string; faculty_id: number; faculty_name: string; prof_count: number; }
interface ProfessorItem {
  id: number; name: string; title: string; avg_rating: number;
  num_ratings: number; department_name: string; faculty_name: string;
}
interface ProfPage { professors: ProfessorItem[]; total: number; page: number; pages: number; }

const LIMIT = 20;

export default function UniversityDetail() {
  const { id } = useParams<{ id: string }>();
  const [university, setUniversity] = useState<(University & { faculties: Faculty[]; departments: Department[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'professors' | 'faculties' | 'departments'>('professors');

  const [selectedFaculty, setSelectedFaculty] = useState<number | null>(null);
  const [selectedDept, setSelectedDept] = useState<number | null>(null);

  const [profPage, setProfPage] = useState<ProfPage | null>(null);
  const [profLoading, setProfLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    if (!id) return;
    getUniversity(id)
      .then((data: any) => setUniversity(data))
      .catch(() => setUniversity(null))
      .finally(() => setLoading(false));
  }, [id]);

  const loadProfessors = useCallback(() => {
    if (!id) return;
    setProfLoading(true);
    const params: Record<string, string> = { page: String(page), limit: String(LIMIT) };
    if (selectedFaculty) params.faculty_id = String(selectedFaculty);
    if (selectedDept) params.department_id = String(selectedDept);
    if (search) params.search = search;
    getUniversityProfessors(id, params)
      .then((data: ProfPage) => setProfPage(data))
      .finally(() => setProfLoading(false));
  }, [id, page, selectedFaculty, selectedDept, search]);

  useEffect(() => {
    if (activeTab === 'professors') loadProfessors();
  }, [activeTab, loadProfessors]);

  useEffect(() => { setPage(1); }, [selectedFaculty, selectedDept, search]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="h-8 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!university) {
    return (
      <div className="text-center py-20 text-gray-400">
        <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Üniversite bulunamadı</p>
      </div>
    );
  }

  const color = university.logo_color || '#2563eb';
  const faculties: Faculty[] = university.faculties || [];
  const departments: Department[] = university.departments || [];
  const filteredDepts = selectedFaculty ? departments.filter(d => d.faculty_id === selectedFaculty) : departments;

  return (
    <div>
      {/* Header */}
      <div className="text-white py-10 px-4" style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-white/70 mb-4">
            <Link to="/universities" className="hover:text-white transition-colors">Üniversiteler</Link>
            <ChevronRight className="w-4 h-4" />
            <span>{university.short_name}</span>
          </div>
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-2xl font-extrabold shadow-lg shrink-0" style={{ color }}>
              {(university.short_name || university.name).slice(0, 3)}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold">{university.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-white/80 text-sm">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{university.city}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${university.type === 'devlet' ? 'bg-green-400/20 text-green-200' : 'bg-blue-400/20 text-blue-200'}`}>
                  {university.type === 'devlet' ? 'Devlet' : 'Vakıf'}
                </span>
                {university.website && (
                  <a href={university.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white">
                    <Globe className="w-4 h-4" /> Web
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-6">
            {[
              { icon: GraduationCap, label: 'Hoca',         val: university.num_professors || 0 },
              { icon: Building2,     label: 'Fakülte',       val: faculties.length },
              { icon: BookOpen,      label: 'Bölüm',         val: departments.length },
              { icon: Star,          label: 'Değerlendirme', val: university.num_ratings || 0 },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                <Icon className="w-4 h-4 mx-auto mb-1 text-white/70" />
                <p className="text-xl font-bold">{val}</p>
                <p className="text-xs text-white/60">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {[
            { key: 'professors',  label: 'Hocalar',                        icon: GraduationCap },
            { key: 'faculties',   label: `Fakülteler (${faculties.length})`,   icon: Building2 },
            { key: 'departments', label: `Bölümler (${departments.length})`, icon: BookOpen },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── HOCALAR ── */}
        {activeTab === 'professors' && (
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <select
                value={selectedFaculty ?? ''}
                onChange={e => { setSelectedFaculty(e.target.value ? Number(e.target.value) : null); setSelectedDept(null); }}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Tüm Fakülteler</option>
                {faculties.map(f => <option key={f.id} value={f.id}>{f.name} ({f.prof_count})</option>)}
              </select>

              <select
                value={selectedDept ?? ''}
                onChange={e => setSelectedDept(e.target.value ? Number(e.target.value) : null)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
                disabled={filteredDepts.length === 0}
              >
                <option value="">Tüm Bölümler</option>
                {filteredDepts.map(d => <option key={d.id} value={d.id}>{d.name} ({d.prof_count})</option>)}
              </select>

              <div className="flex items-center gap-2 flex-1 min-w-48">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Hoca ara..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') setSearch(searchInput); }}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <button onClick={() => setSearch(searchInput)} className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Ara</button>
                {(search || selectedFaculty || selectedDept) && (
                  <button
                    onClick={() => { setSearch(''); setSearchInput(''); setSelectedFaculty(null); setSelectedDept(null); }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Temizle
                  </button>
                )}
              </div>
            </div>

            {profPage && (
              <p className="text-sm text-gray-500 mb-3">
                {profPage.total} hoca{profPage.pages > 1 && ` — Sayfa ${profPage.page}/${profPage.pages}`}
              </p>
            )}

            {profLoading ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {Array(LIMIT).fill(0).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : profPage && profPage.professors.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {profPage.professors.map(p => (
                  <Link
                    key={p.id}
                    to={`/professors/${p.id}`}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-blue-200 hover:shadow-md transition-all flex items-start gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {p.name.split(' ').map((n: string) => n[0]).filter(Boolean).slice(0, 2).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{p.name}</p>
                      <p className="text-xs text-blue-600 font-medium">{p.title}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{p.department_name || p.faculty_name || '—'}</p>
                    </div>
                    {p.num_ratings > 0 ? (
                      <div className="shrink-0 text-right">
                        <RatingBadge rating={p.avg_rating} size="sm" />
                        <p className="text-xs text-gray-400 mt-0.5">{p.num_ratings} oy</p>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300 shrink-0 mt-1">Yeni</span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Hoca bulunamadı</p>
              </div>
            )}

            {profPage && profPage.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(7, profPage.pages) }, (_, i) => {
                  let pg: number;
                  if (profPage.pages <= 7) pg = i + 1;
                  else if (page <= 4) pg = i + 1;
                  else if (page >= profPage.pages - 3) pg = profPage.pages - 6 + i;
                  else pg = page - 3 + i;
                  return (
                    <button key={pg} onClick={() => setPage(pg)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${pg === page ? 'bg-blue-600 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                      {pg}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(profPage.pages, p + 1))} disabled={page === profPage.pages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── FAKÜLTELer ── */}
        {activeTab === 'faculties' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {faculties.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-gray-400">
                <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Fakülte bilgisi bulunamadı</p>
              </div>
            ) : faculties.map(f => (
              <button
                key={f.id}
                onClick={() => { setSelectedFaculty(f.id); setSelectedDept(null); setActiveTab('professors'); }}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-left hover:border-blue-200 hover:shadow-md transition-all group"
              >
                <div className="w-9 h-9 rounded-lg mb-3 flex items-center justify-center" style={{ background: `${color}20` }}>
                  <Building2 className="w-5 h-5" style={{ color }} />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-blue-600 transition-colors">{f.name}</h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{f.dept_count} bölüm</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{f.prof_count} hoca</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── BÖLÜMLER ── */}
        {activeTab === 'departments' && (
          <div>
            <div className="flex gap-2 flex-wrap mb-4">
              <button
                onClick={() => setSelectedFaculty(null)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${!selectedFaculty ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
              >
                Tümü
              </button>
              {faculties.map(f => (
                <button key={f.id} onClick={() => setSelectedFaculty(selectedFaculty === f.id ? null : f.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${selectedFaculty === f.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                  {f.name}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredDepts.map(dept => (
                <button key={dept.id}
                  onClick={() => { setSelectedDept(dept.id); setSelectedFaculty(dept.faculty_id); setActiveTab('professors'); }}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-left hover:border-blue-200 hover:shadow-md transition-all group"
                >
                  <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{dept.name}</h3>
                  {dept.faculty_name && <p className="text-xs text-gray-400 mt-0.5 truncate">{dept.faculty_name}</p>}
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><Users className="w-3 h-3" />{dept.prof_count} hoca</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
