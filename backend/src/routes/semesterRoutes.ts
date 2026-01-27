/**
 * Semester Routes
 * Routes for academic semester management
 */

import { Router } from 'express';
import * as semesterController from '../controllers/semesterController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireAdmin, requireAdminOrDosen } from '../middlewares/roleMiddleware';
import prisma from '../config/database';
import {
  validate,
  stringValidation,
  enumValidation,
  idParamValidation,
  dateValidation,
  paginationValidation,
} from '../middlewares/validationMiddleware';
import { query } from 'express-validator';

const router = Router();

/**
 * GET /api/semester
 * Get all semesters
 */
router.get(
  '/',
  authenticate,
  validate([
    ...paginationValidation(),
    query('isActive').optional().isBoolean(),
    query('sortBy').optional().isIn(['tahunAkademik', 'periode', 'createdAt']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ]),
  semesterController.getAll
);

/**
 * GET /api/semester/:id
 * Get semester by ID
 */
router.get(
  '/:id',
  authenticate,
  idParamValidation('id'),
  semesterController.getById
);

/**
 * POST /api/semester
 * Create new semester
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate([
    stringValidation('tahunAkademik', 9), // e.g., "2024/2025"
    enumValidation('periode', ['GANJIL', 'GENAP']),
    dateValidation('tanggalMulai'),
    dateValidation('tanggalSelesai'),
    dateValidation('periodeKRSMulai'),
    dateValidation('periodeKRSSelesai'),
    dateValidation('periodePerbaikanKRSMulai'),
    dateValidation('periodePerbaikanKRSSelesai'),
  ]),
  semesterController.create
);

/**
 * PUT /api/semester/:id
 * Update semester
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate([
    idParamValidation('id'),
    // All fields optional for update
  ]),
  semesterController.update
);

/**
 * DELETE /api/semester/:id
 * Delete semester
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  idParamValidation('id'),
  semesterController.deleteById
);

/**
 * POST /api/semester/:id/activate
 * Activate semester
 */
router.post(
  '/:id/activate',
  authenticate,
  requireAdmin,
  idParamValidation('id'),
  semesterController.activate
);

// ============================================
// RUN THIS IN BACKEND TO DEBUG AND FIX
// Add this temporary route to check database state
// ============================================

/**
 * GET /api/semester/debug/check-active
 * Debug endpoint to see all active semesters
 */
router.get(
  '/debug/check-active',
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      // Get ALL semesters
      const allSemesters = await prisma.semester.findMany({
        orderBy: { tahunAkademik: 'desc' },
        select: {
          id: true,
          tahunAkademik: true,
          periode: true,
          isActive: true,
        },
      });

      // Count active
      const activeCount = await prisma.semester.count({
        where: { isActive: true },
      });

      // Get all active ones
      const activeSemesters = await prisma.semester.findMany({
        where: { isActive: true },
      });

      res.json({
        success: true,
        data: {
          all: allSemesters,
          activeCount,
          activeSemesters,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
);

/**
 * POST /api/semester/debug/fix-activation
 * Force fix activation - deactivate all then activate one
 */
router.post(
  '/debug/fix-activation/:id',
  authenticate,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const semesterId = parseInt(id);

      console.log('=== FIX ACTIVATION DEBUG ===');
      console.log('Target semester ID:', semesterId);

      // Step 1: Deactivate ALL
      const deactivateResult = await prisma.semester.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
      console.log('Deactivated count:', deactivateResult.count);

      // Step 2: Activate target
      const activateResult = await prisma.semester.update({
        where: { id: semesterId },
        data: { isActive: true },
      });
      console.log('Activated:', activateResult);

      // Step 3: Verify
      const activeNow = await prisma.semester.findMany({
        where: { isActive: true },
      });
      console.log('Active semesters after fix:', activeNow);

      res.json({
        success: true,
        message: 'Activation fixed',
        data: {
          deactivated: deactivateResult.count,
          activated: activateResult,
          currentlyActive: activeNow,
        },
      });
    } catch (error) {
      console.error('Fix activation error:', error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
);

export default router;
