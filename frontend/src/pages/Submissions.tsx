import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { ClockIcon, CpuChipIcon, CodeBracketIcon, EyeIcon } from '@heroicons/react/24/outline'
import { submissionService } from '../services'
import { Pagination, StatusBadge, LANGUAGE_OPTIONS } from '../components/common'
import { useAuthStore } from '../stores/authStore'
import type { JudgeStatus, SupportedLanguage, Submission } from '../types'

const ITEMS_PER_PAGE = 20

const STATUS_OPTIONS: { value: JudgeStatus | ''; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'accepted', label: '通过' },
  { value: 'wrong_answer', label: '答案错误' },
  { value: 'time_limit_exceeded', label: '超时' },
  { value: 'memory_limit_exceeded', label: '内存超限' },
  { value: 'runtime_error', label: '运行错误' },
  { value: 'compile_error', label: '编译错误' },
  { value: 'pending', label: '等待中' },
  { value: 'judging', label: '评测中' },
]

function getLanguageLabel(lang: SupportedLanguage): string {
  const option = LANGUAGE_OPTIONS.find(opt => opt.value === lang)
  return option?.label || lang
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // Less than 1 minute
  if (diff < 60 * 1000) {
    return '刚刚'
  }
  
  // Less than 1 hour
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000))
    return `${minutes} 分钟前`
  }
  
  // Less than 24 hours
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return `${hours} 小时前`
  }
  
  // Less than 7 days
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    return `${days} 天前`
  }
  
  // Format as date
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function Submissions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated } = useAuthStore()
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  
  // Parse URL params
  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const statusFilter = (searchParams.get('status') as JudgeStatus) || undefined
  const showMyOnly = searchParams.get('my') === 'true'

  // Fetch submissions
  const { data: submissionsData, isLoading, error } = useQuery({
    queryKey: ['submissions', currentPage, statusFilter, showMyOnly],
    queryFn: () => {
      if (showMyOnly && isAuthenticated) {
        return submissionService.getMySubmissions({
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          status: statusFilter,
        })
      }
      return submissionService.getSubmissions({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        status: statusFilter,
      })
    },
  })

  // Update URL params
  const updateParams = (updates: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams(searchParams)
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value)
      } else {
        newParams.delete(key)
      }
    })
    
    // Reset to page 1 when filters change (except when changing page)
    if (!('page' in updates)) {
      newParams.set('page', '1')
    }
    
    setSearchParams(newParams)
  }

  const handlePageChange = (page: number) => {
    updateParams({ page: page.toString() })
  }

  const handleStatusChange = (status: string) => {
    updateParams({ status: status || undefined })
  }

  const handleMyOnlyToggle = () => {
    updateParams({ my: showMyOnly ? undefined : 'true' })
  }

  const totalPages = submissionsData ? Math.ceil(submissionsData.total / ITEMS_PER_PAGE) : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">提交记录</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          查看所有代码提交和评测结果
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        {/* Status Filter */}
        <select
          value={statusFilter || ''}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* My Submissions Toggle */}
        {isAuthenticated && (
          <button
            onClick={handleMyOnlyToggle}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              showMyOnly
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            我的提交
          </button>
        )}
      </div>

      {/* Submissions List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">加载中...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">加载失败，请稍后重试</p>
          </div>
        ) : submissionsData && submissionsData.submissions.length > 0 ? (
          <>
            {/* Table Header */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400">
              <div className="col-span-2">状态</div>
              <div className="col-span-3">题目</div>
              <div className="col-span-2">语言</div>
              <div className="col-span-2">用时/内存</div>
              <div className="col-span-2">提交时间</div>
              <div className="col-span-1">操作</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {submissionsData.submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {/* Desktop View */}
                  <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-4 items-center">
                    <div className="col-span-2">
                      <StatusBadge status={submission.status} size="sm" />
                    </div>
                    <div className="col-span-3">
                      <Link
                        to={`/problems/${submission.problemId}`}
                        className="text-gray-900 dark:text-white font-medium hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        题目 #{submission.problemId.slice(0, 8)}
                      </Link>
                    </div>
                    <div className="col-span-2">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <CodeBracketIcon className="h-4 w-4" />
                        {getLanguageLabel(submission.language)}
                      </span>
                    </div>
                    <div className="col-span-2 text-sm text-gray-600 dark:text-gray-300">
                      {submission.time !== undefined && submission.memory !== undefined ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-3.5 w-3.5" />
                            {submission.time} ms
                          </span>
                          <span className="flex items-center gap-1">
                            <CpuChipIcon className="h-3.5 w-3.5" />
                            {(submission.memory / 1024).toFixed(1)} MB
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                    <div className="col-span-2 text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(submission.createdAt)}
                    </div>
                    <div className="col-span-1">
                      <button
                        onClick={() => setSelectedSubmission(submission)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="查看详情"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile View */}
                  <div className="sm:hidden px-4 py-4">
                    <div className="flex items-start justify-between mb-2">
                      <StatusBadge status={submission.status} size="sm" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(submission.createdAt)}
                      </span>
                    </div>
                    <Link
                      to={`/problems/${submission.problemId}`}
                      className="text-gray-900 dark:text-white font-medium hover:text-blue-600 dark:hover:text-blue-400 block mb-2"
                    >
                      题目 #{submission.problemId.slice(0, 8)}
                    </Link>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {getLanguageLabel(submission.language)}
                      </span>
                      {submission.time !== undefined && submission.memory !== undefined && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {submission.time}ms / {(submission.memory / 1024).toFixed(1)}MB
                        </span>
                      )}
                      <button
                        onClick={() => setSelectedSubmission(submission)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={submissionsData.total}
                  itemsPerPage={ITEMS_PER_PAGE}
                />
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {statusFilter || showMyOnly ? '没有找到符合条件的提交记录' : '暂无提交记录'}
            </p>
          </div>
        )}
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  )
}


