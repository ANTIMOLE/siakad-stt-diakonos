/**
 * Dashboard Routes
 * Routes for dashboard statistics for all user roles
 */

import express from 'express';
import * as dashboardController from '../controllers/dashboardController';
import * as dashboardKeuanganController from '../controllers/dashboardKeuanganController';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

// ============================================
// ADMIN DASHBOARD
// ============================================

/**
 * GET /api/dashboard/admin
 * Get admin dashboard statistics
 * @access Admin only
 */
router.get(
  '/admin',
  authenticate,
  dashboardController.getAdminStats
);

// ============================================
// DOSEN DASHBOARD
// ============================================

/**
 * GET /api/dashboard/dosen
 * Get dosen dashboard statistics
 * @access Dosen only
 */
router.get(
  '/dosen',
  authenticate,
  dashboardController.getDosenStats
);

// ============================================
// MAHASISWA DASHBOARD
// ============================================

/**
 * GET /api/dashboard/mahasiswa
 * Get mahasiswa dashboard statistics
 * @access Mahasiswa only
 */
router.get(
  '/mahasiswa',
  authenticate,
  dashboardController.getMahasiswaStats
);

// ============================================
// KEUANGAN DASHBOARD
// ============================================

/**
 * GET /api/dashboard/keuangan
 * Get keuangan dashboard statistics
 * @access Keuangan only
 */
router.get(
  '/keuangan',
  authenticate,
  dashboardKeuanganController.getKeuanganStats
);

export default router;