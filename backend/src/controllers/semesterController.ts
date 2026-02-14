
import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { asyncHandler, AppError } from '../middlewares/errorMiddleware';

/**
 * GET /api/semester
 * Get all semesters
 */
export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    limit = 10,
    isActive,
    sortBy = 'tahunAkademik',
    sortOrder = 'desc',
  } = req.query;

  // Build where clause
  const where: any = {};

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  // Pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Get total count
  const total = await prisma.semester.count({ where });

  // Get data
  const semesters = await prisma.semester.findMany({
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
          krs: true,
          khs: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: 'Data semester berhasil diambil',
    data: semesters,
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

    const semester = await prisma.semester.findUnique({
      where: { id: parseInt(id) },
      include: {

        kelasMataKuliah: {
          include: {
            mataKuliah: {
              select: {
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
            _count: {
              select: {
                krsDetail: true,
              },
            },
          },
          orderBy: [
            { hari: 'asc' },
            { jamMulai: 'asc' },
          ],
        },

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
        // Keep counts for summary
        _count: {
          select: {
            kelasMataKuliah: true,
            krs: true,
            khs: true,
          },
        },
      },
    });

    if (!semester) {
      throw new AppError('Semester tidak ditemukan', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Data semester berhasil diambil',
      data: semester,
    });
  }
);

/**
 * POST /api/semester
 * Create new semester
 */
export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    tahunAkademik,
    periode,
    tanggalMulai,
    tanggalSelesai,
    periodeKRSMulai,
    periodeKRSSelesai,
    periodePerbaikanKRSMulai,
    periodePerbaikanKRSSelesai,
  } = req.body;

  // Check if semester already exists
  const existingSemester = await prisma.semester.findUnique({
    where: {
      tahunAkademik_periode: {
        tahunAkademik,
        periode,
      },
    },
  });

  if (existingSemester) {
    throw new AppError('Semester ini sudah ada', 400);
  }

  // Create semester
  const semester = await prisma.semester.create({
    data: {
      tahunAkademik,
      periode,
      tanggalMulai: new Date(tanggalMulai),
      tanggalSelesai: new Date(tanggalSelesai),
      periodeKRSMulai: new Date(periodeKRSMulai),
      periodeKRSSelesai: new Date(periodeKRSSelesai),
      periodePerbaikanKRSMulai: new Date(periodePerbaikanKRSMulai),
      periodePerbaikanKRSSelesai: new Date(periodePerbaikanKRSSelesai),
      isActive: false,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Semester berhasil ditambahkan',
    data: semester,
  });
});

/**
 * PUT /api/semester/:id
 * Update semester
 */
export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    tahunAkademik,
    periode,
    tanggalMulai,
    tanggalSelesai,
    periodeKRSMulai,
    periodeKRSSelesai,
    periodePerbaikanKRSMulai,
    periodePerbaikanKRSSelesai,
  } = req.body;

  // Check if semester exists
  const existingSemester = await prisma.semester.findUnique({
    where: { id: parseInt(id) },
  });

  if (!existingSemester) {
    throw new AppError('Semester tidak ditemukan', 404);
  }

  // Update semester
  const semester = await prisma.semester.update({
    where: { id: parseInt(id) },
    data: {
      tahunAkademik,
      periode,
      tanggalMulai: tanggalMulai ? new Date(tanggalMulai) : undefined,
      tanggalSelesai: tanggalSelesai ? new Date(tanggalSelesai) : undefined,
      periodeKRSMulai: periodeKRSMulai ? new Date(periodeKRSMulai) : undefined,
      periodeKRSSelesai: periodeKRSSelesai ? new Date(periodeKRSSelesai) : undefined,
      periodePerbaikanKRSMulai: periodePerbaikanKRSMulai
        ? new Date(periodePerbaikanKRSMulai)
        : undefined,
      periodePerbaikanKRSSelesai: periodePerbaikanKRSSelesai
        ? new Date(periodePerbaikanKRSSelesai)
        : undefined,
    },
  });

  res.status(200).json({
    success: true,
    message: 'Data semester berhasil diupdate',
    data: semester,
  });
});

/**
 * DELETE /api/semester/:id
 * Delete semester
 */
export const deleteById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Check if semester exists
    const semester = await prisma.semester.findUnique({
      where: { id: parseInt(id) },
    });

    if (!semester) {
      throw new AppError('Semester tidak ditemukan', 404);
    }

    // Check all related data and count them
    const [kelasCount, krsCount, khsCount] = await Promise.all([
      prisma.kelasMataKuliah.count({
        where: { semesterId: parseInt(id) },
      }),
      prisma.kRS.count({
        where: { semesterId: parseInt(id) },
      }),
      prisma.kHS.count({
        where: { semesterId: parseInt(id) },
      }),
    ]);

    // Build detailed error message
    if (kelasCount > 0 || krsCount > 0 || khsCount > 0) {
      const errors = [];
      
      if (kelasCount > 0) {
        errors.push(`${kelasCount} kelas mata kuliah`);
      }
      if (krsCount > 0) {
        errors.push(`${krsCount} KRS`);
      }
      if (khsCount > 0) {
        errors.push(`${khsCount} KHS`);
      }

      throw new AppError(
        `Tidak dapat menghapus semester. Masih ada data yang terkait: ${errors.join(', ')}`,
        400
      );
    }

    // Delete semester
    await prisma.semester.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: 'Semester berhasil dihapus',
    });
  }
);


export const activate = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const semesterId = parseInt(id);

    // Check if semester exists
    const semester = await prisma.semester.findUnique({
      where: { id: semesterId },
    });

    if (!semester) {
      throw new AppError('Semester tidak ditemukan', 404);
    }

    console.log('=== ACTIVATION START ===');
    console.log('Requested semester ID:', semesterId);
    console.log('Requested semester:', semester.tahunAkademik, semester.periode);


    await prisma.$transaction(async (tx) => {

      const deactivateResult = await tx.$executeRaw`
        UPDATE \`semester\` 
        SET \`isActive\` = false, \`updatedAt\` = NOW() 
        WHERE \`isActive\` = true
      `;
      console.log('Deactivated all active semesters:', deactivateResult);


      const activateResult = await tx.$executeRaw`
        UPDATE \`semester\` 
        SET \`isActive\` = true, \`updatedAt\` = NOW() 
        WHERE \`id\` = ${semesterId}
      `;
      console.log('Activated target semester:', activateResult);
    });


    const updatedSemester = await prisma.semester.findUnique({
      where: { id: semesterId },
    });


    const activeCount = await prisma.semester.count({
      where: { isActive: true },
    });

    console.log('Active semester count after update:', activeCount);
    console.log('Updated semester:', updatedSemester);
    console.log('=== ACTIVATION END ===');

    if (activeCount !== 1) {
      console.error('WARNING: More than one semester is active!');
    }

    res.status(200).json({
      success: true,
      message: 'Semester berhasil diaktifkan',
      data: updatedSemester,
    });
  }
);