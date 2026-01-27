/**
 * KRS Controller
 * Handles KRS workflow and management
 */

import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { asyncHandler, AppError } from '../middlewares/errorMiddleware';
import { Prisma } from '@prisma/client';
import * as krsService from '../services/krsService';
import { validateKRSRequirements } from '../utils/validasi';

import { generatePDF, getKRSHTMLTemplate } from '../utils/pdfGenerator';


export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = 1,
    limit = 10,
    search,
    semesterId,
    mahasiswaId,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  // Build where clause
  const where: Prisma.KRSWhereInput = {};

  // ✅ TAMBAH: Filter untuk DOSEN - hanya mahasiswa bimbingan
  let dosenWaliId: number | undefined;
  if (req.user?.role === 'DOSEN') {
    const dosen = await prisma.dosen.findUnique({
      where: { userId: req.user.id },
    });
    if (!dosen) {
      throw new AppError('Data dosen tidak ditemukan', 404);
    }
    dosenWaliId = dosen.id;
  }

  if (search) {
    where.mahasiswa = {
      ...(dosenWaliId ? { dosenWaliId } : {}),
      OR: [
        { nim: { contains: search as string, mode: 'insensitive' } },
        { namaLengkap: { contains: search as string, mode: 'insensitive' } },
      ],
    };
  } else if (dosenWaliId) {
    where.mahasiswa = { dosenWaliId };
  }

  if (semesterId) {
    where.semesterId = parseInt(semesterId as string);
  }

  if (mahasiswaId) {
    where.mahasiswaId = parseInt(mahasiswaId as string);
  }

  if (status) {
    where.status = status as any;
  }

  const fieldMapping: Record<string, string> = {
    submittedAt: 'tanggalSubmit',
    approvedAt: 'tanggalApproval',
  };

  const prismaField = fieldMapping[sortBy as string] || (sortBy as string);

  // Pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Get total count
  const total = await prisma.kRS.count({ where });

  // Get data
  const krsList = await prisma.kRS.findMany({
    where,
    skip,
    take: limitNum,
    orderBy: {
      [prismaField]: sortOrder as 'asc' | 'desc',  
    },
    include: {
      mahasiswa: {
        select: {
          id: true,
          nim: true,
          namaLengkap: true,
          angkatan: true,
          prodi: { 
            select: {
              id: true,
              kode: true,
              nama: true,
            },
          },
        },
      },
      semester: {
        select: {
          id: true,
          tahunAkademik: true,
          periode: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          dosen: {
            select: {
              nidn: true,
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
  });

  res.status(200).json({
    success: true,
    message: 'Data KRS berhasil diambil',
    data: krsList,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});


/**
 * GET /api/krs/:id
 * Get KRS by ID with complete details
 */
export const getById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const krs = await prisma.kRS.findUnique({
      where: { id: parseInt(id) },
      include: {
        mahasiswa: {
          select: {
            id: true,
            nim: true,
            namaLengkap: true,
            angkatan: true,
            prodi: {
              select: {
                kode: true,
                nama: true,
              },
            },
          },
        },
        semester: {
          select: {
            id: true,
            tahunAkademik: true,
            periode: true,
            tanggalMulai: true,
            tanggalSelesai: true,
          },
        },
        detail: {
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
                    nidn: true,
                    namaLengkap: true,
                  },
                },
                ruangan: {
                  select: {
                    nama: true,
                  },
                },
              },
            },
          },
        },
        approvedBy: {
          select: {
            id: true,
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

    if (!krs) {
      throw new AppError('KRS tidak ditemukan', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Data KRS berhasil diambil',
      data: krs,
    });
  }
);

/**
 * POST /api/krs
 * Create new KRS (from paket or manual)
 */
export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mahasiswaId, semesterId, paketKRSId, kelasMKIds } = req.body;

  // Check if KRS already exists
  const existingKRS = await prisma.kRS.findFirst({
    where: {
      mahasiswaId,
      semesterId,
    },
  });

  if (existingKRS) {
    throw new AppError('KRS untuk semester ini sudah dibuat', 400);
  }

  let krs;

  if (paketKRSId) {
    // Create from paket
    krs = await krsService.createFromPaket(
      mahasiswaId,
      semesterId,
      paketKRSId
    );
  } else if (kelasMKIds && kelasMKIds.length > 0) {
    // Create manually
    // Validate first
    const validation = await validateKRSRequirements(
      mahasiswaId,
      semesterId,
      kelasMKIds
    );

    if (!validation.valid) {
      throw new AppError(
        `Validasi gagal: ${validation.errors.join('; ')}`,
        400
      );
    }

    // Calculate total SKS
    const totalSKS = await krsService.calculateTotalSKS(kelasMKIds);

    // Create KRS
    krs = await prisma.kRS.create({
      data: {
        mahasiswaId,
        semesterId,
        totalSKS,
        status: 'DRAFT',
        detail: {
          create: kelasMKIds.map((kelasMKId: number) => ({
            kelasMKId,
          })),
        },
      },
      include: {
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
      },
    });
  } else {
    throw new AppError('Paket KRS atau daftar kelas harus disediakan', 400);
  }

  res.status(201).json({
    success: true,
    message: 'KRS berhasil dibuat',
    data: krs,
  });
});

