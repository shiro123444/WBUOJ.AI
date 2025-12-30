import { WebSocket, WebSocketServer } from 'ws'
import type { Server } from 'http'
import type { IncomingMessage } from 'http'
import type { Duplex } from 'stream'
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { judgeService } from './judge.service.js'
import type { JudgeResultMessage } from '../types/judge.js'
import { hydroStatusToJudgeStatus } from '../types/judge.js'

/**
 * 前端 WebSocket 连接信息
 */
interface ClientConnection {
  ws: WebSocket
  userId: string
  subscribedSubmissions: Set<string>
}

/**
 * 提交状态更新消息
 */
interface SubmissionStatusMessage {
  type: 'status'
  submissionId: string
  status: string
  time?: number
  memory?: number
  message?: string
  compilerText?: string
  testCase?: {
    id: number
    status: string
    passed: boolean
    time: number
    memory: number
  }
}

/**
 * 前端 WebSocket 服务
 * 用于向前端推送提交状态更新
 */
export class SubmissionWebSocketService {
  private wss: WebSocketServer | null = null
  private connections: Map<string, ClientConnection> = new Map()
  private submissionSubscribers: Map<string, Set<string>> = new Map() // submissionId -> connectionIds
  private connectionIdCounter = 0

  /**
   * 初始化 WebSocket 服务器
   */
  initialize(server: Server): void {
    // 使用 noServer 模式，与 judge.service.ts 保持一致
    this.wss = new WebSocketServer({
      noServer: true,
    })

    // 手动处理 HTTP 升级请求
    server.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
      const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname

      if (pathname === '/ws/submissions') {
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
      console.error('Submission WebSocket Server error:', error)
    })

