import { Router } from 'express'
import { announcementController } from '../controllers/announcement.controller.js'
import { authenticate, optionalAuth, requireAdmin } from '../middlewares/auth.js'

const router = Router()

// Public routes (with optional auth for read status)
router.get('/', optionalAuth, announcementController.getAnnouncements.bind(announcementController))
router.get('/unread-count', authenticate, announcementController.getUnreadCount.bind(announcementController))
router.get('/:id', optionalAuth, announcementController.getAnnouncementById.bind(announcementController))

// Admin routes
router.post('/', authenticate, requireAdmin, announcementController.createAnnouncement.bind(announcementController))
router.put('/:id', authenticate, requireAdmin, announcementController.updateAnnouncement.bind(announcementController))
router.post('/:id/publish', authenticate, requireAdmin, announcementController.togglePublish.bind(announcementController))
router.delete('/:id', authenticate, requireAdmin, announcementController.deleteAnnouncement.bind(announcementController))

export default router
