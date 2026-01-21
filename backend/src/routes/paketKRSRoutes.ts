/**
 * Paket KRS Routes
 * Routes for KRS template management
 */

import { Router } from 'express';
import * as paketKRSController from '../controllers/paketKRSController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/roleMiddleware';
import {
  validate,
  stringValidation,
  optionalStringValidation,
  integerValidation,
  idParamValidation,
  paginationValidation,
} from '../middlewares/validationMiddleware';
import { query } from 'express-validator';

const router = Router();

/**
 * GET /api/paket-krs
 * Get all paket KRS
 */
router.get(
  '/',
  authenticate,
  requireAdmin,
  validate([
    ...paginationValidation(),
    query('search').optional().isString(),
    query('prodiId').optional().isInt({ min: 1 }),
    query('angkatan').optional().isInt({ min: 2000 }),
    query('sortBy').optional().isIn(['namaPaket', 'angkatan', 'createdAt']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ]),
  paketKRSController.getAll
);

/**
 * GET /api/paket-krs/:id
 * Get paket KRS by ID
 */
router.get(
  '/:id',
  authenticate,
  requireAdmin,
  idParamValidation('id'),
  paketKRSController.getById
);

/**
 * POST /api/paket-krs
 * Create new paket KRS
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate([
    stringValidation('namaPaket', 3),
    integerValidation('prodiId', 1),
    integerValidation('angkatan', 2000, 2100),
    optionalStringValidation('deskripsi'),
  ]),
  paketKRSController.create
);

/**
 * PUT /api/paket-krs/:id
 * Update paket KRS
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate([
    idParamValidation('id'),
    // All fields optional for update
  ]),
  paketKRSController.update
);

/**
 * DELETE /api/paket-krs/:id
 * Delete paket KRS
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  idParamValidation('id'),
  paketKRSController.deleteById
);

/**
 * POST /api/paket-krs/:id/mata-kuliah
 * Add mata kuliah to paket
 */
router.post(
  '/:id/mata-kuliah',
  authenticate,
  requireAdmin,
  validate([
    idParamValidation('id'),
    integerValidation('kelasMKId', 1),
  ]),
  paketKRSController.addMataKuliah
);

/**
 * DELETE /api/paket-krs/:id/mata-kuliah/:mkId
 * Remove mata kuliah from paket
 */
router.delete(
  '/:id/mata-kuliah/:mkId',
  authenticate,
  requireAdmin,
  validate([
    idParamValidation('id'),
    idParamValidation('mkId'),
  ]),
  paketKRSController.removeMataKuliah
);

export default router;
