import { prisma } from '../config/database.js'

export interface LeaderboardQuery {
  page?: number
  limit?: number
  sortBy?: 'score' | 'solvedCount' | 'streak'
}

export interface LeaderboardEntry {
  rank: number
  id: string
  username: string
  avatar: string | null
  score: number
  solvedCount: number
  submissionCount: number
  streak: number
  maxStreak: number
  acceptRate: number
}

class LeaderboardService {
  async getLeaderboard(query: LeaderboardQuery) {
    const page = query.page || 1
    const limit = Math.min(query.limit || 20, 100)
    const sortBy = query.sortBy || 'score'
    const skip = (page - 1) * limit

    const orderBy =
      sortBy === 'solvedCount'
        ? { solved_count: 'desc' as const }
        : sortBy === 'streak'
          ? { max_streak: 'desc' as const }
          : { score: 'desc' as const }

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        select: {
          id: true,
          username: true,
          avatar: true,
          score: true,
          solved_count: true,
          submission_count: true,
          streak: true,
          max_streak: true,
        },
        orderBy: [orderBy, { solved_count: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.users.count(),
    ])

    interface UserRow {
      id: string
      username: string
      avatar: string | null
      score: number
      solved_count: number
      submission_count: number
      streak: number
      max_streak: number
    }

    const entries: LeaderboardEntry[] = (users as UserRow[]).map((u: UserRow, i: number) => ({
      rank: skip + i + 1,
      id: u.id,
      username: u.username,
      avatar: u.avatar,
      score: u.score,
      solvedCount: u.solved_count,
      submissionCount: u.submission_count,
      streak: u.streak,
      maxStreak: u.max_streak,
      acceptRate: u.submission_count > 0 ? Math.round((u.solved_count / u.submission_count) * 100) : 0,
    }))

    return {
      entries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }
}

export const leaderboardService = new LeaderboardService()
