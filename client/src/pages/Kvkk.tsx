import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Kvkk() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/" className="hover:text-gray-700">Ana Sayfa</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-700">KVKK / Gizlilik Politikası</span>
      </div>

      <h1 className="text-2xl font-extrabold text-gray-900 mb-2">KVKK & Gizlilik Politikası</h1>
      <p className="text-sm text-gray-400 mb-8">Son güncelleme: Ocak 2025</p>

      <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
        <section>
          <h2 className="font-bold text-gray-900 mb-2">1. Toplanan Veriler</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Hesap bilgileri:</strong> Ad, e-posta adresi (kayıt sırasında).</li>
            <li><strong>Değerlendirmeler:</strong> Yazdığınız yorumlar ve puanlar.</li>
            <li><strong>Teknik veriler:</strong> IP adresi, tarayıcı bilgisi (güvenlik amaçlı).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">2. Verilerin Kullanım Amacı</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Hesabınızı oluşturmak ve yönetmek.</li>
            <li>Değerlendirmelerinizi sisteme kaydetmek.</li>
            <li>Platform güvenliğini sağlamak, kötüye kullanımı önlemek.</li>
            <li>İstatistiksel analizler (kişiselleştirilmemiş, toplu veri).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">3. Değerlendirmelerin Anonimliği</h2>
          <p>
            Platforma gönderdiğiniz değerlendirmeler diğer kullanıcılara <strong>anonim</strong>{' '}
            olarak gösterilir; adınız veya e-posta adresiniz hiçbir zaman yorumlarınızla birlikte
            yayımlanmaz.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">4. Veri Güvenliği</h2>
          <p>
            Şifreler tek yönlü şifreleme (bcrypt) ile saklanır. Verileriniz üçüncü taraflarla
            ticari amaçla paylaşılmaz.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">5. Haklarınız (KVKK Mad. 11)</h2>
          <p>6698 sayılı KVKK kapsamında aşağıdaki haklara sahipsiniz:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme.</li>
            <li>Yanlış veya eksik verilerin düzeltilmesini talep etme.</li>
            <li>Verilerinizin silinmesini ya da yok edilmesini talep etme.</li>
            <li>Veri işlemeye itiraz etme.</li>
          </ul>
          <p className="mt-2">
            Bu haklarınızı kullanmak için{' '}
            <a href="mailto:kvkk@kampuspuan.com" className="text-coral-500 hover:underline">kvkk@kampuspuan.com</a>{' '}
            adresine yazabilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-gray-900 mb-2">6. Çerezler (Cookies)</h2>
          <p>
            Platform, oturum yönetimi için yalnızca gerekli teknik çerezleri kullanır. Üçüncü
            taraf reklam veya izleme çerezi kullanılmamaktadır.
          </p>
        </section>

        <div className="border-t border-gray-100 pt-5">
          <p className="text-gray-400">
            Detaylı bilgi için <Link to="/contact" className="text-coral-500 hover:underline">iletişim sayfamızı</Link> ziyaret edin.
          </p>
        </div>
      </div>
    </div>
  );
}
