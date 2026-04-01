import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/database';
import { signToken, authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password, university_id } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Ad, email ve şifre zorunlu' });
    return;
  }
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'Bu email zaten kayıtlı' });
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, email, password_hash, university_id) VALUES (?, ?, ?, ?)'
  ).run(name, email, hash, university_id || null);
  const token = signToken(result.lastInsertRowid as number);
  res.json({ token, user: { id: result.lastInsertRowid, name, email } });
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user) {
    res.status(401).json({ error: 'Email veya şifre hatalı' });
    return;
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Email veya şifre hatalı' });
    return;
  }
  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const user = db.prepare('SELECT id, name, email, university_id, created_at FROM users WHERE id = ?').get(req.userId) as any;
  if (!user) {
    res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    return;
  }
  res.json(user);
});

export default router;
