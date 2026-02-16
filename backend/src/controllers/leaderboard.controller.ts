import type { Request, Response, NextFunction } from 'express'
import { leaderboardService } from '../services/leaderboard.service.js'

class LeaderboardController {
  async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, sortBy } = req.query
      const result = await leaderboardService.getLeaderboard({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        sortBy: sortBy as 'score' | 'solvedCount' | 'streak' | undefined,
      })
      res.json({ success: true, data: result.entries, pagination: result.pagination })
    } catch (error) {
      next(error)
    }
  }
}

export const leaderboardController = new LeaderboardController()
