import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { asyncHandler, AppError } from '../middlewares/errorMiddleware';
import { Prisma } from '@prisma/client';
import { exportKelasMKToExcel } from '../utils/excelExport';
import {  generatePDF, getJadwalDosenHTMLTemplate, getJadwalMahasiswaHTMLTemplate } from '../utils/pdfGenerator';

export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    limit = 10,
    search,
    semester_id, 
    semesterId,
    dosenId,
    mkId,
    hari,
    sortBy = 'hari',
    sortOrder = 'asc',
    export : isExport,
  } = req.query;

  // Build where clause
  const where: Prisma.KelasMataKuliahWhereInput = {};


  if (search) {
    where.OR = [
      { mataKuliah: { kodeMK: { contains: search as string } } },
      { mataKuliah: { namaMK: { contains: search as string } } },
      { dosen: { namaLengkap: { contains: search as string } } },
    ];
  }

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

  if(isExport === 'true'){
    const KelasMK = await prisma.kelasMataKuliah.findMany({
      where,
      orderBy:{
        [sortBy as string]: sortOrder as 'asc' | 'desc',
      },
      include:{
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
    })

    let semesterLabel: string | undefined;
    if (semesterId) {
      const s = await prisma.semester.findUnique({
        where: { id: Number(semesterId) },
        select: { tahunAkademik: true, periode: true },
      });
      semesterLabel = s ? `${s.tahunAkademik}-${s.periode}` : undefined;
    }

    return exportKelasMKToExcel(KelasMK, res, {
      semester: semesterLabel,
      hari: hari as string,
    });
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
        isNilaiFinalized,
      };
    })
  );

  res.status(200).json({
    success: true,
    message: 'Data kelas mata kuliah berhasil diambil',
    data: kelasWithFinalizedStatus,
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


export const exportJadwalDosenPDF = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { dosenId, semesterId } = req.query;
  
  const dosen = await prisma.dosen.findUnique({ where: { id: Number(dosenId) }});
  const semester = await prisma.semester.findUnique({ where: { id: Number(semesterId) }});
  const jadwal = await prisma.kelasMataKuliah.findMany({
    where: { dosenId: Number(dosenId), semesterId: Number(semesterId) },
    include: { mataKuliah: true, ruangan: true, _count: { select: { krsDetail: true } } }
  });

  const html = getJadwalDosenHTMLTemplate({
    dosen,
    jadwal,
    semester,
    generatedAt: new Date().toLocaleString('id-ID')
  });

  await generatePDF(html, `Jadwal-Dosen-${dosen?.nidn}.pdf`, res);
});

/**
 * Export Jadwal Mahasiswa PDF
 * GET /api/kelas-mk/mahasiswa/export?mahasiswaId=1&semesterId=1
 */
export const exportJadwalMahasiswaPDF = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mahasiswaId, semesterId } = req.query;

  if (!mahasiswaId || !semesterId) {
    throw new AppError('mahasiswaId dan semesterId required', 400);
  }

  // Get mahasiswa
  const mahasiswa = await prisma.mahasiswa.findUnique({ 
    where: { id: Number(mahasiswaId) },
    include: { prodi: true }
  });

  if (!mahasiswa) {
    throw new AppError('Mahasiswa tidak ditemukan', 404);
  }

  // Get semester
  const semester = await prisma.semester.findUnique({ 
    where: { id: Number(semesterId) }
  });

  if (!semester) {
    throw new AppError('Semester tidak ditemukan', 404);
  }


  const krs = await prisma.kRS.findFirst({
    where: {
      mahasiswaId: Number(mahasiswaId),
      semesterId: Number(semesterId),
      status: 'APPROVED', // Only approved KRS
    },
    include: {
      detail: {
        include: {
          kelasMK: {
            include: {
              mataKuliah: true,
              dosen: true,
              ruangan: true,
            },
          },
        },
      },
    },
  });

  if (!krs || !krs.detail || krs.detail.length === 0) {
    throw new AppError('KRS tidak ditemukan atau belum disetujui', 404);
  }


  const jadwal = krs.detail.map(d => d.kelasMK).filter(Boolean);

  const html = getJadwalMahasiswaHTMLTemplate({
    mahasiswa,
    jadwal,
    semester,
    generatedAt: new Date().toLocaleString('id-ID', {
      dateStyle: 'full',
      timeStyle: 'short',
    }),
  });

  await generatePDF(html, `Jadwal-Mahasiswa-${mahasiswa.nim}.pdf`, res);
});
