import { Router } from 'express'
import { prisma } from '../config/database.js'
import { getRedis } from '../config/redis.js'

const router = Router()

router.get('/', async (_req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      redis: 'unknown',
    },
  }

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`
    health.services.database = 'healthy'
  } catch {
    health.services.database = 'unhealthy'
    health.status = 'degraded'
  }

  // Check Redis
  try {
    const redis = getRedis()
    await redis.ping()
    health.services.redis = 'healthy'
  } catch {
    health.services.redis = 'unhealthy'
    health.status = 'degraded'
  }

  const statusCode = health.status === 'ok' ? 200 : 503
  res.status(statusCode).json(health)
})

export default router
