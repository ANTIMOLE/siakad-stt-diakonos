/**
 * Authentication Controller - SECURITY HARDENED
 * horter token expiry, better validation
 */

import { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { env } from '../config/env';
import { AuthRequest } from '../middlewares/authMiddleware';
import { asyncHandler, AppError } from '../middlewares/errorMiddleware';

// ============================================
// COOKIE OPTIONS - SECURITY HARDENED
// ============================================
const getCookieOptions = () => ({
  httpOnly: true,  // Prevent XSS
  secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
  sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',  // ✅ CSRF protection
  maxAge: 24 * 60 * 60 * 1000,  // ✅ REDUCED: 1 day instead of 7 days
  path: '/',
  // DDED: Domain restriction in production
  ...(process.env.NODE_ENV === 'production' && {
    domain: process.env.COOKIE_DOMAIN || undefined,
  }),
});

// ============================================
// LOGIN - With additional security
// ============================================
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { identifier, password } = req.body;
  
  // SECURITY: Normalize identifier (trim, lowercase for username)
  const normalizedIdentifier = identifier.trim();
  
  let user: any;
  let loginType: string;

  // ===== 10 DIGITS: NIM (Mahasiswa) or NIDN (Dosen) =====
  if (/^\d{10}$/.test(normalizedIdentifier)) {
    const [mahasiswa, dosen] = await Promise.all([
      prisma.mahasiswa.findUnique({
        where: { nim: normalizedIdentifier },
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
        where: { nidn: normalizedIdentifier },
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
      // SECURITY: Generic error message to prevent user enumeration
      throw new AppError('Identifier atau password salah', 401);
    }

  // ===== 16 DIGITS: NUPTK (Dosen) =====
  } else if (/^\d{16}$/.test(normalizedIdentifier)) {
    const dosen = await prisma.dosen.findUnique({
      where: { nuptk: normalizedIdentifier },
      include: { user: true, prodi: true },
    });

    if (!dosen) {
      throw new AppError('Identifier atau password salah', 401);
    }

    user = dosen.user;
    user.dosen = dosen;
    loginType = 'nuptk';

  // ===== USERNAME (Admin/Keuangan/Dosen) =====
  } else if (/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(normalizedIdentifier)) {
    const userByUsername = await prisma.user.findUnique({
      where: { username: normalizedIdentifier.toLowerCase() },  // Case-insensitive
      include: {
        dosen: {
          include: {
            prodi: true,
          },
        },
      },
    });

    if (!userByUsername) {
      throw new AppError('Identifier atau password salah', 401);
    }

    if (userByUsername.role === 'MAHASISWA') {
      throw new AppError('Mahasiswa harus login menggunakan NIM', 403);
    }

    user = userByUsername;
    loginType = 'username';

  // ===== USER_ID (1-9 digits, for development only) =====
  } else if (/^\d{1,9}$/.test(normalizedIdentifier) && process.env.NODE_ENV === 'development') {
    const userById = await prisma.user.findUnique({
      where: { id: Number(normalizedIdentifier) },
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

  // SECURITY: Check if user is active BEFORE password check
  if (!user.isActive) {
    throw new AppError('Akun Anda telah dinonaktifkan', 403);
  }

  // SECURITY: Verify password (timing-safe comparison via bcrypt)
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    // Generic error message
    throw new AppError('Identifier atau password salah', 401);
  }

  // Generate JWT token with shorter expiry
  const token = jwt.sign(
    {
      userId: user.id,
      identifier: normalizedIdentifier,
      role: user.role,
      // ADDED: Issued at timestamp for token rotation
      iat: Math.floor(Date.now() / 1000),
    },
    env.JWT_SECRET,
    { expiresIn: '1d' }  // 1 day instead of 7
  );

  // SET HTTPONLY COOKIE
  res.cookie('token', token, getCookieOptions());

  // SECURITY: Log successful login (optional, for audit trail)
  console.log(`Login successful: User ${user.id} (${user.role}) via ${loginType}`);

  // Prepare user data (NO PASSWORD, NO SENSITIVE INFO)
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
// REGISTER - With improved validation
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

  // SECURITY: Validate password strength
  if (password.length < 8) {
    throw new AppError('Password minimal 8 karakter', 400);
  }

  // SECURITY: Check for common weak passwords
  const weakPasswords = ['password', '12345678', 'qwerty123', 'admin123'];
  if (weakPasswords.includes(password.toLowerCase())) {
    throw new AppError('Password terlalu lemah, gunakan kombinasi yang lebih kuat', 400);
  }

  // Validate username for ADMIN/KEUANGAN
  if ((role === 'ADMIN' || role === 'KEUANGAN') && !username) {
    throw new AppError('Username wajib untuk role ADMIN atau KEUANGAN', 400);
  }

  // Validate username tidak boleh untuk MAHASISWA
  if (role === 'MAHASISWA' && username) {
    throw new AppError('Mahasiswa tidak boleh memiliki username', 400);
  }

  // Validate username format (must start with letter)
  if (username && !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(username)) {
    throw new AppError('Username harus diawali huruf dan hanya boleh mengandung huruf, angka, underscore, atau hyphen', 400);
  }

  // SECURITY: Normalize username to lowercase
  const normalizedUsername = username?.toLowerCase();

  // Check username already exists (case-insensitive)
  if (normalizedUsername) {
    const existingUsername = await prisma.user.findUnique({
      where: { username: normalizedUsername },
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

  // SECURITY: Hash password with higher cost factor
  const hashedPassword = await bcrypt.hash(password, 12);  // Increased from 10 to 12

  // Create user with profile
  const user = await prisma.user.create({
    data: {
      password: hashedPassword,
      role,
      username: normalizedUsername || null,
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

  // ✅ SECURITY: Don't return password
  const { password: _, ...userWithoutPassword } = user;

  // SECURITY: Log user creation for audit
  console.log(`User registered: ${user.id} (${role}) by Admin ${req.user?.id}`);

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
// CHANGE PASSWORD - With improved security
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

    // SECURITY: Validate new password strength
    if (newPassword.length < 8) {
      throw new AppError('Password baru minimal 8 karakter', 400);
    }

    // SECURITY: Check for weak passwords
    const weakPasswords = ['password', '12345678', 'qwerty123', 'admin123'];
    if (weakPasswords.includes(newPassword.toLowerCase())) {
      throw new AppError('Password terlalu lemah, gunakan kombinasi yang lebih kuat', 400);
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

    // SECURITY: Hash with higher cost
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    // SECURITY: Invalidate current session by clearing cookie
    res.clearCookie('token', getCookieOptions());

    // SECURITY: Log password change
    console.log(`Password changed: User ${user.id}`);

    res.status(200).json({
      success: true,
      message: 'Password berhasil diubah. Silakan login kembali.',
    });
  }
);

// ============================================
// LOGOUT
// ============================================
export const logout = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    //SECURITY: Clear cookie with same options used to set it
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });

    //SECURITY: Log logout for audit
    if (req.user) {
      console.log(`Logout: User ${req.user.id}`);
    }

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

    // ✅ SECURITY: Generate new token with fresh timestamp
    const token = jwt.sign(
      {
        userId: req.user.id,
        identifier: req.user.identifier, 
        role: req.user.role,
        iat: Math.floor(Date.now() / 1000),
      },
      env.JWT_SECRET,
      { expiresIn: '1d' } 
    );

    res.cookie('token', token, getCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Token berhasil di-refresh',
    });
  }
);

// ============================================
// CHANGE USERNAME
// ============================================
export const changeUsername = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }

    const { newUsername } = req.body;

    // Role check
    if (req.user.role !== 'ADMIN' && req.user.role !== 'KEUANGAN') {
      throw new AppError(
        'Hanya Admin dan Staff Keuangan yang dapat mengubah username',
        403
      );
    }

    // Validation
    if (!newUsername || newUsername.length < 3) {
      throw new AppError('Username minimal 3 karakter', 400);
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(newUsername)) {
      throw new AppError(
        'Username harus diawali huruf dan hanya boleh mengandung huruf, angka, underscore, atau hyphen',
        400
      );
    }

    //SECURITY: Normalize to lowercase
    const normalizedUsername = newUsername.toLowerCase();

    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!currentUser) {
      throw new AppError('User tidak ditemukan', 404);
    }

    if (currentUser.username === normalizedUsername) {
      throw new AppError('Username baru sama dengan username saat ini', 400);
    }

    // Check if username already taken
    const existingUser = await prisma.user.findFirst({
      where: {
        username: normalizedUsername,
        id: { not: req.user.id },
      },
    });

    if (existingUser) {
      throw new AppError('Username sudah digunakan', 400);
    }

    // Update username
    await prisma.user.update({
      where: { id: req.user.id },
      data: { username: normalizedUsername },
    });

    //SECURITY: Log username change
    console.log(`Username changed: User ${req.user.id} → ${normalizedUsername}`);

    res.status(200).json({
      success: true,
      message: 'Username berhasil diubah',
      data: {
        username: normalizedUsername,
      },
    });
  }
);