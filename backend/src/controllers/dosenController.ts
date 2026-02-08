
import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { asyncHandler, AppError } from '../middlewares/errorMiddleware';
import { Prisma } from '@prisma/client';
import { exportDosenToExcel } from '../utils/excelExport';

export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    limit = 10,
    search,
    prodiId,
    status,
    sortBy = 'nidn',
    sortOrder = 'asc',
    export: isExport, // ✅ ADDED: Export flag
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

  // ✅ EXPORT MODE: Get all data without pagination
  if (isExport === 'true') {
    const dosen = await prisma.dosen.findMany({
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

    // Get prodi name for filename
    let prodiName: string | undefined;
    if (prodiId) {
      const prodi = await prisma.programStudi.findUnique({
        where: { id: parseInt(prodiId as string) },
      });
      prodiName = prodi?.kode;
    }

    // Export to Excel
    return exportDosenToExcel(dosen, res, {
      prodi: prodiName,
      status: status as string,
    });
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

/**
 * POST /api/dosen
 */
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
    tempatLahir,
    tanggalLahir,
  } = req.body;

  // Check existing NIDN
  const existingDosen = await prisma.dosen.findUnique({
    where: { nidn },
  });

  if (existingDosen) {
    throw new AppError('NIDN sudah digunakan', 400);
  }

  // Check existing NUPTK
  const existingNuptk = await prisma.dosen.findUnique({
    where: { nuptk },
  });

  if (existingNuptk) {
    throw new AppError('NUPTK sudah digunakan', 400);
  }

  // Hash password
  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash(password, 10);

  const dosen = await prisma.dosen.create({
    data: {
      nidn,
      nuptk,
      namaLengkap,
      status: 'AKTIF',
      posisi: posisi || '',
      jafung: jafung || '',
      alumni: alumni || '',
      lamaMengajar: lamaMengajar || '',
      tempatLahir: tempatLahir || null,
      tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
      ...(prodiId && {
        prodi: {
          connect: {
            id: parseInt(prodiId),
          },
        },
      }),
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

/**
 * PUT /api/dosen/:id
 */
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

  const existingDosen = await prisma.dosen.findUnique({
    where: { id: parseInt(id) },
  });

  if (!existingDosen) {
    throw new AppError('Dosen tidak ditemukan', 404);
  }

  if (nidn && nidn !== existingDosen.nidn) {
    const nidnExists = await prisma.dosen.findUnique({
      where: { nidn },
    });

    if (nidnExists) {
      throw new AppError('NIDN sudah digunakan', 400);
    }
  }

  if (nuptk && nuptk !== existingDosen.nuptk) {
    const nuptkExists = await prisma.dosen.findUnique({
      where: { nuptk },
    });

    if (nuptkExists) {
      throw new AppError('NUPTK sudah digunakan', 400);
    }
  }

  const updateData: any = {
    ...(nidn && { nidn }),
    ...(nuptk && { nuptk }),
    ...(namaLengkap && { namaLengkap }),
    ...(status && { status }),
    ...(posisi !== undefined && { posisi }),
    ...(jafung !== undefined && { jafung }),
    ...(alumni !== undefined && { alumni }),
    ...(lamaMengajar !== undefined && { lamaMengajar }),
    ...(tempatLahir !== undefined && { tempatLahir }),
    ...(tanggalLahir !== undefined && {
      tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
    }),
  };

  if (prodiId !== undefined) {
    if (prodiId === null || prodiId === '') {
      updateData.prodi = { disconnect: true };
    } else {
      updateData.prodi = {
        connect: {
          id: parseInt(prodiId),
        },
      };
    }
  }

  const dosen = await prisma.dosen.update({
    where: { id: parseInt(id) },
    data: updateData,
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
 */
export const deleteById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const dosen = await prisma.dosen.findUnique({
      where: { id: parseInt(id) },
      include: { user: true },
    });

    if (!dosen) {
      throw new AppError('Dosen tidak ditemukan', 404);
    }

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