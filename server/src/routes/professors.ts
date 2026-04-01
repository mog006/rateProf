import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { search, university_id, department_id, sort = 'rating' } = req.query;
  const db = getDb();

  let query = `
    SELECT p.*, u.name as university_name, u.short_name as university_short, d.name as department_name
    FROM professors p
    LEFT JOIN universities u ON p.university_id = u.id
    LEFT JOIN departments d ON p.department_id = d.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (search) {
    query += ' AND (p.name LIKE ? OR u.name LIKE ? OR d.name LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (university_id) {
    query += ' AND p.university_id = ?';
    params.push(university_id);
  }
  if (department_id) {
    query += ' AND p.department_id = ?';
    params.push(department_id);
  }

  const sortMap: Record<string, string> = {
    rating: 'p.avg_rating DESC',
    difficulty: 'p.difficulty DESC',
    ratings_count: 'p.num_ratings DESC',
    name: 'p.name ASC',
  };
  query += ` ORDER BY ${sortMap[sort as string] || 'p.avg_rating DESC'}`;

  res.json(db.prepare(query).all(...params));
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
    SELECT r.*, u.name as user_name, c.name as course_name, c.code as course_code,
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
