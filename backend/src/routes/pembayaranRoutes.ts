/**
 * Pembayaran Routes
 * ✅ UPDATED: All payment types
 */

import { Router } from 'express';
import * as pembayaranController from '../controllers/pembayaranController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireKeuangan, requireMahasiswa , requireKeuanganOrAdmin} from '../middlewares/roleMiddleware';
import {
  validate,
  idParamValidation,
  integerValidation,
} from '../middlewares/validationMiddleware';
import { body, query } from 'express-validator';

const router = Router();

/**
 * POST /api/pembayaran/upload
 * Upload bukti pembayaran
 * Access: Mahasiswa only
 */
router.post(
  '/upload',
  authenticate,
  requireMahasiswa,
  pembayaranController.upload.single('bukti'),
  validate([
    body('jenisPembayaran')
      .notEmpty()
      .withMessage('Jenis pembayaran wajib diisi')
      .isIn(['KRS', 'TENGAH_SEMESTER', 'PPL', 'SKRIPSI', 'WISUDA', 'KOMITMEN_BULANAN'])
      .withMessage('Jenis pembayaran tidak valid'),
    body('nominal')
      .isInt({ min: 1 })
      .withMessage('Nominal harus lebih dari 0'),
    body('semesterId').optional().isInt({ min: 1 }),
    body('bulanPembayaran').optional().isISO8601().withMessage('Format tanggal tidak valid'),
  ]),
  pembayaranController.uploadBukti
);

/**
 * GET /api/pembayaran
 * Get all pembayaran with filters
 * Access: Keuangan only
 */
router.get(
  '/',
  authenticate,
  requireKeuanganOrAdmin,
  validate([
    query('search').optional().isString(),
    query('status')
      .optional()
      .isIn(['ALL', 'PENDING', 'APPROVED', 'REJECTED'])
      .withMessage('Status tidak valid'),
    query('jenisPembayaran')
      .optional()
      .isIn(['ALL', 'KRS', 'TENGAH_SEMESTER', 'PPL', 'SKRIPSI', 'WISUDA', 'KOMITMEN_BULANAN'])
      .withMessage('Jenis pembayaran tidak valid'),
    query('semesterId').optional().isInt({ min: 1 }),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page harus integer >= 1'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit harus integer 1-100'),
  ]),
  pembayaranController.getAll
);

/**
 * GET /api/pembayaran/stats
 * Get payment statistics
 * Access: Keuangan only
 */
router.get(
  '/stats',
  authenticate,
  requireKeuanganOrAdmin,
  validate([
    query('semesterId').optional().isInt({ min: 1 }),
    query('jenisPembayaran')
      .optional()
      .isIn(['KRS', 'TENGAH_SEMESTER', 'PPL', 'SKRIPSI', 'WISUDA', 'KOMITMEN_BULANAN']),
  ]),
  pembayaranController.getStats
);

/**
 * GET /api/pembayaran/mahasiswa
 * Get payment history for logged in mahasiswa
 * Access: Mahasiswa only
 */
router.get(
  '/mahasiswa',
  authenticate,
  requireMahasiswa,
  validate([
    query('jenisPembayaran')
      .optional()
      .isIn(['ALL', 'KRS', 'TENGAH_SEMESTER', 'PPL', 'SKRIPSI', 'WISUDA', 'KOMITMEN_BULANAN']),
  ]),
  pembayaranController.getMahasiswaHistory
);

router.get(
  '/report/pdf',
  authenticate,
  requireKeuanganOrAdmin,
  validate([
    query('search').optional().isString(),
    query('status')
      .optional()
      .isIn(['ALL', 'PENDING', 'APPROVED', 'REJECTED'])
      .withMessage('Status tidak valid'),
    query('jenisPembayaran')
      .optional()
      .isIn(['ALL', 'KRS', 'TENGAH_SEMESTER', 'PPL', 'SKRIPSI', 'WISUDA', 'KOMITMEN_BULANAN'])
      .withMessage('Jenis pembayaran tidak valid'),
    query('semesterId').optional().isInt({ min: 1 }),
  ]),
  pembayaranController.downloadPDFReport
);

/**
 * GET /api/pembayaran/:id
 * Get pembayaran detail
 * Access: Keuangan, Mahasiswa (own only)
 */
router.get(
  '/:id',
  authenticate,
  idParamValidation('id'),
  pembayaranController.getById
);

/**
 * POST /api/pembayaran/:id/approve
 * Approve pembayaran
 * Access: Keuangan only
 */
router.post(
  '/:id/approve',
  authenticate,
  requireKeuanganOrAdmin,
  idParamValidation('id'),
  pembayaranController.approve
);

/**
 * POST /api/pembayaran/:id/reject
 * Reject pembayaran
 * Access: Keuangan only
 */
router.post(
  '/:id/reject',
  authenticate,
  requireKeuanganOrAdmin,
  validate([
    idParamValidation('id'),
    body('catatan')
      .notEmpty()
      .withMessage('Catatan penolakan wajib diisi')
      .isString()
      .isLength({ min: 10 })
      .withMessage('Catatan minimal 10 karakter'),
  ]),
  pembayaranController.reject
);

router.options('/bukti/:id', (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  
  res.status(204).send();
});

// Then the GET route
router.get('/bukti/:id', authenticate, pembayaranController.serveBukti);



export default router;
