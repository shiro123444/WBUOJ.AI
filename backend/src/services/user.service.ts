import { prisma } from '../config/database.js'
import { AppError } from '../types/index.js'
import { hashPassword, comparePassword } from '../utils/index.js'

export interface UpdateProfileInput {
  bio?: string
  avatar?: string
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

class UserService {
  async getProfile(userId: string) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        role: true,
        score: true,
        solved_count: true,
        submission_count: true,
        streak: true,
        max_streak: true,
        created_at: true,
        last_login_at: true,
      },
    })

    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND')
    }

    // Get recent submissions
    const recentSubmissions = await prisma.submissions.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        status: true,
        language: true,
        created_at: true,
        execution_time: true,
        memory_used: true,
        problems: { select: { id: true, title: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 10,
    })

    // Get solved problem IDs for difficulty breakdown
    const solvedProblems = await prisma.submissions.findMany({
      where: { user_id: userId, status: 'ACCEPTED' },
      select: { problem_id: true },
      distinct: ['problem_id'],
    })

    const solvedProblemIds = solvedProblems.map((s: any) => s.problem_id)

    const difficultyBreakdown = solvedProblemIds.length > 0
      ? await prisma.problems.groupBy({
          by: ['difficulty'],
          where: { id: { in: solvedProblemIds } },
          _count: true,
        })
      : []

    // Get language stats
    const languageStats = await prisma.submissions.groupBy({
      by: ['language'],
      where: { user_id: userId },
      _count: true,
      orderBy: { _count: { language: 'desc' } },
    })

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role.toLowerCase(),
      score: user.score,
      solvedCount: user.solved_count,
      submissionCount: user.submission_count,
      streak: user.streak,
      maxStreak: user.max_streak,
      acceptRate: user.submission_count > 0
        ? Math.round((user.solved_count / user.submission_count) * 100)
        : 0,
      createdAt: user.created_at.toISOString(),
      lastLoginAt: user.last_login_at?.toISOString() || null,
      recentSubmissions: recentSubmissions.map((s: any) => ({
        id: s.id,
        status: s.status,
        language: s.language,
        executionTime: s.execution_time,
        memoryUsed: s.memory_used,
        createdAt: s.created_at.toISOString(),
        problem: s.problems ? { id: s.problems.id, title: s.problems.title } : null,
      })),
      difficultyBreakdown: difficultyBreakdown.map((d: any) => ({
        difficulty: d.difficulty.toLowerCase(),
        count: d._count,
      })),
      languageStats: languageStats.map((l: any) => ({
        language: l.language,
        count: l._count,
      })),
    }
  }

  async getPublicProfile(username: string) {
    const user = await prisma.users.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        avatar: true,
        bio: true,
        score: true,
        solved_count: true,
        submission_count: true,
        streak: true,
        max_streak: true,
        created_at: true,
      },
    })

    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND')
    }

    return {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      score: user.score,
      solvedCount: user.solved_count,
      submissionCount: user.submission_count,
      streak: user.streak,
      maxStreak: user.max_streak,
      acceptRate: user.submission_count > 0
        ? Math.round((user.solved_count / user.submission_count) * 100)
        : 0,
      createdAt: user.created_at.toISOString(),
    }
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.users.update({
      where: { id: userId },
      data: {
        ...(input.bio !== undefined && { bio: input.bio }),
        ...(input.avatar !== undefined && { avatar: input.avatar }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        role: true,
      },
    })

    return user
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    })

    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND')
    }

    const isValid = await comparePassword(input.currentPassword, user.passwordHash)
    if (!isValid) {
      throw new AppError(400, 'Current password is incorrect', 'INVALID_PASSWORD')
    }

    const newHash = await hashPassword(input.newPassword)
    await prisma.users.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    })
  }

  async getSubmissionStats(userId: string) {
    const submissions = await prisma.submissions.findMany({
      where: { user_id: userId },
      select: { status: true, language: true, created_at: true },
      orderBy: { created_at: 'desc' },
    })

    const total = submissions.length
    const accepted = submissions.filter((s: { status: string }) => s.status === 'accepted').length
    const languageMap: Record<string, number> = {}
    for (const s of submissions) {
      languageMap[s.language] = (languageMap[s.language] || 0) + 1
    }

    return {
      totalSubmissions: total,
      acceptedSubmissions: accepted,
      acceptRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
      languageDistribution: languageMap,
    }
  }
}

export const userService = new UserService()
