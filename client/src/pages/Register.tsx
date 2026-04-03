import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, Info } from 'lucide-react';
import { register as apiRegister, getUniversities } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import type { University } from '../types';
import toast from 'react-hot-toast';

function isEduTr(email: string) {
  return /\.edu\.tr$/i.test(email.trim());
}

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [universities, setUniversities] = useState<University[]>([]);
  const [form, setForm] = useState({
    name: '', email: '', password: '', university_id: '',
    is_graduate: false, graduation_year: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getUniversities().then(setUniversities).catch(() => {});
  }, []);

  const emailOk = form.is_graduate || isEduTr(form.email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Zorunlu alanları doldurun');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalı');
      return;
    }
    if (!form.is_graduate && !isEduTr(form.email)) {
      toast.error('Öğrenci hesabı için .edu.tr uzantılı e-posta zorunludur');
      return;
    }
    setLoading(true);
    try {
      const data = await apiRegister({
        name: form.name,
        email: form.email,
        password: form.password,
        university_id: form.university_id ? parseInt(form.university_id) : undefined,
        is_graduate: form.is_graduate,
        graduation_year: form.graduation_year ? parseInt(form.graduation_year) : undefined,
      });
      login(data.token, data.user);
      toast.success('Hesabınız oluşturuldu! Doğrulama kodunu kontrol edin.');
      navigate('/verify-email');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Kayıt yapılamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#FAFAFA] py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Hesap Oluştur</h1>
          <p className="text-gray-500 text-sm mt-1">KampüsPuan'a katıl</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Graduate toggle */}
            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={form.is_graduate}
                onChange={e => setForm(f => ({ ...f, is_graduate: e.target.checked }))}
                className="w-4 h-4 accent-coral-500"
              />
              <span className="text-sm font-medium text-gray-700">Mezun öğrenciyim</span>
              <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Mezun</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad Soyad *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Adınız Soyadınız"
                className="input-field w-full"
              />
              <p className="text-xs text-gray-400 mt-1">Yorumlarda sadece baş harfleriniz görünür (A.Y.)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-posta *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder={form.is_graduate ? 'ornek@gmail.com' : 'ornek@universite.edu.tr'}
                className={`input-field w-full ${form.email && !emailOk ? 'border-red-300 ring-1 ring-red-300' : ''}`}
              />
              {!form.is_graduate && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Öğrenci hesabı için .edu.tr uzantılı e-posta gereklidir
                </p>
              )}
              {form.email && !emailOk && (
                <p className="text-xs text-red-500 mt-1">.edu.tr uzantılı bir e-posta girin veya "Mezun" seçeneğini işaretleyin</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Şifre *</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="En az 6 karakter"
                  className="input-field w-full pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Üniversite (isteğe bağlı)</label>
              <select
                value={form.university_id}
                onChange={e => setForm(f => ({ ...f, university_id: e.target.value }))}
                className="input-field w-full"
              >
                <option value="">Seçiniz...</option>
                {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>

            {form.is_graduate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mezuniyet Yılı (isteğe bağlı)</label>
                <input
                  type="number"
                  value={form.graduation_year}
                  onChange={e => setForm(f => ({ ...f, graduation_year: e.target.value }))}
                  placeholder="2023"
                  min="1980"
                  max={new Date().getFullYear()}
                  className="input-field w-full"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!!form.email && !emailOk)}
              className="w-full py-3 bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : 'Hesap Oluştur'}
            </button>
          </form>

          <div className="text-center mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Zaten hesabınız var mı?{' '}
              <Link to="/login" className="text-coral-500 font-semibold hover:underline">Giriş Yap</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
