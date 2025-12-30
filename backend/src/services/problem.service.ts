import { prisma } from '../config/database.js'
import { AppError } from '../types/index.js'
import type { Difficulty } from '@prisma/client'
import { parse as csvParse } from 'csv-parse/sync'

// Input types
export interface CreateProblemInput {
  title: string
  description: string
  inputFormat: string
  outputFormat: string
  constraints: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  timeLimit?: number
  memoryLimit?: number
  examples: {
    input: string
    output: string
    explanation?: string
  }[]
  testCases: {
    input: string
    expectedOutput: string
    isExample?: boolean
  }[]
}

export interface UpdateProblemInput {
  title?: string
  description?: string
  inputFormat?: string
  outputFormat?: string
  constraints?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  tags?: string[]
  timeLimit?: number
  memoryLimit?: number
  examples?: {
    input: string
    output: string
    explanation?: string
  }[]
  testCases?: {
    input: string
    expectedOutput: string
    isExample?: boolean
  }[]
}

export interface ProblemListQuery {
  page?: number
  limit?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  tags?: string[]
  search?: string
}

// Response types
export interface ProblemListItem {
  id: string
  number: number
  title: string
  difficulty: string
  tags: string[]
  acceptedCount: number
  submissionCount: number
  acceptanceRate: number
}

export interface ProblemDetail {
  id: string
  number: number
  title: string
  description: string
  inputFormat: string
  outputFormat: string
  constraints: string
  difficulty: string
  tags: string[]
  timeLimit: number
  memoryLimit: number
  examples: {
    input: string
    output: string
    explanation?: string | null
  }[]
  acceptedCount: number
  submissionCount: number
  acceptanceRate: number
  createdAt: Date
}

function mapDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Difficulty {
  const map: Record<string, Difficulty> = {
    easy: 'EASY',
    medium: 'MEDIUM',
    hard: 'HARD',
  }
  return map[difficulty]
}

function mapDifficultyToLower(difficulty: Difficulty): string {
  return difficulty.toLowerCase()
}

export class ProblemService {
  /**
   * Create a new problem (admin only)
   */
  async createProblem(input: CreateProblemInput, createdById: string) {
    const problemId = crypto.randomUUID()
    
    const problem = await prisma.problems.create({
      data: {
        id: problemId,
        title: input.title,
        description: input.description,
        input_format: input.inputFormat,
        output_format: input.outputFormat,
        constraints: input.constraints,
        difficulty: mapDifficulty(input.difficulty),
        time_limit: input.timeLimit ?? 1000,
        memory_limit: input.memoryLimit ?? 256,
        created_by_id: createdById,
        updated_at: new Date(),
        problem_tags: {
          create: input.tags.map((tag) => ({ id: crypto.randomUUID(), tag })),
        },
        examples: {
          create: input.examples.map((ex, index) => ({
            id: crypto.randomUUID(),
            input: ex.input,
            output: ex.output,
            explanation: ex.explanation,
            order: index,
          })),
        },
        test_cases: {
          create: input.testCases.map((tc, index) => ({
            id: crypto.randomUUID(),
            input: tc.input,
            expected_output: tc.expectedOutput,
            is_example: tc.isExample ?? false,
            order: index,
          })),
        },
      },
      include: {
        problem_tags: true,
        examples: { orderBy: { order: 'asc' } },
      },
    })

    return {
      id: problem.id,
      number: problem.number,
      title: problem.title,
      difficulty: mapDifficultyToLower(problem.difficulty),
      tags: problem.problem_tags.map((t) => t.tag),
      timeLimit: problem.time_limit,
      memoryLimit: problem.memory_limit,
      createdAt: problem.created_at,
    }
  }

  /**
   * Get problem list with pagination and filtering
   */
  async getProblems(query: ProblemListQuery) {
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (query.difficulty) {
      where.difficulty = mapDifficulty(query.difficulty)
    }

    if (query.tags && query.tags.length > 0) {
      where.problem_tags = {
        some: {
          tag: { in: query.tags },
        },
      }
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { number: isNaN(Number(query.search)) ? undefined : Number(query.search) },
      ].filter(Boolean)
    }

    const [problems, total] = await Promise.all([
      prisma.problems.findMany({
        where,
        skip,
        take: limit,
        orderBy: { number: 'asc' },
        include: {
          problem_tags: true,
        },
      }),
      prisma.problems.count({ where }),
    ])

    const problemList: ProblemListItem[] = problems.map((p) => ({
      id: p.id,
      number: p.number,
      title: p.title,
      difficulty: mapDifficultyToLower(p.difficulty),
      tags: p.problem_tags.map((t) => t.tag),
      acceptedCount: p.accepted_count,
      submissionCount: p.submission_count,
      acceptanceRate: p.submission_count > 0 
        ? Math.round((p.accepted_count / p.submission_count) * 100) 
        : 0,
    }))

