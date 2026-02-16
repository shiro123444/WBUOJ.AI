import { api } from './api'

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

export interface LeaderboardParams {
  page?: number
  limit?: number
  sortBy?: 'score' | 'solvedCount' | 'streak'
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const leaderboardService = {
  async getLeaderboard(params: LeaderboardParams = {}): Promise<LeaderboardResponse> {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.sortBy) searchParams.set('sortBy', params.sortBy)

    const queryString = searchParams.toString()
    const endpoint = queryString ? `/leaderboard?${queryString}` : '/leaderboard'

    const response = await api.getWithPagination<LeaderboardEntry[]>(endpoint)
    return {
      entries: response.data,
      total: response.pagination.total,
      page: response.pagination.page,
      limit: response.pagination.limit,
      totalPages: response.pagination.totalPages,
    }
  },
}
