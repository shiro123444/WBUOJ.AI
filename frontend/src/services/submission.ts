import { api } from './api'
import type { Submission, SupportedLanguage, JudgeStatus } from '../types'

export interface SubmitCodeRequest {
  problemId: string
  code: string
  language: SupportedLanguage
}

export interface SubmitCodeResponse {
  submissionId: string
  status: 'pending'
}

export interface SubmissionListParams {
  userId?: string
  problemId?: string
  status?: JudgeStatus
  page?: number
  limit?: number
}

export interface SubmissionListResponse {
  submissions: Submission[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Extended submission with problem info for display
export interface SubmissionWithProblem extends Submission {
  problem?: {
    id: string
    number: number
    title: string
    difficulty: 'easy' | 'medium' | 'hard'
  }
  user?: {
    id: string
    username: string
    avatar?: string
  }
}

export const submissionService = {
  /**
   * Submit code for judging
   */
  async submitCode(data: SubmitCodeRequest): Promise<SubmitCodeResponse> {
    return api.post<SubmitCodeResponse>('/submissions', data)
  },

  /**
   * Get submission by ID
   */
  async getSubmission(id: string): Promise<Submission> {
    return api.get<Submission>(`/submissions/${id}`)
  },

  /**
   * Get current user's submissions
   */
  async getMySubmissions(params: Omit<SubmissionListParams, 'userId'> = {}): Promise<SubmissionListResponse> {
    const searchParams = new URLSearchParams()
    
    if (params.problemId) searchParams.set('problemId', params.problemId)
    if (params.status) searchParams.set('status', params.status)
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())

    const queryString = searchParams.toString()
    const endpoint = queryString ? `/submissions/my?${queryString}` : '/submissions/my'
    
    const response = await api.getWithPagination<Submission[]>(endpoint)
    return {
      submissions: response.data,
      total: response.pagination.total,
      page: response.pagination.page,
      limit: response.pagination.limit,
      totalPages: response.pagination.totalPages,
    }
  },

  /**
   * Get submissions for a specific problem
   */
  async getProblemSubmissions(problemId: string, params: Omit<SubmissionListParams, 'problemId'> = {}): Promise<SubmissionListResponse> {
    const searchParams = new URLSearchParams()
    
    if (params.userId) searchParams.set('userId', params.userId)
    if (params.status) searchParams.set('status', params.status)
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())

    const queryString = searchParams.toString()
    const endpoint = queryString ? `/submissions/problem/${problemId}?${queryString}` : `/submissions/problem/${problemId}`
    
    const response = await api.getWithPagination<Submission[]>(endpoint)
    return {
      submissions: response.data,
      total: response.pagination.total,
      page: response.pagination.page,
      limit: response.pagination.limit,
      totalPages: response.pagination.totalPages,
    }
  },

  /**
   * Get best submission for a problem
   */
  async getBestSubmission(problemId: string): Promise<Submission | null> {
    try {
      return await api.get<Submission>(`/submissions/best/${problemId}`)
    } catch {
      return null
    }
  },

  /**
   * Get all submissions (public)
   */
  async getSubmissions(params: SubmissionListParams = {}): Promise<SubmissionListResponse> {
    const searchParams = new URLSearchParams()
    
    if (params.userId) searchParams.set('userId', params.userId)
    if (params.problemId) searchParams.set('problemId', params.problemId)
    if (params.status) searchParams.set('status', params.status)
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())

    const queryString = searchParams.toString()
    const endpoint = queryString ? `/submissions?${queryString}` : '/submissions'
    
    const response = await api.getWithPagination<Submission[]>(endpoint)
    return {
      submissions: response.data,
      total: response.pagination.total,
      page: response.pagination.page,
      limit: response.pagination.limit,
      totalPages: response.pagination.totalPages,
    }
  },
}
