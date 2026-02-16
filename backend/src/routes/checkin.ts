import { Router } from 'express'
import { checkInController } from '../controllers/checkin.controller.js'
import { authenticate } from '../middlewares/auth.js'

const router = Router()

// All routes require authentication
router.post('/', authenticate, checkInController.checkIn.bind(checkInController))
router.get('/status', authenticate, checkInController.getStatus.bind(checkInController))
router.get('/calendar', authenticate, checkInController.getCalendar.bind(checkInController))
router.get('/points-history', authenticate, checkInController.getPointsHistory.bind(checkInController))

export default router
