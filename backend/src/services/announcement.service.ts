import crypto from 'crypto'
import { prisma } from '../config/database.js'
import { AppError } from '../types/index.js'

// Input types
export interface CreateAnnouncementInput {
  title: string
  content: string
  priority?: 'NORMAL' | 'IMPORTANT' | 'URGENT'
  targetAudience?: 'ALL' | 'STUDENTS' | 'ADMINS'
  publishAt?: string
  expiresAt?: string
  isPinned?: boolean
}

export interface UpdateAnnouncementInput {
  title?: string
  content?: string
  priority?: 'NORMAL' | 'IMPORTANT' | 'URGENT'
  targetAudience?: 'ALL' | 'STUDENTS' | 'ADMINS'
  publishAt?: string | null
  expiresAt?: string | null
  isPinned?: boolean
}

export interface AnnouncementListQuery {
  page?: number
  limit?: number
  includeUnpublished?: boolean
}

// Response types
export interface AnnouncementListItem {
  id: string
  title: string
  priority: string
  targetAudience: string
  isPublished: boolean
  isPinned: boolean
  publishAt: Date | null
  expiresAt: Date | null
  createdBy: string
  createdAt: Date
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
  publishAt: Date | null
  expiresAt: Date | null
  createdBy: string
  createdByName: string
  createdAt: Date
  updatedAt: Date
  isRead?: boolean
}

export class AnnouncementService {
  /**
   * Get published announcements (for regular users)
   */
  async getAnnouncements(
    query: AnnouncementListQuery,
    userId?: string,
    userRole?: string
  ): Promise<{
    announcements: AnnouncementListItem[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    const { page = 1, limit = 20, includeUnpublished = false } = query
    const skip = (page - 1) * limit
    const now = new Date()

    const where: Record<string, unknown> = {}

    if (!includeUnpublished) {
      where.is_published = true
      where.OR = [
        { publish_at: null },
        { publish_at: { lte: now } },
      ]
      // Filter by audience
      if (userRole !== 'admin') {
        where.target_audience = { in: ['ALL', 'STUDENTS'] }
      }
    }

    const [announcements, total] = await Promise.all([
      prisma.announcements.findMany({
        where: where as any,
        orderBy: [{ is_pinned: 'desc' }, { priority: 'desc' }, { created_at: 'desc' }],
        skip,
        take: limit,
        include: {
          users: { select: { username: true } },
        },
      }),
      prisma.announcements.count({ where: where as any }),
    ])

    // Get read status for user
    let readIds = new Set<string>()
    if (userId && announcements.length > 0) {
      const reads = await prisma.announcement_reads.findMany({
        where: {
          user_id: userId,
          announcement_id: { in: announcements.map((a) => a.id) },
        },
        select: { announcement_id: true },
      })
      readIds = new Set(reads.map((r) => r.announcement_id))
    }

    return {
      announcements: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        priority: a.priority,
        targetAudience: a.target_audience,
        isPublished: a.is_published,
        isPinned: a.is_pinned,
        publishAt: a.publish_at,
        expiresAt: a.expires_at,
        createdBy: a.users.username,
        createdAt: a.created_at,
        isRead: userId ? readIds.has(a.id) : undefined,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Get announcement detail
   */
  async getAnnouncementById(id: string, userId?: string): Promise<AnnouncementDetail> {
    const announcement = await prisma.announcements.findUnique({
      where: { id },
      include: {
        users: { select: { username: true } },
      },
    })

    if (!announcement) {
      throw new AppError(404, 'Announcement not found', 'ANNOUNCEMENT_NOT_FOUND')
    }

    // Mark as read
    let isRead = false
    if (userId) {
      const existing = await prisma.announcement_reads.findUnique({
        where: { announcement_id_user_id: { announcement_id: id, user_id: userId } },
      })
      if (existing) {
        isRead = true
      } else {
        await prisma.announcement_reads.create({
          data: {
            id: crypto.randomUUID(),
            announcement_id: id,
            user_id: userId,
          },
        })
      }
    }

    return {
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      targetAudience: announcement.target_audience,
      isPublished: announcement.is_published,
      isPinned: announcement.is_pinned,
      publishAt: announcement.publish_at,
      expiresAt: announcement.expires_at,
      createdBy: announcement.created_by,
      createdByName: announcement.users.username,
      createdAt: announcement.created_at,
      updatedAt: announcement.updated_at,
      isRead,
    }
  }

  /**
   * Create announcement (admin only)
   */
  async createAnnouncement(input: CreateAnnouncementInput, adminId: string): Promise<{ id: string; title: string }> {
    const id = crypto.randomUUID()
    const now = new Date()

    const announcement = await prisma.announcements.create({
      data: {
        id,
        title: input.title,
        content: input.content,
        priority: input.priority ?? 'NORMAL',
        target_audience: input.targetAudience ?? 'ALL',
        publish_at: input.publishAt ? new Date(input.publishAt) : null,
        expires_at: input.expiresAt ? new Date(input.expiresAt) : null,
        is_pinned: input.isPinned ?? false,
        is_published: !input.publishAt, // Auto-publish if no scheduled time
        created_by: adminId,
        updated_at: now,
      },
    })

    return { id: announcement.id, title: announcement.title }
  }

  /**
   * Update announcement (admin only)
   */
  async updateAnnouncement(id: string, input: UpdateAnnouncementInput): Promise<{ id: string; title: string }> {
    const announcement = await prisma.announcements.findUnique({ where: { id } })
    if (!announcement) {
      throw new AppError(404, 'Announcement not found', 'ANNOUNCEMENT_NOT_FOUND')
    }

    const updated = await prisma.announcements.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.content !== undefined && { content: input.content }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.targetAudience !== undefined && { target_audience: input.targetAudience }),
        ...(input.publishAt !== undefined && { publish_at: input.publishAt ? new Date(input.publishAt) : null }),
        ...(input.expiresAt !== undefined && { expires_at: input.expiresAt ? new Date(input.expiresAt) : null }),
        ...(input.isPinned !== undefined && { is_pinned: input.isPinned }),
        updated_at: new Date(),
      },
    })

