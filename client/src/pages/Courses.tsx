import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, BookOpen, Clock, MapPin } from 'lucide-react';
import { getCourses, getUniversities } from '../lib/api';
import type { Course, University } from '../types';

export default function Courses() {
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [universityId, setUniversityId] = useState('');
  const [semester, setSemester] = useState('');

  useEffect(() => {
    getUniversities().then(setUniversities).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (universityId) params.university_id = universityId;
        if (semester) params.semester = semester;
        setCourses(await getCourses(params));
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search, universityId, semester]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dersler</h1>
        <p className="text-gray-500 text-sm mt-1">Üniversite derslerini ara ve incele</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ders adı veya kodu ara..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={universityId} onChange={e => setUniversityId(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tüm Üniversiteler</option>
          {universities.map(u => <option key={u.id} value={u.id}>{u.short_name}</option>)}
        </select>
        <select value={semester} onChange={e => setSemester(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tüm Dönemler</option>
          <option value="Güz">Güz</option>
          <option value="Bahar">Bahar</option>
          <option value="Yaz">Yaz</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse flex gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Ders bulunamadı</p>
        </div>
      ) : (
        <div className="space-y-2">
          {courses.map(course => (
            <div key={course.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-blue-200 hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex flex-col items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <span className="text-xs font-bold text-purple-700 mt-0.5">{course.credits}K</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{course.code}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{course.semester} {course.year}</span>
                      </div>
                      <h3 className="font-semibold text-gray-800 mt-0.5">{course.name}</h3>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                    {course.professor_name && (
                      <Link to={`/professors?search=${encodeURIComponent(course.professor_name)}`} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                        👨‍🏫 {course.professor_title} {course.professor_name}
                      </Link>
                    )}
                    {course.university_name && (
                      <span>{course.university_name}</span>
                    )}
                    {course.department_name && (
                      <span>{course.department_name}</span>
                    )}
                    {course.day && course.time_start && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {course.day} {course.time_start}–{course.time_end}
                      </span>
                    )}
                    {course.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {course.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
