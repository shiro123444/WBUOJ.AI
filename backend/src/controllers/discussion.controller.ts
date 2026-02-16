import type { Response, NextFunction } from 'express'
import { z } from 'zod'
import { discussionService } from '../services/discussion.service.js'
import { AppError, type AuthenticatedRequest } from '../types/index.js'

const createDiscussionSchema = z.object({
  problemId: z.string().min(1, 'Problem ID is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required').max(50000, 'Content too long'),
  tags: z.array(z.string().max(30)).max(5).optional(),
})

const updateDiscussionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(50000).optional(),
  tags: z.array(z.string().max(30)).max(5).optional(),
})

const listQuerySchema = z.object({
  problemId: z.string().min(1, 'Problem ID is required'),
  sort: z.enum(['newest', 'hottest', 'most_replies']).optional(),
  tag: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

const createReplySchema = z.object({
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long'),
  parentId: z.string().optional(),
  mentions: z.array(z.string()).max(10).optional(),
})

const updateReplySchema = z.object({
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long'),
})

const reactionSchema = z.object({
  type: z.enum(['LIKE', 'DISLIKE']),
})

const repliesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

export class DiscussionController {
  /** GET /api/discussions */
  async getDiscussions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query = listQuerySchema.parse(req.query)
      const result = await discussionService.getDiscussions(query)
      res.json({ success: true, data: result })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION_ERROR'))
      }
      next(error)
    }
  }

  /** GET /api/discussions/:id */
  async getDiscussionById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const userId = req.user?.userId
      const discussion = await discussionService.getDiscussionById(id, userId)
      res.json({ success: true, data: { discussion } })
    } catch (error) {
      next(error)
    }
  }

  /** POST /api/discussions */
  async createDiscussion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Authentication required', 'AUTH_001')
      const data = createDiscussionSchema.parse(req.body)
      const result = await discussionService.createDiscussion(data, req.user.userId)
      res.status(201).json({ success: true, data: { discussion: result }, message: 'Discussion created' })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION_ERROR'))
      }
      next(error)
    }
  }

  /** PUT /api/discussions/:id */
  async updateDiscussion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Authentication required', 'AUTH_001')
      const { id } = req.params
      const data = updateDiscussionSchema.parse(req.body)
      const result = await discussionService.updateDiscussion(id, data, req.user.userId)
      res.json({ success: true, data: { discussion: result }, message: 'Discussion updated' })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION_ERROR'))
      }
      next(error)
    }
  }

  /** DELETE /api/discussions/:id */
  async deleteDiscussion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Authentication required', 'AUTH_001')
      const { id } = req.params
      const isAdmin = req.user.role === 'admin'
      await discussionService.deleteDiscussion(id, req.user.userId, isAdmin)
      res.json({ success: true, message: 'Discussion deleted' })
    } catch (error) {
      next(error)
    }
  }

  /** POST /api/discussions/:id/react */
  async reactToDiscussion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Authentication required', 'AUTH_001')
      const { id } = req.params
      const { type } = reactionSchema.parse(req.body)
      const result = await discussionService.reactToDiscussion(id, req.user.userId, type)
      res.json({ success: true, data: result })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION_ERROR'))
      }
      next(error)
    }
  }

  /** POST /api/discussions/:id/pin */
  async togglePin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Authentication required', 'AUTH_001')
      const { id } = req.params
      const result = await discussionService.togglePin(id)
      res.json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  }

  /** POST /api/discussions/:id/lock */
  async toggleLock(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Authentication required', 'AUTH_001')
      const { id } = req.params
      const result = await discussionService.toggleLock(id)
      res.json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  }

  // ==================== Replies ====================

  /** GET /api/discussions/:id/replies */
  async getReplies(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const userId = req.user?.userId
      const { page, limit } = repliesQuerySchema.parse(req.query)
      const result = await discussionService.getReplies(id, userId, page, limit)
      res.json({ success: true, data: result })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION_ERROR'))
      }
      next(error)
    }
  }

  /** POST /api/discussions/:id/replies */
  async createReply(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Authentication required', 'AUTH_001')
      const { id } = req.params
      const data = createReplySchema.parse(req.body)
      const result = await discussionService.createReply(
        { discussionId: id, ...data },
        req.user.userId
      )
      res.status(201).json({ success: true, data: { reply: result }, message: 'Reply created' })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION_ERROR'))
      }
      next(error)
    }
  }

  /** PUT /api/discussions/:discussionId/replies/:replyId */
  async updateReply(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Authentication required', 'AUTH_001')
      const { replyId } = req.params
      const data = updateReplySchema.parse(req.body)
      const result = await discussionService.updateReply(replyId, data, req.user.userId)
      res.json({ success: true, data: { reply: result }, message: 'Reply updated' })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION_ERROR'))
      }
      next(error)
    }
  }

  /** DELETE /api/discussions/:discussionId/replies/:replyId */
  async deleteReply(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Authentication required', 'AUTH_001')
      const { replyId } = req.params
      const isAdmin = req.user.role === 'admin'
      await discussionService.deleteReply(replyId, req.user.userId, isAdmin)
      res.json({ success: true, message: 'Reply deleted' })
    } catch (error) {
      next(error)
    }
  }

  /** POST /api/discussions/:discussionId/replies/:replyId/react */
  async reactToReply(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Authentication required', 'AUTH_001')
      const { replyId } = req.params
      const { type } = reactionSchema.parse(req.body)
      const result = await discussionService.reactToReply(replyId, req.user.userId, type)
      res.json({ success: true, data: result })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION_ERROR'))
      }
      next(error)
    }
  }
}

export const discussionController = new DiscussionController()
