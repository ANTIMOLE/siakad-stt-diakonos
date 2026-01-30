/**
 * Nilai Controller
 * Handles grading operations
 */
import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { asyncHandler, AppError } from '../middlewares/errorMiddleware';
import * as nilaiService from '../services/nilaiService';
/**
 * GET /api/nilai/kelas/:kelasId
 * Get all nilai for a specific kelas
 * ✅ FIXED: Filter KRS by semester to avoid duplicate students from old KRS
 */
export const getByKelas = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { kelasId } = req.params;
    // Validate kelas exists
    const kelasMK = await prisma.kelasMataKuliah.findUnique({
      where: { id: parseInt(kelasId) },
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
    });
    if (!kelasMK) {
      throw new AppError('Kelas mata kuliah tidak ditemukan', 404);
    }
    // ✅ FIXED: Get students ONLY from KRS of the SAME SEMESTER as the kelas
    const krsDetails = await prisma.kRSDetail.findMany({
      where: {
        kelasMKId: parseInt(kelasId),
        krs: {
          status: 'APPROVED',
          semesterId: kelasMK.semesterId, // ✅ ADD THIS - Same semester only!
        },
      },
      include: {
        krs: {
          include: {
            mahasiswa: {
              select: {
                id: true,
                nim: true,
                namaLengkap: true,
              },
            },
          },
        },
      },
    });
    // Get existing nilai
    const nilaiList = await prisma.nilai.findMany({
      where: {
        kelasMKId: parseInt(kelasId),
      },
    });
    // Create a map for quick lookup
    const nilaiMap = new Map(nilaiList.map((n) => [n.mahasiswaId, n]));
    // Combine student data with nilai
    const result = krsDetails.map((detail) => {
      const mahasiswa = detail.krs.mahasiswa;
      const nilai = nilaiMap.get(mahasiswa.id);
      return {
        mahasiswaId: mahasiswa.id,
        nim: mahasiswa.nim,
        namaLengkap: mahasiswa.namaLengkap,
        nilaiId: nilai?.id || null,
        nilaiAngka: nilai?.nilaiAngka || null,
        nilaiHuruf: nilai?.nilaiHuruf || null,
        bobot: nilai?.bobot || null,
        isFinalized: nilai?.isFinalized || false,
      };
    });
    res.status(200).json({
      success: true,
      message: 'Data nilai berhasil diambil',
      data: {
        kelas: kelasMK,
        mahasiswa: result,
        totalMahasiswa: result.length,
        totalDinilai: nilaiList.length,
        isAllFinalized: nilaiList.length > 0 && nilaiList.every((n) => n.isFinalized),
      },
    });
  }
);
/**
 * POST /api/nilai/kelas/:kelasId
 * Batch save nilai for a class
 */
export const saveNilai = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { kelasId } = req.params;
    const { nilai } = req.body;
    if (!Array.isArray(nilai) || nilai.length === 0) {
      throw new AppError('Data nilai harus berupa array dan tidak boleh kosong', 400);
    }
    // Validate all nilai entries
    for (const item of nilai) {
      if (!item.mahasiswaId || item.nilaiAngka === undefined) {
        throw new AppError('Setiap nilai harus memiliki mahasiswaId dan nilaiAngka', 400);
      }
      if (item.nilaiAngka < 0 || item.nilaiAngka > 100) {
        throw new AppError('Nilai angka harus antara 0-100', 400);
      }
    }
    // Check if nilai already finalized
    const existingNilai = await prisma.nilai.findFirst({
      where: {
        kelasMKId: parseInt(kelasId),
        isFinalized: true,
      },
    });
    if (existingNilai) {
      throw new AppError(
        'Nilai sudah difinalisasi. Silakan unlock terlebih dahulu untuk mengedit',
        400
      );
    }
    // Batch save
    const results = await nilaiService.batchSaveNilai(parseInt(kelasId), nilai, req.user!.id);
    res.status(200).json({
      success: true,
      message: 'Nilai berhasil disimpan',
      data: {
        totalSaved: results.length,
        nilai: results,
      },
    });
  }
);
/**
 * POST /api/nilai/kelas/:kelasId/finalize
 * Finalize nilai for a class (lock and generate KHS)
 */
export const finalize = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { kelasId } = req.params;
    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }
    // Get dosen ID from user
    const dosen = await prisma.dosen.findFirst({
      where: { userId: req.user.id },
    });
    if (!dosen) {
      throw new AppError('Data dosen tidak ditemukan', 404);
    }
    const result = await nilaiService.finalizeNilai(parseInt(kelasId), dosen.id);
    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  }
);
/**
 * POST /api/nilai/kelas/:kelasId/unlock
 * Unlock nilai to allow editing
 */
export const unlock = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { kelasId } = req.params;
    const result = await nilaiService.unlockNilai(parseInt(kelasId));
    res.status(200).json({
      success: true,
      message: result.message,
    });
  }
);