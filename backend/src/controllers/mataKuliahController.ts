/**
 * Mata Kuliah Controller
 * Handles CRUD operations for courses
 * ✅ DUAL STATISTICS: Active semester + All time
 */

import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { asyncHandler, AppError } from '../middlewares/errorMiddleware';
import { Prisma } from '@prisma/client';

/**
 * GET /api/mata-kuliah
 * Get all mata kuliah with filters and pagination
 */
export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    limit = 10,
    search,
    semesterIdeal,
    isLintasProdi,
    isActive = 'true',
    sortBy = 'kodeMK',
    sortOrder = 'asc',
  } = req.query;

  // Build where clause
  const where: Prisma.MataKuliahWhereInput = {};

  if (search) {
    where.OR = [
      { kodeMK: { contains: search as string, mode: 'insensitive' } },
      { namaMK: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (semesterIdeal) {
    where.semesterIdeal = parseInt(semesterIdeal as string);
  }

  if (isLintasProdi !== undefined) {
    where.isLintasProdi = isLintasProdi === 'true';
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  // Pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Get total count
  const total = await prisma.mataKuliah.count({ where });

  // Get data
  const mataKuliah = await prisma.mataKuliah.findMany({
    where,
    skip,
    take: limitNum,
    orderBy: {
      [sortBy as string]: sortOrder as 'asc' | 'desc',
    },
    include: {
      _count: {
        select: {
          kelasMataKuliah: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: 'Data mata kuliah berhasil diambil',
    data: mataKuliah,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * GET /api/mata-kuliah/:id
 * Get mata kuliah by ID with detailed statistics
 * ✅ DUAL STATISTICS: Shows both active semester and all-time stats
 */
export const getById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const mataKuliah = await prisma.mataKuliah.findUnique({
      where: { id: parseInt(id) },
      include: {
        // ✅ Get ALL classes with full details
        kelasMataKuliah: {
          include: {
            dosen: {
              select: {
                id: true,
                nidn: true,
                namaLengkap: true,
              },
            },
            semester: {
              select: {
                id: true,
                tahunAkademik: true,
                periode: true,
                isActive: true,
              },
            },
            ruangan: {
              select: {
                id: true,
                nama: true,
              },
            },
            _count: {
              select: {
                krsDetail: true, // ✅ Count enrolled students per class
              },
            },
          },
          orderBy: [
            { semester: { tahunAkademik: 'desc' } },
            { semester: { periode: 'desc' } },
          ],
        },
        _count: {
          select: {
            kelasMataKuliah: true,
          },
        },
      },
    });

    if (!mataKuliah) {
      throw new AppError('Mata kuliah tidak ditemukan', 404);
    }

    // ✅ SEPARATE CALCULATIONS: Active semester vs All time

    // 1. Active semester statistics
    const activeClasses = mataKuliah.kelasMataKuliah.filter(
      (kelas) => kelas.semester.isActive
    );
    
    const activeStudents = activeClasses.reduce(
      (sum, kelas) => sum + kelas._count.krsDetail,
      0
    );

    const activeSemester = activeClasses[0]?.semester || null;

    // 2. All-time statistics
    const allClasses = mataKuliah.kelasMataKuliah;
    
    const totalStudents = allClasses.reduce(
      (sum, kelas) => sum + kelas._count.krsDetail,
      0
    );

    // ✅ Build response with DUAL statistics
    const response = {
      ...mataKuliah,
      statistics: {
        // ✅ Active Semester Stats
        active: {
          classes: activeClasses.length,
          students: activeStudents,
          semester: activeSemester,
        },
        // ✅ All-Time Stats
        total: {
          classes: mataKuliah._count.kelasMataKuliah,
          students: totalStudents,
        },
      },
      // ✅ Show only active classes in detail list
      kelasMataKuliah: activeClasses,
    };

    res.status(200).json({
      success: true,
      message: 'Data mata kuliah berhasil diambil',
      data: response,
    });
  }
);

/**
 * POST /api/mata-kuliah
 * Create new mata kuliah
 */
export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    kodeMK,
    namaMK,
    sks,
    semesterIdeal,
    isLintasProdi,
    deskripsi,
  } = req.body;

  // Check if kode MK already exists
  const existingMK = await prisma.mataKuliah.findUnique({
    where: { kodeMK },
  });

  if (existingMK) {
    throw new AppError('Kode mata kuliah sudah digunakan', 400);
  }

  // Create mata kuliah
  const mataKuliah = await prisma.mataKuliah.create({
    data: {
      kodeMK,
      namaMK,
      sks,
      semesterIdeal,
      isLintasProdi: isLintasProdi || false,
      deskripsi,
      isActive: true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Mata kuliah berhasil ditambahkan',
    data: mataKuliah,
  });
});

/**
 * PUT /api/mata-kuliah/:id
 * Update mata kuliah
 */
export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    kodeMK,
    namaMK,
    sks,
    semesterIdeal,
    isLintasProdi,
    deskripsi,
    isActive,
  } = req.body;

  // Check if mata kuliah exists
  const existingMK = await prisma.mataKuliah.findUnique({
    where: { id: parseInt(id) },
  });

  if (!existingMK) {
    throw new AppError('Mata kuliah tidak ditemukan', 404);
  }

  // Check if new kode MK already used
  if (kodeMK && kodeMK !== existingMK.kodeMK) {
    const kodeMKExists = await prisma.mataKuliah.findUnique({
      where: { kodeMK },
    });

    if (kodeMKExists) {
      throw new AppError('Kode mata kuliah sudah digunakan', 400);
    }
  }

  // Update mata kuliah
  const mataKuliah = await prisma.mataKuliah.update({
    where: { id: parseInt(id) },
    data: {
      kodeMK,
      namaMK,
      sks,
      semesterIdeal,
      isLintasProdi,
      deskripsi,
      isActive,
    },
  });

  res.status(200).json({
    success: true,
    message: 'Data mata kuliah berhasil diupdate',
    data: mataKuliah,
  });
});

/**
 * DELETE /api/mata-kuliah/:id
 * Delete mata kuliah (soft delete)
 */
export const deleteById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Check if mata kuliah exists
    const mataKuliah = await prisma.mataKuliah.findUnique({
      where: { id: parseInt(id) },
    });

    if (!mataKuliah) {
      throw new AppError('Mata kuliah tidak ditemukan', 404);
    }

    // Check if mata kuliah has active kelas
    const activeKelas = await prisma.kelasMataKuliah.count({
      where: {
        mkId: parseInt(id),
        semester: {
          isActive: true,
        },
      },
    });

    if (activeKelas > 0) {
      throw new AppError(
        'Tidak dapat menghapus mata kuliah. Masih ada kelas aktif yang menggunakan mata kuliah ini',
        400
      );
    }

    // Soft delete
    await prisma.mataKuliah.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    });

    res.status(200).json({
      success: true,
      message: 'Mata kuliah berhasil dihapus',
    });
  }
);