import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { buildSearchTerms, buildLikeClause } from '../lib/turkishSearch';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { search, city, type, sort = 'name' } = req.query;
  const db = getDb();

  let query = 'SELECT * FROM universities WHERE 1=1';
  const params: any[] = [];

  if (search) {
    const terms = buildSearchTerms(search as string);
    const cols = ['name', 'short_name', 'city'];
    const clauses = cols.map(c => buildLikeClause(c, terms));
    query += ` AND (${clauses.map(c => c.clause).join(' OR ')})`;
    for (const c of clauses) params.push(...c.params);
  }
  if (city) {
    query += ' AND city = ?';
    params.push(city);
  }
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  const sortMap: Record<string, string> = {
    name: 'name ASC',
    rating: 'num_ratings DESC',
    professors: 'num_professors DESC',
  };
  query += ` ORDER BY ${sortMap[sort as string] || 'name ASC'}`;

  const universities = db.prepare(query).all(...params);
  res.json(universities);
});

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const uni = db.prepare('SELECT * FROM universities WHERE id = ?').get(req.params.id) as any;
  if (!uni) {
    res.status(404).json({ error: 'Üniversite bulunamadı' });
    return;
  }

  const faculties = db.prepare(`
    SELECT f.id, f.name,
           COUNT(DISTINCT d.id) as dept_count,
           COUNT(DISTINCT p.id) as prof_count
    FROM faculties f
    LEFT JOIN departments d ON d.faculty_id = f.id
    LEFT JOIN professors p ON p.department_id = d.id
    WHERE f.university_id = ?
    GROUP BY f.id
    ORDER BY f.name
  `).all(uni.id);

  const departments = db.prepare(`
    SELECT d.*, f.name as faculty_name,
           COUNT(p.id) as prof_count
    FROM departments d
    LEFT JOIN faculties f ON f.id = d.faculty_id
    LEFT JOIN professors p ON p.department_id = d.id
    WHERE d.university_id = ?
    GROUP BY d.id
    ORDER BY f.name, d.name
  `).all(uni.id);

  res.json({ ...uni, faculties, departments });
});

// Üniversiteye göre hoca listesi (sayfalı)
router.get('/:id/professors', (req: Request, res: Response) => {
  const db = getDb();
  const { faculty_id, department_id, search, page = '1', limit = '20' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  let query = `
    SELECT p.id, p.name, p.title, p.avg_rating, p.num_ratings,
           d.name as department_name, f.name as faculty_name
    FROM professors p
    LEFT JOIN departments d ON p.department_id = d.id
    LEFT JOIN faculties f ON d.faculty_id = f.id
    WHERE p.university_id = ?
  `;
  let countQuery = `SELECT COUNT(*) as total FROM professors p
    LEFT JOIN departments d ON p.department_id = d.id
    WHERE p.university_id = ?`;

  const params: any[] = [req.params.id];
  const countParams: any[] = [req.params.id];

  if (faculty_id) {
    query += ' AND d.faculty_id = ?';
    countQuery += ' AND d.faculty_id = ?';
    params.push(faculty_id);
    countParams.push(faculty_id);
  }
  if (department_id) {
    query += ' AND p.department_id = ?';
    countQuery += ' AND p.department_id = ?';
    params.push(department_id);
    countParams.push(department_id);
  }
  if (search) {
    query += ' AND UPPER(p.name) LIKE ?';
    countQuery += ' AND UPPER(p.name) LIKE ?';
    const term = `%${(search as string).toUpperCase()}%`;
    params.push(term);
    countParams.push(term);
  }

  query += ` ORDER BY p.avg_rating DESC, p.num_ratings DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit as string), offset);

  const professors = db.prepare(query).all(...params);
  const { total } = db.prepare(countQuery).get(...countParams) as { total: number };

  res.json({
    professors,
    total,
    page: parseInt(page as string),
    pages: Math.ceil(total / parseInt(limit as string)),
  });
});

router.get('/:id/departments', (req: Request, res: Response) => {
  const db = getDb();
  const departments = db.prepare('SELECT * FROM departments WHERE university_id = ? ORDER BY name').all(req.params.id);
  res.json(departments);
});

router.get('/:id/courses', (req: Request, res: Response) => {
  const { semester, year, department_id } = req.query;
  const db = getDb();

  let query = `
    SELECT c.*, p.name as professor_name, p.title as professor_title, d.name as department_name
    FROM courses c
    LEFT JOIN professors p ON c.professor_id = p.id
    LEFT JOIN departments d ON c.department_id = d.id
    WHERE c.university_id = ?
  `;
  const params: any[] = [req.params.id];

  if (semester) { query += ' AND c.semester = ?'; params.push(semester); }
  if (year) { query += ' AND c.year = ?'; params.push(year); }
  if (department_id) { query += ' AND c.department_id = ?'; params.push(department_id); }

  query += ' ORDER BY c.code';
  res.json(db.prepare(query).all(...params));
});

export default router;
