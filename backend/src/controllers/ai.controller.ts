import type { Response, NextFunction } from 'express'
import { z } from 'zod'
import { aiService } from '../services/ai.service.js'
import { aiAdminService } from '../services/ai-admin.service.js'
import { AppError, type AuthenticatedRequest } from '../types/index.js'

// Enhanced validation schemas
const codeCompleteSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  language: z.string().min(1, 'Language is required'),
  cursorPosition: z.number().min(0, 'Cursor position must be non-negative'),
})

const inlineCompleteSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  language: z.string().min(1, 'Language is required'),
  cursorPosition: z.number().min(0, 'Cursor position must be non-negative'),
  fileContext: z.string(),
  projectContext: z.object({
    files: z.array(z.object({
      path: z.string(),
      content: z.string().optional(),
      type: z.enum(['file', 'directory']),
      size: z.number().optional(),
    })).optional(),
    structure: z.any().optional(),
    language: z.string(),
    framework: z.string().optional(),
  }).optional(),
})

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  conversationId: z.string().optional(),
  codeContext: z.object({
    currentFile: z.string(),
    selectedCode: z.string().optional(),
    cursorPosition: z.number(),
    openFiles: z.array(z.string()),
    projectStructure: z.any(),
  }).optional(),
  images: z.array(z.string()).optional(), // base64 encoded images
  problemId: z.string().optional(),
})

const analyzeCodeSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  language: z.string().min(1, 'Language is required'),
  analysisType: z.enum(['explain', 'review', 'security', 'performance']),
})

const debugErrorSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  error: z.string().min(1, 'Error message is required'),
  language: z.string().min(1, 'Language is required'),
  stackTrace: z.string().optional(),
  screenshot: z.string().optional(), // base64 encoded
})

const suggestFilesSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  currentFiles: z.array(z.object({
    path: z.string(),
    content: z.string().optional(),
    type: z.enum(['file', 'directory']),
    size: z.number().optional(),
  })),
  projectStructure: z.any(),
})

const hintSchema = z.object({
  problemId: z.string().min(1, 'Problem ID is required'),
  currentCode: z.string().default(''),
})

const explainSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  language: z.string().min(1, 'Language is required'),
})

const analyzeErrorSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  error: z.string().min(1, 'Error message is required'),
  language: z.string().min(1, 'Language is required'),
})

const updateConfigSchema = z.object({
  dailyLimit: z.number().min(0).optional(),
  enabled: z.boolean().optional(),
})

const setUserQuotaSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  limit: z.number().min(0, 'Limit must be non-negative'),
})

