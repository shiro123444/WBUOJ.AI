import { useEffect, useRef, useCallback, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import type { JudgeStatus } from '../types'

const WS_BASE_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.host}`
const MAX_RECONNECT_ATTEMPTS = 3
const RECONNECT_DELAY = 5000

export interface TestCaseUpdate {
  id: number
  status: JudgeStatus
  passed: boolean
  time: number
  memory: number
}

export interface SubmissionStatusUpdate {
  type: 'status'
  submissionId: string
  status: JudgeStatus
  time?: number
  memory?: number
  message?: string
  compilerText?: string
  testCase?: TestCaseUpdate
}

interface UseSubmissionWebSocketOptions {
  onStatusUpdate?: (update: SubmissionStatusUpdate) => void
  onConnected?: () => void
  onDisconnected?: () => void
  onError?: (error: Event) => void
}

export function useSubmissionWebSocket(options: UseSubmissionWebSocketOptions = {}) {
  const { token, isAuthenticated } = useAuthStore()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef<number>(0)
  const subscribedSubmissionsRef = useRef<Set<string>>(new Set())
  const isConnectingRef = useRef(false)
  const isMountedRef = useRef(true)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionId, setConnectionId] = useState<string | null>(null)
  
  // 使用 ref 存储 options 和 auth 状态，避免依赖变化导致重连
  const optionsRef = useRef(options)
  optionsRef.current = options
  
  const authRef = useRef({ token, isAuthenticated })
  authRef.current = { token, isAuthenticated }

  // 清理函数
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (wsRef.current) {
      // 移除事件监听器防止触发 onclose 回调
      wsRef.current.onopen = null
      wsRef.current.onmessage = null
      wsRef.current.onclose = null
      wsRef.current.onerror = null
      wsRef.current.close()
      wsRef.current = null
    }
    
    isConnectingRef.current = false
  }, [])

  const connect = useCallback(() => {
    const { token: currentToken, isAuthenticated: currentAuth } = authRef.current
    
    if (!currentAuth || !currentToken) {
      return
    }

    // 防止重复连接
    if (isConnectingRef.current) {
      return
    }

    // 如果已经有连接且状态正常，不要重新连接
    if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
      return
    }

    isConnectingRef.current = true

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.onopen = null
      wsRef.current.onmessage = null
      wsRef.current.onclose = null
      wsRef.current.onerror = null
      wsRef.current.close()
      wsRef.current = null
    }

    const ws = new WebSocket(`${WS_BASE_URL}/ws/submissions?token=${currentToken}`)

    ws.onopen = () => {
      if (!isMountedRef.current) return
      
      console.log('Submission WebSocket connected')
      isConnectingRef.current = false
      setIsConnected(true)
      reconnectAttemptsRef.current = 0
      optionsRef.current.onConnected?.()

      // Re-subscribe to any previously subscribed submissions
      for (const submissionId of subscribedSubmissionsRef.current) {
        ws.send(JSON.stringify({ type: 'subscribe', submissionId }))
      }
    }

    ws.onmessage = (event) => {
      if (!isMountedRef.current) return
      
      try {
        const message = JSON.parse(event.data)
        
        switch (message.type) {
          case 'connected':
            setConnectionId(message.connectionId)
            break
          case 'subscribed':
            console.log(`Subscribed to submission ${message.submissionId}`)
            break
          case 'status':
            optionsRef.current.onStatusUpdate?.(message as SubmissionStatusUpdate)
            break
          default:
            console.log('Unknown message type:', message.type)
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    ws.onclose = () => {
      if (!isMountedRef.current) return
      
      console.log('Submission WebSocket disconnected')
      isConnectingRef.current = false
      setIsConnected(false)
      setConnectionId(null)
      optionsRef.current.onDisconnected?.()

      // Attempt to reconnect with max retry limit
      const { isAuthenticated: stillAuth, token: stillToken } = authRef.current
      if (stillAuth && stillToken && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS && isMountedRef.current) {
        reconnectAttemptsRef.current++
        console.log(`WebSocket reconnect attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}`)
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            connect()
          }
        }, RECONNECT_DELAY)
      }
    }

    ws.onerror = (error) => {
      if (!isMountedRef.current) return
      
      console.error('Submission WebSocket error:', error)
      isConnectingRef.current = false
      optionsRef.current.onError?.(error)
    }

    wsRef.current = ws
  }, []) // 无依赖，使用 ref 获取最新值

  const disconnect = useCallback(() => {
    cleanup()
    setIsConnected(false)
    setConnectionId(null)
    subscribedSubmissionsRef.current.clear()
  }, [cleanup])

  const subscribe = useCallback((submissionId: string) => {
    subscribedSubmissionsRef.current.add(submissionId)

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', submissionId }))
    }
  }, [])

  const unsubscribe = useCallback((submissionId: string) => {
    subscribedSubmissionsRef.current.delete(submissionId)

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', submissionId }))
    }
  }, [])

  // 初始化和清理
  useEffect(() => {
    isMountedRef.current = true
    
    return () => {
      isMountedRef.current = false
      cleanup()
    }
  }, [cleanup])

  // 监听认证状态变化
  useEffect(() => {
    if (isAuthenticated && token) {
      // 只在没有连接时才连接
      if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
        connect()
      }
    } else {
      disconnect()
    }
  }, [isAuthenticated, token, connect, disconnect])

  return {
    isConnected,
    connectionId,
    subscribe,
    unsubscribe,
    connect,
    disconnect,
  }
}
