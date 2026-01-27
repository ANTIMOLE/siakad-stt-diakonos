/**
 * Authentication Middleware
 * ✅ UPDATED: Read JWT from HttpOnly cookie
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import prisma from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: 'ADMIN' | 'DOSEN' | 'MAHASISWA' | 'KEUANGAN';
    identifier?: string;
  };
}

interface JwtPayload {
  userId: number;
  role: 'ADMIN' | 'DOSEN' | 'MAHASISWA' | 'KEUANGAN';
  identifier?: string;
}

/**
 * Authenticate middleware
 * ✅ Verifies JWT token from HttpOnly cookie
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // ✅ READ TOKEN FROM COOKIE (not Authorization header)
    const token = req.cookies?.token;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan. Silakan login terlebih dahulu.',
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

    // Attach user to request
    req.user = {
      id: user.id,
      role: user.role,
      identifier: decoded.identifier,
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
  const token = req.cookies?.token;

  if (!token) {
    next();
    return;
  }

  try {
    await authenticate(req, res, next);
  } catch (error) {
    next();
  }
};