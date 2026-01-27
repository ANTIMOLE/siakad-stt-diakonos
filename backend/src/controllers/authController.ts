/**
 * Authentication Controller
 * ✅ UPDATED: Support for NIM (10 digits) and NIDN (10 digits)
 */

import { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { env } from '../config/env';
import { AuthRequest } from '../middlewares/authMiddleware';
import { asyncHandler, AppError } from '../middlewares/errorMiddleware';

// ============================================
// COOKIE OPTIONS
// ============================================
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
});

// ============================================
// LOGIN
// ============================================
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { identifier, password } = req.body;
  
  let user: any;
  let loginType: string;

  // ===== 10 DIGITS: NIM (Mahasiswa) or NIDN (Dosen) =====
  if (/^\d{10}$/.test(identifier)) {
    // ✅ Check both NIM and NIDN in parallel
    const [mahasiswa, dosen] = await Promise.all([
      prisma.mahasiswa.findUnique({
        where: { nim: identifier },
        include: { 
          user: true, 
          prodi: true,
          dosenWali: {
            select: {
              id: true,
              namaLengkap: true,
            },
          },
        },
      }),
      prisma.dosen.findUnique({
        where: { nidn: identifier },
        include: { user: true, prodi: true },
      }),
    ]);

    if (mahasiswa) {
      user = mahasiswa.user;
      user.mahasiswa = mahasiswa;
      loginType = 'nim';
    } else if (dosen) {
      user = dosen.user;
      user.dosen = dosen;
      loginType = 'nidn';
    } else {
      throw new AppError('NIM/NIDN atau password salah', 401);
    }

  // ===== 16 DIGITS: NUPTK (Dosen) =====
  } else if (/^\d{16}$/.test(identifier)) {
    const dosen = await prisma.dosen.findUnique({
      where: { nuptk: identifier },
      include: { user: true, prodi: true },
    });

    if (!dosen) {
      throw new AppError('NUPTK atau password salah', 401);
    }

    user = dosen.user;
    user.dosen = dosen;
    loginType = 'nuptk';

  // ===== USERNAME (Admin/Keuangan/Dosen) =====
  } else if (/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(identifier)) {
    const userByUsername = await prisma.user.findUnique({
      where: { username: identifier },
      include: {
        dosen: {
          include: {
            prodi: true,
          },
        },
      },
    });

    if (!userByUsername) {
      throw new AppError('Username atau password salah', 401);
    }

    if (userByUsername.role === 'MAHASISWA') {
      throw new AppError('Mahasiswa harus login menggunakan NIM', 403);
    }

    user = userByUsername;
    loginType = 'username';

  // ===== USER_ID (1-9 digits, for development) =====
  } else if (/^\d{1,9}$/.test(identifier)) {
    const userById = await prisma.user.findUnique({
      where: { id: Number(identifier) },
      include: {
        mahasiswa: {
          include: {
            prodi: true,
            dosenWali: {
              select: {
                id: true,
                namaLengkap: true,
              },
            },
          },
        },
        dosen: {
          include: {
            prodi: true,
          },
        },
      },
    });

    if (!userById) {
      throw new AppError('User tidak ditemukan', 401);
    }

    user = userById;
    loginType = 'id';

  } else {
    throw new AppError('Format identifier tidak valid', 400);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('Akun Anda telah dinonaktifkan', 403);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Identifier atau password salah', 401);
  }

  // ✅ Generate JWT token
  const token = jwt.sign(
    {
      userId: user.id,
      identifier: identifier,
      role: user.role,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );

  // ✅ SET HTTPONLY COOKIE
  res.cookie('token', token, getCookieOptions());

  // ✅ Prepare user data (WITHOUT TOKEN)
  const responseData = {
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      mahasiswa: user.mahasiswa ? {
        id: user.mahasiswa.id,
        nim: user.mahasiswa.nim,
        namaLengkap: user.mahasiswa.namaLengkap,
        angkatan: user.mahasiswa.angkatan,
        status: user.mahasiswa.status,
        prodi: user.mahasiswa.prodi,
        dosenWali: user.mahasiswa.dosenWali,
      } : null,
      dosen: user.dosen ? {
        id: user.dosen.id,
        nidn: user.dosen.nidn,
        nuptk: user.dosen.nuptk,
        namaLengkap: user.dosen.namaLengkap,
        status: user.dosen.status,
        prodi: user.dosen.prodi,
      } : null,
    },
  };

  res.status(200).json({
    success: true,
    message: 'Login berhasil',
    data: responseData,
  });
});

// ============================================
// REGISTER
// ============================================
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    password,
    role,
    username,
    namaLengkap,
    nim,
    nidn,
    nuptk,
    prodiId,
    angkatan,
  } = req.body;

  // ✅ Validate username for ADMIN/KEUANGAN
  if ((role === 'ADMIN' || role === 'KEUANGAN') && !username) {
    throw new AppError('Username wajib untuk role ADMIN atau KEUANGAN', 400);
  }

  // ✅ Validate username tidak boleh untuk MAHASISWA
  if (role === 'MAHASISWA' && username) {
    throw new AppError('Mahasiswa tidak boleh memiliki username', 400);
  }

  // ✅ Validate username format (must start with letter)
  if (username && !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(username)) {
    throw new AppError('Username harus diawali huruf dan hanya boleh mengandung huruf, angka, underscore, atau hyphen', 400);
  }

  // Check username already exists
  if (username) {
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      throw new AppError('Username sudah digunakan', 400);
    }
  }

  // Check NIM already exists
  if (role === 'MAHASISWA' && nim) {
    const existingMahasiswa = await prisma.mahasiswa.findUnique({
      where: { nim },
    });
    if (existingMahasiswa) {
      throw new AppError('NIM sudah digunakan', 400);
    }
  }

  // Check NIDN already exists
  if (role === 'DOSEN' && nidn) {
    const existingDosen = await prisma.dosen.findUnique({
      where: { nidn },
    });
    if (existingDosen) {
      throw new AppError('NIDN sudah digunakan', 400);
    }
  }

  // Check NUPTK already exists
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

  // Create user with profile
  const user = await prisma.user.create({
    data: {
      password: hashedPassword,
      role,
      username: username || null,
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

// ============================================
// GET CURRENT USER
// ============================================
export const getCurrentUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
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

// ============================================
// CHANGE PASSWORD
// ============================================
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

// ============================================
// LOGOUT
// ============================================
export const logout = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });

    res.status(200).json({
      success: true,
      message: 'Logout berhasil',
    });
  }
);

// ============================================
// REFRESH TOKEN
// ============================================
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

    res.cookie('token', token, getCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Token berhasil di-refresh',
    });
  }
);