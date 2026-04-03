import { Link } from 'react-router-dom';
import { ChevronRight, Mail, AlertTriangle } from 'lucide-react';

export default function Contact() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/" className="hover:text-gray-700">Ana Sayfa</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-700">İletişim</span>
      </div>

      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">İletişim</h1>

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-coral-50 rounded-xl flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-coral-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Genel İletişim</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Platform hakkındaki sorularınız, önerileriniz veya işbirliği talepleriniz için:
            </p>
            <a href="mailto:iletisim@kampuspuan.com" className="text-sm text-coral-500 hover:underline mt-1 inline-block">
              iletisim@kampuspuan.com
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">İçerik Bildirimi / Hukuki Talepler</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Uygunsuz içerik, hakaret veya kişisel veri ihlali gibi durumlar için lütfen ilgili
              değerlendirmedeki "Bildir" butonunu kullanın ya da bize yazın:
            </p>
            <a href="mailto:hukuk@kampuspuan.com" className="text-sm text-red-500 hover:underline mt-1 inline-block">
              hukuk@kampuspuan.com
            </a>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800">
          <strong>Not:</strong> Platform üzerindeki değerlendirmeler kullanıcılara aittir. KampüsPuan
          içeriklerin doğruluğunu garanti etmez; ancak bildirilen uygunsuz içerikler en kısa sürede
          incelenir.
        </div>
      </div>
    </div>
  );
}
