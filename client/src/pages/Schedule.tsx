import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Plus, X } from 'lucide-react';
import { getSchedule, getUniversities } from '../lib/api';
import type { Course, University } from '../types';

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
const DAY_SHORT: Record<string, string> = { Pazartesi: 'Pzt', Salı: 'Sal', Çarşamba: 'Çar', Perşembe: 'Per', Cuma: 'Cum' };
const HOURS = Array.from({ length: 14 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);
const COLORS = ['bg-blue-100 border-blue-300 text-blue-800', 'bg-green-100 border-green-300 text-green-800', 'bg-purple-100 border-purple-300 text-purple-800', 'bg-yellow-100 border-yellow-300 text-yellow-800', 'bg-pink-100 border-pink-300 text-pink-800', 'bg-orange-100 border-orange-300 text-orange-800'];

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export default function Schedule() {
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [universityId, setUniversityId] = useState(searchParams.get('university_id') || '');
  const [semester, setSemester] = useState('Bahar');
  const [year, setYear] = useState('2025');
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [colorMap, setColorMap] = useState<Record<number, string>>({});

  useEffect(() => {
    getUniversities().then(setUniversities).catch(() => {});
  }, []);

  useEffect(() => {
    if (!universityId) { setCourses([]); return; }
    setLoading(true);
    getSchedule({ university_id: universityId, semester, year })
      .then(setCourses)
      .finally(() => setLoading(false));
  }, [universityId, semester, year]);

  const addCourse = (course: Course) => {
    if (selectedCourses.find(c => c.id === course.id)) return;
    const colorIdx = selectedCourses.length % COLORS.length;
    setColorMap(m => ({ ...m, [course.id]: COLORS[colorIdx] }));
    setSelectedCourses(s => [...s, course]);
  };

  const removeCourse = (id: number) => {
    setSelectedCourses(s => s.filter(c => c.id !== id));
  };

  const getCoursesForSlot = (day: string, hour: string) => {
    return selectedCourses.filter(c => {
      if (c.day !== day || !c.time_start || !c.time_end) return false;
      const slotMin = timeToMinutes(hour);
      const startMin = timeToMinutes(c.time_start);
      const endMin = timeToMinutes(c.time_end);
      return startMin <= slotMin && slotMin < endMin;
    });
  };

  const isFirstSlot = (course: Course, hour: string) => {
    if (!course.time_start) return false;
    const startHour = course.time_start.slice(0, 5);
    const slotHour = hour.slice(0, 2) + ':00';
    return startHour.slice(0, 2) === slotHour.slice(0, 2);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" /> Ders Programı
        </h1>
        <p className="text-gray-500 text-sm mt-1">Derslerini seç ve programını oluştur</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
        <select
          value={universityId}
          onChange={e => setUniversityId(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48"
        >
          <option value="">Üniversite Seçin</option>
          {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={semester} onChange={e => setSemester(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="Güz">Güz</option>
          <option value="Bahar">Bahar</option>
        </select>
        <select value={year} onChange={e => setYear(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="2025">2024-2025</option>
          <option value="2024">2023-2024</option>
        </select>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Course list */}
        <div className="lg:col-span-1">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">
            {universityId ? `Dersler (${courses.length})` : 'Üniversite Seçin'}
          </h3>

          {loading && (
            <div className="space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          )}

          {!loading && courses.length > 0 && (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {courses.map(course => {
                const isAdded = selectedCourses.find(c => c.id === course.id);
                return (
                  <div key={course.id} className="bg-white rounded-xl border border-gray-100 p-3 hover:border-blue-200 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800">{course.code}</p>
                        <p className="text-xs text-gray-600 leading-tight mt-0.5 truncate">{course.name}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{course.day} {course.time_start}–{course.time_end}</p>
                      </div>
                      <button
                        onClick={() => isAdded ? removeCourse(course.id) : addCourse(course)}
                        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${isAdded ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                      >
                        {isAdded ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && !universityId && (
            <div className="text-center py-8 text-gray-300">
              <Calendar className="w-10 h-10 mx-auto mb-2" />
              <p className="text-xs">Üniversite seçin</p>
            </div>
          )}
        </div>

        {/* Schedule grid */}
        <div className="lg:col-span-3 overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Header */}
            <div className="grid grid-cols-6 gap-1 mb-1">
              <div className="h-8" />
              {DAYS.map(day => (
                <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1.5 bg-gray-50 rounded-lg">
                  <span className="hidden sm:block">{day}</span>
                  <span className="sm:hidden">{DAY_SHORT[day]}</span>
                </div>
              ))}
            </div>

            {/* Time slots */}
            <div className="space-y-1">
              {HOURS.map(hour => (
                <div key={hour} className="grid grid-cols-6 gap-1">
                  <div className="text-xs text-gray-400 flex items-center justify-end pr-2">{hour}</div>
                  {DAYS.map(day => {
                    const slotCourses = getCoursesForSlot(day, hour);
                    return (
                      <div key={day} className="h-10 relative">
                        {slotCourses.map(course => (
                          <div
                            key={course.id}
                            className={`absolute inset-0 rounded border text-[10px] font-medium px-1 flex flex-col justify-center overflow-hidden ${colorMap[course.id] || COLORS[0]}`}
                          >
                            {isFirstSlot(course, hour) && (
                              <>
                                <span className="font-bold truncate">{course.code}</span>
                                {course.location && <span className="truncate opacity-75">{course.location}</span>}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Selected courses legend */}
          {selectedCourses.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedCourses.map(course => (
                <span key={course.id} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${colorMap[course.id] || COLORS[0]}`}>
                  {course.code} — {course.name}
                  <button onClick={() => removeCourse(course.id)} className="hover:opacity-70">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {selectedCourses.length === 0 && (
            <div className="mt-6 text-center text-gray-300 py-8">
              <Calendar className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Sol taraftan ders ekleyerek programını oluştur</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
