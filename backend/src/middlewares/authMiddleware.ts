/**
 * Authentication Middleware (FIXED)
 * JWT token verification and user attachment
 * ✅ FIXED: Tambah identifier di req.user
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import prisma from '../config/database';

// ✅ Interface yang BENAR (pakai ini, bukan yang di types/index.ts)
export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: 'ADMIN' | 'DOSEN' | 'MAHASISWA' | 'KEUANGAN';
    identifier?: string; // NIM atau NUPTK
  };
}

interface JwtPayload {
  userId: number;
  role: 'ADMIN' | 'DOSEN' | 'MAHASISWA' | 'KEUANGAN';
  identifier?: string;
}

/**
 * Authenticate middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan. Silakan login terlebih dahulu.',
      });
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Format token tidak valid.',
      });
      return;
    }

    // Verify token
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          message: 'Token telah kadaluarsa. Silakan login kembali.',
        });
        return;
      }
      
      res.status(401).json({
        success: false,
        message: 'Token tidak valid.',
      });
      return;
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User tidak ditemukan.',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Akun Anda telah dinonaktifkan.',
      });
      return;
    }

    // ✅ FIXED: Attach user dengan identifier
    req.user = {
      id: user.id,
      role: user.role,
      identifier: decoded.identifier, // ✅ TAMBAH INI
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat verifikasi token.',
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token exists, but doesn't require it
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  try {
    await authenticate(req, res, next);
  } catch (error) {
    next();
  }
};