// backend/src/routes/index.ts
import { Router } from 'express';
import { startETL, getETLStatus, resetETL } from '../controllers/etl.controller';
import { getAnalytics, getMetrics } from '../controllers/analytics.controller';
import { getDatabaseSchema, getDatabaseStats } from '../controllers/database.controller';
import { getUsers, getUserStats } from '../controllers/users.controller';

const router = Router();

// ETL Routes
router.post('/etl/start', startETL);
router.get('/etl/status', getETLStatus);
router.post('/etl/reset', resetETL);

// Analytics Routes
router.get('/analytics', getAnalytics);
router.get('/analytics/metrics', getMetrics);

// Database Routes
router.get('/database/schema', getDatabaseSchema);
router.get('/database/stats', getDatabaseStats);

// Users Routes
router.get('/users', getUsers);
router.get('/users/stats', getUserStats);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default router;