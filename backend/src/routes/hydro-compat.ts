import { Router, Request, Response } from 'express'
import cookieParser from 'cookie-parser'
import crypto from 'crypto'
import { config } from '../config/index.js'
import { prisma } from '../config/database.js'
import { createSession, verifySession } from '../services/session.service.js'

const router = Router()

// Cookie parser for session handling
router.use(cookieParser())

// 用于签名下载链接的密钥
const STORAGE_SECRET = config.jwtSecret || 'storage-secret'

/**
 * 生成签名的下载链接
 * @param target 文件路径
 * @param filename 文件名
 * @param expireMs 过期时间(毫秒)
 */
function signDownloadLink(target: string, filename: string, expireMs: number = 30 * 60 * 1000): string {
  const expire = Date.now() + expireMs
  const secret = crypto
    .createHash('md5')
    .update(`${target}:${expire}:${STORAGE_SECRET}`)
    .digest('hex')
  
  const params = new URLSearchParams({
    target,
    filename,
    expire: expire.toString(),
    secret,
  })
  
  // 返回完整的 HTTP URL
  const baseUrl = process.env.JUDGE_SERVER_URL || `http://localhost:${config.port}`
  return `${baseUrl}/storage?${params.toString()}`
}

/**
 * 验证签名的下载链接
 */
function isLinkValid(target: string, expire: string, secret: string): boolean {
  const expireTime = parseInt(expire, 10)
  if (Date.now() > expireTime) {
    return false
  }
  
  const expectedSecret = crypto
    .createHash('md5')
    .update(`${target}:${expire}:${STORAGE_SECRET}`)
    .digest('hex')
  
  return secret === expectedSecret
}

/**
 * Hydro OJ 兼容层
 * 实现 hydrojudge 需要的 HTTP API 端点
 */

/**
 * POST /login
 * 评测机登录认证
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { uname, password } = req.body

    // 验证评测机凭据
    if (uname === 'judge' && password === config.judge.secret) {
      // 生成 session ID
      const sid = createSession(uname)

      // 设置 cookie
      res.cookie('sid', sid, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax',
      })

      console.log(`✅ Judge authenticated: ${uname}`)
      res.json({ url: '/' })
    } else {
      console.warn(`❌ Judge authentication failed: ${uname}`)
      res.status(401).json({ error: 'Invalid credentials' })
    }
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * 验证 session 中间件
 * 支持 Cookie session 和 Bearer token 两种认证方式
 */
function verifySessionMiddleware(req: Request, res: Response, next: () => void) {
  // 方式1: 从 Authorization header 获取 Bearer token
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    if (verifySession(token)) {
      console.log('Judge files request authenticated via Bearer token')
      return next()
    }
  }

  // 方式2: 从 cookie 中获取 sid
  const sid = req.cookies?.sid
  if (sid && verifySession(sid)) {
    console.log('Judge files request authenticated via cookie session')
    return next()
  }

  // 认证失败
  console.warn('Judge files request authentication failed')
  return res.status(401).json({ error: 'Unauthorized' })
}

/**
 * POST /judge/files
 * 下载文件 (提交代码或测试数据)
 * 
 * 请求格式:
 * - { id: string } - 下载提交代码
 * - { pid: number, files: string[] } - 下载测试数据
 */
router.post('/judge/files', verifySessionMiddleware, async (req: Request, res: Response) => {
  await handleJudgeFiles(req, res)
})

/**
 * POST /d/:domainId/judge/files
 * Hydro OJ 格式的文件下载端点 (带域名前缀)
 */
router.post('/d/:domainId/judge/files', verifySessionMiddleware, async (req: Request, res: Response) => {
  await handleJudgeFiles(req, res)
})

/**
 * 处理文件下载请求
 */
