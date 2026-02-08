

import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { asyncHandler, AppError } from '../middlewares/errorMiddleware';
import { Prisma } from '@prisma/client';
import { exportMataKuliahToExcel } from '../utils/excelExport';

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
    export: isExport, // ✅ ADDED: Export flag
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

  // ✅ EXPORT MODE: Get all data without pagination
  if (isExport === 'true') {
    const mataKuliah = await prisma.mataKuliah.findMany({
      where,
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

    // Export to Excel
    return exportMataKuliahToExcel(mataKuliah, res, {
      semesterIdeal: semesterIdeal ? parseInt(semesterIdeal as string) : undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
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
 */
export const getById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const mataKuliah = await prisma.mataKuliah.findUnique({
      where: { id: parseInt(id) },
      include: {
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
                krsDetail: true,
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

    const activeClasses = mataKuliah.kelasMataKuliah.filter(
      (kelas) => kelas.semester.isActive
    );

    const activeStudents = activeClasses.reduce(
      (sum, kelas) => sum + kelas._count.krsDetail,
      0
    );

    const activeSemester = activeClasses[0]?.semester || null;

    const allClasses = mataKuliah.kelasMataKuliah;

    const totalStudents = allClasses.reduce(
      (sum, kelas) => sum + kelas._count.krsDetail,
      0
    );

    const response = {
      ...mataKuliah,
      statistics: {
        active: {
          classes: activeClasses.length,
          students: activeStudents,
          semester: activeSemester,
        },
        total: {
          classes: mataKuliah._count.kelasMataKuliah,
          students: totalStudents,
        },
      },
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
  const { kodeMK, namaMK, sks, semesterIdeal, isLintasProdi, deskripsi } =
    req.body;

  const existingMK = await prisma.mataKuliah.findUnique({
    where: { kodeMK },
  });

  if (existingMK) {
    throw new AppError('Kode mata kuliah sudah digunakan', 400);
  }

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

  const existingMK = await prisma.mataKuliah.findUnique({
    where: { id: parseInt(id) },
  });

  if (!existingMK) {
    throw new AppError('Mata kuliah tidak ditemukan', 404);
  }

  if (kodeMK && kodeMK !== existingMK.kodeMK) {
    const kodeMKExists = await prisma.mataKuliah.findUnique({
      where: { kodeMK },
    });

    if (kodeMKExists) {
      throw new AppError('Kode mata kuliah sudah digunakan', 400);
    }
  }

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

    const mataKuliah = await prisma.mataKuliah.findUnique({
      where: { id: parseInt(id) },
    });

    if (!mataKuliah) {
      throw new AppError('Mata kuliah tidak ditemukan', 404);
    }

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