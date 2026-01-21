/**
 * Authentication Controller (FIXED)
 * Handles login, register, get current user, change password, logout
 */

import { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { env } from '../config/env';
import { AuthRequest, LoginResponse, UserWithProfile } from '../types';
import { asyncHandler, AppError } from '../middlewares/errorMiddleware';


export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { identifier, password } = req.body;
  
 let user: any;

// ===== MAHASISWA (NIM = 10) =====
if (identifier.length === 10) {
  const mahasiswa = await prisma.mahasiswa.findUnique({
    where: { nim: identifier },
    include: { user: true, prodi: true },
  });

  if (!mahasiswa) {
    throw new AppError('NIM atau password salah', 401);
  }

  user = mahasiswa.user;
  user.mahasiswa = mahasiswa;

// ===== DOSEN (NUPTK = 16) =====
} else if (identifier.length === 16) {
  const dosen = await prisma.dosen.findUnique({
    where: { nuptk: identifier },
    include: { user: true, prodi: true },
  });

  if (!dosen) {
    throw new AppError('NUPTK atau password salah', 401);
  }

  user = dosen.user;
  user.dosen = dosen;

// ===== ADMIN / KEUANGAN (USER_ID) =====
} else {
  const userById = await prisma.user.findUnique({
    where: { id: Number(identifier) },
  });

  if (!userById) {
    throw new AppError('User tidak ditemukan', 401);
  }

  user = userById;
}


  // Cek user aktif
  if (!user.isActive) {
    throw new AppError('Akun Anda telah dinonaktifkan', 403);
  }

  // Verifikasi password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Identifier atau password salah', 401);
  }

  // Generate JWT token (TANPA EMAIL)
  const token = jwt.sign(
    {
      userId: user.id,
      identifier: identifier,
      role: user.role,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );

  // Prepare response
  let namaLengkap = '';
  if (user.mahasiswa) {
    namaLengkap = user.mahasiswa.namaLengkap;
  } else if (user.dosen) {
    namaLengkap = user.dosen.namaLengkap;
  }

  const responseData = {
    token,
    user: {
      id: user.id,
      role: user.role,
      nomorInduk: identifier,
      profile: {
        nama: namaLengkap || null,
      },
    },
  };


  res.status(200).json({
    success: true,
    message: 'Login berhasil',
    data: responseData,
  });
});

/**
 * POST /api/auth/register
 * Register new user (Admin only)
 */
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    password,
    role,
    namaLengkap,
    nim,
    nidn,
    nuptk,
    prodiId,
    angkatan,
  } = req.body;

  // Cek NIM/NIDN sudah ada
  if (role === 'MAHASISWA' && nim) {
    const existingMahasiswa = await prisma.mahasiswa.findUnique({
      where: { nim },
    });
    if (existingMahasiswa) {
      throw new AppError('NIM sudah digunakan', 400);
    }
  }

  if (role === 'DOSEN' && nidn) {
    const existingDosen = await prisma.dosen.findUnique({
      where: { nidn },
    });
    if (existingDosen) {
      throw new AppError('NIDN sudah digunakan', 400);
    }
  }

  if (role === 'DOSEN' && nuptk) {
    const existingNuptk = await prisma.dosen.findUnique({
      where: { nuptk },
    });
    if (existingNuptk) {
      throw new AppError('NUPTK sudah digunakan', 400);
    }
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user dengan profile
  const user = await prisma.user.create({
    data: {
      password: hashedPassword,
      role,
      isActive: true,
      
      ...(role === 'MAHASISWA' && {
        mahasiswa: {
          create: {
            nim: nim!,
            namaLengkap,
            prodiId: prodiId!,
            angkatan: angkatan!,
            status: 'AKTIF',
          },
        },
      }),
      
      ...(role === 'DOSEN' && {
        dosen: {
          create: {
            nidn: nidn!,
            nuptk: nuptk!,
            namaLengkap,
            prodiId,
            posisi: '',
            jafung: '',
            alumni: '',
            lamaMengajar: '',
            status: 'AKTIF',
          },
        },
      }),
    },
    include: {
      mahasiswa: { include: { prodi: true } },
      dosen: { include: { prodi: true } },
    },
  });

  const { password: _, ...userWithoutPassword } = user;

  res.status(201).json({
    success: true,
    message: 'User berhasil didaftarkan',
    data: userWithoutPassword,
  });
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
export const getCurrentUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        role: true,
        isActive: true,
        createdAt: true,
        mahasiswa: {
          select: {
            id: true,
            nim: true,
            namaLengkap: true,
            angkatan: true,
            status: true,
            prodi: {
              select: {
                id: true,
                kode: true,
                nama: true,
                jenjang: true,
              },
            },
            dosenWali: {
              select: {
                id: true,
                nidn: true,
                namaLengkap: true,
              },
            },
          },
        },
        dosen: {
          select: {
            id: true,
            nidn: true,
            nuptk: true,
            namaLengkap: true,
            status: true,
            prodi: {
              select: {
                id: true,
                kode: true,
                nama: true,
                jenjang: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User tidak ditemukan', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Data user berhasil diambil',
      data: user,
    });
  }
);

/**
 * POST /api/auth/change-password
 * Change user password
 */
export const changePassword = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }

    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      throw new AppError('Password baru tidak cocok dengan konfirmasi', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new AppError('User tidak ditemukan', 404);
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new AppError('Password lama tidak sesuai', 400);
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new AppError('Password baru tidak boleh sama dengan password lama', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    res.status(200).json({
      success: true,
      message: 'Password berhasil diubah',
    });
  }
);

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
export const logout = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Logout berhasil',
    });
  }
);


export const refreshToken = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }


    const token = jwt.sign(
      {
        userId: req.user.id,
        identifier: req.user.identifier, 
        role: req.user.role,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.status(200).json({
      success: true,
      message: 'Token berhasil di-refresh',
      data: { token },
    });
  }
);