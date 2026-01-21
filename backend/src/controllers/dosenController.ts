

import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { asyncHandler, AppError } from '../middlewares/errorMiddleware';
import { Prisma } from '@prisma/client';


export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    limit = 10,
    search,
    prodiId,
    status,
    sortBy = 'nidn',
    sortOrder = 'asc',
  } = req.query;


  const where: Prisma.DosenWhereInput = {};

  if (search) {
    where.OR = [
      { nidn: { contains: search as string, mode: 'insensitive' } },
      { namaLengkap: { contains: search as string, mode: 'insensitive' } },
      { nuptk: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (prodiId) {
    where.prodiId = parseInt(prodiId as string);
  }

  if (status) {
    where.status = status as any;
  }


  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const total = await prisma.dosen.count({ where });


  const dosen = await prisma.dosen.findMany({
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
      user: {
        select: {
          id: true,
          isActive: true,
        },
      },
      _count: {
        select: {
          mahasiswaBimbingan: true,
          kelasMataKuliah: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: 'Data dosen berhasil diambil',
    data: dosen,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});


export const getById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const dosen = await prisma.dosen.findUnique({
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
        user: {
          select: {
            id: true,
            isActive: true,
            createdAt: true,
          },
        },
        mahasiswaBimbingan: {
          select: {
            id: true,
            nim: true,
            namaLengkap: true,
            angkatan: true,
            status: true,
          },
          where: {
            status: {
              in: ['AKTIF', 'CUTI'],
            },
          },
        },
        kelasMataKuliah: {
          select: {
            id: true,
            hari: true,
            jamMulai: true,
            jamSelesai: true,
            mataKuliah: {
              select: {
                kodeMK: true,
                namaMK: true,
                sks: true,
              },
            },
            ruangan: {
              select: {
                nama: true,
              },
            },
          },
        },
        _count: {
          select: {
            mahasiswaBimbingan: true,
            kelasMataKuliah: true,
          },
        },
      },
    });

    if (!dosen) {
      throw new AppError('Dosen tidak ditemukan', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Data dosen berhasil diambil',
      data: dosen,
    });
  }
);

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    nidn,
    nuptk,
    namaLengkap,
    prodiId,
    password,
    posisi,
    jafung,
    alumni,
    lamaMengajar,
  } = req.body;


  const existingDosen = await prisma.dosen.findUnique({
    where: { nidn },
  });

  if (existingDosen) {
    throw new AppError('NIDN sudah digunakan', 400);
  }


  const existingNuptk = await prisma.dosen.findUnique({
    where: { nuptk },
  });

  if (existingNuptk) {
    throw new AppError('NUPTK sudah digunakan', 400);
  }


  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash(password, 10);


  const dosen = await prisma.dosen.create({
    data: {
      nidn,
      nuptk,
      namaLengkap,
      prodiId: prodiId || null,
      status: 'AKTIF',
      posisi: posisi || '',
      jafung: jafung || '',
      alumni: alumni || '',
      lamaMengajar: lamaMengajar || '',
      user: {
        create: {
          password: hashedPassword,
          role: 'DOSEN',
          isActive: true,
        },
      },
    },
    include: {
      prodi: true,
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
    message: 'Dosen berhasil ditambahkan',
    data: dosen,
  });
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    nidn,
    nuptk,
    namaLengkap,
    prodiId,
    status,
    posisi,
    jafung,
    alumni,
    lamaMengajar,
    tempatLahir,
    tanggalLahir,
  } = req.body;

  // Check if dosen exists
  const existingDosen = await prisma.dosen.findUnique({
    where: { id: parseInt(id) },
  });

  if (!existingDosen) {
    throw new AppError('Dosen tidak ditemukan', 404);
  }

  // Check if new NIDN already used by other dosen
  if (nidn && nidn !== existingDosen.nidn) {
    const nidnExists = await prisma.dosen.findUnique({
      where: { nidn },
    });

    if (nidnExists) {
      throw new AppError('NIDN sudah digunakan', 400);
    }
  }

  // Check if new NUPTK already used by other dosen
  if (nuptk && nuptk !== existingDosen.nuptk) {
    const nuptkExists = await prisma.dosen.findUnique({
      where: { nuptk },
    });

    if (nuptkExists) {
      throw new AppError('NUPTK sudah digunakan', 400);
    }
  }

  // Update dosen
  const dosen = await prisma.dosen.update({
    where: { id: parseInt(id) },
    data: {
      nidn,
      nuptk,
      namaLengkap,
      prodiId: prodiId || null,
      status,
      posisi,
      jafung,
      alumni,
      lamaMengajar,
      tempatLahir,
      tanggalLahir,
    },
    include: {
      prodi: true,
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
    message: 'Data dosen berhasil diupdate',
    data: dosen,
  });
});

/**
 * DELETE /api/dosen/:id
 * Delete dosen (soft delete by setting user.isActive = false)
 */
export const deleteById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Check if dosen exists
    const dosen = await prisma.dosen.findUnique({
      where: { id: parseInt(id) },
      include: { user: true },
    });

    if (!dosen) {
      throw new AppError('Dosen tidak ditemukan', 404);
    }

    // Check if dosen has active bimbingan
    const activeBimbingan = await prisma.mahasiswa.count({
      where: {
        dosenWaliId: parseInt(id),
        status: {
          in: ['AKTIF', 'CUTI'],
        },
      },
    });

    if (activeBimbingan > 0) {
      throw new AppError(
        `Tidak dapat menghapus dosen. Masih ada ${activeBimbingan} mahasiswa bimbingan yang aktif`,
        400
      );
    }

    // Soft delete: deactivate user
    await prisma.user.update({
      where: { id: dosen.userId },
      data: { isActive: false },
    });

    res.status(200).json({
      success: true,
      message: 'Dosen berhasil dihapus',
    });
  }
);