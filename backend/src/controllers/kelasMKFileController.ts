/**
 * Kelas MK File Controller
 * Handles RPS, RPP, and MATERI file operations
 */

import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { asyncHandler, AppError } from '../middlewares/errorMiddleware';
import * as kelasMKFileService from '../services/kelasMKFileService';
import { TipeFileKelas } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/kelasmkfiles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'file-' + uniqueSuffix + ext);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Hanya PDF dan DOC/DOCX yang diizinkan.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/**
 * POST /api/kelas-mk-files/upload
 * Upload file (RPS/RPP/MATERI)
 */
export const uploadFile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { kelasMKId, tipeFile, namaFile, mingguKe, keterangan } = req.body;

    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }

    // Get dosen ID
    const dosen = await prisma.dosen.findFirst({
      where: { userId: req.user.id },
    });

    if (!dosen) {
      throw new AppError('Data dosen tidak ditemukan', 404);
    }

    // Check if file uploaded
    if (!req.file) {
      throw new AppError('File wajib diupload', 400);
    }

    // Validate MATERI must have mingguKe
    if (tipeFile === 'MATERI' && !mingguKe) {
      fs.unlinkSync(req.file.path);
      throw new AppError('Minggu ke wajib diisi untuk MATERI', 400);
    }

    // Upload file
    const file = await kelasMKFileService.uploadFile(
      dosen.id,
      parseInt(kelasMKId),
      tipeFile as TipeFileKelas,
      namaFile,
      `/uploads/kelasmkfiles/${req.file.filename}`,
      mingguKe ? parseInt(mingguKe) : undefined,
      keterangan
    );

    res.status(201).json({
      success: true,
      message: 'File berhasil diupload',
      data: file,
    });
  }
);

/**
 * DELETE /api/kelas-mk-files/:id
 * Delete file
 */
export const deleteFile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }

    // Get dosen ID
    const dosen = await prisma.dosen.findFirst({
      where: { userId: req.user.id },
    });

    if (!dosen) {
      throw new AppError('Data dosen tidak ditemukan', 404);
    }

    await kelasMKFileService.deleteFile(parseInt(id), dosen.id);

    res.status(200).json({
      success: true,
      message: 'File berhasil dihapus',
    });
  }
);

/**
 * PATCH /api/kelas-mk-files/:id/rename
 * Rename file (display name only)
 */
export const renameFile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { namaFile } = req.body;

    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }

    // Get dosen ID
    const dosen = await prisma.dosen.findFirst({
      where: { userId: req.user.id },
    });

    if (!dosen) {
      throw new AppError('Data dosen tidak ditemukan', 404);
    }

    const file = await kelasMKFileService.renameFile(
      parseInt(id),
      dosen.id,
      namaFile
    );

    res.status(200).json({
      success: true,
      message: 'File berhasil diubah namanya',
      data: file,
    });
  }
);

/**
 * GET /api/kelas-mk-files/kelas/:kelasMKId/dosen
 * Get files for a class (Dosen view)
 */
export const getFilesByKelasForDosen = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { kelasMKId } = req.params;
    const { tipeFile } = req.query;
    const { mingguKe } = req.query;

    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }

    // Get dosen ID
    const dosen = await prisma.dosen.findFirst({
      where: { userId: req.user.id },
    });

    if (!dosen) {
      throw new AppError('Data dosen tidak ditemukan', 404);
    }

    const files = await kelasMKFileService.getFilesByKelasForDosen(
      parseInt(kelasMKId),
      dosen.id,
      tipeFile as TipeFileKelas | undefined
    );

    const filteredFiles = mingguKe
      ? files.filter(file => file.mingguKe === parseInt(mingguKe as string))
      : files;

    res.status(200).json({
      success: true,
      message: 'Data file berhasil diambil',
      data: filteredFiles,
    });
  }
);

/**
 * GET /api/kelas-mk-files/kelas/:kelasMKId/mahasiswa
 * Get files for a class (Mahasiswa view)
 */
export const getFilesByKelasForMahasiswa = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { kelasMKId } = req.params;
    const { tipeFile } = req.query;
    const { mingguKe } = req.query;

    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }

    // Get mahasiswa ID
    const mahasiswa = await prisma.mahasiswa.findFirst({
      where: { userId: req.user.id },
    });

    if (!mahasiswa) {
      throw new AppError('Data mahasiswa tidak ditemukan', 404);
    }

    const files = await kelasMKFileService.getFilesByKelasForMahasiswa(
      parseInt(kelasMKId),
      mahasiswa.id,
      tipeFile as TipeFileKelas | undefined
    );

    const filteredFiles = mingguKe
      ? files.filter(file => file.mingguKe === parseInt(mingguKe as string))
      : files;

    res.status(200).json({
      success: true,
      message: 'Data file berhasil diambil',
      data: filteredFiles,
    });
  }
);

/**
 * GET /api/kelas-mk-files/serve/:id
 * Serve/download file
 */
export const serveFile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!req.user) {
      throw new AppError('User tidak ditemukan', 401);
    }

    // Get file
    const file = await prisma.kelasMKFile.findUnique({
      where: { id: parseInt(id) },
      include: {
        kelasMK: {
          include: {
            dosen: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!file) {
      throw new AppError('File tidak ditemukan', 404);
    }

    // Authorization check
    if (req.user.role === 'DOSEN') {
      // Dosen can only access their own files
      if (file.kelasMK.dosen.userId !== req.user.id) {
        throw new AppError('Anda tidak memiliki akses ke file ini', 403);
      }
    } else if (req.user.role === 'MAHASISWA') {
      // Mahasiswa must be enrolled
      const mahasiswa = await prisma.mahasiswa.findFirst({
        where: { userId: req.user.id },
      });

      if (!mahasiswa) {
        throw new AppError('Data mahasiswa tidak ditemukan', 404);
      }

      const enrollment = await prisma.kRSDetail.findFirst({
        where: {
          kelasMKId: file.kelasMKId,
          krs: {
            mahasiswaId: mahasiswa.id,
            status: 'APPROVED',
          },
        },
      });

      if (!enrollment) {
        throw new AppError('Anda tidak terdaftar di kelas ini', 403);
      }
    }

    // Build file path
    const filename = path.basename(file.fileUrl);
    const filePath = path.join(__dirname, '../..', file.fileUrl);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new AppError('File tidak ditemukan di server', 404);
    }

    // Determine content type
    const ext = path.extname(filePath).toLowerCase();
    const contentType =
      ext === '.pdf' ? 'application/pdf' :
      ext === '.doc' ? 'application/msword' :
      ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
      'application/octet-stream';

    // Set CORS headers
    const origin = req.headers.origin;
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    }

    // Set content headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${file.namaFile}${ext}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    // Stream file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      throw new AppError('Error saat membaca file', 500);
    });
  }
);