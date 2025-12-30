import type { JudgeStatus, SupportedLanguage } from './index.js'

// Hydro Judge WebSocket 通信类型

/**
 * 评测机配置
 */
export interface JudgeConfig {
  concurrency: number
  langs: string[]
}

/**
 * 语言配置 (Hydro OJ 格式)
 */
export interface LanguageConfig {
  key: string // 语言标识符 (必需，HydroJudge 用于设置 HYDRO_LANG 环境变量)
  compile?: string
  execute: string
  code_file: string
  target?: string
  display: string
  time_limit_rate?: number
  memory_limit_rate?: number
  compile_time_limit?: number
  compile_memory_limit?: number
  hidden?: boolean
}

/**
 * 文件信息 (Hydro OJ 格式)
 */
export interface FileInfo {
  /** 文件名 */
  name: string
  /** 文件大小 (bytes) */
  size: number
  /** ETag (用于缓存验证) */
  etag?: string
  /** 最后修改时间 */
  lastModified?: Date
}

/**
 * 评测元数据 (Hydro OJ 格式)
 */
export interface JudgeMeta {
  problemOwner?: number
  hackRejudge?: string
  rejudge?: boolean | 'controlled'
  type?: string
}

/**
 * 评测任务请求 (Hydro OJ 格式)
 * 参考: https://github.com/hydro-dev/Hydro
 */
export interface JudgeRequest {
  // 必需字段
  rid: string // Record ID (Submission ID)
  domainId: string // 域 ID
  pid: string // Problem ID
  uid: number // User ID
  lang: string // 语言标识
  code: string // 源代码
  
  // 任务类型
  type: 'judge' | 'generate'
  priority: number
  
  // 题目配置
  config: ProblemConfig
  
  // 测试数据
  data: FileInfo[]
  source: string // 问题来源标识 (domainId/pid)
  
  // 元数据
  meta: JudgeMeta
  trusted: boolean
  
  // 可选字段
  files?: Record<string, string>
  input?: string // pretest input
  hackTarget?: string
  contest?: string
}

/**
 * 题目配置
 */
export interface ProblemConfig {
  time: number // 时间限制 (ms)
  memory: number // 内存限制 (MB)
  cases: TestCaseConfig[]
}

/**
 * 测试用例配置
 */
export interface TestCaseConfig {
  input: string // 输入文件路径或内容
  output: string // 期望输出文件路径或内容
  time?: number // 单个用例时间限制
  memory?: number // 单个用例内存限制
}

/**
 * 评测结果消息
 */
export interface JudgeResultMessage {
  rid: string
  key: 'next' | 'end'
  status?: number // 状态码
  score?: number // 得分
  time?: number // 执行时间 ms
  memory?: number // 内存使用 KB
  message?: string // 消息
  compilerText?: string // 编译信息
  case?: TestCaseResultMessage
}

/**
 * 测试用例结果
 */
export interface TestCaseResultMessage {
  id: number
  status: number
  time: number
  memory: number
  message?: string
}

/**
 * Hydro Judge 状态码映射
 */
export const HydroJudgeStatus = {
  STATUS_WAITING: 0,
  STATUS_ACCEPTED: 1,
  STATUS_WRONG_ANSWER: 2,
  STATUS_TIME_LIMIT_EXCEEDED: 3,
  STATUS_MEMORY_LIMIT_EXCEEDED: 4,
  STATUS_OUTPUT_LIMIT_EXCEEDED: 5,
  STATUS_RUNTIME_ERROR: 6,
  STATUS_COMPILE_ERROR: 7,
  STATUS_SYSTEM_ERROR: 8,
  STATUS_CANCELED: 9,
  STATUS_ETC: 10,
  STATUS_JUDGING: 20,
  STATUS_COMPILING: 21,
  STATUS_FETCHED: 22,
} as const

/**
 * 将 Hydro 状态码转换为系统状态
 */
export function hydroStatusToJudgeStatus(status: number): JudgeStatus {
  switch (status) {
    case HydroJudgeStatus.STATUS_WAITING:
    case HydroJudgeStatus.STATUS_FETCHED:
      return 'pending'
    case HydroJudgeStatus.STATUS_JUDGING:
    case HydroJudgeStatus.STATUS_COMPILING:
      return 'judging'
    case HydroJudgeStatus.STATUS_ACCEPTED:
      return 'accepted'
    case HydroJudgeStatus.STATUS_WRONG_ANSWER:
      return 'wrong_answer'
    case HydroJudgeStatus.STATUS_TIME_LIMIT_EXCEEDED:
      return 'time_limit_exceeded'
    case HydroJudgeStatus.STATUS_MEMORY_LIMIT_EXCEEDED:
    case HydroJudgeStatus.STATUS_OUTPUT_LIMIT_EXCEEDED:
      return 'memory_limit_exceeded'
    case HydroJudgeStatus.STATUS_RUNTIME_ERROR:
      return 'runtime_error'
    case HydroJudgeStatus.STATUS_COMPILE_ERROR:
      return 'compile_error'
    default:
      return 'runtime_error'
  }
}

/**
 * 语言标识映射 (前端语言 -> hydrojudge 语言)
 */
export const LanguageMap: Record<SupportedLanguage, string> = {
  cpp: 'cc',
  python: 'py3',
  java: 'java',
  javascript: 'js',
  go: 'go',
}

/**
 * 反向语言映射
 */
export const ReverseLanguageMap: Record<string, SupportedLanguage> = {
  c: 'cpp',
  cc: 'cpp',
  py3: 'python',
  java: 'java',
  js: 'javascript',
  go: 'go',
}

/**
 * 评测机连接信息
 */
export interface JudgeConnection {
  id: string
  ws: import('ws').WebSocket
  config: JudgeConfig
  activeTasks: Set<string>
  lastHeartbeat: number
}

/**
 * 评测任务
 */
export interface JudgeTask {
  submissionId: string
  problemId: string
  problemNumber: number // 题目编号 (用于 HydroJudge)
  code: string
  language: SupportedLanguage
  timeLimit: number
  memoryLimit: number
  testCases: Array<{
    input: string
    expectedOutput: string
  }>
  createdAt: Date
}
