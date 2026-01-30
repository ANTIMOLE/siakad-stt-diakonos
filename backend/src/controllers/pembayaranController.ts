/**
 * Pembayaran Controller
 * ✅ FIXED: X-Frame-Options header for iframe display
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
import { generatePDF, getPembayaranReportHTMLTemplate } from '../utils/pdfGenerator';

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
 */
export const uploadBukti = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { jenisPembayaran, nominal, semesterId, bulanPembayaran } = req.body;

    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }

    const mahasiswa = await prisma.mahasiswa.findFirst({
      where: { userId: req.user.id },
    });

    if (!mahasiswa) {
      throw new AppError('Data mahasiswa tidak ditemukan', 404);
    }

    if (!req.file) {
      throw new AppError('Bukti pembayaran wajib diupload', 400);
    }

    if (!jenisPembayaran || !nominal) {
      fs.unlinkSync(req.file.path);
      throw new AppError('Jenis pembayaran dan nominal wajib diisi', 400);
    }

    if (!Object.values(JenisPembayaran).includes(jenisPembayaran as JenisPembayaran)) {
      fs.unlinkSync(req.file.path);
      throw new AppError('Jenis pembayaran tidak valid', 400);
    }

    const buktiUrl = `/uploads/pembayaran/${req.file.filename}`;
    const bulanDate = bulanPembayaran ? new Date(bulanPembayaran) : undefined;

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

  if (jenisPembayaran && jenisPembayaran !== 'ALL') {
    where.jenisPembayaran = jenisPembayaran;
  }

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
 */
export const getMahasiswaHistory = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { jenisPembayaran } = req.query;

    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }

    const mahasiswa = await prisma.mahasiswa.findFirst({
      where: { userId: req.user.id },
    });

    if (!mahasiswa) {
      throw new AppError('Data mahasiswa tidak ditemukan', 404);
    }

    const where: any = { mahasiswaId: mahasiswa.id };
    if (jenisPembayaran && jenisPembayaran !== 'ALL') {
      where.jenisPembayaran = jenisPembayaran;
    }

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

/**
 * ✅ FIXED: GET /api/pembayaran/bukti/:id
 * Serve bukti file with CORS headers and X-Frame-Options override
 */
export const serveBukti = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }

    // 1. Get pembayaran
    const pembayaran = await prisma.pembayaran.findUnique({
      where: { id: parseInt(id) },
      include: {
        mahasiswa: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!pembayaran) {
      throw new AppError('Pembayaran tidak ditemukan', 404);
    }

    // 2. Authorization
    if (req.user.role === 'MAHASISWA') {
      if (pembayaran.mahasiswa.userId !== req.user.id) {
        throw new AppError('Anda tidak memiliki akses ke file ini', 403);
      }
    } else if (req.user.role !== 'KEUANGAN' && req.user.role !== 'ADMIN') {
      throw new AppError('Anda tidak memiliki akses ke file ini', 403);
    }

    if (!pembayaran.buktiUrl) {
      throw new AppError('Bukti pembayaran tidak tersedia', 404);
    }

    // 3. Build file path
    const filename = path.basename(pembayaran.buktiUrl);
    const filePath = path.join(__dirname, '../../uploads/pembayaran', filename);

    // 4. Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new AppError('File tidak ditemukan di server', 404);
    }

    // 5. Determine content type
    const ext = path.extname(filePath).toLowerCase();
    const contentType =
      ext === '.pdf' ? 'application/pdf' :
      ext === '.png' ? 'image/png' :
      ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
      'application/octet-stream';

    // 6. ✅ CRITICAL: Set CORS headers FIRST
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
    }

    // 7. ✅ CRITICAL FIX: Override X-Frame-Options for iframe display
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    // 8. Set content headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    // 9. Stream file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      throw new AppError('Error saat membaca file', 500);
    });
  }
);

export const downloadPDFReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const {
      search,
      status,
      semesterId,
      jenisPembayaran,
    } = req.query;

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

    if (jenisPembayaran && jenisPembayaran !== 'ALL') {
      where.jenisPembayaran = jenisPembayaran;
    }

    const pembayaranList = await prisma.pembayaran.findMany({
      where,
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
      },
    });

    let semesterName = '';
    if (semesterId) {
      const semester = await prisma.semester.findUnique({
        where: { id: parseInt(semesterId as string) },
        select: { tahunAkademik: true, periode: true },
      });
      if (semester) {
        semesterName = `${semester.tahunAkademik} ${semester.periode}`;
      }
    }

    const stats = {
      total: pembayaranList.length,
      pending: pembayaranList.filter((p) => p.status === 'PENDING').length,
      approved: pembayaranList.filter((p) => p.status === 'APPROVED').length,
      rejected: pembayaranList.filter((p) => p.status === 'REJECTED').length,
      totalNominal: pembayaranList
        .filter((p) => p.status === 'APPROVED')
        .reduce((sum, p) => sum + p.nominal, 0),
    };

    const pdfData = {
      pembayaranList,
      filters: {
        jenisPembayaran: jenisPembayaran as string,
        status: status as string,
        search: search as string,
        semesterId: semesterId ? parseInt(semesterId as string) : undefined,
        semester: semesterName,
      },
      stats,
      generatedAt: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const html = getPembayaranReportHTMLTemplate(pdfData);
    
    const timestamp = new Date().getTime();
    const filterSuffix = jenisPembayaran && jenisPembayaran !== 'ALL' 
      ? `_${jenisPembayaran}` 
      : status && status !== 'ALL' 
      ? `_${status}` 
      : '';
    const filename = `laporan-pembayaran${filterSuffix}_${timestamp}.pdf`;

    await generatePDF(html, filename, res);
  }
);