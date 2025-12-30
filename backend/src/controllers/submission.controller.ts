import type { Response, NextFunction } from 'express'
import { z } from 'zod'
import { submissionService } from '../services/submission.service.js'
import type { AuthenticatedRequest } from '../types/index.js'
import { AppError } from '../types/index.js'

/**
 * 提交代码验证 schema
 */
const submitCodeSchema = z.object({
  problemId: z.string().min(1, 'Problem ID is required'),
  code: z.string().min(1, 'Code is required').max(65536, 'Code too long'),
  language: z.enum(['cpp', 'python', 'java', 'javascript', 'go']),
})

/**
 * 提交列表查询验证 schema
 */
const listQuerySchema = z.object({
  userId: z.string().optional(),
  problemId: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

/**
 * 提交控制器
 */
export class SubmissionController {
  /**
   * POST /api/submissions
   * 提交代码
   */
  async submitCode(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'AUTH_001')
      }

      const validatedData = submitCodeSchema.parse(req.body)
      const result = await submissionService.submitCode(validatedData, req.user.userId)

      res.status(201).json({
        success: true,
        data: {
          submissionId: result.submissionId,
          status: 'pending',
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION'))
      }
      next(error)
    }
  }

  /**
   * GET /api/submissions/:id
   * 获取提交详情
   */
  async getSubmission(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const userId = req.user?.userId

      const submission = await submissionService.getSubmission(id, userId)

      res.json({
        success: true,
        data: submission,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/submissions
   * 获取提交列表
   */
  async getSubmissions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query = listQuerySchema.parse(req.query)
      const result = await submissionService.getSubmissions(query)

      res.json({
        success: true,
        data: result.submissions,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION'))
      }
      next(error)
    }
  }

  /**
   * GET /api/submissions/my
   * 获取当前用户的提交列表
   */
  async getMySubmissions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'AUTH_001')
      }

      const query = listQuerySchema.parse({
        ...req.query,
        userId: req.user.userId,
      })
      const result = await submissionService.getSubmissions(query)

      res.json({
        success: true,
        data: result.submissions,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION'))
      }
      next(error)
    }
  }

  /**
   * GET /api/submissions/problem/:problemId
   * 获取某题目的提交列表
   */
  async getProblemSubmissions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { problemId } = req.params
      const query = listQuerySchema.parse({
        ...req.query,
        problemId,
      })
      const result = await submissionService.getSubmissions(query)

      res.json({
        success: true,
        data: result.submissions,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION'))
      }
      next(error)
    }
  }

  /**
   * GET /api/submissions/best/:problemId
   * 获取当前用户在某题目的最佳提交
   */
  async getBestSubmission(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'AUTH_001')
      }

      const { problemId } = req.params
      const submission = await submissionService.getBestSubmission(req.user.userId, problemId)

      res.json({
        success: true,
        data: submission,
      })
    } catch (error) {
      next(error)
    }
  }
}

// 单例导出
export const submissionController = new SubmissionController()
