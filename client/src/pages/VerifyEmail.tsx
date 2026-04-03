import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, CheckCircle } from 'lucide-react';
import { verifyEmail, resendVerification } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { user, login, token } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!user && !token) {
      navigate('/login');
    }
    if (user?.verified) {
      navigate('/');
    }
  }, [user, token, navigate]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[i] = val;
    setCode(next);
    if (val && i < 5) {
      inputs.current[i + 1]?.focus();
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setCode(text.split(''));
      inputs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      toast.error('6 haneli kodu girin');
      return;
    }
    setLoading(true);
    try {
      await verifyEmail(fullCode);
      setVerified(true);
      if (user && token) {
        login(token, { ...user, verified: true });
      }
      toast.success('E-postanız doğrulandı!');
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Kod hatalı veya süresi dolmuş');
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      toast.success('Yeni doğrulama kodu gönderildi');
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } catch {
      toast.error('Kod gönderilemedi, lütfen tekrar deneyin');
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Doğrulandı!</h2>
          <p className="text-gray-500 text-sm">Ana sayfaya yönlendiriliyorsunuz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#FAFAFA]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">E-postanı Doğrula</h1>
          <p className="text-gray-500 text-sm mt-2">
            {user?.email
              ? <><span className="font-medium text-gray-700">{user.email}</span> adresine 6 haneli doğrulama kodu gönderdik.</>
              : '6 haneli doğrulama kodunu girin.'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4 text-center">Doğrulama Kodu</label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-coral-400 focus:ring-2 focus:ring-coral-100 transition-colors"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || code.join('').length < 6}
              className="w-full py-3 bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Doğrulanıyor...' : 'Doğrula'}
            </button>
          </form>

          <div className="text-center mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-2">Kodu almadınız mı?</p>
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-coral-500 font-semibold hover:underline disabled:opacity-50"
            >
              {resending ? 'Gönderiliyor...' : 'Tekrar Gönder'}
            </button>
            <p className="text-xs text-gray-400 mt-3">
              Spam/gereksiz klasörünü de kontrol edin. Kod 24 saat geçerlidir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
