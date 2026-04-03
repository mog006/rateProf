import nodemailer from 'nodemailer';

function createTransporter() {
  // Eğer SMTP env değişkenleri set edilmişse gerçek mail gönder
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  // Dev modunda: konsola yaz, mail gönderme
  return null;
}

const FROM = process.env.SMTP_FROM || 'KampüsPuan <noreply@kampuspuan.com>';

export async function sendVerificationEmail(to: string, code: string, name: string): Promise<void> {
  const transporter = createTransporter();

  const html = `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fafafa">
      <div style="background:#1f2937;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
        <span style="color:#fff;font-size:20px;font-weight:800">KampüsPuan</span>
      </div>
      <h2 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 8px">Merhaba, ${name}!</h2>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px">
        KampüsPuan'a hoş geldin. Hesabını doğrulamak için aşağıdaki 6 haneli kodu kullan:
      </p>
      <div style="background:#fff;border:2px solid #e5e7eb;border-radius:16px;padding:28px;text-align:center;margin-bottom:24px">
        <p style="font-size:42px;font-weight:900;letter-spacing:10px;color:#ff6640;margin:0">${code}</p>
        <p style="font-size:12px;color:#9ca3af;margin:12px 0 0">Bu kod 24 saat geçerlidir</p>
      </div>
      <p style="color:#9ca3af;font-size:12px;line-height:1.5;margin:0">
        Bu e-postayı siz istemediyseniz güvenle görmezden gelebilirsiniz.
      </p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({ from: FROM, to, subject: `${code} — KampüsPuan doğrulama kodun`, html });
  } else {
    // Dev: kodu konsola yazdır
    console.log(`\n📧 [DEV] Doğrulama kodu → ${to}: ${code}\n`);
  }
}
