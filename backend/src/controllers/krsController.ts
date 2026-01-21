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

/**
 * GET /api/krs
 * Get all KRS with filters
 */
/**
 * GET /api/krs
 * Get all KRS with filters
 */
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

  if (search) {
    where.mahasiswa = {
      OR: [
        { nim: { contains: search as string, mode: 'insensitive' } },
        { namaLengkap: { contains: search as string, mode: 'insensitive' } },
      ],
    };
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

  // ✅ Map frontend field names ke Prisma field names
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
      [prismaField]: sortOrder as 'asc' | 'desc',  // ✅ Use mapped field
    },
    include: {
      mahasiswa: {
        select: {
          id: true,
          nim: true,
          namaLengkap: true,
          angkatan: true,
          prodi: {  // ✅ Add prodi untuk table display
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

  // Get existing KRS
  const existingKRS = await prisma.kRS.findUnique({
    where: { id: parseInt(id) },
  });

  if (!existingKRS) {
    throw new AppError('KRS tidak ditemukan', 404);
  }

  // Can only update if status is DRAFT
  if (existingKRS.status !== 'DRAFT') {
    throw new AppError(
      'KRS hanya dapat diubah saat status masih DRAFT',
      400
    );
  }

  // Validate new kelas list
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

  // Calculate new total SKS
  const totalSKS = await krsService.calculateTotalSKS(kelasMKIds);

  // Update KRS
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

/**
 * DELETE /api/krs/:id
 * Delete KRS (only when status is DRAFT)
 */
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

    // Get KRS
    const krs = await prisma.kRS.findUnique({
      where: { id: parseInt(id) },
      include: {
        detail: true,
      },
    });

    if (!krs) {
      throw new AppError('KRS tidak ditemukan', 404);
    }

    // Can only submit if status is DRAFT
    if (krs.status !== 'DRAFT') {
      throw new AppError('KRS sudah disubmit', 400);
    }

    // Validate before submit
    const validation = await krsService.validateKRS(parseInt(id));

    if (!validation.isValid) {
      throw new AppError(
        `Validasi gagal: ${validation.errors.join('; ')}`,
        400
      );
    }

    // Update status to SUBMITTED
    const updatedKRS = await prisma.kRS.update({
      where: { id: parseInt(id) },
      data: {
        status: 'SUBMITTED',
        tanggalSubmit: new Date(),
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

    // Get KRS
    const krs = await prisma.kRS.findUnique({
      where: { id: parseInt(id) },
    });

    if (!krs) {
      throw new AppError('KRS tidak ditemukan', 404);
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

/**
 * GET /api/krs/:id/pdf
 * Download KRS as PDF
 */
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
    
    // Generate PDF filename
    const filename = `KRS_${krs.mahasiswa.nim}_${krs.semester.tahunAkademik.replace('/', '-')}.pdf`;
    
    // Generate and send PDF
    await generatePDF(html, filename, res);
  }
);