/**
 * KRS Service
 * Business logic for KRS creation, validation, and management
 */

import prisma from '../config/database';
import { AppError } from '../middlewares/errorMiddleware';

/**
 * Create KRS from Paket KRS template
 */
export const createFromPaket = async (
  mahasiswaId: number,
  semesterId: number,
  paketKRSId: number
) => {

  const paketKRS = await prisma.paketKRS.findUnique({
    where: { id: paketKRSId }, 
    include: {
      detail: {
        include: {
          kelasMK: {
            include: {
              mataKuliah: true,
            },
          },
        },
      },
    },
  });

  if (!paketKRS) {
    throw new AppError('Paket KRS tidak ditemukan', 404);
  }

  // Check if KRS already exists for this semester
  const existingKRS = await prisma.kRS.findFirst({
    where: {
      mahasiswaId,
      semesterId,
    },
  });

  if (existingKRS) {
    throw new AppError('KRS untuk semester ini sudah dibuat', 400);
  }

  // Calculate total SKS
  const totalSKS = paketKRS.detail.reduce(
    (sum, item) => sum + item.kelasMK.mataKuliah.sks,
    0
  );

  // Create KRS with details
  const krs = await prisma.kRS.create({
    data: {
      mahasiswaId,
      semesterId,
      paketKRSId,
      totalSKS,
      status: 'DRAFT',
      detail: {
        create: paketKRS.detail.map((item) => ({
          kelasMKId: item.kelasMKId,
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

  return krs;
};

/**
 * Validate prerequisites for a mata kuliah
 * Currently disabled as MataKuliahPrasyarat model is commented out
 */
export const validatePrasyarat = async (
  mahasiswaId: number,
  mkId: number
): Promise<{ isValid: boolean; message?: string }> => {
  // Prasyarat validation is disabled for now
  // Will be implemented when MataKuliahPrasyarat model is activated
  return { isValid: true };
  
  /* COMMENTED OUT - Uncomment when MataKuliahPrasyarat is activated
  
  // Get mata kuliah with prasyarat
  const mataKuliah = await prisma.mataKuliah.findUnique({
    where: { id: mkId },
    include: {
      prasyarat: {
        include: {
          prasyaratMK: true,
        },
      },
    },
  });

  if (!mataKuliah) {
    return { isValid: false, message: 'Mata kuliah tidak ditemukan' };
  }

  // If no prasyarat, valid
  if (mataKuliah.prasyarat.length === 0) {
    return { isValid: true };
  }

  // Check if student passed all prasyarat
  const failedPrasyarat = [];

  for (const prasyarat of mataKuliah.prasyarat) {
    const nilai = await prisma.nilai.findFirst({
      where: {
        mahasiswaId,
        kelasMK: {
          mkId: prasyarat.prasyaratMkId,
        },
      },
      orderBy: {
        tanggalInput: 'desc',  // ✅ Fixed: use tanggalInput instead of createdAt
      },
    });

    // Check if passed (nilai huruf A, AB, B, BC, C)
    if (!nilai || !['A', 'AB', 'B', 'BC', 'C'].includes(nilai.nilaiHuruf || '')) {
      failedPrasyarat.push(prasyarat.prasyaratMK.namaMK);
    }
  }

  if (failedPrasyarat.length > 0) {
    return {
      isValid: false,
      message: `Prasyarat belum terpenuhi: ${failedPrasyarat.join(', ')}`,
    };
  }

  return { isValid: true };
  */
};

/**
 * Detect schedule conflicts in a list of kelas
 */
export const detectJadwalConflict = async (
  kelasMKIds: number[]
): Promise<{ hasConflict: boolean; conflicts?: string[] }> => {
  if (kelasMKIds.length === 0) {
    return { hasConflict: false };
  }

  // Get all kelas
  const kelasList = await prisma.kelasMataKuliah.findMany({
    where: {
      id: { in: kelasMKIds },
    },
    include: {
      mataKuliah: {
        select: {
          kodeMK: true,
          namaMK: true,
        },
      },
    },
  });

  const conflicts: string[] = [];

  // Check each pair of kelas
  for (let i = 0; i < kelasList.length; i++) {
    for (let j = i + 1; j < kelasList.length; j++) {
      const kelas1 = kelasList[i];
      const kelas2 = kelasList[j];

      // Same day?
      if (kelas1.hari === kelas2.hari) {
        // Check time overlap
        const start1 = kelas1.jamMulai;
        const end1 = kelas1.jamSelesai;
        const start2 = kelas2.jamMulai;
        const end2 = kelas2.jamSelesai;

        const hasOverlap =
          (start1 < end2 && end1 > start2) ||
          (start2 < end1 && end2 > start1);

        if (hasOverlap) {
          conflicts.push(
            `${kelas1.mataKuliah.namaMK} vs ${kelas2.mataKuliah.namaMK} (${kelas1.hari} ${start1}-${end1})`
          );
        }
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts: conflicts.length > 0 ? conflicts : undefined,
  };
};

/**
 * Check SKS limit based on IPS
 */
export const checkSKSLimit = async (
  mahasiswaId: number,
  totalSKS: number
): Promise<{ isValid: boolean; message?: string; maxSKS?: number }> => {
  // Get latest KHS to determine IPS
  const latestKHS = await prisma.kHS.findFirst({
    where: { mahasiswaId },
    orderBy: {
      semester: {
        tahunAkademik: 'desc',
      },
    },
  });

  // Determine max SKS based on IPS
  let maxSKS = 24; // Default for first semester or IPS >= 3.00

  if (latestKHS) {
    const ips = latestKHS.ips.toNumber();

    if (ips >= 3.0) {
      maxSKS = 24;
    } else if (ips >= 2.5) {
      maxSKS = 21;
    } else if (ips >= 2.0) {
      maxSKS = 18;
    } else {
      maxSKS = 15;
    }
  }

  // Check minimum (usually 12 SKS)
  const minSKS = 12;

  if (totalSKS < minSKS) {
    return {
      isValid: false,
      message: `Total SKS minimal ${minSKS}, saat ini: ${totalSKS}`,
      maxSKS,
    };
  }

  if (totalSKS > maxSKS) {
    return {
      isValid: false,
      message: `Total SKS maksimal ${maxSKS} (berdasarkan IPS), saat ini: ${totalSKS}`,
      maxSKS,
    };
  }

  return { isValid: true, maxSKS };
};

/**
 * Calculate total SKS from kelas list
 */
export const calculateTotalSKS = async (kelasMKIds: number[]): Promise<number> => {
  if (kelasMKIds.length === 0) {
    return 0;
  }

  const kelasList = await prisma.kelasMataKuliah.findMany({
    where: {
      id: { in: kelasMKIds },
    },
    include: {
      mataKuliah: {
        select: {
          sks: true,
        },
      },
    },
  });

  return kelasList.reduce((sum, kelas) => sum + kelas.mataKuliah.sks, 0);
};

/**
 * Validate entire KRS before submission
 */
export const validateKRS = async (
  krsId: number
): Promise<{ isValid: boolean; errors: string[] }> => {
  const errors: string[] = [];

  // Get KRS with details
  const krs = await prisma.kRS.findUnique({
    where: { id: krsId },
    include: {
      detail: {
        include: {
          kelasMK: {
            include: {
              mataKuliah: true,
            },
          },
        },
      },
      mahasiswa: true,
    },
  });

  if (!krs) {
    return { isValid: false, errors: ['KRS tidak ditemukan'] };
  }

  // 1. Check prasyarat for all mata kuliah (currently disabled)
  // Uncomment when MataKuliahPrasyarat model is activated
  /*
  for (const detail of krs.detail) {
    const prasyaratCheck = await validatePrasyarat(
      krs.mahasiswaId,
      detail.kelasMK.mataKuliah.id
    );

    if (!prasyaratCheck.isValid) {
      errors.push(
        `${detail.kelasMK.mataKuliah.namaMK}: ${prasyaratCheck.message}`
      );
    }
  }
  */

  // 2. Check schedule conflicts
  const kelasMKIds = krs.detail.map((d) => d.kelasMKId);
  const conflictCheck = await detectJadwalConflict(kelasMKIds);

  if (conflictCheck.hasConflict) {
    errors.push(`Jadwal bentrok: ${conflictCheck.conflicts?.join('; ')}`);
  }

  // 3. Check SKS limit
  const sksCheck = await checkSKSLimit(krs.mahasiswaId, krs.totalSKS);

  if (!sksCheck.isValid) {
    errors.push(sksCheck.message || 'SKS tidak valid');
  }

  // 4. Check kuota for each kelas
  for (const detail of krs.detail) {
    const enrolledCount = await prisma.kRSDetail.count({
      where: {
        kelasMKId: detail.kelasMKId,
        krs: {
          status: {
            in: ['SUBMITTED', 'APPROVED'],
          },
        },
      },
    });

    if (enrolledCount >= detail.kelasMK.kuotaMax) {
      errors.push(
        `${detail.kelasMK.mataKuliah.namaMK}: Kuota kelas penuh (${enrolledCount}/${detail.kelasMK.kuotaMax})`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};