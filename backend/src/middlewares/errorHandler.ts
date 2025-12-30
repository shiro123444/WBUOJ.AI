import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../types/index.js'
import { config } from '../config/index.js'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('Error:', err)

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    })
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      success: false,
      error: 'Database operation failed',
      code: 'DB_ERROR',
    })
  }

  // Handle validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
    })
  }

  // Default error
  return res.status(500).json({
    success: false,
    error: config.isDev ? err.message : 'Internal server error',
    code: 'INTERNAL_ERROR',
  })
}
