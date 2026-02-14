/**
 * Nilai Routes
 * Routes for grading management
 */

import { Router } from 'express';
import * as nilaiController from '../controllers/nilaiController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireDosen, requireAdminOrDosen } from '../middlewares/roleMiddleware';
import {
  validate,
  idParamValidation,
  arrayValidation,
} from '../middlewares/validationMiddleware';
import { body } from 'express-validator';

const router = Router();

/**
 * GET /api/nilai/kelas/:kelasId
 * Get all nilai for a class
 * Access: Dosen (pengampu), Admin
 */
router.get(
  '/kelas/:kelasId',
  authenticate,
  requireAdminOrDosen,
  idParamValidation('kelasId'),
  nilaiController.getByKelas
);

/**
 * POST /api/nilai/kelas/:kelasId
 * Batch save nilai for a class
 * Access: Dosen (pengampu), Admin
 */
router.post(
  '/kelas/:kelasId',
  authenticate,
  requireDosen,
  validate([
    idParamValidation('kelasId'),
    body('nilai')
      .isArray({ min: 1 })
      .withMessage('Nilai harus berupa array dengan minimal 1 data'),
    body('nilai.*.mahasiswaId')
      .isInt({ min: 1 })
      .withMessage('Mahasiswa ID tidak valid'),
    body('nilai.*.nilaiAngka')
      .isFloat({ min: 0, max: 100 })
      .withMessage('Nilai angka harus antara 0-100'),
  ]),
  nilaiController.saveNilai
);

/**
 * POST /api/nilai/kelas/:kelasId/finalize
 * Finalize nilai (lock and generate KHS)
 * Access: Dosen (pengampu)
 */
router.post(
  '/kelas/:kelasId/finalize',
  authenticate,
  requireDosen,
  idParamValidation('kelasId'),
  nilaiController.finalize
);

/**
 * POST /api/nilai/kelas/:kelasId/unlock
 * Unlock nilai to allow editing
 * Access: Dosen (pengampu), Admin
 */
router.post(
  '/kelas/:kelasId/unlock',
  authenticate,
  requireAdminOrDosen,
  idParamValidation('kelasId'),
  nilaiController.unlock
);

router.get(
  '/kelas/:kelasId/export',
  authenticate,
  requireAdminOrDosen,
  idParamValidation('kelasId'),
  nilaiController.exportNilaiKelasPDF
);

export default router;
