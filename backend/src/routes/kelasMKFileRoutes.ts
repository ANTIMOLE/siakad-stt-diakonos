/**
 * Kelas MK File Routes
 * Routes for RPS, RPP, and MATERI management
 * ✅ FIXED: Typo in controller import
 */

import { Router } from 'express';
import * as kelasMKFileController from '../controllers/kelasMKFileController'; // ✅ FIXED: was kerlasMKFileController
import { authenticate } from '../middlewares/authMiddleware';
import { requireDosen, requireMahasiswa } from '../middlewares/roleMiddleware';
import {
  validate,
  idParamValidation,
} from '../middlewares/validationMiddleware';
import { body, query } from 'express-validator';

const router = Router();

/**
 * POST /api/kelas-mk-files/upload
 * Upload file (RPS/RPP/MATERI)
 * Access: Dosen only (own classes)
 */
router.post(
  '/upload',
  authenticate,
  requireDosen,
  kelasMKFileController.upload.single('file'),
  validate([
    body('kelasMKId').isInt({ min: 1 }).withMessage('Kelas MK ID harus valid'),
    body('tipeFile')
      .isIn(['RPS', 'RPP', 'MATERI'])
      .withMessage('Tipe file harus RPS, RPP, atau MATERI'),
    body('namaFile').notEmpty().withMessage('Nama file harus diisi'),
    body('mingguKe')
      .optional()
      .isInt({ min: 1, max: 16 })
      .withMessage('Minggu harus antara 1-16'),
    body('keterangan').optional().isString(),
  ]),
  kelasMKFileController.uploadFile
);

/**
 * DELETE /api/kelas-mk-files/:id
 * Delete file
 * Access: Dosen only (own files)
 */
router.delete(
  '/:id',
  authenticate,
  requireDosen,
  idParamValidation('id'),
  kelasMKFileController.deleteFile
);

/**
 * PATCH /api/kelas-mk-files/:id/rename
 * Rename file (display name only)
 * Access: Dosen only (own files)
 */
router.patch(
  '/:id/rename',
  authenticate,
  requireDosen,
  validate([
    idParamValidation('id'),
    body('namaFile').notEmpty().withMessage('Nama file harus diisi'),
  ]),
  kelasMKFileController.renameFile
);

/**
 * GET /api/kelas-mk-files/kelas/:kelasMKId/dosen
 * Get files for a class (Dosen view)
 * Access: Dosen only (own classes)
 */
router.get(
  '/kelas/:kelasMKId/dosen',
  authenticate,
  requireDosen,
  validate([
    idParamValidation('kelasMKId'),
    query('tipeFile')
      .optional()
      .isIn(['RPS', 'RPP', 'MATERI'])
      .withMessage('Tipe file tidak valid'),
    query('mingguKe')
      .optional()
      .isInt({ min: 1, max: 16 })
      .withMessage('Minggu harus antara 1-16'),
  ]),
  kelasMKFileController.getFilesByKelasForDosen
);

/**
 * GET /api/kelas-mk-files/kelas/:kelasMKId/mahasiswa
 * Get files for a class (Mahasiswa view)
 * Access: Mahasiswa only (enrolled classes)
 */
router.get(
  '/kelas/:kelasMKId/mahasiswa',
  authenticate,
  requireMahasiswa,
  validate([
    idParamValidation('kelasMKId'),
    query('tipeFile')
      .optional()
      .isIn(['RPS', 'RPP', 'MATERI'])
      .withMessage('Tipe file tidak valid'),
    query('mingguKe')
      .optional()
      .isInt({ min: 1, max: 16 })
      .withMessage('Minggu harus antara 1-16'),
  ]),
  kelasMKFileController.getFilesByKelasForMahasiswa
);

/**
 * GET /api/kelas-mk-files/serve/:id
 * Serve/download file
 * Access: Dosen (own files) or Mahasiswa (enrolled)
 */
router.get(
  '/serve/:id',
  authenticate,
  idParamValidation('id'),
  kelasMKFileController.serveFile
);

export default router;