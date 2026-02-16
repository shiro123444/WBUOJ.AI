import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import fc from 'fast-check'
import { PrismaClient } from '@prisma/client'
import { SolutionService } from './solution.service.js'
import { ProblemService } from './problem.service.js'

/**
 * Property-Based Tests for Solution Module
 * 
 * **Property 6: 题解发布权限**
 * **Validates: Requirements 4.1**
 * 
 * For any user and problem:
 * - Only users who have solved the problem can publish solutions
 * - Users who haven't solved the problem should be rejected
 * 
 * **Property 7: 题解排序正确性**
 * **Validates: Requirements 4.4**
 * 
 * For any solution list:
 * - When sorted by 'hot', solutions should be in descending order by likes
 * - When sorted by 'new', solutions should be in descending order by creation time
 * 
 * **Property 8: 题解防剧透**
 * **Validates: Requirements 4.5**
 * 
 * For any user and problem:
 * - If user hasn't solved the problem, solution content should be hidden
 * - If user has solved the problem, solution content should be visible
 */

// Test database client
const prisma = new PrismaClient()
const solutionService = new SolutionService()
const problemService = new ProblemService()

// Test user IDs - shared across all tests
let testAdminId: string
let testSolvedUserId: string
let testUnsolvedUserId: string
let testProblemId: string

// Arbitrary for generating valid solution titles
const titleArb = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0)
  .map(s => s.trim())

// Arbitrary for generating valid solution content
const contentArb = fc.string({ minLength: 10, maxLength: 500 })
  .filter(s => s.trim().length >= 10)
  .map(s => s.trim())

// Arbitrary for generating optional code
const codeArb = fc.option(
  fc.string({ minLength: 1, maxLength: 1000 }).map(s => s.trim()),
  { nil: undefined }
)

// Arbitrary for generating optional language
const languageArb = fc.option(
  fc.constantFrom('cpp', 'python', 'java', 'javascript', 'go'),
  { nil: undefined }
)

// Global setup and teardown
beforeAll(async () => {
  // Create test admin user
  const existingAdmin = await prisma.users.findFirst({
    where: { username: 'test_admin_solution' }
  })
  
  if (existingAdmin) {
    testAdminId = existingAdmin.id
  } else {
    const admin = await prisma.users.create({
      data: {
        username: 'test_admin_solution',
        email: 'test_admin_solution@test.com',
        passwordHash: 'test_hash',
        role: 'ADMIN',
      },
    })
    testAdminId = admin.id
  }

  // Create test user who has solved the problem
  const existingSolvedUser = await prisma.users.findFirst({
    where: { username: 'test_solved_user' }
  })
  
  if (existingSolvedUser) {
    testSolvedUserId = existingSolvedUser.id
  } else {
    const solvedUser = await prisma.users.create({
      data: {
        username: 'test_solved_user',
        email: 'test_solved_user@test.com',
        passwordHash: 'test_hash',
        role: 'STUDENT',
      },
    })
    testSolvedUserId = solvedUser.id
  }

  // Create test user who hasn't solved the problem
  const existingUnsolvedUser = await prisma.users.findFirst({
    where: { username: 'test_unsolved_user' }
  })
  
  if (existingUnsolvedUser) {
    testUnsolvedUserId = existingUnsolvedUser.id
  } else {
    const unsolvedUser = await prisma.users.create({
      data: {
        username: 'test_unsolved_user',
        email: 'test_unsolved_user@test.com',
        passwordHash: 'test_hash',
        role: 'STUDENT',
      },
    })
    testUnsolvedUserId = unsolvedUser.id
  }

  // Create a test problem
  const problem = await problemService.createProblem({
    title: 'Test Problem for Solutions',
    description: 'Test description for solution tests',
    inputFormat: 'Input format',
    outputFormat: 'Output format',
    constraints: 'Constraints',
    difficulty: 'easy',
    tags: ['test'],
    timeLimit: 1000,
    memoryLimit: 256,
    examples: [{ input: '1', output: '1' }],
    testCases: [{ input: '1', expectedOutput: '1', isExample: true }],
  }, testAdminId)
  testProblemId = problem.id

  // Create an ACCEPTED submission for the solved user
  await prisma.submissions.create({
    data: {
      problemId: testProblemId,
      userId: testSolvedUserId,
      code: 'print(1)',
      language: 'PYTHON',
      status: 'ACCEPTED',
      time: 100,
      memory: 1024,
    },
  })
})

