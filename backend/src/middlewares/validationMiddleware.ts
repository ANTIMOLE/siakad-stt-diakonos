/**
 * Validation Middleware
 * Request validation using express-validator
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { formatValidationErrors } from './errorMiddleware';

/**
 * Validate middleware
 * Runs validation rules and returns errors if any
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for errors
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      return next();
    }

    // Format errors
    const formattedErrors = formatValidationErrors(errors.array());

    res.status(400).json({
      success: false,
      message: 'Validasi gagal.',
      errors: formattedErrors,
    });
  };
};

/**
 * Common validation rules
 */
import { body, param, query } from 'express-validator';

// Password validation
export const passwordValidation = (field: string = 'password') =>
  body(field)
    .isLength({ min: 6 })
    .withMessage('Password minimal 6 karakter')
    .matches(/[A-Z]/)
    .withMessage('Password harus mengandung huruf besar')
    .matches(/[a-z]/)
    .withMessage('Password harus mengandung huruf kecil')
    .matches(/[0-9]/)
    .withMessage('Password harus mengandung angka');

// Simple password validation (without complexity requirements)
export const simplePasswordValidation = (field: string = 'password') =>
  body(field)
    .isLength({ min: 6 })
    .withMessage('Password minimal 6 karakter');

// ID parameter validation
export const idParamValidation = (paramName: string = 'id') =>
  param(paramName)
    .isInt({ min: 1 })
    .withMessage(`${paramName} harus berupa angka positif`);

// Pagination validation
export const paginationValidation = () => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page harus berupa angka positif'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit harus antara 1-100'),
];

// String validation
export const stringValidation = (field: string, minLength: number = 1) =>
  body(field)
    .isString()
    .withMessage(`${field} harus berupa string`)
    .trim()
    .isLength({ min: minLength })
    .withMessage(`${field} minimal ${minLength} karakter`);

// Optional string validation
export const optionalStringValidation = (field: string) =>
  body(field)
    .optional()
    .isString()
    .withMessage(`${field} harus berupa string`)
    .trim();

// Number validation
export const numberValidation = (field: string, min?: number, max?: number) => {
  let validation = body(field)
    .isNumeric()
    .withMessage(`${field} harus berupa angka`);

  if (min !== undefined || max !== undefined) {
    validation = validation
      .isFloat({ min, max })
      .withMessage(
        `${field} harus antara ${min !== undefined ? min : '-∞'} dan ${max !== undefined ? max : '∞'}`
      );
  }

  return validation;
};

// Integer validation
export const integerValidation = (field: string, min?: number, max?: number) => {
  let validation = body(field)
    .isInt()
    .withMessage(`${field} harus berupa bilangan bulat`);

  if (min !== undefined || max !== undefined) {
    validation = validation
      .isInt({ min, max })
      .withMessage(
        `${field} harus antara ${min !== undefined ? min : '-∞'} dan ${max !== undefined ? max : '∞'}`
      );
  }

  return validation;
};

// Boolean validation
export const booleanValidation = (field: string) =>
  body(field)
    .isBoolean()
    .withMessage(`${field} harus berupa boolean`);

// Date validation
export const dateValidation = (field: string) =>
  body(field)
    .isISO8601()
    .withMessage(`${field} harus berupa tanggal yang valid (ISO 8601)`);

// Optional date validation
export const optionalDateValidation = (field: string) =>
  body(field)
    .optional()
    .isISO8601()
    .withMessage(`${field} harus berupa tanggal yang valid (ISO 8601)`);

// Enum validation
export const enumValidation = (field: string, allowedValues: string[]) =>
  body(field)
    .isIn(allowedValues)
    .withMessage(`${field} harus salah satu dari: ${allowedValues.join(', ')}`);

// Array validation
export const arrayValidation = (field: string) =>
  body(field)
    .isArray()
    .withMessage(`${field} harus berupa array`);

// Non-empty array validation
export const nonEmptyArrayValidation = (field: string) =>
  body(field)
    .isArray({ min: 1 })
    .withMessage(`${field} harus berupa array dengan minimal 1 item`);

// Phone number validation (Indonesia format)
export const phoneValidation = (field: string = 'noHp') =>
  body(field)
    .optional()
    .matches(/^(\+62|62|0)[0-9]{9,12}$/)
    .withMessage('Nomor HP tidak valid (format: 08xx atau +62xxx)');

// NIM validation (8-10 digits)
export const nimValidation = () =>
  body('nim')
    .isLength({ min: 8, max: 10 })
    .withMessage('NIM harus 8-10 digit')
    .isNumeric()
    .withMessage('NIM harus berupa angka');

// NIDN validation (10 digits)
export const nidnValidation = () =>
  body('nidn')
    .isLength({ min: 10, max: 10 })
    .withMessage('NIDN harus 10 digit')
    .isNumeric()
    .withMessage('NIDN harus berupa angka');

// NUPTK validation (16 digits)
export const nuptkValidation = () =>
  body('nuptk')
    .isLength({ min: 16, max: 16 })
    .withMessage('NUPTK harus 16 digit')
    .isNumeric()
    .withMessage('NUPTK harus berupa angka');

// NIK validation (16 digits)
export const nikValidation = (field: string = 'nik') =>
  body(field)
    .optional()
    .isLength({ min: 16, max: 16 })
    .withMessage('NIK harus 16 digit')
    .isNumeric()
    .withMessage('NIK harus berupa angka');

// Identifier validation (NIM/NIDN untuk login)
export const identifierValidation = () =>
  body('identifier')
    .notEmpty()
    .withMessage('Identifier wajib diisi')
    .isString()
    .withMessage('Identifier harus berupa teks')
    .trim()
    .custom((value) => {
      // Check if it matches any valid pattern
      const isNIM = /^\d{10}$/.test(value);          // 10 digits (Mahasiswa)
      const isNUPTK = /^\d{16}$/.test(value);        // 16 digits (Dosen)
      const isUsername = /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value); // Starts with letter
      const isUserID = /^\d{1,9}$/.test(value);      // 1-9 digits (Admin/Keuangan ID)

      if (!isNIM && !isNUPTK && !isUsername && !isUserID) {
        throw new Error('Format identifier tidak valid. Gunakan NIM (10 digit), NUPTK (16 digit), atau username');
      }
      
      return true;
    });