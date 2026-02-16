import { api } from './api'

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  condition: string
}

export interface UserBadge {
  id: string
  name: string
  description: string
  icon: string
  earnedAt: string
}

export interface BadgeOverviewItem {
  id: string
  name: string
  description: string
  icon: string
  condition: string
  earned: boolean
  earnedAt: string | null
}

export const badgeService = {
  async getAllBadges(): Promise<Badge[]> {
    return api.get<Badge[]>('/badges')
  },

  async getMyBadges(): Promise<UserBadge[]> {
    return api.get<UserBadge[]>('/badges/me')
  },

  async getMyBadgeOverview(): Promise<BadgeOverviewItem[]> {
    return api.get<BadgeOverviewItem[]>('/badges/me/overview')
  },

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return api.get<UserBadge[]>(`/badges/users/${userId}`)
  },
}
