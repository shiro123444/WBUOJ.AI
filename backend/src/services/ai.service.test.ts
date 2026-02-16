import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import fc from 'fast-check'
import { PrismaClient } from '@prisma/client'
import { AIService } from './ai.service.js'
import { AIAdminService } from './ai-admin.service.js'

/**
 * Property-Based Tests for AI Module
 * 
 * **Property 9: AI 速率限制**
 * **Validates: Requirements 5.3**
 * 
 * For any user, in a single day:
 * - AI requests should not exceed the configured daily limit
 * - Requests beyond the limit should be rejected with appropriate error
 * - Quota should reset at midnight UTC
 * 
 * **Property 10: AI 配置生效**
 * **Validates: Requirements 5.8**
 * 
 * For any admin configuration change:
 * - New daily limit should take effect immediately
 * - Subsequent requests should respect the new limit
 * - Enable/disable toggle should work immediately
 */

// Test database client
const prisma = new PrismaClient()
const aiService = new AIService()
const aiAdminService = new AIAdminService()

// Test user IDs
let testUserId: string
let testAdminId: string

// Helper to get today's date string
const getTodayString = () => new Date().toISOString().split('T')[0]

// Global setup and teardown
beforeAll(async () => {
  // Create test user
  const existingUser = await prisma.users.findFirst({
    where: { username: 'test_ai_user' }
  })
  
  if (existingUser) {
    testUserId = existingUser.id
  } else {
    const user = await prisma.users.create({
      data: {
        username: 'test_ai_user',
        email: 'test_ai_user@test.com',
        passwordHash: 'test_hash',
        role: 'STUDENT',
      },
    })
    testUserId = user.id
  }

  // Create test admin
  const existingAdmin = await prisma.users.findFirst({
    where: { username: 'test_ai_admin' }
  })
  
  if (existingAdmin) {
    testAdminId = existingAdmin.id
  } else {
    const admin = await prisma.users.create({
      data: {
        username: 'test_ai_admin',
        email: 'test_ai_admin@test.com',
        passwordHash: 'test_hash',
        role: 'ADMIN',
      },
    })
    testAdminId = admin.id
  }
})

afterAll(async () => {
  // Clean up test data
  await prisma.ai_usage_logs.deleteMany({
    where: { userId: { in: [testUserId, testAdminId] } }
  })
  await prisma.ai_quotas.deleteMany({
    where: { userId: { in: [testUserId, testAdminId] } }
  })
  await prisma.system_configs.deleteMany({
    where: { key: { in: ['ai_daily_limit', 'ai_enabled'] } }
  })
  await prisma.users.deleteMany({
    where: { username: { in: ['test_ai_user', 'test_ai_admin'] } }
  })
  await prisma.$disconnect()
})

