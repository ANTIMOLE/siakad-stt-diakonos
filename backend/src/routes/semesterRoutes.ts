/**
 * Semester Routes
 * Routes for academic semester management
 */

import { Router } from 'express';
import * as semesterController from '../controllers/semesterController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireAdmin, requireAdminOrDosen } from '../middlewares/roleMiddleware';
import {
  validate,
  stringValidation,
  enumValidation,
  idParamValidation,
  dateValidation,
  paginationValidation,
} from '../middlewares/validationMiddleware';
import { query } from 'express-validator';

const router = Router();

/**
 * GET /api/semester
 * Get all semesters
 */
router.get(
  '/',
  authenticate,
  validate([
    ...paginationValidation(),
    query('isActive').optional().isBoolean(),
    query('sortBy').optional().isIn(['tahunAkademik', 'periode', 'createdAt']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ]),
  semesterController.getAll
);

/**
 * GET /api/semester/:id
 * Get semester by ID
 */
router.get(
  '/:id',
  authenticate,
  idParamValidation('id'),
  semesterController.getById
);

/**
 * POST /api/semester
 * Create new semester
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate([
    stringValidation('tahunAkademik', 9), // e.g., "2024/2025"
    enumValidation('periode', ['GANJIL', 'GENAP']),
    dateValidation('tanggalMulai'),
    dateValidation('tanggalSelesai'),
    dateValidation('periodeKRSMulai'),
    dateValidation('periodeKRSSelesai'),
    dateValidation('periodePerbaikanKRSMulai'),
    dateValidation('periodePerbaikanKRSSelesai'),
  ]),
  semesterController.create
);

/**
 * PUT /api/semester/:id
 * Update semester
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate([
    idParamValidation('id'),
    // All fields optional for update
  ]),
  semesterController.update
);

/**
 * DELETE /api/semester/:id
 * Delete semester
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  idParamValidation('id'),
  semesterController.deleteById
);

/**
 * POST /api/semester/:id/activate
 * Activate semester
 */
router.post(
  '/:id/activate',
  authenticate,
  requireAdmin,
  idParamValidation('id'),
  semesterController.activate
);

export default router;
