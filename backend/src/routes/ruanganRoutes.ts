/**
 * Ruangan Routes
 * Routes for room management
 */

import { Router } from 'express';
import * as ruanganController from '../controllers/ruanganController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/roleMiddleware';
import {
  validate,
  stringValidation,
  integerValidation,
  booleanValidation,
  idParamValidation,
  paginationValidation,
} from '../middlewares/validationMiddleware';
import { body, query } from 'express-validator';

const router = Router();

/**
 * GET /api/ruangan
 * Get all ruangan
 */
router.get(
  '/',
  authenticate,
  validate([
    ...paginationValidation(),
    query('search').optional().isString(),
    query('isActive').optional().isBoolean(),
    query('sortBy').optional().isIn(['nama', 'kapasitas', 'createdAt']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ]),
  ruanganController.getAll
);

/**
 * GET /api/ruangan/:id
 * Get ruangan by ID
 */
router.get(
  '/:id',
  authenticate,
  idParamValidation('id'),
  ruanganController.getById
);

/**
 * POST /api/ruangan
 * Create new ruangan
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate([
    stringValidation('nama', 2),
    body('kapasitas').optional().isInt({ min: 1, max: 200 }),
  ]),
  ruanganController.create
);

/**
 * PUT /api/ruangan/:id
 * Update ruangan
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate([
    idParamValidation('id'),
    body('nama')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Nama ruangan minimal 2 karakter'),
    body('kapasitas').optional().isInt({ min: 1, max: 200 }),
    body('isActive').optional().isBoolean(),
  ]),
  ruanganController.update
);

/**
 * DELETE /api/ruangan/:id
 * Delete ruangan
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  idParamValidation('id'),
  ruanganController.deleteById
);

export default router;
