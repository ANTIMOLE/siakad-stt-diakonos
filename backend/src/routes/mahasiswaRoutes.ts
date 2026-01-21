/**
 * Mahasiswa Routes (FIXED)
 * Routes for student management
 * ✅ FIXED: Hapus validasi untuk field yang di-comment di schema
 */

import { Router } from 'express';
import * as mahasiswaController from '../controllers/mahasiswaController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireAdmin, requireAdminOrDosen } from '../middlewares/roleMiddleware';
import {
  validate,
  simplePasswordValidation,
  stringValidation,
  integerValidation,
  idParamValidation,
  nimValidation,
  paginationValidation,
} from '../middlewares/validationMiddleware';
import { body, query } from 'express-validator';

const router = Router();

/**
 * GET /api/mahasiswa
 * Get all mahasiswa with filters and pagination
 */
router.get(
  '/',
  authenticate,
  requireAdminOrDosen,
  validate([
    ...paginationValidation(),
    query('search').optional().isString(),
    query('prodiId').optional().isInt({ min: 1 }),
    query('angkatan').optional().isInt({ min: 2000 }),
    query('status').optional().isIn(['AKTIF', 'CUTI', 'NON_AKTIF', 'LULUS', 'DO']),
    query('tempatTanggalLahir').optional().isString(),
    query('jenisKelamin').optional().isIn(['L', 'P']),
    query('alamat').optional().isString(),
    query('dosenWaliId').optional().isInt({ min: 1 }),
    query('sortBy').optional().isIn(['nim', 'namaLengkap', 'angkatan', 'createdAt']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ]),
  mahasiswaController.getAll
);

/**
 * GET /api/mahasiswa/:id
 * Get mahasiswa by ID
 */
router.get(
  '/:id',
  authenticate,
  idParamValidation('id'),
  mahasiswaController.getById
);

/**
 * POST /api/mahasiswa
 * Create new mahasiswa
 * ✅ FIXED: Hapus validasi field yang di-comment di schema
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate([
    nimValidation(),
    stringValidation('namaLengkap', 3),
    stringValidation('tempatTanggalLahir', 3).optional(),
    body('jenisKelamin')
      .optional()
      .isIn(['L', 'P'])
      .withMessage('Jenis kelamin tidak valid'),
    stringValidation('alamat', 5).optional(),
    integerValidation('prodiId', 1),
    integerValidation('angkatan', 2000, 2100),
    body('dosenWaliId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Dosen wali tidak valid'),
    simplePasswordValidation(),
  ]),
  mahasiswaController.create
);

/**
 * PUT /api/mahasiswa/:id
 * Update mahasiswa
 * ✅ FIXED: Hapus validasi field yang di-comment di schema
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate([
    idParamValidation('id'),
    body('nim')
      .optional()
      .isLength({ min: 8, max: 10 })
      .withMessage('NIM harus 8-10 digit')
      .isNumeric()
      .withMessage('NIM harus berupa angka'),
    body('namaLengkap')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 3 })
      .withMessage('Nama lengkap minimal 3 karakter'),
    stringValidation('tempatTanggalLahir', 3).optional(),
    body('jenisKelamin')
      .optional()
      .isIn(['L', 'P'])
      .withMessage('Jenis kelamin tidak valid'),
    stringValidation('alamat', 5).optional(),
    body('prodiId').optional().isInt({ min: 1 }),
    body('angkatan').optional().isInt({ min: 2000, max: 2100 }),
    body('dosenWaliId').optional().isInt({ min: 1 }),
    body('status')
      .optional()
      .isIn(['AKTIF', 'CUTI', 'NON_AKTIF', 'LULUS', 'DO'])
      .withMessage('Status tidak valid'),
  ]),
  mahasiswaController.update
);

/**
 * DELETE /api/mahasiswa/:id
 * Delete mahasiswa (soft delete)
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  idParamValidation('id'),
  mahasiswaController.deleteById
);

/**
 * GET /api/mahasiswa/:id/krs
 * Get all KRS for specific mahasiswa
 */
router.get(
  '/:id/krs',
  authenticate,
  idParamValidation('id'),
  mahasiswaController.getKRS
);

/**
 * GET /api/mahasiswa/:id/khs
 * Get all KHS for specific mahasiswa
 */
router.get(
  '/:id/khs',
  authenticate,
  idParamValidation('id'),
  mahasiswaController.getKHS
);

export default router;