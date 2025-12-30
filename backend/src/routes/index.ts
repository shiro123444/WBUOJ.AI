import { Router } from 'express'
import healthRouter from './health.js'
import authRouter from './auth.js'
import problemsRouter from './problems.js'
import judgeRouter from './judge.js'
import submissionsRouter from './submissions.js'
import solutionsRouter from './solutions.js'

const router = Router()

// Health check
router.use('/health', healthRouter)

// Auth routes
router.use('/auth', authRouter)

// Problem routes
router.use('/problems', problemsRouter)

// Judge routes
router.use('/judge', judgeRouter)

// Submission routes
router.use('/submissions', submissionsRouter)

// Solution routes
router.use('/solutions', solutionsRouter)

// API routes will be added here
// router.use('/leaderboard', leaderboardRouter)
// router.use('/contests', contestsRouter)
// router.use('/admin', adminRouter)

export default router
