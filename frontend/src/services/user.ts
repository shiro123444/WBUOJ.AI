import { api } from './api'
import type { User } from '../types'

export interface UserProfile extends User {
  recentSubmissions: {
    id: string
    problemId: string
    problemTitle: string
    status: string
    language: string
    createdAt: string
  }[]
  solvedByDifficulty: {
    easy: number
    medium: number
    hard: number
  }
}

export interface UpdateProfileRequest {
  bio?: string
  avatar?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export const userService = {
  async getMyProfile(): Promise<UserProfile> {
    return api.get<UserProfile>('/users/me/profile')
  },

  async getUserProfile(id: string): Promise<UserProfile> {
    return api.get<UserProfile>(`/users/${id}`)
  },

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    return api.put<User>('/users/me/profile', data)
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await api.put<void>('/users/me/password', data)
  },
}
