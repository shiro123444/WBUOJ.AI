/**
 * Session 管理服务
 * 用于存储和验证评测机的认证 session
 */

interface SessionData {
  uname: string
  expiry: number
}

// 存储已认证的 session
const authenticatedSessions = new Map<string, SessionData>()

/**
 * 创建新 session
 */
export function createSession(uname: string): string {
  const sid = `judge_${Date.now()}_${Math.random().toString(36).substring(2)}`
  
  // 存储 session (24小时有效)
  authenticatedSessions.set(sid, {
    uname,
    expiry: Date.now() + 24 * 60 * 60 * 1000,
  })

  return sid
}

/**
 * 验证 session
 */
export function verifySession(sid: string): boolean {
  const session = authenticatedSessions.get(sid)
  console.log(`Verifying session ${sid.substring(0, 20)}..., found: ${!!session}, total sessions: ${authenticatedSessions.size}`)
  if (!session) {
    return false
  }

  if (session.expiry < Date.now()) {
    authenticatedSessions.delete(sid)
    return false
  }

  return true
}

/**
 * 获取 session 数据
 */
export function getSession(sid: string): SessionData | undefined {
  return authenticatedSessions.get(sid)
}

/**
 * 删除 session
 */
export function deleteSession(sid: string): void {
  authenticatedSessions.delete(sid)
}

/**
 * 清理过期 session
 */
export function cleanupExpiredSessions(): void {
  const now = Date.now()
  for (const [sid, session] of authenticatedSessions) {
    if (session.expiry < now) {
      authenticatedSessions.delete(sid)
    }
  }
}

// 每小时清理一次过期 session
setInterval(cleanupExpiredSessions, 60 * 60 * 1000)

export { authenticatedSessions }
