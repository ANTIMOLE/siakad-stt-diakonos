import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { asyncHandler, AppError } from '../middlewares/errorMiddleware';
import { Prisma } from '@prisma/client';
import { exportPaketKRSToExcel } from '../utils/excelExport';

/**
 * GET /api/paket-krs
 * Get all paket KRS with filters + EXCEL EXPORT
 */
export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    limit = 10,
    search,
    prodiId,
    angkatan,
    semesterId,
    semesterPaket,
    sortBy = 'namaPaket',
    sortOrder = 'asc',
    export: isExport,
  } = req.query;

  const where: Prisma.PaketKRSWhereInput = {};

  if (search) {
    where.namaPaket = { contains: search as string, mode: 'insensitive' };
  }

  if (prodiId) {
    where.prodiId = parseInt(prodiId as string);
  }

  if (angkatan) {
    where.angkatan = parseInt(angkatan as string);
  }

  if (semesterId) {
    where.semesterId = parseInt(semesterId as string);
  }

  if (semesterPaket) {
    where.semesterPaket = parseInt(semesterPaket as string);
  }


  if (isExport === 'true') {
    const paketList = await prisma.paketKRS.findMany({
      where,
      orderBy: {
        [sortBy as string]: sortOrder as 'asc' | 'desc',
      },
      include: {
        prodi: {
          select: {
            nama: true,
          },
        },
        semester: {
          select: {
            tahunAkademik: true,
            periode: true,
          },
        },
        _count: {
          select: {
            detail: true,
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

    // Get semester label for filename
    let semesterLabel: string | undefined;
    if (semesterId) {
      const sem = await prisma.semester.findUnique({
        where: { id: parseInt(semesterId as string) },
        select: { tahunAkademik: true, periode: true },
      });
      semesterLabel = sem ? `${sem.tahunAkademik}-${sem.periode}` : undefined;
    }

    return exportPaketKRSToExcel(paketList, res, {
      angkatan: angkatan ? parseInt(angkatan as string) : undefined,
      prodi: prodiName,
      semester: semesterLabel,
    });
  }

  // Pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Get total count
  const total = await prisma.paketKRS.count({ where });

  // Get data
  const paketList = await prisma.paketKRS.findMany({
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
        },
      },
      semester: {
        select: {
          id: true,
          tahunAkademik: true,
          periode: true,
        },
      },
      _count: {
        select: {
          detail: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: 'Data paket KRS berhasil diambil',
    data: paketList,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * GET /api/paket-krs/:id
 * Get paket KRS by ID with detail
 */
export const getById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const paket = await prisma.paketKRS.findUnique({
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
        semester: {
          select: {
            id: true,
            tahunAkademik: true,
            periode: true,
            isActive: true,
          },
        },
        detail: {
          include: {
            kelasMK: {
              include: {
                mataKuliah: {
                  select: {
                    id: true,
                    kodeMK: true,
                    namaMK: true,
                    sks: true,
                  },
                },
                dosen: {
                  select: {
                    nidn: true,
                    namaLengkap: true,
                  },
                },
                ruangan: {
                  select: {
                    nama: true,
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
          },
        },
        createdBy: {
          select: {
            id: true,
            role: true,
            dosen: {
              select: {
                namaLengkap: true,
              },
            },
          },
        },
      },
    });

    if (!paket) {
      throw new AppError('Paket KRS tidak ditemukan', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Data paket KRS berhasil diambil',
      data: paket,
    });
  }
);

/**
 * POST /api/paket-krs
 * Create new paket KRS with mata kuliah details
 */
export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('User tidak ditemukan', 401);
  }

  const {
    namaPaket,
    prodiId,
    angkatan,
    semesterPaket,
    semesterId,
    kelasMKIds = [],
  } = req.body;

  // Validate semesterId
  if (!semesterId) {
    throw new AppError('Semester akademik harus dipilih', 400);
  }

  // Check if semester exists
  const semester = await prisma.semester.findUnique({
    where: { id: semesterId },
  });

  if (!semester) {
    throw new AppError('Semester tidak ditemukan', 404);
  }

  // ✅ Validate all kelasMK exist and calculate totalSKS
  let totalSKS = 0;
  if (kelasMKIds.length > 0) {
    const kelasList = await prisma.kelasMataKuliah.findMany({
      where: {
        id: { in: kelasMKIds },
        semesterId: semesterId,
      },
      include: {
        mataKuliah: {
          select: {
            sks: true,
            namaMK: true,
          },
        },
      },
    });

    if (kelasList.length !== kelasMKIds.length) {
      throw new AppError(
        'Beberapa kelas tidak ditemukan atau bukan dari semester yang dipilih',
        400
      );
    }

    totalSKS = kelasList.reduce((sum, k) => sum + k.mataKuliah.sks, 0);

    if (totalSKS > 24) {
      throw new AppError('Total SKS melebihi batas maksimal (24 SKS)', 400);
    }
  }

  // ✅ Create paket with details in transaction
  const paket = await prisma.$transaction(async (tx) => {
    const newPaket = await tx.paketKRS.create({
      data: {
        namaPaket,
        angkatan,
        semesterPaket,
        totalSKS,
        prodi: {
          connect: { id: prodiId },
        },
        semester: {
          connect: { id: semesterId },
        },
        createdBy: {
          connect: { id: req.user!.id },
        },
        detail: {
          create: kelasMKIds.map((kelasMKId: number) => ({
            kelasMKId,
          })),
        },
      },
      include: {
        prodi: true,
        semester: true,
        detail: {
          include: {
            kelasMK: {
              include: {
                mataKuliah: {
                  select: {
                    id: true,
                    kodeMK: true,
                    namaMK: true,
                    sks: true,
                  },
                },
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
        _count: {
          select: {
            detail: true,
          },
        },
      },
    });

    return newPaket;
  });

  res.status(201).json({
    success: true,
    message: `Paket KRS berhasil ditambahkan dengan ${paket.detail.length} mata kuliah`,
    data: paket,
  });
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    namaPaket,
    prodiId,
    angkatan,
    semesterPaket,
    semesterId,
    kelasMKIds,
  } = req.body;

  // Check if paket exists
  const existingPaket = await prisma.paketKRS.findUnique({
    where: { id: parseInt(id) },
  });

  if (!existingPaket) {
    throw new AppError('Paket KRS tidak ditemukan', 404);
  }

  // Validate semesterId if provided
  if (semesterId) {
    const semester = await prisma.semester.findUnique({
      where: { id: semesterId },
    });
    if (!semester) {
      throw new AppError('Semester tidak ditemukan', 404);
    }
  }

  let totalSKS = existingPaket.totalSKS;

  if (kelasMKIds && Array.isArray(kelasMKIds)) {
    // Validate all kelasMK exist and calculate totalSKS
    const kelasList = await prisma.kelasMataKuliah.findMany({
      where: {
        id: { in: kelasMKIds },
        semesterId: semesterId || existingPaket.semesterId,
      },
      include: {
        mataKuliah: {
          select: { sks: true },
        },
      },
    });

    if (kelasList.length !== kelasMKIds.length) {
      throw new AppError(
        'Beberapa kelas tidak ditemukan atau bukan dari semester yang dipilih',
        400
      );
    }

    totalSKS = kelasList.reduce((sum, k) => sum + (k.mataKuliah.sks || 0), 0);

    if (totalSKS > 24) {
      throw new AppError('Total SKS melebihi batas maksimal (24 SKS)', 400);
    }
  }

  const paket = await prisma.$transaction(async (tx) => {
    // 1. Delete all existing details jika kelasMKIds dikirim
    if (kelasMKIds && Array.isArray(kelasMKIds)) {
      await tx.paketKRSDetail.deleteMany({
        where: { paketKRSId: parseInt(id) },
      });

      // 2. Create new details
      await tx.paketKRSDetail.createMany({
        data: kelasMKIds.map((kelasMKId: number) => ({
          paketKRSId: parseInt(id),
          kelasMKId,
        })),
      });
    }

    // 3. Update paket
    return await tx.paketKRS.update({
      where: { id: parseInt(id) },
      data: {
        namaPaket,
        angkatan,
        semesterPaket,
        totalSKS,
        ...(prodiId && {
          prodi: { connect: { id: prodiId } },
        }),
        ...(semesterId && {
          semester: { connect: { id: semesterId } },
        }),
      },
      include: {
        prodi: true,
        semester: true,
        detail: {
          include: {
            kelasMK: {
              include: {
                mataKuliah: true,
                dosen: true,
              },
            },
          },
        },
      },
    });
  });

  res.status(200).json({
    success: true,
    message: 'Paket KRS berhasil diupdate',
    data: paket,
  });
});

/**
 * DELETE /api/paket-krs/:id
 * Delete paket KRS
 */
export const deleteById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Check if paket exists
    const paket = await prisma.paketKRS.findUnique({
      where: { id: parseInt(id) },
    });

    if (!paket) {
      throw new AppError('Paket KRS tidak ditemukan', 404);
    }

    // Check if paket is being used by any KRS
    const krsUsingPaket = await prisma.kRS.count({
      where: { paketKRSId: parseInt(id) },
    });

    if (krsUsingPaket > 0) {
      throw new AppError(
        `Tidak dapat menghapus paket. Masih ada ${krsUsingPaket} KRS yang menggunakan paket ini`,
        400
      );
    }

    // Delete paket (detail will cascade delete)
    await prisma.paketKRS.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: 'Paket KRS berhasil dihapus',
    });
  }
);

/**
 * POST /api/paket-krs/:id/mata-kuliah
 * Add mata kuliah to paket
 */
export const addMataKuliah = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { kelasMKId } = req.body;

    if (!kelasMKId) {
      throw new AppError('kelasMKId harus diisi', 400);
    }

    // Check if paket exists
    const paket = await prisma.paketKRS.findUnique({
      where: { id: parseInt(id) },
      include: {
        semester: true,
      },
    });

    if (!paket) {
      throw new AppError('Paket KRS tidak ditemukan', 404);
    }

    // Check if kelas exists
    const kelasMK = await prisma.kelasMataKuliah.findUnique({
      where: { id: parseInt(kelasMKId) },
      include: {
        mataKuliah: true,
      },
    });

    if (!kelasMK) {
      throw new AppError('Kelas mata kuliah tidak ditemukan', 404);
    }

    // Validate same semester
    if (kelasMK.semesterId !== paket.semesterId) {
      throw new AppError(
        `Kelas harus dari semester yang sama. Paket: ${paket.semester.tahunAkademik}, Kelas: semester ${kelasMK.semesterId}`,
        400
      );
    }

    // Check if already added
    const existing = await prisma.paketKRSDetail.findFirst({
      where: {
        paketKRSId: parseInt(id),
        kelasMKId: parseInt(kelasMKId),
      },
    });

    if (existing) {
      throw new AppError('Mata kuliah sudah ada dalam paket', 400);
    }

    // Add to paket and update totalSKS
    const detail = await prisma.$transaction(async (tx) => {
      // Create detail
      const newDetail = await tx.paketKRSDetail.create({
        data: {
          paketKRSId: parseInt(id),
          kelasMKId: parseInt(kelasMKId),
        },
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
      });

      // Update totalSKS
      await tx.paketKRS.update({
        where: { id: parseInt(id) },
        data: {
          totalSKS: paket.totalSKS + kelasMK.mataKuliah.sks,
        },
      });

      return newDetail;
    });

    res.status(201).json({
      success: true,
      message: 'Mata kuliah berhasil ditambahkan ke paket',
      data: detail,
    });
  }
);

/**
 * DELETE /api/paket-krs/:id/mata-kuliah/:mkId
 * Remove mata kuliah from paket
 */
export const removeMataKuliah = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id, mkId } = req.params;

    // Find detail
    const detail = await prisma.paketKRSDetail.findFirst({
      where: {
        paketKRSId: parseInt(id),
        kelasMKId: parseInt(mkId),
      },
      include: {
        kelasMK: {
          include: {
            mataKuliah: {
              select: {
                sks: true,
              },
            },
          },
        },
        paketKRS: {
          select: {
            totalSKS: true,
          },
        },
      },
    });

    if (!detail) {
      throw new AppError('Mata kuliah tidak ditemukan dalam paket', 404);
    }

    // Delete detail and update totalSKS
    await prisma.$transaction([
      prisma.paketKRSDetail.delete({
        where: { id: detail.id },
      }),
      prisma.paketKRS.update({
        where: { id: parseInt(id) },
        data: {
          totalSKS: detail.paketKRS.totalSKS - detail.kelasMK.mataKuliah.sks,
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Mata kuliah berhasil dihapus dari paket',
    });
  }
);