    return { id: updated.id, title: updated.title }
  }

  /**
   * Publish/unpublish announcement (admin only)
   */
  async togglePublish(id: string): Promise<{ isPublished: boolean }> {
    const announcement = await prisma.announcements.findUnique({ where: { id } })
    if (!announcement) {
      throw new AppError(404, 'Announcement not found', 'ANNOUNCEMENT_NOT_FOUND')
    }

    const updated = await prisma.announcements.update({
      where: { id },
      data: { is_published: !announcement.is_published, updated_at: new Date() },
    })

    return { isPublished: updated.is_published }
  }

  /**
   * Delete announcement (admin only)
   */
  async deleteAnnouncement(id: string): Promise<void> {
    const announcement = await prisma.announcements.findUnique({ where: { id } })
    if (!announcement) {
      throw new AppError(404, 'Announcement not found', 'ANNOUNCEMENT_NOT_FOUND')
    }

    await prisma.announcements.delete({ where: { id } })
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string, userRole?: string): Promise<{ count: number }> {
    const now = new Date()

    const audienceFilter = userRole === 'admin'
      ? {}
      : { target_audience: { in: ['ALL', 'STUDENTS'] as const } }

    const total = await prisma.announcements.count({
      where: {
        is_published: true,
        OR: [{ publish_at: null }, { publish_at: { lte: now } }],
        ...audienceFilter,
      } as any,
    })

    const readCount = await prisma.announcement_reads.count({
      where: { user_id: userId },
    })

    return { count: Math.max(0, total - readCount) }
  }
}

export const announcementService = new AnnouncementService()
