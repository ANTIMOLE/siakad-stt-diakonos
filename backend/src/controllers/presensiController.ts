/**
 * Presensi Controller
 * Handle HTTP requests for attendance management
 * ✅ UPDATED: Added semesterId filter support
 */

import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { AppError, asyncHandler } from '../middlewares/errorMiddleware';
import prisma from '../config/database';
import * as presensiService from '../services/presensiService';
import { generatePDF, getBeritaAcaraHTMLTemplate, getPresensiPertemuanHTMLTemplate } from '../utils/pdfGenerator';
import { $Enums } from '@prisma/client';

/**
 * GET /api/presensi
 * Get all presensi for a specific class
 * ✅ UPDATED: Added optional semesterId filter
 */
export const getAllByKelas = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { kelasMKId, semesterId } = req.query;

    if (!kelasMKId) {
      throw new AppError('kelasMKId parameter wajib diisi', 400);
    }

    // ✅ Build where clause with optional semester filter
    const where: any = {
      kelasMKId: parseInt(kelasMKId as string),
    };

    // ✅ Add semester filter if provided
    if (semesterId) {
      where.kelasMK = {
        semesterId: parseInt(semesterId as string),
      };
    }

    const presensiList = await prisma.presensi.findMany({
      where,
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
            semester: {
              select: {
                id: true,
                tahunAkademik: true,
                periode: true,
                isActive: true,
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
            semester: {
              select: {
                tahunAkademik: true,
                periode: true,
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
 * ✅ UPDATED: Added semesterId filter
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

    // ✅ Build where clause
    const where: any = { dosenId: dosen.id };
    
    // ✅ If semesterId provided, filter by it
    // ✅ Otherwise, default to active semester only
    if (semesterId) {
      where.semesterId = parseInt(semesterId as string);
    } else {
      // ✅ Get active semester
      const activeSemester = await prisma.semester.findFirst({
        where: { isActive: true },
      });
      
      if (activeSemester) {
        where.semesterId = activeSemester.id;
      }
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
            id: true,
            tahunAkademik: true,
            periode: true,
            isActive: true,
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

export const getMahasiswaClasses = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }

    if (req.user.role !== 'MAHASISWA') {
      throw new AppError('Hanya mahasiswa yang bisa mengakses endpoint ini', 403);
    }

    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { userId: req.user.id },
    });

    if (!mahasiswa) {
      throw new AppError('Data mahasiswa tidak ditemukan', 404);
    }

    const { semesterId } = req.query;

    // ✅ Build where clause
    const where: any = {
      krs: {
        mahasiswaId: mahasiswa.id,
        status: 'APPROVED', // Only approved KRS
      },
    };

    // ✅ Add semester filter if provided
    if (semesterId) {
      where.kelasMK = {
        semesterId: parseInt(semesterId as string),
      };
    } else {
      // ✅ Default to active semester
      const activeSemester = await prisma.semester.findFirst({
        where: { isActive: true },
      });

      if (activeSemester) {
        where.kelasMK = {
          semesterId: activeSemester.id,
        };
      }
    }

    // ✅ Get distinct kelas from approved KRS
    const krsDetails = await prisma.kRSDetail.findMany({
      where,
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
            semester: {
              select: {
                id: true,
                tahunAkademik: true,
                periode: true,
                isActive: true,
              },
            },
            dosen: {
              select: {
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
                presensi: true,
              },
            },
          },
        },
      },
    });

    // ✅ Extract unique kelas and add presensi stats
    const uniqueKelas = new Map();

    for (const detail of krsDetails) {
      if (!uniqueKelas.has(detail.kelasMKId)) {
        // Get mahasiswa's presensi stats for this class
        const presensiStats = await prisma.presensiDetail.findMany({
          where: {
            mahasiswaId: mahasiswa.id,
            presensi: {
              kelasMKId: detail.kelasMKId,
            },
          },
        });

        const totalPertemuan = presensiStats.length;
        const hadir = presensiStats.filter((p) => p.status === 'HADIR').length;
        const persentase = totalPertemuan > 0 ? (hadir / totalPertemuan) * 100 : 0;

        uniqueKelas.set(detail.kelasMKId, {
          ...detail.kelasMK,
          presensiStats: {
            totalPertemuan,
            hadir,
            persentase: parseFloat(persentase.toFixed(2)),
          },
        });
      }
    }

    const classes = Array.from(uniqueKelas.values());

    res.status(200).json({
      success: true,
      message: 'Data kelas mahasiswa berhasil diambil',
      data: classes,
    });
  }
);


