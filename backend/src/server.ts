import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/errorMiddleware';

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
import pembayaranRoutes from './routes/pembayaranRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import presensiRoutes from './routes/presensiRoutes';

const app: Application = express();

app.use(
  helmet({
    contentSecurityPolicy:
      env.NODE_ENV === 'production'
        ? {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'"],
              imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
              connectSrc: ["'self'"],
              fontSrc: ["'self'", 'data:'],
              objectSrc: ["'self'", 'blob:'],
              frameSrc: ["'self'", 'blob:'],
              mediaSrc: ["'self'", 'blob:'],
              formAction: ["'self'"],
              baseUri: ["'self'"],
              ...(env.NODE_ENV === 'production' && {
                upgradeInsecureRequests: [],
              }),
            },
          }
        : false,
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
    hsts:
      env.NODE_ENV === 'production'
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
    hidePoweredBy: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Terlalu banyak request. Coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.originalUrl === '/health' || req.originalUrl === '/api';
  },
});

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Terlalu banyak percobaan registrasi. Coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Terlalu banyak percobaan ubah password. Coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Terlalu banyak upload file. Coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const corsOptions = {
  origin:
    env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie', 'Content-Disposition'],
  maxAge: 86400,
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
      pembayaran: '/api/pembayaran',
      dashboard: '/api/dashboard',
      presensi: '/api/presensi',
    },
  });
});

// Hanya terapkan apiLimiter di production
if (env.NODE_ENV === 'production') {
  app.use('/api', apiLimiter);
}

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/change-password', passwordChangeLimiter);
app.use('/api/auth/change-username', passwordChangeLimiter);
app.use('/api/pembayaran/upload', uploadLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/mahasiswa', mahasiswaRoutes);
app.use('/api/dosen', dosenRoutes);
app.use('/api/mata-kuliah', mataKuliahRoutes);
app.use('/api/semester', semesterRoutes);
app.use('/api/kelas-mk', kelasMKRoutes);
app.use('/api/ruangan', ruanganRoutes);
app.use('/api/paket-krs', paketKRSRoutes);
app.use('/api/krs', krsRoutes);
app.use('/api/nilai', nilaiRoutes);
app.use('/api/khs', khsRoutes);
app.use('/api/pembayaran', pembayaranRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/presensi', presensiRoutes);

app.use(
  '/uploads',
  async (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Login required',
      });
    }

    try {
      const jwt = require('jsonwebtoken');
      jwt.verify(token, env.JWT_SECRET);

      const ext = req.path.split('.').pop()?.toLowerCase();

      if (ext === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
      } else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) {
        res.setHeader('Content-Type', `image/${ext === 'jpg' ? 'jpeg' : ext}`);
        res.setHeader('Cache-Control', 'private, max-age=3600');
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  },
  express.static('uploads')
);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('SIAKAD STT DIAKONOS API SERVER');
  console.log('='.repeat(60));
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log('='.repeat(60));
  console.log('Security Features:');
  console.log('Helmet (CSP + Security Headers)');
  console.log('Rate Limiting (5-layer protection)');
  console.log('CORS (Credentials + File Downloads)');
  console.log('HttpOnly Cookies (JWT)');
  console.log('File Upload Protection (10/hour)');
  console.log('Static Files Auth (JWT validation)');
  console.log('='.repeat(60));
  console.log('File Operations Enabled:');
  console.log('Image uploads (JPG, PNG)');
  console.log('PDF uploads and viewing');
  console.log('Dynamic PDF generation (Puppeteer)');
  console.log('Protected /uploads directory');
  console.log('='.repeat(60));
  console.log('Server ready to accept connections');
  console.log('='.repeat(60));
});

const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received: closing HTTP server gracefully`);
  server.close(() => {
    console.log('HTTP server closed');
    console.log('Database connections closed');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('Unhandled Rejection');
});

process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('Uncaught Exception');
});

export default app;