afterAll(async () => {
  // Clean up test data in correct order (respect foreign keys)
  await prisma.comment_likes.deleteMany({
    where: { comment: { solution: { problemId: testProblemId } } }
  })
  await prisma.comments.deleteMany({
    where: { solution: { problemId: testProblemId } }
  })
  await prisma.solution_likes.deleteMany({
    where: { solution: { problemId: testProblemId } }
  })
  await prisma.solutions.deleteMany({
    where: { problemId: testProblemId }
  })
  await prisma.submissions.deleteMany({
    where: { problemId: testProblemId }
  })
  await prisma.problems.deleteMany({
    where: { id: testProblemId }
  })
  await prisma.users.deleteMany({
    where: { 
      username: { 
        in: ['test_admin_solution', 'test_solved_user', 'test_unsolved_user'] 
      } 
    }
  })
  await prisma.$disconnect()
})

describe('Solution Service - Property 6: Solution Publishing Permission Tests', () => {
  beforeEach(async () => {
    // Clean up solutions before each test
    await prisma.comment_likes.deleteMany({
      where: { comment: { solution: { problemId: testProblemId } } }
    })
    await prisma.comments.deleteMany({
      where: { solution: { problemId: testProblemId } }
    })
    await prisma.solution_likes.deleteMany({
      where: { solution: { problemId: testProblemId } }
    })
    await prisma.solutions.deleteMany({
      where: { problemId: testProblemId }
    })
  })

  /**
   * Feature: ai-club-oj-system, Property 6: 题解发布权限
   * **Validates: Requirements 4.1**
   * 
   * For any user who has solved a problem, they should be able to publish a solution.
   */
  it('Property 6.1: Users who solved the problem can publish solutions', async () => {
    await fc.assert(
      fc.asyncProperty(
        titleArb,
        contentArb,
        codeArb,
        languageArb,
        async (title, content, code, language) => {
          // User who has solved the problem should be able to create solution
          const result = await solutionService.createSolution({
            problemId: testProblemId,
            title,
            content,
            code,
            language,
          }, testSolvedUserId)

          // Solution should be created successfully
          expect(result.id).toBeDefined()
          expect(result.title).toBe(title)
          expect(result.authorId).toBe(testSolvedUserId)

          // Clean up for next iteration
          await prisma.solutions.delete({ where: { id: result.id } })
        }
      ),
      { numRuns: 20 }
    )
  }, 60000)

  /**
   * Feature: ai-club-oj-system, Property 6: 题解发布权限
   * **Validates: Requirements 4.1**
   * 
   * For any user who hasn't solved a problem, they should be rejected when trying to publish.
   */
  it('Property 6.2: Users who haven\'t solved the problem cannot publish solutions', async () => {
    await fc.assert(
      fc.asyncProperty(
        titleArb,
        contentArb,
        codeArb,
        languageArb,
        async (title, content, code, language) => {
          // User who hasn't solved the problem should be rejected
          await expect(
            solutionService.createSolution({
              problemId: testProblemId,
              title,
              content,
              code,
              language,
            }, testUnsolvedUserId)
          ).rejects.toThrow('You must solve the problem before posting a solution')
        }
      ),
      { numRuns: 20 }
    )
  }, 60000)

  /**
   * Feature: ai-club-oj-system, Property 6: 题解发布权限
   * **Validates: Requirements 4.1**
   * 
   * For any problem that doesn't exist, publishing should fail with not found error.
   */
  it('Property 6.3: Publishing to non-existent problem fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        titleArb,
        contentArb,
        async (title, content) => {
          // Try to publish to a non-existent problem
          await expect(
            solutionService.createSolution({
              problemId: 'non-existent-problem-id',
              title,
              content,
            }, testSolvedUserId)
          ).rejects.toThrow('Problem not found')
        }
      ),
      { numRuns: 10 }
    )
  }, 60000)
})

