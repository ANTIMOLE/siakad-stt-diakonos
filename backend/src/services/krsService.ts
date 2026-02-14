import prisma from '../config/database';
import { AppError } from '../middlewares/errorMiddleware';

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

  const existingKRS = await prisma.kRS.findFirst({
    where: {
      mahasiswaId,
      semesterId,
    },
  });

  if (existingKRS) {
    throw new AppError('KRS untuk semester ini sudah dibuat', 400);
  }

  const totalSKS = paketKRS.detail.reduce(
    (sum, item) => sum + item.kelasMK.mataKuliah.sks,
    0
  );

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

// export const validatePrasyarat = async (
//   mahasiswaId: number,
//   mkId: number
// ): Promise<{ isValid: boolean; message?: string }> => {
//   return { isValid: true };
// };

export const detectJadwalConflict = async (
  kelasMKIds: number[]
): Promise<{ hasConflict: boolean; conflicts?: string[] }> => {
  if (kelasMKIds.length === 0) {
    return { hasConflict: false };
  }

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

  for (let i = 0; i < kelasList.length; i++) {
    for (let j = i + 1; j < kelasList.length; j++) {
      const kelas1 = kelasList[i];
      const kelas2 = kelasList[j];

      if (kelas1.hari === kelas2.hari) {
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

export const checkSKSLimit = async (
  mahasiswaId: number,
  totalSKS: number
): Promise<{ isValid: boolean; message?: string; maxSKS?: number }> => {
  const latestKHS = await prisma.kHS.findFirst({
    where: { mahasiswaId },
    orderBy: {
      semester: {
        tahunAkademik: 'desc',
      },
    },
  });

  let maxSKS = 24;

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

  if (totalSKS > maxSKS) {
    return {
      isValid: false,
      message: `Total SKS maksimal ${maxSKS} (berdasarkan IPS), saat ini: ${totalSKS}`,
      maxSKS,
    };
  }

  return { isValid: true, maxSKS };
};

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

export const validateKRS = async (
  krsId: number
): Promise<{ isValid: boolean; errors: string[] }> => {
  const errors: string[] = [];

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

  const kelasMKIds = krs.detail.map((d) => d.kelasMKId);
  const conflictCheck = await detectJadwalConflict(kelasMKIds);

  if (conflictCheck.hasConflict) {
    errors.push(`Jadwal bentrok: ${conflictCheck.conflicts?.join('; ')}`);
  }

  const sksCheck = await checkSKSLimit(krs.mahasiswaId, krs.totalSKS);

  if (!sksCheck.isValid) {
    errors.push(sksCheck.message || 'SKS tidak valid');
  }

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