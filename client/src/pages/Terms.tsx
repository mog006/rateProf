import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Terms() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/" className="hover:text-gray-700">Ana Sayfa</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-700">Kullanım Koşulları</span>
      </div>

      <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Kullanım Koşulları</h1>
      <p className="text-sm text-gray-400 mb-8">Son güncelleme: Ocak 2025</p>

      <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
        <section>
          <h2 className="font-bold text-gray-900 mb-2">1. Hizmetin Kapsamı</h2>
          <p>
            KampüsPuan, Türkiye'deki yükseköğretim kurumlarında görev yapan öğretim üyeleri
            hakkında öğrencilerin anonim değerlendirme yapmasına imkân tanıyan bir platformdur.
            Platform yalnızca bilgilendirme amacı taşır; herhangi bir resmi kurum veya üniversite
            ile bağlantısı bulunmamaktadır.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">2. Kullanıcı Yükümlülükleri</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Değerlendirmeleriniz gerçek deneyimlerinize dayanmalıdır.</li>
            <li>Hakaret, iftira, tehdit veya ayrımcılık içeren içerik yayımlanamaz.</li>
            <li>Başkalarının kişisel verilerini (adres, telefon vb.) paylaşmak yasaktır.</li>
            <li>Platform yalnızca akademik değerlendirme amacıyla kullanılmalıdır.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">3. İçerik Sorumluluğu</h2>
          <p>
            Kullanıcıların paylaştığı değerlendirmeler kendi görüş ve deneyimlerini yansıtır.
            KampüsPuan bu içeriklerin doğruluğunu taahhüt etmez. Uygunsuz içerikler bildirim
            üzerine incelenerek kaldırılabilir.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">4. Fikri Mülkiyet</h2>
          <p>
            Platform tasarımı, yazılımı ve markalama unsurları KampüsPuan'a aittir. Kullanıcı
            içerikleri ise içeriği oluşturan kullanıcıya ait olmakla birlikte, platform
            içeriklerin yayımlanması için gerekli lisansa sahiptir.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">5. Hizmet Değişiklikleri</h2>
          <p>
            KampüsPuan, platform koşullarını önceden haber vermeksizin değiştirme hakkını
            saklı tutar. Platforma erişmeye devam etmek güncel koşulları kabul etmek anlamına gelir.
          </p>
        </section>

        <div className="border-t border-gray-100 pt-5">
          <p className="text-gray-400">
            Sorularınız için <Link to="/contact" className="text-coral-500 hover:underline">iletişim sayfamızı</Link> ziyaret edin.
          </p>
        </div>
      </div>
    </div>
  );
}
