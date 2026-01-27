/**
 * KRS Routes
 * Routes for student course registration (KRS) workflow
 */

import { Router } from 'express';
import * as krsController from '../controllers/krsController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireAdmin, requireAdminOrDosen, requireDosen } from '../middlewares/roleMiddleware';
import {
  validate,
  integerValidation,
  optionalStringValidation,
  idParamValidation,
  paginationValidation,
  arrayValidation,
} from '../middlewares/validationMiddleware';
import { body, query } from 'express-validator';

const router = Router();

/**
 * GET /api/krs
 * Get all KRS with filters
 * Access: Admin, Dosen (can view all)
 */
router.get(
  '/',
  authenticate,
  requireAdminOrDosen,
  validate([
    ...paginationValidation(),
    query('search').optional().isString(),
    query('semesterId').optional().isInt({ min: 1 }),
    query('mahasiswaId').optional().isInt({ min: 1 }),
    query('status').optional().isIn(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED']),
    query('sortBy').optional().isIn(['createdAt', 'submittedAt', 'approvedAt']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ]),
  krsController.getAll
);

/**
 * GET /api/krs/:id
 * Get KRS by ID
 * Access: Admin, Dosen, Mahasiswa (own KRS)
 */
router.get(
  '/:id',
  authenticate,
  idParamValidation('id'),
  krsController.getById
);

/**
 * POST /api/krs
 * Create new KRS
 * Access: Admin, Mahasiswa (own KRS)
 */
router.post(
  '/',
  authenticate,
  validate([
    integerValidation('mahasiswaId', 1),
    integerValidation('semesterId', 1),
    body('paketKRSId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Paket KRS tidak valid'),
    body('kelasMKIds')
      .optional()
      .isArray({ min: 1 })
      .withMessage('Daftar kelas minimal 1'),
    body('kelasMKIds.*')
      .optional()
      .isInt({ min: 1 })
      .withMessage('ID kelas tidak valid'),
  ]),
  krsController.create
);

/**
 * PUT /api/krs/:id
 * Update KRS (only DRAFT status)
 * Access: Admin, Mahasiswa (own KRS)
 */
router.put(
  '/:id',
  authenticate,
  validate([
    idParamValidation('id'),
    body('kelasMKIds')
      .isArray({ min: 1 })
      .withMessage('Daftar kelas minimal 1'),
    body('kelasMKIds.*')
      .isInt({ min: 1 })
      .withMessage('ID kelas tidak valid'),
  ]),
  krsController.update
);

/**
 * DELETE /api/krs/:id
 * Delete KRS (only DRAFT status)
 * Access: Admin only
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  idParamValidation('id'),
  krsController.deleteById
);

/**
 * POST /api/krs/:id/submit
 * Submit KRS for approval
 * Access: Admin, Mahasiswa (own KRS)
 */
router.post(
  '/:id/submit',
  authenticate,
  idParamValidation('id'),
  krsController.submit
);


router.post(
  '/:id/approve',
  authenticate,
  requireAdminOrDosen,
  idParamValidation('id'),
  krsController.approve
);

/**
 * POST /api/krs/:id/reject
 * Reject KRS
 * Access: Dosen only (dosen wali)
 */
router.post(
  '/:id/reject',
  authenticate,
  requireAdminOrDosen,
  validate([
    idParamValidation('id'),
    optionalStringValidation('catatan'),
  ]),
  krsController.reject
);

/**
 * GET /api/krs/:id/pdf
 * Download KRS as PDF
 * Access: Admin, Dosen, Mahasiswa (own KRS)
 */
router.get(
  '/:id/pdf',
  authenticate,
  idParamValidation('id'),
  krsController.downloadPDF
);

export default router;
