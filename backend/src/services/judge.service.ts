import { WebSocket, WebSocketServer } from 'ws'
import type { Server } from 'http'
import type { IncomingMessage } from 'http'
import type { Duplex } from 'stream'
import { config } from '../config/index.js'
import { prisma } from '../config/database.js'
import { getRedis } from '../config/redis.js'
import type {
  JudgeConnection,
  JudgeTask,
  JudgeResultMessage,
  JudgeRequest,
  JudgeConfig,
  LanguageConfig,
} from '../types/judge.js'
import {
  hydroStatusToJudgeStatus,
  LanguageMap,
  HydroJudgeStatus,
} from '../types/judge.js'
import type { JudgeStatus } from '../types/index.js'
import { verifySession } from './session.service.js'

// 评测队列 Redis Key
const JUDGE_QUEUE_KEY = 'judge:queue'
const JUDGE_TASK_PREFIX = 'judge:task:'

/**
 * 评测 WebSocket 服务
 * 实现与 Hydro Judge 的通信协议
 */
export class JudgeService {
  private wss: WebSocketServer | null = null
  private connections: Map<string, JudgeConnection> = new Map()
  private taskCallbacks: Map<string, (result: JudgeResultMessage) => void> = new Map()
  private connectionIdCounter = 0

  // 语言配置 (发送给 hydrojudge)
  // 格式参考: https://github.com/hydro-dev/Hydro
  // 注意: key 字段是必需的，HydroJudge 会用它设置 HYDRO_LANG 环境变量
  private languageConfigs: Record<string, LanguageConfig> = {
    c: {
      key: 'c',
      compile: '/usr/bin/gcc -O2 -Wall -std=c99 -o foo foo.c -lm',
      code_file: 'foo.c',
      target: 'foo',
      execute: '/w/foo',
      display: 'C',
    },
    cc: {
      key: 'cc',
      compile: '/usr/bin/g++ -O2 -Wall -std=c++17 -o foo foo.cc -lm',
      code_file: 'foo.cc',
      target: 'foo',
      execute: '/w/foo',
      display: 'C++ 17',
    },
    py3: {
      key: 'py3',
      compile: '/usr/bin/python3 -c "import py_compile; py_compile.compile(\'/w/foo.py\', \'/w/foo\', doraise=True)"',
      code_file: 'foo.py',
      target: 'foo',
      execute: '/usr/bin/python3 /w/foo',
      display: 'Python 3',
    },
    java: {
      key: 'java',
      compile: '/usr/bin/bash -c "javac -d /w -encoding utf8 ./Main.java && jar cvf Main.jar *.class >/dev/null"',
      code_file: 'Main.java',
      target: 'Main.jar',
      execute: '/usr/bin/java -Dfile.encoding=UTF-8 -cp /w/Main.jar Main',
      time_limit_rate: 2,
      compile_time_limit: 30000,
      compile_memory_limit: 1024,
      display: 'Java',
    },
    js: {
      key: 'js',
      execute: '/usr/bin/node /w/foo.js',
      code_file: 'foo.js',
      display: 'Node.js',
    },
    go: {
      key: 'go',
      compile: '/usr/bin/go build -o foo foo.go',
      code_file: 'foo.go',
      target: 'foo',
      execute: '/w/foo',
      display: 'Go',
    },
  }