    return {
      problems: problemList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Get problem detail by ID or number
   */
  async getProblemById(idOrNumber: string): Promise<ProblemDetail> {
    // Try to find by number first if it's a valid number
    const isNumber = /^\d+$/.test(idOrNumber)
    
    const problem = await prisma.problems.findFirst({
      where: isNumber 
        ? { number: parseInt(idOrNumber, 10) }
        : { id: idOrNumber },
      include: {
        problem_tags: true,
        examples: { orderBy: { order: 'asc' } },
      },
    })

    if (!problem) {
      throw new AppError(404, 'Problem not found', 'NOT_FOUND')
    }

    return {
      id: problem.id,
      number: problem.number,
      title: problem.title,
      description: problem.description,
      inputFormat: problem.input_format,
      outputFormat: problem.output_format,
      constraints: problem.constraints,
      difficulty: mapDifficultyToLower(problem.difficulty),
      tags: problem.problem_tags.map((t) => t.tag),
      timeLimit: problem.time_limit,
      memoryLimit: problem.memory_limit,
      examples: problem.examples.map((ex) => ({
        input: ex.input,
        output: ex.output,
        explanation: ex.explanation,
      })),
      acceptedCount: problem.accepted_count,
      submissionCount: problem.submission_count,
      acceptanceRate: problem.submission_count > 0
        ? Math.round((problem.accepted_count / problem.submission_count) * 100)
        : 0,
      createdAt: problem.created_at,
    }
  }

  /**
   * Update a problem (admin only)
   */
  async updateProblem(id: string, input: UpdateProblemInput) {
    // Check if problem exists
    const existing = await prisma.problems.findUnique({ where: { id } })
    if (!existing) {
      throw new AppError(404, 'Problem not found', 'NOT_FOUND')
    }

    // Build update data
    const updateData: any = {}

    if (input.title !== undefined) updateData.title = input.title
    if (input.description !== undefined) updateData.description = input.description
    if (input.inputFormat !== undefined) updateData.input_format = input.inputFormat
    if (input.outputFormat !== undefined) updateData.output_format = input.outputFormat
    if (input.constraints !== undefined) updateData.constraints = input.constraints
    if (input.difficulty !== undefined) updateData.difficulty = mapDifficulty(input.difficulty)
    if (input.timeLimit !== undefined) updateData.time_limit = input.timeLimit
    if (input.memoryLimit !== undefined) updateData.memory_limit = input.memoryLimit

    // Use transaction for complex updates
    const problem = await prisma.$transaction(async (tx) => {
      // Update tags if provided
      if (input.tags !== undefined) {
        await tx.problem_tags.deleteMany({ where: { problem_id: id } })
        await tx.problem_tags.createMany({
          data: input.tags.map((tag) => ({ id: crypto.randomUUID(), problem_id: id, tag })),
        })
      }

      // Update examples if provided
      if (input.examples !== undefined) {
        await tx.examples.deleteMany({ where: { problem_id: id } })
        await tx.examples.createMany({
          data: input.examples.map((ex, index) => ({
            id: crypto.randomUUID(),
            problem_id: id,
            input: ex.input,
            output: ex.output,
            explanation: ex.explanation,
            order: index,
          })),
        })
      }

      // Update test cases if provided
      if (input.testCases !== undefined) {
        await tx.test_cases.deleteMany({ where: { problem_id: id } })
        await tx.test_cases.createMany({
          data: input.testCases.map((tc, index) => ({
            id: crypto.randomUUID(),
            problem_id: id,
            input: tc.input,
            expected_output: tc.expectedOutput,
            is_example: tc.isExample ?? false,
            order: index,
          })),
        })
      }

      // Update problem
      return tx.problems.update({
        where: { id },
        data: updateData,
        include: {
          problem_tags: true,
          examples: { orderBy: { order: 'asc' } },
        },
      })
    })

    return {
      id: problem.id,
      number: problem.number,
      title: problem.title,
      difficulty: mapDifficultyToLower(problem.difficulty),
      tags: problem.problem_tags.map((t) => t.tag),
      timeLimit: problem.time_limit,
      memoryLimit: problem.memory_limit,
      updatedAt: problem.updated_at,
    }
  }

  /**
   * Delete a problem (admin only)
   */
  async deleteProblem(id: string) {
    // Check if problem exists
    const existing = await prisma.problems.findUnique({ where: { id } })
    if (!existing) {
      throw new AppError(404, 'Problem not found', 'NOT_FOUND')
    }

    await prisma.problems.delete({ where: { id } })

    return { success: true }
  }

  /**
   * Get all unique tags
   */
  async getAllTags() {
    const tags = await prisma.problemTag.findMany({
      distinct: ['tag'],
      select: { tag: true },
      orderBy: { tag: 'asc' },
    })

    return tags.map((t) => t.tag)
  }

  /**
   * Batch import problems from JSON format
   * @param data Array of problem data in JSON format
   * @param createdById ID of the admin user creating the problems
   * @returns Import result with success/failure counts and details
   */
  async batchImportJSON(data: unknown, createdById: string): Promise<BatchImportResult> {
    // Validate that data is an array
    if (!Array.isArray(data)) {
      throw new AppError(400, 'Import data must be an array of problems', 'VALIDATION_ERROR')
    }

    if (data.length === 0) {
      throw new AppError(400, 'Import data cannot be empty', 'VALIDATION_ERROR')
    }

    const results: BatchImportResult = {
      total: data.length,
      successful: 0,
      failed: 0,
      problems: [],
      errors: [],
    }

    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      try {
        const validatedInput = this.validateProblemImportData(item, i)
        const created = await this.createProblem(validatedInput, createdById)
        results.successful++
        results.problems.push({
          index: i,
          id: created.id,
          number: created.number,
          title: created.title,
        })
      } catch (error) {
        results.failed++
        results.errors.push({
          index: i,
          title: item?.title || `Problem at index ${i}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return results
  }

  /**
   * Batch import problems from CSV format
   * @param csvContent CSV string content
   * @param createdById ID of the admin user creating the problems
   * @returns Import result with success/failure counts and details
   */
  async batchImportCSV(csvContent: string, createdById: string): Promise<BatchImportResult> {
    if (!csvContent || csvContent.trim().length === 0) {
      throw new AppError(400, 'CSV content cannot be empty', 'VALIDATION_ERROR')
    }

    let records: any[]
    try {
      records = csvParse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    } catch (error) {
      throw new AppError(400, `Invalid CSV format: ${error instanceof Error ? error.message : 'Parse error'}`, 'VALIDATION_ERROR')
    }

    if (records.length === 0) {
      throw new AppError(400, 'CSV file contains no data rows', 'VALIDATION_ERROR')
    }

    const results: BatchImportResult = {
      total: records.length,
      successful: 0,
      failed: 0,
      problems: [],
      errors: [],
    }

    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      try {
        const problemInput = this.parseCSVRecord(record, i)
        const validatedInput = this.validateProblemImportData(problemInput, i)
        const created = await this.createProblem(validatedInput, createdById)
        results.successful++
        results.problems.push({
          index: i,
          id: created.id,
          number: created.number,
          title: created.title,
        })
      } catch (error) {
        results.failed++
        results.errors.push({
          index: i,
          title: record?.title || `Row ${i + 2}`, // +2 because row 1 is header, index is 0-based
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return results
  }

  /**
   * Parse a CSV record into problem input format
   */
  private parseCSVRecord(record: Record<string, string>, _index: number): CreateProblemInput {
    // Parse tags from comma-separated string
    const tags = record.tags
      ? record.tags.split(',').map(t => t.trim()).filter(Boolean)
      : []

    // Parse examples from JSON string or create default
    let examples: CreateProblemInput['examples'] = []
    if (record.examples) {
      try {
        examples = JSON.parse(record.examples)
      } catch {
        // If examples is not valid JSON, try to parse as simple format
        // Format: "input1|output1;input2|output2"
        examples = record.examples.split(';').map(ex => {
          const [input, output] = ex.split('|')
          return { input: input?.trim() || '', output: output?.trim() || '' }
        }).filter(ex => ex.input && ex.output)
      }
    }

    // Parse test cases from JSON string or create default
    let testCases: CreateProblemInput['testCases'] = []
    if (record.testCases) {
      try {
        testCases = JSON.parse(record.testCases)
      } catch {
        // If testCases is not valid JSON, try to parse as simple format
        // Format: "input1|output1;input2|output2"
        testCases = record.testCases.split(';').map(tc => {
          const [input, expectedOutput] = tc.split('|')
          return { 
            input: input?.trim() || '', 
            expectedOutput: expectedOutput?.trim() || '',
            isExample: false,
          }
        }).filter(tc => tc.input && tc.expectedOutput)
      }
    }

    // If no examples provided, use first test case as example
    if (examples.length === 0 && testCases.length > 0) {
      examples = [{
        input: testCases[0].input,
        output: testCases[0].expectedOutput,
      }]
      testCases[0].isExample = true
    }

    // If no test cases provided, use examples as test cases
    if (testCases.length === 0 && examples.length > 0) {
      testCases = examples.map(ex => ({
        input: ex.input,
        expectedOutput: ex.output,
        isExample: true,
      }))
    }

    return {
      title: record.title || '',
      description: record.description || '',
      inputFormat: record.inputFormat || record.input_format || '',
      outputFormat: record.outputFormat || record.output_format || '',
      constraints: record.constraints || '',
      difficulty: this.parseDifficulty(record.difficulty),
      tags,
      timeLimit: record.timeLimit ? parseInt(record.timeLimit, 10) : 1000,
      memoryLimit: record.memoryLimit ? parseInt(record.memoryLimit, 10) : 256,
      examples,
      testCases,
    }
  }

  /**
   * Parse difficulty string to valid difficulty value
   */
  private parseDifficulty(value: string | undefined): 'easy' | 'medium' | 'hard' {
    const normalized = value?.toLowerCase().trim()
    if (normalized === 'easy' || normalized === 'medium' || normalized === 'hard') {
      return normalized
    }
    // Default to medium if invalid
    return 'medium'
  }

  /**
   * Validate problem import data and return validated input
   */
  private validateProblemImportData(data: any, index: number): CreateProblemInput {
    const errors: string[] = []

    // Required fields validation
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('title is required')
    } else if (data.title.length > 200) {
      errors.push('title must be at most 200 characters')
    }

    if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
      errors.push('description is required')
    }

    if (!data.inputFormat || typeof data.inputFormat !== 'string' || data.inputFormat.trim().length === 0) {
      errors.push('inputFormat is required')
    }

    if (!data.outputFormat || typeof data.outputFormat !== 'string' || data.outputFormat.trim().length === 0) {
      errors.push('outputFormat is required')
    }

    if (!data.constraints || typeof data.constraints !== 'string' || data.constraints.trim().length === 0) {
      errors.push('constraints is required')
    }

    // Difficulty validation
    const validDifficulties = ['easy', 'medium', 'hard']
    if (!data.difficulty || !validDifficulties.includes(data.difficulty)) {
      errors.push('difficulty must be one of: easy, medium, hard')
    }

    // Tags validation
    if (!Array.isArray(data.tags) || data.tags.length === 0) {
      errors.push('at least one tag is required')
    }

    // Examples validation
    if (!Array.isArray(data.examples) || data.examples.length === 0) {
      errors.push('at least one example is required')
    } else {
      for (let i = 0; i < data.examples.length; i++) {
        const ex = data.examples[i]
        if (!ex.input || !ex.output) {
          errors.push(`example ${i + 1} must have input and output`)
        }
      }
    }

    // Test cases validation
    if (!Array.isArray(data.testCases) || data.testCases.length === 0) {
      errors.push('at least one test case is required')
    } else {
      for (let i = 0; i < data.testCases.length; i++) {
        const tc = data.testCases[i]
        if (!tc.input || !tc.expectedOutput) {
          errors.push(`test case ${i + 1} must have input and expectedOutput`)
        }
      }
    }

    // Time limit validation
    if (data.timeLimit !== undefined) {
      const timeLimit = Number(data.timeLimit)
      if (isNaN(timeLimit) || timeLimit < 100 || timeLimit > 10000) {
        errors.push('timeLimit must be between 100 and 10000')
      }
    }

    // Memory limit validation
    if (data.memoryLimit !== undefined) {
      const memoryLimit = Number(data.memoryLimit)
      if (isNaN(memoryLimit) || memoryLimit < 16 || memoryLimit > 1024) {
        errors.push('memoryLimit must be between 16 and 1024')
      }
    }

    if (errors.length > 0) {
      throw new AppError(400, `Validation failed for problem at index ${index}: ${errors.join('; ')}`, 'VALIDATION_ERROR')
    }

    return {
      title: data.title.trim(),
      description: data.description.trim(),
      inputFormat: data.inputFormat.trim(),
      outputFormat: data.outputFormat.trim(),
      constraints: data.constraints.trim(),
      difficulty: data.difficulty,
      tags: data.tags.map((t: string) => t.trim()),
      timeLimit: data.timeLimit ?? 1000,
      memoryLimit: data.memoryLimit ?? 256,
      examples: data.examples.map((ex: any) => ({
        input: ex.input,
        output: ex.output,
        explanation: ex.explanation,
      })),
      testCases: data.testCases.map((tc: any) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isExample: tc.isExample ?? false,
      })),
    }
  }
}

// Batch import result types
export interface BatchImportResult {
  total: number
  successful: number
  failed: number
  problems: {
    index: number
    id: string
    number: number
    title: string
  }[]
  errors: {
    index: number
    title: string
    error: string
  }[]
}

export const problemService = new ProblemService()
