import type { Response, NextFunction } from 'express'
import { z } from 'zod'
import { solutionService } from '../services/solution.service.js'
import { AppError, type AuthenticatedRequest } from '../types/index.js'

// Validation schemas
const createSolutionSchema = z.object({
  problemId: z.string().min(1, 'Problem ID is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  code: z.string().optional(),
  language: z.string().optional(),
})

const updateSolutionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  code: z.string().optional(),
  language: z.string().optional(),
})

const listQuerySchema = z.object({
  problemId: z.string().min(1, 'Problem ID is required'),
  sort: z.enum(['hot', 'new']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(2000, 'Content too long'),
})

export class SolutionController {
  /**
   * POST /api/solutions
   * Create a new solution (requires solving the problem first)
   */
  async createSolution(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_001')
      }

      const validatedData = createSolutionSchema.parse(req.body)
      const result = await solutionService.createSolution(validatedData, req.user.userId)

      res.status(201).json({
        success: true,
        data: { solution: result },
        message: 'Solution created successfully',
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION_ERROR'))
      }
      next(error)
    }
  }

  /**
   * GET /api/solutions
   * Get solution list for a problem
   */
  async getSolutions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query = listQuerySchema.parse(req.query)
      const userId = req.user?.userId

      const result = await solutionService.getSolutions(query, userId)

      res.json({
        success: true,
        data: result,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION_ERROR'))
      }
      next(error)
    }
  }

  /**
   * GET /api/solutions/:id
   * Get solution detail
   */
  async getSolutionById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const userId = req.user?.userId

      const solution = await solutionService.getSolutionById(id, userId)

      res.json({
        success: true,
        data: { solution },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /api/solutions/:id
   * Update a solution (author only)
   */
  async updateSolution(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_001')
      }

      const { id } = req.params
      const validatedData = updateSolutionSchema.parse(req.body)
      const result = await solutionService.updateSolution(id, validatedData, req.user.userId)

      res.json({
        success: true,
        data: { solution: result },
        message: 'Solution updated successfully',
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION_ERROR'))
      }
      next(error)
    }
  }

  /**
   * DELETE /api/solutions/:id
   * Delete a solution (author or admin only)
   */
  async deleteSolution(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_001')
      }

      const { id } = req.params
      const isAdmin = req.user.role === 'admin'
      await solutionService.deleteSolution(id, req.user.userId, isAdmin)

      res.json({
        success: true,
        message: 'Solution deleted successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/solutions/:id/like
   * Like or unlike a solution
   */
  async toggleLike(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_001')
      }

      const { id } = req.params
      const result = await solutionService.toggleLike(id, req.user.userId)

      res.json({
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/solutions/:id/comments
   * Add a comment to a solution
   */
  async addComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_001')
      }

      const { id } = req.params
      const validatedData = createCommentSchema.parse(req.body)
      const result = await solutionService.addComment(
        { solutionId: id, content: validatedData.content },
        req.user.userId
      )

      res.status(201).json({
        success: true,
        data: { comment: result },
        message: 'Comment added successfully',
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION_ERROR'))
      }
      next(error)
    }
  }

  /**
   * DELETE /api/solutions/:solutionId/comments/:commentId
   * Delete a comment (author or admin only)
   */
  async deleteComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_001')
      }

      const { commentId } = req.params
      const isAdmin = req.user.role === 'admin'
      await solutionService.deleteComment(commentId, req.user.userId, isAdmin)

      res.json({
        success: true,
        message: 'Comment deleted successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/solutions/:solutionId/comments/:commentId/like
   * Like or unlike a comment
   */
  async toggleCommentLike(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_001')
      }

      const { commentId } = req.params
      const result = await solutionService.toggleCommentLike(commentId, req.user.userId)

      res.json({
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }
}

export const solutionController = new SolutionController()
