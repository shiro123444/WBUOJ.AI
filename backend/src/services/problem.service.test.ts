import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import fc from 'fast-check'
import { PrismaClient } from '@prisma/client'
import { ProblemService, type CreateProblemInput } from './problem.service.js'

/**
 * Property-Based Tests for Problem Module
 * 
 * **Property 2: 题目 CRUD 一致性**
 * **Validates: Requirements 2.1, 2.4**
 * 
 * For any problem data:
 * - After creation, querying by ID should return the same data
 * - After update, querying should return updated data
 * - After deletion, querying should return empty
 * - Each new problem should get a unique and incrementing number
 * 
 * **Property 3: 题目筛选正确性**
 * **Validates: Requirements 2.3**
 * 
 * For any problem set and filter conditions (difficulty, tags):
 * - Filter results should only include problems that satisfy ALL filter conditions
 * - Filter results should not miss any problems that satisfy the conditions
 */

// Test database client
const prisma = new PrismaClient()
const problemService = new ProblemService()

// Test user ID (we'll create a test admin user)
let testAdminId: string

// Arbitrary for generating valid problem titles
const titleArb = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0)
  .map(s => s.trim())

// Arbitrary for generating valid descriptions (markdown-like)
const descriptionArb = fc.string({ minLength: 10, maxLength: 500 })
  .filter(s => s.trim().length >= 10)
  .map(s => s.trim())

// Arbitrary for difficulty
const difficultyArb = fc.constantFrom('easy' as const, 'medium' as const, 'hard' as const)

// Arbitrary for tags
const tagArb = fc.string({ minLength: 1, maxLength: 30 })
  .filter(s => /^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/.test(s.trim()) && s.trim().length > 0)
  .map(s => s.trim())

const tagsArb = fc.array(tagArb, { minLength: 1, maxLength: 5 })
  .map(tags => [...new Set(tags)]) // Remove duplicates

// Arbitrary for examples
const exampleArb = fc.record({
  input: fc.string({ minLength: 1, maxLength: 100 }).map(s => s || '1'),
  output: fc.string({ minLength: 1, maxLength: 100 }).map(s => s || '1'),
  explanation: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
})

// Arbitrary for test cases
const testCaseArb = fc.record({
  input: fc.string({ minLength: 1, maxLength: 100 }).map(s => s || '1'),
  expectedOutput: fc.string({ minLength: 1, maxLength: 100 }).map(s => s || '1'),
  isExample: fc.boolean(),
})

// Arbitrary for complete problem input
const problemInputArb: fc.Arbitrary<CreateProblemInput> = fc.record({
  title: titleArb,
  description: descriptionArb,
  inputFormat: fc.string({ minLength: 1, maxLength: 200 }).map(s => s.trim() || 'Input format'),
  outputFormat: fc.string({ minLength: 1, maxLength: 200 }).map(s => s.trim() || 'Output format'),
  constraints: fc.string({ minLength: 1, maxLength: 200 }).map(s => s.trim() || 'Constraints'),
  difficulty: difficultyArb,
  tags: tagsArb,
  timeLimit: fc.integer({ min: 100, max: 10000 }),
  memoryLimit: fc.integer({ min: 16, max: 1024 }),
  examples: fc.array(exampleArb, { minLength: 1, maxLength: 3 }),
  testCases: fc.array(testCaseArb, { minLength: 1, maxLength: 5 }),
})

