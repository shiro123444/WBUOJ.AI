const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

interface ApiError {
  success: false
  error: string
  code?: string
}

interface ApiSuccess<T> {
  success: true
  data: T
  message?: string
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

type ApiResponse<T> = ApiSuccess<T> | ApiError

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    // Try to get token from localStorage
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage)
        this.token = parsed.state?.token || null
      } catch {
        // Ignore parse errors
      }
    }
  }

  setToken(token: string | null) {
    this.token = token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json() as ApiResponse<T>

    if (!response.ok || !('success' in data) || !data.success) {
      const error = data as ApiError
      throw new Error(error.error || 'Request failed')
    }

    return (data as ApiSuccess<T>).data
  }

  private async requestWithPagination<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json() as ApiResponse<T>

    if (!response.ok || !('success' in data) || !data.success) {
      const error = data as ApiError
      throw new Error(error.error || 'Request failed')
    }

    const successData = data as ApiSuccess<T>
    return {
      data: successData.data,
      pagination: successData.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 },
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async getWithPagination<T>(endpoint: string): Promise<{ data: T; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    return this.requestWithPagination<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const api = new ApiClient(API_BASE_URL)
