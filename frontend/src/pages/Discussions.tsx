import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ChatBubbleLeftRightIcon,
  EyeIcon,
  HandThumbUpIcon,
  MapPinIcon,
  LockClosedIcon,
  TagIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { discussionService } from '../services/discussion'
import { Pagination } from '../components/common'
import { GlassPageWrapper } from '../components/ui/GlassCard'

const SORT_OPTIONS = [
  { value: 'newest', label: '最新' },
  { value: 'hottest', label: '最热' },
  { value: 'most_replies', label: '最多回复' },
] as const

type SortOption = typeof SORT_OPTIONS[number]['value']

export function Discussions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const problemId = searchParams.get('problemId') || ''
  const currentSort = (searchParams.get('sort') as SortOption) || 'newest'
  const currentTag = searchParams.get('tag') || ''
  const currentPage = Number(searchParams.get('page')) || 1

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newTags, setNewTags] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['discussions', problemId, currentSort, currentTag, currentPage],
    queryFn: () =>
      discussionService.getDiscussions(problemId, {
        sort: currentSort,
        tag: currentTag || undefined,
        page: currentPage,
        limit: 20,
      }),
    enabled: !!problemId,
  })

  const handleSortChange = (sort: SortOption) => {
    const params = new URLSearchParams(searchParams)
    params.set('sort', sort)
    params.delete('page')
    setSearchParams(params)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(page))
    setSearchParams(params)
  }

  const handleTagClick = (tag: string) => {
    const params = new URLSearchParams(searchParams)
    if (currentTag === tag) {
      params.delete('tag')
    } else {
      params.set('tag', tag)
    }
    params.delete('page')
    setSearchParams(params)
  }

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) return
    try {
      const tags = newTags.split(',').map((t: string) => t.trim()).filter(Boolean)
      await discussionService.createDiscussion({
        problemId,
        title: newTitle.trim(),
        content: newContent.trim(),
        tags: tags.length > 0 ? tags : undefined,
      })
      setNewTitle('')
      setNewContent('')
      setNewTags('')
      setShowCreateForm(false)
      refetch()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '创建失败')
    }
  }

  if (!problemId) {
    return (
      <GlassPageWrapper>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="glass-card-static p-12">
            <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">请从题目页面进入讨论区</p>
          </div>
        </div>
      </GlassPageWrapper>
    )
  }

  return (
    <GlassPageWrapper>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 glass-animate-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
              <ChatBubbleLeftRightIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">讨论区</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">交流思路，共同进步</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all active:scale-95"
          >
            <PlusIcon className="w-4 h-4" />
            发起讨论
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="glass-card-static p-5 mb-6 glass-animate-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">新建讨论</h3>
              <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              placeholder="标题"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full mb-3 px-4 py-2.5 glass-input rounded-xl text-gray-900 dark:text-white focus:outline-none text-sm"
            />
            <textarea
              placeholder="内容（支持 Markdown）"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={6}
              className="w-full mb-3 px-4 py-2.5 glass-input rounded-xl text-gray-900 dark:text-white focus:outline-none resize-y text-sm"
            />
            <input
              type="text"
              placeholder="标签（逗号分隔，如：思路,DP,优化）"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              className="w-full mb-4 px-4 py-2.5 glass-input rounded-xl text-gray-900 dark:text-white focus:outline-none text-sm"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCreateForm(false)}
                className="glass-btn px-4 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-400"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || !newContent.trim()}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/25 transition-all"
              >
                发布
              </button>
            </div>
          </div>
        )}

        {/* Sort Tabs + Tag Filter */}
        <div className="flex items-center gap-2 mb-5 glass-animate-in glass-animate-in-delay-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSortChange(opt.value)}
              className={`px-4 py-2 text-sm rounded-xl font-medium transition-all ${
                currentSort === opt.value
                  ? 'glass-btn glass-btn-active'
                  : 'glass-btn text-gray-500 dark:text-gray-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
          {currentTag && (
            <button
              onClick={() => handleTagClick(currentTag)}
              className="ml-auto flex items-center gap-1 px-3 py-1.5 text-xs glass-badge rounded-full text-blue-600 dark:text-blue-400 font-medium"
            >
              <TagIcon className="w-3 h-3" />
              {currentTag}
              <XMarkIcon className="w-3 h-3 ml-0.5" />
            </button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 glass-skeleton" />
            ))}
          </div>
        ) : error ? (
          <div className="glass-card-static p-8 text-center text-red-500">加载失败，请重试</div>
        ) : !data || data.discussions.length === 0 ? (
          <div className="glass-card-static p-16 text-center">
            <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">暂无讨论，来发起第一个吧</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {data.discussions.map((d, i) => (
                <Link
                  key={d.id}
                  to={`/discussions/${d.id}`}
                  className={`block glass-card p-4 glass-animate-in glass-animate-in-delay-${Math.min(i % 4 + 1, 4)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        {d.isPinned && <MapPinIcon className="w-4 h-4 text-orange-500 flex-shrink-0" />}
                        {d.isLocked && <LockClosedIcon className="w-4 h-4 text-red-500 flex-shrink-0" />}
                        <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
                          {d.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium">{d.authorName}</span>
                        <span>{new Date(d.createdAt).toLocaleDateString('zh-CN')}</span>
                        <span className="flex items-center gap-1">
                          <EyeIcon className="w-3.5 h-3.5" />{d.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <HandThumbUpIcon className="w-3.5 h-3.5" />{d.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />{d.replyCount}
                        </span>
                      </div>
                      {d.tags.length > 0 && (
                        <div className="flex gap-1.5 mt-2">
                          {d.tags.map((tag) => (
                            <span
                              key={tag}
                              onClick={(e) => { e.preventDefault(); handleTagClick(tag) }}
                              className="glass-badge px-2 py-0.5 text-xs rounded-full text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {data.totalPages > 1 && (
              <div className="mt-6">
                <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={handlePageChange} />
              </div>
            )}
          </>
        )}
      </div>
    </GlassPageWrapper>
  )
}
