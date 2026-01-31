/**
 * Nilai Service
 * Business logic for grading system
 */

import prisma from '../config/database';
import { AppError } from '../middlewares/errorMiddleware';
import { nilaiAngkaToHuruf, nilaiHurufToBobot } from '../utils/konversiNilai';
import { hitungIPS, hitungIPK, getTotalSKS } from '../utils/hitungIPK';
import { NilaiHuruf } from '@prisma/client';

/**
 * Interface for batch nilai input
 */
interface NilaiInput {
  mahasiswaId: number;
  nilaiAngka: number;
}

/**
 * Batch save nilai for a class
 */
export const batchSaveNilai = async (
  kelasMKId: number,
  nilaiInputs: NilaiInput[],
  inputById: number
) => {
  // Validate kelas exists
  const kelasMK = await prisma.kelasMataKuliah.findUnique({
    where: { id: kelasMKId },
    include: {
      mataKuliah: true,
    },
  });

  if (!kelasMK) {
    throw new AppError('Kelas mata kuliah tidak ditemukan', 404);
  }

  const results = [];

  for (const input of nilaiInputs) {
    const { mahasiswaId, nilaiAngka } = input;

    // Validate nilai angka
    if (nilaiAngka < 0 || nilaiAngka > 100) {
      throw new AppError(`Nilai angka tidak valid untuk mahasiswa ID ${mahasiswaId}`, 400);
    }

    // Calculate nilai huruf and bobot
    const nilaiHuruf = nilaiAngkaToHuruf(nilaiAngka) as NilaiHuruf;
    const bobot = nilaiHurufToBobot(nilaiHuruf);

    // Check if nilai already exists
    const existingNilai = await prisma.nilai.findFirst({
      where: {
        mahasiswaId,
        kelasMKId,
      },
    });

    if (existingNilai) {
      // Update existing nilai
      const updated = await prisma.nilai.update({
        where: { id: existingNilai.id },
        data: {
          nilaiAngka,
          nilaiHuruf,
          bobot,
        },
        include: {
          mahasiswa: {
            select: {
              nim: true,
              namaLengkap: true,
            },
          },
        },
      });
      results.push(updated);
    } else {
      // Create new nilai
      const created = await prisma.nilai.create({
        data: {
          mahasiswaId,
          kelasMKId,
          semesterId: kelasMK.semesterId,
          nilaiAngka,
          nilaiHuruf,
          bobot,
          isFinalized: false,
          inputById,
        },
        include: {
          mahasiswa: {
            select: {
              nim: true,
              namaLengkap: true,
            },
          },
        },
      });
      results.push(created);
    }
  }

  return results;
};

/**
 * Calculate nilai huruf from angka
 */
export const calculateNilaiHuruf = (nilaiAngka: number): string => {
  return nilaiAngkaToHuruf(nilaiAngka);
};

/**
 * Calculate bobot from huruf
 */
export const calculateBobot = (nilaiHuruf: string): number => {
  return nilaiHurufToBobot(nilaiHuruf);
};

/**
 * Finalize nilai for a class
 * Lock the grades and trigger KHS generation
 */
export const finalizeNilai = async (kelasMKId: number, dosenId: number) => {
  // Validate kelas exists
  const kelasMK = await prisma.kelasMataKuliah.findUnique({
    where: { id: kelasMKId },
    include: {
      mataKuliah: true,
      semester: true,
    },
  });

  if (!kelasMK) {
    throw new AppError('Kelas mata kuliah tidak ditemukan', 404);
  }

  // Check if dosen owns this class (optional, can be enforced)
  if (kelasMK.dosenId !== dosenId) {
    throw new AppError('Anda bukan dosen pengampu kelas ini', 403);
  }

  // Get all nilai for this class
  const nilaiList = await prisma.nilai.findMany({
    where: { kelasMKId },
  });

  if (nilaiList.length === 0) {
    throw new AppError('Tidak ada nilai yang dapat difinalisasi', 400);
  }

  // ✅ FIXED: Check if all students have grades - IN SAME SEMESTER!
  const studentsInClass = await prisma.kRSDetail.count({
    where: {
      kelasMKId,
      krs: {
        status: 'APPROVED',
        semesterId: kelasMK.semesterId,  // ✅ ADD THIS - Critical fix!
      },
    },
  });

  if (nilaiList.length !== studentsInClass) {
    throw new AppError(
      `Masih ada ${studentsInClass - nilaiList.length} mahasiswa yang belum dinilai`,
      400
    );
  }

  // Mark all nilai as finalized
  await prisma.nilai.updateMany({
    where: { kelasMKId },
    data: { isFinalized: true },
  });


  const mahasiswaIds = nilaiList.map((n) => n.mahasiswaId);
  await generateKHSForMahasiswa(mahasiswaIds, kelasMK.semesterId);

  return {
    message: 'Nilai berhasil difinalisasi',
    totalNilai: nilaiList.length,
    semesterId: kelasMK.semesterId,
  };
};


