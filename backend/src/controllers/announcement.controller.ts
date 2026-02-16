import type { Response, NextFunction } from 'express'
import { z } from 'zod'
import { announcementService } from '../services/announcement.service.js'
import { AppError, type AuthenticatedRequest } from '../types/index.js'

const createSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  priority: z.enum(['NORMAL', 'IMPORTANT', 'URGENT']).optional(),
  targetAudience: z.enum(['ALL', 'STUDENTS', 'ADMINS']).optional(),
  publishAt: z.string().optional(),
  expiresAt: z.string().optional(),
  isPinned: z.boolean().optional(),
})

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  priority: z.enum(['NORMAL', 'IMPORTANT', 'URGENT']).optional(),
  targetAudience: z.enum(['ALL', 'STUDENTS', 'ADMINS']).optional(),
  publishAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  isPinned: z.boolean().optional(),
})

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  includeUnpublished: z.coerce.boolean().optional(),
})

export class AnnouncementController {
  /** GET /api/announcements */
  async getAnnouncements(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query = listQuerySchema.parse(req.query)
      const userId = req.user?.userId
      const userRole = req.user?.role
      const result = await announcementService.getAnnouncements(query, userId, userRole)
      res.json({ success: true, data: result })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION_ERROR'))
      }
      next(error)
    }
  }

  /** GET /api/announcements/unread-count */
  async getUnreadCount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Authentication required', 'AUTH_001')
      const result = await announcementService.getUnreadCount(req.user.userId, req.user.role)
      res.json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  }

  /** GET /api/announcements/:id */
  async getAnnouncementById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const userId = req.user?.userId
      const announcement = await announcementService.getAnnouncementById(id, userId)
      res.json({ success: true, data: { announcement } })
    } catch (error) {
      next(error)
    }
  }

  /** POST /api/announcements */
  async createAnnouncement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Authentication required', 'AUTH_001')
      const data = createSchema.parse(req.body)
      const result = await announcementService.createAnnouncement(data, req.user.userId)
      res.status(201).json({ success: true, data: { announcement: result }, message: 'Announcement created' })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION_ERROR'))
      }
      next(error)
    }
  }

  /** PUT /api/announcements/:id */
  async updateAnnouncement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const data = updateSchema.parse(req.body)
      const result = await announcementService.updateAnnouncement(id, data)
      res.json({ success: true, data: { announcement: result }, message: 'Announcement updated' })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION_ERROR'))
      }
      next(error)
    }
  }

  /** POST /api/announcements/:id/publish */
  async togglePublish(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const result = await announcementService.togglePublish(id)
      res.json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  }

  /** DELETE /api/announcements/:id */
  async deleteAnnouncement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await announcementService.deleteAnnouncement(id)
      res.json({ success: true, message: 'Announcement deleted' })
    } catch (error) {
      next(error)
    }
  }
}

export const announcementController = new AnnouncementController()
