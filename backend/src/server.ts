/**
 * Express Server Entry Point
 * ✅ Updated for unified Pembayaran system
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import {
  errorHandler,
  notFoundHandler,
} from './middlewares/errorMiddleware';

// Routes
import authRoutes from './routes/authRoutes';
import mahasiswaRoutes from './routes/mahasiswaRoutes';
import dosenRoutes from './routes/dosenRoutes';
import mataKuliahRoutes from './routes/mataKuliahRoutes';
import semesterRoutes from './routes/semesterRoutes';
import kelasMKRoutes from './routes/kelasMKRoutes';
import ruanganRoutes from './routes/ruanganRoutes';
import paketKRSRoutes from './routes/paketKRSRoutes';
import krsRoutes from './routes/krsRoutes';
import nilaiRoutes from './routes/nilaiRoutes';
import khsRoutes from './routes/khsRoutes';
import pembayaranRoutes from './routes/pembayaranRoutes'; // ✅ RENAMED
import dashboardRoutes from './routes/dashboardRoutes';
import presensiRoutes from './routes/presensiRoutes'; 

const app: Application = express();

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

const corsOptions = {
  origin: env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'http://localhost:3000'
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.set('trust proxy', 1);

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    data: {
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'SIAKAD STT Diakonos API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      mahasiswa: '/api/mahasiswa',
      dosen: '/api/dosen',
      mataKuliah: '/api/mata-kuliah',
      semester: '/api/semester',
      kelasMK: '/api/kelas-mk',
      ruangan: '/api/ruangan',
      paketKRS: '/api/paket-krs',
      krs: '/api/krs',
      nilai: '/api/nilai',
      khs: '/api/khs',
      pembayaran: '/api/pembayaran', // ✅ RENAMED
      dashboard: '/api/dashboard',
    },
  });
});

// ============================================
// API ROUTES
// ============================================

app.use('/api/auth', authRoutes);

// Master data routes
app.use('/api/mahasiswa', mahasiswaRoutes);
app.use('/api/dosen', dosenRoutes);
app.use('/api/mata-kuliah', mataKuliahRoutes);
app.use('/api/semester', semesterRoutes);
app.use('/api/kelas-mk', kelasMKRoutes);
app.use('/api/ruangan', ruanganRoutes);

// Academic process routes
app.use('/api/paket-krs', paketKRSRoutes);
app.use('/api/krs', krsRoutes);
app.use('/api/nilai', nilaiRoutes);
app.use('/api/khs', khsRoutes);

// Payment & Dashboard routes
app.use('/api/pembayaran', pembayaranRoutes); // ✅ RENAMED & GENERALIZED
app.use('/api/dashboard', dashboardRoutes);

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// ============================================
// ERROR HANDLING
// ============================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 SIAKAD STT DIAKONOS API SERVER');
  console.log('='.repeat(50));
  console.log(`📍 Environment: ${env.NODE_ENV}`);
  console.log(`🌐 Server running on: http://localhost:${PORT}`);
  console.log(`🔗 API endpoint: http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log('='.repeat(50));
  console.log('✅ Server is ready to accept connections');
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (error: Error) => {
  console.log('❌ Uncaught Exception:', error);
  server.close(() => {
    process.exit(1);
  });
});

export default app;