describe('Problem Service - Property Based Tests', () => {
  beforeAll(async () => {
    // Create a test admin user for creating problems
    const existingUser = await prisma.user.findFirst({
      where: { username: 'test_admin_problem' }
    })
    
    if (existingUser) {
      testAdminId = existingUser.id
    } else {
      const user = await prisma.user.create({
        data: {
          username: 'test_admin_problem',
          email: 'test_admin_problem@test.com',
          passwordHash: 'test_hash',
          role: 'ADMIN',
        },
      })
      testAdminId = user.id
    }
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.problem.deleteMany({
      where: { createdById: testAdminId }
    })
    await prisma.user.deleteMany({
      where: { username: 'test_admin_problem' }
    })
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Clean up problems before each test
    await prisma.problem.deleteMany({
      where: { createdById: testAdminId }
    })
  })

  /**
   * Feature: ai-club-oj-system, Property 2: 题目 CRUD 一致性
   * **Validates: Requirements 2.1, 2.4**
   * 
   * For any problem data, after creation, querying by ID should return
   * the same core data (title, difficulty, tags).
   */
  it('Property 2.1: Create then read returns same data', async () => {
    await fc.assert(
      fc.asyncProperty(
        problemInputArb,
        async (input) => {
          // Create problem
          const created = await problemService.createProblem(input, testAdminId)
          
          // Read problem by ID
          const retrieved = await problemService.getProblemById(created.id)
          
          // Verify core data matches
          expect(retrieved.title).toBe(input.title)
          expect(retrieved.difficulty).toBe(input.difficulty)
          expect(retrieved.description).toBe(input.description)
          expect(retrieved.inputFormat).toBe(input.inputFormat)
          expect(retrieved.outputFormat).toBe(input.outputFormat)
          expect(retrieved.constraints).toBe(input.constraints)
          expect(retrieved.timeLimit).toBe(input.timeLimit)
          expect(retrieved.memoryLimit).toBe(input.memoryLimit)
          
          // Tags should match (order may differ)
          expect(new Set(retrieved.tags)).toEqual(new Set(input.tags))
          
          // Examples count should match
          expect(retrieved.examples.length).toBe(input.examples.length)
          
          // Clean up for next iteration
          await problemService.deleteProblem(created.id)
        }
      ),
      { numRuns: 20 } // Reduced for faster test execution
    )
  }, 60000) // 60 second timeout

  /**
   * Feature: ai-club-oj-system, Property 2: 题目 CRUD 一致性
   * **Validates: Requirements 2.4**
   * 
   * Each new problem should get a unique and incrementing number.
   */
  it('Property 2.2: Problem numbers are unique and incrementing', async () => {
    const problemNumbers: number[] = []
    
    await fc.assert(
      fc.asyncProperty(
        problemInputArb,
        async (input) => {
          const created = await problemService.createProblem(input, testAdminId)
          
          // Number should be unique
          expect(problemNumbers).not.toContain(created.number)
          
          // Number should be greater than all previous numbers
          if (problemNumbers.length > 0) {
            const maxPrevious = Math.max(...problemNumbers)
            expect(created.number).toBeGreaterThan(maxPrevious)
          }
          
          problemNumbers.push(created.number)
        }
      ),
      { numRuns: 10 }
    )
  }, 60000)

  /**
   * Feature: ai-club-oj-system, Property 2: 题目 CRUD 一致性
   * **Validates: Requirements 2.1**
   * 
   * After update, querying should return updated data.
   */
  it('Property 2.3: Update then read returns updated data', async () => {
    await fc.assert(
      fc.asyncProperty(
        problemInputArb,
        problemInputArb,
        async (originalInput, updateInput) => {
          // Create original problem
          const created = await problemService.createProblem(originalInput, testAdminId)
          
          // Update with new data
          await problemService.updateProblem(created.id, {
            title: updateInput.title,
            description: updateInput.description,
            difficulty: updateInput.difficulty,
            tags: updateInput.tags,
          })
          
          // Read and verify updated data
          const retrieved = await problemService.getProblemById(created.id)
          
          expect(retrieved.title).toBe(updateInput.title)
          expect(retrieved.description).toBe(updateInput.description)
          expect(retrieved.difficulty).toBe(updateInput.difficulty)
          expect(new Set(retrieved.tags)).toEqual(new Set(updateInput.tags))
          
          // Number should remain unchanged
          expect(retrieved.number).toBe(created.number)
          
          // Clean up
          await problemService.deleteProblem(created.id)
        }
      ),
      { numRuns: 15 }
    )
  }, 60000)

  /**
   * Feature: ai-club-oj-system, Property 2: 题目 CRUD 一致性
   * **Validates: Requirements 2.1**
   * 
   * After deletion, querying should throw not found error.
   */
  it('Property 2.4: Delete then read throws not found', async () => {
    await fc.assert(
      fc.asyncProperty(
        problemInputArb,
        async (input) => {
          // Create problem
          const created = await problemService.createProblem(input, testAdminId)
          const problemId = created.id
          
          // Delete problem
          const deleteResult = await problemService.deleteProblem(problemId)
          expect(deleteResult.success).toBe(true)
          
          // Try to read - should throw
          await expect(problemService.getProblemById(problemId))
            .rejects.toThrow('Problem not found')
        }
      ),
      { numRuns: 15 }
    )
  }, 60000)

  /**
   * Feature: ai-club-oj-system, Property 2: 题目 CRUD 一致性
   * **Validates: Requirements 2.1**
   * 
   * Can query problem by number as well as by ID.
   */
  it('Property 2.5: Query by number returns same as query by ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        problemInputArb,
        async (input) => {
          // Create problem
          const created = await problemService.createProblem(input, testAdminId)
          
          // Query by ID
          const byId = await problemService.getProblemById(created.id)
          
          // Query by number
          const byNumber = await problemService.getProblemById(String(created.number))
          
          // Should return same data
          expect(byId.id).toBe(byNumber.id)
          expect(byId.number).toBe(byNumber.number)
          expect(byId.title).toBe(byNumber.title)
          
          // Clean up
          await problemService.deleteProblem(created.id)
        }
      ),
      { numRuns: 15 }
    )
  }, 60000)
})

