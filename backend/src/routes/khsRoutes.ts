/**
 * KHS Routes
 * Routes for academic transcript (KHS) management
 */

import { Router } from 'express';
import * as khsController from '../controllers/khsController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireAdmin, requireAdminOrDosen } from '../middlewares/roleMiddleware';
import {
  validate,
  idParamValidation,
  integerValidation,
  arrayValidation,
} from '../middlewares/validationMiddleware';
import { body, query } from 'express-validator';

const router = Router();

/**
 * GET /api/khs
 * Get all KHS for a mahasiswa
 * Access: Admin, Dosen (dosen wali), Mahasiswa (own)
 */
router.get(
  '/',
  authenticate,
  validate([
    query('mahasiswaId')
      .notEmpty()
      .withMessage('Mahasiswa ID wajib disediakan')
      .isInt({ min: 1 })
      .withMessage('Mahasiswa ID tidak valid'),
  ]),
  khsController.getAll
);

/**
 * GET /api/khs/:id
 * Get KHS by ID with details
 * Access: Admin, Dosen, Mahasiswa (own)
 */
router.get(
  '/:id',
  authenticate,
  idParamValidation('id'),
  khsController.getById
);

/**
 * POST /api/khs/generate
 * Generate KHS for mahasiswa
 * Access: Admin only (usually auto-triggered after nilai finalized)
 */
router.post(
  '/generate',
  authenticate,
  requireAdmin,
  validate([
    body('mahasiswaIds')
      .isArray({ min: 1 })
      .withMessage('Mahasiswa IDs harus berupa array dengan minimal 1 data'),
    body('mahasiswaIds.*')
      .isInt({ min: 1 })
      .withMessage('Mahasiswa ID tidak valid'),
    integerValidation('semesterId', 1),
  ]),
  khsController.generate
);

/**
 * GET /api/khs/transkrip/:mahasiswaId
 * Get full transcript for a mahasiswa
 * Access: Admin, Dosen (dosen wali), Mahasiswa (own)
 */
router.get(
  '/transkrip/:mahasiswaId',
  authenticate,
  idParamValidation('mahasiswaId'),
  khsController.getTranskrip
);

/**
 * GET /api/khs/:id/pdf
 * Download KHS as PDF
 * Access: Admin, Dosen, Mahasiswa (own)
 */
router.get(
  '/:id/pdf',
  authenticate,
  idParamValidation('id'),
  khsController.downloadPDF
);

/**
 * GET /api/khs/transkrip/:mahasiswaId/pdf
 * Download full transcript as PDF
 * Access: Admin, Dosen, Mahasiswa (own)
 */
router.get(
  '/transkrip/:mahasiswaId/pdf',
  authenticate,
  idParamValidation('mahasiswaId'),
  khsController.downloadTranskripPDF
);

export default router;
