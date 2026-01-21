/**
 * Ruangan Controller
 * Handles CRUD operations for rooms
 */

import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { asyncHandler, AppError } from '../middlewares/errorMiddleware';
import { Prisma } from '@prisma/client';

/**
 * GET /api/ruangan
 * Get all ruangan with filters and pagination
 */
export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    limit = 10,
    search,
    isActive = 'true',
    sortBy = 'nama',
    sortOrder = 'asc',
  } = req.query;

  // Build where clause
  const where: Prisma.RuanganWhereInput = {};

  if (search) {
    where.nama = { contains: search as string, mode: 'insensitive' };
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  // Pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Get total count
  const total = await prisma.ruangan.count({ where });

  // Get data
  const ruangan = await prisma.ruangan.findMany({
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
    message: 'Data ruangan berhasil diambil',
    data: ruangan,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * GET /api/ruangan/:id
 * Get ruangan by ID
 */
export const getById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const ruangan = await prisma.ruangan.findUnique({
      where: { id: parseInt(id) },
      include: {
        kelasMataKuliah: {
          include: {
            mataKuliah: {
              select: {
                kodeMK: true,
                namaMK: true,
              },
            },
            dosen: {
              select: {
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
        },
        _count: {
          select: {
            kelasMataKuliah: true,
          },
        },
      },
    });

    if (!ruangan) {
      throw new AppError('Ruangan tidak ditemukan', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Data ruangan berhasil diambil',
      data: ruangan,
    });
  }
);

/**
 * POST /api/ruangan
 * Create new ruangan
 */
export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { nama, kapasitas } = req.body;

  // Check if ruangan already exists
  const existingRuangan = await prisma.ruangan.findUnique({
    where: { nama },
  });

  if (existingRuangan) {
    throw new AppError('Nama ruangan sudah digunakan', 400);
  }

  // Create ruangan
  const ruangan = await prisma.ruangan.create({
    data: {
      nama,
      kapasitas: kapasitas || 30,
      isActive: true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Ruangan berhasil ditambahkan',
    data: ruangan,
  });
});

/**
 * PUT /api/ruangan/:id
 * Update ruangan
 */
export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { nama, kapasitas, isActive } = req.body;

  // Check if ruangan exists
  const existingRuangan = await prisma.ruangan.findUnique({
    where: { id: parseInt(id) },
  });

  if (!existingRuangan) {
    throw new AppError('Ruangan tidak ditemukan', 404);
  }

  // Check if new nama already used
  if (nama && nama !== existingRuangan.nama) {
    const namaExists = await prisma.ruangan.findUnique({
      where: { nama },
    });

    if (namaExists) {
      throw new AppError('Nama ruangan sudah digunakan', 400);
    }
  }

  // Update ruangan
  const ruangan = await prisma.ruangan.update({
    where: { id: parseInt(id) },
    data: {
      nama,
      kapasitas,
      isActive,
    },
  });

  res.status(200).json({
    success: true,
    message: 'Data ruangan berhasil diupdate',
    data: ruangan,
  });
});

/**
 * DELETE /api/ruangan/:id
 * Delete ruangan (soft delete)
 */
export const deleteById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Check if ruangan exists
    const ruangan = await prisma.ruangan.findUnique({
      where: { id: parseInt(id) },
    });

    if (!ruangan) {
      throw new AppError('Ruangan tidak ditemukan', 404);
    }

    // Check if ruangan has active kelas
    const activeKelas = await prisma.kelasMataKuliah.count({
      where: {
        ruanganId: parseInt(id),
        semester: {
          isActive: true,
        },
      },
    });

    if (activeKelas > 0) {
      throw new AppError(
        'Tidak dapat menghapus ruangan. Masih ada kelas aktif yang menggunakan ruangan ini',
        400
      );
    }

    // Soft delete
    await prisma.ruangan.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    });

    res.status(200).json({
      success: true,
      message: 'Ruangan berhasil dihapus',
    });
  }
);
