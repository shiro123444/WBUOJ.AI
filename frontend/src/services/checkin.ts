import { api } from './api'

export interface CheckInResult {
  date: string
  streak: number
  maxStreak: number
  xpGained: number
  pointsGained: number
  milestoneReached: number | null
  leveledUp: boolean
  newLevel: number
  newXp: number
  xpForNextLevel: number
  totalCheckIns: number
}

export interface CheckInStatus {
  checkedInToday: boolean
  level: number
  xp: number
  xpForNextLevel: number
  totalPoints: number
  currentStreak: number
  maxStreak: number
  totalCheckIns: number
  recentCheckIns: {
    date: string
    streak: number
    xpGained: number
    pointsGained: number
    milestoneReached: number | null
  }[]
}

export interface CalendarDay {
  date: string
  streak: number
  xpGained: number
  milestoneReached: number | null
}

export interface PointsRecord {
  id: string
  type: string
  amount: number
  source: string
  description: string
  createdAt: string
}

export interface PointsHistoryResponse {
  records: PointsRecord[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const checkInService = {
  async checkIn(): Promise<CheckInResult> {
    return api.post<CheckInResult>('/checkin')
  },

  async getStatus(): Promise<CheckInStatus> {
    return api.get<CheckInStatus>('/checkin/status')
  },

  async getCalendar(year: number, month: number): Promise<CalendarDay[]> {
    return api.get<CalendarDay[]>(`/checkin/calendar?year=${year}&month=${month}`)
  },

  async getPointsHistory(page = 1, limit = 20): Promise<PointsHistoryResponse> {
    return api.get<PointsHistoryResponse>(`/checkin/points-history?page=${page}&limit=${limit}`)
  },
}
