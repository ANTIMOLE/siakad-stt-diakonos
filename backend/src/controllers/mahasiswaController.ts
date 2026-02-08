
import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { asyncHandler, AppError } from '../middlewares/errorMiddleware';
import { Prisma, Role } from '@prisma/client';
import { exportMahasiswaToExcel } from '../utils/excelExport';

/**
 * GET /api/mahasiswa
 * Get all mahasiswa with filters and pagination
 */
export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    limit = 10,
    search,
    jenisKelamin,
    prodiId,
    angkatan,
    status,
    dosenWaliId,
    sortBy = 'nim',
    sortOrder = 'asc',
    export: isExport, // ✅ ADDED: Export flag
  } = req.query;

  // Build where clause
  const where: Prisma.MahasiswaWhereInput = {};

  if (search) {
    where.OR = [
      { nim: { contains: search as string, mode: 'insensitive' } },
      { namaLengkap: { contains: search as string, mode: 'insensitive' } },
      { alamat: { contains: search as string, mode: 'insensitive' } },
      { tempatTanggalLahir: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (prodiId) {
    where.prodiId = parseInt(prodiId as string);
  }

  if (angkatan) {
    where.angkatan = parseInt(angkatan as string);
  }

  if (jenisKelamin) {
    where.jenisKelamin = jenisKelamin as 'L' | 'P';
  }

  if (status) {
    where.status = status as any;
  }

  if (dosenWaliId) {
    where.dosenWaliId = parseInt(dosenWaliId as string);
  }

  // ✅ EXPORT MODE: Get all data without pagination
  if (isExport === 'true') {
    const mahasiswa = await prisma.mahasiswa.findMany({
      where,
      orderBy: {
        [sortBy as string]: sortOrder as 'asc' | 'desc',
      },
      include: {
        prodi: {
          select: {
            id: true,
            kode: true,
            nama: true,
            jenjang: true,
          },
        },
        dosenWali: {
          select: {
            id: true,
            nidn: true,
            namaLengkap: true,
          },
        },
        user: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
    });

    // Get prodi name for filename
    let prodiName: string | undefined;
    if (prodiId) {
      const prodi = await prisma.programStudi.findUnique({
        where: { id: parseInt(prodiId as string) },
      });
      prodiName = prodi?.kode;
    }

    // Export to Excel
    return exportMahasiswaToExcel(mahasiswa, res, {
      prodi: prodiName,
      angkatan: angkatan ? parseInt(angkatan as string) : undefined,
      status: status as string,
    });
  }

  // Pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Get total count
  const total = await prisma.mahasiswa.count({ where });

  // Get data
  const mahasiswa = await prisma.mahasiswa.findMany({
    where,
    skip,
    take: limitNum,
    orderBy: {
      [sortBy as string]: sortOrder as 'asc' | 'desc',
    },
    include: {
      prodi: {
        select: {
          id: true,
          kode: true,
          nama: true,
          jenjang: true,
        },
      },
      dosenWali: {
        select: {
          id: true,
          nidn: true,
          namaLengkap: true,
        },
      },
      user: {
        select: {
          id: true,
          isActive: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: 'Data mahasiswa berhasil diambil',
    data: mahasiswa,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * GET /api/mahasiswa/:id
 * Get mahasiswa by ID with detailed information
 */
export const getById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { id: parseInt(id) },
      include: {
        prodi: {
          select: {
            id: true,
            kode: true,
            nama: true,
            jenjang: true,
          },
        },
        dosenWali: {
          select: {
            id: true,
            nidn: true,
            namaLengkap: true,
          },
        },
        user: {
          select: {
            id: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!mahasiswa) {
      throw new AppError('Mahasiswa tidak ditemukan', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Data mahasiswa berhasil diambil',
      data: mahasiswa,
    });
  }
);

/**
 * POST /api/mahasiswa
 * Create new mahasiswa
 */
export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    nim,
    namaLengkap,
    prodiId,
    angkatan,
    tempatTanggalLahir,
    jenisKelamin,
    alamat,
    dosenWaliId,
    password,
  } = req.body;

  // Check if NIM already exists
  const existingMahasiswa = await prisma.mahasiswa.findUnique({
    where: { nim },
  });

  if (existingMahasiswa) {
    throw new AppError('NIM sudah digunakan', 400);
  }

  // Hash password
  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user and mahasiswa in transaction
  const mahasiswa = await prisma.mahasiswa.create({
    data: {
      nim,
      namaLengkap,
      tempatTanggalLahir,
      jenisKelamin,
      alamat,
      angkatan,
      status: 'AKTIF',
      prodi: {
        connect: { id: prodiId },
      },
      dosenWali: dosenWaliId ? { connect: { id: dosenWaliId } } : undefined,
      user: {
        create: {
          password: hashedPassword,
          role: Role.MAHASISWA,
          isActive: true,
        },
      },
    },
    include: {
      prodi: true,
      dosenWali: true,
      user: {
        select: {
          id: true,
          role: true,
          isActive: true,
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Mahasiswa berhasil ditambahkan',
    data: mahasiswa,
  });
});

/**
 * PUT /api/mahasiswa/:id
 * Update mahasiswa
 */
export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    nim,
    namaLengkap,
    prodiId,
    angkatan,
    tempatTanggalLahir,
    jenisKelamin,
    alamat,
    dosenWaliId,
    status,
  } = req.body;

  // Check if mahasiswa exists
  const existingMahasiswa = await prisma.mahasiswa.findUnique({
    where: { id: parseInt(id) },
  });

  if (!existingMahasiswa) {
    throw new AppError('Mahasiswa tidak ditemukan', 404);
  }

  // Check if new NIM already used by other mahasiswa
  if (nim && nim !== existingMahasiswa.nim) {
    const nimExists = await prisma.mahasiswa.findUnique({
      where: { nim },
    });

    if (nimExists) {
      throw new AppError('NIM sudah digunakan', 400);
    }
  }

  // Update mahasiswa
  const mahasiswa = await prisma.mahasiswa.update({
    where: { id: parseInt(id) },
    data: {
      nim,
      namaLengkap,
      prodiId,
      angkatan,
      tempatTanggalLahir,
      jenisKelamin,
      alamat,
      dosenWaliId: dosenWaliId || null,
      status,
    },
    include: {
      prodi: true,
      dosenWali: true,
      user: {
        select: {
          id: true,
          isActive: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: 'Data mahasiswa berhasil diupdate',
    data: mahasiswa,
  });
});

/**
 * DELETE /api/mahasiswa/:id
 * Delete mahasiswa (soft delete by setting user.isActive = false)
 */
export const deleteById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Check if mahasiswa exists
    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { id: parseInt(id) },
      include: { user: true },
    });

    if (!mahasiswa) {
      throw new AppError('Mahasiswa tidak ditemukan', 404);
    }

    // Soft delete: deactivate user
    await prisma.user.update({
      where: { id: mahasiswa.userId },
      data: { isActive: false },
    });

    res.status(200).json({
      success: true,
      message: 'Mahasiswa berhasil dihapus',
    });
  }
);

/**
 * GET /api/mahasiswa/:id/krs
 * Get all KRS for specific mahasiswa
 */
export const getKRS = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Check if mahasiswa exists
  const mahasiswa = await prisma.mahasiswa.findUnique({
    where: { id: parseInt(id) },
  });

  if (!mahasiswa) {
    throw new AppError('Mahasiswa tidak ditemukan', 404);
  }

  // Get all KRS
  const krsList = await prisma.kRS.findMany({
    where: { mahasiswaId: parseInt(id) },
    include: {
      semester: true,
      detail: {
        include: {
          kelasMK: {
            include: {
              mataKuliah: true,
              dosen: {
                select: {
                  nidn: true,
                  namaLengkap: true,
                },
              },
            },
          },
        },
      },
      approvedBy: {
        select: {
          dosen: {
            select: {
              nidn: true,
              namaLengkap: true,
            },
          },
        },
      },
    },
    orderBy: {
      semester: {
        tahunAkademik: 'desc',
      },
    },
  });

  res.status(200).json({
    success: true,
    message: 'Data KRS berhasil diambil',
    data: krsList,
  });
});

/**
 * GET /api/mahasiswa/:id/khs
 * Get all KHS for specific mahasiswa
 */
export const getKHS = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Check if mahasiswa exists
  const mahasiswa = await prisma.mahasiswa.findUnique({
    where: { id: parseInt(id) },
  });

  if (!mahasiswa) {
    throw new AppError('Mahasiswa tidak ditemukan', 404);
  }

  // Get all KHS
  const khsList = await prisma.kHS.findMany({
    where: { mahasiswaId: parseInt(id) },
    include: {
      semester: true,
    },
    orderBy: {
      semester: {
        tahunAkademik: 'desc',
      },
    },
  });

  res.status(200).json({
    success: true,
    message: 'Data KHS berhasil diambil',
    data: khsList,
  });
});