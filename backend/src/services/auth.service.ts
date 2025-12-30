import { prisma } from '../config/database.js'
import { hashPassword, comparePassword, generateToken, getTokenExpiration } from '../utils/index.js'
import { AppError } from '../types/index.js'
import type { UserRole } from '../types/index.js'

// Constants for account locking
const MAX_LOGIN_ATTEMPTS = 3
const LOCK_DURATION_MINUTES = 15

export interface RegisterInput {
  username: string
  email: string
  password: string
}

export interface LoginInput {
  username: string
  password: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    username: string
    email: string
    role: UserRole
    avatar: string | null
  }
  expiresAt: number
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    const { username, email, password } = input

    // Check if username already exists
    const existingUsername = await prisma.users.findUnique({
      where: { username },
    })
    if (existingUsername) {
      throw new AppError(400, 'Username already exists', 'AUTH_USERNAME_EXISTS')
    }

    // Check if email already exists
    const existingEmail = await prisma.users.findUnique({
      where: { email },
    })
    if (existingEmail) {
      throw new AppError(400, 'Email already exists', 'AUTH_EMAIL_EXISTS')
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await prisma.users.create({
      data: {
        username,
        email,
        passwordHash,
        role: 'STUDENT',
      },
    })

    // Generate token
    const role: UserRole = user.role.toLowerCase() as UserRole
    const token = generateToken(user.id, role)
    const expiresAt = getTokenExpiration()

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role,
        avatar: user.avatar,
      },
      expiresAt,
    }
  }

  /**
   * Login user with username and password
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const { username, password } = input

    // Find user by username
    const user = await prisma.users.findUnique({
      where: { username },
    })

    if (!user) {
      throw new AppError(401, 'Invalid username or password', 'AUTH_001')
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (1000 * 60)
      )
      throw new AppError(
        403,
        `Account is locked. Please try again in ${remainingMinutes} minutes`,
        'AUTH_002'
      )
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash)

    if (!isValidPassword) {
      // Increment login attempts
      const newAttempts = user.loginAttempts + 1

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        // Lock the account
        const lockUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000)
        await prisma.users.update({
          where: { id: user.id },
          data: {
            loginAttempts: newAttempts,
            lockedUntil: lockUntil,
          },
        })
        throw new AppError(
          403,
          `Account locked due to too many failed attempts. Please try again in ${LOCK_DURATION_MINUTES} minutes`,
          'AUTH_002'
        )
      } else {
        await prisma.users.update({
          where: { id: user.id },
          data: { loginAttempts: newAttempts },
        })
        throw new AppError(401, 'Invalid username or password', 'AUTH_001')
      }
    }

    // Reset login attempts and update last login time
    await prisma.users.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    })

    // Generate token
    const role: UserRole = user.role.toLowerCase() as UserRole
    const token = generateToken(user.id, role)
    const expiresAt = getTokenExpiration()

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role,
        avatar: user.avatar,
      },
      expiresAt,
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(userId: string) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar: true,
        bio: true,
        solvedCount: true,
        submissionCount: true,
        score: true,
        streak: true,
        maxStreak: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })

    if (!user) {
      throw new AppError(404, 'User not found', 'NOT_FOUND')
    }

    return {
      ...user,
      role: user.role.toLowerCase() as UserRole,
    }
  }

  /**
   * Check if user is locked
   */
  async isAccountLocked(username: string): Promise<{ locked: boolean; remainingMinutes?: number }> {
    const user = await prisma.users.findUnique({
      where: { username },
      select: { lockedUntil: true },
    })

    if (!user) {
      return { locked: false }
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (1000 * 60)
      )
      return { locked: true, remainingMinutes }
    }

    return { locked: false }
  }
}

export const authService = new AuthService()
