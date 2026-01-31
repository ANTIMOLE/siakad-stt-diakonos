/**
 * Presensi Routes
 * ✅ UPDATED: Added mahasiswa my-classes endpoint
 */

import { Router } from 'express';
import * as presensiController from '../controllers/presensiController';
import { authenticate } from '../middlewares/authMiddleware';
import {
  requireRole,
  requireAdminOrDosen,
} from '../middlewares/roleMiddleware';

const router = Router();

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================

router.use(authenticate);

// ============================================
// DOSEN SPECIFIC ROUTES
// ============================================

/**
 * GET /api/presensi/dosen/my-classes
 * Get all classes taught by logged-in dosen
 */
router.get(
  '/dosen/my-classes',
  requireRole('DOSEN'),
  presensiController.getDosenClasses
);

// ============================================
// MAHASISWA SPECIFIC ROUTES - ✅ NEW
// ============================================

/**
 * GET /api/presensi/mahasiswa/my-classes
 * Get all classes for logged-in mahasiswa
 * ✅ NEW: For mahasiswa presensi dashboard
 */
router.get(
  '/mahasiswa/my-classes',
  requireRole('MAHASISWA'),
  presensiController.getMahasiswaClasses
);

// ============================================
// STATISTICS ROUTES
// ============================================

/**
 * GET /api/presensi/mahasiswa/:mahasiswaId/kelas/:kelasMKId
 * Get attendance stats for specific student in a class
 */
router.get(
  '/mahasiswa/:mahasiswaId/kelas/:kelasMKId',
  presensiController.getStatsMahasiswa
);

/**
 * GET /api/presensi/kelas/:kelasMKId/stats
 * Get attendance statistics for entire class
 */
router.get(
  '/kelas/:kelasMKId/stats',
  requireAdminOrDosen,
  presensiController.getStatsKelas
);

// ============================================
// CRUD ROUTES
// ============================================

/**
 * GET /api/presensi?kelasMKId=1
 * Get all presensi for a class
 */
router.get('/', presensiController.getAllByKelas);

/**
 * GET /api/presensi/:id
 * Get single presensi with details
 */
router.get('/:id', presensiController.getById);

/**
 * POST /api/presensi
 * Create new presensi session
 */
router.post('/', requireAdminOrDosen, presensiController.create);

/**
 * PUT /api/presensi/:id
 * Update attendance for students
 */
router.put('/:id', requireAdminOrDosen, presensiController.update);

/**
 * DELETE /api/presensi/:id
 * Delete presensi session
 */
router.delete(
  '/:id',
  requireAdminOrDosen,
  presensiController.deletePresensi
);

export default router;