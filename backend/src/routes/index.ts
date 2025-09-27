// ============= backend/src/routes/index.ts (UPDATE IF NEEDED) =============
import { Router } from 'express';
import { startETL, getETLStatus, resetETL } from '../controllers/etl.controller';
import { getAnalytics, getMetrics } from '../controllers/analytics.controller';

const router = Router();

// ETL Routes
router.post('/etl/start', startETL);
router.get('/etl/status', getETLStatus);
router.post('/etl/reset', resetETL);

// Analytics Routes
router.get('/analytics', getAnalytics);
router.get('/analytics/metrics', getMetrics);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default router;