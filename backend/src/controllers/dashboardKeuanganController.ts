/**
 * Dashboard Keuangan Controller
 * Provides statistics for keuangan dashboard
 * ✅ UPDATED: Supports all payment types
 */

import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middlewares/errorMiddleware';
import * as pembayaranService from '../services/pembayaranService';


export const getKeuanganStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    // Get active semester
    const activeSemester = await prisma.semester.findFirst({
      where: { isActive: true },
    });


    const pembayaranStats = activeSemester
      ? await pembayaranService.getPembayaranStats(activeSemester.id)
      : {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          totalNominal: 0,
        };


    const recentPembayaran = await prisma.pembayaran.findMany({
      where: activeSemester ? { semesterId: activeSemester.id } : {},
      take: 10,
      orderBy: { uploadedAt: 'desc' },
      include: {
        mahasiswa: {
          select: {
            nim: true,
            namaLengkap: true,
          },
        },
      },
    });

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);


    const [todayReceived, todayVerified, todayRejected] = await Promise.all([
      prisma.pembayaran.count({
        where: {
          uploadedAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.pembayaran.count({
        where: {
          status: 'APPROVED',
          verifiedAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.pembayaran.count({
        where: {
          status: 'REJECTED',
          verifiedAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
    ]);


    let mahasiswaStats = {
      totalMahasiswa: 0,
      sudahBayar: 0,
      belumBayar: 0,
    };

    if (activeSemester) {
      const totalMahasiswa = await prisma.mahasiswa.count({
        where: { status: { in: ['AKTIF', 'CUTI'] } },
      });


      const sudahBayar = await prisma.pembayaran.count({
        where: {
          semesterId: activeSemester.id,
          jenisPembayaran: 'KRS', 
          status: 'APPROVED',
        },
      });

      mahasiswaStats = {
        totalMahasiswa,
        sudahBayar,
        belumBayar: totalMahasiswa - sudahBayar,
      };
    }

    const recentActivities = recentPembayaran.map((p) => ({
      id: p.id,
      type: p.status === 'PENDING' 
        ? 'RECEIVED' 
        : p.status === 'APPROVED' 
        ? 'APPROVED' 
        : 'REJECTED',
      mahasiswa: {
        nim: p.mahasiswa?.nim || '-',
        nama: p.mahasiswa?.namaLengkap || '-',
      },
      nominal: p.nominal,
      jenisPembayaran: p.jenisPembayaran,
      catatan: p.catatan,
      timestamp: p.uploadedAt,
    }));

    res.status(200).json({
      success: true,
      message: 'Dashboard keuangan berhasil diambil',
      data: {
        // Overall stats
        totalPembayaran: pembayaranStats.total,
        pending: pembayaranStats.pending,
        approved: pembayaranStats.approved,
        rejected: pembayaranStats.rejected,
        totalNominal: pembayaranStats.totalNominal,

        // Today's activity
        todayStats: {
          received: todayReceived,
          verified: todayVerified,
          rejected: todayRejected,
        },

        // Semester-specific stats (KRS only)
        semesterStats: mahasiswaStats,

        // Recent activities
        recentActivities,

        // Include active semester info
        activeSemester,
      },
    });
  }
);