/**
 * Property-Based Tests for Problem Filtering
 * 
 * **Property 3: 题目筛选正确性**
 * **Validates: Requirements 2.3**
 * 
 * For any problem set and filter conditions (difficulty, tags):
 * - Filter results should only include problems that satisfy ALL filter conditions
 * - Filter results should not miss any problems that satisfy the conditions
 */
describe('Problem Service - Property 3: Problem Filtering Tests', () => {
  // Test database client
  const prisma = new PrismaClient()
  const problemService = new ProblemService()
  
  // Test user ID
  let testAdminId: string
  
  // Store created problem IDs for cleanup
  const createdProblemIds: string[] = []

  // Predefined tags for consistent testing
  const availableTags = ['array', 'string', 'dp', 'graph', 'tree', 'math', 'greedy', 'binary-search']
  
  // Arbitrary for difficulty
  const difficultyArb = fc.constantFrom('easy' as const, 'medium' as const, 'hard' as const)
  
  // Arbitrary for selecting subset of tags
  const tagsSubsetArb = fc.subarray(availableTags, { minLength: 1, maxLength: 4 })

  // Helper to create a problem with specific difficulty and tags
  async function createTestProblem(
    difficulty: 'easy' | 'medium' | 'hard',
    tags: string[],
    adminId: string
  ) {
    const problem = await problemService.createProblem({
      title: `Test Problem ${Date.now()}-${Math.random().toString(36).slice(2)}`,
      description: 'Test description for filtering test',
      inputFormat: 'Input format',
      outputFormat: 'Output format',
      constraints: 'Constraints',
      difficulty,
      tags,
      timeLimit: 1000,
      memoryLimit: 256,
      examples: [{ input: '1', output: '1' }],
      testCases: [{ input: '1', expectedOutput: '1', isExample: true }],
    }, adminId)
    
    createdProblemIds.push(problem.id)
    return problem
  }

  beforeAll(async () => {
    // Create a test admin user
    const existingUser = await prisma.user.findFirst({
      where: { username: 'test_admin_filter' }
    })
    
    if (existingUser) {
      testAdminId = existingUser.id
    } else {
      const user = await prisma.user.create({
        data: {
          username: 'test_admin_filter',
          email: 'test_admin_filter@test.com',
          passwordHash: 'test_hash',
          role: 'ADMIN',
        },
      })
      testAdminId = user.id
    }
  })

  afterAll(async () => {
    // Clean up all created problems
    for (const id of createdProblemIds) {
      try {
        await prisma.problem.delete({ where: { id } })
      } catch {
        // Ignore if already deleted
      }
    }
    await prisma.user.deleteMany({
      where: { username: 'test_admin_filter' }
    })
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Clean up problems before each test
    for (const id of createdProblemIds) {
      try {
        await prisma.problem.delete({ where: { id } })
      } catch {
        // Ignore if already deleted
      }
    }
    createdProblemIds.length = 0
  })

  /**
   * Feature: ai-club-oj-system, Property 3: 题目筛选正确性
   * **Validates: Requirements 2.3**
   * 
   * For any difficulty filter, all returned problems should have that difficulty,
   * and no problems with that difficulty should be missing from results.
   */
  it('Property 3.1: Difficulty filter returns only matching problems', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a set of problems with various difficulties
        fc.array(difficultyArb, { minLength: 3, maxLength: 10 }),
        // Generate a difficulty to filter by
        difficultyArb,
        async (difficulties, filterDifficulty) => {
          // Create problems with different difficulties
          const createdProblems = await Promise.all(
            difficulties.map((diff, i) => 
              createTestProblem(diff, [availableTags[i % availableTags.length]], testAdminId)
            )
          )
          
          // Query with difficulty filter
          const result = await problemService.getProblems({
            difficulty: filterDifficulty,
            limit: 100,
          })
          
          // Get IDs of our created problems
          const ourProblemIds = new Set(createdProblems.map(p => p.id))
          
          // Filter to only our test problems
          const ourFilteredProblems = result.problems.filter(p => ourProblemIds.has(p.id))
          
          // All returned problems should have the filtered difficulty
          for (const problem of ourFilteredProblems) {
            expect(problem.difficulty).toBe(filterDifficulty)
          }
          
          // Count how many of our problems should match
          const expectedCount = difficulties.filter(d => d === filterDifficulty).length
          
          // Should not miss any matching problems
          expect(ourFilteredProblems.length).toBe(expectedCount)
        }
      ),
      { numRuns: 20 }
    )
  }, 120000)

  /**
   * Feature: ai-club-oj-system, Property 3: 题目筛选正确性
   * **Validates: Requirements 2.3**
   * 
   * For any tag filter, all returned problems should have at least one of those tags,
   * and no problems with those tags should be missing from results.
   */
  it('Property 3.2: Tag filter returns only matching problems', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate problems with various tag combinations
        fc.array(tagsSubsetArb, { minLength: 3, maxLength: 8 }),
        // Generate tags to filter by
        tagsSubsetArb,
        async (problemTagSets, filterTags) => {
          // Create problems with different tag sets
          const createdProblems = await Promise.all(
            problemTagSets.map((tags, i) => {
              const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard']
              return createTestProblem(difficulties[i % 3], tags, testAdminId)
            })
          )
          
          // Query with tag filter
          const result = await problemService.getProblems({
            tags: filterTags,
            limit: 100,
          })
          
          // Get IDs of our created problems
          const ourProblemIds = new Set(createdProblems.map(p => p.id))
          
          // Filter to only our test problems
          const ourFilteredProblems = result.problems.filter(p => ourProblemIds.has(p.id))
          
          // All returned problems should have at least one of the filter tags
          for (const problem of ourFilteredProblems) {
            const hasMatchingTag = problem.tags.some(tag => filterTags.includes(tag))
            expect(hasMatchingTag).toBe(true)
          }
          
          // Count how many of our problems should match (have at least one filter tag)
          const expectedMatchingProblems = problemTagSets.filter(tags =>
            tags.some(tag => filterTags.includes(tag))
          ).length
          
          // Should not miss any matching problems
          expect(ourFilteredProblems.length).toBe(expectedMatchingProblems)
        }
      ),
      { numRuns: 20 }
    )
  }, 120000)

  /**
   * Feature: ai-club-oj-system, Property 3: 题目筛选正确性
   * **Validates: Requirements 2.3**
   * 
   * For combined difficulty AND tag filters, all returned problems should satisfy BOTH conditions.
   */
  it('Property 3.3: Combined filters return only problems matching ALL conditions', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate problems with various combinations
        fc.array(
          fc.record({
            difficulty: difficultyArb,
            tags: tagsSubsetArb,
          }),
          { minLength: 5, maxLength: 12 }
        ),
        // Generate filter conditions
        difficultyArb,
        tagsSubsetArb,
        async (problemSpecs, filterDifficulty, filterTags) => {
          // Create problems
          const createdProblems = await Promise.all(
            problemSpecs.map(spec => 
              createTestProblem(spec.difficulty, spec.tags, testAdminId)
            )
          )
          
          // Query with both filters
          const result = await problemService.getProblems({
            difficulty: filterDifficulty,
            tags: filterTags,
            limit: 100,
          })
          
          // Get IDs of our created problems
          const ourProblemIds = new Set(createdProblems.map(p => p.id))
          
          // Filter to only our test problems
          const ourFilteredProblems = result.problems.filter(p => ourProblemIds.has(p.id))
          
          // All returned problems should satisfy BOTH conditions
          for (const problem of ourFilteredProblems) {
            // Must have correct difficulty
            expect(problem.difficulty).toBe(filterDifficulty)
            
            // Must have at least one matching tag
            const hasMatchingTag = problem.tags.some(tag => filterTags.includes(tag))
            expect(hasMatchingTag).toBe(true)
          }
          
          // Count expected matches (satisfy both conditions)
          const expectedCount = problemSpecs.filter(spec =>
            spec.difficulty === filterDifficulty &&
            spec.tags.some(tag => filterTags.includes(tag))
          ).length
          
          // Should not miss any matching problems
          expect(ourFilteredProblems.length).toBe(expectedCount)
        }
      ),
      { numRuns: 20 }
    )
  }, 120000)

  /**
   * Feature: ai-club-oj-system, Property 3: 题目筛选正确性
   * **Validates: Requirements 2.3**
   * 
   * Empty filter (no conditions) should return all problems.
   */
  it('Property 3.4: No filter returns all problems', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate problems with various combinations
        fc.array(
          fc.record({
            difficulty: difficultyArb,
            tags: tagsSubsetArb,
          }),
          { minLength: 3, maxLength: 8 }
        ),
        async (problemSpecs) => {
          // Create problems
          const createdProblems = await Promise.all(
            problemSpecs.map(spec => 
              createTestProblem(spec.difficulty, spec.tags, testAdminId)
            )
          )
          
          // Query without any filters
          const result = await problemService.getProblems({
            limit: 100,
          })
          
          // Get IDs of our created problems
          const ourProblemIds = new Set(createdProblems.map(p => p.id))
          
          // Filter to only our test problems
          const ourFilteredProblems = result.problems.filter(p => ourProblemIds.has(p.id))
          
          // Should return all our created problems
          expect(ourFilteredProblems.length).toBe(createdProblems.length)
        }
      ),
      { numRuns: 15 }
    )
  }, 120000)

  /**
   * Feature: ai-club-oj-system, Property 3: 题目筛选正确性
   * **Validates: Requirements 2.3**
   * 
   * Filter with non-matching criteria should return empty results (for our test problems).
   */
  it('Property 3.5: Non-matching filter returns no matching problems', async () => {
    // Create problems with only 'easy' difficulty and 'array' tag
    const createdProblems = await Promise.all([
      createTestProblem('easy', ['array'], testAdminId),
      createTestProblem('easy', ['array', 'string'], testAdminId),
      createTestProblem('easy', ['array'], testAdminId),
    ])
    
    // Query with 'hard' difficulty - should not match any of our problems
    const result = await problemService.getProblems({
      difficulty: 'hard',
      limit: 100,
    })
    
    // Get IDs of our created problems
    const ourProblemIds = new Set(createdProblems.map(p => p.id))
    
    // Filter to only our test problems
    const ourFilteredProblems = result.problems.filter(p => ourProblemIds.has(p.id))
    
    // Should return none of our problems
    expect(ourFilteredProblems.length).toBe(0)
  }, 60000)
})


