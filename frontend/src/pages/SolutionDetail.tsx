import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import {
  HeartIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  ChevronLeftIcon,
  LockClosedIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { solutionService } from '../services'
import { useAuthStore } from '../stores/authStore'

export function SolutionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()
  const [commentContent, setCommentContent] = useState('')

  // Fetch solution detail
  const { data, isLoading, error } = useQuery({
    queryKey: ['solution', id],
    queryFn: () => solutionService.getSolutionById(id!),
    enabled: !!id,
  })

  const solution = data?.solution

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: () => solutionService.toggleLike(id!),
    onSuccess: (result) => {
      queryClient.setQueryData(['solution', id], (old: typeof data) => {
        if (!old) return old
        return {
          ...old,
          solution: {
            ...old.solution,
            likes: result.likes,
            isLiked: result.isLiked,
          },
        }
      })
    },
  })

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: (content: string) => solutionService.addComment(id!, content),
    onSuccess: (result) => {
      queryClient.setQueryData(['solution', id], (old: typeof data) => {
        if (!old) return old
        return {
          ...old,
          solution: {
            ...old.solution,
            comments: [...old.solution.comments, result.comment],
          },
        }
      })
      setCommentContent('')
    },
  })

  // Delete solution mutation
  const deleteMutation = useMutation({
    mutationFn: () => solutionService.deleteSolution(id!),
    onSuccess: () => {
      navigate(`/solutions?problemId=${solution?.problemId}`)
    },
  })

  // Comment like mutation
  const commentLikeMutation = useMutation({
    mutationFn: (commentId: string) => solutionService.toggleCommentLike(id!, commentId),
    onSuccess: (result, commentId) => {
      queryClient.setQueryData(['solution', id], (old: typeof data) => {
        if (!old) return old
        return {
          ...old,
          solution: {
            ...old.solution,
            comments: old.solution.comments.map((c) =>
              c.id === commentId ? { ...c, likes: result.likes, isLiked: result.isLiked } : c
            ),
          },
        }
      })
    },
  })

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => solutionService.deleteComment(id!, commentId),
    onSuccess: (_, commentId) => {
      queryClient.setQueryData(['solution', id], (old: typeof data) => {
        if (!old) return old
        return {
          ...old,
          solution: {
            ...old.solution,
            comments: old.solution.comments.filter((c) => c.id !== commentId),
          },
        }
      })
    },
  })

  const handleLike = () => {
    if (!isAuthenticated) {
      alert('请先登录')
      return
    }
    likeMutation.mutate()
  }

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      alert('请先登录')
      return
    }
    if (!commentContent.trim()) return
    commentMutation.mutate(commentContent)
  }

  const handleDelete = () => {
    if (confirm('确定要删除这篇题解吗？')) {
      deleteMutation.mutate()
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isAuthor = user?.id === solution?.authorId
  const isAdmin = user?.role === 'admin'
  const canEdit = isAuthor
  const canDelete = isAuthor || isAdmin

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  if (error || !solution) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">题解加载失败</p>
          <Link
            to="/solutions"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            返回题解列表
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <Link
        to={`/solutions?problemId=${solution.problemId}`}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
      >
        <ChevronLeftIcon className="h-4 w-4 mr-1" />
        返回题解列表
      </Link>

      {/* Problem Info */}
      <div className="mb-4">
        <Link
          to={`/problems/${solution.problemId}`}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {solution.problemNumber}. {solution.problemTitle}
        </Link>
      </div>

      {/* Solution Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {solution.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                {solution.authorAvatar ? (
                  <img
                    src={solution.authorAvatar}
                    alt={solution.authorName}
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-gray-300 dark:bg-gray-600" />
                )}
                <span>{solution.authorName}</span>
              </div>
              <span>{formatDate(solution.createdAt)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {canEdit && (
              <Link
                to={`/solutions/${solution.id}/edit`}
                className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                title="编辑"
              >
                <PencilIcon className="h-5 w-5" />
              </Link>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                title="删除"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 transition-colors ${
              solution.isLiked
                ? 'text-red-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
            }`}
          >
            {solution.isLiked ? (
              <HeartSolidIcon className="h-5 w-5" />
            ) : (
              <HeartIcon className="h-5 w-5" />
            )}
            <span>{solution.likes}</span>
          </button>
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <EyeIcon className="h-5 w-5" />
            <span>{solution.views}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <ChatBubbleLeftIcon className="h-5 w-5" />
            <span>{solution.comments.length}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      {solution.isContentHidden ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center mb-6">
          <LockClosedIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-300 mb-2">题解内容已隐藏</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            请先通过此题后再查看题解内容
          </p>
          <Link
            to={`/problems/${solution.problemId}`}
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            去做题
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {solution.content || ''}
            </ReactMarkdown>
          </div>

          {/* Code */}
          {solution.code && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                代码 {solution.language && `(${solution.language})`}
              </h3>
              <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <code className="text-sm text-gray-100 font-mono">{solution.code}</code>
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Comments Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          评论 ({solution.comments.length})
        </h2>

        {/* Comment Form */}
        {isAuthenticated && (
          <form onSubmit={handleComment} className="mb-6">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="写下你的评论..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!commentContent.trim() || commentMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {commentMutation.isPending ? '发送中...' : '发表评论'}
              </button>
            </div>
          </form>
        )}

        {!isAuthenticated && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
            <p className="text-gray-600 dark:text-gray-300">
              <Link to="/login" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                登录
              </Link>
              {' '}后发表评论
            </p>
          </div>
        )}

        {/* Comments List */}
        {solution.comments.length > 0 ? (
          <div className="space-y-4">
            {solution.comments.map((comment) => (
              <div
                key={comment.id}
                className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {comment.authorAvatar ? (
                      <img
                        src={comment.authorAvatar}
                        alt={comment.authorName}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600" />
                    )}
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {comment.authorName}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => commentLikeMutation.mutate(comment.id)}
                      className={`flex items-center gap-1 text-sm transition-colors ${
                        comment.isLiked
                          ? 'text-red-500'
                          : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
                      }`}
                    >
                      {comment.isLiked ? (
                        <HeartSolidIcon className="h-4 w-4" />
                      ) : (
                        <HeartIcon className="h-4 w-4" />
                      )}
                      <span>{comment.likes}</span>
                    </button>
                    {(user?.id === comment.authorId || isAdmin) && (
                      <button
                        onClick={() => {
                          if (confirm('确定要删除这条评论吗？')) {
                            deleteCommentMutation.mutate(comment.id)
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-gray-700 dark:text-gray-300 ml-10">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            暂无评论，来发表第一条评论吧
          </p>
        )}
      </div>
    </div>
  )
}
