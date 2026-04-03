import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, ChevronRight, CheckCircle, GraduationCap, MailWarning } from 'lucide-react';
import { getProfessor, addReview } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import type { Professor } from '../types';
import toast from 'react-hot-toast';

const AVAILABLE_TAGS = [
  'Çok İyi Anlatım', 'İyi Anlatım', 'Kötü Anlatım', 'Hızlı Tempo',
  'Yavaş Tempo', 'Yardımsever', 'Erişilebilir', 'İlham Verici',
  'Sınavlar Zor', 'Sınavlar Kolay', 'Adil Sınav', 'Ödevler Zor',
  'Ödevler Yok', 'Proje Odaklı', 'Pratik Örnekler', 'Öğretici',
  'Eğlenceli', 'Sıkıcı', 'Sabırlı', 'Matematik Odaklı',
];

const GRADES = ['AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD', 'FF', 'Bıraktım', 'Almadım'];
const ATTENDANCE = ['zorunlu', 'zorunlu değil', 'fark etmez'];

const STAR_LABELS = ['', 'Çok Kötü', 'Kötü', 'Orta', 'İyi', 'Mükemmel'];

function RatingSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div>
      <label className="block text-sm font-bold text-gray-800 mb-3">{label}</label>
      <div className="flex items-center gap-4">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              onClick={() => onChange(i)}
              className="p-0.5 focus:outline-none"
              aria-label={`${i} yıldız`}
            >
              <Star
                size={32}
                className={`transition-colors duration-100 ${
                  i <= display
                    ? 'text-coral-500 fill-coral-500'
                    : 'text-gray-200 fill-gray-200'
                }`}
              />
            </button>
          ))}
        </div>
        {display > 0 && (
          <span className="text-sm font-semibold text-gray-600">
            {STAR_LABELS[display]}
          </span>
        )}
      </div>
    </div>
  );
}

function DifficultySelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const options = [
    { val: 1, label: 'Çok Kolay', activeClass: 'bg-green-500 border-green-500 text-white', hoverClass: 'hover:border-green-400 hover:text-green-700' },
    { val: 2, label: 'Kolay',     activeClass: 'bg-teal-500 border-teal-500 text-white',   hoverClass: 'hover:border-teal-400 hover:text-teal-700' },
    { val: 3, label: 'Orta',      activeClass: 'bg-yellow-500 border-yellow-500 text-white', hoverClass: 'hover:border-yellow-400 hover:text-yellow-700' },
    { val: 4, label: 'Zor',       activeClass: 'bg-orange-500 border-orange-500 text-white', hoverClass: 'hover:border-orange-400 hover:text-orange-700' },
    { val: 5, label: 'Çok Zor',   activeClass: 'bg-red-500 border-red-500 text-white',     hoverClass: 'hover:border-red-400 hover:text-red-700' },
  ];

  return (
    <div>
      <label className="block text-sm font-bold text-gray-800 mb-3">Zorluk Seviyesi</label>
      <div className="flex gap-2 flex-wrap">
        {options.map(({ val, label, activeClass, hoverClass }) => (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
              value === val
                ? activeClass
                : `bg-white text-gray-600 border-gray-200 ${hoverClass}`
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AddReview() {
  const { professorId } = useParams<{ professorId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    overall_rating: 0,
    difficulty: 0,
    would_take_again: null as boolean | null,
    comment: '',
    course_id: '',
    grade: '',
    attendance: '',
    textbook: false,
    tags: [] as string[],
  });

  useEffect(() => {
    if (!professorId) return;
    getProfessor(professorId)
      .then(setProfessor)
      .finally(() => setLoading(false));
  }, [professorId]);

  const toggleTag = (tag: string) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag)
        ? f.tags.filter(t => t !== tag)
        : f.tags.length < 5
        ? [...f.tags, tag]
        : f.tags,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.overall_rating) { toast.error('Lütfen genel puan verin'); return; }
    if (!form.difficulty) { toast.error('Lütfen zorluk seviyesi seçin'); return; }
    if (form.would_take_again === null) { toast.error('Lütfen tekrar alır mısınız seçin'); return; }
    if (form.comment.trim().length < 10) { toast.error('Yorum en az 10 karakter olmalı'); return; }

    setSubmitting(true);
    try {
      await addReview({
        professor_id: parseInt(professorId!),
        course_id: form.course_id ? parseInt(form.course_id) : undefined,
        overall_rating: form.overall_rating,
        difficulty: form.difficulty,
        would_take_again: form.would_take_again,
        comment: form.comment,
        grade: form.grade || undefined,
        attendance: form.attendance || undefined,
        textbook: form.textbook,
        tags: form.tags,
      });
      setSuccess(true);
      setTimeout(() => navigate(`/professors/${professorId}`), 2200);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      toast.error(axiosErr?.response?.data?.error ?? 'Değerlendirme eklenemedi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="h-20 bg-gray-200 rounded-xl" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!professor) {
    return (
      <div className="text-center py-24 text-gray-400">
        <GraduationCap className="w-14 h-14 mx-auto mb-4 opacity-20" />
        <p className="text-lg font-medium">Hoca bulunamadı</p>
        <Link to="/professors" className="mt-4 inline-block text-sm text-gray-500 hover:underline">
          Tüm hocalara dön
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900">Değerlendirme Eklendi!</h2>
        <p className="text-gray-500 mt-3 leading-relaxed">
          Katkınız için teşekkürler. Hoca profiline yönlendiriliyorsunuz...
        </p>
        <div className="mt-6 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full animate-[progress_2.2s_linear_forwards]" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Giriş Yapmalısın</h2>
        <p className="text-gray-500 text-sm mb-6">Değerlendirme yapabilmek için hesabına giriş yap.</p>
        <Link to="/login" className="btn-primary px-6 py-3 rounded-xl text-sm font-bold">Giriş Yap</Link>
      </div>
    );
  }

  if (!user.verified) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <MailWarning className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">E-posta Doğrulama Gerekli</h2>
        <p className="text-gray-500 text-sm mb-6">
          Değerlendirme yapabilmek için e-posta adresini doğrulamalısın.
        </p>
        <Link to="/verify-email" className="btn-primary px-6 py-3 rounded-xl text-sm font-bold">
          E-postamı Doğrula
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
          <Link to="/professors" className="hover:text-gray-700 transition-colors">Hocalar</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to={`/professors/${professor.id}`} className="hover:text-gray-700 transition-colors">
            {professor.name}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-700 font-medium">Değerlendir</span>
        </div>

        {/* Professor info card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ backgroundColor: professor.logo_color ?? '#1f2937' }}
          >
            {professor.name[0]}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900">{professor.title} {professor.name}</p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {[professor.department_name, professor.university_name].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Değerlendirme Ekle</h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Overall rating */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <RatingSelector
              label="Genel Puan *"
              value={form.overall_rating}
              onChange={v => setForm(f => ({ ...f, overall_rating: v }))}
            />
          </div>

          {/* Difficulty */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <DifficultySelector
              value={form.difficulty}
              onChange={v => setForm(f => ({ ...f, difficulty: v }))}
            />
          </div>

          {/* Would take again */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <label className="block text-sm font-bold text-gray-800 mb-3">
              Bu hocanın dersini tekrar alır mıydın? *
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, would_take_again: true }))}
                className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                  form.would_take_again === true
                    ? 'bg-green-500 border-green-500 text-white shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-700'
                }`}
              >
                Evet, alırdım
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, would_take_again: false }))}
                className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                  form.would_take_again === false
                    ? 'bg-red-500 border-red-500 text-white shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-red-400 hover:text-red-600'
                }`}
              >
                Hayır, almazdım
              </button>
            </div>
          </div>

          {/* Course selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <label className="block text-sm font-bold text-gray-800 mb-2">
              Hangi Derste?{' '}
              <span className="font-normal text-gray-400 text-xs">(isteğe bağlı)</span>
            </label>
            {professor.courses && professor.courses.length > 0 ? (
              <select
                value={form.course_id}
                onChange={e => setForm(f => ({ ...f, course_id: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-coral-400"
              >
                <option value="">Seçiniz...</option>
                {professor.courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-400 italic">
                Bu hoca için kayıtlı ders bulunamadı.
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <label className="block text-sm font-bold text-gray-800 mb-2">
              Yorumunuz *
            </label>
            <textarea
              value={form.comment}
              onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
              placeholder="Bu hoca hakkında düşüncelerinizi paylaşın. Dersi nasıl anlatıyor? Sınavlar nasıl? Öğrencilere ne önerirsiniz?"
              rows={5}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-coral-400 resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-400">Min. 10 karakter</p>
              <p className={`text-xs font-medium ${form.comment.length > 480 ? 'text-orange-500' : 'text-gray-400'}`}>
                {form.comment.length}/500
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <label className="block text-sm font-bold text-gray-800 mb-1">
              Etiketler{' '}
              <span className="font-normal text-gray-400 text-xs">(max 5 seçin)</span>
            </label>
            <p className="text-xs text-gray-400 mb-3">
              {form.tags.length}/5 seçildi
            </p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    form.tags.includes(tag)
                      ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-800'
                  } ${!form.tags.includes(tag) && form.tags.length >= 5 ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Extra info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Ek Bilgiler</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Not</label>
                <select
                  value={form.grade}
                  onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-coral-400"
                >
                  <option value="">Seçiniz</option>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Devam</label>
                <select
                  value={form.attendance}
                  onChange={e => setForm(f => ({ ...f, attendance: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-coral-400"
                >
                  <option value="">Seçiniz</option>
                  {ATTENDANCE.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    id="textbook"
                    checked={form.textbook}
                    onChange={e => setForm(f => ({ ...f, textbook: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-coral-400"
                  />
                  <span className="text-sm text-gray-700">Ders kitabı gerekli</span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit row */}
          <div className="flex gap-3 pt-2">
            <Link
              to={`/professors/${professor.id}`}
              className="flex-1 text-center py-3.5 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              İptal
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3.5 bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {submitting ? 'Gönderiliyor...' : 'Değerlendirmeyi Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