describe('Solution Service - Property 7: Solution Sorting Tests', () => {
  // Store created solution IDs for cleanup
  const createdSolutionIds: string[] = []

  beforeEach(async () => {
    // Clean up solutions before each test
    for (const id of createdSolutionIds) {
      try {
        await prisma.solutions.delete({ where: { id } })
      } catch {
        // Ignore if already deleted
      }
    }
    createdSolutionIds.length = 0
  })

  afterAll(async () => {
    // Clean up created solutions
    for (const id of createdSolutionIds) {
      try {
        await prisma.solutions.delete({ where: { id } })
      } catch {
        // Ignore if already deleted
      }
    }
  })

  /**
   * Feature: ai-club-oj-system, Property 7: 题解排序正确性
   * **Validates: Requirements 4.4**
   * 
   * When sorted by 'hot', solutions should be in descending order by likes.
   */
  it('Property 7.1: Hot sort returns solutions in descending order by likes', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random like counts for solutions
        fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 3, maxLength: 10 }),
        async (likeCounts) => {
          // Create solutions with different like counts
          const solutions = await Promise.all(
            likeCounts.map(async (likes, i) => {
              const solution = await prisma.solutions.create({
                data: {
                  problemId: testProblemId,
                  authorId: testSolvedUserId,
                  title: `Test Solution ${i}`,
                  content: `Test content for solution ${i} with enough characters`,
                  likes,
                },
              })
              createdSolutionIds.push(solution.id)
              return solution
            })
          )

          // Query with hot sort
          const result = await solutionService.getSolutions({
            problemId: testProblemId,
            sort: 'hot',
            limit: 100,
          }, testSolvedUserId)

          // Filter to only our test solutions
          const ourSolutionIds = new Set(solutions.map(s => s.id))
          const ourSolutions = result.solutions.filter(s => ourSolutionIds.has(s.id))

          // Verify descending order by likes
          for (let i = 1; i < ourSolutions.length; i++) {
            expect(ourSolutions[i - 1].likes).toBeGreaterThanOrEqual(ourSolutions[i].likes)
          }

          // Clean up for next iteration
          for (const solution of solutions) {
            try {
              await prisma.solutions.delete({ where: { id: solution.id } })
            } catch {
              // Ignore
            }
          }
          createdSolutionIds.length = 0
        }
      ),
      { numRuns: 15 }
    )
  }, 120000)

  /**
   * Feature: ai-club-oj-system, Property 7: 题解排序正确性
   * **Validates: Requirements 4.4**
   * 
   * When sorted by 'new', solutions should be in descending order by creation time.
   */
  it('Property 7.2: New sort returns solutions in descending order by creation time', async () => {
    // Create solutions with small delays to ensure different timestamps
    const solutions: Array<{ id: string; createdAt: Date }> = []
    
    for (let i = 0; i < 5; i++) {
      const solution = await prisma.solutions.create({
        data: {
          problemId: testProblemId,
          authorId: testSolvedUserId,
          title: `Test Solution ${i}`,
          content: `Test content for solution ${i} with enough characters`,
          likes: Math.floor(Math.random() * 100),
        },
      })
      createdSolutionIds.push(solution.id)
      solutions.push({ id: solution.id, createdAt: solution.createdAt })
      
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    // Query with new sort
    const result = await solutionService.getSolutions({
      problemId: testProblemId,
      sort: 'new',
      limit: 100,
    }, testSolvedUserId)

    // Filter to only our test solutions
    const ourSolutionIds = new Set(solutions.map(s => s.id))
    const ourSolutions = result.solutions.filter(s => ourSolutionIds.has(s.id))

    // Verify descending order by creation time
    for (let i = 1; i < ourSolutions.length; i++) {
      const prevTime = new Date(ourSolutions[i - 1].createdAt).getTime()
      const currTime = new Date(ourSolutions[i].createdAt).getTime()
      expect(prevTime).toBeGreaterThanOrEqual(currTime)
    }
  }, 60000)
})

