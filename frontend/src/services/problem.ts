import { api } from './api'
import type { Problem, Difficulty } from '../types'

export interface ProblemListParams {
  page?: number
  limit?: number
  difficulty?: Difficulty
  tags?: string[]
  search?: string
}

export interface ProblemListResponse {
  problems: Problem[]
  total: number
  page: number
  limit: number
}

export interface TagsResponse {
  tags: string[]
}

export const problemService = {
  /**
   * Get paginated problem list with optional filters
   */
  async getProblems(params: ProblemListParams = {}): Promise<ProblemListResponse> {
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.difficulty) searchParams.set('difficulty', params.difficulty)
    if (params.tags && params.tags.length > 0) {
      searchParams.set('tags', params.tags.join(','))
    }
    if (params.search) searchParams.set('search', params.search)

    const queryString = searchParams.toString()
    const endpoint = queryString ? `/problems?${queryString}` : '/problems'
    
    return api.get<ProblemListResponse>(endpoint)
  },

  /**
   * Get all available tags
   */
  async getAllTags(): Promise<string[]> {
    const response = await api.get<TagsResponse>('/problems/tags')
    return response.tags
  },

  /**
   * Get problem by ID
   */
  async getProblemById(id: string): Promise<Problem> {
    const response = await api.get<{ problem: Problem }>(`/problems/${id}`)
    return response.problem
  },
}
