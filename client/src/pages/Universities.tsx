import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, GraduationCap, Star } from 'lucide-react';
import { getUniversities } from '../lib/api';
import type { University } from '../types';

const CITIES = ['Ankara', 'İstanbul', 'İzmir', 'Bursa', 'Antalya', 'Konya', 'Trabzon'];
const TYPES = [
  { value: '', label: 'Tümü' },
  { value: 'devlet', label: 'Devlet' },
  { value: 'vakıf', label: 'Vakıf' },
];

export default function Universities() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('');
  const [sort, setSort] = useState('name');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { sort };
      if (search) params.search = search;
      if (city) params.city = city;
      if (type) params.type = type;
      const data = await getUniversities(params);
      setUniversities(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [search, city, type, sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Üniversiteler</h1>
        <p className="text-gray-500 text-sm mt-1">Türkiye'deki üniversiteleri keşfet</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Üniversite ara..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select value={city} onChange={e => setCity(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tüm Şehirler</option>
          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          {TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${type === t.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <select value={sort} onChange={e => setSort(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ml-auto">
          <option value="name">Ada Göre</option>
          <option value="rating">Değerlendirmeye Göre</option>
          <option value="professors">Hocaya Göre</option>
        </select>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="flex gap-3">
                <div className="w-14 h-14 bg-gray-200 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : universities.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Üniversite bulunamadı</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {universities.map(uni => (
            <Link
              key={uni.id}
              to={`/universities/${uni.id}`}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all duration-200 group"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm"
                  style={{ backgroundColor: uni.logo_color }}
                >
                  {uni.short_name.slice(0, 3)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-blue-700 transition-colors">
                    {uni.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{uni.city}</span>
                    <span className={`ml-1 text-xs px-1.5 py-0.5 rounded font-medium ${uni.type === 'devlet' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {uni.type}
                    </span>
                  </div>
                </div>
              </div>

              {uni.description && (
                <p className="text-xs text-gray-500 mt-3 line-clamp-2 leading-relaxed">{uni.description}</p>
              )}

              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs text-gray-600">{uni.num_professors} hoca</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs text-gray-600">{uni.num_ratings} değerlendirme</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
