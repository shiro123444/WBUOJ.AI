import type { Request } from 'express'

// Re-export judge types
export * from './judge.js'

// User types
export type UserRole = 'student' | 'admin'

export interface JwtPayload {
  userId: string
  role: UserRole
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload
}

// Problem types
export type Difficulty = 'easy' | 'medium' | 'hard'

// Submission types
export type JudgeStatus =
  | 'pending'
  | 'judging'
  | 'accepted'
  | 'wrong_answer'
  | 'time_limit_exceeded'
  | 'memory_limit_exceeded'
  | 'runtime_error'
  | 'compile_error'

export type SupportedLanguage = 'cpp' | 'python' | 'java' | 'javascript' | 'go'

// Contest types
export type ContestStatus = 'upcoming' | 'running' | 'ended'

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Error types
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}
