import { api } from './api'

// Types
export interface SolutionListItem {
  id: string
  title: string
  authorId: string
  authorName: string
  authorAvatar: string | null
  likes: number
  views: number
  commentCount: number
  createdAt: string
  contentPreview: string | null
  isContentHidden: boolean
}

export interface SolutionDetail {
  id: string
  problemId: string
  problemNumber: number
  problemTitle: string
  title: string
  content: string | null
  code: string | null
  language: string | null
  authorId: string
  authorName: string
  authorAvatar: string | null
  likes: number
  views: number
  isLiked: boolean
  createdAt: string
  updatedAt: string
  isContentHidden: boolean
  comments: CommentItem[]
}

export interface CommentItem {
  id: string
  authorId: string
  authorName: string
  authorAvatar: string | null
  content: string
  likes: number
  isLiked: boolean
  createdAt: string
}

export interface CreateSolutionInput {
  problemId: string
  title: string
  content: string
  code?: string
  language?: string
}

export interface UpdateSolutionInput {
  title?: string
  content?: string
  code?: string
  language?: string
}

export interface SolutionListResponse {
  solutions: SolutionListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface LikeResponse {
  likes: number
  isLiked: boolean
}

class SolutionService {
  /**
   * Get solutions for a problem
   */
  async getSolutions(
    problemId: string,
    options: { sort?: 'hot' | 'new'; page?: number; limit?: number } = {}
  ): Promise<SolutionListResponse> {
    const params = new URLSearchParams()
    params.set('problemId', problemId)
    if (options.sort) params.set('sort', options.sort)
    if (options.page) params.set('page', String(options.page))
    if (options.limit) params.set('limit', String(options.limit))

    return api.get<SolutionListResponse>(`/solutions?${params.toString()}`)
  }

  /**
   * Get solution detail
   */
  async getSolutionById(id: string): Promise<{ solution: SolutionDetail }> {
    return api.get<{ solution: SolutionDetail }>(`/solutions/${id}`)
  }

  /**
   * Create a new solution
   */
  async createSolution(input: CreateSolutionInput): Promise<{ solution: { id: string; title: string } }> {
    return api.post<{ solution: { id: string; title: string } }>('/solutions', input)
  }

  /**
   * Update a solution
   */
  async updateSolution(id: string, input: UpdateSolutionInput): Promise<{ solution: { id: string; title: string } }> {
    return api.put<{ solution: { id: string; title: string } }>(`/solutions/${id}`, input)
  }

  /**
   * Delete a solution
   */
  async deleteSolution(id: string): Promise<void> {
    await api.delete(`/solutions/${id}`)
  }

  /**
   * Toggle like on a solution
   */
  async toggleLike(id: string): Promise<LikeResponse> {
    return api.post<LikeResponse>(`/solutions/${id}/like`)
  }

  /**
   * Add a comment to a solution
   */
  async addComment(solutionId: string, content: string): Promise<{ comment: CommentItem }> {
    return api.post<{ comment: CommentItem }>(`/solutions/${solutionId}/comments`, { content })
  }

  /**
   * Delete a comment
   */
  async deleteComment(solutionId: string, commentId: string): Promise<void> {
    await api.delete(`/solutions/${solutionId}/comments/${commentId}`)
  }

  /**
   * Toggle like on a comment
   */
  async toggleCommentLike(solutionId: string, commentId: string): Promise<LikeResponse> {
    return api.post<LikeResponse>(`/solutions/${solutionId}/comments/${commentId}/like`)
  }
}

export const solutionService = new SolutionService()