/**
 * PUT /api/krs/:id
 * Update KRS (only when status is DRAFT)
 */
export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { kelasMKIds } = req.body;

  const existingKRS = await prisma.kRS.findUnique({
    where: { id: parseInt(id) },
    include: {
      semester: true, // ✅ Include semester for period check
    },
  });

  if (!existingKRS) {
    throw new AppError('KRS tidak ditemukan', 404);
  }

  // ✅ Allow both DRAFT and REJECTED
  if (existingKRS.status !== 'DRAFT' && existingKRS.status !== 'REJECTED') {
    throw new AppError(
      'KRS hanya dapat diubah saat status DRAFT atau REJECTED',
      400
    );
  }

  // ✅ FIXED: Admin bypasses period validation
  const isAdmin = req.user?.role === 'ADMIN';
  
  // Only validate period for non-admin users
  if (!isAdmin) {
    const validation = await validateKRSRequirements(
      existingKRS.mahasiswaId,
      existingKRS.semesterId,
      kelasMKIds
    );

    if (!validation.valid) {
      throw new AppError(
        `Validasi gagal: ${validation.errors.join('; ')}`,
        400
      );
    }
  } else {
    // ✅ For admin, only validate technical requirements (schedule conflicts, kuota)
    // Skip period validation
    
    // 1. Check schedule conflicts
    const conflictCheck = await krsService.detectJadwalConflict(kelasMKIds);
    if (conflictCheck.hasConflict) {
      throw new AppError(
        `Jadwal bentrok: ${conflictCheck.conflicts?.join('; ')}`,
        400
      );
    }

    // 2. Check SKS limit
    const totalSKS = await krsService.calculateTotalSKS(kelasMKIds);
    const sksCheck = await krsService.checkSKSLimit(existingKRS.mahasiswaId, totalSKS);
    if (!sksCheck.isValid) {
      throw new AppError(sksCheck.message || 'SKS tidak valid', 400);
    }

    // 3. Check kuota (but allow admin to override if needed)
    // Skip kuota check for admin - they can force add students
  }

  const totalSKS = await krsService.calculateTotalSKS(kelasMKIds);

  const krs = await prisma.kRS.update({
    where: { id: parseInt(id) },
    data: {
      totalSKS,
      detail: {
        deleteMany: {},
        create: kelasMKIds.map((kelasMKId: number) => ({
          kelasMKId,
        })),
      },
      // ✅ Reset to DRAFT when editing REJECTED
      ...(existingKRS.status === 'REJECTED' && {
        status: 'DRAFT',
        catatanAdmin: null,
        tanggalApproval: null,
        approvedById: null,
      }),
    },
    include: {
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
    },
  });

  res.status(200).json({
    success: true,
    message: 'KRS berhasil diupdate',
    data: krs,
  });
});

export const deleteById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Get KRS
    const krs = await prisma.kRS.findUnique({
      where: { id: parseInt(id) },
    });

    if (!krs) {
      throw new AppError('KRS tidak ditemukan', 404);
    }

    // Can only delete if status is DRAFT
    if (krs.status !== 'DRAFT') {
      throw new AppError(
        'KRS hanya dapat dihapus saat status masih DRAFT',
        400
      );
    }

    // Delete detail first, then KRS
    await prisma.$transaction([
      prisma.kRSDetail.deleteMany({
        where: { krsId: parseInt(id) },
      }),
      prisma.kRS.delete({
        where: { id: parseInt(id) },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: 'KRS berhasil dihapus',
    });
  }
);

/**
 * POST /api/krs/:id/submit
 * Submit KRS for approval
 */
