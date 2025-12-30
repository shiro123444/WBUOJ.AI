import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { problemService } from '../services'
import { Pagination, DifficultyBadge, ProblemFilter } from '../components/common'
import type { Difficulty } from '../types'

const ITEMS_PER_PAGE = 20

export function Problems() {
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Parse URL params
  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const searchQuery = searchParams.get('search') || ''
  const difficultyParam = searchParams.get('difficulty') as Difficulty | null
  const tagsParam = searchParams.get('tags')
  
  // Local state for search input
  const [searchInput, setSearchInput] = useState(searchQuery)
  
  // Parse tags from URL
  const selectedTags = tagsParam ? tagsParam.split(',').filter(Boolean) : []
  const selectedDifficulty = difficultyParam || undefined

  // Fetch problems
  const { data: problemsData, isLoading, error } = useQuery({
    queryKey: ['problems', currentPage, searchQuery, selectedDifficulty, selectedTags],
    queryFn: () => problemService.getProblems({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      difficulty: selectedDifficulty,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      search: searchQuery || undefined,
    }),
  })

  // Fetch available tags
  const { data: availableTags = [] } = useQuery({
    queryKey: ['problem-tags'],
    queryFn: () => problemService.getAllTags(),
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

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams({ search: searchInput || undefined })
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    updateParams({ page: page.toString() })
  }

  // Handle difficulty change
  const handleDifficultyChange = (difficulty: Difficulty | undefined) => {
    updateParams({ difficulty })
  }

  // Handle tags change
  const handleTagsChange = (tags: string[]) => {
    updateParams({ tags: tags.length > 0 ? tags.join(',') : undefined })
  }

  // Handle filter reset
  const handleFilterReset = () => {
    updateParams({ difficulty: undefined, tags: undefined })
  }

  // Sync search input with URL param
  useEffect(() => {
    setSearchInput(searchQuery)
  }, [searchQuery])

  // Calculate acceptance rate
  const getAcceptanceRate = (accepted: number, total: number): string => {
    if (total === 0) return '-'
    return `${((accepted / total) * 100).toFixed(1)}%`
  }

  const totalPages = problemsData ? Math.ceil(problemsData.total / ITEMS_PER_PAGE) : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">题库</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          浏览和练习算法题目
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜索题目标题或编号..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </form>

      {/* Filters */}
      <div className="mb-6">
        <ProblemFilter
          selectedDifficulty={selectedDifficulty}
          selectedTags={selectedTags}
          availableTags={availableTags}
          onDifficultyChange={handleDifficultyChange}
          onTagsChange={handleTagsChange}
          onReset={handleFilterReset}
        />
      </div>

      {/* Problem List */}
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
        ) : problemsData && problemsData.problems.length > 0 ? (
          <>
            {/* Table Header */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400">
              <div className="col-span-1">编号</div>
              <div className="col-span-5">标题</div>
              <div className="col-span-2">难度</div>
              <div className="col-span-2">通过率</div>
              <div className="col-span-2">标签</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {problemsData.problems.map((problem) => (
                <Link
                  key={problem.id}
                  to={`/problems/${problem.id}`}
                  className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {/* Desktop View */}
                  <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-4 items-center">
                    <div className="col-span-1 text-gray-500 dark:text-gray-400 font-mono">
                      {problem.number}
                    </div>
                    <div className="col-span-5">
                      <span className="text-gray-900 dark:text-white font-medium hover:text-blue-600 dark:hover:text-blue-400">
                        {problem.title}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <DifficultyBadge difficulty={problem.difficulty} size="sm" />
                    </div>
                    <div className="col-span-2 text-gray-600 dark:text-gray-300 text-sm">
                      {getAcceptanceRate(problem.acceptedCount, problem.submissionCount)}
                    </div>
                    <div className="col-span-2 flex flex-wrap gap-1">
                      {problem.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                      {problem.tags.length > 2 && (
                        <span className="text-xs text-gray-400">
                          +{problem.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mobile View */}
                  <div className="sm:hidden px-4 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 dark:text-gray-400 font-mono text-sm">
                            #{problem.number}
                          </span>
                          <DifficultyBadge difficulty={problem.difficulty} size="sm" />
                        </div>
                        <h3 className="mt-1 text-gray-900 dark:text-white font-medium">
                          {problem.title}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {problem.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                        <div>通过率</div>
                        <div className="font-medium text-gray-700 dark:text-gray-200">
                          {getAcceptanceRate(problem.acceptedCount, problem.submissionCount)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={problemsData.total}
                  itemsPerPage={ITEMS_PER_PAGE}
                />
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery || selectedDifficulty || selectedTags.length > 0
                ? '没有找到符合条件的题目'
                : '暂无题目'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
