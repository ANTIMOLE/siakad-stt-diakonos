import { Router } from 'express';
import * as dosenController from '../controllers/dosenController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireAdmin, requireAdminOrDosen } from '../middlewares/roleMiddleware';
import {
  validate,
  simplePasswordValidation,
  stringValidation,
  integerValidation,
  idParamValidation,
  nidnValidation,
  paginationValidation,
} from '../middlewares/validationMiddleware';
import { body, query } from 'express-validator';

const router = Router();

/**
 * GET /api/dosen
 * Get all dosen with filters and pagination
 */
router.get(
  '/',
  authenticate,
  requireAdminOrDosen,
  validate([
    ...paginationValidation(),
    query('search').optional().isString(),
    query('prodiId').optional().isInt({ min: 1 }),
    query('status').optional().isIn(['AKTIF', 'NON_AKTIF']),
    query('sortBy').optional().isIn(['nidn', 'namaLengkap', 'createdAt']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ]),
  dosenController.getAll
);

/**
 * GET /api/dosen/:id
 * Get dosen by ID
 */
router.get(
  '/:id',
  authenticate,
  requireAdminOrDosen,
  idParamValidation('id'),
  dosenController.getById
);

router.post(
  '/',
  authenticate,
  requireAdmin,
  validate([
    nidnValidation(),
    body('nuptk')
      .notEmpty()
      .withMessage('NUPTK wajib diisi')
      .isLength({ min: 16, max: 16 })
      .withMessage('NUPTK harus 16 digit')
      .isNumeric()
      .withMessage('NUPTK harus berupa angka'),
    stringValidation('namaLengkap', 3),
    body('prodiId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Program Studi tidak valid'),
    body('posisi').optional().isString(),
    body('jafung').optional().isString(),
    body('alumni').optional().isString(),
    body('lamaMengajar').optional().isString(),
    body('tempatLahir').optional().isString(),
    body('tanggalLahir').optional().isISO8601(),
    simplePasswordValidation(),
  ]),
  dosenController.create
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate([
    idParamValidation('id'),
    body('nidn')
      .optional()
      .isLength({ min: 10, max: 10 })
      .withMessage('NIDN harus 10 digit')
      .isNumeric()
      .withMessage('NIDN harus berupa angka'),
    body('nuptk')
      .optional()
      .isLength({ min: 16, max: 16 })
      .withMessage('NUPTK harus 16 digit')
      .isNumeric()
      .withMessage('NUPTK harus berupa angka'),
    body('namaLengkap')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 3 })
      .withMessage('Nama lengkap minimal 3 karakter'),
    body('prodiId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Program Studi tidak valid'),
    body('posisi').optional().isString(),
    body('jafung').optional().isString(),
    body('alumni').optional().isString(),
    body('lamaMengajar').optional().isString(),
    body('tempatLahir').optional().isString(),
    body('tanggalLahir').optional().isISO8601(),
    body('status')
      .optional()
      .isIn(['AKTIF', 'NON_AKTIF'])
      .withMessage('Status tidak valid'),
  ]),
  dosenController.update
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  idParamValidation('id'),
  dosenController.deleteById
);

export default router;