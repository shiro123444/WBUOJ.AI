import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { contestService } from '../services/contest.service.js'
import { AppError, type AuthenticatedRequest } from '../types/index.js'

const createContestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  maxParticipants: z.number().int().positive().optional(),
  problemIds: z.array(z.string()).min(1),
})

class ContestController {
  async getContests(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, status } = req.query
      const result = await contestService.getContests({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status: status as 'UPCOMING' | 'RUNNING' | 'ENDED' | undefined,
      })
      res.json({ success: true, ...result })
    } catch (error) {
      next(error)
    }
  }

  async getContestById(req: Request, res: Response, next: NextFunction) {
    try {
      const contest = await contestService.getContestById(req.params.id)
      res.json({ success: true, data: contest })
    } catch (error) {
      next(error)
    }
  }

  async createContest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized')
      const data = createContestSchema.parse(req.body)
      const contest = await contestService.createContest(req.user.userId, data)
      res.status(201).json({ success: true, data: contest })
    } catch (error) {
      next(error)
    }
  }

  async registerForContest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized')
      await contestService.registerForContest(req.params.id, req.user.userId)
      res.json({ success: true, data: { message: '报名成功' } })
    } catch (error) {
      next(error)
    }
  }
}

export const contestController = new ContestController()
