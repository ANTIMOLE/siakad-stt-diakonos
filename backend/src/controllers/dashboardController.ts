import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middlewares/errorMiddleware';

export const getAdminStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const activeSemester = await prisma.semester.findFirst({
      where: { isActive: true },
    });

    const [totalMahasiswa, mahasiswaAktif] = await Promise.all([
      prisma.mahasiswa.count(),
      prisma.mahasiswa.count({
        where: { status: 'AKTIF' },
      }),
    ]);

    const [totalDosen, dosenAktif] = await Promise.all([
      prisma.dosen.count(),
      prisma.dosen.count({
        where: { status: 'AKTIF' },
      }),
    ]);

    const totalMataKuliah = await prisma.mataKuliah.count({
      where: { isActive: true }
    });

    const mataKuliahAktif = totalMataKuliah;

    const [krsPending, krsApproved, krsRejected] = await Promise.all([
      prisma.kRS.count({
        where: { status: 'SUBMITTED' },
      }),
      prisma.kRS.count({
        where: { status: 'APPROVED' },
      }),
      prisma.kRS.count({
        where: { status: 'REJECTED' },
      }),
    ]);

    const recentKRS = await prisma.kRS.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        mahasiswa: {
          select: {
            nim: true,
            namaLengkap: true,
          },
        },
      },
    });

    const recentActivities = recentKRS.map((krs) => ({
      id: krs.id,
      type: 'KRS',
      description: `KRS ${krs.mahasiswa.namaLengkap} - ${krs.status}`,
      user: krs.mahasiswa.namaLengkap,
      timestamp: krs.updatedAt,
    }));

    res.status(200).json({
      success: true,
      message: 'Dashboard admin berhasil diambil',
      data: {
        totalMahasiswa,
        mahasiswaAktif,
        totalDosen,
        dosenAktif,
        totalMataKuliah,
        mataKuliahAktif,
        krsPending,
        krsApproved,
        krsRejected,
        semesterAktif: activeSemester,
        recentActivities,
      },
    });
  }
);

export const getDosenStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const dosen = await prisma.dosen.findUnique({
      where: { userId },
      include: {
        _count: {
          select: {
            mahasiswaBimbingan: true,
            kelasMataKuliah: true,
          },
        },
      },
    });

    if (!dosen) {
      return res.status(404).json({
        success: false,
        message: 'Data dosen tidak ditemukan',
      });
    }

    const activeSemester = await prisma.semester.findFirst({
      where: { isActive: true },
    });

    const mahasiswaAktif = await prisma.mahasiswa.count({
      where: {
        dosenWaliId: dosen.id,
        status: 'AKTIF',
      },
    });

    const totalKelasMengajar = activeSemester
      ? await prisma.kelasMataKuliah.count({
          where: {
            dosenId: dosen.id,
            semesterId: activeSemester.id,
          },
        })
      : 0;

    const krsPendingApproval = await prisma.kRS.count({
      where: {
        status: 'SUBMITTED',
        mahasiswa: {
          dosenWaliId: dosen.id,
        },
      },
    });

    const today = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayName = days[today.getDay()] as any;

    const jadwalHariIni = activeSemester
      ? await prisma.kelasMataKuliah.findMany({
          where: {
            dosenId: dosen.id,
            semesterId: activeSemester.id,
            hari: todayName,
          },
          include: {
            mataKuliah: {
              select: {
                kodeMK: true,
                namaMK: true,
                sks: true,
              },
            },
            ruangan: {
              select: {
                nama: true,
              },
            },
          },
        })
      : [];

    res.status(200).json({
      success: true,
      message: 'Dashboard dosen berhasil diambil',
      data: {
        totalMahasiswaBimbingan: dosen._count.mahasiswaBimbingan,
        mahasiswaAktif,
        totalKelasMengajar,
        krsPendingApproval,
        semesterAktif: activeSemester,
        jadwalHariIni,
      },
    });
  }
);

export const getMahasiswaStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { userId },
      include: {
        prodi: {
          select: {
            kode: true,
            nama: true,
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
      return res.status(404).json({
        success: false,
        message: 'Data mahasiswa tidak ditemukan',
      });
    }

    const activeSemester = await prisma.semester.findFirst({
      where: { isActive: true },
    });

    const latestKHS = await prisma.kHS.findFirst({
      where: { mahasiswaId: mahasiswa.id },
      orderBy: { semesterId: 'desc' }, 
    });

    const totalSKSLulus = latestKHS?.totalSKSKumulatif || 0;

    let krsStatus = null;
    if (activeSemester) {
      const activeKRS = await prisma.kRS.findFirst({
        where: {
          mahasiswaId: mahasiswa.id,
          semesterId: activeSemester.id,
        },
        orderBy: { updatedAt: 'desc' },
      });
      krsStatus = activeKRS?.status || null;
    }

    const today = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayName = days[today.getDay()] as any;

    let jadwalHariIni: any[] = [];
    if (activeSemester) {
      const activeKRS = await prisma.kRS.findFirst({
        where: {
          mahasiswaId: mahasiswa.id,
          semesterId: activeSemester.id,
          status: 'APPROVED',
        },
        include: {
          detail: {
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
                  ruangan: {
                    select: {
                      nama: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (activeKRS?.detail) {
        jadwalHariIni = activeKRS.detail
          .map((d) => d.kelasMK)
          .filter((k) => k !== null && k.hari === todayName);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Dashboard mahasiswa berhasil diambil',
      data: {
        nim: mahasiswa.nim,
        nama: mahasiswa.namaLengkap,
        prodi: mahasiswa.prodi.nama,
        angkatan: mahasiswa.angkatan,
        dosenWali: mahasiswa.dosenWali?.namaLengkap || null,
        ips: latestKHS?.ips || null,
        ipk: latestKHS?.ipk || null,
        totalSKSLulus,
        krsStatus,
        jadwalHariIni,
      },
    });
  }
);