    console.log('✅ Submission WebSocket server initialized at /ws/submissions')
  }

  /**
   * 验证客户端连接 (JWT 认证)
   */
  private verifyClient(
    info: { origin: string; secure: boolean; req: IncomingMessage },
    callback: (result: boolean, code?: number, message?: string) => void
  ): void {
    const req = info.req
    const url = new URL(req.url || '', `http://${req.headers.host}`)
    const token = url.searchParams.get('token')

    if (!token) {
      callback(false, 401, 'Token required')
      return
    }

    try {
      jwt.verify(token, config.jwtSecret)
      callback(true)
    } catch {
      callback(false, 401, 'Invalid token')
    }
  }

  /**
   * 处理新的 WebSocket 连接
   */
  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const url = new URL(req.url || '', `http://${req.headers.host}`)
    const token = url.searchParams.get('token')

    if (!token) {
      ws.close(1008, 'Token required')
      return
    }

    let userId: string
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { userId: string }
      userId = decoded.userId
    } catch {
      ws.close(1008, 'Invalid token')
      return
    }

    const connectionId = `client-${++this.connectionIdCounter}`
    console.log(`Client connected: ${connectionId} (user: ${userId})`)

    const connection: ClientConnection = {
      ws,
      userId,
      subscribedSubmissions: new Set(),
    }

    this.connections.set(connectionId, connection)

    // 设置消息处理
    ws.on('message', (data) => this.handleMessage(connectionId, data))
    ws.on('close', () => this.handleDisconnect(connectionId))
    ws.on('error', (error) => {
      console.error(`Client ${connectionId} error:`, error)
    })

    // 发送连接成功消息
    ws.send(JSON.stringify({ type: 'connected', connectionId }))
  }

  /**
   * 处理来自客户端的消息
   */
  private handleMessage(connectionId: string, data: Buffer | ArrayBuffer | Buffer[]): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    try {
      const message = JSON.parse(data.toString())

      switch (message.type) {
        case 'subscribe':
          this.handleSubscribe(connectionId, message.submissionId)
          break
        case 'unsubscribe':
          this.handleUnsubscribe(connectionId, message.submissionId)
          break
        default:
          console.log(`Unknown message type from ${connectionId}:`, message.type)
      }
    } catch (error) {
      console.error(`Failed to parse message from ${connectionId}:`, error)
    }
  }

  /**
   * 处理订阅请求
   */
  private handleSubscribe(connectionId: string, submissionId: string): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    connection.subscribedSubmissions.add(submissionId)

    // 添加到订阅者映射
    if (!this.submissionSubscribers.has(submissionId)) {
      this.submissionSubscribers.set(submissionId, new Set())
    }
    this.submissionSubscribers.get(submissionId)!.add(connectionId)

    // 注册评测结果回调
    judgeService.onResult(submissionId, (result) => {
      this.broadcastSubmissionStatus(submissionId, result)
    })

    console.log(`Client ${connectionId} subscribed to submission ${submissionId}`)

    // 发送确认消息
    connection.ws.send(JSON.stringify({
      type: 'subscribed',
      submissionId,
    }))
  }

  /**
   * 处理取消订阅请求
   */
  private handleUnsubscribe(connectionId: string, submissionId: string): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    connection.subscribedSubmissions.delete(submissionId)

    // 从订阅者映射中移除
    const subscribers = this.submissionSubscribers.get(submissionId)
    if (subscribers) {
      subscribers.delete(connectionId)
      if (subscribers.size === 0) {
        this.submissionSubscribers.delete(submissionId)
      }
    }

    console.log(`Client ${connectionId} unsubscribed from submission ${submissionId}`)
  }

  /**
   * 广播提交状态更新
   */
  private broadcastSubmissionStatus(submissionId: string, result: JudgeResultMessage): void {
    const subscribers = this.submissionSubscribers.get(submissionId)
    if (!subscribers || subscribers.size === 0) return

    const status = result.status !== undefined
      ? hydroStatusToJudgeStatus(result.status)
      : (result.key === 'end' ? 'runtime_error' : 'judging')

    const message: SubmissionStatusMessage = {
      type: 'status',
      submissionId,
      status,
      time: result.time,
      memory: result.memory,
      message: result.message,
      compilerText: result.compilerText,
    }

    // 添加测试用例结果
    if (result.case) {
      const caseStatus = result.case.status !== undefined
        ? hydroStatusToJudgeStatus(result.case.status)
        : 'runtime_error'
      
      message.testCase = {
        id: result.case.id,
        status: caseStatus,
        passed: caseStatus === 'accepted',
        time: result.case.time,
        memory: result.case.memory,
      }
    }

    const messageStr = JSON.stringify(message)

    for (const connectionId of subscribers) {
      const connection = this.connections.get(connectionId)
      if (connection && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(messageStr)
      }
    }

    // 如果是最终结果，清理订阅
    if (result.key === 'end') {
      // 延迟清理，让客户端有时间处理最终结果
      setTimeout(() => {
        this.submissionSubscribers.delete(submissionId)
        for (const connectionId of subscribers) {
          const connection = this.connections.get(connectionId)
          if (connection) {
            connection.subscribedSubmissions.delete(submissionId)
          }
        }
      }, 5000)
    }
  }

  /**
   * 处理客户端断开连接
   */
  private handleDisconnect(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    console.log(`Client disconnected: ${connectionId}`)

    // 清理订阅
    for (const submissionId of connection.subscribedSubmissions) {
      const subscribers = this.submissionSubscribers.get(submissionId)
      if (subscribers) {
        subscribers.delete(connectionId)
        if (subscribers.size === 0) {
          this.submissionSubscribers.delete(submissionId)
        }
      }
    }

    this.connections.delete(connectionId)
  }

  /**
   * 向特定用户发送消息
   */
  sendToUser(userId: string, message: object): void {
    const messageStr = JSON.stringify(message)
    for (const connection of this.connections.values()) {
      if (connection.userId === userId && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(messageStr)
      }
    }
  }

  /**
   * 获取连接状态
   */
  getStatus(): {
    connections: number
    subscriptions: number
  } {
    let subscriptions = 0
    for (const subscribers of this.submissionSubscribers.values()) {
      subscriptions += subscribers.size
    }

    return {
      connections: this.connections.size,
      subscriptions,
    }
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
    this.submissionSubscribers.clear()
  }
}

// 单例导出
export const submissionWsService = new SubmissionWebSocketService()
