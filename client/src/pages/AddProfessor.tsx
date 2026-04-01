import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ChevronRight } from 'lucide-react';
import { addProfessor, getUniversities } from '../lib/api';
import type { University } from '../types';
import toast from 'react-hot-toast';
import api from '../lib/api';

const TITLES = ['Prof. Dr.', 'Doç. Dr.', 'Dr. Öğr. Üyesi', 'Dr.', 'Öğr. Gör.', 'Arş. Gör.'];

export default function AddProfessor() {
  const navigate = useNavigate();
  const [universities, setUniversities] = useState<University[]>([]);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState({ name: '', title: 'Dr. Öğr. Üyesi', university_id: '', department_id: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getUniversities().then(setUniversities).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.university_id) { setDepartments([]); return; }
    api.get(`/universities/${form.university_id}/departments`)
      .then(r => setDepartments(r.data))
      .catch(() => setDepartments([]));
  }, [form.university_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.university_id) { toast.error('İsim ve üniversite zorunlu'); return; }
    setLoading(true);
    try {
      const data = await addProfessor({
        name: form.name,
        title: form.title,
        university_id: parseInt(form.university_id),
        department_id: form.department_id ? parseInt(form.department_id) : undefined,
      });
      toast.success('Hoca eklendi!');
      navigate(`/professors/${data.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Hoca eklenemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/professors" className="hover:text-blue-600">Hocalar</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-700">Hoca Ekle</span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <UserPlus className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hoca Ekle</h1>
          <p className="text-gray-500 text-sm">Listede olmayan bir hocan mı var?</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Hocanın Adı Soyadı *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Örn: Ahmet Yılmaz"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Unvan *</label>
            <select
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Üniversite *</label>
            <select
              value={form.university_id}
              onChange={e => setForm(f => ({ ...f, university_id: e.target.value, department_id: '' }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seçiniz...</option>
              {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          {departments.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Bölüm</label>
              <select
                value={form.department_id}
                onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seçiniz (isteğe bağlı)</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link to="/professors" className="flex-1 text-center py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
              İptal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Ekleniyor...' : 'Hoca Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
