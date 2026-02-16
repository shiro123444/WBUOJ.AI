import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChatBubbleLeftRightIcon,
  EyeIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  MapPinIcon,
  LockClosedIcon,
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { HandThumbUpIcon as HandThumbUpSolidIcon, HandThumbDownIcon as HandThumbDownSolidIcon } from '@heroicons/react/24/solid'
import { discussionService, type ReplyItem } from '../services/discussion'
import { EnhancedMarkdown } from '../components/common'
import { useAuthStore } from '../stores/authStore'
import { GlassPageWrapper } from '../components/ui/GlassCard'
import { XMarkIcon } from '@heroicons/react/24/outline'

export function DiscussionDetail() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()
  const [replyContent, setReplyContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null)
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const { data: discussionData, isLoading, error } = useQuery({
    queryKey: ['discussion', id],
    queryFn: () => discussionService.getDiscussionById(id!),
    enabled: !!id,
  })

  const { data: repliesData, refetch: refetchReplies } = useQuery({
    queryKey: ['discussion-replies', id],
    queryFn: () => discussionService.getReplies(id!),
    enabled: !!id,
  })

  const discussion = discussionData?.discussion
  const replies = repliesData?.replies ?? []

  const reactMutation = useMutation({
    mutationFn: (type: 'LIKE' | 'DISLIKE') => discussionService.reactToDiscussion(id!, type),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['discussion', id] }),
  })

  const createReplyMutation = useMutation({
    mutationFn: () =>
      discussionService.createReply(id!, replyContent.trim(), replyingTo?.id, replyingTo ? [replyingTo.name] : undefined),
    onSuccess: () => {
      setReplyContent('')
      setReplyingTo(null)
      refetchReplies()
      queryClient.invalidateQueries({ queryKey: ['discussion', id] })
    },
  })

  const updateReplyMutation = useMutation({
    mutationFn: ({ replyId, content }: { replyId: string; content: string }) =>
      discussionService.updateReply(id!, replyId, content),
    onSuccess: () => { setEditingReplyId(null); setEditContent(''); refetchReplies() },
  })

  const deleteReplyMutation = useMutation({
    mutationFn: (replyId: string) => discussionService.deleteReply(id!, replyId),
    onSuccess: () => { refetchReplies(); queryClient.invalidateQueries({ queryKey: ['discussion', id] }) },
  })

  const replyReactMutation = useMutation({
    mutationFn: ({ replyId, type }: { replyId: string; type: 'LIKE' | 'DISLIKE' }) =>
      discussionService.reactToReply(id!, replyId, type),
    onSuccess: () => refetchReplies(),
  })

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes} 分钟前`
    const hours = Math.floor(minutes / 66)
    if (hours < 24) return `${hours} 小时前`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days} 天前`
    return date.toLocaleDateString('zh-CN')
  }

  const renderReply = (reply: ReplyItem, isChild = false) => (
    <div key={reply.id} className={`${isChild ? 'ml-8 border-l-2 border-gray-200/50 dark:border-white/5 pl-4' : ''}`}>
      <div className="py-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ring-2 ring-white/50 dark:ring-white/10">
            {reply.authorAvatar ? (
              <img src={reply.authorAvatar} alt="" className="w-8 h-8 rounded-full" />
            ) : (
              reply.authorName[0]?.toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-900 dark:text-white">{reply.authorName}</span>
              {reply.mentions.length > 0 && (
                <span className="text-gray-400">回复 <span className="text-blue-500">@{reply.mentions[0]}</span></span>
              )}
              <span className="text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <ClockIcon className="w-3.5 h-3.5" />{formatTime(reply.createdAt)}
              </span>
              {reply.isEdited && <span className="text-gray-400 dark:text-gray-500 text-xs">（已编辑）</span>}
            </div>

            {editingReplyId === reply.id ? (
              <div className="mt-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 glass-input rounded-xl text-gray-900 dark:text-white focus:outline-none resize-y text-sm"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => updateReplyMutation.mutate({ replyId: reply.id, content: editContent })}
                    disabled={!editContent.trim()}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => { setEditingReplyId(null); setEditContent('') }}
                    className="glass-btn px-3 py-1.5 rounded-lg text-xs text-gray-500"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-1.5 text-sm text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none">
                <EnhancedMarkdown content={reply.content} />
              </div>
            )}

            <div className="flex items-center gap-3 mt-2.5">
              <button
                onClick={() => isAuthenticated && replyReactMutation.mutate({ replyId: reply.id, type: 'LIKE' })}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  reply.userReaction === 'LIKE' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                {reply.userReaction === 'LIKE' ? <HandThumbUpSolidIcon className="w-3.5 h-3.5" /> : <HandThumbUpIcon className="w-3.5 h-3.5" />}
                {reply.likes > 0 && reply.likes}
              </button>
              <button
                onClick={() => isAuthenticated && replyReactMutation.mutate({ replyId: reply.id, type: 'DISLIKE' })}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  reply.userReaction === 'DISLIKE' ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                }`}
              >
                {reply.userReaction === 'DISLIKE' ? <HandThumbDownSolidIcon className="w-3.5 h-3.5" /> : <HandThumbDownIcon className="w-3.5 h-3.5" />}
                {reply.dislikes > 0 && reply.dislikes}
              </button>
              {isAuthenticated && !discussion?.isLocked && (
                <button
                  onClick={() => { setReplyingTo({ id: reply.id, name: reply.authorName }); setReplyContent('') }}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <ArrowUturnLeftIcon className="w-3.5 h-3.5" />回复
                </button>
              )}
              {user?.userId === reply.authorId && (
                <>
                  <button
                    onClick={() => { setEditingReplyId(reply.id); setEditContent(reply.content) }}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-yellow-600 transition-colors"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />编辑
                  </button>
                  <button
                    onClick={() => { if (confirm('确定删除这条回复？')) deleteReplyMutation.mutate(reply.id) }}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />删除
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {reply.children && reply.children.length > 0 && (
        <div>{reply.children.map((child) => renderReply(child, true))}</div>
      )}
    </div>
  )

  if (isLoading) {
    return (
      <GlassPageWrapper>
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
          <div className="h-8 w-48 glass-skeleton" />
          <div className="h-48 glass-skeleton" />
          <div className="h-64 glass-skeleton" />
        </div>
      </GlassPageWrapper>
    )
  }

  if (error || !discussion) {
    return (
      <GlassPageWrapper>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <div className="glass-card-static p-12">
            <p className="text-red-500">讨论不存在或加载失败</p>
          </div>
        </div>
      </GlassPageWrapper>
    )
  }

  return (
    <GlassPageWrapper>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          to={`/discussions?problemId=${discussion.problemId}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4 transition-colors glass-animate-in"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          返回讨论列表
        </Link>

        {/* Problem link */}
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 glass-animate-in">
          <Link to={`/problems/${discussion.problemId}`} className="glass-badge px-3 py-1 rounded-full hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1">
            #{discussion.problemNumber} {discussion.problemTitle}
          </Link>
        </div>

        {/* Discussion Header */}
        <div className="glass-card-static p-6 mb-6 glass-animate-in glass-animate-in-delay-1">
          <div className="flex items-center gap-2 mb-3">
            {discussion.isPinned && <MapPinIcon className="w-5 h-5 text-orange-500" />}
            {discussion.isLocked && <LockClosedIcon className="w-5 h-5 text-red-500" />}
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{discussion.title}</h1>
          </div>

          <div className="flex items-center gap-3 mb-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium ring-2 ring-white/50 dark:ring-white/10">
              {discussion.authorAvatar ? (
                <img src={discussion.authorAvatar} alt="" className="w-7 h-7 rounded-full" />
              ) : (
                discussion.authorName[0]?.toUpperCase()
              )}
            </div>
            <span className="font-medium text-gray-700 dark:text-gray-300">{discussion.authorName}</span>
            <span>{formatTime(discussion.createdAt)}</span>
            <span className="flex items-center gap-1"><EyeIcon className="w-4 h-4" />{discussion.views}</span>
          </div>

          {discussion.tags.length > 0 && (
            <div className="flex gap-1.5 mb-4">
              {discussion.tags.map((tag) => (
                <span key={tag} className="glass-badge px-2.5 py-0.5 text-xs rounded-full text-gray-600 dark:text-gray-300">{tag}</span>
              ))}
            </div>
          )}

          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
            <EnhancedMarkdown content={discussion.content} />
          </div>

          {/* Reactions */}
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-200/50 dark:border-white/5">
            <button
              onClick={() => isAuthenticated && reactMutation.mutate('LIKE')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all ${
                discussion.userReaction === 'LIKE'
                  ? 'glass-btn glass-btn-active'
                  : 'glass-btn text-gray-600 dark:text-gray-400'
              }`}
            >
              {discussion.userReaction === 'LIKE' ? <HandThumbUpSolidIcon className="w-4 h-4" /> : <HandThumbUpIcon className="w-4 h-4" />}
              {discussion.likes}
            </button>
            <button
              onClick={() => isAuthenticated && reactMutation.mutate('DISLIKE')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all ${
                discussion.userReaction === 'DISLIKE'
                  ? 'glass-btn text-red-500 bg-red-500/10 border-red-500/30'
                  : 'glass-btn text-gray-600 dark:text-gray-400'
              }`}
            >
              {discussion.userReaction === 'DISLIKE' ? <HandThumbDownSolidIcon className="w-4 h-4" /> : <HandThumbDownIcon className="w-4 h-4" />}
              {discussion.dislikes}
            </button>
            <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 ml-auto">
              <ChatBubbleLeftRightIcon className="w-4 h-4" />{discussion.replyCount} 条回复
            </span>
          </div>
        </div>

        {/* Replies */}
        <div className="glass-card-static overflow-hidden glass-animate-in glass-animate-in-delay-2">
          <div className="px-6 py-4 border-b border-gray-200/50 dark:border-white/5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">回复 ({discussion.replyCount})</h2>
          </div>

          {replies.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500 dark:text-gray-400 text-sm">暂无回复，来说点什么吧</div>
          ) : (
            <div className="px-6 divide-y divide-gray-100/50 dark:divide-white/[0.03]">
              {replies.map((reply) => renderReply(reply))}
            </div>
          )}

          {/* Reply Input */}
          {isAuthenticated && !discussion.isLocked && (
            <div className="px-6 py-4 border-t border-gray-200/50 dark:border-white/5">
              {replyingTo && (
                <div className="flex items-center gap-2 mb-2 text-sm text-blue-600 dark:text-blue-400">
                  <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
                  回复 @{replyingTo.name}
                  <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600 ml-1">
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="flex gap-3">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="写下你的回复..."
                  rows={2}
                  className="flex-1 px-4 py-2.5 glass-input rounded-xl text-gray-900 dark:text-white focus:outline-none resize-y text-sm"
                />
                <button
                  onClick={() => createReplyMutation.mutate()}
                  disabled={!replyContent.trim() || createReplyMutation.isPending}
                  className="self-end px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                >
                  {createReplyMutation.isPending ? '发送中...' : '回复'}
                </button>
              </div>
            </div>
          )}

          {discussion.isLocked && (
            <div className="px-6 py-4 border-t border-gray-200/50 dark:border-white/5 text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
              <LockClosedIcon className="w-4 h-4" />该讨论已锁定，无法回复
            </div>
          )}
        </div>
      </div>
    </GlassPageWrapper>
  )
}
