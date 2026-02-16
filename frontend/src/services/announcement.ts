import { api } from './api'

export interface AnnouncementListItem {
  id: string
  title: string
  priority: string
  targetAudience: string
  isPublished: boolean
  isPinned: boolean
  publishAt: string | null
  expiresAt: string | null
  createdBy: string
  createdAt: string
  isRead?: boolean
}

export interface AnnouncementDetail {
  id: string
  title: string
  content: string
  priority: string
  targetAudience: string
  isPublished: boolean
  isPinned: boolean
  publishAt: string | null
  expiresAt: string | null
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
  isRead?: boolean
}

export interface AnnouncementListResponse {
  announcements: AnnouncementListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

class AnnouncementService {
  async getAnnouncements(options: { page?: number; limit?: number } = {}): Promise<AnnouncementListResponse> {
    const params = new URLSearchParams()
    if (options.page) params.set('page', String(options.page))
    if (options.limit) params.set('limit', String(options.limit))
    const qs = params.toString()
    return api.get<AnnouncementListResponse>(`/announcements${qs ? `?${qs}` : ''}`)
  }

  async getAnnouncementById(id: string): Promise<{ announcement: AnnouncementDetail }> {
    return api.get<{ announcement: AnnouncementDetail }>(`/announcements/${id}`)
  }

  async getUnreadCount(): Promise<{ count: number }> {
    return api.get<{ count: number }>('/announcements/unread-count')
  }
}

export const announcementService = new AnnouncementService()
