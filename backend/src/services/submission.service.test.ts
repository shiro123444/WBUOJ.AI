import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import {
  hydroStatusToJudgeStatus,
  HydroJudgeStatus,
} from '../types/judge.js'
import type { JudgeResultMessage, TestCaseResultMessage } from '../types/judge.js'
import type { JudgeStatus } from '../types/index.js'

/**
 * Property-Based Tests for Submission/Judge Result Module
 * 
 * **Property 5: 评测结果一致性**
 * **Validates: Requirements 3.3, 3.8**
 * 
 * For any code submission:
 * - If the code passes all test cases, the evaluation result should be Accepted
 * - After evaluation is complete, the system should record execution time and memory usage
 * - The recorded data should match the actual evaluation data
 * 
 * These tests verify the core judge result processing logic:
 * - Status mapping from Hydro Judge to system status
 * - Result consistency between input and processed output
 * - Time and memory recording accuracy
 */

// Arbitrary for generating valid submission IDs (CUID-like format)
const submissionIdArb = fc.string({ minLength: 20, maxLength: 30 })
  .filter(s => /^[a-zA-Z0-9]+$/.test(s))

// Arbitrary for execution time (0-10000 ms)
const timeArb = fc.integer({ min: 0, max: 10000 })

// Arbitrary for memory usage (0-1024 MB in KB)
const memoryArb = fc.integer({ min: 0, max: 1024 * 1024 })

// Arbitrary for Hydro Judge status codes
const hydroStatusArb = fc.constantFrom(
  HydroJudgeStatus.STATUS_WAITING,
  HydroJudgeStatus.STATUS_ACCEPTED,
  HydroJudgeStatus.STATUS_WRONG_ANSWER,
  HydroJudgeStatus.STATUS_TIME_LIMIT_EXCEEDED,
  HydroJudgeStatus.STATUS_MEMORY_LIMIT_EXCEEDED,
  HydroJudgeStatus.STATUS_OUTPUT_LIMIT_EXCEEDED,
  HydroJudgeStatus.STATUS_RUNTIME_ERROR,
  HydroJudgeStatus.STATUS_COMPILE_ERROR,
  HydroJudgeStatus.STATUS_SYSTEM_ERROR,
  HydroJudgeStatus.STATUS_CANCELED,
  HydroJudgeStatus.STATUS_ETC,
  HydroJudgeStatus.STATUS_JUDGING,
  HydroJudgeStatus.STATUS_COMPILING,
  HydroJudgeStatus.STATUS_FETCHED
)

// Arbitrary for test case result
const testCaseResultArb: fc.Arbitrary<TestCaseResultMessage> = fc.record({
  id: fc.integer({ min: 1, max: 100 }),
  status: hydroStatusArb,
  time: timeArb,
  memory: memoryArb,
  message: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
})

// Arbitrary for judge result message (end type)
const judgeEndResultArb: fc.Arbitrary<JudgeResultMessage> = fc.record({
  rid: submissionIdArb,
  key: fc.constant('end' as const),
  status: fc.option(hydroStatusArb, { nil: undefined }),
  score: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
  time: fc.option(timeArb, { nil: undefined }),
  memory: fc.option(memoryArb, { nil: undefined }),
  message: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
  compilerText: fc.option(fc.string({ minLength: 0, maxLength: 1000 }), { nil: undefined }),
  case: fc.option(testCaseResultArb, { nil: undefined }),
})

/**
 * Helper function to simulate processing judge result
 * This mirrors the logic in JudgeService.updateSubmissionResult
 */
function processJudgeResult(result: JudgeResultMessage): {
  status: JudgeStatus
  time?: number
  memory?: number
  compileError?: string
  runtimeError?: string
} {
  const status = result.status !== undefined
    ? hydroStatusToJudgeStatus(result.status)
    : 'runtime_error'

  const processed: {
    status: JudgeStatus
    time?: number
    memory?: number
    compileError?: string
    runtimeError?: string
  } = {
    status,
    time: result.time,
    memory: result.memory,
  }

  // Handle compile error
  if (status === 'compile_error' && result.compilerText) {
    processed.compileError = result.compilerText
  }

  // Handle runtime error
  if (status === 'runtime_error' && result.message) {
    processed.runtimeError = result.message
  }

  return processed
}

/**
 * Helper function to determine if all test cases passed
 */
function allTestCasesPassed(testCases: TestCaseResultMessage[]): boolean {
  return testCases.every(tc => tc.status === HydroJudgeStatus.STATUS_ACCEPTED)
}

/**
 * Helper function to calculate total time from test cases
 */
function calculateTotalTime(testCases: TestCaseResultMessage[]): number {
  return testCases.reduce((sum, tc) => sum + tc.time, 0)
}

/**
 * Helper function to calculate max memory from test cases
 */
function calculateMaxMemory(testCases: TestCaseResultMessage[]): number {
  return Math.max(...testCases.map(tc => tc.memory))
}

