/**
 * Kelas MK File Service
 * Business logic for file management
 * 
 * ✅ FIXED: Allow multiple MATERI files per week (PPT, PDF, exercises, etc.)
 */

import prisma from '../config/database';
import { AppError } from '../middlewares/errorMiddleware';
import { TipeFileKelas } from '@prisma/client';
import fs from 'fs';
import path from 'path';

/**
 * Check if dosen owns the class
 */
async function checkDosenOwnership(dosenId: number, kelasMKId: number) {
  const kelas = await prisma.kelasMataKuliah.findFirst({
    where: {
      id: kelasMKId,
      dosenId,
    },
  });

  if (!kelas) {
    throw new AppError(
      'Anda tidak memiliki akses ke kelas ini',
      403
    );
  }

  return kelas;
}

/**
 * Check if mahasiswa is enrolled in class
 */
async function checkMahasiswaEnrolled(mahasiswaId: number, kelasMKId: number) {
  const enrollment = await prisma.kRSDetail.findFirst({
    where: {
      kelasMKId,
      krs: {
        mahasiswaId,
        status: 'APPROVED',
      },
    },
  });

  if (!enrollment) {
    throw new AppError('Anda tidak terdaftar di kelas ini', 403);
  }

  return enrollment;
}

/**
 * Upload file
 */
export async function uploadFile(
  dosenId: number,
  kelasMKId: number,
  tipeFile: TipeFileKelas,
  namaFile: string,
  fileUrl: string,
  mingguKe?: number,
  keterangan?: string
) {
  // Check ownership
  await checkDosenOwnership(dosenId, kelasMKId);

  // Validate MATERI requires mingguKe
  if (tipeFile === 'MATERI' && !mingguKe) {
    throw new AppError('Minggu ke wajib diisi untuk MATERI', 400);
  }

  // ✅ FIXED: Only check duplicate for RPS/RPP (single file policy)
  // MATERI can have multiple files per week (PPT, PDF, exercises, etc.)
  if (tipeFile === 'RPS' || tipeFile === 'RPP') {
    const existing = await prisma.kelasMKFile.findFirst({
      where: {
        kelasMKId,
        tipeFile,
      },
    });

    if (existing) {
      throw new AppError(
        `${tipeFile} sudah ada untuk kelas ini. Hapus file lama terlebih dahulu.`,
        400
      );
    }
  }

  // ✅ NO duplicate check for MATERI - allow multiple files per week!
  // Dosen can upload: PPT, PDF, Handout, Exercises, etc. for same week

  // Create file record
  const file = await prisma.kelasMKFile.create({
    data: {
      kelasMKId,
      tipeFile,
      namaFile,
      fileUrl,
      mingguKe,
      keterangan,
      uploadedById: dosenId,
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
        },
      },
      uploadedBy: {
        select: {
          namaLengkap: true,
        },
      },
    },
  });

  return file;
}

/**
 * Delete file
 */
export async function deleteFile(fileId: number, dosenId: number) {
  // Get file
  const file = await prisma.kelasMKFile.findUnique({
    where: { id: fileId },
    include: {
      kelasMK: {
        select: {
          dosenId: true,
        },
      },
    },
  });

  if (!file) {
    throw new AppError('File tidak ditemukan', 404);
  }

  // Check ownership
  if (file.uploadedById !== dosenId) {
    throw new AppError('Anda tidak memiliki akses untuk menghapus file ini', 403);
  }

  // Delete from disk
  const filePath = path.join(__dirname, '../..', file.fileUrl);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Delete from database
  await prisma.kelasMKFile.delete({
    where: { id: fileId },
  });

  return true;
}

/**
 * Rename file (display name only)
 */
export async function renameFile(
  fileId: number,
  dosenId: number,
  namaFile: string
) {
  // Get file
  const file = await prisma.kelasMKFile.findUnique({
    where: { id: fileId },
  });

  if (!file) {
    throw new AppError('File tidak ditemukan', 404);
  }

  // Check ownership
  if (file.uploadedById !== dosenId) {
    throw new AppError('Anda tidak memiliki akses untuk mengubah file ini', 403);
  }

  // Update display name only
  const updatedFile = await prisma.kelasMKFile.update({
    where: { id: fileId },
    data: { namaFile },
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
      uploadedBy: {
        select: {
          namaLengkap: true,
        },
      },
    },
  });

  return updatedFile;
}

/**
 * Get files by class (for Dosen)
 */
export async function getFilesByKelasForDosen(
  kelasMKId: number,
  dosenId: number,
  tipeFile?: TipeFileKelas
) {
  // Check ownership
  await checkDosenOwnership(dosenId, kelasMKId);

  // Build where clause
  const where: any = { kelasMKId };
  if (tipeFile) {
    where.tipeFile = tipeFile;
  }

  // Get files
  const files = await prisma.kelasMKFile.findMany({
    where,
    orderBy: [
      { tipeFile: 'asc' },
      { mingguKe: 'asc' },
      { uploadedAt: 'desc' },
    ],
    include: {
      uploadedBy: {
        select: {
          namaLengkap: true,
        },
      },
    },
  });

  return files;
}

/**
 * Get files by class (for Mahasiswa)
 */
export async function getFilesByKelasForMahasiswa(
  kelasMKId: number,
  mahasiswaId: number,
  tipeFile?: TipeFileKelas
) {
  // Check enrollment
  await checkMahasiswaEnrolled(mahasiswaId, kelasMKId);

  // Build where clause
  const where: any = { kelasMKId };
  if (tipeFile) {
    where.tipeFile = tipeFile;
  }

  // Get files
  const files = await prisma.kelasMKFile.findMany({
    where,
    orderBy: [
      { tipeFile: 'asc' },
      { mingguKe: 'asc' },
      { uploadedAt: 'desc' },
    ],
    include: {
      uploadedBy: {
        select: {
          namaLengkap: true,
        },
      },
    },
  });

  return files;
}

/**
 * Get files count by class
 */
export async function getFilesCountByKelas(kelasMKId: number) {
  const count = await prisma.kelasMKFile.count({
    where: { kelasMKId },
  });

  return count;
}