async function handleJudgeFiles(req: Request, res: Response) {
  try {
    const { id, pid, files } = req.body
    
    console.log('Judge files request:', { id, pid, pidType: typeof pid, files })

    // 下载提交代码
    if (id) {
      const submission = await prisma.submissions.findUnique({
        where: { id },
        select: { code: true },
      })

      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' })
      }

      // 生成签名的下载链接
      const target = `submission/${id}`
      const url = signDownloadLink(target, `${id}.code`)
      
      console.log(`Generated submission code download URL: ${url}`)
      return res.json({ url })
    }

    // 下载测试数据
    if (pid !== undefined && files) {
      // pid 是 problem number (数字)
      const problemNumber = Number(pid)
      
      console.log(`Looking up problem by number: ${problemNumber}`)
      
      if (isNaN(problemNumber)) {
        console.warn(`Invalid pid (not a number): ${pid}`)
        return res.json({ links: null })
      }

      // 先通过 number 查找 problem，获取其 id
      const problem = await prisma.problems.findFirst({
        where: { number: problemNumber },
        select: { id: true },
      })

      if (!problem) {
        console.warn(`Problem not found with number: ${problemNumber}`)
        return res.json({ links: null })
      }

      // 查询测试用例 (从 test_cases 表)
      const testCases = await prisma.testCase.findMany({
        where: { problemId: problem.id },
        orderBy: { order: 'asc' },
        select: { input: true, expectedOutput: true, order: true },
      })

      console.log(`Found ${testCases.length} test cases for problem number ${problemNumber} (id: ${problem.id})`)

      if (testCases.length === 0) {
        console.warn(`No test cases found for problem number ${problemNumber}`)
        return res.json({ links: null })
      }

      // 生成测试数据文件的签名下载链接
      const links: Record<string, string> = {}

      for (const filename of files) {
        // 解析文件名 (如 "1.in", "1.out")
        const match = filename.match(/^(\d+)\.(in|out)$/)
        if (match) {
          const caseIndex = parseInt(match[1], 10) - 1
          
          if (caseIndex >= 0 && caseIndex < testCases.length) {
            // 生成签名的 HTTP 下载链接
            const target = `testdata/${problem.id}/${filename}`
            links[filename] = signDownloadLink(target, filename)
          }
        }
      }

      console.log(`Generated ${Object.keys(links).length} signed file links`)
      return res.json({ links })
    }

    res.status(400).json({ error: 'Invalid request' })
  } catch (error) {
    console.error('Judge files error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * POST /judge/upload
 * 上传评测结果文件
 */
router.post('/judge/upload', verifySessionMiddleware, async (_req: Request, res: Response) => {
  try {
    // hydrojudge 可能上传一些结果文件，我们暂时忽略
    res.json({ ok: 1 })
  } catch (error) {
    console.error('Judge upload error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /judge/files
 * 检查认证状态 (hydrojudge 用于验证 session)
 */
router.get('/judge/files', verifySessionMiddleware, (_req: Request, res: Response) => {
  res.json({ ok: 1 })
})

/**
 * GET /storage
 * 文件下载端点 - HydroJudge 通过签名 URL 下载文件
 * 
 * 查询参数:
 * - target: 文件路径 (如 "testdata/problemId/1.in" 或 "submission/submissionId")
 * - filename: 文件名
 * - expire: 过期时间戳
 * - secret: 签名
 */
router.get('/storage', async (req: Request, res: Response) => {
  try {
    const { target, filename, expire, secret } = req.query as Record<string, string>
    
    console.log('Storage download request:', { target, filename, expire })
    
    // 验证参数
    if (!target || !expire || !secret) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }
    
    // 验证签名
    if (!isLinkValid(target, expire, secret)) {
      console.warn('Invalid or expired download link:', { target, expire })
      return res.status(403).json({ error: 'Invalid or expired link' })
    }
    
    // 解析 target 路径
    const parts = target.split('/')
    
    // 处理测试数据下载: testdata/{problemId}/{filename}
    if (parts[0] === 'testdata' && parts.length === 3) {
      const problemId = parts[1]
      const testFilename = parts[2]
      
      // 解析文件名 (如 "1.in", "1.out")
      const match = testFilename.match(/^(\d+)\.(in|out)$/)
      if (!match) {
        return res.status(400).json({ error: 'Invalid test file name' })
      }
      
      const caseIndex = parseInt(match[1], 10) - 1
      const isInput = match[2] === 'in'
      
      // 查询测试用例
      const testCases = await prisma.testCase.findMany({
        where: { problemId },
        orderBy: { order: 'asc' },
        select: { input: true, expectedOutput: true },
      })
      
      if (caseIndex < 0 || caseIndex >= testCases.length) {
        return res.status(404).json({ error: 'Test case not found' })
      }
      
      const content = isInput 
        ? testCases[caseIndex].input 
        : testCases[caseIndex].expectedOutput
      
      // 设置响应头
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="${filename || testFilename}"`)
      res.setHeader('Content-Length', Buffer.byteLength(content, 'utf-8'))
      
      console.log(`Serving test file: ${testFilename} (${Buffer.byteLength(content, 'utf-8')} bytes)`)
      return res.send(content)
    }
    
    // 处理提交代码下载: submission/{submissionId}
    if (parts[0] === 'submission' && parts.length === 2) {
      const submissionId = parts[1]
      
      const submission = await prisma.submissions.findUnique({
        where: { id: submissionId },
        select: { code: true },
      })
      
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' })
      }
      
      // 设置响应头
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="${filename || 'code.txt'}"`)
      res.setHeader('Content-Length', Buffer.byteLength(submission.code, 'utf-8'))
      
      console.log(`Serving submission code: ${submissionId} (${Buffer.byteLength(submission.code, 'utf-8')} bytes)`)
      return res.send(submission.code)
    }
    
    return res.status(404).json({ error: 'File not found' })
  } catch (error) {
    console.error('Storage download error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
