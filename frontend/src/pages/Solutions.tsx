import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  HeartIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  LockClosedIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'
import { solutionService, problemService } from '../services'
import { useAuthStore } from '../stores/authStore'

type SortOption = 'hot' | 'new'

export function Solutions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated } = useAuthStore()
  
  const problemId = searchParams.get('problemId') || ''
  const sort = (searchParams.get('sort') as SortOption) || 'hot'
  const page = parseInt(searchParams.get('page') || '1', 10)

  const [selectedProblemId, setSelectedProblemId] = useState(problemId)

  // Fetch problem info if problemId is provided
  const { data: problem } = useQuery({
    queryKey: ['problem', problemId],
    queryFn: () => problemService.getProblemById(problemId),
    enabled: !!problemId,
  })

  // Fetch solutions
  const { data: solutionsData, isLoading, error } = useQuery({
    queryKey: ['solutions', problemId, sort, page],
    queryFn: () => solutionService.getSolutions(problemId, { sort, page, limit: 20 }),
    enabled: !!problemId,
  })

  const handleSortChange = (newSort: SortOption) => {
    setSearchParams({ problemId, sort: newSort, page: '1' })
  }

  const handlePageChange = (newPage: number) => {
    setSearchParams({ problemId, sort, page: String(newPage) })
  }

  const handleProblemSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedProblemId) {
      setSearchParams({ problemId: selectedProblemId, sort, page: '1' })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">题解</h1>

      {/* Problem Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <form onSubmit={handleProblemSearch} className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="problemId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              题目编号或ID
            </label>
            <input
              type="text"
              id="problemId"
              value={selectedProblemId}
              onChange={(e) => setSelectedProblemId(e.target.value)}
              placeholder="输入题目编号查看题解..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              搜索
            </button>
          </div>
        </form>
      </div>

      {/* Problem Info */}
      {problem && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                to={`/problems/${problem.id}`}
                className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
              >
                {problem.number}. {problem.title}
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  problem.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {problem.difficulty === 'easy' ? '简单' : problem.difficulty === 'medium' ? '中等' : '困难'}
                </span>
                {problem.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            {isAuthenticated && (
              <Link
                to={`/solutions/new?problemId=${problem.id}`}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                发布题解
              </Link>
            )}
          </div>
        </div>
      )}

      {/* No Problem Selected */}
      {!problemId && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FunnelIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-300 mb-2">请输入题目编号查看题解</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            你可以在题目详情页点击"题解"标签查看该题的所有题解
          </p>
        </div>
      )}

      {/* Solutions List */}
      {problemId && (
        <>
          {/* Sort Options */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">排序:</span>
              <button
                onClick={() => handleSortChange('hot')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  sort === 'hot'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                最热
              </button>
              <button
                onClick={() => handleSortChange('new')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  sort === 'new'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                最新
              </button>
            </div>
            {solutionsData && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                共 {solutionsData.total} 篇题解
              </span>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
              <p className="text-red-600 dark:text-red-400">加载题解失败，请稍后重试</p>
            </div>
          )}

          {/* Solutions */}
          {solutionsData && solutionsData.solutions.length > 0 && (
            <div className="space-y-4">
              {solutionsData.solutions.map((solution) => (
                <div
                  key={solution.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link
                        to={`/solutions/${solution.id}`}
                        className="text-lg font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {solution.title}
                      </Link>
                      
                      {/* Content Preview or Hidden Notice */}
                      {solution.isContentHidden ? (
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                          <LockClosedIcon className="h-4 w-4" />
                          <span>通过此题后可查看题解内容</span>
                        </div>
                      ) : solution.contentPreview && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {solution.contentPreview}...
                        </p>
                      )}

                      {/* Author and Stats */}
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          {solution.authorAvatar ? (
                            <img
                              src={solution.authorAvatar}
                              alt={solution.authorName}
                              className="h-5 w-5 rounded-full"
                            />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-gray-300 dark:bg-gray-600" />
                          )}
                          <span>{solution.authorName}</span>
                        </div>
                        <span>{formatDate(solution.createdAt)}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <HeartIcon className="h-4 w-4" />
                        <span>{solution.likes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <EyeIcon className="h-4 w-4" />
                        <span>{solution.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ChatBubbleLeftIcon className="h-4 w-4" />
                        <span>{solution.commentCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {solutionsData && solutionsData.solutions.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-2">暂无题解</p>
              {isAuthenticated && (
                <Link
                  to={`/solutions/new?problemId=${problemId}`}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  成为第一个发布题解的人
                </Link>
              )}
            </div>
          )}

          {/* Pagination */}
          {solutionsData && solutionsData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 rounded-lg text-sm border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                上一页
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {page} / {solutionsData.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= solutionsData.totalPages}
                className="px-3 py-1 rounded-lg text-sm border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
