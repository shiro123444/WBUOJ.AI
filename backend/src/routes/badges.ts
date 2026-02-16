import { Router } from 'express'
import { badgeController } from '../controllers/badge.controller.js'
import { authenticate, requireAdmin } from '../middlewares/auth.js'

const router = Router()

// Public
router.get('/', badgeController.getAllBadges.bind(badgeController))
router.get('/users/:userId', badgeController.getUserBadges.bind(badgeController))

// Authenticated
router.get('/me', authenticate, badgeController.getMyBadges.bind(badgeController))
router.get('/me/overview', authenticate, badgeController.getMyBadgeOverview.bind(badgeController))

// Admin
router.post('/seed', authenticate, requireAdmin, badgeController.seedBadges.bind(badgeController))

export default router
