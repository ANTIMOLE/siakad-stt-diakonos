/**
 * Pembayaran Controller
 * ✅ UPDATED: Handles all payment types
 */

import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { asyncHandler, AppError } from '../middlewares/errorMiddleware';
import * as pembayaranService from '../services/pembayaranService';
import { JenisPembayaran } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/pembayaran';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'bukti-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Hanya JPG, PNG, dan PDF yang diizinkan.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

/**
 * POST /api/pembayaran/upload
 * Upload bukti pembayaran (Mahasiswa)
 * ✅ UPDATED: Supports all payment types
 */
export const uploadBukti = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { jenisPembayaran, nominal, semesterId, bulanPembayaran } = req.body;

    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }

    // Get mahasiswa ID from user
    const mahasiswa = await prisma.mahasiswa.findFirst({
      where: { userId: req.user.id },
    });

    if (!mahasiswa) {
      throw new AppError('Data mahasiswa tidak ditemukan', 404);
    }

    // Check if file uploaded
    if (!req.file) {
      throw new AppError('Bukti pembayaran wajib diupload', 400);
    }

    // Validate required fields
    if (!jenisPembayaran || !nominal) {
      fs.unlinkSync(req.file.path);
      throw new AppError('Jenis pembayaran dan nominal wajib diisi', 400);
    }

    // Validate enum
    if (!Object.values(JenisPembayaran).includes(jenisPembayaran as JenisPembayaran)) {
      fs.unlinkSync(req.file.path);
      throw new AppError('Jenis pembayaran tidak valid', 400);
    }

    // Get file URL
    const buktiUrl = `/uploads/pembayaran/${req.file.filename}`;

    // Parse bulanPembayaran if exists
    const bulanDate = bulanPembayaran ? new Date(bulanPembayaran) : undefined;

    // Upload pembayaran
    const pembayaran = await pembayaranService.uploadBuktiPembayaran(
      mahasiswa.id,
      jenisPembayaran as JenisPembayaran,
      parseInt(nominal),
      buktiUrl,
      semesterId ? parseInt(semesterId) : undefined,
      bulanDate
    );

    res.status(201).json({
      success: true,
      message: 'Bukti pembayaran berhasil diupload',
      data: pembayaran,
    });
  }
);

/**
 * GET /api/pembayaran
 * Get all pembayaran with filters
 * ✅ UPDATED: Filter by payment type
 */
export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    search,
    status,
    semesterId,
    jenisPembayaran,
    page = '1',
    limit = '10',
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = {};

  if (search) {
    where.OR = [
      {
        mahasiswa: {
          nim: {
            contains: search as string,
            mode: 'insensitive',
          },
        },
      },
      {
        mahasiswa: {
          namaLengkap: {
            contains: search as string,
            mode: 'insensitive',
          },
        },
      },
    ];
  }

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (semesterId) {
    where.semesterId = parseInt(semesterId as string);
  }

  // ✅ NEW: Filter by payment type
  if (jenisPembayaran && jenisPembayaran !== 'ALL') {
    where.jenisPembayaran = jenisPembayaran;
  }

  // Get data
  const [pembayaranList, total] = await Promise.all([
    prisma.pembayaran.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { uploadedAt: 'desc' },
      include: {
        mahasiswa: {
          select: {
            nim: true,
            namaLengkap: true,
          },
        },
        semester: {
          select: {
            tahunAkademik: true,
            periode: true,
          },
        },
        verifiedBy: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    }),
    prisma.pembayaran.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    message: 'Data pembayaran berhasil diambil',
    data: pembayaranList,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * GET /api/pembayaran/mahasiswa
 * Get pembayaran history for logged in mahasiswa
 * ✅ UPDATED: Show all payment types
 */
export const getMahasiswaHistory = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { jenisPembayaran } = req.query;

    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }

    // Get mahasiswa ID from user
    const mahasiswa = await prisma.mahasiswa.findFirst({
      where: { userId: req.user.id },
    });

    if (!mahasiswa) {
      throw new AppError('Data mahasiswa tidak ditemukan', 404);
    }

    // Build where clause
    const where: any = { mahasiswaId: mahasiswa.id };
    if (jenisPembayaran && jenisPembayaran !== 'ALL') {
      where.jenisPembayaran = jenisPembayaran;
    }

    // Get history
    const history = await prisma.pembayaran.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
      include: {
        semester: {
          select: {
            tahunAkademik: true,
            periode: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Riwayat pembayaran berhasil diambil',
      data: history,
    });
  }
);

/**
 * GET /api/pembayaran/:id
 * Get pembayaran detail
 */
export const getById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const pembayaran = await prisma.pembayaran.findUnique({
      where: { id: parseInt(id) },
      include: {
        mahasiswa: {
          select: {
            nim: true,
            namaLengkap: true,
            prodi: {
              select: {
                kode: true,
                nama: true,
              },
            },
          },
        },
        semester: {
          select: {
            tahunAkademik: true,
            periode: true,
          },
        },
        verifiedBy: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    if (!pembayaran) {
      throw new AppError('Pembayaran tidak ditemukan', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Detail pembayaran berhasil diambil',
      data: pembayaran,
    });
  }
);

/**
 * POST /api/pembayaran/:id/approve
 * Approve pembayaran (Keuangan)
 */
export const approve = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }

    const pembayaran = await pembayaranService.approvePembayaran(
      parseInt(id),
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: 'Pembayaran berhasil disetujui',
      data: pembayaran,
    });
  }
);

/**
 * POST /api/pembayaran/:id/reject
 * Reject pembayaran (Keuangan)
 */
export const reject = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { catatan } = req.body;

    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }

    if (!catatan) {
      throw new AppError('Catatan penolakan wajib diisi', 400);
    }

    const pembayaran = await pembayaranService.rejectPembayaran(
      parseInt(id),
      req.user.id,
      catatan
    );

    res.status(200).json({
      success: true,
      message: 'Pembayaran berhasil ditolak',
      data: pembayaran,
    });
  }
);

/**
 * GET /api/pembayaran/stats
 * Get payment statistics
 * ✅ NEW: For dashboard/reporting
 */
export const getStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { semesterId, jenisPembayaran } = req.query;

    const stats = await pembayaranService.getPembayaranStats(
      semesterId ? parseInt(semesterId as string) : undefined,
      jenisPembayaran as JenisPembayaran | undefined
    );

    res.status(200).json({
      success: true,
      message: 'Statistik pembayaran berhasil diambil',
      data: stats,
    });
  }
);
