/**
 * Kelas Mata Kuliah Routes
 * Routes for class schedule management
 */

import { Router } from 'express';
import * as kelasMKController from '../controllers/kelasMKController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/roleMiddleware';
import {
  validate,
  integerValidation,
  enumValidation,
  optionalStringValidation,
  idParamValidation,
  paginationValidation,
} from '../middlewares/validationMiddleware';
import { body, query } from 'express-validator';

const router = Router();

/**
 * GET /api/kelas-mk
 * Get all kelas
 */
router.get(
  '/',
  authenticate,
  validate([
    ...paginationValidation(),
    query('search').optional().isString(),
    query('semester_id').optional().isInt({ min: 1 }),  // ✅ Accept semester_id
    query('semesterId').optional().isInt({ min: 1 }),   // Also accept semesterId
    query('dosenId').optional().isInt({ min: 1 }),
    query('mkId').optional().isInt({ min: 1 }),
    query('hari').optional().isIn(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']),
    query('sortBy').optional().isIn(['hari', 'jamMulai', 'createdAt']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ]),
  kelasMKController.getAll
);

/**
 * GET /api/kelas-mk/:id
 * Get kelas by ID
 */
router.get(
  '/:id',
  authenticate,
  idParamValidation('id'),
  kelasMKController.getById
);

/**
 * POST /api/kelas-mk
 * Create new kelas
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate([
    integerValidation('mkId', 1),
    integerValidation('semesterId', 1),
    integerValidation('dosenId', 1),
    enumValidation('hari', ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']),
    body('jamMulai')
      .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Format jam mulai tidak valid (HH:mm)'),
    body('jamSelesai')
      .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Format jam selesai tidak valid (HH:mm)'),
    integerValidation('ruanganId', 1),
    body('kuotaMax').optional().isInt({ min: 1, max: 100 }),
    optionalStringValidation('keterangan'),
  ]),
  kelasMKController.create
);

/**
 * PUT /api/kelas-mk/:id
 * Update kelas
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate([
    idParamValidation('id'),
    // All fields optional for update
  ]),
  kelasMKController.update
);

/**
 * DELETE /api/kelas-mk/:id
 * Delete kelas
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  idParamValidation('id'),
  kelasMKController.deleteById
);

export default router;
