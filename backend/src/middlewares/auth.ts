import type { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { AppError, type AuthenticatedRequest, type JwtPayload } from '../types/index.js'

export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required', 'AUTH_001')
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload
    req.user = decoded

    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError(401, 'Token expired', 'AUTH_003'))
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, 'Invalid token', 'AUTH_001'))
    } else {
      next(error)
    }
  }
}

export function requireAdmin(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError(403, 'Admin access required', 'AUTH_004'))
  }
  next()
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload
      req.user = decoded
    }

    next()
  } catch {
    // Token is invalid, but we continue without authentication
    next()
  }
}
