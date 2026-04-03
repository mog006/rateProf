import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Star, GraduationCap, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getMyReviews } from '../lib/api';
import type { Review } from '../types';
import ReviewCard from '../components/ReviewCard';

export default function Profile() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    getMyReviews()
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, [user, authLoading, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-xl" />
        <div className="h-6 bg-gray-100 rounded w-1/3" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/" className="hover:text-coral-500">Ana Sayfa</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-700">Profilim</span>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold shadow">
              {user.name[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" /> Çıkış Yap
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Değerlendirme</p>
          </div>
          <div className="text-center border-x border-gray-100">
            <p className="text-2xl font-bold text-gray-900">
              {reviews.length > 0
                ? (reviews.reduce((s, r) => s + r.overall_rating, 0) / reviews.length).toFixed(1)
                : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Ort. Puan Verilen</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {reviews.reduce((s, r) => s + r.helpful_count, 0)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Faydalı Oy Alınan</p>
          </div>
        </div>
      </div>

      {/* User's reviews */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-coral-500 fill-coral-500" />
          Değerlendirmelerim
        </h2>

        {loadingReviews ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                    <div className="h-12 bg-gray-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <Star className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="font-medium text-gray-500">Henüz değerlendirme yapmadınız</p>
            <p className="text-sm text-gray-400 mt-1">Bir hoca arayın ve değerlendirmenizi paylaşın.</p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <Link
                to="/professors"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <GraduationCap className="w-4 h-4" /> Hocalara Göz At
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="relative">
                <ReviewCard review={r} showProfessor />
                <Link
                  to={`/professors/${r.professor_id}`}
                  className="absolute top-3 right-3 text-xs text-coral-500 hover:underline flex items-center gap-0.5"
                >
                  Profile git <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="mt-8 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-coral-500" /> Hızlı Erişim
        </h3>
        <div className="space-y-2">
          <Link to="/professors" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Hocalara Göz At</span>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-coral-500" />
          </Link>
          <Link to="/universities" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Üniversiteler</span>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-coral-500" />
          </Link>
        </div>
      </div>
    </div>
  );
}