  /**
   * 初始化 WebSocket 服务器
   */
  initialize(server: Server): void {
    // 使用 noServer 模式，完全控制升级过程
    this.wss = new WebSocketServer({
      noServer: true,
      // 完全禁用 WebSocket 压缩扩展
      perMessageDeflate: false,
      // 跳过 UTF-8 验证以提高性能
      skipUTF8Validation: true,
      // 设置最大负载大小
      maxPayload: 100 * 1024 * 1024, // 100MB
    })

    // 手动处理 HTTP 升级请求
    server.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
      const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname

      if (pathname === '/judge/conn') {
        // 移除客户端请求的压缩扩展，避免 RSV1 错误
        const extensions = request.headers['sec-websocket-extensions']
        if (extensions) {
          console.log('Client requested WebSocket extensions:', extensions)
          // 删除扩展头，强制不使用压缩
          delete request.headers['sec-websocket-extensions']
          console.log('Removed sec-websocket-extensions header to disable compression')
        }

        // 验证客户端
        this.verifyClient(
          { origin: request.headers.origin || '', secure: false, req: request },
          (result, code, message) => {
            if (!result) {
              socket.write(`HTTP/1.1 ${code || 401} ${message || 'Unauthorized'}\r\n\r\n`)
              socket.destroy()
              return
            }

            // 升级连接
            this.wss!.handleUpgrade(request, socket, head, (ws) => {
              this.wss!.emit('connection', ws, request)
            })
          }
        )
      }
      // 其他路径的 WebSocket 升级由其他服务处理
    })

    this.wss.on('connection', this.handleConnection.bind(this))
    this.wss.on('error', (error) => {
      console.error('Judge WebSocket Server error:', error)
    })

    console.log('✅ Judge WebSocket server initialized at /judge/conn')

    // 启动任务分发循环
    this.startTaskDispatcher()
  }

  /**
   * 验证客户端连接 (Bearer Token 或 Session 认证)
   */
  private verifyClient(
    info: { origin: string; secure: boolean; req: IncomingMessage },
    callback: (result: boolean, code?: number, message?: string) => void
  ): void {
    const req = info.req

    // 从 Authorization header 获取 Bearer token
    let bearerToken: string | undefined
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      bearerToken = authHeader.split(' ')[1]
    }

    // 从 cookie 中获取 sid
    let sid: string | undefined
    if (req.headers.cookie) {
      const cookies = this.parseCookies(req.headers.cookie)
      sid = cookies['sid']
    }

    // 方式1: 直接使用 judge secret 验证
    if (bearerToken === config.judge.secret) {
      console.log('Judge authenticated via secret')
      callback(true)
      return
    }

    // 方式2: Bearer token 是 session ID (hydrojudge 从 cookie 提取 sid 作为 Bearer token)
    if (bearerToken && verifySession(bearerToken)) {
      console.log('Judge authenticated via Bearer session token')
      callback(true)
      return
    }

    // 调试: 打印 Bearer token 前缀
    if (bearerToken) {
      console.log('Bearer token prefix:', bearerToken.substring(0, 20) + '...')
    }

    // 方式3: 使用 cookie 中的 session 验证
    if (sid && verifySession(sid)) {
      console.log('Judge authenticated via cookie session')
      callback(true)
      return
    }

    console.warn('Judge connection rejected: invalid token or session', {
      hasBearerToken: !!bearerToken,
      hasSid: !!sid,
    })
    callback(false, 401, 'Unauthorized')
  }

  /**
   * 解析 cookie 字符串
   */
  private parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {}
    cookieHeader.split(';').forEach((cookie) => {
      const [name, ...rest] = cookie.trim().split('=')
      if (name && rest.length > 0) {
        cookies[name] = rest.join('=')
      }
    })
    return cookies
  }

  /**
   * 处理新的 WebSocket 连接
   */
  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const connectionId = `judge-${++this.connectionIdCounter}`
    console.log(`Judge connected: ${connectionId}`)
    console.log(`  - Headers:`, JSON.stringify({
      'sec-websocket-extensions': req.headers['sec-websocket-extensions'],
      'sec-websocket-version': req.headers['sec-websocket-version'],
      'user-agent': req.headers['user-agent'],
    }))

    const connection: JudgeConnection = {
      id: connectionId,
      ws,
      config: { concurrency: 1, langs: [] },
      activeTasks: new Set(),
      lastHeartbeat: Date.now(),
    }

    this.connections.set(connectionId, connection)

    // 发送语言配置
    this.sendLanguageConfig(ws)

    // 设置消息处理
    ws.on('message', (data) => this.handleMessage(connectionId, data))
    ws.on('close', (code, reason) => {
      console.log(`Judge ${connectionId} WebSocket closed: code=${code}, reason=${reason.toString()}`)
      this.handleDisconnect(connectionId)
    })
    ws.on('error', (error) => {
      console.error(`Judge ${connectionId} error:`, error)
    })
    ws.on('pong', () => {
      console.log(`Judge ${connectionId} pong received`)
      connection.lastHeartbeat = Date.now()
    })

    // 启动心跳检测 - 每30秒发送 WebSocket ping 帧
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping() // 使用 WebSocket ping 帧，不是文本消息
      }
    }, 30000)

    ws.on('close', () => clearInterval(pingInterval))
  }

  /**
   * 发送语言配置给评测机
   */
  private sendLanguageConfig(ws: WebSocket): void {
    // Hydro OJ 格式: {"language": {...}}
    const configMessage = {
      language: this.languageConfigs,
    }
    const messageStr = JSON.stringify(configMessage)
    console.log('Sending language config:', messageStr.substring(0, 200) + '...')
    ws.send(messageStr)
    console.log('Sent language config to judge')
  }

  /**
   * 处理来自评测机的消息
   */
  private handleMessage(connectionId: string, data: Buffer | ArrayBuffer | Buffer[]): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    try {
      const rawData = data.toString()
      console.log(`Raw message from ${connectionId}:`, rawData.substring(0, 200))
      
      // 处理 ping/pong
      if (rawData === 'ping') {
        connection.ws.send('pong')
        return
      }
      if (rawData === 'pong') {
        connection.lastHeartbeat = Date.now()
        return
      }

      const message = JSON.parse(rawData)
      console.log(`Parsed message from ${connectionId}:`, message.key || message.type || 'unknown')

      // Hydro OJ 格式: {"key": "config", ...}
      if (message.key === 'config') {
        this.handleJudgeConfig(connectionId, message)
        return
      }

      // Hydro OJ 格式: {"key": "start"}
      if (message.key === 'start') {
        console.log(`Judge ${connectionId} ready to consume tasks`)
        return
      }

      // Hydro OJ 格式: {"key": "status", "info": {...}}
      if (message.key === 'status') {
        console.log(`Judge ${connectionId} status:`, message.info)
        return
      }

      // Hydro OJ 格式: {"key": "next", "rid": "...", ...} - 进度更新
      if (message.key === 'next' && message.rid) {
        this.handleJudgeResult(connectionId, message as JudgeResultMessage)
        return
      }

      // Hydro OJ 格式: {"key": "end", "rid": "...", ...} - 最终结果
      if (message.key === 'end' && message.rid) {
        this.handleJudgeResult(connectionId, { ...message, key: 'end' } as JudgeResultMessage)
        return
      }

      // 旧格式兼容
      if (message.type === 'config') {
        this.handleJudgeConfig(connectionId, message)
        return
      }

      if (message.rid) {
        this.handleJudgeResult(connectionId, message as JudgeResultMessage)
        return
      }

      console.log(`Unknown message from ${connectionId}:`, message)
    } catch (error) {
      console.error(`Failed to parse message from ${connectionId}:`, error, 'Raw:', data.toString().substring(0, 100))
    }
  }

  /**
   * 处理评测机配置
   */
  private handleJudgeConfig(connectionId: string, config: JudgeConfig & { type: string }): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    connection.config = {
      concurrency: config.concurrency || 1,
      langs: config.langs || Object.keys(this.languageConfigs),
    }

    console.log(`Judge ${connectionId} configured:`, connection.config)
  }

  /**
   * 处理评测结果
   */
  private async handleJudgeResult(connectionId: string, result: JudgeResultMessage): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    const { rid, key } = result

    // 调用回调函数
    const callback = this.taskCallbacks.get(rid)
    if (callback) {
      callback(result)
    }

    // 如果是最终结果，更新数据库
    if (key === 'end') {
      connection.activeTasks.delete(rid)
      this.taskCallbacks.delete(rid)
      await this.updateSubmissionResult(rid, result)
    } else if (key === 'next') {
      // 中间状态更新
      await this.updateSubmissionProgress(rid, result)
    }
  }

  /**
   * 更新提交进度 (中间状态)
   */
  private async updateSubmissionProgress(submissionId: string, result: JudgeResultMessage): Promise<void> {
    try {
      const status = result.status !== undefined
        ? hydroStatusToJudgeStatus(result.status)
        : 'judging'

      // 更新状态为 judging
      await prisma.submissions.update({
        where: { id: submissionId },
        data: { status: this.mapStatusToPrisma(status) },
      })

      // 如果有测试用例结果，保存
      if (result.case) {
        await prisma.testCaseResult.create({
          data: {
            submissionId,
            testCaseNum: result.case.id,
            passed: result.case.status === HydroJudgeStatus.STATUS_ACCEPTED,
            time: result.case.time || 0,
            memory: result.case.memory || 0,
          },
        })
      }
    } catch (error) {
      console.error(`Failed to update submission progress ${submissionId}:`, error)
    }
  }

  /**
   * 更新提交最终结果
   */
  private async updateSubmissionResult(submissionId: string, result: JudgeResultMessage): Promise<void> {
    try {
      const status = result.status !== undefined
        ? hydroStatusToJudgeStatus(result.status)
        : 'runtime_error'

      const updateData: {
        status: 'PENDING' | 'JUDGING' | 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILE_ERROR'
        time?: number
        memory?: number
        compileError?: string
        runtimeError?: string
      } = {
        status: this.mapStatusToPrisma(status),
        time: result.time,
        memory: result.memory,
      }

      // 处理编译错误
      if (status === 'compile_error' && result.compilerText) {
        updateData.compileError = result.compilerText
      }

      // 处理运行时错误
      if (status === 'runtime_error' && result.message) {
        updateData.runtimeError = result.message
      }

      await prisma.submissions.update({
        where: { id: submissionId },
        data: updateData,
      })

      // 如果通过，更新题目和用户统计
      if (status === 'accepted') {
        await this.updateStatisticsOnAccepted(submissionId)
      }

      // 更新题目提交计数
      const submission = await prisma.submissions.findUnique({
        where: { id: submissionId },
        select: { problemId: true },
      })

      if (submission) {
        await prisma.problems.update({
          where: { id: submission.problemId },
          data: {
            submissionCount: { increment: 1 },
            ...(status === 'accepted' ? { acceptedCount: { increment: 1 } } : {}),
          },
        })
      }

      console.log(`Submission ${submissionId} completed with status: ${status}`)
    } catch (error) {
      console.error(`Failed to update submission result ${submissionId}:`, error)
    }
  }

  /**
   * 将系统状态映射到 Prisma 枚举
   */
  private mapStatusToPrisma(status: JudgeStatus): 'PENDING' | 'JUDGING' | 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILE_ERROR' {
    const map: Record<JudgeStatus, 'PENDING' | 'JUDGING' | 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILE_ERROR'> = {
      pending: 'PENDING',
      judging: 'JUDGING',
      accepted: 'ACCEPTED',
      wrong_answer: 'WRONG_ANSWER',
      time_limit_exceeded: 'TIME_LIMIT_EXCEEDED',
      memory_limit_exceeded: 'MEMORY_LIMIT_EXCEEDED',
      runtime_error: 'RUNTIME_ERROR',
      compile_error: 'COMPILE_ERROR',
    }
    return map[status]
  }

  /**
   * 更新通过后的统计数据
   */
  private async updateStatisticsOnAccepted(submissionId: string): Promise<void> {
    const submission = await prisma.submissions.findUnique({
      where: { id: submissionId },
      include: { problem: true },
    })

    if (!submission) return

    // 检查用户是否首次通过该题
    const previousAccepted = await prisma.submissions.findFirst({
      where: {
        userId: submission.userId,
        problemId: submission.problemId,
        status: 'ACCEPTED',
        id: { not: submissionId },
      },
    })

    if (!previousAccepted) {
      // 首次通过，更新用户统计
      const scoreMap = { EASY: 1, MEDIUM: 2, HARD: 3 }
      const score = scoreMap[submission.problem.difficulty] || 1

      await prisma.users.update({
        where: { id: submission.userId },
        data: {
          solvedCount: { increment: 1 },
          score: { increment: score },
        },
      })
    }
  }

  /**
   * 处理评测机断开连接
   */
  private handleDisconnect(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    console.log(`Judge disconnected: ${connectionId}`)

    // 将未完成的任务重新加入队列
    for (const taskId of connection.activeTasks) {
      this.requeueTask(taskId)
    }

    this.connections.delete(connectionId)
  }

  /**
   * 将任务重新加入队列
   */
  private async requeueTask(submissionId: string): Promise<void> {
    try {
      const redis = getRedis()
      const taskData = await redis.get(`${JUDGE_TASK_PREFIX}${submissionId}`)
      if (taskData) {
        await redis.lpush(JUDGE_QUEUE_KEY, submissionId)
        console.log(`Task ${submissionId} requeued`)
      }
    } catch (error) {
      console.error(`Failed to requeue task ${submissionId}:`, error)
    }
  }

  /**
   * 启动任务分发循环
   */
  private startTaskDispatcher(): void {
    setInterval(async () => {
      await this.dispatchTasks()
    }, 1000) // 每秒检查一次
  }

  /**
   * 分发任务给空闲的评测机
   */
  private async dispatchTasks(): Promise<void> {
    const redis = getRedis()

    for (const [connectionId, connection] of this.connections) {
      // 检查评测机是否有空闲槽位
      const availableSlots = connection.config.concurrency - connection.activeTasks.size
      if (availableSlots <= 0) continue

      // 检查 WebSocket 连接状态
      if (connection.ws.readyState !== WebSocket.OPEN) continue

      // 从队列获取任务
      for (let i = 0; i < availableSlots; i++) {
        const submissionId = await redis.rpop(JUDGE_QUEUE_KEY)
        if (!submissionId) break

        const taskData = await redis.get(`${JUDGE_TASK_PREFIX}${submissionId}`)
        if (!taskData) continue

        try {
          const task: JudgeTask = JSON.parse(taskData)
          await this.sendTaskToJudge(connectionId, task)
        } catch (error) {
          console.error(`Failed to dispatch task ${submissionId}:`, error)
          // 重新加入队列
          await redis.lpush(JUDGE_QUEUE_KEY, submissionId)
        }
      }
    }
  }

  /**
   * 发送任务给评测机
   */
  private async sendTaskToJudge(connectionId: string, task: JudgeTask): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      throw new Error(`Judge ${connectionId} not available`)
    }

    // 生成测试数据文件的元信息
    // hydrojudge 会根据这些信息通过 /judge/files 接口下载测试数据
    const dataFiles = task.testCases.flatMap((tc, index) => {
      const inputContent = tc.input
      const outputContent = tc.expectedOutput
      return [
        {
          name: `${index + 1}.in`,
          size: Buffer.byteLength(inputContent, 'utf8'),
          etag: this.generateEtag(inputContent),
        },
        {
          name: `${index + 1}.out`,
          size: Buffer.byteLength(outputContent, 'utf8'),
          etag: this.generateEtag(outputContent),
        },
      ]
    })

    // Hydro Judge 完整格式
    // 注意: pid 使用 problemNumber (数字) 而不是 problemId (CUID 字符串)
    // 因为 HydroJudge 会用 +pid 转换为数字
    const judgeRequest: JudgeRequest = {
      rid: task.submissionId,
      domainId: 'default',
      pid: String(task.problemNumber), // 使用数字编号
      uid: 1, // 用户 ID (简化处理)
      lang: LanguageMap[task.language],
      code: task.code,
      type: 'judge',
      priority: 0,
      config: {
        time: task.timeLimit,
        memory: task.memoryLimit,
        cases: task.testCases.map((_, index) => ({
          input: `${index + 1}.in`,
          output: `${index + 1}.out`,
        })),
      },
      data: dataFiles,
      source: `default/${task.problemNumber}`, // 使用数字编号
      meta: {
        problemOwner: 1,
      },
      trusted: true,
    }

    // 包装在 task 字段中发送 (Hydro OJ 协议要求)
    const message = { task: judgeRequest }
    const requestStr = JSON.stringify(message)
    console.log(`Sending judge request:`, requestStr.substring(0, 500))
    connection.ws.send(requestStr)
    connection.activeTasks.add(task.submissionId)

    console.log(`Task ${task.submissionId} sent to judge ${connectionId}`)
  }

  /**
   * 生成简单的 ETag (基于内容的哈希)
   */
  private generateEtag(content: string): string {
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * 提交评测任务
   */
  async submitTask(task: JudgeTask): Promise<void> {
    const redis = getRedis()

    // 保存任务数据
    await redis.set(
      `${JUDGE_TASK_PREFIX}${task.submissionId}`,
      JSON.stringify(task),
      'EX',
      3600 // 1小时过期
    )

    // 加入队列
    await redis.lpush(JUDGE_QUEUE_KEY, task.submissionId)

    console.log(`Task ${task.submissionId} queued`)
  }

  /**
   * 注册结果回调
   */
  onResult(submissionId: string, callback: (result: JudgeResultMessage) => void): void {
    this.taskCallbacks.set(submissionId, callback)
  }

  /**
   * 获取评测机状态
   */
  getStatus(): {
    connections: number
    activeConnections: number
    totalActiveTasks: number
    judges: Array<{
      id: string
      concurrency: number
      activeTasks: number
      langs: string[]
    }>
  } {
    const judges = Array.from(this.connections.values()).map((conn) => ({
      id: conn.id,
      concurrency: conn.config.concurrency,
      activeTasks: conn.activeTasks.size,
      langs: conn.config.langs,
    }))

    return {
      connections: this.connections.size,
      activeConnections: judges.filter((j) => j.activeTasks < j.concurrency).length,
      totalActiveTasks: judges.reduce((sum, j) => sum + j.activeTasks, 0),
      judges,
    }
  }

  /**
   * 获取队列长度
   */
  async getQueueLength(): Promise<number> {
    const redis = getRedis()
    return redis.llen(JUDGE_QUEUE_KEY)
  }

  /**
   * 关闭服务
   */
  close(): void {
    if (this.wss) {
      this.wss.close()
      this.wss = null
    }
    this.connections.clear()
    this.taskCallbacks.clear()
  }
}

// 单例导出
export const judgeService = new JudgeService()
