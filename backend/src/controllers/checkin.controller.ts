import type { Response, NextFunction } from 'express'
import { checkInService } from '../services/checkin.service.js'
import { AppError, type AuthenticatedRequest } from '../types/index.js'

class CheckInController {
  async checkIn(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized')
      const result = await checkInService.checkIn(req.user.userId)
      res.json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  }

  async getStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized')
      const status = await checkInService.getCheckInStatus(req.user.userId)
      res.json({ success: true, data: status })
    } catch (error) {
      next(error)
    }
  }

  async getCalendar(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized')
      const year = Number(req.query.year) || new Date().getFullYear()
      const month = Number(req.query.month) || new Date().getMonth() + 1
      const calendar = await checkInService.getCheckInCalendar(req.user.userId, year, month)
      res.json({ success: true, data: calendar })
    } catch (error) {
      next(error)
    }
  }

  async getPointsHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized')
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 20
      const result = await checkInService.getPointsHistory(req.user.userId, page, limit)
      res.json({ success: true, ...result })
    } catch (error) {
      next(error)
    }
  }
}

export const checkInController = new CheckInController()
