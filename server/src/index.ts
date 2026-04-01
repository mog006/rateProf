import express from 'express';
import cors from 'cors';
import { initDb } from './db/database';
import authRoutes from './routes/auth';
import universityRoutes from './routes/universities';
import professorRoutes from './routes/professors';
import reviewRoutes from './routes/reviews';
import courseRoutes from './routes/courses';
import searchRoutes from './routes/search';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'], credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/professors', professorRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/search', searchRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

async function start() {
  console.log('\n🔄 Veritabanı başlatılıyor...');
  await initDb();
  app.listen(PORT, () => {
    console.log(`\n🎓 Hocayı Değerlendir API başlatıldı`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🔗 http://localhost:${PORT}/api\n`);
  });
}

start().catch(e => { console.error('Başlatma hatası:', e); process.exit(1); });

export default app;
