/**
 * Presensi Controller
 * Handle HTTP requests for attendance management
 */

import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { AppError, asyncHandler } from '../middlewares/errorMiddleware';
import prisma from '../config/database';
import * as presensiService from '../services/presensiService';

/**
 * GET /api/presensi
 * Get all presensi for a specific class
 */
export const getAllByKelas = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { kelasMKId } = req.query;

    if (!kelasMKId) {
      throw new AppError('kelasMKId parameter wajib diisi', 400);
    }

    const presensiList = await prisma.presensi.findMany({
      where: {
        kelasMKId: parseInt(kelasMKId as string),
      },
      include: {
        kelasMK: {
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
                namaLengkap: true,
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
      orderBy: {
        pertemuan: 'asc',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Data presensi berhasil diambil',
      data: presensiList,
    });
  }
);

/**
 * GET /api/presensi/:id
 * Get single presensi with all details
 */
export const getById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const presensi = await prisma.presensi.findUnique({
      where: { id: parseInt(id) },
      include: {
        kelasMK: {
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
                namaLengkap: true,
              },
            },
          },
        },
        detail: {
          include: {
            mahasiswa: {
              select: {
                nim: true,
                namaLengkap: true,
              },
            },
          },
          orderBy: {
            mahasiswa: {
              nim: 'asc',
            },
          },
        },
      },
    });

    if (!presensi) {
      throw new AppError('Presensi tidak ditemukan', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Data presensi berhasil diambil',
      data: presensi,
    });
  }
);

/**
 * POST /api/presensi
 * Create new presensi session
 * Role: DOSEN, ADMIN
 */
export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('User tidak ditemukan', 401);
  }

  const { kelasMKId, pertemuan, tanggal, materi, catatan } = req.body;

  // Validate required fields
  if (!kelasMKId || !pertemuan) {
    throw new AppError('kelasMKId dan pertemuan wajib diisi', 400);
  }

  // If user is DOSEN, verify they teach this class
  if (req.user.role === 'DOSEN') {
    const dosen = await prisma.dosen.findUnique({
      where: { userId: req.user.id },
    });

    if (!dosen) {
      throw new AppError('Data dosen tidak ditemukan', 404);
    }

    const kelasMK = await prisma.kelasMataKuliah.findFirst({
      where: {
        id: kelasMKId,
        dosenId: dosen.id,
      },
    });

    if (!kelasMK) {
      throw new AppError(
        'Anda tidak memiliki akses untuk kelas ini',
        403
      );
    }
  }

  const presensi = await presensiService.createPresensi(
    kelasMKId,
    pertemuan,
    tanggal ? new Date(tanggal) : new Date(),
    materi,
    catatan
  );

  res.status(201).json({
    success: true,
    message: `Presensi pertemuan ${pertemuan} berhasil dibuat dengan ${presensi.detail.length} mahasiswa`,
    data: presensi,
  });
});

/**
 * PUT /api/presensi/:id
 * Update attendance for students
 * Role: DOSEN, ADMIN
 */
export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('User tidak ditemukan', 401);
  }

  const { id } = req.params;
  const { updates, materi, catatan } = req.body;

  if (!updates || !Array.isArray(updates)) {
    throw new AppError('Updates array wajib diisi', 400);
  }

  // Get presensi to check access
  const presensi = await prisma.presensi.findUnique({
    where: { id: parseInt(id) },
    include: {
      kelasMK: true,
    },
  });

  if (!presensi) {
    throw new AppError('Presensi tidak ditemukan', 404);
  }

  // If user is DOSEN, verify they teach this class
  if (req.user.role === 'DOSEN') {
    const dosen = await prisma.dosen.findUnique({
      where: { userId: req.user.id },
    });

    if (!dosen || presensi.kelasMK.dosenId !== dosen.id) {
      throw new AppError(
        'Anda tidak memiliki akses untuk kelas ini',
        403
      );
    }
  }

  // Update materi/catatan if provided
  if (materi !== undefined || catatan !== undefined) {
    await prisma.presensi.update({
      where: { id: parseInt(id) },
      data: {
        ...(materi !== undefined && { materi }),
        ...(catatan !== undefined && { catatan }),
      },
    });
  }

  // Update attendance details
  const updated = await presensiService.updatePresensiDetail(
    parseInt(id),
    updates
  );

  res.status(200).json({
    success: true,
    message: 'Presensi berhasil diupdate',
    data: updated,
  });
});

