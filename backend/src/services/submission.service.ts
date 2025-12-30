import { prisma } from '../config/database.js'
import { judgeService } from './judge.service.js'
import type { JudgeTask } from '../types/judge.js'
import type { SupportedLanguage } from '../types/index.js'
import { AppError } from '../types/index.js'

/**
 * 代码提交输入
 */
export interface SubmitCodeInput {
  problemId: string
  code: string
  language: SupportedLanguage
}

/**
 * 提交列表查询参数
 */
export interface SubmissionListQuery {
  userId?: string
  problemId?: string
  status?: string
  page?: number
  limit?: number
}

/**
 * 提交详情
 */
export interface SubmissionDetail {
  id: string
  problemId: string
  problemNumber: number
  problemTitle: string
  userId: string
  username: string
  code: string
  language: string
  status: string
  time: number | null
  memory: number | null
  compileError: string | null
  runtimeError: string | null
  createdAt: Date
  testCaseResults: Array<{
    testCaseNum: number
    passed: boolean
    time: number
    memory: number
  }>
}

/**
 * 提交列表项
 */
export interface SubmissionListItem {
  id: string
  problemId: string
  problemNumber: number
  problemTitle: string
  userId: string
  username: string
  language: string
  status: string
  time: number | null
  memory: number | null
  createdAt: Date
}

/**
 * 语言映射 - 前端语言到 Prisma 枚举
 */
const languageToPrisma: Record<SupportedLanguage, 'CPP' | 'PYTHON' | 'JAVA' | 'JAVASCRIPT' | 'GO'> = {
  cpp: 'CPP',
  python: 'PYTHON',
  java: 'JAVA',
  javascript: 'JAVASCRIPT',
  go: 'GO',
}

/**
 * Prisma 枚举到前端语言
 */
const prismaToLanguage: Record<string, SupportedLanguage> = {
  CPP: 'cpp',
  PYTHON: 'python',
  JAVA: 'java',
  JAVASCRIPT: 'javascript',
  GO: 'go',
}

/**
 * 提交服务
 */
export class SubmissionService {
  /**
   * 提交代码
   */
  async submitCode(input: SubmitCodeInput, userId: string): Promise<{ submissionId: string }> {
    const { problemId, code, language } = input

    // 验证题目存在
    const problem = await prisma.problems.findUnique({
      where: { id: problemId },
      include: {
        testCases: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!problem) {
      throw new AppError(404, 'Problem not found', 'NOT_FOUND')
    }

    // 验证代码长度
    if (code.length > 65536) {
      throw new AppError(400, 'Code too long (max 64KB)', 'JUDGE_002')
    }

    // 验证语言
    if (!languageToPrisma[language]) {
      throw new AppError(400, 'Unsupported language', 'JUDGE_001')
    }

    // 创建提交记录
    const submission = await prisma.submission.create({
      data: {
        problemId,
        userId,
        code,
        language: languageToPrisma[language],
        status: 'PENDING',
      },
    })

    // 更新用户提交计数
    await prisma.user.update({
      where: { id: userId },
      data: {
        submissionCount: { increment: 1 },
      },
    })

    // 创建评测任务
    const judgeTask: JudgeTask = {
      submissionId: submission.id,
      problemId: problem.id,
      problemNumber: problem.number,
      code,
      language,
      timeLimit: problem.timeLimit,
      memoryLimit: problem.memoryLimit,
      testCases: problem.testCases.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
      })),
      createdAt: new Date(),
    }

    // 提交到评测队列
    await judgeService.submitTask(judgeTask)

    return { submissionId: submission.id }
  }

  /**
   * 获取提交详情
   */
  async getSubmission(submissionId: string, userId?: string): Promise<SubmissionDetail> {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        problem: {
          select: {
            id: true,
            number: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        testCaseResults: {
          orderBy: { testCaseNum: 'asc' },
        },
      },
    })

    if (!submission) {
      throw new AppError(404, 'Submission not found', 'NOT_FOUND')
    }

    // 只有提交者本人或管理员可以查看代码
    // 这里简化处理，允许查看自己的提交
    const canViewCode = !userId || submission.userId === userId

    return {
      id: submission.id,
      problemId: submission.problem.id,
      problemNumber: submission.problem.number,
      problemTitle: submission.problem.title,
      userId: submission.user.id,
      username: submission.user.username,
      code: canViewCode ? submission.code : '[Hidden]',
      language: prismaToLanguage[submission.language] || 'cpp',
      status: submission.status.toLowerCase(),
      time: submission.time,
      memory: submission.memory,
      compileError: submission.compileError,
      runtimeError: submission.runtimeError,
      createdAt: submission.createdAt,
      testCaseResults: submission.testCaseResults.map((tc) => ({
        testCaseNum: tc.testCaseNum,
        passed: tc.passed,
        time: tc.time,
        memory: tc.memory,
      })),
    }
  }

  /**
   * 获取提交列表
   */
  async getSubmissions(query: SubmissionListQuery): Promise<{
    submissions: SubmissionListItem[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    const { userId, problemId, status, page = 1, limit = 20 } = query

    const where: {
      userId?: string
      problemId?: string
      status?: 'PENDING' | 'JUDGING' | 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILE_ERROR'
    } = {}

    if (userId) where.userId = userId
    if (problemId) where.problemId = problemId
    if (status) {
      where.status = status.toUpperCase() as typeof where.status
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          problem: {
            select: {
              id: true,
              number: true,
              title: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.submission.count({ where }),
    ])

    return {
      submissions: submissions.map((s) => ({
        id: s.id,
        problemId: s.problem.id,
        problemNumber: s.problem.number,
        problemTitle: s.problem.title,
        userId: s.user.id,
        username: s.user.username,
        language: prismaToLanguage[s.language] || 'cpp',
        status: s.status.toLowerCase(),
        time: s.time,
        memory: s.memory,
        createdAt: s.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * 获取用户在某题目的最佳提交
   */
  async getBestSubmission(userId: string, problemId: string): Promise<SubmissionListItem | null> {
    const submission = await prisma.submission.findFirst({
      where: {
        userId,
        problemId,
        status: 'ACCEPTED',
      },
      include: {
        problem: {
          select: {
            id: true,
            number: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: [
        { time: 'asc' },
        { memory: 'asc' },
      ],
    })

    if (!submission) return null

    return {
      id: submission.id,
      problemId: submission.problem.id,
      problemNumber: submission.problem.number,
      problemTitle: submission.problem.title,
      userId: submission.user.id,
      username: submission.user.username,
      language: prismaToLanguage[submission.language] || 'cpp',
      status: submission.status.toLowerCase(),
      time: submission.time,
      memory: submission.memory,
      createdAt: submission.createdAt,
    }
  }

  /**
   * 检查用户是否已通过某题目
   */
  async hasUserSolvedProblem(userId: string, problemId: string): Promise<boolean> {
    const count = await prisma.submission.count({
      where: {
        userId,
        problemId,
        status: 'ACCEPTED',
      },
    })
    return count > 0
  }
}

// 单例导出
export const submissionService = new SubmissionService()
