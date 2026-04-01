import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthContext, useAuthProvider } from './hooks/useAuth';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Universities from './pages/Universities';
import UniversityDetail from './pages/UniversityDetail';
import Professors from './pages/Professors';
import ProfessorDetail from './pages/ProfessorDetail';
import AddReview from './pages/AddReview';
import AddProfessor from './pages/AddProfessor';
import Courses from './pages/Courses';
import Schedule from './pages/Schedule';
import SearchResults from './pages/SearchResults';
import Login from './pages/Login';
import Register from './pages/Register';

function AppContent() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/universities" element={<Universities />} />
            <Route path="/universities/:id" element={<UniversityDetail />} />
            <Route path="/professors" element={<Professors />} />
            <Route path="/professors/add" element={<AddProfessor />} />
            <Route path="/professors/:id" element={<ProfessorDetail />} />
            <Route path="/professors/:professorId/review" element={<AddReview />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>

        <footer className="bg-white border-t border-gray-100 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid sm:grid-cols-4 gap-6">
              <div className="sm:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">HD</span>
                  </div>
                  <span className="font-bold text-gray-900">Hocayı Değerlendir</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Türkiye'deki üniversite öğrencileri için hoca ve ders değerlendirme platformu.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm mb-3">Keşfet</h4>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li><a href="/universities" className="hover:text-blue-600 transition-colors">Üniversiteler</a></li>
                  <li><a href="/professors" className="hover:text-blue-600 transition-colors">Hocalar</a></li>
                  <li><a href="/courses" className="hover:text-blue-600 transition-colors">Dersler</a></li>
                  <li><a href="/schedule" className="hover:text-blue-600 transition-colors">Ders Programı</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm mb-3">Hesap</h4>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li><a href="/login" className="hover:text-blue-600 transition-colors">Giriş Yap</a></li>
                  <li><a href="/register" className="hover:text-blue-600 transition-colors">Kayıt Ol</a></li>
                  <li><a href="/professors/add" className="hover:text-blue-600 transition-colors">Hoca Ekle</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-100 mt-6 pt-6 text-center text-xs text-gray-400">
              © 2025 Hocayı Değerlendir — Türkiye'nin Hoca Değerlendirme Platformu
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