export const submit = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const krs = await prisma.kRS.findUnique({
      where: { id: parseInt(id) },
      include: {
        detail: true,
      },
    });

    if (!krs) {
      throw new AppError('KRS tidak ditemukan', 404);
    }

    // ✅ FIXED: Allow both DRAFT and REJECTED
    if (krs.status !== 'DRAFT' && krs.status !== 'REJECTED') {
      throw new AppError('KRS hanya dapat disubmit saat status DRAFT atau REJECTED', 400);
    }

    const validation = await krsService.validateKRS(parseInt(id));

    if (!validation.isValid) {
      throw new AppError(
        `Validasi gagal: ${validation.errors.join('; ')}`,
        400
      );
    }

    const updatedKRS = await prisma.kRS.update({
      where: { id: parseInt(id) },
      data: {
        status: 'SUBMITTED',
        tanggalSubmit: new Date(),
        // ✅ Clear rejection data when resubmitting
        ...(krs.status === 'REJECTED' && {
          catatanAdmin: null,
          tanggalApproval: null,
          approvedById: null,
        }),
      },
      include: {
        mahasiswa: true,
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
      },
    });

    res.status(200).json({
      success: true,
      message: 'KRS berhasil disubmit untuk disetujui',
      data: updatedKRS,
    });
  }
);

/**
 * POST /api/krs/:id/approve
 * Approve KRS (Dosen only)
 */
export const approve = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }

    // Get KRS dengan mahasiswa
    const krs = await prisma.kRS.findUnique({
      where: { id: parseInt(id) },
      include: { mahasiswa: true },
    });

    if (!krs) {
      throw new AppError('KRS tidak ditemukan', 404);
    }

    // ✅ TAMBAH: Check jika DOSEN, harus dosen wali
    if (req.user.role === 'DOSEN') {
      const dosen = await prisma.dosen.findUnique({
        where: { userId: req.user.id },
      });
      if (!dosen || krs.mahasiswa.dosenWaliId !== dosen.id) {
        throw new AppError('Anda bukan dosen wali mahasiswa ini', 403);
      }
    }

    // Can only approve if status is SUBMITTED
    if (krs.status !== 'SUBMITTED') {
      throw new AppError('KRS hanya dapat disetujui saat status SUBMITTED', 400);
    }

    // Update status to APPROVED
    const updatedKRS = await prisma.kRS.update({
      where: { id: parseInt(id) },
      data: {
        status: 'APPROVED',
        tanggalApproval: new Date(),
        approvedById: req.user.id,
      },
      include: {
        mahasiswa: true,
        semester: true,
        approvedBy: {
          include: {
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

    res.status(200).json({
      success: true,
      message: 'KRS berhasil disetujui',
      data: updatedKRS,
    });
  }
);

/**
 * POST /api/krs/:id/reject
 * Reject KRS (Dosen only)
 */
export const reject = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { catatanAdmin } = req.body;

    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }

    // Get KRS
    const krs = await prisma.kRS.findUnique({
      where: { id: parseInt(id) },
    });

    if (!krs) {
      throw new AppError('KRS tidak ditemukan', 404);
    }

    // Can only reject if status is SUBMITTED
    if (krs.status !== 'SUBMITTED') {
      throw new AppError('KRS hanya dapat ditolak saat status SUBMITTED', 400);
    }

    // Update status to REJECTED
    const updatedKRS = await prisma.kRS.update({
      where: { id: parseInt(id) },
      data: {
        status: 'REJECTED',
        tanggalApproval: new Date(),
        approvedById: req.user.id,
        catatanAdmin,
      },
      include: {
        mahasiswa: true,
        semester: true,
        approvedBy: {
          include: {
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

    res.status(200).json({
      success: true,
      message: 'KRS ditolak',
      data: updatedKRS,
    });
  }
);

export const downloadPDF = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Get KRS with full data
    const krs = await prisma.kRS.findUnique({
      where: { id: parseInt(id) },
      include: {
        mahasiswa: {
          include: {
            prodi: true,
          },
        },
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
                ruangan: true,
              },
            },
          },
        },
        approvedBy: {
          include: {
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

    if (!krs) {
      throw new AppError('KRS tidak ditemukan', 404);
    }

    // Generate HTML
    const html = getKRSHTMLTemplate(krs);
    
    const nim = krs.mahasiswa?.nim || 'UNKNOWN';
    const tahun = krs.semester?.tahunAkademik?.replace('/', '-') || 'UNKNOWN';
    const periode = krs.semester?.periode || '';
    const filename = `KRS_${nim}_${tahun}_${periode}.pdf`;
    
    // Generate and send PDF
    await generatePDF(html, filename, res);
  }
);