export const refreshMahasiswaList = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Get presensi with kelas info
    const presensi = await prisma.presensi.findUnique({
      where: { id: parseInt(id) },
      include: {
        kelasMK: {
          select: {
            id: true,
            semesterId: true,
          },
        },
      },
    });

    if (!presensi) {
      throw new AppError('Presensi tidak ditemukan', 404);
    }

    // Get all mahasiswa who are enrolled in this class (APPROVED KRS only)
    const enrolledMahasiswa = await prisma.kRSDetail.findMany({
      where: {
        kelasMKId: presensi.kelasMKId,
        krs: {
          status: 'APPROVED',
          semesterId: presensi.kelasMK.semesterId,
        },
      },
      select: {
        krs: {
          select: {
            mahasiswaId: true,
          },
        },
      },
    });

    const enrolledMahasiswaIds = enrolledMahasiswa.map(
      (detail) => detail.krs.mahasiswaId
    );

    // Get existing presensi detail
    const existingDetails = await prisma.presensiDetail.findMany({
      where: { presensiId: parseInt(id) },
      select: { mahasiswaId: true },
    });

    const existingMahasiswaIds = existingDetails.map((d) => d.mahasiswaId);

    // Find missing mahasiswa (enrolled but not in presensi yet)
    const missingMahasiswaIds = enrolledMahasiswaIds.filter(
      (id) => !existingMahasiswaIds.includes(id)
    );

    if (missingMahasiswaIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Daftar mahasiswa sudah lengkap',
        data: {
          added: 0,
          total: existingMahasiswaIds.length,
        },
      });
    }

    // Add missing mahasiswa with ALPHA status (default)
    const newDetails = await prisma.presensiDetail.createMany({
      data: missingMahasiswaIds.map((mahasiswaId) => ({
        presensiId: parseInt(id),
        mahasiswaId,
        status: 'ALPHA', // ✅ Default status for late enrollments
        keterangan: 'Ditambahkan otomatis (terdaftar setelah presensi dibuat)',
      })),
    });

    res.status(200).json({
      success: true,
      message: `${newDetails.count} mahasiswa berhasil ditambahkan`,
      data: {
        added: newDetails.count,
        total: existingMahasiswaIds.length + newDetails.count,
      },
    });
  }
);

export const exportPresensiPertemuanPDF = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // presensi ID
  
  const presensi = await prisma.presensi.findUnique({
    where: { id: Number(id) },
    include: {
      kelasMK: {
        include: { mataKuliah: true, dosen: true, ruangan: true }
      },
      detail: {
        include: { mahasiswa: true }
      }
    }
  });

  const html = getPresensiPertemuanHTMLTemplate({
    presensi,
    detail: presensi?.detail || [],
    kelasMK: presensi?.kelasMK,
    generatedAt: new Date().toLocaleString('id-ID')
  });

  await generatePDF(html, `Presensi-Pertemuan-${presensi?.pertemuan}.pdf`, res);
});


export const exportBeritaAcaraPDF = asyncHandler(async (req: AuthRequest, res: Response) => {
  // ✅ FIXED: Destructure 'id' sesuai route /:id/export-berita-acara
  const { id } = req.params;  // Bukan kelasMKId!

  // ✅ TAMBAH: Validasi & parse
  const parsedId = parseInt(id);
  if (isNaN(parsedId)) {
    throw new AppError('ID kelas tidak valid', 400);
  }

  // ✅ FIXED: Query Prisma dengan parsedId
  const kelasMK = await prisma.kelasMataKuliah.findUnique({
    where: { 
      id: parsedId
    },
    include: { 
      mataKuliah: true, 
      dosen: true, 
      ruangan: true, 
      semester: true 
    }
  });

  if (!kelasMK) {
    throw new AppError('Kelas mata kuliah tidak ditemukan', 404);
  }

  // ✅ FIXED: Query presensiList dengan parsedId
  const presensiList = await prisma.presensi.findMany({
    where: { kelasMKId: parsedId },
    include: { 
      detail: true 
      // ✅ OPTIONAL: Include modePembelajaran kalau field ada di schema
      // modePembelajaran: true  // Uncomment kalau perlu
    },
    orderBy: { pertemuan: 'asc' }
  });

  const html = getBeritaAcaraHTMLTemplate({
    presensiList,
    kelasMK,
    semester: kelasMK.semester,
    generatedAt: new Date().toLocaleString('id-ID')
  });

  await generatePDF(html, `Berita-Acara-${kelasMK.mataKuliah?.kodeMK}.pdf`, res);
});