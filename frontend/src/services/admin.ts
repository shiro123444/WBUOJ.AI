import { api } from './api'

export interface AdminUser {
  id: string
  username: string
  email: string
  role: string
  level: number
  solvedCount: number
  submissionCount: number
  score: number
  isDisabled: boolean
  createdAt: string
  lastLoginAt: string | null
}

export interface DashboardStats {
  totalUsers: number
  totalProblems: number
  totalSubmissions: number
  totalSolutions: number
  todayUsers: number
  todaySubmissions: number
}

export interface SystemConfig {
  id: string
  key: string
  value: string
  updatedAt: string
}

export interface AdminLog {
  id: string
  adminUsername: string
  action: string
  targetType: string
  targetId: string | null
  details: string | null
  createdAt: string
}

export const adminService = {
  // Dashboard
  async getStats(): Promise<DashboardStats> {
    return api.get<DashboardStats>('/admin/stats')
  },

  // User management
  async listUsers(params?: {
    page?: number
    limit?: number
    search?: string
    role?: string
    sort?: string
  }): Promise<{ users: AdminUser[]; pagination: any }> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.search) query.set('search', params.search)
    if (params?.role) query.set('role', params.role)
    if (params?.sort) query.set('sort', params.sort)
    return api.get(`/admin/users?${query}`)
  },

  async updateUserRole(userId: string, role: string): Promise<void> {
    await api.put(`/admin/users/${userId}/role`, { role })
  },

  async disableUser(userId: string, reason?: string): Promise<void> {
    await api.post(`/admin/users/${userId}/disable`, { reason })
  },

  async enableUser(userId: string): Promise<void> {
    await api.post(`/admin/users/${userId}/enable`)
  },

  // System config
  async getConfigs(): Promise<SystemConfig[]> {
    return api.get<SystemConfig[]>('/admin/configs')
  },

  async setConfig(key: string, value: string): Promise<void> {
    await api.put('/admin/configs', { key, value })
  },

  async deleteConfig(key: string): Promise<void> {
    await api.delete(`/admin/configs/${key}`)
  },

  // Logs
  async getLogs(page = 1, limit = 20): Promise<{ logs: AdminLog[]; pagination: any }> {
    return api.get(`/admin/logs?page=${page}&limit=${limit}`)
  },
}
