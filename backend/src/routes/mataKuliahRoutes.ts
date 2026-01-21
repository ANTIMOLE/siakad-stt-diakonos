/**
 * Mata Kuliah Routes
 * Routes for course management
 */

import { Router } from 'express';
import * as mataKuliahController from '../controllers/mataKuliahController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireAdmin, requireAdminOrDosen } from '../middlewares/roleMiddleware';
import {
  validate,
  stringValidation,
  optionalStringValidation,
  integerValidation,
  booleanValidation,
  idParamValidation,
  paginationValidation,
  arrayValidation,
} from '../middlewares/validationMiddleware';
import { body, query } from 'express-validator';

const router = Router();

/**
 * GET /api/mata-kuliah
 * Get all mata kuliah
 */
router.get(
  '/',
  authenticate,
  requireAdminOrDosen,
  validate([
    ...paginationValidation(),
    query('search').optional().isString(),
    query('semesterIdeal').optional().isInt({ min: 1, max: 8 }),
    query('isLintasProdi').optional().isBoolean(),
    query('isActive').optional().isBoolean(),
    query('sortBy').optional().isIn(['kodeMK', 'namaMK', 'sks', 'semesterIdeal']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ]),
  mataKuliahController.getAll
);

/**
 * GET /api/mata-kuliah/:id
 * Get mata kuliah by ID
 */
router.get(
  '/:id',
  authenticate,
  idParamValidation('id'),
  mataKuliahController.getById
);

/**
 * POST /api/mata-kuliah
 * Create new mata kuliah
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate([
    body('kodeMK')
      .notEmpty()
      .withMessage('Kode mata kuliah wajib diisi')
      .isString()
      .trim()
      .isLength({ min: 2, max: 10 })
      .withMessage('Kode mata kuliah 2-10 karakter'),
    stringValidation('namaMK', 3),
    integerValidation('sks', 1, 6),
    integerValidation('semesterIdeal', 1, 8),
    body('isLintasProdi').optional().isBoolean(),
    optionalStringValidation('deskripsi'),
  ]),
  mataKuliahController.create
);

/**
 * PUT /api/mata-kuliah/:id
 * Update mata kuliah
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate([
    idParamValidation('id'),
    body('kodeMK')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2, max: 10 })
      .withMessage('Kode mata kuliah 2-10 karakter'),
    body('namaMK')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 3 })
      .withMessage('Nama mata kuliah minimal 3 karakter'),
    body('sks').optional().isInt({ min: 1, max: 6 }),
    body('semesterIdeal').optional().isInt({ min: 1, max: 8 }),
    body('isLintasProdi').optional().isBoolean(),
    optionalStringValidation('deskripsi'),
    body('isActive').optional().isBoolean(),
    body('prasyaratIds')
      .optional()
      .isArray()
      .withMessage('Prasyarat harus berupa array'),
  ]),
  mataKuliahController.update
);

/**
 * DELETE /api/mata-kuliah/:id
 * Delete mata kuliah
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  idParamValidation('id'),
  mataKuliahController.deleteById
);

export default router;
