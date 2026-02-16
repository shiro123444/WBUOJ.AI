import { api } from './api'

// Types
export interface DiscussionListItem {
  id: string
  title: string
  authorId: string
  authorName: string
  authorAvatar: string | null
  views: number
  likes: number
  dislikes: number
  replyCount: number
  isPinned: boolean
  isLocked: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface DiscussionDetail {
  id: string
  problemId: string
  problemNumber: number
  problemTitle: string
  title: string
  content: string
  authorId: string
  authorName: string
  authorAvatar: string | null
  views: number
  likes: number
  dislikes: number
  replyCount: number
  isPinned: boolean
  isLocked: boolean
  tags: string[]
  userReaction: string | null
  createdAt: string
  updatedAt: string
}

export interface ReplyItem {
  id: string
  authorId: string
  authorName: string
  authorAvatar: string | null
  parentId: string | null
  depth: number
  content: string
  likes: number
  dislikes: number
  mentions: string[]
  isEdited: boolean
  editedAt: string | null
  userReaction: string | null
  createdAt: string
  children?: ReplyItem[]
}

export interface DiscussionListResponse {
  discussions: DiscussionListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface RepliesResponse {
  replies: ReplyItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ReactionResponse {
  likes: number
  dislikes: number
  userReaction: string | null
}

export interface CreateDiscussionInput {
  problemId: string
  title: string
  content: string
  tags?: string[]
}

export interface UpdateDiscussionInput {
  title?: string
  content?: string
  tags?: string[]
}

class DiscussionService {
  async getDiscussions(
    problemId: string,
    options: { sort?: 'newest' | 'hottest' | 'most_replies'; tag?: string; page?: number; limit?: number } = {}
  ): Promise<DiscussionListResponse> {
    const params = new URLSearchParams()
    params.set('problemId', problemId)
    if (options.sort) params.set('sort', options.sort)
    if (options.tag) params.set('tag', options.tag)
    if (options.page) params.set('page', String(options.page))
    if (options.limit) params.set('limit', String(options.limit))
    return api.get<DiscussionListResponse>(`/discussions?${params.toString()}`)
  }

  async getDiscussionById(id: string): Promise<{ discussion: DiscussionDetail }> {
    return api.get<{ discussion: DiscussionDetail }>(`/discussions/${id}`)
  }

  async createDiscussion(input: CreateDiscussionInput): Promise<{ discussion: { id: string; title: string } }> {
    return api.post<{ discussion: { id: string; title: string } }>('/discussions', input)
  }

  async updateDiscussion(id: string, input: UpdateDiscussionInput): Promise<{ discussion: { id: string; title: string } }> {
    return api.put<{ discussion: { id: string; title: string } }>(`/discussions/${id}`, input)
  }

  async deleteDiscussion(id: string): Promise<void> {
    await api.delete(`/discussions/${id}`)
  }

  async reactToDiscussion(id: string, type: 'LIKE' | 'DISLIKE'): Promise<ReactionResponse> {
    return api.post<ReactionResponse>(`/discussions/${id}/react`, { type })
  }

  async togglePin(id: string): Promise<{ isPinned: boolean }> {
    return api.post<{ isPinned: boolean }>(`/discussions/${id}/pin`)
  }

  async toggleLock(id: string): Promise<{ isLocked: boolean }> {
    return api.post<{ isLocked: boolean }>(`/discussions/${id}/lock`)
  }

  // Replies
  async getReplies(discussionId: string, options: { page?: number; limit?: number } = {}): Promise<RepliesResponse> {
    const params = new URLSearchParams()
    if (options.page) params.set('page', String(options.page))
    if (options.limit) params.set('limit', String(options.limit))
    const qs = params.toString()
    return api.get<RepliesResponse>(`/discussions/${discussionId}/replies${qs ? `?${qs}` : ''}`)
  }

  async createReply(
    discussionId: string,
    content: string,
    parentId?: string,
    mentions?: string[]
  ): Promise<{ reply: ReplyItem }> {
    return api.post<{ reply: ReplyItem }>(`/discussions/${discussionId}/replies`, {
      content,
      parentId,
      mentions,
    })
  }

  async updateReply(discussionId: string, replyId: string, content: string): Promise<{ reply: ReplyItem }> {
    return api.put<{ reply: ReplyItem }>(`/discussions/${discussionId}/replies/${replyId}`, { content })
  }

  async deleteReply(discussionId: string, replyId: string): Promise<void> {
    await api.delete(`/discussions/${discussionId}/replies/${replyId}`)
  }

  async reactToReply(discussionId: string, replyId: string, type: 'LIKE' | 'DISLIKE'): Promise<ReactionResponse> {
    return api.post<ReactionResponse>(`/discussions/${discussionId}/replies/${replyId}/react`, { type })
  }
}

export const discussionService = new DiscussionService()