export class AIController {
  /**
   * POST /api/ai/complete
   * Code completion
   */
  async complete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_001')
      }

      const validatedData = codeCompleteSchema.parse(req.body)
      
      // Validate request (check contest status)
      await aiService.validateRequest(req.user.userId)
      
      const result = await aiService.complete(req.user.userId, validatedData)

      res.json({
        success: true,
        data: {
          suggestions: result.suggestions,
          remainingQuota: result.remainingQuota,
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION_ERROR'))
      }
      next(error)
    }
  }

  /**
   * POST /api/ai/hint
   * Get hint for a problem
   */
  async getHint(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_001')
      }

      const validatedData = hintSchema.parse(req.body)
      
      // Validate request (check contest status)
      await aiService.validateRequest(req.user.userId)
      
      const result = await aiService.getHint(req.user.userId, validatedData)

      res.json({
        success: true,
        data: {
          hint: result.hint,
          remainingQuota: result.remainingQuota,
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION_ERROR'))
      }
      next(error)
    }
  }

  /**
   * POST /api/ai/explain
   * Explain code
   */
  async explain(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_001')
      }

      const validatedData = explainSchema.parse(req.body)
      
      // Validate request (check contest status)
      await aiService.validateRequest(req.user.userId)
      
      const result = await aiService.explain(req.user.userId, validatedData)

      res.json({
        success: true,
        data: {
          explanation: result.explanation,
          remainingQuota: result.remainingQuota,
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION_ERROR'))
      }
      next(error)
    }
  }

  /**
   * POST /api/ai/analyze-error
   * Analyze error
   */
  async analyzeError(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_001')
      }

      const validatedData = analyzeErrorSchema.parse(req.body)
      
      // Validate request (check contest status)
      await aiService.validateRequest(req.user.userId)
      
      const result = await aiService.analyzeError(req.user.userId, validatedData)

      res.json({
        success: true,
        data: {
          analysis: result.analysis,
          suggestions: result.suggestions,
          remainingQuota: result.remainingQuota,
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION_ERROR'))
      }
      next(error)
    }
  }

  /**
   * GET /api/ai/quota
   * Get user's AI usage quota
   */
  async getQuota(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_001')
      }

      const quota = await aiService.getQuota(req.user.userId)

      res.json({
        success: true,
        data: quota,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/ai/inline-complete
   * Real-time inline code completion
   */
  async inlineComplete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_001')
      }

      const validatedData = inlineCompleteSchema.parse(req.body)
      
      // Validate request (check contest status)
      await aiService.validateRequest(req.user.userId)
      
      const result = await aiService.inlineComplete(req.user.userId, validatedData)

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
   * POST /api/ai/chat
   * Conversational AI chat
   */
  async chat(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_001')
      }

      const validatedData = chatSchema.parse(req.body)
      
      // Validate request (check contest status)
      await aiService.validateRequest(req.user.userId)
      
      const result = await aiService.chat(req.user.userId, validatedData)

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
   * GET /api/ai/conversations/:id
   * Get conversation history
   */
  async getConversation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_001')
      }

      const { id } = req.params
      if (!id) {
        throw new AppError(400, 'Conversation ID is required', 'VALIDATION_ERROR')
      }

      const result = await aiService.getConversation(req.user.userId, id)

      res.json({
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/ai/conversations
   * List user's conversations
   */
  async listConversations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_001')
      }

      const { page, limit, problemId } = req.query
      
      const result = await aiService.listConversations(req.user.userId, {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        problemId: problemId as string | undefined,
      })

      res.json({
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/ai/analyze-code
   * Analyze code with multiple analysis types
   */
  async analyzeCode(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_001')
      }

      const validatedData = analyzeCodeSchema.parse(req.body)
      
      // Validate request (check contest status)
      await aiService.validateRequest(req.user.userId)
      
      const result = await aiService.analyzeCode(req.user.userId, validatedData)

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
   * POST /api/ai/debug-error
   * Debug errors with AI assistance
   */
  async debugError(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_001')
      }

      const validatedData = debugErrorSchema.parse(req.body)
      
      // Validate request (check contest status)
      await aiService.validateRequest(req.user.userId)
      
      const result = await aiService.debugError(req.user.userId, validatedData)

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
   * POST /api/ai/suggest-files
   * Suggest file operations
   */
  async suggestFiles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_001')
      }

      const validatedData = suggestFilesSchema.parse(req.body)
      
      // Validate request (check contest status)
      await aiService.validateRequest(req.user.userId)
      
      const result = await aiService.suggestFiles(req.user.userId, validatedData)

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

  // ==================== Admin Endpoints ====================

  /**
   * GET /api/ai/admin/config
   * Get AI configuration (admin only)
   */
  async getConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        throw new AppError(403, 'Admin access required', 'AUTH_004')
      }

      const config = await aiAdminService.getConfig()

      res.json({
        success: true,
        data: config,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /api/ai/admin/config
   * Update AI configuration (admin only)
   */
  async updateConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        throw new AppError(403, 'Admin access required', 'AUTH_004')
      }

      const validatedData = updateConfigSchema.parse(req.body)
      const config = await aiAdminService.updateConfig(validatedData)

      res.json({
        success: true,
        data: config,
        message: 'AI configuration updated successfully',
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION_ERROR'))
      }
      next(error)
    }
  }

  /**
   * POST /api/ai/admin/user-quota
   * Set custom quota for a user (admin only)
   */
  async setUserQuota(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        throw new AppError(403, 'Admin access required', 'AUTH_004')
      }

      const validatedData = setUserQuotaSchema.parse(req.body)
      await aiAdminService.setUserQuotaLimit(validatedData.userId, validatedData.limit)

      res.json({
        success: true,
        message: 'User quota updated successfully',
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, error.errors[0].message, 'VALIDATION_ERROR'))
      }
      next(error)
    }
  }

  /**
   * POST /api/ai/admin/reset-quota/:userId
   * Reset user's daily quota (admin only)
   */
  async resetUserQuota(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        throw new AppError(403, 'Admin access required', 'AUTH_004')
      }

      const { userId } = req.params
      if (!userId) {
        throw new AppError(400, 'User ID is required', 'VALIDATION_ERROR')
      }

      await aiAdminService.resetUserQuota(userId)

      res.json({
        success: true,
        message: 'User quota reset successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/ai/admin/stats
   * Get AI usage statistics (admin only)
   */
  async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        throw new AppError(403, 'Admin access required', 'AUTH_004')
      }

      const { startDate, endDate, userId } = req.query

      const stats = await aiAdminService.getUsageStats({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        userId: userId as string | undefined,
      })

      res.json({
        success: true,
        data: stats,
      })
    } catch (error) {
      next(error)
    }
  }
}

export const aiController = new AIController()