// Submission Detail Modal Component
interface SubmissionDetailModalProps {
  submission: Submission
  onClose: () => void
}

function SubmissionDetailModal({ submission, onClose }: SubmissionDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                提交详情
              </h2>
              <StatusBadge status={submission.status} />
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {/* Meta Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">语言</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {getLanguageLabel(submission.language)}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">执行用时</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {submission.time !== undefined ? `${submission.time} ms` : '-'}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">内存消耗</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {submission.memory !== undefined ? `${(submission.memory / 1024).toFixed(2)} MB` : '-'}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">提交时间</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatTime(submission.createdAt)}
                </div>
              </div>
            </div>

            {/* Test Case Results */}
            {submission.testCaseResults && submission.testCaseResults.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  测试用例结果
                </h3>
                <div className="flex flex-wrap gap-2">
                  {submission.testCaseResults.map((tc, index) => (
                    <div
                      key={index}
                      className={`px-3 py-1.5 rounded-lg text-sm ${
                        tc.passed
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}
                      title={`用时: ${tc.time}ms, 内存: ${(tc.memory / 1024).toFixed(1)}MB`}
                    >
                      测试点 {index + 1}: {tc.passed ? '通过' : '未通过'}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compile Error */}
            {submission.compileError && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                  编译错误
                </h3>
                <pre className="bg-gray-900 text-gray-200 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap max-h-40">
                  {submission.compileError}
                </pre>
              </div>
            )}

            {/* Runtime Error */}
            {submission.runtimeError && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                  运行错误
                </h3>
                <pre className="bg-gray-900 text-gray-200 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap max-h-40">
                  {submission.runtimeError}
                </pre>
              </div>
            )}

            {/* Source Code */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                提交代码
              </h3>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-200 p-4 rounded-lg text-sm overflow-x-auto max-h-96">
                  <code>{submission.code}</code>
                </pre>
                <button
                  onClick={() => navigator.clipboard.writeText(submission.code)}
                  className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white bg-gray-800 rounded transition-colors"
                  title="复制代码"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              to={`/problems/${submission.problemId}`}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              查看题目
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
