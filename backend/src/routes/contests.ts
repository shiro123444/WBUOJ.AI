import { Router } from 'express'
import { contestController } from '../controllers/contest.controller.js'
import { authenticate, requireAdmin } from '../middlewares/auth.js'

const router = Router()

// Public
router.get('/', contestController.getContests.bind(contestController))
router.get('/:id', contestController.getContestById.bind(contestController))

// Authenticated
router.post('/:id/join', authenticate, contestController.registerForContest.bind(contestController))

// Admin
router.post('/', authenticate, requireAdmin, contestController.createContest.bind(contestController))

export default router