describe('Solution Service - Property 8: Anti-Spoiler Tests', () => {
  let testSolutionId: string

  beforeAll(async () => {
    // Create a test solution for anti-spoiler tests
    const solution = await prisma.solutions.create({
      data: {
        problemId: testProblemId,
        authorId: testSolvedUserId,
        title: 'Test Solution for Anti-Spoiler',
        content: 'This is the secret solution content that should be hidden',
        code: 'print("secret code")',
        language: 'python',
      },
    })
    testSolutionId = solution.id
  })

  afterAll(async () => {
    // Clean up test solution
    try {
      await prisma.solutions.delete({ where: { id: testSolutionId } })
    } catch {
      // Ignore if already deleted
    }
  })

  /**
   * Feature: ai-club-oj-system, Property 8: 题解防剧透
   * **Validates: Requirements 4.5**
   * 
   * For users who haven't solved the problem, solution content should be hidden.
   */
  it('Property 8.1: Unsolved users see hidden content in solution list', async () => {
    // Query solutions as unsolved user
    const result = await solutionService.getSolutions({
      problemId: testProblemId,
      limit: 100,
    }, testUnsolvedUserId)

    // Find our test solution
    const ourSolution = result.solutions.find(s => s.id === testSolutionId)
    expect(ourSolution).toBeDefined()

    // Content should be hidden
    expect(ourSolution!.isContentHidden).toBe(true)
    expect(ourSolution!.contentPreview).toBeNull()
  }, 30000)

  /**
   * Feature: ai-club-oj-system, Property 8: 题解防剧透
   * **Validates: Requirements 4.5**
   * 
   * For users who haven't solved the problem, solution detail content should be hidden.
   */
  it('Property 8.2: Unsolved users see hidden content in solution detail', async () => {
    // Query solution detail as unsolved user
    const solution = await solutionService.getSolutionById(testSolutionId, testUnsolvedUserId)

    // Content should be hidden
    expect(solution.isContentHidden).toBe(true)
    expect(solution.content).toBeNull()
    expect(solution.code).toBeNull()
    
    // Title should still be visible
    expect(solution.title).toBe('Test Solution for Anti-Spoiler')
  }, 30000)

  /**
   * Feature: ai-club-oj-system, Property 8: 题解防剧透
   * **Validates: Requirements 4.5**
   * 
   * For users who have solved the problem, solution content should be visible.
   */
  it('Property 8.3: Solved users see full content in solution list', async () => {
    // Query solutions as solved user
    const result = await solutionService.getSolutions({
      problemId: testProblemId,
      limit: 100,
    }, testSolvedUserId)

    // Find our test solution
    const ourSolution = result.solutions.find(s => s.id === testSolutionId)
    expect(ourSolution).toBeDefined()

    // Content should be visible
    expect(ourSolution!.isContentHidden).toBe(false)
    expect(ourSolution!.contentPreview).not.toBeNull()
  }, 30000)

  /**
   * Feature: ai-club-oj-system, Property 8: 题解防剧透
   * **Validates: Requirements 4.5**
   * 
   * For users who have solved the problem, solution detail content should be visible.
   */
  it('Property 8.4: Solved users see full content in solution detail', async () => {
    // Query solution detail as solved user
    const solution = await solutionService.getSolutionById(testSolutionId, testSolvedUserId)

    // Content should be visible
    expect(solution.isContentHidden).toBe(false)
    expect(solution.content).toBe('This is the secret solution content that should be hidden')
    expect(solution.code).toBe('print("secret code")')
  }, 30000)

  /**
   * Feature: ai-club-oj-system, Property 8: 题解防剧透
   * **Validates: Requirements 4.5**
   * 
   * For anonymous users (no userId), solution content should be hidden.
   */
  it('Property 8.5: Anonymous users see hidden content', async () => {
    // Query solutions without userId
    const result = await solutionService.getSolutions({
      problemId: testProblemId,
      limit: 100,
    }) // No userId

    // Find our test solution
    const ourSolution = result.solutions.find(s => s.id === testSolutionId)
    expect(ourSolution).toBeDefined()

    // Content should be hidden
    expect(ourSolution!.isContentHidden).toBe(true)
    expect(ourSolution!.contentPreview).toBeNull()
  }, 30000)

  /**
   * Feature: ai-club-oj-system, Property 8: 题解防剧透
   * **Validates: Requirements 4.5**
   * 
   * Property test: For any user, content visibility should be consistent
   * with whether they have solved the problem.
   */
  it('Property 8.6: Content visibility is consistent with solve status', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate whether user has solved (true = solved user, false = unsolved user)
        fc.boolean(),
        async (hasSolved) => {
          const userId = hasSolved ? testSolvedUserId : testUnsolvedUserId

          // Query solution detail
          const solution = await solutionService.getSolutionById(testSolutionId, userId)

          // Visibility should match solve status
          expect(solution.isContentHidden).toBe(!hasSolved)
          
          if (hasSolved) {
            expect(solution.content).not.toBeNull()
            expect(solution.code).not.toBeNull()
          } else {
            expect(solution.content).toBeNull()
            expect(solution.code).toBeNull()
          }
        }
      ),
      { numRuns: 20 }
    )
  }, 60000)
})
