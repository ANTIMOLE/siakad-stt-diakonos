/**
 * Pembayaran Service
 * Business logic for payment management
 * ✅ UPDATED: Supports all payment types with unified schema
 */

import prisma from '../config/database';
import { AppError } from '../middlewares/errorMiddleware';
import { JenisPembayaran } from '@prisma/client';

/**
 * Upload bukti pembayaran
 */
export const uploadBuktiPembayaran = async (
  mahasiswaId: number,
  jenisPembayaran: JenisPembayaran,
  nominal: number,
  buktiUrl: string,
  semesterId?: number,
  bulanPembayaran?: Date
) => {
  // Check if mahasiswa exists
  const mahasiswa = await prisma.mahasiswa.findUnique({
    where: { id: mahasiswaId },
  });

  if (!mahasiswa) {
    throw new AppError('Mahasiswa tidak ditemukan', 404);
  }

  // ✅ Validate semester for semester-based payments
  const semesterTypes: JenisPembayaran[] = ['KRS', 'TENGAH_SEMESTER'];
  if (semesterTypes.includes(jenisPembayaran)) {
    if (!semesterId) {
      throw new AppError('Semester harus dipilih untuk jenis pembayaran ini', 400);
    }

    const semester = await prisma.semester.findUnique({
      where: { id: semesterId },
    });

    if (!semester) {
      throw new AppError('Semester tidak ditemukan', 404);
    }
  }

  // ✅ Validate bulan for monthly commitment
  if (jenisPembayaran === 'KOMITMEN_BULANAN') {
    if (!bulanPembayaran) {
      throw new AppError('Bulan pembayaran harus dipilih untuk komitmen bulanan', 400);
    }
  }

  // ✅ Check if already uploaded (different rules per type)
  let existingPembayaran;

  if (jenisPembayaran === 'KOMITMEN_BULANAN') {
    // For monthly: check by month
    const startOfMonth = new Date(bulanPembayaran!);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    existingPembayaran = await prisma.pembayaran.findFirst({
      where: {
        mahasiswaId,
        jenisPembayaran,
        bulanPembayaran: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
      },
    });
  } else if (semesterId) {
    // For semester-based: check by semester
    existingPembayaran = await prisma.pembayaran.findFirst({
      where: {
        mahasiswaId,
        semesterId,
        jenisPembayaran,
      },
    });
  } else {
    // For one-time payments (PPL, SKRIPSI, WISUDA): check by type only
    existingPembayaran = await prisma.pembayaran.findFirst({
      where: {
        mahasiswaId,
        jenisPembayaran,
      },
    });
  }

  if (existingPembayaran && existingPembayaran.status === 'PENDING') {
    throw new AppError(
      'Sudah ada pembayaran yang sedang diproses',
      400
    );
  }

  if (existingPembayaran && existingPembayaran.status === 'APPROVED') {
    const errorMessages: Record<string, string> = {
      KRS: 'Pembayaran KRS untuk semester ini sudah disetujui',
      TENGAH_SEMESTER: 'Pembayaran tengah semester untuk semester ini sudah disetujui',
      KOMITMEN_BULANAN: 'Pembayaran komitmen untuk bulan ini sudah disetujui',
      PPL: 'Pembayaran PPL sudah disetujui',
      SKRIPSI: 'Pembayaran skripsi sudah disetujui',
      WISUDA: 'Pembayaran wisuda sudah disetujui',
    };
    throw new AppError(errorMessages[jenisPembayaran] || 'Pembayaran sudah disetujui', 400);
  }

  // ✅ Create new pembayaran
  const pembayaran = await prisma.pembayaran.create({
    data: {
      mahasiswaId,
      semesterId: semesterId || null,
      jenisPembayaran,
      nominal,
      buktiUrl,
      bulanPembayaran: bulanPembayaran || null,
      status: 'PENDING',
    },
    include: {
      mahasiswa: {
        select: {
          nim: true,
          namaLengkap: true,
        },
      },
      semester: semesterId ? {
        select: {
          tahunAkademik: true,
          periode: true,
        },
      } : undefined,
    },
  });

  return pembayaran;
};

/**
 * Approve pembayaran
 */