export const unlockNilai = async (kelasMKId: number) => {
  // Validate kelas exists
  const kelasMK = await prisma.kelasMataKuliah.findUnique({
    where: { id: kelasMKId },
  });

  if (!kelasMK) {
    throw new AppError('Kelas mata kuliah tidak ditemukan', 404);
  }

  // Unlock all nilai
  await prisma.nilai.updateMany({
    where: { kelasMKId },
    data: { isFinalized: false },
  });

  return {
    message: 'Nilai berhasil dibuka kembali untuk diedit',
  };
};

/**
 * Generate or update KHS for mahasiswa
 * Called automatically after nilai finalized
 */
export const generateKHSForMahasiswa = async (
  mahasiswaIds: number[],
  semesterId: number
) => {
  for (const mahasiswaId of mahasiswaIds) {
    // Get all nilai for this mahasiswa in this semester
    const semesterNilai = await prisma.nilai.findMany({
      where: {
        mahasiswaId,
        semesterId,  // ✅ Already correct - same semester
        isFinalized: true,
      },
      include: {
        kelasMK: {
          include: {
            mataKuliah: true,
          },
        },
      },
    });

    // Calculate IPS
    const ips = hitungIPS(semesterNilai);
    const sksSemester = getTotalSKS(semesterNilai);

    // ✅ FIXED: Get all nilai up to this semester for IPK
    // Old way (BROKEN): String comparison on tahunAkademik
    // New way: Use semester ordering
    
    // 1. Get target semester
    const targetSemester = await prisma.semester.findUnique({
      where: { id: semesterId },
    });

    if (!targetSemester) {
      console.error(`Semester ${semesterId} not found`);
      continue;
    }

    // 2. Get all semesters ordered by tahunAkademik and periode
    const allSemesters = await prisma.semester.findMany({
      orderBy: [
        { tahunAkademik: 'asc' },
        { periode: 'asc' },  // GANJIL before GENAP in DB
      ],
    });

    // 3. Find position of target semester
    const targetIndex = allSemesters.findIndex(s => s.id === semesterId);
    
    if (targetIndex === -1) {
      console.error(`Could not find semester ${semesterId} in ordered list`);
      continue;
    }

    // 4. Get IDs of all semesters up to and including target
    const semesterIdsToInclude = allSemesters
      .slice(0, targetIndex + 1)
      .map(s => s.id);

    // 5. Query nilai using semester IDs (not string comparison!)
    const allNilai = await prisma.nilai.findMany({
      where: {
        mahasiswaId,
        isFinalized: true,
        semesterId: { in: semesterIdsToInclude },  // ✅ FIXED!
      },
      include: {
        kelasMK: {
          include: {
            mataKuliah: true,
          },
        },
      },
    });

    // Calculate IPK
    const ipk = hitungIPK(allNilai);
    const sksKumulatif = getTotalSKS(allNilai);

    // Check if KHS already exists
    const existingKHS = await prisma.kHS.findFirst({
      where: {
        mahasiswaId,
        semesterId,
      },
    });

    if (existingKHS) {
      // Update existing KHS
      await prisma.kHS.update({
        where: { id: existingKHS.id },
        data: {
          ips,
          ipk,
          totalSKSSemester: sksSemester,
          totalSKSKumulatif: sksKumulatif,
        },
      });
    } else {
      // Create new KHS
      await prisma.kHS.create({
        data: {
          mahasiswaId,
          semesterId,
          ips,
          ipk,
          totalSKSSemester: sksSemester,
          totalSKSKumulatif: sksKumulatif,
        },
      });
    }
  }
};
