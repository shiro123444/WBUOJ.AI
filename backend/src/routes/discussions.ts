import { Router } from 'express'
import { discussionController } from '../controllers/discussion.controller.js'
import { authenticate, optionalAuth, requireAdmin } from '../middlewares/auth.js'

const router = Router()

// Public routes (with optional auth for reaction state)
router.get('/', discussionController.getDiscussions.bind(discussionController))
router.get('/:id', optionalAuth, discussionController.getDiscussionById.bind(discussionController))
router.get('/:id/replies', optionalAuth, discussionController.getReplies.bind(discussionController))

// Authenticated routes
router.post('/', authenticate, discussionController.createDiscussion.bind(discussionController))
router.put('/:id', authenticate, discussionController.updateDiscussion.bind(discussionController))
router.delete('/:id', authenticate, discussionController.deleteDiscussion.bind(discussionController))
router.post('/:id/react', authenticate, discussionController.reactToDiscussion.bind(discussionController))
router.post('/:id/replies', authenticate, discussionController.createReply.bind(discussionController))
router.put('/:discussionId/replies/:replyId', authenticate, discussionController.updateReply.bind(discussionController))
router.delete('/:discussionId/replies/:replyId', authenticate, discussionController.deleteReply.bind(discussionController))
router.post('/:discussionId/replies/:replyId/react', authenticate, discussionController.reactToReply.bind(discussionController))

// Admin routes
router.post('/:id/pin', authenticate, requireAdmin, discussionController.togglePin.bind(discussionController))
router.post('/:id/lock', authenticate, requireAdmin, discussionController.toggleLock.bind(discussionController))

export default router
