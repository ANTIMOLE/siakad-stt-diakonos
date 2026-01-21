/**
 * Dashboard Keuangan Routes
 * Routes for keuangan dashboard statistics
 */

import { Router } from 'express';
import * as dashboardKeuanganController from '../controllers/dashboardKeuanganController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireKeuangan } from '../middlewares/roleMiddleware';

const router = Router();

/**
 * GET /api/dashboard/keuangan
 * Get keuangan dashboard statistics
 * Access: Keuangan only
 */
router.get(
  '/keuangan',
  authenticate,
  requireKeuangan,
  dashboardKeuanganController.getKeuanganStats
);

export default router;