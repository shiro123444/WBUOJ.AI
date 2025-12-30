import Redis from 'ioredis'
import { config } from './index.js'

let redis: Redis | null = null

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
    })

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully')
    })

    redis.on('error', err => {
      console.error('❌ Redis connection error:', err)
    })
  }

  return redis
}

export async function disconnectRedis() {
  if (redis) {
    await redis.quit()
    redis = null
    console.log('Redis disconnected')
  }
}
