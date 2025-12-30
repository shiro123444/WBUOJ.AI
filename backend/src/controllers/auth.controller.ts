import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { authService } from '../services/auth.service.js'
import { oauthService } from '../services/oauth.service.js'
import { AppError, type AuthenticatedRequest } from '../types/index.js'
import { config } from '../config/index.js'

// Validation schemas
const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be at most 100 characters'),
})

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export class AuthController {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = registerSchema.parse(req.body)
      const result = await authService.register(validatedData)

      res.status(201).json({
        success: true,
        data: result,
        message: 'Registration successful',
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(
          new AppError(400, error.errors[0].message, 'VALIDATION_ERROR')
        )
      }
      next(error)
    }
  }

  /**
   * POST /api/auth/login
   * Login with username and password
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = loginSchema.parse(req.body)
      const result = await authService.login(validatedData)

      res.json({
        success: true,
        data: result,
        message: 'Login successful',
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(
          new AppError(400, error.errors[0].message, 'VALIDATION_ERROR')
        )
      }
      next(error)
    }
  }

  /**
   * GET /api/auth/me
   * Get current user info
   */
  async getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'AUTH_001')
      }

      const user = await authService.getCurrentUser(req.user.userId)

      res.json({
        success: true,
        data: { user },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/auth/logout
   * Logout (client-side token removal, server just acknowledges)
   */
  async logout(_req: Request, res: Response) {
    res.json({
      success: true,
      message: 'Logout successful',
    })
  }

  /**
   * GET /api/auth/oauth/github
   * Redirect to GitHub OAuth
   */
  async githubOAuth(req: Request, res: Response) {
    const redirectUri = req.query.redirect_uri as string || 
      `${req.protocol}://${req.get('host')}/api/auth/oauth/github/callback`
    
    const authUrl = oauthService.getGitHubAuthUrl(redirectUri)
    res.redirect(authUrl)
  }

  /**
   * GET /api/auth/oauth/github/callback
   * Handle GitHub OAuth callback
   */
  async githubOAuthCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, error, error_description } = req.query

      if (error) {
        throw new AppError(400, error_description as string || 'OAuth error', 'OAUTH_ERROR')
      }

      if (!code || typeof code !== 'string') {
        throw new AppError(400, 'Authorization code is required', 'OAUTH_NO_CODE')
      }

      const result = await oauthService.handleGitHubCallback(code)

      // In production, redirect to frontend with token
      // For now, return JSON response
      const frontendUrl = config.isDev ? 'http://localhost:5173' : ''
      
      if (frontendUrl) {
        // Redirect to frontend with token in URL fragment (more secure than query params)
        res.redirect(`${frontendUrl}/oauth/callback#token=${result.token}&expiresAt=${result.expiresAt}`)
      } else {
        res.json({
          success: true,
          data: result,
          message: 'GitHub login successful',
        })
      }
    } catch (error) {
      next(error)
    }
  }
}

export const authController = new AuthController()
