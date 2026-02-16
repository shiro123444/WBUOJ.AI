import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { userService } from '../services/user.service.js'
import { AppError, type AuthenticatedRequest } from '../types/index.js'

const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100),
})

class UserController {
  async getMyProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized')
      const profile = await userService.getProfile(req.user.userId)
      res.json({ success: true, data: profile })
    } catch (error) {
      next(error)
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const profile = await userService.getProfile(id)
      res.json({ success: true, data: profile })
    } catch (error) {
      next(error)
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized')
      const data = updateProfileSchema.parse(req.body)
      const profile = await userService.updateProfile(req.user.userId, data)
      res.json({ success: true, data: profile })
    } catch (error) {
      next(error)
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized')
      const data = changePasswordSchema.parse(req.body)
      await userService.changePassword(req.user.userId, data)
      res.json({ success: true, data: { message: '密码修改成功' } })
    } catch (error) {
      next(error)
    }
  }

  async getSubmissionStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized')
      const stats = await userService.getSubmissionStats(req.user.userId)
      res.json({ success: true, data: stats })
    } catch (error) {
      next(error)
    }
  }
}

export const userController = new UserController()
