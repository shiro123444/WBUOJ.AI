import type { Request, Response, NextFunction } from 'express'
import { promises as fs } from 'fs'
import path from 'path'
import { config } from '../config/index.js'
import { getRedis } from '../config/redis.js'
import { prisma } from '../config/database.js'
import { AppError } from '../types/index.js'

// 缓存 Key 前缀
const TEST_DATA_CACHE_PREFIX = 'judge:testdata:'
const CACHE_TTL = 3600 // 1小时缓存

/**
 * 验证评测机认证
 */
function verifyJudgeAuth(req: Request): boolean {
  // 从 Authorization header 获取 token
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    if (token === config.judge.secret) {
      return true
    }
  }

  // 从 cookie 获取 sid
  const cookies = req.headers.cookie
  if (cookies) {
    const sidMatch = cookies.match(/sid=([^;]+)/)
    if (sidMatch && sidMatch[1] === config.judge.secret) {
      return true
    }
  }

  return false
}

/**
 * GET /judge/files
 * 下载测试数据文件
 * 
 * Query params:
 * - pid: 题目 ID
 * - filename: 文件名 (可选，不提供则返回所有文件列表)
 */
export async function getTestDataFiles(req: Request, res: Response, next: NextFunction) {
  try {
    // 验证评测机认证
    if (!verifyJudgeAuth(req)) {
      throw new AppError(401, 'Unauthorized', 'JUDGE_AUTH_FAILED')
    }

    const { pid, filename } = req.query

    if (!pid || typeof pid !== 'string') {
      throw new AppError(400, 'Problem ID is required', 'JUDGE_001')
    }

    // 验证题目存在
    const problem = await prisma.problems.findUnique({
      where: { id: pid },
      select: { id: true, number: true },
    })

    if (!problem) {
      throw new AppError(404, 'Problem not found', 'NOT_FOUND')
    }

    // 构建测试数据目录路径
    const testDataDir = path.join(config.judge.testDataPath, pid)

    // 如果没有指定文件名，返回文件列表
    if (!filename || typeof filename !== 'string') {
      const files = await getTestDataFileList(pid, testDataDir)
      return res.json({
        success: true,
        data: { files },
      })
    }

    // 获取指定文件内容
    const fileContent = await getTestDataFile(pid, filename, testDataDir)
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(fileContent)
  } catch (error) {
    next(error)
  }
}

/**
 * 获取测试数据文件列表
 */
async function getTestDataFileList(problemId: string, testDataDir: string): Promise<string[]> {
  const redis = getRedis()
  const cacheKey = `${TEST_DATA_CACHE_PREFIX}${problemId}:list`

  // 尝试从缓存获取
  const cached = await redis.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }

  // 检查目录是否存在
  try {
    await fs.access(testDataDir)
  } catch {
    // 目录不存在，从数据库生成测试数据
    await generateTestDataFromDB(problemId, testDataDir)
  }

  // 读取目录文件列表
  const files = await fs.readdir(testDataDir)
  
  // 缓存文件列表
  await redis.set(cacheKey, JSON.stringify(files), 'EX', CACHE_TTL)

  return files
}

/**
 * 获取测试数据文件内容
 */
async function getTestDataFile(problemId: string, filename: string, testDataDir: string): Promise<Buffer> {
  const redis = getRedis()
  const cacheKey = `${TEST_DATA_CACHE_PREFIX}${problemId}:${filename}`

  // 安全检查：防止路径遍历攻击
  const safeName = path.basename(filename)
  if (safeName !== filename) {
    throw new AppError(400, 'Invalid filename', 'JUDGE_002')
  }

  // 尝试从缓存获取
  const cached = await redis.getBuffer(cacheKey)
  if (cached) {
    return cached
  }

  // 检查目录是否存在
  try {
    await fs.access(testDataDir)
  } catch {
    // 目录不存在，从数据库生成测试数据
    await generateTestDataFromDB(problemId, testDataDir)
  }

  // 读取文件
  const filePath = path.join(testDataDir, safeName)
  
  try {
    const content = await fs.readFile(filePath)
    
    // 缓存文件内容 (只缓存小于 1MB 的文件)
    if (content.length < 1024 * 1024) {
      await redis.set(cacheKey, content, 'EX', CACHE_TTL)
    }

    return content
  } catch (error) {
    throw new AppError(404, `File not found: ${filename}`, 'NOT_FOUND')
  }
}

