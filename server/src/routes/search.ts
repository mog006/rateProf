import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { buildSearchTerms, buildLikeClause } from '../lib/turkishSearch';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q || (q as string).trim().length < 2) {
    res.json({ universities: [], professors: [], courses: [] });
    return;
  }

  const db = getDb();
  const terms = buildSearchTerms(q as string);

  const nClause = buildLikeClause('name', terms);
  const sClause = buildLikeClause('short_name', terms);
  const cClause = buildLikeClause('city', terms);

  const universities = db.prepare(`
    SELECT id, name, short_name, city, type, logo_color, num_ratings
    FROM universities WHERE ${nClause.clause} OR ${sClause.clause} OR ${cClause.clause}
    LIMIT 5
  `).all(...nClause.params, ...sClause.params, ...cClause.params);

  const pnClause = buildLikeClause('p.name', terms);
  const unClause = buildLikeClause('u.name', terms);
  const dnClause = buildLikeClause('d.name', terms);

  const professors = db.prepare(`
    SELECT p.id, p.name, p.title, p.avg_rating, p.num_ratings,
           u.name as university_name, u.short_name as university_short,
           d.name as department_name
    FROM professors p
    LEFT JOIN universities u ON p.university_id = u.id
    LEFT JOIN departments d ON p.department_id = d.id
    WHERE ${pnClause.clause} OR ${unClause.clause} OR ${dnClause.clause}
    ORDER BY p.num_ratings DESC
    LIMIT 8
  `).all(...pnClause.params, ...unClause.params, ...dnClause.params);

  const cnClause = buildLikeClause('c.name', terms);
  const ccClause = buildLikeClause('c.code', terms);

  const courses = db.prepare(`
    SELECT c.id, c.code, c.name, c.semester, c.year,
           p.name as professor_name, u.name as university_name
    FROM courses c
    LEFT JOIN professors p ON c.professor_id = p.id
    LEFT JOIN universities u ON c.university_id = u.id
    WHERE ${cnClause.clause} OR ${ccClause.clause}
    LIMIT 5
  `).all(...cnClause.params, ...ccClause.params);

  res.json({ universities, professors, courses });
});

export default router;
