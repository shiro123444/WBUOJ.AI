// User types
export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  bio?: string
  role: 'student' | 'admin'
  solvedCount: number
  submissionCount: number
  score: number
  streak: number
  maxStreak: number
  badges: Badge[]
  createdAt: string
  lastLoginAt: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  earnedAt: string
}

// Problem types
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Problem {
  id: string
  number: number
  title: string
  description: string
  inputFormat: string
  outputFormat: string
  examples: Example[]
  constraints: string
  difficulty: Difficulty
  tags: string[]
  timeLimit: number
  memoryLimit: number
  acceptedCount: number
  submissionCount: number
  createdAt: string
}

export interface Example {
  input: string
  output: string
  explanation?: string
}

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

export interface Submission {
  id: string
  problemId: string
  userId: string
  code: string
  language: SupportedLanguage
  status: JudgeStatus
  time?: number
  memory?: number
  testCaseResults?: TestCaseResult[]
  compileError?: string
  runtimeError?: string
  createdAt: string
}

export interface TestCaseResult {
  passed: boolean
  time: number
  memory: number
  input?: string
  expectedOutput?: string
  actualOutput?: string
}

// Solution types
export interface Solution {
  id: string
  problemId: string
  authorId: string
  title: string
  content: string
  code?: string
  language?: string
  likes: number
  views: number
  comments: Comment[]
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  authorId: string
  content: string
  likes: number
  createdAt: string
}

// Contest types
export type ContestStatus = 'upcoming' | 'running' | 'ended'

export interface Contest {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  problems: ContestProblem[]
  participants: string[]
  maxParticipants?: number
  status: ContestStatus
  createdBy: string
  createdAt: string
}

export interface ContestProblem {
  problemId: string
  label: string
  score: number
}

// Leaderboard types
export interface RankingEntry {
  userId: string
  username: string
  avatar?: string
  rank: number
  score: number
  solvedCount: number
  streak: number
}

// API Response types
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// Auth types
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
  expiresAt: number
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}
