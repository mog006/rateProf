import { Link } from 'react-router-dom';
import { GraduationCap, ChevronRight } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/" className="hover:text-gray-700">Ana Sayfa</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-700">Hakkımızda</span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">KampüsPuan Hakkında</h1>
      </div>

      <div className="prose prose-sm max-w-none space-y-5 text-gray-700 leading-relaxed">
        <p>
          <strong>KampüsPuan</strong>, Türkiye'deki üniversite öğrencilerinin akademik kadro hakkında
          anonim ve şeffaf değerlendirmeler yapabildiği bağımsız bir platformdur.
        </p>
        <p>
          Amacımız öğrencilerin ders seçimi yaparken daha bilinçli kararlar almasına yardımcı olmak,
          üniversite hayatını kolaylaştırmak ve öğretim üyeleri hakkında gerçekçi geri bildirimler
          sunmaktır.
        </p>
        <h2 className="text-lg font-bold text-gray-900 mt-6">Nasıl Çalışır?</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Herhangi bir üniversiteden hoca profilini arayabilirsiniz.</li>
          <li>Kayıtlı kullanıcılar anonim olarak değerlendirme bırakabilir.</li>
          <li>Değerlendirmeler diğer kullanıcılar tarafından "Faydalı" olarak oylanabilir.</li>
          <li>Uygunsuz içerikler "Bildir" butonu ile moderasyon ekibimize iletilir.</li>
        </ul>
        <h2 className="text-lg font-bold text-gray-900 mt-6">İletişim</h2>
        <p>
          Sorularınız ve geri bildirimleriniz için{' '}
          <Link to="/contact" className="text-coral-500 hover:underline">iletişim sayfamızı</Link>{' '}
          ziyaret edebilirsiniz.
        </p>
      </div>
    </div>
  );
}
