import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { problemService } from '../services/problem.service.js'
import { AppError, type AuthenticatedRequest } from '../types/index.js'

// Validation schemas
const createProblemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required'),
  inputFormat: z.string().min(1, 'Input format is required'),
  outputFormat: z.string().min(1, 'Output format is required'),
  constraints: z.string().min(1, 'Constraints are required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
  timeLimit: z.number().int().min(100).max(10000).optional(),
  memoryLimit: z.number().int().min(16).max(1024).optional(),
  examples: z.array(z.object({
    input: z.string(),
    output: z.string(),
    explanation: z.string().optional(),
  })).min(1, 'At least one example is required'),
  testCases: z.array(z.object({
    input: z.string(),
    expectedOutput: z.string(),
    isExample: z.boolean().optional(),
  })).min(1, 'At least one test case is required'),
})

const updateProblemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  inputFormat: z.string().min(1).optional(),
  outputFormat: z.string().min(1).optional(),
  constraints: z.string().min(1).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  tags: z.array(z.string()).min(1).optional(),
  timeLimit: z.number().int().min(100).max(10000).optional(),
  memoryLimit: z.number().int().min(16).max(1024).optional(),
  examples: z.array(z.object({
    input: z.string(),
    output: z.string(),
    explanation: z.string().optional(),
  })).optional(),
  testCases: z.array(z.object({
    input: z.string(),
    expectedOutput: z.string(),
    isExample: z.boolean().optional(),
  })).optional(),
})

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  tags: z.string().optional(), // comma-separated
  search: z.string().optional(),
})

const batchImportSchema = z.object({
  format: z.enum(['json', 'csv']),
  data: z.union([z.array(z.any()), z.string()]),
})

export class ProblemController {
  /**
   * POST /api/problems
   * Create a new problem (admin only)
   */
  async createProblem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_001')
      }

      const validatedData = createProblemSchema.parse(req.body)
      const result = await problemService.createProblem(validatedData, req.user.userId)

      res.status(201).json({
        success: true,
        data: { problem: result },
        message: 'Problem created successfully',
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION_ERROR'))
      }
      next(error)
    }
  }

  /**
   * GET /api/problems
   * Get problem list with pagination and filtering
   */
  async getProblems(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listQuerySchema.parse(req.query)
      
      // Parse tags from comma-separated string
      const tags = query.tags ? query.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined

      const result = await problemService.getProblems({
        page: query.page,
        limit: query.limit,
        difficulty: query.difficulty,
        tags,
        search: query.search,
      })

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
   * GET /api/problems/:id
   * Get problem detail by ID or number
   */
  async getProblemById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const problem = await problemService.getProblemById(id)

      res.json({
        success: true,
        data: { problem },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /api/problems/:id
   * Update a problem (admin only)
   */
  async updateProblem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_001')
      }

      const { id } = req.params
      const validatedData = updateProblemSchema.parse(req.body)
      const result = await problemService.updateProblem(id, validatedData)

      res.json({
        success: true,
        data: { problem: result },
        message: 'Problem updated successfully',
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION_ERROR'))
      }
      next(error)
    }
  }

  /**
   * DELETE /api/problems/:id
   * Delete a problem (admin only)
   */
  async deleteProblem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_001')
      }

      const { id } = req.params
      await problemService.deleteProblem(id)

      res.json({
        success: true,
        message: 'Problem deleted successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/problems/tags
   * Get all unique tags
   */
  async getAllTags(_req: Request, res: Response, next: NextFunction) {
    try {
      const tags = await problemService.getAllTags()

      res.json({
        success: true,
        data: { tags },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/problems/import
   * Batch import problems from JSON or CSV format (admin only)
   */
  async batchImport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_001')
      }

      const validatedData = batchImportSchema.parse(req.body)
      
      let result
      if (validatedData.format === 'json') {
        if (!Array.isArray(validatedData.data)) {
          throw new AppError(400, 'JSON format requires data to be an array', 'VALIDATION_ERROR')
        }
        result = await problemService.batchImportJSON(validatedData.data, req.user.userId)
      } else {
        if (typeof validatedData.data !== 'string') {
          throw new AppError(400, 'CSV format requires data to be a string', 'VALIDATION_ERROR')
        }
        result = await problemService.batchImportCSV(validatedData.data, req.user.userId)
      }

      res.status(201).json({
        success: true,
        data: result,
        message: `Imported ${result.successful} of ${result.total} problems successfully`,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION_ERROR'))
      }
      next(error)
    }
  }
}

export const problemController = new ProblemController()
