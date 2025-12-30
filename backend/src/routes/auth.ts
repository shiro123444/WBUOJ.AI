import { Router } from 'express'
import { authController } from '../controllers/auth.controller.js'
import { authenticate } from '../middlewares/index.js'

const router = Router()

// Public routes
router.post('/register', (req, res, next) => authController.register(req, res, next))
router.post('/login', (req, res, next) => authController.login(req, res, next))
router.post('/logout', (req, res) => authController.logout(req, res))

// OAuth routes
router.get('/oauth/github', (req, res) => authController.githubOAuth(req, res))
router.get('/oauth/github/callback', (req, res, next) => authController.githubOAuthCallback(req, res, next))

// Protected routes
router.get('/me', authenticate, (req, res, next) => authController.getCurrentUser(req, res, next))

export default router