/**
 * 从数据库生成测试数据文件
 */
async function generateTestDataFromDB(problemId: string, testDataDir: string): Promise<void> {
  // 获取题目和测试用例
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

  // 创建目录
  await fs.mkdir(testDataDir, { recursive: true })

  // 生成测试用例文件
  const cases: Array<{ input: string; output: string; score: number }> = []

  for (let i = 0; i < problem.testCases.length; i++) {
    const tc = problem.testCases[i]
    const inputFile = `${i + 1}.in`
    const outputFile = `${i + 1}.out`

    // 写入输入文件
    await fs.writeFile(path.join(testDataDir, inputFile), tc.input)
    // 写入输出文件
    await fs.writeFile(path.join(testDataDir, outputFile), tc.expectedOutput)

    cases.push({
      input: inputFile,
      output: outputFile,
      score: Math.floor(100 / problem.testCases.length),
    })
  }

  // 生成 config.yaml
  const configContent = generateConfigYaml(problem.timeLimit, problem.memoryLimit, cases)
  await fs.writeFile(path.join(testDataDir, 'config.yaml'), configContent)
}

/**
 * 生成 Hydro Judge 配置文件
 */
function generateConfigYaml(
  timeLimit: number,
  memoryLimit: number,
  cases: Array<{ input: string; output: string; score: number }>
): string {
  const lines = [
    '# Auto-generated Hydro Judge config',
    'type: default',
    `time: ${timeLimit}ms`,
    `memory: ${memoryLimit}m`,
    'cases:',
  ]

  for (const c of cases) {
    lines.push(`  - input: ${c.input}`)
    lines.push(`    output: ${c.output}`)
    lines.push(`    score: ${c.score}`)
  }

  return lines.join('\n')
}

/**
 * POST /judge/upload
 * 上传评测结果文件
 * 
 * Body:
 * - rid: 提交 ID
 * - type: 文件类型 (stdout, stderr, etc.)
 * - content: 文件内容 (base64 编码)
 */
export async function uploadJudgeResult(req: Request, res: Response, next: NextFunction) {
  try {
    // 验证评测机认证
    if (!verifyJudgeAuth(req)) {
      throw new AppError(401, 'Unauthorized', 'JUDGE_AUTH_FAILED')
    }

    const { rid, type, content } = req.body

    if (!rid || typeof rid !== 'string') {
      throw new AppError(400, 'Submission ID (rid) is required', 'JUDGE_003')
    }

    if (!type || typeof type !== 'string') {
      throw new AppError(400, 'File type is required', 'JUDGE_004')
    }

    // 验证提交存在
    const submission = await prisma.submissions.findUnique({
      where: { id: rid },
      select: { id: true },
    })

    if (!submission) {
      throw new AppError(404, 'Submission not found', 'NOT_FOUND')
    }

    // 存储结果文件
    const redis = getRedis()
    const resultKey = `judge:result:${rid}:${type}`

    if (content) {
      // 解码 base64 内容
      const decodedContent = Buffer.from(content, 'base64')
      await redis.set(resultKey, decodedContent, 'EX', 3600) // 1小时过期
    }

    res.json({
      success: true,
      message: 'Result uploaded successfully',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 清除题目测试数据缓存
 */
export async function clearTestDataCache(problemId: string): Promise<void> {
  const redis = getRedis()
  
  // 获取所有相关缓存 key
  const pattern = `${TEST_DATA_CACHE_PREFIX}${problemId}:*`
  const keys = await redis.keys(pattern)
  
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}

/**
 * DELETE /judge/cache/:problemId
 * 清除题目测试数据缓存 (管理员)
 */
export async function clearCache(req: Request, res: Response, next: NextFunction) {
  try {
    const { problemId } = req.params

    if (!problemId) {
      throw new AppError(400, 'Problem ID is required', 'JUDGE_005')
    }

    await clearTestDataCache(problemId)

    res.json({
      success: true,
      message: 'Cache cleared successfully',
    })
  } catch (error) {
    next(error)
  }
}
