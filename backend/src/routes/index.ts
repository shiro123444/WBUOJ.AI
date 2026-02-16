import { Router } from 'express'
import healthRouter from './health.js'
import authRouter from './auth.js'
import problemsRouter from './problems.js'
import judgeRouter from './judge.js'
import submissionsRouter from './submissions.js'
import solutionsRouter from './solutions.js'
import contestsRouter from './contests.js'
import leaderboardRouter from './leaderboard.js'
import usersRouter from './users.js'
import checkinRouter from './checkin.js'
import badgesRouter from './badges.js'
import adminRouter from './admin.js'
import discussionsRouter from './discussions.js'
import announcementsRouter from './announcements.js'

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

// Contest routes
router.use('/contests', contestsRouter)

// Leaderboard routes
router.use('/leaderboard', leaderboardRouter)

// User routes
router.use('/users', usersRouter)

// Check-in routes
router.use('/checkin', checkinRouter)

// Badge routes
router.use('/badges', badgesRouter)

// Admin routes
router.use('/admin', adminRouter)

// Discussion routes
router.use('/discussions', discussionsRouter)

// Announcement routes
router.use('/announcements', announcementsRouter)

// API routes will be added here
// router.use('/leaderboard', leaderboardRouter)
// router.use('/contests', contestsRouter)
// router.use('/admin', adminRouter)

export default router
