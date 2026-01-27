import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { asyncHandler, AppError } from '../middlewares/errorMiddleware';
import { generateKHSForMahasiswa } from '../services/nilaiService';
import { generatePDF, getKHSHTMLTemplate, getTranskripHTMLTemplate } from '../utils/pdfGenerator';
import { getPredikatIPK } from '../utils/hitungIPK';

// ============================================
// HELPER: Convert Decimal to Number
// ============================================
const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  // Handle Prisma Decimal
  if (typeof value === 'object' && 'toNumber' in value) {
    return value.toNumber();
  }
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// ============================================
// Convert KHS data to plain numbers
// ============================================
const normalizeKHS = (khs: any) => ({
  ...khs,
  ips: toNumber(khs.ips),
  ipk: toNumber(khs.ipk),
  totalSKS: toNumber(khs.totalSKS),
  totalSKSKumulatif: toNumber(khs.totalSKSKumulatif),
});

// ============================================
// Convert Nilai data to plain numbers
// ============================================
const normalizeNilai = (nilai: any) => ({
  ...nilai,
  nilaiAngka: toNumber(nilai.nilaiAngka),
  bobot: toNumber(nilai.bobot),
});

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

  // ✅ Normalize Decimal fields
  const normalizedList = khsList.map(normalizeKHS);

  res.status(200).json({
    success: true,
    message: 'Data KHS berhasil diambil',
    data: normalizedList,
  });
});

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

    // ✅ Normalize all Decimal fields
    const normalizedKHS = normalizeKHS(khs);
    const normalizedNilai = nilai.map(normalizeNilai);

    res.status(200).json({
      success: true,
      message: 'Data KHS berhasil diambil',
      data: {
        ...normalizedKHS,
        nilai: normalizedNilai,
        predikat: getPredikatIPK(normalizedKHS.ipk),
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
            dosen: {
              select: {
                namaLengkap: true,
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

    // ✅ Normalize all data
    const normalizedKHS = khsList.map(normalizeKHS);
    const normalizedNilai = allNilai.map(normalizeNilai);

    // Calculate final IPK
    const finalIPK = normalizedKHS.length > 0 ? normalizedKHS[normalizedKHS.length - 1].ipk : 0;
    const totalSKS = normalizedKHS.length > 0 ? normalizedKHS[normalizedKHS.length - 1].totalSKSKumulatif : 0;
    const predikat = getPredikatIPK(finalIPK);

    res.status(200).json({
      success: true,
      message: 'Data transkrip berhasil diambil',
      data: {
        mahasiswa,
        khs: normalizedKHS,
        nilai: normalizedNilai,
        summary: {
          finalIPK,
          totalSKS,
          predikat,
          totalSemester: normalizedKHS.length,
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

    // ✅ Normalize all Decimal fields before passing to template
    const normalizedKHS = normalizeKHS(khs);
    const normalizedNilai = nilai.map(normalizeNilai);

    // ✅ Calculate totalSKS from nilai if not in KHS
    const calculatedTotalSKS = normalizedNilai.reduce(
      (sum, n) => sum + (n.kelasMK?.mataKuliah?.sks || 0), 
      0
    );

    // Prepare data with predikat
    const khsData = {
      ...normalizedKHS,
      mahasiswa: khs.mahasiswa,
      semester: khs.semester,
      nilai: normalizedNilai,
      totalSKS: normalizedKHS.totalSKS || calculatedTotalSKS, // ✅ Use calculated if not in DB
      predikat: getPredikatIPK(normalizedKHS.ipk),
    };

    // Generate HTML
    const html = getKHSHTMLTemplate(khsData);
    
    // Generate filename
    const filename = `KHS_${khs.mahasiswa.nim}_${khs.semester.tahunAkademik.replace('/', '-')}_${khs.semester.periode}.pdf`;
    
    // Generate and send PDF
    await generatePDF(html, filename, res);
  }
);

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
            dosen: {
              select: {
                namaLengkap: true,
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

    // ✅ Normalize all data before PDF generation
    const normalizedKHS = khsList.map(normalizeKHS);
    const normalizedNilai = allNilai.map(normalizeNilai);

    // Calculate summary
    const finalIPK = normalizedKHS.length > 0 ? normalizedKHS[normalizedKHS.length - 1].ipk : 0;
    const totalSKS = normalizedKHS.length > 0 ? normalizedKHS[normalizedKHS.length - 1].totalSKSKumulatif : 0;
    const predikat = getPredikatIPK(finalIPK);

    const transkripData = {
      mahasiswa,
      khs: normalizedKHS,
      nilai: normalizedNilai,
      summary: {
        finalIPK,
        totalSKS,
        predikat,
        totalSemester: normalizedKHS.length,
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