import { Router } from 'express'
import { submissionController } from '../controllers/submission.controller.js'
import { authenticate } from '../middlewares/index.js'

const router = Router()

/**
 * POST /api/submissions
 * 提交代码 (需要登录)
 */
router.post('/', authenticate, (req, res, next) => {
  submissionController.submitCode(req, res, next)
})

/**
 * GET /api/submissions/my
 * 获取当前用户的提交列表 (需要登录)
 */
router.get('/my', authenticate, (req, res, next) => {
  submissionController.getMySubmissions(req, res, next)
})

/**
 * GET /api/submissions/best/:problemId
 * 获取当前用户在某题目的最佳提交 (需要登录)
 */
router.get('/best/:problemId', authenticate, (req, res, next) => {
  submissionController.getBestSubmission(req, res, next)
})

/**
 * GET /api/submissions/problem/:problemId
 * 获取某题目的提交列表
 */
router.get('/problem/:problemId', (req, res, next) => {
  submissionController.getProblemSubmissions(req, res, next)
})

/**
 * GET /api/submissions/:id
 * 获取提交详情
 */
router.get('/:id', (req, res, next) => {
  submissionController.getSubmission(req, res, next)
})

/**
 * GET /api/submissions
 * 获取提交列表
 */
router.get('/', (req, res, next) => {
  submissionController.getSubmissions(req, res, next)
})

export default router
