/**
 * Role-Based Access Control Middleware
 * Restricts access based on user roles
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

import { AppError } from './errorMiddleware';

/**
 * Require specific role(s)
 * Must be used after authenticate middleware
 */
export const requireRole = (allowedRoles: string | string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    // Convert single role to array
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke resource ini.',
      });
      return;
    }

    next();
  };
};

/**
 * Require ADMIN role
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  requireRole('ADMIN')(req, res, next);
};

/**
 * Require DOSEN role
 */
export const requireDosen = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  requireRole('DOSEN')(req, res, next);
};

/**
 * Require MAHASISWA role
 */
// export const requireMahasiswa = (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction
// ): void => {
//   requireRole('MAHASISWA')(req, res, next);
// };

/**
 * Require ADMIN or DOSEN role
 */
export const requireAdminOrDosen = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  requireRole(['ADMIN', 'DOSEN'])(req, res, next);
};

/**
 * Allow access to own resource or admin
 * Checks if user is accessing their own resource or is an admin
 * 
 * @param getResourceUserId Function to extract userId from request
 */
export const requireOwnerOrAdmin = (
  getResourceUserId: (req: AuthRequest) => number | Promise<number>
) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
        return;
      }

      // Admin can access everything
      if (req.user.role === 'ADMIN') {
        next();
        return;
      }

      // Get resource user ID
      const resourceUserId = await getResourceUserId(req);

      // Check if user owns the resource
      if (req.user.id === resourceUserId) {
        next();
        return;
      }

      res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke resource ini.',
      });
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat verifikasi akses.',
      });
    }
  };
};

/**
 * Check if user has permission for specific action
 * Can be extended for more granular permissions
 */
export const hasPermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    // Define permissions per role
    const rolePermissions: Record<string, string[]> = {
      ADMIN: [
        'manage_users',
        'manage_mahasiswa',
        'manage_dosen',
        'manage_mata_kuliah',
        'manage_semester',
        'manage_kelas',
        'manage_ruangan',
        'manage_paket_krs',
        'view_all_krs',
        'view_all_nilai',
      ],
      DOSEN: [
        'view_mahasiswa_bimbingan',
        'approve_krs',
        'reject_krs',
        'input_nilai',
        'view_kelas_mengajar',
        'presensi_mahasiswa',
      ],
      MAHASISWA: [
        'view_own_krs',
        'view_own_khs',
        'view_own_nilai',
        'submit_krs',
        'upload_bukti_pembayaran',
      ],
      // 👇 TAMBAH INI
      KEUANGAN: [
        'view_all_pembayaran',
        'approve_pembayaran',
        'reject_pembayaran',
        'view_dashboard_keuangan',
      ],
    };

    const userPermissions = rolePermissions[req.user.role] || [];

    if (!userPermissions.includes(permission)) {
      res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki permission untuk aksi ini.',
      });
      return;
    }

    next();
  };
};

/**
 * Require Keuangan role
 * Add this to roleMiddleware.ts
 */
export const requireKeuangan = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError('User tidak ditemukan', 401);
  }

  if (req.user.role !== 'KEUANGAN') {
    throw new AppError('Akses ditolak. Hanya untuk bagian keuangan', 403);
  }

  next();
};

/**
 * Require Mahasiswa role
 * Add this to roleMiddleware.ts
 */
export const requireMahasiswa = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError('User tidak ditemukan', 401);
  }

  if (req.user.role !== 'MAHASISWA') {
    throw new AppError('Akses ditolak. Hanya untuk mahasiswa', 403);
  }

  next();
};

/**
 * Require Keuangan or Admin
 * Add this to roleMiddleware.ts
 */
export const requireKeuanganOrAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError('User tidak ditemukan', 401);
  }

  if (req.user.role !== 'KEUANGAN' && req.user.role !== 'ADMIN') {
    throw new AppError('Akses ditolak. Hanya untuk keuangan atau admin', 403);
  }

  next();
};