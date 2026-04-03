import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
import { AuthContext, useAuthProvider } from './hooks/useAuth';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Universities from './pages/Universities';
import UniversityDetail from './pages/UniversityDetail';
import Professors from './pages/Professors';
import ProfessorDetail from './pages/ProfessorDetail';
import AddReview from './pages/AddReview';
import AddProfessor from './pages/AddProfessor';
import SearchResults from './pages/SearchResults';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Kvkk from './pages/Kvkk';
import VerifyEmail from './pages/VerifyEmail';
import CourseDetail from './pages/CourseDetail';

function AppContent() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/universities" element={<Universities />} />
            <Route path="/universities/:id" element={<UniversityDetail />} />
            <Route path="/professors" element={<Professors />} />
            <Route path="/professors/add" element={<AddProfessor />} />
            <Route path="/professors/:id" element={<ProfessorDetail />} />
            <Route path="/professors/:professorId/review" element={<AddReview />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/kvkk" element={<Kvkk />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
          </Routes>
        </main>

        <footer className="bg-white border-t border-gray-100 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid sm:grid-cols-4 gap-6">
              <div className="sm:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">KP</span>
                  </div>
                  <span className="font-bold text-gray-900">KampüsPuan</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Türkiye'deki üniversite öğrencileri için hoca ve ders değerlendirme platformu.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm mb-3">Keşfet</h4>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li><a href="/universities" className="hover:text-gray-900 transition-colors">Üniversiteler</a></li>
                  <li><a href="/professors" className="hover:text-gray-900 transition-colors">Hocalar</a></li>
                  <li><a href="/professors/add" className="hover:text-gray-900 transition-colors">Hoca Ekle</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm mb-3">Hesap</h4>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li><a href="/login" className="hover:text-gray-900 transition-colors">Giriş Yap</a></li>
                  <li><a href="/register" className="hover:text-gray-900 transition-colors">Kayıt Ol</a></li>
                  <li><a href="/profile" className="hover:text-gray-900 transition-colors">Profilim</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm mb-3">Yasal</h4>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li><a href="/about" className="hover:text-gray-900 transition-colors">Hakkımızda</a></li>
                  <li><a href="/contact" className="hover:text-gray-900 transition-colors">İletişim</a></li>
                  <li><a href="/terms" className="hover:text-gray-900 transition-colors">Kullanım Koşulları</a></li>
                  <li><a href="/kvkk" className="hover:text-gray-900 transition-colors">KVKK / Gizlilik</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-100 mt-6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
              <span>© 2025 KampüsPuan — Türkiye'nin Hoca Değerlendirme Platformu</span>
              <span>
                Bu platform öğrencilerin kişisel görüşlerini içerir. İçerikler bilgilendirme amaçlıdır.
              </span>
            </div>
          </div>
        </footer>
      </div>
      <Toaster position="top-right" toastOptions={{ className: 'text-sm font-medium' }} />
    </BrowserRouter>
  );
}

export default function App() {
  const auth = useAuthProvider();
  return (
    <AuthContext.Provider value={auth}>
      <AppContent />
    </AuthContext.Provider>
  );
}
