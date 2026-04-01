import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, GraduationCap, Menu, X, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg hidden sm:block">
              Hocayı Değerlendir
            </span>
            <span className="font-bold text-gray-900 text-lg sm:hidden">HD</span>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                placeholder="Hoca, üniversite veya ders ara..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
            </div>
          </form>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/universities" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              Üniversiteler
            </Link>
            <Link to="/professors" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              Hocalar
            </Link>
            <Link to="/courses" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              Dersler
            </Link>
            <Link to="/schedule" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              Program
            </Link>

            {user ? (
              <div className="relative ml-2">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-700 text-xs font-bold">{user.name[0].toUpperCase()}</span>
                  </div>
                  <span className="hidden lg:block">{user.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 animate-fadeIn">
                    <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                      <User className="w-4 h-4" /> Profil
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      <LogOut className="w-4 h-4" /> Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link to="/login" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 rounded-lg transition-colors">
                  Giriş
                </Link>
                <Link to="/register" className="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                  Kayıt Ol
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-1 border-t border-gray-100 pt-2 animate-fadeIn">
            <Link to="/universities" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMenuOpen(false)}>Üniversiteler</Link>
            <Link to="/professors" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMenuOpen(false)}>Hocalar</Link>
            <Link to="/courses" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMenuOpen(false)}>Dersler</Link>
            <Link to="/schedule" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMenuOpen(false)}>Program</Link>
            {user ? (
              <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg">Çıkış Yap</button>
            ) : (
              <div className="flex gap-2 px-3 pt-1">
                <Link to="/login" className="flex-1 text-center px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50" onClick={() => setMenuOpen(false)}>Giriş</Link>
                <Link to="/register" className="flex-1 text-center px-3 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg" onClick={() => setMenuOpen(false)}>Kayıt Ol</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
