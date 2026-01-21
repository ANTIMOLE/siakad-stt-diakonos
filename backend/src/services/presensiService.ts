/**
 * Presensi Service
 * Business logic for attendance management
 */

import prisma from '../config/database';
import { AppError } from '../middlewares/errorMiddleware';
import { StatusPresensi } from '@prisma/client';

/**
 * Create new presensi session for a class
 */
export const createPresensi = async (
  kelasMKId: number,
  pertemuan: number,
  tanggal: Date,
  materi?: string,
  catatan?: string
) => {
  // Check if kelas exists
  const kelasMK = await prisma.kelasMataKuliah.findUnique({
    where: { id: kelasMKId },
    include: {
      mataKuliah: true,
      dosen: true,
    },
  });

  if (!kelasMK) {
    throw new AppError('Kelas mata kuliah tidak ditemukan', 404);
  }

  // Validate pertemuan (1-16)
  if (pertemuan < 1 || pertemuan > 16) {
    throw new AppError('Pertemuan harus antara 1-16', 400);
  }

  // Check if pertemuan already exists for this class
  const existingPresensi = await prisma.presensi.findUnique({
    where: {
      kelasMKId_pertemuan: {
        kelasMKId,
        pertemuan,
      },
    },
  });

  if (existingPresensi) {
    throw new AppError(
      `Pertemuan ${pertemuan} sudah ada untuk kelas ini`,
      400
    );
  }

  // Get all mahasiswa enrolled in this class (from KRS)
  const enrolledMahasiswa = await prisma.kRSDetail.findMany({
    where: {
      kelasMKId,
      krs: {
        status: 'APPROVED', // Only approved KRS
      },
    },
    include: {
      krs: {
        select: {
          mahasiswaId: true,
        },
      },
    },
    distinct: ['krsId'],
  });

  // Create presensi with all enrolled students (default: ALPHA)
  const presensi = await prisma.presensi.create({
    data: {
      kelasMKId,
      pertemuan,
      tanggal,
      materi,
      catatan,
      detail: {
        create: enrolledMahasiswa.map((enrollment) => ({
          mahasiswaId: enrollment.krs.mahasiswaId,
          status: 'ALPHA', // Default status
        })),
      },
    },
    include: {
      kelasMK: {
        include: {
          mataKuliah: {
            select: {
              kodeMK: true,
              namaMK: true,
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

  return presensi;
};

/**
 * Update attendance status for students
 */
export const updatePresensiDetail = async (
  presensiId: number,
  updates: Array<{
    mahasiswaId: number;
    status: StatusPresensi;
    keterangan?: string;
  }>
) => {
  // Check if presensi exists
  const presensi = await prisma.presensi.findUnique({
    where: { id: presensiId },
  });

  if (!presensi) {
    throw new AppError('Presensi tidak ditemukan', 404);
  }

  // Update each student's attendance
  const updatePromises = updates.map((update) =>
    prisma.presensiDetail.updateMany({
      where: {
        presensiId,
        mahasiswaId: update.mahasiswaId,
      },
      data: {
        status: update.status,
        keterangan: update.keterangan,
      },
    })
  );

  await Promise.all(updatePromises);

  // Return updated presensi
  const updated = await prisma.presensi.findUnique({
    where: { id: presensiId },
    include: {
      kelasMK: {
        include: {
          mataKuliah: {
            select: {
              kodeMK: true,
              namaMK: true,
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

  return updated;
};

/**
 * Get presensi statistics for a student in a class
 */
export const getPresensiStatsMahasiswa = async (
  mahasiswaId: number,
  kelasMKId: number
) => {
  const presensiList = await prisma.presensiDetail.findMany({
    where: {
      mahasiswaId,
      presensi: {
        kelasMKId,
      },
    },
    include: {
      presensi: {
        select: {
          pertemuan: true,
          tanggal: true,
          materi: true,
        },
      },
    },
    orderBy: {
      presensi: {
        pertemuan: 'asc',
      },
    },
  });

  const totalPertemuan = presensiList.length;
  const hadir = presensiList.filter((p) => p.status === 'HADIR').length;
  const tidakHadir = presensiList.filter(
    (p) => p.status === 'TIDAK_HADIR'
  ).length;
  const izin = presensiList.filter((p) => p.status === 'IZIN').length;
  const sakit = presensiList.filter((p) => p.status === 'SAKIT').length;
  const alpha = presensiList.filter((p) => p.status === 'ALPHA').length;

  const persentaseKehadiran =
    totalPertemuan > 0 ? (hadir / totalPertemuan) * 100 : 0;

  return {
    totalPertemuan,
    hadir,
    tidakHadir,
    izin,
    sakit,
    alpha,
    persentaseKehadiran: parseFloat(persentaseKehadiran.toFixed(2)),
    detail: presensiList,
  };
};

/**
 * Get presensi statistics for entire class
 */
export const getPresensiStatsKelas = async (kelasMKId: number) => {
  const allPresensi = await prisma.presensi.findMany({
    where: { kelasMKId },
    include: {
      detail: {
        include: {
          mahasiswa: {
            select: {
              nim: true,
              namaLengkap: true,
            },
          },
        },
      },
    },
    orderBy: {
      pertemuan: 'asc',
    },
  });

  const totalPertemuan = allPresensi.length;

  // Calculate per-student statistics
  const studentStats = new Map<
    number,
    {
      mahasiswa: { nim: string; namaLengkap: string };
      hadir: number;
      tidakHadir: number;
      izin: number;
      sakit: number;
      alpha: number;
      persentase: number;
    }
  >();

  allPresensi.forEach((presensi) => {
    presensi.detail.forEach((detail) => {
      const existing = studentStats.get(detail.mahasiswaId) || {
        mahasiswa: detail.mahasiswa,
        hadir: 0,
        tidakHadir: 0,
        izin: 0,
        sakit: 0,
        alpha: 0,
        persentase: 0,
      };

      if (detail.status === 'HADIR') existing.hadir++;
      if (detail.status === 'TIDAK_HADIR') existing.tidakHadir++;
      if (detail.status === 'IZIN') existing.izin++;
      if (detail.status === 'SAKIT') existing.sakit++;
      if (detail.status === 'ALPHA') existing.alpha++;

      studentStats.set(detail.mahasiswaId, existing);
    });
  });

  // Calculate percentages
  const studentsArray = Array.from(studentStats.entries()).map(
    ([mahasiswaId, stats]) => ({
      mahasiswaId,
      ...stats,
      persentase:
        totalPertemuan > 0
          ? parseFloat(((stats.hadir / totalPertemuan) * 100).toFixed(2))
          : 0,
    })
  );

  // Sort by NIM
  studentsArray.sort((a, b) => a.mahasiswa.nim.localeCompare(b.mahasiswa.nim));

  return {
    totalPertemuan,
    totalMahasiswa: studentsArray.length,
    students: studentsArray,
  };
};

/**
 * Delete presensi session
 */
export const deletePresensi = async (presensiId: number) => {
  const presensi = await prisma.presensi.findUnique({
    where: { id: presensiId },
  });

  if (!presensi) {
    throw new AppError('Presensi tidak ditemukan', 404);
  }

  await prisma.presensi.delete({
    where: { id: presensiId },
  });

  return { message: 'Presensi berhasil dihapus' };
};