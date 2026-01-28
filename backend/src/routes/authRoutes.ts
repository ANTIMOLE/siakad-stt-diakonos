/**
 * Authentication Routes
 * Routes for login, register, profile, password management
 */

import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireAdmin, requireKeuanganOrAdmin } from '../middlewares/roleMiddleware';
import {
  validate,
  simplePasswordValidation,
  stringValidation,
  enumValidation,
  nimValidation,
  nidnValidation,
  nuptkValidation,
  integerValidation,
  identifierValidation, // ← Import baru
} from '../middlewares/validationMiddleware';
import { body } from 'express-validator';

const router = Router();

/**
 * POST /api/auth/login
 * Public route - Login with identifier (NIM/NIDN) and password
 */
router.post(
  '/login',
  validate([
    identifierValidation(), // ← Pakai helper
    body('password')
      .notEmpty()
      .withMessage('Password wajib diisi'),
  ]),
  authController.login
);

/**
 * POST /api/auth/register
 * Protected route - Admin only
 * Register new user (ADMIN, DOSEN, or MAHASISWA)
 */
router.post(
  '/register',
  authenticate,
  requireAdmin,
  validate([
    simplePasswordValidation(),
    enumValidation('role', ['ADMIN', 'DOSEN', 'MAHASISWA']),
    stringValidation('namaLengkap', 3),
    
    // Conditional validations based on role
    body('nim')
      .if(body('role').equals('MAHASISWA'))
      .notEmpty()
      .withMessage('NIM wajib diisi untuk mahasiswa')
      .isLength({ min: 8, max: 10 })
      .withMessage('NIM harus 8-10 digit')
      .isNumeric()
      .withMessage('NIM harus berupa angka'),
    
    body('nidn')
      .if(body('role').equals('DOSEN'))
      .notEmpty()
      .withMessage('NIDN wajib diisi untuk dosen')
      .isLength({ min: 10, max: 10 })
      .withMessage('NIDN harus 10 digit')
      .isNumeric()
      .withMessage('NIDN harus berupa angka'),
    
    body('nuptk')
      .if(body('role').equals('DOSEN'))
      .notEmpty()
      .withMessage('NUPTK wajib diisi untuk dosen')
      .isLength({ min: 16, max: 16 })
      .withMessage('NUPTK harus 16 digit')
      .isNumeric()
      .withMessage('NUPTK harus berupa angka'),
    
    body('prodiId')
      .if(body('role').isIn(['MAHASISWA', 'DOSEN']))
      .notEmpty()
      .withMessage('Program Studi wajib dipilih')
      .isInt({ min: 1 })
      .withMessage('Program Studi tidak valid'),
    
    body('angkatan')
      .if(body('role').equals('MAHASISWA'))
      .notEmpty()
      .withMessage('Angkatan wajib diisi untuk mahasiswa')
      .isInt({ min: 2000, max: 2100 })
      .withMessage('Angkatan tidak valid'),
  ]),
  authController.register
);

/**
 * GET /api/auth/me
 * Protected route - Get current authenticated user
 */
router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

/**
 * POST /api/auth/change-password
 * Protected route - Change user password
 */
router.post(
  '/change-password',
  authenticate,
  validate([
    body('oldPassword')
      .notEmpty()
      .withMessage('Password lama wajib diisi'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Password baru minimal 6 karakter'),
    body('confirmPassword')
      .notEmpty()
      .withMessage('Konfirmasi password wajib diisi')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Konfirmasi password tidak cocok');
        }
        return true;
      }),
  ]),
  authController.changePassword
);

/**
 * POST /api/auth/logout
 * Protected route - Logout user
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * POST /api/auth/refresh
 * Protected route - Refresh JWT token
 */
router.post(
  '/refresh',
  authenticate,
  authController.refreshToken
);


router.post(
  '/change-username',
  authenticate,
  requireKeuanganOrAdmin,  // ✅ Use existing middleware
  validate([
    body('newUsername')
      .trim()
      .isLength({ min: 3 })
      .withMessage('Username minimal 3 karakter')
      .matches(/^[a-zA-Z][a-zA-Z0-9_-]*$/)
      .withMessage('Username harus diawali huruf dan hanya boleh mengandung huruf, angka, underscore, atau hyphen'),
  ]),
  authController.changeUsername
);

export default router;