/**
 * Property-Based Tests for Batch Import
 * 
 * **Property 4: 批量导入一致性**
 * **Validates: Requirements 2.6**
 * 
 * For any valid problem list (JSON/CSV format):
 * - After batch import, the database should contain all imported problems
 * - Each problem's data should match the import data
 */
describe('Problem Service - Property 4: Batch Import Consistency Tests', () => {
  // Test database client
  const prisma = new PrismaClient()
  const problemService = new ProblemService()
  
  // Test user ID
  let testAdminId: string
  
  // Store created problem IDs for cleanup
  const createdProblemIds: string[] = []

  // Predefined tags for consistent testing
  const availableTags = ['array', 'string', 'dp', 'graph', 'tree', 'math', 'greedy', 'binary-search']
  
  // Arbitrary for difficulty
  const difficultyArb = fc.constantFrom('easy' as const, 'medium' as const, 'hard' as const)
  
  // Arbitrary for selecting subset of tags
  const tagsSubsetArb = fc.subarray(availableTags, { minLength: 1, maxLength: 3 })

  // Arbitrary for generating valid problem import data
  const problemImportDataArb = fc.record({
    title: fc.string({ minLength: 1, maxLength: 100 })
      .filter(s => s.trim().length > 0)
      .map(s => s.trim()),
    description: fc.string({ minLength: 10, maxLength: 300 })
      .filter(s => s.trim().length >= 10)
      .map(s => s.trim()),
    inputFormat: fc.string({ minLength: 1, maxLength: 100 })
      .map(s => s.trim() || 'Input format'),
    outputFormat: fc.string({ minLength: 1, maxLength: 100 })
      .map(s => s.trim() || 'Output format'),
    constraints: fc.string({ minLength: 1, maxLength: 100 })
      .map(s => s.trim() || 'Constraints'),
    difficulty: difficultyArb,
    tags: tagsSubsetArb,
    timeLimit: fc.integer({ min: 100, max: 10000 }),
    memoryLimit: fc.integer({ min: 16, max: 1024 }),
    examples: fc.array(
      fc.record({
        input: fc.string({ minLength: 1, maxLength: 50 }).map(s => s || '1'),
        output: fc.string({ minLength: 1, maxLength: 50 }).map(s => s || '1'),
        explanation: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
      }),
      { minLength: 1, maxLength: 2 }
    ),
    testCases: fc.array(
      fc.record({
        input: fc.string({ minLength: 1, maxLength: 50 }).map(s => s || '1'),
        expectedOutput: fc.string({ minLength: 1, maxLength: 50 }).map(s => s || '1'),
        isExample: fc.boolean(),
      }),
      { minLength: 1, maxLength: 3 }
    ),
  })

  // Arbitrary for generating a list of valid problems for batch import
  const problemListArb = fc.array(problemImportDataArb, { minLength: 1, maxLength: 5 })

  beforeAll(async () => {
    // Create a test admin user
    const existingUser = await prisma.user.findFirst({
      where: { username: 'test_admin_batch_import' }
    })
    
    if (existingUser) {
      testAdminId = existingUser.id
    } else {
      const user = await prisma.user.create({
        data: {
          username: 'test_admin_batch_import',
          email: 'test_admin_batch_import@test.com',
          passwordHash: 'test_hash',
          role: 'ADMIN',
        },
      })
      testAdminId = user.id
    }
  })

  afterAll(async () => {
    // Clean up all created problems
    for (const id of createdProblemIds) {
      try {
        await prisma.problem.delete({ where: { id } })
      } catch {
        // Ignore if already deleted
      }
    }
    await prisma.user.deleteMany({
      where: { username: 'test_admin_batch_import' }
    })
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Clean up problems before each test
    for (const id of createdProblemIds) {
      try {
        await prisma.problem.delete({ where: { id } })
      } catch {
        // Ignore if already deleted
      }
    }
    createdProblemIds.length = 0
  })

  /**
   * Feature: ai-club-oj-system, Property 4: 批量导入一致性
   * **Validates: Requirements 2.6**
   * 
   * For any valid problem list in JSON format, after batch import:
   * - The database should contain all imported problems
   * - The number of successful imports should equal the number of valid problems
   */
  it('Property 4.1: JSON batch import creates all valid problems', async () => {
    await fc.assert(
      fc.asyncProperty(
        problemListArb,
        async (problemList) => {
          // Perform batch import
          const result = await problemService.batchImportJSON(problemList, testAdminId)
          
          // Track created IDs for cleanup
          result.problems.forEach(p => createdProblemIds.push(p.id))
          
          // All problems should be successfully imported
          expect(result.successful).toBe(problemList.length)
          expect(result.failed).toBe(0)
          expect(result.total).toBe(problemList.length)
          expect(result.problems.length).toBe(problemList.length)
          expect(result.errors.length).toBe(0)
          
          // Verify each problem exists in database with correct data
          for (let i = 0; i < problemList.length; i++) {
            const importData = problemList[i]
            const createdInfo = result.problems.find(p => p.index === i)
            
            expect(createdInfo).toBeDefined()
            
            // Retrieve from database and verify
            const retrieved = await problemService.getProblemById(createdInfo!.id)
            
            expect(retrieved.title).toBe(importData.title)
            expect(retrieved.description).toBe(importData.description)
            expect(retrieved.difficulty).toBe(importData.difficulty)
            expect(retrieved.inputFormat).toBe(importData.inputFormat)
            expect(retrieved.outputFormat).toBe(importData.outputFormat)
            expect(retrieved.constraints).toBe(importData.constraints)
            expect(retrieved.timeLimit).toBe(importData.timeLimit)
            expect(retrieved.memoryLimit).toBe(importData.memoryLimit)
            expect(new Set(retrieved.tags)).toEqual(new Set(importData.tags))
            expect(retrieved.examples.length).toBe(importData.examples.length)
          }
        }
      ),
      { numRuns: 15 }
    )
  }, 120000)

  /**
   * Feature: ai-club-oj-system, Property 4: 批量导入一致性
   * **Validates: Requirements 2.6**
   * 
   * For any valid problem list in JSON format, each imported problem
   * should have a unique and incrementing number.
   */
  it('Property 4.2: JSON batch import assigns unique incrementing numbers', async () => {
    await fc.assert(
      fc.asyncProperty(
        problemListArb,
        async (problemList) => {
          // Perform batch import
          const result = await problemService.batchImportJSON(problemList, testAdminId)
          
          // Track created IDs for cleanup
          result.problems.forEach(p => createdProblemIds.push(p.id))
          
          // Extract problem numbers
          const numbers = result.problems.map(p => p.number)
          
          // All numbers should be unique
          const uniqueNumbers = new Set(numbers)
          expect(uniqueNumbers.size).toBe(numbers.length)
          
          // Numbers should be in ascending order (as they were created sequentially)
          for (let i = 1; i < numbers.length; i++) {
            expect(numbers[i]).toBeGreaterThan(numbers[i - 1])
          }
        }
      ),
      { numRuns: 15 }
    )
  }, 120000)

  /**
   * Feature: ai-club-oj-system, Property 4: 批量导入一致性
   * **Validates: Requirements 2.6**
   * 
   * For any valid CSV content, after batch import:
   * - The database should contain all imported problems
   * - Each problem's data should match the CSV data
   */
  it('Property 4.3: CSV batch import creates all valid problems', async () => {
    await fc.assert(
      fc.asyncProperty(
        problemListArb,
        async (problemList) => {
          // Convert problem list to CSV format
          const csvHeader = 'title,description,inputFormat,outputFormat,constraints,difficulty,tags,timeLimit,memoryLimit,examples,testCases'
          const csvRows = problemList.map(p => {
            const tags = p.tags.join(',')
            const examples = JSON.stringify(p.examples)
            const testCases = JSON.stringify(p.testCases)
            // Escape fields that might contain commas or quotes
            const escapeField = (field: string) => {
              if (field.includes(',') || field.includes('"') || field.includes('\n')) {
                return `"${field.replace(/"/g, '""')}"`
              }
              return field
            }
            return [
              escapeField(p.title),
              escapeField(p.description),
              escapeField(p.inputFormat),
              escapeField(p.outputFormat),
              escapeField(p.constraints),
              p.difficulty,
              escapeField(tags),
              p.timeLimit.toString(),
              p.memoryLimit.toString(),
              escapeField(examples),
              escapeField(testCases),
            ].join(',')
          })
          const csvContent = [csvHeader, ...csvRows].join('\n')
          
          // Perform batch import
          const result = await problemService.batchImportCSV(csvContent, testAdminId)
          
          // Track created IDs for cleanup
          result.problems.forEach(p => createdProblemIds.push(p.id))
          
          // All problems should be successfully imported
          expect(result.successful).toBe(problemList.length)
          expect(result.failed).toBe(0)
          expect(result.total).toBe(problemList.length)
          
          // Verify each problem exists in database with correct data
          for (let i = 0; i < problemList.length; i++) {
            const importData = problemList[i]
            const createdInfo = result.problems.find(p => p.index === i)
            
            expect(createdInfo).toBeDefined()
            
            // Retrieve from database and verify core fields
            const retrieved = await problemService.getProblemById(createdInfo!.id)
            
            expect(retrieved.title).toBe(importData.title)
            expect(retrieved.description).toBe(importData.description)
            expect(retrieved.difficulty).toBe(importData.difficulty)
            expect(retrieved.timeLimit).toBe(importData.timeLimit)
            expect(retrieved.memoryLimit).toBe(importData.memoryLimit)
          }
        }
      ),
      { numRuns: 10 }
    )
  }, 120000)

  /**
   * Feature: ai-club-oj-system, Property 4: 批量导入一致性
   * **Validates: Requirements 2.6**
   * 
   * For a mix of valid and invalid problems, batch import should:
   * - Successfully import all valid problems
   * - Report errors for invalid problems
   * - Not affect valid problems when some are invalid
   */
  it('Property 4.4: Batch import handles partial failures correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid problems
        fc.array(problemImportDataArb, { minLength: 1, maxLength: 3 }),
        async (validProblems) => {
          // Create a mix of valid and invalid problems
          const invalidProblems = [
            { title: '', description: 'Invalid - no title' }, // Missing required fields
            { title: 'Invalid', description: '' }, // Missing description
          ]
          
          const mixedList = [...validProblems, ...invalidProblems]
          
          // Perform batch import
          const result = await problemService.batchImportJSON(mixedList, testAdminId)
          
          // Track created IDs for cleanup
          result.problems.forEach(p => createdProblemIds.push(p.id))
          
          // Valid problems should be imported
          expect(result.successful).toBe(validProblems.length)
          
          // Invalid problems should fail
          expect(result.failed).toBe(invalidProblems.length)
          
          // Total should be the sum
          expect(result.total).toBe(mixedList.length)
          
          // Errors should be reported for invalid problems
          expect(result.errors.length).toBe(invalidProblems.length)
          
          // Verify valid problems were actually created
          for (const createdInfo of result.problems) {
            const retrieved = await problemService.getProblemById(createdInfo.id)
            expect(retrieved).toBeDefined()
            expect(retrieved.title).toBe(createdInfo.title)
          }
        }
      ),
      { numRuns: 10 }
    )
  }, 120000)

  /**
   * Feature: ai-club-oj-system, Property 4: 批量导入一致性
   * **Validates: Requirements 2.6**
   * 
   * For any valid problem, importing it via JSON and then querying
   * should return data that matches the original import data (round-trip consistency).
   */
  it('Property 4.5: Batch import round-trip consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        problemImportDataArb,
        async (importData) => {
          // Import single problem
          const result = await problemService.batchImportJSON([importData], testAdminId)
          
          // Track created ID for cleanup
          result.problems.forEach(p => createdProblemIds.push(p.id))
          
          expect(result.successful).toBe(1)
          
          const createdInfo = result.problems[0]
          
          // Retrieve from database
          const retrieved = await problemService.getProblemById(createdInfo.id)
          
          // Verify all fields match (round-trip consistency)
          expect(retrieved.title).toBe(importData.title)
          expect(retrieved.description).toBe(importData.description)
          expect(retrieved.inputFormat).toBe(importData.inputFormat)
          expect(retrieved.outputFormat).toBe(importData.outputFormat)
          expect(retrieved.constraints).toBe(importData.constraints)
          expect(retrieved.difficulty).toBe(importData.difficulty)
          expect(retrieved.timeLimit).toBe(importData.timeLimit)
          expect(retrieved.memoryLimit).toBe(importData.memoryLimit)
          
          // Tags should match (order may differ)
          expect(new Set(retrieved.tags)).toEqual(new Set(importData.tags))
          
          // Examples count should match
          expect(retrieved.examples.length).toBe(importData.examples.length)
          
          // Verify example content
          for (let i = 0; i < importData.examples.length; i++) {
            expect(retrieved.examples[i].input).toBe(importData.examples[i].input)
            expect(retrieved.examples[i].output).toBe(importData.examples[i].output)
          }
        }
      ),
      { numRuns: 20 }
    )
  }, 120000)
})