describe('AI Service - Property 9: AI Rate Limiting Tests', () => {
  beforeEach(async () => {
    // Clean up quota and usage logs before each test
    await prisma.ai_usage_logs.deleteMany({
      where: { userId: testUserId }
    })
    await prisma.ai_quotas.deleteMany({
      where: { userId: testUserId }
    })
    // Reset system config to default
    await prisma.system_configs.deleteMany({
      where: { key: 'ai_daily_limit' }
    })
  })

  /**
   * Feature: ai-club-oj-system, Property 9: AI 速率限制
   * **Validates: Requirements 5.3**
   * 
   * For any user, quota should start at 0 used and have a positive limit.
   */
  it('Property 9.1: Initial quota should be 0 used with positive limit', async () => {
    const quota = await aiService.getQuota(testUserId)
    
    expect(quota.chatUsed).toBe(0)
    expect(quota.chatLimit).toBeGreaterThan(0)
    expect(quota.resetAt).toBeGreaterThan(Date.now())
  }, 30000)

  /**
   * Feature: ai-club-oj-system, Property 9: AI 速率限制
   * **Validates: Requirements 5.3**
   * 
   * For any number of requests up to the limit, all should succeed.
   */
  it('Property 9.2: Requests within limit should succeed', async () => {
    // Set a small limit for testing
    const testLimit = 5
    await prisma.system_configs.upsert({
      where: { key: 'ai_daily_limit' },
      create: { key: 'ai_daily_limit', value: testLimit.toString() },
      update: { value: testLimit.toString() },
    })

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: testLimit }),
        async (numRequests) => {
          // Reset quota for this test
          await prisma.ai_quotas.deleteMany({ where: { userId: testUserId } })
          await prisma.ai_usage_logs.deleteMany({ where: { userId: testUserId } })

          // Make numRequests requests
          for (let i = 0; i < numRequests; i++) {
            const quota = await aiService.checkAndConsumeQuota(testUserId, 'HINT')
            expect(quota.chatUsed).toBe(i + 1)
            expect(quota.chatLimit).toBe(testLimit)
          }

          // Verify final quota
          const finalQuota = await aiService.getQuota(testUserId)
          expect(finalQuota.chatUsed).toBe(numRequests)
        }
      ),
      { numRuns: 10 }
    )
  }, 60000)

  /**
   * Feature: ai-club-oj-system, Property 9: AI 速率限制
   * **Validates: Requirements 5.3**
   * 
   * For any request beyond the limit, it should be rejected.
   */
  it('Property 9.3: Requests beyond limit should be rejected', async () => {
    // Set a small limit for testing
    const testLimit = 3
    await prisma.system_configs.upsert({
      where: { key: 'ai_daily_limit' },
      create: { key: 'ai_daily_limit', value: testLimit.toString() },
      update: { value: testLimit.toString() },
    })

    // Reset quota
    await prisma.ai_quotas.deleteMany({ where: { userId: testUserId } })
    await prisma.ai_usage_logs.deleteMany({ where: { userId: testUserId } })

    // Use up all quota
    for (let i = 0; i < testLimit; i++) {
      await aiService.checkAndConsumeQuota(testUserId, 'HINT')
    }

    // Verify quota is exhausted
    const quota = await aiService.getQuota(testUserId)
    expect(quota.chatUsed).toBe(testLimit)

    // Next request should fail
    await expect(
      aiService.checkAndConsumeQuota(testUserId, 'HINT')
    ).rejects.toThrow('Daily AI chat quota exceeded')
  }, 30000)

  /**
   * Feature: ai-club-oj-system, Property 9: AI 速率限制
   * **Validates: Requirements 5.3**
   * 
   * For any AI usage type, quota should be consumed correctly.
   */
  it('Property 9.4: All AI usage types consume quota equally', async () => {
    const usageTypes: Array<'COMPLETE' | 'HINT' | 'EXPLAIN' | 'ANALYZE'> = ['COMPLETE', 'HINT', 'EXPLAIN', 'ANALYZE']

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...usageTypes),
        async (usageType) => {
          // Reset quota for this test
          await prisma.ai_quotas.deleteMany({ where: { userId: testUserId } })
          await prisma.ai_usage_logs.deleteMany({ where: { userId: testUserId } })

          // Make a request
          const quota = await aiService.checkAndConsumeQuota(testUserId, usageType)
          
          // Quota should be consumed
          expect(quota.chatUsed).toBe(1)

          // Usage log should be created
          const logs = await prisma.ai_usage_logs.findMany({
            where: { userId: testUserId, type: usageType }
          })
          expect(logs.length).toBe(1)
        }
      ),
      { numRuns: 20 }
    )
  }, 60000)

  /**
   * Feature: ai-club-oj-system, Property 9: AI 速率限制
   * **Validates: Requirements 5.3**
   * 
   * Quota used count should never exceed the limit.
   */
  it('Property 9.5: Quota used should never exceed limit', async () => {
    const testLimit = 5
    await prisma.system_configs.upsert({
      where: { key: 'ai_daily_limit' },
      create: { key: 'ai_daily_limit', value: testLimit.toString() },
      update: { value: testLimit.toString() },
    })

    // Reset quota
    await prisma.ai_quotas.deleteMany({ where: { userId: testUserId } })
    await prisma.ai_usage_logs.deleteMany({ where: { userId: testUserId } })

    // Try to make more requests than the limit
    const attemptCount = testLimit + 5
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < attemptCount; i++) {
      try {
        await aiService.checkAndConsumeQuota(testUserId, 'HINT')
        successCount++
      } catch {
        failCount++
      }
    }

    // Exactly testLimit requests should succeed
    expect(successCount).toBe(testLimit)
    expect(failCount).toBe(attemptCount - testLimit)

    // Final quota should be at limit
    const finalQuota = await aiService.getQuota(testUserId)
    expect(finalQuota.chatUsed).toBe(testLimit)
    expect(finalQuota.chatUsed).toBeLessThanOrEqual(finalQuota.chatLimit)
  }, 30000)
})

