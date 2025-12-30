import { Router } from 'express'
import { problemController } from '../controllers/problem.controller.js'
import { authenticate, requireAdmin } from '../middlewares/auth.js'

const router = Router()

// Public routes
router.get('/', problemController.getProblems.bind(problemController))
router.get('/tags', problemController.getAllTags.bind(problemController))
router.get('/:id', problemController.getProblemById.bind(problemController))

// Admin routes
router.post('/', authenticate, requireAdmin, problemController.createProblem.bind(problemController))
router.post('/import', authenticate, requireAdmin, problemController.batchImport.bind(problemController))
router.put('/:id', authenticate, requireAdmin, problemController.updateProblem.bind(problemController))
router.delete('/:id', authenticate, requireAdmin, problemController.deleteProblem.bind(problemController))

export default router
