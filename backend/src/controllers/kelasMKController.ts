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
    semester_id, // ✅ Accept both formats
    semesterId,
    dosenId,
    mkId,
    hari,
    sortBy = 'hari',
    sortOrder = 'asc',
  } = req.query;

  // Build where clause
  const where: Prisma.KelasMataKuliahWhereInput = {};

  if (search) {
    where.OR = [
      { mataKuliah: { kodeMK: { contains: search as string, mode: 'insensitive' } } },
      { mataKuliah: { namaMK: { contains: search as string, mode: 'insensitive' } } },
      { dosen: { namaLengkap: { contains: search as string, mode: 'insensitive' } } },
    ];
  }

  // ✅ Accept both parameter names
  const semesterIdValue = semester_id || semesterId;
  if (semesterIdValue) {
    where.semesterId = parseInt(semesterIdValue as string);
  }

  if (dosenId) {
    where.dosenId = parseInt(dosenId as string);
  }

  if (mkId) {
    where.mkId = parseInt(mkId as string);
  }

  if (hari) {
    where.hari = hari as string;
  }

  // Pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Get total count
  const total = await prisma.kelasMataKuliah.count({ where });

  // Get data
  const kelasMK = await prisma.kelasMataKuliah.findMany({
    where,
    skip,
    take: limitNum,
    orderBy: {
      [sortBy as string]: sortOrder as 'asc' | 'desc',
    },
    include: {
      mataKuliah: {
        select: {
          kodeMK: true,
          namaMK: true,
          sks: true,
        },
      },
      semester: {
        select: {
          tahunAkademik: true,
          periode: true,
          isActive: true,
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
          kapasitas: true,
        },
      },
      _count: {
        select: {
          krsDetail: true,
          nilai: true,
        },
      },
    },
  });

  // ✅ FIX: Add isNilaiFinalized check for each kelas
  const kelasWithFinalizedStatus = await Promise.all(
    kelasMK.map(async (kelas) => {
      // Count total nilai for this kelas
      const nilaiCount = await prisma.nilai.count({
        where: { kelasMKId: kelas.id },
      });

      // Count finalized nilai
      const finalizedCount = await prisma.nilai.count({
        where: {
          kelasMKId: kelas.id,
          isFinalized: true,
        },
      });

      // All nilai must be finalized for kelas to be finalized
      const isNilaiFinalized = nilaiCount > 0 && nilaiCount === finalizedCount;

      return {
        ...kelas,
        isNilaiFinalized, // ✅ ADD THIS FIELD
      };
    })
  );

  res.status(200).json({
    success: true,
    message: 'Data kelas mata kuliah berhasil diambil',
    data: kelasWithFinalizedStatus, // ✅ SEND MODIFIED DATA
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

    const kelasMK = await prisma.kelasMataKuliah.findUnique({
      where: { id: parseInt(id) },
      include: {
        mataKuliah: true,
        semester: true,
        dosen: true,
        ruangan: true,
        krsDetail: {
          include: {
            krs: {
              include: {
                mahasiswa: {
                  select: {
                    nim: true,
                    namaLengkap: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            krsDetail: true,
            nilai: true,
          },
        },
      },
    });

    if (!kelasMK) {
      throw new AppError('Kelas mata kuliah tidak ditemukan', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Data kelas mata kuliah berhasil diambil',
      data: kelasMK,
    });
  }
);


const checkScheduleConflict = async (
  hari: string,
  jamMulai: string,
  jamSelesai: string,
  ruanganId: number,
  dosenId: number,
  semesterId: number,
  excludeId?: number
): Promise<string | null> => {

  const ruanganConflict = await prisma.kelasMataKuliah.findFirst({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      semesterId,
      ruanganId,
      hari,
      OR: [
        {
          AND: [
            { jamMulai: { lte: jamMulai } },
            { jamSelesai: { gt: jamMulai } },
          ],
        },
        {
          AND: [
            { jamMulai: { lt: jamSelesai } },
            { jamSelesai: { gte: jamSelesai } },
          ],
        },
      ],
    },
    include: {
      mataKuliah: true,
    },
  });

  if (ruanganConflict) {
    return `Ruangan sudah digunakan pada waktu yang sama (${ruanganConflict.mataKuliah.namaMK})`;
  }

  // Check dosen conflict
  const dosenConflict = await prisma.kelasMataKuliah.findFirst({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      semesterId,
      dosenId,
      hari,
      OR: [
        {
          AND: [
            { jamMulai: { lte: jamMulai } },
            { jamSelesai: { gt: jamMulai } },
          ],
        },
        {
          AND: [
            { jamMulai: { lt: jamSelesai } },
            { jamSelesai: { gte: jamSelesai } },
          ],
        },
      ],
    },
    include: {
      mataKuliah: true,
    },
  });

  if (dosenConflict) {
    return `Dosen sudah mengajar kelas lain pada waktu yang sama (${dosenConflict.mataKuliah.namaMK})`;
  }

  return null;
};

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    mkId,
    semesterId,
    dosenId,
    hari,
    jamMulai,
    jamSelesai,
    ruanganId,
    kuotaMax,
    keterangan,
  } = req.body;

  // Check for schedule conflicts
  const conflict = await checkScheduleConflict(
    hari,
    jamMulai,
    jamSelesai,
    ruanganId,
    dosenId,
    semesterId
  );

  if (conflict) {
    throw new AppError(conflict, 400);
  }

  // Create kelas
  const kelasMK = await prisma.kelasMataKuliah.create({
    data: {
      mkId,
      semesterId,
      dosenId,
      hari,
      jamMulai,
      jamSelesai,
      ruanganId,
      kuotaMax: kuotaMax || 30,
      keterangan,
    },
    include: {
      mataKuliah: true,
      semester: true,
      dosen: true,
      ruangan: true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Kelas mata kuliah berhasil ditambahkan',
    data: kelasMK,
  });
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    mkId,
    semesterId,
    dosenId,
    hari,
    jamMulai,
    jamSelesai,
    ruanganId,
    kuotaMax,
    keterangan,
  } = req.body;


  const existingKelas = await prisma.kelasMataKuliah.findUnique({
    where: { id: parseInt(id) },
  });

  if (!existingKelas) {
    throw new AppError('Kelas mata kuliah tidak ditemukan', 404);
  }


  if (hari || jamMulai || jamSelesai || ruanganId || dosenId) {
    const conflict = await checkScheduleConflict(
      hari || existingKelas.hari,
      jamMulai || existingKelas.jamMulai,
      jamSelesai || existingKelas.jamSelesai,
      ruanganId || existingKelas.ruanganId,
      dosenId || existingKelas.dosenId,
      semesterId || existingKelas.semesterId,
      parseInt(id)
    );

    if (conflict) {
      throw new AppError(conflict, 400);
    }
  }


  const kelasMK = await prisma.kelasMataKuliah.update({
    where: { id: parseInt(id) },
    data: {
      mkId,
      semesterId,
      dosenId,
      hari,
      jamMulai,
      jamSelesai,
      ruanganId,
      kuotaMax,
      keterangan,
    },
    include: {
      mataKuliah: true,
      semester: true,
      dosen: true,
      ruangan: true,
    },
  });

  res.status(200).json({
    success: true,
    message: 'Data kelas mata kuliah berhasil diupdate',
    data: kelasMK,
  });
});

export const deleteById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Check if kelas exists
    const kelasMK = await prisma.kelasMataKuliah.findUnique({
      where: { id: parseInt(id) },
    });

    if (!kelasMK) {
      throw new AppError('Kelas mata kuliah tidak ditemukan', 404);
    }

    // Check if kelas has students
    const studentCount = await prisma.kRSDetail.count({
      where: { kelasMKId: parseInt(id) },
    });

    if (studentCount > 0) {
      throw new AppError(
        `Tidak dapat menghapus kelas. Masih ada ${studentCount} mahasiswa yang terdaftar`,
        400
      );
    }

    // Delete kelas
    await prisma.kelasMataKuliah.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: 'Kelas mata kuliah berhasil dihapus',
    });
  }
);