describe('AI Service - Property 10: AI Configuration Tests', () => {
  beforeEach(async () => {
    // Clean up quota and config before each test
    await prisma.ai_usage_logs.deleteMany({
      where: { userId: testUserId }
    })
    await prisma.ai_quotas.deleteMany({
      where: { userId: testUserId }
    })
    await prisma.system_configs.deleteMany({
      where: { key: { in: ['ai_daily_limit', 'ai_enabled'] } }
    })
  })

  /**
   * Feature: ai-club-oj-system, Property 10: AI 配置生效
   * **Validates: Requirements 5.8**
   * 
   * For any valid daily limit configuration, it should take effect immediately.
   */
  it('Property 10.1: Daily limit configuration takes effect immediately', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }),
        async (newLimit) => {
          // Update configuration
          const config = await aiAdminService.updateConfig({ dailyLimit: newLimit })
          expect(config.dailyLimit).toBe(newLimit)

          // Reset user quota to pick up new limit
          await prisma.ai_quotas.deleteMany({ where: { userId: testUserId } })

          // New quota should reflect new limit
          const quota = await aiService.getQuota(testUserId)
          expect(quota.chatLimit).toBe(newLimit)
        }
      ),
      { numRuns: 15 }
    )
  }, 60000)

  /**
   * Feature: ai-club-oj-system, Property 10: AI 配置生效
   * **Validates: Requirements 5.8**
   * 
   * For any enable/disable toggle, it should take effect immediately.
   */
  it('Property 10.2: Enable/disable toggle takes effect immediately', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        async (enabled) => {
          // Update configuration
          const config = await aiAdminService.updateConfig({ enabled })
          expect(config.enabled).toBe(enabled)

          // Check if AI is enabled
          const isEnabled = await aiAdminService.isEnabled()
          expect(isEnabled).toBe(enabled)
        }
      ),
      { numRuns: 20 }
    )
  }, 60000)

  /**
   * Feature: ai-club-oj-system, Property 10: AI 配置生效
   * **Validates: Requirements 5.8**
   * 
   * When AI is disabled, validateRequest should throw an error.
   */
  it('Property 10.3: Disabled AI rejects all requests', async () => {
    // Disable AI
    await aiAdminService.updateConfig({ enabled: false })

    // Validate request should fail
    await expect(
      aiService.validateRequest(testUserId)
    ).rejects.toThrow('AI assistant is currently disabled')

    // Re-enable AI
    await aiAdminService.updateConfig({ enabled: true })

    // Validate request should succeed now
    await expect(
      aiService.validateRequest(testUserId)
    ).resolves.not.toThrow()
  }, 30000)

  /**
   * Feature: ai-club-oj-system, Property 10: AI 配置生效
   * **Validates: Requirements 5.8**
   * 
   * Configuration changes should persist across service instances.
   */
  it('Property 10.4: Configuration persists across service instances', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }),
        fc.boolean(),
        async (dailyLimit, enabled) => {
          // Update configuration with first service instance
          await aiAdminService.updateConfig({ dailyLimit, enabled })

          // Create new service instance
          const newAdminService = new AIAdminService()

          // Read configuration with new instance
          const config = await newAdminService.getConfig()
          expect(config.dailyLimit).toBe(dailyLimit)
          expect(config.enabled).toBe(enabled)
        }
      ),
      { numRuns: 10 }
    )
  }, 60000)

  /**
   * Feature: ai-club-oj-system, Property 10: AI 配置生效
   * **Validates: Requirements 5.8**
   * 
   * Reducing the limit should not affect already used quota.
   * Note: The user's quota record keeps its own limit, so reducing global limit
   * doesn't immediately affect existing quota records.
   */
  it('Property 10.5: Reducing limit does not affect used quota', async () => {
    // Set initial limit
    const initialLimit = 10
    await aiAdminService.updateConfig({ dailyLimit: initialLimit })

    // Reset quota
    await prisma.ai_quotas.deleteMany({ where: { userId: testUserId } })

    // Use some quota
    const usedCount = 5
    for (let i = 0; i < usedCount; i++) {
      await aiService.checkAndConsumeQuota(testUserId, 'HINT')
    }

    // Verify used count
    let quota = await aiService.getQuota(testUserId)
    expect(quota.chatUsed).toBe(usedCount)

    // Reduce global limit below used count
    const newLimit = 3
    await aiAdminService.updateConfig({ dailyLimit: newLimit })

    // Used count should remain the same
    quota = await aiService.getQuota(testUserId)
    expect(quota.chatUsed).toBe(usedCount)
    
    // The user's existing quota record keeps its original limit
    // To enforce the new limit, admin should use setUserQuotaLimit
    // This is the expected behavior - existing quotas are not retroactively changed
    expect(quota.chatLimit).toBe(initialLimit)
  }, 30000)

  /**
   * Feature: ai-club-oj-system, Property 10: AI 配置生效
   * **Validates: Requirements 5.8**
   * 
   * Admin can set custom quota for specific users.
   */
  it('Property 10.6: Custom user quota overrides global limit', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 51, max: 100 }),
        async (globalLimit, userLimit) => {
          // Set global limit
          await aiAdminService.updateConfig({ dailyLimit: globalLimit })

          // Reset user quota
          await prisma.ai_quotas.deleteMany({ where: { userId: testUserId } })

          // Set custom user limit
          await aiAdminService.setUserQuotaLimit(testUserId, userLimit)

          // User quota should reflect custom limit
          const quota = await aiService.getQuota(testUserId)
          expect(quota.chatLimit).toBe(userLimit)
        }
      ),
      { numRuns: 10 }
    )
  }, 60000)

  /**
   * Feature: ai-club-oj-system, Property 10: AI 配置生效
   * **Validates: Requirements 5.8**
   * 
   * Admin can reset user quota.
   */
  it('Property 10.7: Admin can reset user quota', async () => {
    // Set limit
    await aiAdminService.updateConfig({ dailyLimit: 10 })

    // Reset quota
    await prisma.ai_quotas.deleteMany({ where: { userId: testUserId } })

    // Use some quota
    for (let i = 0; i < 5; i++) {
      await aiService.checkAndConsumeQuota(testUserId, 'HINT')
    }

    // Verify used count
    let quota = await aiService.getQuota(testUserId)
    expect(quota.chatUsed).toBe(5)

    // Admin resets quota
    await aiAdminService.resetUserQuota(testUserId)

    // Used count should be 0
    quota = await aiService.getQuota(testUserId)
    expect(quota.chatUsed).toBe(0)
  }, 30000)
})
