/**
 * Validation Utilities
 * Helper functions for KRS validation
 */

import prisma from '../config/database';

/**
 * Check if mahasiswa passed prerequisites for a mata kuliah
 */
// export const checkPrasyarat = async (
//   mahasiswaId: number,
//   mkId: number
// ): Promise<{ passed: boolean; message?: string; failedPrasyarat?: string[] }> => {
//   // Get mata kuliah with prasyarat
//   const mataKuliah = await prisma.mataKuliah.findUnique({
//     where: { id: mkId },
//     include: {
//       prasyarat: {
//         include: {
//           prasyaratMK: {
//             select: {
//               id: true,
//               kodeMK: true,
//               namaMK: true,
//             },
//           },
//         },
//       },
//     },
//   });

//   if (!mataKuliah) {
//     return { passed: false, message: 'Mata kuliah tidak ditemukan' };
//   }

//   // If no prasyarat, automatically pass
//   if (mataKuliah.prasyarat.length === 0) {
//     return { passed: true };
//   }

//   const failedPrasyarat: string[] = [];

//   // Check each prasyarat
//   for (const prasyarat of mataKuliah.prasyarat) {
//     // Get nilai for this prasyarat MK
//     const nilai = await prisma.nilai.findFirst({
//       where: {
//         mahasiswaId,
//         kelasMK: {
//           mkId: prasyarat.prasyaratMkId,
//         },
//       },
//       orderBy: {
//         createdAt: 'desc',
//       },
//     });

//     // Check if passed (A, AB, B, BC, C)
//     const passingGrades = ['A', 'AB', 'B', 'BC', 'C'];
    
//     if (!nilai || !passingGrades.includes(nilai.nilaiHuruf || '')) {
//       failedPrasyarat.push(
//         `${prasyarat.prasyaratMK.kodeMK} - ${prasyarat.prasyaratMK.namaMK}`
//       );
//     }
//   }

//   if (failedPrasyarat.length > 0) {
//     return {
//       passed: false,
//       message: 'Belum memenuhi prasyarat',
//       failedPrasyarat,
//     };
//   }

//   return { passed: true };
// };

/**
 * Check for schedule conflicts between kelas
 */
