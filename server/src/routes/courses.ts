import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { search, university_id, department_id, semester, year } = req.query;
  const db = getDb();

  let query = `
    SELECT c.*, p.name as professor_name, p.title as professor_title,
           u.name as university_name, u.short_name as university_short,
           d.name as department_name
    FROM courses c
    LEFT JOIN professors p ON c.professor_id = p.id
    LEFT JOIN universities u ON c.university_id = u.id
    LEFT JOIN departments d ON c.department_id = d.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (search) {
    query += ' AND (c.name LIKE ? OR c.code LIKE ? OR p.name LIKE ?)';
    const t = `%${search}%`;
    params.push(t, t, t);
  }
  if (university_id) { query += ' AND c.university_id = ?'; params.push(university_id); }
  if (department_id) { query += ' AND c.department_id = ?'; params.push(department_id); }
  if (semester) { query += ' AND c.semester = ?'; params.push(semester); }
  if (year) { query += ' AND c.year = ?'; params.push(year); }

  query += ' ORDER BY c.code';
  res.json(db.prepare(query).all(...params));
});

router.get('/schedule', (req: Request, res: Response) => {
  const { university_id, department_id, semester, year } = req.query;
  const db = getDb();

  let query = `
    SELECT c.*, p.name as professor_name, d.name as department_name
    FROM courses c
    LEFT JOIN professors p ON c.professor_id = p.id
    LEFT JOIN departments d ON c.department_id = d.id
    WHERE c.day IS NOT NULL AND c.time_start IS NOT NULL
  `;
  const params: any[] = [];

  if (university_id) { query += ' AND c.university_id = ?'; params.push(university_id); }
  if (department_id) { query += ' AND c.department_id = ?'; params.push(department_id); }
  if (semester) { query += ' AND c.semester = ?'; params.push(semester); }
  if (year) { query += ' AND c.year = ?'; params.push(year); }

  query += ' ORDER BY c.day, c.time_start';
  res.json(db.prepare(query).all(...params));
});

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const course = db.prepare(`
    SELECT c.*, p.name as professor_name, p.title as professor_title, p.id as professor_id,
           p.avg_rating as professor_rating,
           u.name as university_name, d.name as department_name
    FROM courses c
    LEFT JOIN professors p ON c.professor_id = p.id
    LEFT JOIN universities u ON c.university_id = u.id
    LEFT JOIN departments d ON c.department_id = d.id
    WHERE c.id = ?
  `).get(req.params.id) as any;

  if (!course) {
    res.status(404).json({ error: 'Ders bulunamadı' });
    return;
  }

  const reviews = db.prepare(`
    SELECT r.id, r.overall_rating, r.difficulty, r.would_take_again, r.comment,
           r.grade, r.attendance, r.created_at, r.helpful_count, r.not_helpful_count,
           u.name as user_name, u.is_graduate,
           GROUP_CONCAT(rt.tag, '|||') as tags
    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN review_tags rt ON rt.review_id = r.id
    WHERE r.course_id = ? AND r.professor_id = ?
    GROUP BY r.id
    ORDER BY r.created_at DESC
  `).all(req.params.id, course.professor_id) as any[];

  const formattedReviews = reviews.map(r => ({
    ...r,
    user_name: r.user_name
      ? r.user_name.trim().split(/\s+/).map((w: string) => w[0].toUpperCase() + '.').join('')
      : 'Anonim',
    tags: r.tags ? r.tags.split('|||') : [],
  }));

  const tagStats = db.prepare(`
    SELECT rt.tag, COUNT(*) as count
    FROM review_tags rt
    JOIN reviews r ON rt.review_id = r.id
    WHERE r.course_id = ? AND r.professor_id = ?
    GROUP BY rt.tag
    ORDER BY count DESC
    LIMIT 10
  `).all(req.params.id, course.professor_id);

  const stats = reviews.length > 0 ? {
    avg_difficulty: Math.round((reviews.reduce((s, r) => s + Number(r.difficulty), 0) / reviews.length) * 10) / 10,
    avg_rating: Math.round((reviews.reduce((s, r) => s + Number(r.overall_rating), 0) / reviews.length) * 10) / 10,
    would_take_again: Math.round(reviews.filter(r => r.would_take_again).length / reviews.length * 100),
  } : null;

  res.json({ ...course, reviews: formattedReviews, tagStats, stats });
});

export default router;
