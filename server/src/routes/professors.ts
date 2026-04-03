import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';

function anonymizeName(name: string | null | undefined): string {
  if (!name) return 'Anonim';
  return name.trim().split(/\s+/).filter(Boolean).map((w: string) => w[0].toUpperCase() + '.').join('');
}

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { search, university_id, department_id, sort = 'rating', page = '1', limit = '24', only_rated } = req.query;
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 24));
  const offset = (pageNum - 1) * limitNum;
  const db = getDb();

  let where = 'WHERE 1=1';
  const params: any[] = [];

  if (search) {
    where += ' AND (p.name LIKE ? OR u.name LIKE ? OR d.name LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (university_id) {
    where += ' AND p.university_id = ?';
    params.push(university_id);
  }
  if (department_id) {
    where += ' AND p.department_id = ?';
    params.push(department_id);
  }
  if (only_rated === '1') {
    where += ' AND p.num_ratings > 0';
  }

  const sortMap: Record<string, string> = {
    rating: 'p.num_ratings DESC, p.avg_rating DESC',
    difficulty: 'p.difficulty DESC',
    ratings_count: 'p.num_ratings DESC',
    name: 'p.name ASC',
  };
  const orderBy = sortMap[sort as string] || 'p.num_ratings DESC, p.avg_rating DESC';

  const baseJoin = `
    FROM professors p
    LEFT JOIN universities u ON p.university_id = u.id
    LEFT JOIN departments d ON p.department_id = d.id
    ${where}
  `;

  const total = (db.prepare(`SELECT COUNT(*) as cnt ${baseJoin}`).get(...params) as any).cnt;

  const professors = db.prepare(`
    SELECT p.id, p.name, p.title, p.avg_rating, p.difficulty, p.would_take_again, p.num_ratings,
           p.university_id, p.department_id,
           u.name as university_name, u.short_name as university_short, d.name as department_name
    ${baseJoin}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, limitNum, offset);

  res.json({
    professors,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    limit: limitNum,
  });
});

router.get('/:id', optionalAuth, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const professor = db.prepare(`
    SELECT p.*, u.name as university_name, u.short_name as university_short,
           u.logo_color, d.name as department_name
    FROM professors p
    LEFT JOIN universities u ON p.university_id = u.id
    LEFT JOIN departments d ON p.department_id = d.id
    WHERE p.id = ?
  `).get(req.params.id) as any;

  if (!professor) {
    res.status(404).json({ error: 'Hoca bulunamadı' });
    return;
  }

  const reviews = db.prepare(`
    SELECT r.*, u.name as user_name, u.is_graduate, c.name as course_name, c.code as course_code,
           GROUP_CONCAT(rt.tag, '|||') as tags
    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN courses c ON r.course_id = c.id
    LEFT JOIN review_tags rt ON rt.review_id = r.id
    WHERE r.professor_id = ?
    GROUP BY r.id
    ORDER BY r.created_at DESC
  `).all(req.params.id) as any[];

  const formattedReviews = reviews.map(r => ({
    ...r,
    user_name: anonymizeName(r.user_name),
    tags: r.tags ? r.tags.split('|||') : [],
  }));

  const courses = db.prepare(`
    SELECT DISTINCT c.id, c.code, c.name, c.semester, c.year
    FROM courses c
    WHERE c.professor_id = ?
    ORDER BY c.year DESC, c.semester
  `).all(req.params.id);

  const tagStats = db.prepare(`
    SELECT rt.tag, COUNT(*) as count
    FROM review_tags rt
    JOIN reviews r ON rt.review_id = r.id
    WHERE r.professor_id = ?
    GROUP BY rt.tag
    ORDER BY count DESC
    LIMIT 10
  `).all(req.params.id);

  res.json({ ...professor, reviews: formattedReviews, courses, tagStats });
});

router.post('/:id/courses', authenticate, (req: AuthRequest, res: Response) => {
  const { code, name } = req.body;
  if (!code || !name) {
    res.status(400).json({ error: 'Ders kodu ve adı zorunlu' });
    return;
  }
  const db = getDb();

  const professor = db.prepare('SELECT university_id, department_id FROM professors WHERE id = ?').get(req.params.id) as any;
  if (!professor) {
    res.status(404).json({ error: 'Hoca bulunamadı' });
    return;
  }

  const user = db.prepare('SELECT university_id FROM users WHERE id = ?').get(req.userId) as any;
  const profUniId = professor.university_id ? Number(professor.university_id) : null;
  const userUniId = user?.university_id ? Number(user.university_id) : null;
  if (!user || !userUniId || !profUniId || userUniId !== profUniId) {
    res.status(403).json({ error: 'Bu hocanın üniversitesinde kayıtlı değilsiniz' });
    return;
  }

  const existing = db.prepare('SELECT id FROM courses WHERE professor_id = ? AND LOWER(code) = LOWER(?)').get(req.params.id, code.trim()) as any;
  if (existing) {
    res.status(409).json({ error: 'Bu ders kodu zaten eklenmiş' });
    return;
  }

  const result = db.prepare(
    'INSERT INTO courses (university_id, department_id, professor_id, code, name) VALUES (?, ?, ?, ?, ?)'
  ).run(professor.university_id, professor.department_id || null, req.params.id, code.trim().toUpperCase(), name.trim());

  res.json({ id: result.lastInsertRowid, code: code.trim().toUpperCase(), name: name.trim() });
});

router.post('/', (req: Request, res: Response) => {
  const { university_id, department_id, name, title } = req.body;
  if (!university_id || !name) {
    res.status(400).json({ error: 'Üniversite ve isim zorunlu' });
    return;
  }
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO professors (university_id, department_id, name, title) VALUES (?, ?, ?, ?)'
  ).run(university_id, department_id || null, name, title || 'Dr.');

  db.prepare('UPDATE universities SET num_professors = num_professors + 1 WHERE id = ?').run(university_id);

  res.json({ id: result.lastInsertRowid, name, title, university_id, department_id });
});

export default router;
