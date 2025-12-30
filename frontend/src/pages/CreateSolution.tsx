import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { solutionService, problemService } from '../services'
import { useAuthStore } from '../stores/authStore'

const LANGUAGES = [
  { value: 'cpp', label: 'C++' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'go', label: 'Go' },
]

export function CreateSolution() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  
  const problemId = searchParams.get('problemId') || ''

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('cpp')

  // Fetch problem info
  const { data: problem, isLoading: problemLoading } = useQuery({
    queryKey: ['problem', problemId],
    queryFn: () => problemService.getProblemById(problemId),
    enabled: !!problemId,
  })

  // Create solution mutation
  const createMutation = useMutation({
    mutationFn: () => solutionService.createSolution({
      problemId,
      title,
      content,
      code: code || undefined,
      language: code ? language : undefined,
    }),
    onSuccess: (result) => {
      navigate(`/solutions/${result.solution.id}`)
    },
    onError: (error) => {
      alert(error instanceof Error ? error.message : '发布失败，请重试')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      alert('请输入标题')
      return
    }
    
    if (!content.trim()) {
      alert('请输入内容')
      return
    }

    createMutation.mutate()
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-300 mb-4">请先登录后再发布题解</p>
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            去登录
          </Link>
        </div>
      </div>
    )
  }

  if (!problemId) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-300 mb-4">请选择一道题目后再发布题解</p>
          <Link
            to="/problems"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            去题库
          </Link>
        </div>
      </div>
    )
  }

  if (problemLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <Link
        to={`/solutions?problemId=${problemId}`}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
      >
        <ChevronLeftIcon className="h-4 w-4 mr-1" />
        返回题解列表
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">发布题解</h1>
      
      {/* Problem Info */}
      {problem && (
        <div className="mb-6">
          <Link
            to={`/problems/${problem.id}`}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {problem.number}. {problem.title}
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入题解标题..."
            maxLength={200}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            内容 <span className="text-red-500">*</span>
            <span className="text-gray-500 font-normal ml-2">(支持 Markdown)</span>
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享你的解题思路..."
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-y"
          />
        </div>

        {/* Code (Optional) */}
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            代码 <span className="text-gray-500 font-normal">(可选)</span>
          </label>
          <div className="flex items-center gap-2 mb-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          <textarea
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="粘贴你的代码..."
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-900 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-y"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link
            to={`/solutions?problemId=${problemId}`}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? '发布中...' : '发布题解'}
          </button>
        </div>
      </form>
    </div>
  )
}
