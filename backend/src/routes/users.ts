import { Router } from 'express'
import { userController } from '../controllers/user.controller.js'
import { authenticate } from '../middlewares/auth.js'

const router = Router()

// Authenticated: own profile operations (must be before /:id)
router.get('/me/profile', authenticate, userController.getMyProfile.bind(userController))
router.put('/me/profile', authenticate, userController.updateProfile.bind(userController))
router.put('/me/password', authenticate, userController.changePassword.bind(userController))
router.get('/me/stats', authenticate, userController.getSubmissionStats.bind(userController))

// Public: view any user's profile
router.get('/:id', userController.getProfile.bind(userController))

export default router
