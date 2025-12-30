import { useMemo } from 'react'
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CpuChipIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import type { JudgeStatus } from '../../types'
import type { TestCaseUpdate } from '../../hooks/useSubmissionWebSocket'

interface SubmissionResultProps {
  status: JudgeStatus
  time?: number
  memory?: number
  message?: string
  compilerText?: string
  testCases?: TestCaseUpdate[]
  totalTestCases?: number
}

const STATUS_CONFIG: Record<JudgeStatus, {
  label: string
  color: string
  bgColor: string
  icon: React.ComponentType<{ className?: string }>
}> = {
  pending: {
    label: '等待中',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-700',
    icon: ClockIcon,
  },
  judging: {
    label: '评测中',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: ArrowPathIcon,
  },
  accepted: {
    label: '通过',
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: CheckCircleIcon,
  },
  wrong_answer: {
    label: '答案错误',
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: XCircleIcon,
  },
  time_limit_exceeded: {
    label: '超时',
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    icon: ClockIcon,
  },
  memory_limit_exceeded: {
    label: '内存超限',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    icon: CpuChipIcon,
  },
  runtime_error: {
    label: '运行错误',
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: ExclamationTriangleIcon,
  },
  compile_error: {
    label: '编译错误',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: ExclamationTriangleIcon,
  },
}

export function SubmissionResult({
  status,
  time,
  memory,
  message,
  compilerText,
  testCases = [],
  totalTestCases,
}: SubmissionResultProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  const isJudging = status === 'judging' || status === 'pending'
  const passedCount = testCases.filter(tc => tc.passed).length

  const progressPercentage = useMemo(() => {
    if (!totalTestCases || totalTestCases === 0) return 0
    return (testCases.length / totalTestCases) * 100
  }, [testCases.length, totalTestCases])

  return (
    <div className={`rounded-lg p-4 ${config.bgColor}`}>
      {/* Status Header */}
      <div className="flex items-center gap-3 mb-3">
        <Icon className={`h-6 w-6 ${config.color} ${isJudging ? 'animate-spin' : ''}`} />
        <span className={`text-lg font-semibold ${config.color}`}>
          {config.label}
        </span>
      </div>

      {/* Progress Bar (during judging) */}
      {isJudging && totalTestCases && totalTestCases > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>评测进度</span>
            <span>{testCases.length} / {totalTestCases}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Time and Memory */}
      {(time !== undefined || memory !== undefined) && (
        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
          {time !== undefined && (
            <div className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              <span>{time} ms</span>
            </div>
          )}
          {memory !== undefined && (
            <div className="flex items-center gap-1">
              <CpuChipIcon className="h-4 w-4" />
              <span>{(memory / 1024).toFixed(2)} MB</span>
            </div>
          )}
        </div>
      )}

      {/* Test Cases Summary */}
      {testCases.length > 0 && (
        <div className="mb-3">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            测试用例: {passedCount} / {testCases.length} 通过
          </div>
          <div className="flex flex-wrap gap-1">
            {testCases.map((tc) => (
              <div
                key={tc.id}
                className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${
                  tc.passed
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                }`}
                title={`测试点 ${tc.id}: ${tc.passed ? '通过' : '未通过'} (${tc.time}ms, ${(tc.memory / 1024).toFixed(1)}MB)`}
              >
                {tc.id}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compiler Error */}
      {compilerText && (
        <div className="mt-3">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            编译信息:
          </div>
          <pre className="bg-gray-800 text-gray-200 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap max-h-40">
            {compilerText}
          </pre>
        </div>
      )}

      {/* Error Message */}
      {message && !compilerText && (
        <div className="mt-3">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            错误信息:
          </div>
          <pre className="bg-gray-800 text-gray-200 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap max-h-40">
            {message}
          </pre>
        </div>
      )}
    </div>
  )
}
