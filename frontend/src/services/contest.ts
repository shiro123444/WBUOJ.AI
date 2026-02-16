import { api } from './api'

export interface Contest {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  maxParticipants: number | null
  status: 'UPCOMING' | 'RUNNING' | 'ENDED'
  participantCount: number
  problemCount: number
  createdBy: {
    id: string
    username: string
  }
  createdAt: string
}

export interface ContestDetail extends Contest {
  problems: {
    id: string
    number: number
    title: string
    difficulty: 'easy' | 'medium' | 'hard'
    order: number
    score: number
  }[]
  isJoined: boolean
}

export interface ContestListParams {
  page?: number
  limit?: number
  status?: 'UPCOMING' | 'RUNNING' | 'ENDED'
}

export interface ContestListResponse {
  contests: Contest[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const contestService = {
  async getContests(params: ContestListParams = {}): Promise<ContestListResponse> {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.status) searchParams.set('status', params.status)

    const queryString = searchParams.toString()
    const endpoint = queryString ? `/contests?${queryString}` : '/contests'

    const response = await api.getWithPagination<Contest[]>(endpoint)
    return {
      contests: response.data,
      total: response.pagination.total,
      page: response.pagination.page,
      limit: response.pagination.limit,
      totalPages: response.pagination.totalPages,
    }
  },

  async getContest(id: string): Promise<ContestDetail> {
    return api.get<ContestDetail>(`/contests/${id}`)
  },

  async joinContest(id: string): Promise<void> {
    await api.post<void>(`/contests/${id}/join`, {})
  },
}
