import { prisma } from '../config/database.js'
import { AppError } from '../types/index.js'
import { config } from '../config/index.js'

export interface AIConfigUpdate {
  dailyLimit?: number
  enabled?: boolean
}

export interface AIConfig {
  dailyLimit: number
  enabled: boolean
}

export interface UserQuotaOverride {
  userId: string
  limit: number
}

export class AIAdminService {
  /**
   * Get current AI configuration
   */
  async getConfig(): Promise<AIConfig> {
    const [dailyLimitConfig, enabledConfig] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: 'ai_daily_limit' } }),
      prisma.systemConfig.findUnique({ where: { key: 'ai_enabled' } }),
    ])

    return {
      dailyLimit: dailyLimitConfig ? parseInt(dailyLimitConfig.value, 10) : config.aiDailyLimit,
      enabled: enabledConfig ? enabledConfig.value === 'true' : true,
    }
  }

  /**
   * Update AI configuration (admin only)
   */
  async updateConfig(updates: AIConfigUpdate): Promise<AIConfig> {
    const operations = []

    if (updates.dailyLimit !== undefined) {
      if (updates.dailyLimit < 0) {
        throw new AppError(400, 'Daily limit must be non-negative', 'VALIDATION_ERROR')
      }
      operations.push(
        prisma.systemConfig.upsert({
          where: { key: 'ai_daily_limit' },
          create: { key: 'ai_daily_limit', value: updates.dailyLimit.toString() },
          update: { value: updates.dailyLimit.toString() },
        })
      )
    }

    if (updates.enabled !== undefined) {
      operations.push(
        prisma.systemConfig.upsert({
          where: { key: 'ai_enabled' },
          create: { key: 'ai_enabled', value: updates.enabled.toString() },
          update: { value: updates.enabled.toString() },
        })
      )
    }

    if (operations.length > 0) {
      await prisma.$transaction(operations)
    }

    return this.getConfig()
  }

  /**
   * Set custom quota limit for a specific user
   */
  async setUserQuotaLimit(userId: string, limit: number): Promise<void> {
    if (limit < 0) {
      throw new AppError(400, 'Limit must be non-negative', 'VALIDATION_ERROR')
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new AppError(404, 'User not found', 'NOT_FOUND')
    }

    const today = new Date().toISOString().split('T')[0]

    await prisma.aIQuota.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      create: {
        userId,
        date: today,
        chatUsed: 0,
        chatLimit: limit,
        inlineCompletions: 0,
      },
      update: {
        chatLimit: limit,
      },
    })
  }

  /**
   * Reset user's daily quota
   */
  async resetUserQuota(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0]

    await prisma.aIQuota.updateMany({
      where: {
        userId,
        date: today,
      },
      data: {
        chatUsed: 0,
      },
    })
  }

  /**
   * Get AI usage statistics
   */
  async getUsageStats(options: {
    startDate?: Date
    endDate?: Date
    userId?: string
  } = {}): Promise<{
    totalRequests: number
    requestsByType: Record<string, number>
    requestsByDay: { date: string; count: number }[]
    topUsers: { userId: string; username: string; count: number }[]
  }> {
    const { startDate, endDate, userId } = options

    const where: Record<string, unknown> = {}
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) (where.createdAt as Record<string, Date>).gte = startDate
      if (endDate) (where.createdAt as Record<string, Date>).lte = endDate
    }
    if (userId) {
      where.userId = userId
    }

    // Total requests
    const totalRequests = await prisma.aIUsageLog.count({ where })

    // Requests by type
    const byType = await prisma.aIUsageLog.groupBy({
      by: ['type'],
      where,
      _count: true,
    })
    const requestsByType: Record<string, number> = {}
    byType.forEach(item => {
      requestsByType[item.type] = item._count
    })

    // Requests by day (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const dailyLogs = await prisma.aIUsageLog.findMany({
      where: {
        ...where,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
    })

    const dailyCounts: Record<string, number> = {}
    dailyLogs.forEach(log => {
      const date = log.createdAt.toISOString().split('T')[0]
      dailyCounts[date] = (dailyCounts[date] || 0) + 1
    })

    const requestsByDay = Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Top users
    const topUsersData = await prisma.aIUsageLog.groupBy({
      by: ['userId'],
      where,
      _count: true,
      orderBy: { _count: { userId: 'desc' } },
      take: 10,
    })

    const userIds = topUsersData.map(u => u.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true },
    })
    const userMap = new Map(users.map(u => [u.id, u.username]))

    const topUsers = topUsersData.map(item => ({
      userId: item.userId,
      username: userMap.get(item.userId) || 'Unknown',
      count: item._count,
    }))

    return {
      totalRequests,
      requestsByType,
      requestsByDay,
      topUsers,
    }
  }

  /**
   * Check if AI is enabled globally
   */
  async isEnabled(): Promise<boolean> {
    const enabledConfig = await prisma.systemConfig.findUnique({
      where: { key: 'ai_enabled' },
    })
    return enabledConfig ? enabledConfig.value === 'true' : true
  }
}

export const aiAdminService = new AIAdminService()
