import { Router, Response } from 'express';
import { getDb } from '../db/database';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', optionalAuth, (req: AuthRequest, res: Response) => {
  const {
    professor_id, course_id, overall_rating, difficulty,
    would_take_again, comment, grade, attendance, textbook, tags
  } = req.body;

  if (!professor_id || !overall_rating || !difficulty || comment === undefined || would_take_again === undefined) {
    res.status(400).json({ error: 'Zorunlu alanlar eksik' });
    return;
  }
  if (overall_rating < 1 || overall_rating > 5 || difficulty < 1 || difficulty > 5) {
    res.status(400).json({ error: 'Puanlar 1-5 arasında olmalı' });
    return;
  }
  if (comment.trim().length < 10) {
    res.status(400).json({ error: 'Yorum en az 10 karakter olmalı' });
    return;
  }

  const db = getDb();

  const result = db.prepare(`
    INSERT INTO reviews (user_id, professor_id, course_id, overall_rating, difficulty, would_take_again, comment, grade, attendance, textbook)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.userId || null, professor_id, course_id || null,
    overall_rating, difficulty, would_take_again ? 1 : 0,
    comment.trim(), grade || null, attendance || null, textbook ? 1 : 0
  );

  const reviewId = result.lastInsertRowid as number;

  if (tags && Array.isArray(tags)) {
    const insertTag = db.prepare('INSERT INTO review_tags (review_id, tag) VALUES (?, ?)');
    for (const tag of tags.slice(0, 5)) {
      if (typeof tag === 'string' && tag.trim()) {
        insertTag.run(reviewId, tag.trim());
      }
    }
  }

  // Update professor stats
  db.prepare(`
    UPDATE professors SET
      avg_rating = ROUND((SELECT AVG(overall_rating) FROM reviews WHERE professor_id = ?), 1),
      difficulty = ROUND((SELECT AVG(difficulty) FROM reviews WHERE professor_id = ?), 1),
      would_take_again = ROUND((SELECT AVG(would_take_again) * 100 FROM reviews WHERE professor_id = ?)),
      num_ratings = (SELECT COUNT(*) FROM reviews WHERE professor_id = ?)
    WHERE id = ?
  `).run(professor_id, professor_id, professor_id, professor_id, professor_id);

  // Update university rating count
  db.prepare(`
    UPDATE universities SET
      num_ratings = (SELECT COUNT(*) FROM reviews r JOIN professors p ON r.professor_id = p.id WHERE p.university_id = universities.id)
    WHERE id = (SELECT university_id FROM professors WHERE id = ?)
  `).run(professor_id);

  res.json({ id: reviewId, message: 'Değerlendirme eklendi' });
});

router.post('/:id/vote', authenticate, (req: AuthRequest, res: Response) => {
  const { is_helpful } = req.body;
  const db = getDb();

  const review = db.prepare('SELECT id FROM reviews WHERE id = ?').get(req.params.id);
  if (!review) {
    res.status(404).json({ error: 'Değerlendirme bulunamadı' });
    return;
  }

  try {
    db.prepare(
      'INSERT OR REPLACE INTO helpful_votes (review_id, user_id, is_helpful) VALUES (?, ?, ?)'
    ).run(req.params.id, req.userId, is_helpful ? 1 : 0);

    db.prepare(`
      UPDATE reviews SET
        helpful_count = (SELECT COUNT(*) FROM helpful_votes WHERE review_id = ? AND is_helpful = 1),
        not_helpful_count = (SELECT COUNT(*) FROM helpful_votes WHERE review_id = ? AND is_helpful = 0)
      WHERE id = ?
    `).run(req.params.id, req.params.id, req.params.id);

    res.json({ success: true });
  } catch {
    res.status(400).json({ error: 'Oy verilemedi' });
  }
});

router.get('/recent', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const reviews = db.prepare(`
    SELECT r.*, p.name as professor_name, u.name as university_name, u.short_name as university_short,
           c.name as course_name, c.code as course_code,
           GROUP_CONCAT(rt.tag, '|||') as tags
    FROM reviews r
    JOIN professors p ON r.professor_id = p.id
    JOIN universities u ON p.university_id = u.id
    LEFT JOIN courses c ON r.course_id = c.id
    LEFT JOIN review_tags rt ON rt.review_id = r.id
    GROUP BY r.id
    ORDER BY r.created_at DESC
    LIMIT 10
  `).all() as any[];

  res.json(reviews.map(r => ({ ...r, tags: r.tags ? r.tags.split('|||') : [] })));
});

export default router;
