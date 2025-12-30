import { api } from './api'
import type { User, LoginRequest, RegisterRequest } from '../types'

interface AuthResponse {
  token: string
  user: User
  expiresAt: number
}

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data)
    api.setToken(response.token)
    return response
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data)
    api.setToken(response.token)
    return response
  },

  async getCurrentUser(): Promise<{ user: User }> {
    return api.get<{ user: User }>('/auth/me')
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
    api.setToken(null)
  },

  getGitHubOAuthUrl(): string {
    const apiUrl = import.meta.env.VITE_API_URL || '/api'
    return `${apiUrl}/auth/oauth/github`
  },
}
