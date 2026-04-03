import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/database';
import { signToken, authenticate, AuthRequest } from '../middleware/auth';
import { sendVerificationEmail } from '../utils/email';

const router = Router();

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function codeExpiresAt(): string {
  const d = new Date();
  d.setHours(d.getHours() + 24);
  return d.toISOString();
}

function isEduTr(email: string): boolean {
  return /\.edu\.tr$/i.test(email.trim());
}

// ─── Register ─────────────────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password, university_id, is_graduate, graduation_year } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Ad, email ve şifre zorunlu' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Şifre en az 6 karakter olmalı' });
    return;
  }

  const graduate = Boolean(is_graduate);

  // edu.tr kontrolü (mezun değilse zorunlu)
  if (!graduate && !isEduTr(email)) {
    res.status(400).json({ error: 'Öğrenci hesabı için .edu.tr uzantılı e-posta zorunludur' });
    return;
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'Bu e-posta zaten kayıtlı' });
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const code = generateCode();
  const expires = codeExpiresAt();

  const result = db.prepare(
    `INSERT INTO users (name, email, password_hash, university_id, is_graduate, graduation_year,
      verified, verification_code, code_expires_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`
  ).run(
    name, email, hash,
    university_id || null,
    graduate ? 1 : 0,
    graduation_year || null,
    code, expires
  );

  try {
    await sendVerificationEmail(email, code, name);
  } catch (e) {
    console.error('Mail gönderilemedi:', e);
  }

  const token = signToken(result.lastInsertRowid as number);
  res.json({
    token,
    user: {
      id: result.lastInsertRowid,
      name,
      email,
      university_id: university_id ? Number(university_id) : null,
      verified: false,
      is_graduate: graduate,
    },
    requiresVerification: true,
  });
});

// ─── Verify email ─────────────────────────────────────────────────────────
router.post('/verify-email', authenticate, async (req: AuthRequest, res: Response) => {
  const { code } = req.body;
  if (!code) {
    res.status(400).json({ error: 'Kod zorunlu' });
    return;
  }

  const db = getDb();
  const user = db.prepare(
    'SELECT id, verified, verification_code, code_expires_at FROM users WHERE id = ?'
  ).get(req.userId) as any;

  if (!user) {
    res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    return;
  }
  if (user.verified) {
    res.json({ success: true, alreadyVerified: true });
    return;
  }
  if (user.verification_code !== String(code).trim()) {
    res.status(400).json({ error: 'Kod hatalı' });
    return;
  }
  if (user.code_expires_at && new Date(user.code_expires_at) < new Date()) {
    res.status(400).json({ error: 'Kodun süresi dolmuş, yeniden gönder' });
    return;
  }

  db.prepare(
    "UPDATE users SET verified = 1, verification_code = NULL, code_expires_at = NULL WHERE id = ?"
  ).run(req.userId);

  res.json({ success: true });
});

// ─── Resend verification ───────────────────────────────────────────────────
router.post('/resend-verification', authenticate, async (req: AuthRequest, res: Response) => {
  const db = getDb();
  const user = db.prepare('SELECT id, name, email, verified FROM users WHERE id = ?').get(req.userId) as any;

  if (!user) {
    res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    return;
  }
  if (user.verified) {
    res.json({ success: true });
    return;
  }

  const code = generateCode();
  const expires = codeExpiresAt();
  db.prepare(
    "UPDATE users SET verification_code = ?, code_expires_at = ? WHERE id = ?"
  ).run(code, expires, req.userId);

  try {
    await sendVerificationEmail(user.email, code, user.name);
  } catch (e) {
    console.error('Mail gönderilemedi:', e);
  }

  res.json({ success: true });
});

// ─── Login ────────────────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user) {
    res.status(401).json({ error: 'E-posta veya şifre hatalı' });
    return;
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'E-posta veya şifre hatalı' });
    return;
  }
  const token = signToken(user.id);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      university_id: user.university_id,
      verified: Boolean(user.verified),
      is_graduate: Boolean(user.is_graduate),
    },
  });
});

// ─── Me ───────────────────────────────────────────────────────────────────
router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const user = db.prepare(
    'SELECT id, name, email, university_id, created_at, verified, is_graduate, graduation_year FROM users WHERE id = ?'
  ).get(req.userId) as any;
  if (!user) {
    res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    return;
  }
  res.json({ ...user, verified: Boolean(user.verified), is_graduate: Boolean(user.is_graduate) });
});

// ─── My reviews ───────────────────────────────────────────────────────────
router.get('/reviews', authenticate, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const reviews = db.prepare(`
    SELECT r.*, p.name as professor_name, p.title as professor_title,
           u.name as university_name, u.short_name as university_short,
           c.name as course_name, c.code as course_code,
           GROUP_CONCAT(rt.tag, '|||') as tags
    FROM reviews r
    JOIN professors p ON r.professor_id = p.id
    JOIN universities u ON p.university_id = u.id
    LEFT JOIN courses c ON r.course_id = c.id
    LEFT JOIN review_tags rt ON rt.review_id = r.id
    WHERE r.user_id = ?
    GROUP BY r.id
    ORDER BY r.created_at DESC
  `).all(req.userId) as any[];
  res.json(reviews.map(r => ({
    ...r,
    user_name: r.name ? (r.name.trim().split(/\s+/).map((w: string) => w[0].toUpperCase() + '.').join('')) : 'Anonim',
    tags: r.tags ? r.tags.split('|||') : [],
  })));
});

export default router;