export const approvePembayaran = async (
  pembayaranId: number,
  verifiedById: number
) => {
  // Get pembayaran
  const pembayaran = await prisma.pembayaran.findUnique({
    where: { id: pembayaranId },
  });

  if (!pembayaran) {
    throw new AppError('Pembayaran tidak ditemukan', 404);
  }

  if (pembayaran.status !== 'PENDING') {
    throw new AppError('Pembayaran sudah diverifikasi sebelumnya', 400);
  }

  // Update status
  const updated = await prisma.pembayaran.update({
    where: { id: pembayaranId },
    data: {
      status: 'APPROVED',
      verifiedAt: new Date(),
      verifiedById,
    },
    include: {
      mahasiswa: {
        select: {
          nim: true,
          namaLengkap: true,
        },
      },
      semester: pembayaran.semesterId ? {
        select: {
          tahunAkademik: true,
          periode: true,
        },
      } : undefined,
    },
  });

  return updated;
};

/**
 * Reject pembayaran
 */
export const rejectPembayaran = async (
  pembayaranId: number,
  verifiedById: number,
  catatan: string
) => {
  // Get pembayaran
  const pembayaran = await prisma.pembayaran.findUnique({
    where: { id: pembayaranId },
  });

  if (!pembayaran) {
    throw new AppError('Pembayaran tidak ditemukan', 404);
  }

  if (pembayaran.status !== 'PENDING') {
    throw new AppError('Pembayaran sudah diverifikasi sebelumnya', 400);
  }

  if (!catatan || catatan.trim().length === 0) {
    throw new AppError('Catatan penolakan wajib diisi', 400);
  }

  // Update status
  const updated = await prisma.pembayaran.update({
    where: { id: pembayaranId },
    data: {
      status: 'REJECTED',
      verifiedAt: new Date(),
      verifiedById,
      catatan,
    },
    include: {
      mahasiswa: {
        select: {
          nim: true,
          namaLengkap: true,
        },
      },
      semester: pembayaran.semesterId ? {
        select: {
          tahunAkademik: true,
          periode: true,
        },
      } : undefined,
    },
  });

  return updated;
};

/**
 * Get pembayaran statistics
 * ✅ UPDATED: Supports filtering by payment type
 */
export const getPembayaranStats = async (
  semesterId?: number,
  jenisPembayaran?: JenisPembayaran
) => {
  const where: any = {};
  
  if (semesterId) where.semesterId = semesterId;
  if (jenisPembayaran) where.jenisPembayaran = jenisPembayaran;

  const [total, pending, approved, rejected] = await Promise.all([
    prisma.pembayaran.count({ where }),
    prisma.pembayaran.count({ where: { ...where, status: 'PENDING' } }),
    prisma.pembayaran.count({ where: { ...where, status: 'APPROVED' } }),
    prisma.pembayaran.count({ where: { ...where, status: 'REJECTED' } }),
  ]);

  // Get total nominal
  const sumResult = await prisma.pembayaran.aggregate({
    where: { ...where, status: 'APPROVED' },
    _sum: {
      nominal: true,
    },
  });

  return {
    total,
    pending,
    approved,
    rejected,
    totalNominal: sumResult._sum.nominal || 0,
  };
};

/**
 * ✅ NEW: Check if KRS payment is approved
 * Used before allowing KRS creation/submission
 */
export const checkKRSPaymentApproved = async (
  mahasiswaId: number,
  semesterId: number
): Promise<boolean> => {
  const krsPayment = await prisma.pembayaran.findFirst({
    where: {
      mahasiswaId,
      semesterId,
      jenisPembayaran: 'KRS',
      status: 'APPROVED',
    },
  });

  return !!krsPayment;
};

/**
 * ✅ NEW: Get monthly commitment payment history
 */
export const getMonthlyCommitmentHistory = async (
  mahasiswaId: number,
  tahunAkademik?: string
) => {
  const where: any = {
    mahasiswaId,
    jenisPembayaran: 'KOMITMEN_BULANAN',
  };

  // Filter by academic year if provided
  if (tahunAkademik) {
    const [startYear] = tahunAkademik.split('/');
    const yearStart = new Date(`${startYear}-08-01`); // Aug 1st
    const yearEnd = new Date(`${parseInt(startYear) + 1}-07-31`); // Jul 31st next year
    
    where.bulanPembayaran = {
      gte: yearStart,
      lte: yearEnd,
    };
  }

  const payments = await prisma.pembayaran.findMany({
    where,
    orderBy: {
      bulanPembayaran: 'desc',
    },
    include: {
      verifiedBy: {
        select: {
          id: true,
          role: true,
        },
      },
    },
  });

  return payments;
};