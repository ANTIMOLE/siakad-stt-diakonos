/**
 * KHS Controller
 * Handles KHS (Kartu Hasil Studi) operations
 */

import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { asyncHandler, AppError } from '../middlewares/errorMiddleware';
import { generateKHSForMahasiswa } from '../services/nilaiService';
// import { hitungIPS, hitungIPK, getTotalSKS, getPredikatIPK } from '../utils/hitungIPK';
import { generatePDF, getKHSHTMLTemplate, getTranskripHTMLTemplate } from '../utils/pdfGenerator';
import { getPredikatIPK } from '../utils/hitungIPK';

/**
 * GET /api/khs
 * Get all KHS for a mahasiswa
 */
export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mahasiswaId } = req.query;

  if (!mahasiswaId) {
    throw new AppError('Mahasiswa ID wajib disediakan', 400);
  }

  const khsList = await prisma.kHS.findMany({
    where: {
      mahasiswaId: parseInt(mahasiswaId as string),
    },
    include: {
      semester: {
        select: {
          id: true,
          tahunAkademik: true,
          periode: true,
        },
      },
    },
    orderBy: {
      semester: {
        tahunAkademik: 'desc',
      },
    },
  });

  res.status(200).json({
    success: true,
    message: 'Data KHS berhasil diambil',
    data: khsList,
  });
});

/**
 * GET /api/khs/:id
 * Get KHS by ID with details
 */
export const getById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const khs = await prisma.kHS.findUnique({
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
                jenjang: true,
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
      },
    });

    if (!khs) {
      throw new AppError('KHS tidak ditemukan', 404);
    }

    // Get nilai for this semester
    const nilai = await prisma.nilai.findMany({
      where: {
        mahasiswaId: khs.mahasiswaId,
        kelasMK: {
          semesterId: khs.semesterId,
        },
        isFinalized: true,
      },
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
                namaLengkap: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Data KHS berhasil diambil',
      data: {
        ...khs,
        nilai,
        predikat: getPredikatIPK(Number(khs.ipk)),
      },
    });
  }
);

/**
 * POST /api/khs/generate
 * Generate KHS for mahasiswa (manual trigger or auto after nilai finalized)
 */
export const generate = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { mahasiswaIds, semesterId } = req.body;

    if (!Array.isArray(mahasiswaIds) || mahasiswaIds.length === 0) {
      throw new AppError('Mahasiswa IDs harus berupa array dan tidak boleh kosong', 400);
    }

    if (!semesterId) {
      throw new AppError('Semester ID wajib disediakan', 400);
    }

    // Generate KHS for all mahasiswa
    await generateKHSForMahasiswa(mahasiswaIds, semesterId);

    res.status(200).json({
      success: true,
      message: 'KHS berhasil di-generate',
      data: {
        totalMahasiswa: mahasiswaIds.length,
        semesterId,
      },
    });
  }
);

/**
 * GET /api/khs/transkrip/:mahasiswaId
 * Get full transcript (all KHS) for a mahasiswa
 */
export const getTranskrip = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { mahasiswaId } = req.params;

    // Get mahasiswa data
    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { id: parseInt(mahasiswaId) },
      include: {
        prodi: {
          select: {
            kode: true,
            nama: true,
            jenjang: true,
          },
        },
        dosenWali: {
          select: {
            namaLengkap: true,
          },
        },
      },
    });

    if (!mahasiswa) {
      throw new AppError('Mahasiswa tidak ditemukan', 404);
    }

    // Get all KHS
    const khsList = await prisma.kHS.findMany({
      where: {
        mahasiswaId: parseInt(mahasiswaId),
      },
      include: {
        semester: {
          select: {
            tahunAkademik: true,
            periode: true,
          },
        },
      },
      orderBy: {
        semester: {
          tahunAkademik: 'asc',
        },
      },
    });

    // Get all nilai
    const allNilai = await prisma.nilai.findMany({
      where: {
        mahasiswaId: parseInt(mahasiswaId),
        isFinalized: true,
      },
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
            semester: {
              select: {
                tahunAkademik: true,
                periode: true,
              },
            },
          },
        },
      },
      orderBy: {
        kelasMK: {
          semester: {
            tahunAkademik: 'asc',
          },
        },
      },
    });

    // Calculate final IPK
    const finalIPK = khsList.length > 0 ? khsList[khsList.length - 1].ipk : 0;
    const totalSKS = khsList.length > 0 ? khsList[khsList.length - 1].totalSKSKumulatif : 0;
    const predikat = getPredikatIPK(Number(finalIPK));

    res.status(200).json({
      success: true,
      message: 'Data transkrip berhasil diambil',
      data: {
        mahasiswa,
        khs: khsList,
        nilai: allNilai,
        summary: {
          finalIPK,
          totalSKS,
          predikat,
          totalSemester: khsList.length,
        },
      },
    });
  }
);

