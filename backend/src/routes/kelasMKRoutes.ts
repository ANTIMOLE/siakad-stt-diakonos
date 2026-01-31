import { Router } from 'express';
import * as kelasMKController from '../controllers/kelasMKController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireAdmin, requireAdminOrDosen } from '../middlewares/roleMiddleware';
import { validate, idParamValidation } from '../middlewares/validationMiddleware';
import { body, query } from 'express-validator';

const router = Router();


router.get(
  '/',
  authenticate,
  requireAdminOrDosen,
  validate([
    query('search').optional().isString(),
    query('semester_id').optional().isInt({ min: 1 }),
    query('semesterId').optional().isInt({ min: 1 }),
    query('dosenId').optional().isInt({ min: 1 }),
    query('mkId').optional().isInt({ min: 1 }),
    query('hari')
      .optional()
      .isIn(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'])
      .withMessage('Hari tidak valid'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page harus integer >= 1'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 5000 })  // ✅ CHANGED: 100 → 5000
      .withMessage('Limit harus integer 1-5000'),
    query('sortBy').optional().isString(),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ]),
  kelasMKController.getAll
);


router.get(
  '/:id',
  authenticate,
  // requireAdminOrDosen, SEMENTARA DIHAPUS UNTUK MEMUDAHKAN MAHASISWA MENGAKSES DETAIL KELAS ?
  idParamValidation('id'),
  kelasMKController.getById
);

/**
 * POST /api/kelas-mk
 * Create new kelas
 * Access: Admin only
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate([
    body('mkId')
      .isInt({ min: 1 })
      .withMessage('Mata kuliah wajib dipilih'),
    body('semesterId')
      .isInt({ min: 1 })
      .withMessage('Semester wajib dipilih'),
    body('dosenId')
      .isInt({ min: 1 })
      .withMessage('Dosen wajib dipilih'),
    body('hari')
      .isIn(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'])
      .withMessage('Hari tidak valid'),
    body('jamMulai')
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage('Format jam mulai tidak valid (HH:mm)'),
    body('jamSelesai')
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage('Format jam selesai tidak valid (HH:mm)')
      .custom((value, { req }) => {
        if (value <= req.body.jamMulai) {
          throw new Error('Jam selesai harus lebih besar dari jam mulai');
        }
        return true;
      }),
    body('ruanganId')
      .isInt({ min: 1 })
      .withMessage('Ruangan wajib dipilih'),
    body('kuotaMax')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Kuota maksimal harus antara 1-100'),
    body('keterangan').optional().isString(),
  ]),
  kelasMKController.create
);

/**
 * PUT /api/kelas-mk/:id
 * Update kelas
 * Access: Admin only
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate([
    idParamValidation('id'),
    body('mkId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Mata kuliah tidak valid'),
    body('semesterId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Semester tidak valid'),
    body('dosenId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Dosen tidak valid'),
    body('hari')
      .optional()
      .isIn(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'])
      .withMessage('Hari tidak valid'),
    body('jamMulai')
      .optional()
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage('Format jam mulai tidak valid (HH:mm)'),
    body('jamSelesai')
      .optional()
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage('Format jam selesai tidak valid (HH:mm)'),
    body('ruanganId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Ruangan tidak valid'),
    body('kuotaMax')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Kuota maksimal harus antara 1-100'),
    body('keterangan').optional().isString(),
  ]),
  kelasMKController.update
);

/**
 * DELETE /api/kelas-mk/:id
 * Delete kelas
 * Access: Admin only
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  idParamValidation('id'),
  kelasMKController.deleteById
);

export default router;