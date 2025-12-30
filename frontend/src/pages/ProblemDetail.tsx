import { useState, useCallback, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  ClockIcon,
  CpuChipIcon,
  ChevronLeftIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { problemService, submissionService } from '../services'
import {
  DifficultyBadge,
  SubmissionResult,
  DEFAULT_CODE,
  EnhancedMarkdown,
} from '../components/common'
import {
  EnhancedEditor,
  EditorToolbar,
  EditorSettingsPanel,
} from '../components/editor'
import { useSubmissionWebSocket, type SubmissionStatusUpdate } from '../hooks'
import { useAuthStore } from '../stores/authStore'
import type { SupportedLanguage, JudgeStatus } from '../types'
import type { TestCaseUpdate } from '../hooks/useSubmissionWebSocket'

interface SubmissionState {
  submissionId: string | null
  status: JudgeStatus
  time?: number
  memory?: number
  message?: string
  compilerText?: string
  testCases: TestCaseUpdate[]
}

export function ProblemDetail() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated } = useAuthStore()
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('cpp')
  const [code, setCode] = useState<string>(DEFAULT_CODE.cpp)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false)
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    submissionId: null,
    status: 'pending',
    testCases: [],
  })

  const { data: problem, isLoading, error } = useQuery({
    queryKey: ['problem', id],
    queryFn: () => problemService.getProblemById(id!),
    enabled: !!id,
  })

  const { subscribe, unsubscribe, isConnected } = useSubmissionWebSocket({
    onStatusUpdate: useCallback((update: SubmissionStatusUpdate) => {
      if (update.submissionId === submissionState.submissionId) {
        setSubmissionState((prev) => {
          const newState: SubmissionState = {
            ...prev,
            status: update.status,
            time: update.time ?? prev.time,
            memory: update.memory ?? prev.memory,
            message: update.message ?? prev.message,
            compilerText: update.compilerText ?? prev.compilerText,
          }
          if (update.testCase) {
            const existingIndex = prev.testCases.findIndex(tc => tc.id === update.testCase!.id)
            if (existingIndex >= 0) {
              newState.testCases = [...prev.testCases]
              newState.testCases[existingIndex] = update.testCase
            } else {
              newState.testCases = [...prev.testCases, update.testCase]
            }
          }
          return newState
        })
      }
    }, [submissionState.submissionId]),
  })

  const submitMutation = useMutation({
    mutationFn: () => submissionService.submitCode({
      problemId: id!,
      code,
      language: selectedLanguage,
    }),
    onSuccess: (data) => {
      setSubmissionState({ submissionId: data.submissionId, status: 'pending', testCases: [] })
      setShowResult(true)
      if (isConnected) {
        subscribe(data.submissionId)
      } else {
        setTimeout(() => {
          setSubmissionState((prev) => {
            if (prev.submissionId === data.submissionId && prev.status === 'pending') {
              return { ...prev, status: 'system_error' as JudgeStatus, message: '评测服务暂时不可用' }
            }
            return prev
          })
        }, 5000)
      }
    },
    onError: (err) => {
      setSubmissionState({
        submissionId: null,
        status: 'runtime_error',
        message: err instanceof Error ? err.message : '提交失败',
        testCases: [],
      })
      setShowResult(true)
    },
  })

  useEffect(() => {
    return () => {
      if (submissionState.submissionId) unsubscribe(submissionState.submissionId)
    }
  }, [submissionState.submissionId, unsubscribe])

  // 处理函数定义
  const handleLanguageChange = (lang: SupportedLanguage) => {
    setSelectedLanguage(lang)
    setCode(DEFAULT_CODE[lang])
  }

  const handleSubmit = () => {
    if (!isAuthenticated) { alert('请先登录'); return }
    if (!code.trim()) { alert('请输入代码'); return }
    submitMutation.mutate()
  }

  const handleCopyExample = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const getAcceptanceRate = (a: number, t: number) => t === 0 ? '-' : `${((a / t) * 100).toFixed(1)}%`

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600" />
          <p className="mt-2 text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  if (error || !problem) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-red-500 mb-4">题目加载失败</p>
        <Link to="/problems" className="text-blue-600 hover:text-blue-700">返回题库</Link>
      </div>
    )
  }

  const isSubmitting = submitMutation.isPending
  const isJudging = submissionState.submissionId !== null && 
    (submissionState.status === 'pending' || submissionState.status === 'judging')

  const mainContent = (
    <div className="flex flex-col md:flex-row md:h-[calc(100vh-64px)]">
      {/* Left - Problem */}
      <div className="md:w-1/2 flex flex-col border-r border-gray-200 dark:border-gray-700 md:overflow-hidden min-h-0 min-w-0">
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
          <Link to="/problems" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 mb-2">
            <ChevronLeftIcon className="h-4 w-4 mr-1" />返回题库
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{problem.number}. {problem.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <DifficultyBadge difficulty={problem.difficulty} />
            <span className="text-sm text-gray-500">通过率: {getAcceptanceRate(problem.acceptedCount, problem.submissionCount)}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {problem.tags.map((tag) => (
              <span key={tag} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">{tag}</span>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 bg-white dark:bg-gray-800 min-h-0">
          <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1"><ClockIcon className="h-4 w-4" /><span>时间: {problem.timeLimit}ms</span></div>
            <div className="flex items-center gap-1"><CpuChipIcon className="h-4 w-4" /><span>内存: {problem.memoryLimit}MB</span></div>
          </div>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">题目描述</h2>
            <EnhancedMarkdown>{problem.description}</EnhancedMarkdown>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">输入格式</h2>
            <EnhancedMarkdown>{problem.inputFormat}</EnhancedMarkdown>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">输出格式</h2>
            <EnhancedMarkdown>{problem.outputFormat}</EnhancedMarkdown>
          </section>

          {problem.constraints && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">数据范围</h2>
              <EnhancedMarkdown>{problem.constraints}</EnhancedMarkdown>
            </section>
          )}

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">示例</h2>
            <div className="space-y-4">
              {problem.examples.map((ex, i) => (
                <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-700/50 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">示例 {i + 1}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase">输入</span>
                        <button onClick={() => handleCopyExample(ex.input, i * 2)} className="p-1 text-gray-400 hover:text-gray-600">
                          {copiedIndex === i * 2 ? <CheckIcon className="h-4 w-4 text-green-500" /> : <DocumentDuplicateIcon className="h-4 w-4" />}
                        </button>
                      </div>
                      <pre className="bg-gray-100 dark:bg-gray-800 rounded p-2 text-sm font-mono overflow-x-auto whitespace-pre-wrap">{ex.input}</pre>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase">输出</span>
                        <button onClick={() => handleCopyExample(ex.output, i * 2 + 1)} className="p-1 text-gray-400 hover:text-gray-600">
                          {copiedIndex === i * 2 + 1 ? <CheckIcon className="h-4 w-4 text-green-500" /> : <DocumentDuplicateIcon className="h-4 w-4" />}
                        </button>
                      </div>
                      <pre className="bg-gray-100 dark:bg-gray-800 rounded p-2 text-sm font-mono overflow-x-auto whitespace-pre-wrap">{ex.output}</pre>
                    </div>
                  </div>
                  {ex.explanation && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                      <span className="text-xs font-medium text-gray-500 uppercase block mb-2">说明</span>
                      <EnhancedMarkdown>{ex.explanation}</EnhancedMarkdown>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Right - Editor */}
      <div className="md:w-1/2 flex flex-col min-h-[600px] md:min-h-0 md:h-full min-w-0">
        <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden min-h-0">
        <EditorToolbar
          language={selectedLanguage}
          onLanguageChange={handleLanguageChange}
          isSubmitting={isSubmitting || isJudging}
          onSubmit={handleSubmit}
          onSettingsClick={() => setSettingsPanelOpen(true)}
        />
        <div className={`flex-1 min-h-0 ${showResult ? 'h-1/2' : ''}`}>
          <EnhancedEditor value={code} onChange={setCode} language={selectedLanguage} readOnly={submitMutation.isPending} height="100%" />
        </div>
        {showResult && (
          <div className="flex-shrink-0 border-t border-gray-700 bg-gray-800 max-h-[40%] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
              <span className="text-sm font-medium text-gray-300">评测结果</span>
              <button onClick={() => setShowResult(false)} className="p-1 text-gray-400 hover:text-gray-200"><XMarkIcon className="h-4 w-4" /></button>
            </div>
            <div className="p-4">
              <SubmissionResult status={submissionState.status} time={submissionState.time} memory={submissionState.memory} message={submissionState.message} compilerText={submissionState.compilerText} testCases={submissionState.testCases} />
            </div>
          </div>
        )}
        </div>
        {/* AI 侧边栏已移除 */}
      </div>
      <EditorSettingsPanel isOpen={settingsPanelOpen} onClose={() => setSettingsPanelOpen(false)} />
    </div>
  )

  return (
    <>
      {mainContent}
    </>
  )
}