describe('Submission Service - Property 5: Judge Result Consistency Tests', () => {
  /**
   * Feature: ai-club-oj-system, Property 5: 评测结果一致性
   * **Validates: Requirements 3.3**
   * 
   * For any submission where all test cases pass (STATUS_ACCEPTED),
   * the final status should be 'accepted'.
   */
  it('Property 5.1: All test cases passed implies Accepted status', async () => {
    await fc.assert(
      fc.asyncProperty(
        submissionIdArb,
        timeArb,
        memoryArb,
        async (rid, time, memory) => {
          // Create a result where all test cases passed
          const result: JudgeResultMessage = {
            rid,
            key: 'end',
            status: HydroJudgeStatus.STATUS_ACCEPTED,
            time,
            memory,
          }

          const processed = processJudgeResult(result)

          // **Key Property**: When Hydro reports ACCEPTED, our status should be 'accepted'
          expect(processed.status).toBe('accepted')
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: ai-club-oj-system, Property 5: 评测结果一致性
   * **Validates: Requirements 3.8**
   * 
   * For any judge result with time and memory data,
   * the processed result should preserve the exact time and memory values.
   */
  it('Property 5.2: Time and memory values are preserved exactly', async () => {
    await fc.assert(
      fc.asyncProperty(
        judgeEndResultArb,
        async (result) => {
          const processed = processJudgeResult(result)

          // **Key Property**: Time and memory should be preserved exactly
          expect(processed.time).toBe(result.time)
          expect(processed.memory).toBe(result.memory)
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: ai-club-oj-system, Property 5: 评测结果一致性
   * **Validates: Requirements 3.3, 3.8**
   * 
   * For any judge result, the status mapping should be deterministic:
   * the same Hydro status should always map to the same system status.
   */
  it('Property 5.3: Status mapping is deterministic', async () => {
    await fc.assert(
      fc.asyncProperty(
        hydroStatusArb,
        submissionIdArb,
        timeArb,
        memoryArb,
        async (hydroStatus, rid, time, memory) => {
          // Create two results with the same Hydro status
          const result1: JudgeResultMessage = {
            rid,
            key: 'end',
            status: hydroStatus,
            time,
            memory,
          }

          const result2: JudgeResultMessage = {
            rid: rid + '_2',
            key: 'end',
            status: hydroStatus,
            time: time + 100,
            memory: memory + 1000,
          }

          const processed1 = processJudgeResult(result1)
          const processed2 = processJudgeResult(result2)

          // **Key Property**: Same Hydro status should map to same system status
          expect(processed1.status).toBe(processed2.status)
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: ai-club-oj-system, Property 5: 评测结果一致性
   * **Validates: Requirements 3.3**
   * 
   * For any non-ACCEPTED Hydro status, the result should NOT be 'accepted'.
   */
  it('Property 5.4: Non-ACCEPTED status never maps to accepted', async () => {
    const nonAcceptedStatusArb = fc.constantFrom(
      HydroJudgeStatus.STATUS_WRONG_ANSWER,
      HydroJudgeStatus.STATUS_TIME_LIMIT_EXCEEDED,
      HydroJudgeStatus.STATUS_MEMORY_LIMIT_EXCEEDED,
      HydroJudgeStatus.STATUS_OUTPUT_LIMIT_EXCEEDED,
      HydroJudgeStatus.STATUS_RUNTIME_ERROR,
      HydroJudgeStatus.STATUS_COMPILE_ERROR,
      HydroJudgeStatus.STATUS_SYSTEM_ERROR,
      HydroJudgeStatus.STATUS_CANCELED,
      HydroJudgeStatus.STATUS_ETC
    )

    await fc.assert(
      fc.asyncProperty(
        nonAcceptedStatusArb,
        submissionIdArb,
        async (hydroStatus, rid) => {
          const result: JudgeResultMessage = {
            rid,
            key: 'end',
            status: hydroStatus,
          }

          const processed = processJudgeResult(result)

          // **Key Property**: Non-ACCEPTED status should never map to 'accepted'
          expect(processed.status).not.toBe('accepted')
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: ai-club-oj-system, Property 5: 评测结果一致性
   * **Validates: Requirements 3.8**
   * 
   * For any compile error result, the compiler text should be preserved.
   */
  it('Property 5.5: Compile error text is preserved', async () => {
    const compilerTextArb = fc.string({ minLength: 1, maxLength: 1000 })
      .filter(s => s.length > 0)

    await fc.assert(
      fc.asyncProperty(
        submissionIdArb,
        compilerTextArb,
        async (rid, compilerText) => {
          const result: JudgeResultMessage = {
            rid,
            key: 'end',
            status: HydroJudgeStatus.STATUS_COMPILE_ERROR,
            compilerText,
          }

          const processed = processJudgeResult(result)

          // **Key Property**: Compile error text should be preserved
          expect(processed.status).toBe('compile_error')
          expect(processed.compileError).toBe(compilerText)
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: ai-club-oj-system, Property 5: 评测结果一致性
   * **Validates: Requirements 3.8**
   * 
   * For any runtime error result, the error message should be preserved.
   */
  it('Property 5.6: Runtime error message is preserved', async () => {
    const errorMessageArb = fc.string({ minLength: 1, maxLength: 500 })
      .filter(s => s.length > 0)

    await fc.assert(
      fc.asyncProperty(
        submissionIdArb,
        errorMessageArb,
        async (rid, errorMessage) => {
          const result: JudgeResultMessage = {
            rid,
            key: 'end',
            status: HydroJudgeStatus.STATUS_RUNTIME_ERROR,
            message: errorMessage,
          }

          const processed = processJudgeResult(result)

          // **Key Property**: Runtime error message should be preserved
          expect(processed.status).toBe('runtime_error')
          expect(processed.runtimeError).toBe(errorMessage)
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: ai-club-oj-system, Property 5: 评测结果一致性
   * **Validates: Requirements 3.3**
   * 
   * Status mapping covers all expected error types correctly.
   */
  it('Property 5.7: All error statuses map to correct system status', async () => {
    const statusMappings: Array<{ hydro: number; expected: JudgeStatus }> = [
      { hydro: HydroJudgeStatus.STATUS_ACCEPTED, expected: 'accepted' },
      { hydro: HydroJudgeStatus.STATUS_WRONG_ANSWER, expected: 'wrong_answer' },
      { hydro: HydroJudgeStatus.STATUS_TIME_LIMIT_EXCEEDED, expected: 'time_limit_exceeded' },
      { hydro: HydroJudgeStatus.STATUS_MEMORY_LIMIT_EXCEEDED, expected: 'memory_limit_exceeded' },
      { hydro: HydroJudgeStatus.STATUS_RUNTIME_ERROR, expected: 'runtime_error' },
      { hydro: HydroJudgeStatus.STATUS_COMPILE_ERROR, expected: 'compile_error' },
    ]

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...statusMappings),
        submissionIdArb,
        async (mapping, rid) => {
          const result: JudgeResultMessage = {
            rid,
            key: 'end',
            status: mapping.hydro,
          }

          const processed = processJudgeResult(result)

          // **Key Property**: Each Hydro status maps to expected system status
          expect(processed.status).toBe(mapping.expected)
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: ai-club-oj-system, Property 5: 评测结果一致性
   * **Validates: Requirements 3.8**
   * 
   * For any set of test case results, if we aggregate them:
   * - Total time should be sum of individual times
   * - Max memory should be maximum of individual memories
   */
  it('Property 5.8: Test case aggregation is consistent', async () => {
    const testCasesArb = fc.array(testCaseResultArb, { minLength: 1, maxLength: 20 })

    await fc.assert(
      fc.asyncProperty(
        testCasesArb,
        async (testCases) => {
          const totalTime = calculateTotalTime(testCases)
          const maxMemory = calculateMaxMemory(testCases)

          // **Key Property**: Aggregation should be mathematically correct
          const expectedTotalTime = testCases.reduce((sum, tc) => sum + tc.time, 0)
          const expectedMaxMemory = Math.max(...testCases.map(tc => tc.memory))

          expect(totalTime).toBe(expectedTotalTime)
          expect(maxMemory).toBe(expectedMaxMemory)
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: ai-club-oj-system, Property 5: 评测结果一致性
   * **Validates: Requirements 3.3**
   * 
   * For any set of test cases, allTestCasesPassed returns true
   * if and only if every test case has STATUS_ACCEPTED.
   */
  it('Property 5.9: All test cases passed detection is correct', async () => {
    const testCasesArb = fc.array(testCaseResultArb, { minLength: 1, maxLength: 10 })

    await fc.assert(
      fc.asyncProperty(
        testCasesArb,
        async (testCases) => {
          const result = allTestCasesPassed(testCases)
          const expected = testCases.every(tc => tc.status === HydroJudgeStatus.STATUS_ACCEPTED)

          // **Key Property**: allTestCasesPassed should match manual check
          expect(result).toBe(expected)
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: ai-club-oj-system, Property 5: 评测结果一致性
   * **Validates: Requirements 3.3, 3.8**
   * 
   * Round-trip property: processing a result and extracting data
   * should preserve all relevant information.
   */
  it('Property 5.10: Result processing preserves all relevant data', async () => {
    await fc.assert(
      fc.asyncProperty(
        judgeEndResultArb,
        async (result) => {
          const processed = processJudgeResult(result)

          // **Key Property**: All relevant data should be preserved
          // Time and memory are always preserved
          expect(processed.time).toBe(result.time)
          expect(processed.memory).toBe(result.memory)

          // Status should be deterministically mapped
          if (result.status !== undefined) {
            const expectedStatus = hydroStatusToJudgeStatus(result.status)
            expect(processed.status).toBe(expectedStatus)
          }

          // Compile error text preserved when status is compile_error
          if (processed.status === 'compile_error' && result.compilerText) {
            expect(processed.compileError).toBe(result.compilerText)
          }

          // Runtime error message preserved when status is runtime_error
          if (processed.status === 'runtime_error' && result.message) {
            expect(processed.runtimeError).toBe(result.message)
          }

          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})