export const checkJadwalConflict = async (
  kelasMKIds: number[]
): Promise<{ hasConflict: boolean; conflicts?: string[] }> => {
  if (kelasMKIds.length < 2) {
    return { hasConflict: false };
  }

  // Get all kelas data
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

  // Compare each pair
  for (let i = 0; i < kelasList.length; i++) {
    for (let j = i + 1; j < kelasList.length; j++) {
      const kelas1 = kelasList[i];
      const kelas2 = kelasList[j];

      // Check if same day
      if (kelas1.hari === kelas2.hari) {
        // Check time overlap
        const overlap = checkTimeOverlap(
          kelas1.jamMulai,
          kelas1.jamSelesai,
          kelas2.jamMulai,
          kelas2.jamSelesai
        );

        if (overlap) {
          conflicts.push(
            `Bentrok: ${kelas1.mataKuliah.namaMK} dan ${kelas2.mataKuliah.namaMK} (${kelas1.hari}, ${kelas1.jamMulai}-${kelas1.jamSelesai})`
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
 * Helper function to check time overlap
 */
const checkTimeOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  // Convert time strings to minutes for comparison
  const toMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);

  // Check overlap: (s1 < e2) AND (s2 < e1)
  return s1 < e2 && s2 < e1;
};

/**
 * Check SKS limit based on IPS
 */
export const checkSKSLimit = async (
  mahasiswaId: number,
  totalSKS: number,
  ips?: number
): Promise<{ valid: boolean; maxSKS: number; minSKS: number; message?: string }> => {
  const minSKS = 12; // Minimum SKS per semester
  let maxSKS = 24; // Default max SKS

  // If IPS not provided, get from latest KHS
  if (ips === undefined) {
    const latestKHS = await prisma.kHS.findFirst({
      where: { mahasiswaId },
      orderBy: {
        semester: {
          tahunAkademik: 'desc',
        },
      },
    });

    if (latestKHS) {
      ips = latestKHS.ips.toNumber();
    }
  }

  // Determine max SKS based on IPS
  if (ips !== undefined) {
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

  // Validate
  if (totalSKS < minSKS) {
    return {
      valid: false,
      maxSKS,
      minSKS,
      message: `Total SKS minimal ${minSKS}, saat ini ${totalSKS} SKS`,
    };
  }

  if (totalSKS > maxSKS) {
    return {
      valid: false,
      maxSKS,
      minSKS,
      message: `Total SKS maksimal ${maxSKS} (IPS: ${ips?.toFixed(2) || 'N/A'}), saat ini ${totalSKS} SKS`,
    };
  }

  return {
    valid: true,
    maxSKS,
    minSKS,
  };
};

/**
 * Check if kelas has available quota
 */
export const checkKuota = async (
  kelasMKId: number
): Promise<{ available: boolean; enrolled: number; max: number; message?: string }> => {
  // Get kelas data
  const kelasMK = await prisma.kelasMataKuliah.findUnique({
    where: { id: kelasMKId },
    include: {
      mataKuliah: {
        select: {
          kodeMK: true,
          namaMK: true,
        },
      },
    },
  });

  if (!kelasMK) {
    return {
      available: false,
      enrolled: 0,
      max: 0,
      message: 'Kelas tidak ditemukan',
    };
  }

  // Count enrolled students (SUBMITTED or APPROVED KRS)
  const enrolledCount = await prisma.kRSDetail.count({
    where: {
      kelasMKId,
      krs: {
        status: {
          in: ['SUBMITTED', 'APPROVED'],
        },
      },
    },
  });

  const available = enrolledCount < kelasMK.kuotaMax;

  return {
    available,
    enrolled: enrolledCount,
    max: kelasMK.kuotaMax,
    message: available
      ? undefined
      : `Kuota kelas ${kelasMK.mataKuliah.namaMK} sudah penuh (${enrolledCount}/${kelasMK.kuotaMax})`,
  };
};

/**
 * Check if mahasiswa can take KRS (within KRS period)
 */
export const checkKRSPeriod = async (
  semesterId: number
): Promise<{ canTake: boolean; message?: string }> => {
  const semester = await prisma.semester.findUnique({
    where: { id: semesterId },
  });

  if (!semester) {
    return { canTake: false, message: 'Semester tidak ditemukan' };
  }

  const now = new Date();
  const krsStart = semester.periodeKRSMulai;
  const krsEnd = semester.periodeKRSSelesai;

  if (now < krsStart) {
    return {
      canTake: false,
      message: `Periode KRS belum dimulai (mulai ${krsStart.toLocaleDateString('id-ID')})`,
    };
  }

  if (now > krsEnd) {
    // Check revision period
    const revisionStart = semester.periodePerbaikanKRSMulai;
    const revisionEnd = semester.periodePerbaikanKRSSelesai;

    if (now >= revisionStart && now <= revisionEnd) {
      return { canTake: true };
    }

    return {
      canTake: false,
      message: 'Periode KRS sudah berakhir',
    };
  }

  return { canTake: true };
};

/**
 * Validate all KRS requirements at once
 */
export const validateKRSRequirements = async (
  mahasiswaId: number,
  semesterId: number,
  kelasMKIds: number[]
): Promise<{ valid: boolean; errors: string[]; warnings?: string[] }> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check KRS period
  const periodCheck = await checkKRSPeriod(semesterId);
  if (!periodCheck.canTake) {
    errors.push(periodCheck.message!);
  }

  // 2. Check if mahasiswa already has KRS for this semester
  const existingKRS = await prisma.kRS.findFirst({
    where: {
      mahasiswaId,
      semesterId,
    },
  });

  if (existingKRS && existingKRS.status !== 'DRAFT') {
    errors.push('KRS untuk semester ini sudah disubmit');
  }

  // 3. Get all mata kuliah from kelas
  const kelasList = await prisma.kelasMataKuliah.findMany({
    where: { id: { in: kelasMKIds } },
    include: { mataKuliah: true },
  });

  // 4. Check prasyarat for each mata kuliah
  // for (const kelas of kelasList) {
  //   const prasyaratCheck = await checkPrasyarat(
  //     mahasiswaId,
  //     kelas.mataKuliah.id
  //   );

  //   if (!prasyaratCheck.passed) {
  //     errors.push(
  //       `${kelas.mataKuliah.namaMK}: ${prasyaratCheck.message} - ${prasyaratCheck.failedPrasyarat?.join(', ')}`
  //     );
  //   }
  // }

  // 5. Check schedule conflicts
  const conflictCheck = await checkJadwalConflict(kelasMKIds);
  if (conflictCheck.hasConflict) {
    errors.push(...(conflictCheck.conflicts || []));
  }

  // 6. Check total SKS
  const totalSKS = kelasList.reduce((sum, k) => sum + k.mataKuliah.sks, 0);
  const sksCheck = await checkSKSLimit(mahasiswaId, totalSKS);
  if (!sksCheck.valid) {
    errors.push(sksCheck.message!);
  }

  // 7. Check kuota for each kelas
  for (const kelas of kelasList) {
    const kuotaCheck = await checkKuota(kelas.id);
    if (!kuotaCheck.available) {
      warnings.push(kuotaCheck.message!);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};
