import type { Request, Response, NextFunction } from 'express'
import { badgeService } from '../services/badge.service.js'
import { AppError, type AuthenticatedRequest } from '../types/index.js'

class BadgeController {
  async getAllBadges(_req: Request, res: Response, next: NextFunction) {
    try {
      const badges = await badgeService.getAllBadges()
      res.json({ success: true, data: badges })
    } catch (error) {
      next(error)
    }
  }

  async getMyBadges(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized')
      const badges = await badgeService.getUserBadges(req.user.userId)
      res.json({ success: true, data: badges })
    } catch (error) {
      next(error)
    }
  }

  async getMyBadgeOverview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized')
      const overview = await badgeService.getUserBadgeOverview(req.user.userId)
      res.json({ success: true, data: overview })
    } catch (error) {
      next(error)
    }
  }

  async getUserBadges(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params
      const badges = await badgeService.getUserBadges(userId)
      res.json({ success: true, data: badges })
    } catch (error) {
      next(error)
    }
  }

  async seedBadges(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized')
      await badgeService.seedBadges()
      res.json({ success: true, data: { message: '徽章初始化完成' } })
    } catch (error) {
      next(error)
    }
  }
}

export const badgeController = new BadgeController()
