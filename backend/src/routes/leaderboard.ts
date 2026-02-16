import { Router } from 'express'
import { leaderboardController } from '../controllers/leaderboard.controller.js'

const router = Router()

router.get('/', leaderboardController.getLeaderboard.bind(leaderboardController))

export default router