/**
 * DELETE /api/presensi/:id
 * Delete presensi session
 * Role: DOSEN, ADMIN
 */
export const deletePresensi = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }

    const { id } = req.params;

    // Get presensi to check access
    const presensi = await prisma.presensi.findUnique({
      where: { id: parseInt(id) },
      include: {
        kelasMK: true,
      },
    });

    if (!presensi) {
      throw new AppError('Presensi tidak ditemukan', 404);
    }

    // If user is DOSEN, verify they teach this class
    if (req.user.role === 'DOSEN') {
      const dosen = await prisma.dosen.findUnique({
        where: { userId: req.user.id },
      });

      if (!dosen || presensi.kelasMK.dosenId !== dosen.id) {
        throw new AppError(
          'Anda tidak memiliki akses untuk kelas ini',
          403
        );
      }
    }

    await presensiService.deletePresensi(parseInt(id));

    res.status(200).json({
      success: true,
      message: 'Presensi berhasil dihapus',
    });
  }
);

/**
 * GET /api/presensi/mahasiswa/:mahasiswaId/kelas/:kelasMKId
 * Get attendance statistics for a student in a class
 * Role: MAHASISWA (own data), DOSEN (their class), ADMIN
 */
export const getStatsMahasiswa = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }

    const { mahasiswaId, kelasMKId } = req.params;

    // Authorization check
    if (req.user.role === 'MAHASISWA') {
      const mahasiswa = await prisma.mahasiswa.findUnique({
        where: { userId: req.user.id },
      });

      if (!mahasiswa || mahasiswa.id !== parseInt(mahasiswaId)) {
        throw new AppError('Anda hanya bisa melihat data Anda sendiri', 403);
      }
    }

    const stats = await presensiService.getPresensiStatsMahasiswa(
      parseInt(mahasiswaId),
      parseInt(kelasMKId)
    );

    res.status(200).json({
      success: true,
      message: 'Statistik presensi mahasiswa berhasil diambil',
      data: stats,
    });
  }
);

/**
 * GET /api/presensi/kelas/:kelasMKId/stats
 * Get attendance statistics for entire class
 * Role: DOSEN (their class), ADMIN
 */
export const getStatsKelas = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }

    const { kelasMKId } = req.params;

    // If user is DOSEN, verify they teach this class
    if (req.user.role === 'DOSEN') {
      const dosen = await prisma.dosen.findUnique({
        where: { userId: req.user.id },
      });

      if (!dosen) {
        throw new AppError('Data dosen tidak ditemukan', 404);
      }

      const kelasMK = await prisma.kelasMataKuliah.findFirst({
        where: {
          id: parseInt(kelasMKId),
          dosenId: dosen.id,
        },
      });

      if (!kelasMK) {
        throw new AppError(
          'Anda tidak memiliki akses untuk kelas ini',
          403
        );
      }
    }

    const stats = await presensiService.getPresensiStatsKelas(
      parseInt(kelasMKId)
    );

    res.status(200).json({
      success: true,
      message: 'Statistik presensi kelas berhasil diambil',
      data: stats,
    });
  }
);

/**
 * GET /api/presensi/dosen/my-classes
 * Get all classes taught by logged-in dosen with attendance summary
 * Role: DOSEN
 */
export const getDosenClasses = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }

    if (req.user.role !== 'DOSEN') {
      throw new AppError('Hanya dosen yang bisa mengakses endpoint ini', 403);
    }

    const dosen = await prisma.dosen.findUnique({
      where: { userId: req.user.id },
    });

    if (!dosen) {
      throw new AppError('Data dosen tidak ditemukan', 404);
    }

    const { semesterId } = req.query;

    const where: any = { dosenId: dosen.id };
    if (semesterId) {
      where.semesterId = parseInt(semesterId as string);
    }

    const classes = await prisma.kelasMataKuliah.findMany({
      where,
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
          },
        },
        ruangan: {
          select: {
            nama: true,
          },
        },
        _count: {
          select: {
            presensi: true,
            krsDetail: true,
          },
        },
      },
      orderBy: [{ semester: { tahunAkademik: 'desc' } }, { hari: 'asc' }],
    });

    res.status(200).json({
      success: true,
      message: 'Data kelas dosen berhasil diambil',
      data: classes,
    });
  }
);