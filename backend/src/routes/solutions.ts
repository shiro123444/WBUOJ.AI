import { Router } from 'express'
import { solutionController } from '../controllers/solution.controller.js'
import { authenticate, optionalAuth } from '../middlewares/auth.js'

const router = Router()

// Public routes (with optional auth for anti-spoiler logic)
router.get('/', optionalAuth, solutionController.getSolutions.bind(solutionController))
router.get('/:id', optionalAuth, solutionController.getSolutionById.bind(solutionController))

// Authenticated routes
router.post('/', authenticate, solutionController.createSolution.bind(solutionController))
router.put('/:id', authenticate, solutionController.updateSolution.bind(solutionController))
router.delete('/:id', authenticate, solutionController.deleteSolution.bind(solutionController))
router.post('/:id/like', authenticate, solutionController.toggleLike.bind(solutionController))
router.post('/:id/comments', authenticate, solutionController.addComment.bind(solutionController))
router.delete('/:solutionId/comments/:commentId', authenticate, solutionController.deleteComment.bind(solutionController))
router.post('/:solutionId/comments/:commentId/like', authenticate, solutionController.toggleCommentLike.bind(solutionController))

export default router
