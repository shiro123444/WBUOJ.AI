import { Router } from 'express'
import { judgeService } from '../services/index.js'
import { judgeController } from '../controllers/index.js'
import { authenticate, requireAdmin } from '../middlewares/index.js'

const router = Router()

/**
 * GET /api/judge/status
 * 获取评测系统状态 (管理员)
 */
router.get('/status', authenticate, requireAdmin, async (_req, res) => {
  try {
    const status = judgeService.getStatus()
    const queueLength = await judgeService.getQueueLength()

    res.json({
      success: true,
      data: {
        ...status,
        queueLength,
      },
    })
  } catch (error) {
    console.error('Failed to get judge status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get judge status',
    })
  }
})

/**
 * GET /api/judge/health
 * 评测系统健康检查
 */
router.get('/health', async (_req, res) => {
  try {
    const status = judgeService.getStatus()
    const healthy = status.connections > 0

    res.status(healthy ? 200 : 503).json({
      success: healthy,
      data: {
        healthy,
        connections: status.connections,
        activeConnections: status.activeConnections,
      },
    })
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Judge service unavailable',
    })
  }
})

/**
 * GET /api/judge/files
 * 下载测试数据文件 (评测机专用)
 * 
 * Query params:
 * - pid: 题目 ID
 * - filename: 文件名 (可选，不提供则返回文件列表)
 */
router.get('/files', judgeController.getTestDataFiles)

/**
 * POST /api/judge/upload
 * 上传评测结果文件 (评测机专用)
 */
router.post('/upload', judgeController.uploadJudgeResult)

/**
 * DELETE /api/judge/cache/:problemId
 * 清除题目测试数据缓存 (管理员)
 */
router.delete('/cache/:problemId', authenticate, requireAdmin, judgeController.clearCache)

export default router
