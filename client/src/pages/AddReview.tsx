import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, ChevronRight, CheckCircle } from 'lucide-react';
import { getProfessor, addReview } from '../lib/api';
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

function RatingSelector({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);

  const getRatingLabel = (v: number) => {
    if (v === 0) return '';
    const labels = ['', 'Çok Kötü', 'Kötü', 'Orta', 'İyi', 'Mükemmel'];
    return labels[v] || '';
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              onClick={() => onChange(i)}
              className="p-1"
            >
              <Star
                size={28}
                className={`transition-colors ${i <= (hover || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
              />
            </button>
          ))}
        </div>
        {(hover || value) > 0 && (
          <span className="text-sm font-medium text-gray-600">{getRatingLabel(hover || value)}</span>
        )}
      </div>
    </div>
  );
}

function DifficultySelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const labels = ['', 'Çok Kolay', 'Kolay', 'Orta', 'Zor', 'Çok Zor'];
  const colors = ['', 'bg-green-500', 'bg-teal-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">Zorluk Seviyesi</label>
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${value === i ? `${colors[i]} text-white border-transparent` : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
          >
            {labels[i]}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AddReview() {
  const { professorId } = useParams<{ professorId: string }>();
  const navigate = useNavigate();
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
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : f.tags.length < 5 ? [...f.tags, tag] : f.tags,
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
      setTimeout(() => navigate(`/professors/${professorId}`), 2000);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Değerlendirme eklenemedi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-10 animate-pulse"><div className="h-64 bg-gray-200 rounded-xl" /></div>;
  }
  if (!professor) {
    return <div className="text-center py-20 text-gray-400">Hoca bulunamadı</div>;
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Değerlendirme Eklendi!</h2>
        <p className="text-gray-500 mt-2">Katkınız için teşekkürler. Hoca profiline yönlendiriliyorsunuz...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/professors" className="hover:text-blue-600">Hocalar</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to={`/professors/${professor.id}`} className="hover:text-blue-600">{professor.name}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-700">Değerlendir</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 mb-6 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shrink-0" style={{ backgroundColor: professor.logo_color || '#3b82f6' }}>
          {professor.name[0]}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{professor.title} {professor.name}</p>
          <p className="text-xs text-gray-500">{professor.department_name} · {professor.university_name}</p>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Değerlendirme Ekle</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall rating */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <RatingSelector
            label="Genel Puan *"
            value={form.overall_rating}
            onChange={v => setForm(f => ({ ...f, overall_rating: v }))}
          />
        </div>

        {/* Difficulty */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <DifficultySelector value={form.difficulty} onChange={v => setForm(f => ({ ...f, difficulty: v }))} />
        </div>

        {/* Would take again */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Bu hocanın dersini tekrar alır mıydın? *</label>
          <div className="flex gap-3">
            {[
              { val: true, label: 'Evet, alırdım', color: 'bg-green-500 border-green-500 text-white', inactive: 'border-gray-200 text-gray-600 hover:border-green-300' },
              { val: false, label: 'Hayır, almazdım', color: 'bg-red-500 border-red-500 text-white', inactive: 'border-gray-200 text-gray-600 hover:border-red-300' },
            ].map(({ val, label, color, inactive }) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => setForm(f => ({ ...f, would_take_again: val }))}
                className={`flex-1 py-3 rounded-lg text-sm font-semibold border-2 transition-all ${form.would_take_again === val ? color : `bg-white ${inactive}`}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Course */}
        {professor.courses && professor.courses.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Hangi Derste?</label>
            <select
              value={form.course_id}
              onChange={e => setForm(f => ({ ...f, course_id: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seçiniz...</option>
              {professor.courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Comment */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Yorumunuz *</label>
          <textarea
            value={form.comment}
            onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
            placeholder="Bu hoca hakkında düşüncelerinizi paylaşın. Dersi nasıl anlatıyor? Sınavlar nasıl? Öğrencilere ne öneririz?"
            rows={5}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{form.comment.length}/500 karakter (min 10)</p>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Etiketler <span className="font-normal text-gray-400">(max 5 seçin)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  form.tags.includes(tag)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Extra info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Not</label>
            <select
              value={form.grade}
              onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seçiniz</option>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Devam</label>
            <select
              value={form.attendance}
              onChange={e => setForm(f => ({ ...f, attendance: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seçiniz</option>
              {ATTENDANCE.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="textbook"
              checked={form.textbook}
              onChange={e => setForm(f => ({ ...f, textbook: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            <label htmlFor="textbook" className="text-sm text-gray-700">Ders kitabı gerekli</label>
          </div>
        </div>

        <div className="flex gap-3">
          <Link to={`/professors/${professor.id}`} className="flex-1 text-center py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
            İptal
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {submitting ? 'Gönderiliyor...' : 'Değerlendirmeyi Gönder'}
          </button>
        </div>
      </form>
    </div>
  );
}
