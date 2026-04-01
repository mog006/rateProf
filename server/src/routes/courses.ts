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
    SELECT c.*, p.name as professor_name, p.title as professor_title, p.avg_rating as professor_rating,
           u.name as university_name, d.name as department_name
    FROM courses c
    LEFT JOIN professors p ON c.professor_id = p.id
    LEFT JOIN universities u ON c.university_id = u.id
    LEFT JOIN departments d ON c.department_id = d.id
    WHERE c.id = ?
  `).get(req.params.id);

  if (!course) {
    res.status(404).json({ error: 'Ders bulunamadı' });
    return;
  }
  res.json(course);
});

export default router;