/**
 * GET /api/khs/:id/pdf
 * Download KHS as PDF
 */
export const downloadPDF = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Get KHS with full data
    const khs = await prisma.kHS.findUnique({
      where: { id: parseInt(id) },
      include: {
        mahasiswa: {
          include: {
            prodi: true,
          },
        },
        semester: true,
      },
    });

    if (!khs) {
      throw new AppError('KHS tidak ditemukan', 404);
    }

    // Get nilai for this semester
    const nilai = await prisma.nilai.findMany({
      where: {
        mahasiswaId: khs.mahasiswaId,
        kelasMK: {
          semesterId: khs.semesterId,
        },
        isFinalized: true,
      },
      include: {
        kelasMK: {
          include: {
            mataKuliah: true,
            dosen: {
              select: {
                namaLengkap: true,
              },
            },
          },
        },
      },
    });

    // Prepare data with predikat
    const khsData = {
      ...khs,
      nilai,
      predikat: getPredikatIPK(Number(khs.ipk)),
    };

    // Generate HTML
    const html = getKHSHTMLTemplate(khsData);
    
    // Generate filename
    const filename = `KHS_${khs.mahasiswa.nim}_${khs.semester.tahunAkademik.replace('/', '-')}.pdf`;
    
    // Generate and send PDF
    await generatePDF(html, filename, res);
  }
);

/**
 * GET /api/khs/transkrip/:mahasiswaId/pdf
 * Download full transcript as PDF
 * ✅ FIXED: Sudah pakai PDF generator
 */
export const downloadTranskripPDF = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { mahasiswaId } = req.params;

    // Get mahasiswa data
    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { id: parseInt(mahasiswaId) },
      include: {
        prodi: true,
        dosenWali: true,
      },
    });

    if (!mahasiswa) {
      throw new AppError('Mahasiswa tidak ditemukan', 404);
    }

    // Get all KHS
    const khsList = await prisma.kHS.findMany({
      where: {
        mahasiswaId: parseInt(mahasiswaId),
      },
      include: {
        semester: true,
      },
      orderBy: {
        semester: {
          tahunAkademik: 'asc',
        },
      },
    });

    // Get all nilai
    const allNilai = await prisma.nilai.findMany({
      where: {
        mahasiswaId: parseInt(mahasiswaId),
        isFinalized: true,
      },
      include: {
        kelasMK: {
          include: {
            mataKuliah: true,
            semester: true,
          },
        },
      },
      orderBy: {
        kelasMK: {
          semester: {
            tahunAkademik: 'asc',
          },
        },
      },
    });

    // Calculate summary
    const finalIPK = khsList.length > 0 ? khsList[khsList.length - 1].ipk : 0;
    const totalSKS = khsList.length > 0 ? khsList[khsList.length - 1].totalSKSKumulatif : 0;
    const predikat = getPredikatIPK(Number(finalIPK));

    const transkripData = {
      mahasiswa,
      khs: khsList,
      nilai: allNilai,
      summary: {
        finalIPK,
        totalSKS,
        predikat,
        totalSemester: khsList.length,
      },
    };

    // Generate HTML
    const html = getTranskripHTMLTemplate(transkripData);
    
    // Generate filename
    const filename = `Transkrip_${mahasiswa.nim}.pdf`;
    
    // Generate and send PDF
    await generatePDF(html, filename, res);
  }
);