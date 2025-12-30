import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import type { JwtPayload, UserRole } from '../types/index.js'

export function generateToken(userId: string, role: UserRole): string {
  const expiresInSeconds = parseExpiresIn(config.jwtExpiresIn)
  return jwt.sign({ userId, role } as JwtPayload, config.jwtSecret, {
    expiresIn: expiresInSeconds,
  })
}

function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([dhms])$/)
  if (!match) {
    return 7 * 24 * 60 * 60 // Default 7 days in seconds
  }

  const value = parseInt(match[1], 10)
  const unit = match[2]

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  }

  return value * multipliers[unit]
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload
}

export function getTokenExpiration(): number {
  // Parse the expiration time from config
  const expiresIn = config.jwtExpiresIn
  const match = expiresIn.match(/^(\d+)([dhms])$/)

  if (!match) {
    return Date.now() + 7 * 24 * 60 * 60 * 1000 // Default 7 days
  }

  const value = parseInt(match[1], 10)
  const unit = match[2]

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }

  return Date.now() + value * multipliers[unit]
}
