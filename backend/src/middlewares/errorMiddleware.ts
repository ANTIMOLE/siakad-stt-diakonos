/**
 * Global Error Handling Middleware
 * Catches all errors and formats response
 */

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { env } from '../config/env';

// Custom error class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  // Default error values
  let statusCode = 500;
  let message = 'Terjadi kesalahan pada server.';
  let errors: any = undefined;

  // Handle custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Handle Prisma errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;

    // Unique constraint violation
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[]) || [];
      message = `${field.join(', ')} sudah digunakan.`;
    }

    // Foreign key constraint violation
    else if (err.code === 'P2003') {
      message = 'Data yang direferensikan tidak ditemukan.';
    }

    // Record not found
    else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Data tidak ditemukan.';
    }

    // Record to delete does not exist
    else if (err.code === 'P2016') {
      statusCode = 404;
      message = 'Data yang akan dihapus tidak ditemukan.';
    }

    // Database connection error
    else if (err.code === 'P1001') {
      statusCode = 503;
      message = 'Tidak dapat terhubung ke database.';
    }

    // Other Prisma errors
    else {
      message = 'Terjadi kesalahan pada database.';
    }
  }

  // Handle Prisma validation errors
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Data tidak valid.';
  }

  // Handle JSON parse errors
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Format JSON tidak valid.';
  }

  // Handle JWT errors (if not caught by auth middleware)
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token tidak valid.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token telah kadaluarsa.';
  }

  // Response object
  const errorResponse: any = {
    success: false,
    message,
  };

  // Add errors field if exists
  if (errors) {
    errorResponse.errors = errors;
  }

  // Add stack trace in development
  if (env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.error = err.message;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Not Found handler
 * Catch 404 errors for undefined routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(
    `Route ${req.method} ${req.originalUrl} tidak ditemukan.`,
    404
  );
  next(error);
};

/**
 * Async handler wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error formatter
 * Formats validation errors from express-validator
 */
export const formatValidationErrors = (errors: any[]): Record<string, string> => {
  const formattedErrors: Record<string, string> = {};

  errors.forEach((error) => {
    if (error.path) {
      formattedErrors[error.path] = error.msg;
    } else if (error.param) {
      formattedErrors[error.param] = error.msg;
    }
  });

  return formattedErrors;
};
