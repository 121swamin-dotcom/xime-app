import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes          from './routes/auth.routes.js';
import coursesRoutes       from './routes/courses.routes.js';
import rolesRoutes         from './routes/roles.routes.js';
import electivesRoutes     from './routes/electives.routes.js';
import dashboardRoutes     from './routes/dashboard.routes.js';
import competenciesRoutes  from './routes/competencies.routes.js';
import counsellingRoutes   from './routes/counselling.routes.js';
import mentoringRoutes     from './routes/mentoring.routes.js';
import adminRoutes         from './routes/admin.routes.js';
import analyticsRoutes     from './routes/analytics.routes.js';
import calendarRoutes      from './routes/calendar.routes.js';
import placementsRoutes    from './routes/placements.routes.js';

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/courses',       coursesRoutes);
app.use('/api/roles',         rolesRoutes);
app.use('/api/electives',     electivesRoutes);
app.use('/api/dashboard',     dashboardRoutes);
app.use('/api/competencies',  competenciesRoutes);
app.use('/api/counselling',   counsellingRoutes);
app.use('/api/mentoring',     mentoringRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/calendar',      calendarRoutes);
app.use('/api/placements',    placementsRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅  XIME backend running on port ${PORT}`));
