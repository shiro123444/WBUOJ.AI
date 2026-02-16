import crypto from 'crypto'
import { prisma } from '../config/database.js'
import { AppError } from '../types/index.js'

// Input types
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

export interface DiscussionListQuery {
  problemId: string
  sort?: 'newest' | 'hottest' | 'most_replies'
  tag?: string
  page?: number
  limit?: number
}

export interface CreateReplyInput {
  discussionId: string
  content: string
  parentId?: string
  mentions?: string[]
}

export interface UpdateReplyInput {
  content: string
}

// Response types
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
  createdAt: Date
  updatedAt: Date
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
  createdAt: Date
  updatedAt: Date
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
  editedAt: Date | null
  userReaction: string | null
  createdAt: Date
  children?: ReplyItem[]
}

export class DiscussionService {
  /**
   * Get discussions for a problem
   */
  async getDiscussions(query: DiscussionListQuery): Promise<{
    discussions: DiscussionListItem[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    const { problemId, sort = 'newest', tag, page = 1, limit = 20 } = query
    const skip = (page - 1) * limit

    const baseWhere = tag
      ? { problem_id: problemId, tags: { has: tag } }
      : { problem_id: problemId }

    const discussions = await prisma.discussions.findMany({
      where: baseWhere,
      orderBy:
        sort === 'hottest'
          ? [{ is_pinned: 'desc' as const }, { likes: 'desc' as const }]
          : sort === 'most_replies'
            ? [{ is_pinned: 'desc' as const }, { reply_count: 'desc' as const }]
            : [{ is_pinned: 'desc' as const }, { created_at: 'desc' as const }],
      skip,
      take: limit,
      include: {
        users: { select: { id: true, username: true, avatar: true } },
      },
    })
    const total = await prisma.discussions.count({ where: baseWhere })

    type DiscussionRow = typeof discussions[number]

    return {
      discussions: discussions.map((d: DiscussionRow) => ({
        id: d.id,
        title: d.title,
        authorId: d.users.id,
        authorName: d.users.username,
        authorAvatar: d.users.avatar,
        views: d.views,
        likes: d.likes,
        dislikes: d.dislikes,
        replyCount: d.reply_count,
        isPinned: d.is_pinned,
        isLocked: d.is_locked,
        tags: d.tags,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Get discussion detail by ID
   */
  async getDiscussionById(id: string, userId?: string): Promise<DiscussionDetail> {
    const discussion = await prisma.discussions.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, username: true, avatar: true } },
        problems: { select: { id: true, number: true, title: true } },
      },
    })

    if (!discussion) {
      throw new AppError(404, 'Discussion not found', 'DISCUSSION_NOT_FOUND')
    }

    // Increment view count
    await prisma.discussions.update({
      where: { id },
      data: { views: { increment: 1 } },
    })

    // Get user's reaction
    let userReaction: string | null = null
    if (userId) {
      const reaction = await prisma.reactions.findFirst({
        where: {
          target_type: 'DISCUSSION',
          target_id: id,
          user_id: userId,
        },
      })
      userReaction = reaction?.type ?? null
    }

    return {
      id: discussion.id,
      problemId: discussion.problems.id,
      problemNumber: discussion.problems.number,
      problemTitle: discussion.problems.title,
      title: discussion.title,
      content: discussion.content,
      authorId: discussion.users.id,
      authorName: discussion.users.username,
      authorAvatar: discussion.users.avatar,
      views: discussion.views + 1,
      likes: discussion.likes,
      dislikes: discussion.dislikes,
      replyCount: discussion.reply_count,
      isPinned: discussion.is_pinned,
      isLocked: discussion.is_locked,
      tags: discussion.tags,
      userReaction,
      createdAt: discussion.created_at,
      updatedAt: discussion.updated_at,
    }
  }

  /**
   * Create a new discussion
   */
  async createDiscussion(input: CreateDiscussionInput, userId: string): Promise<{ id: string; title: string }> {
    // Verify problem exists
    const problem = await prisma.problems.findUnique({ where: { id: input.problemId } })
    if (!problem) {
      throw new AppError(404, 'Problem not found', 'PROBLEM_NOT_FOUND')
    }

    const id = crypto.randomUUID()
    const now = new Date()

    const discussion = await prisma.discussions.create({
      data: {
        id,
        problem_id: input.problemId,
        author_id: userId,
        title: input.title,
        content: input.content,
        tags: input.tags ?? [],
        updated_at: now,
      },
    })

    return { id: discussion.id, title: discussion.title }
  }

  /**
   * Update a discussion (author only)
   */
  async updateDiscussion(id: string, input: UpdateDiscussionInput, userId: string): Promise<{ id: string; title: string }> {
    const discussion = await prisma.discussions.findUnique({ where: { id } })
    if (!discussion) {
      throw new AppError(404, 'Discussion not found', 'DISCUSSION_NOT_FOUND')
    }
    if (discussion.author_id !== userId) {
      throw new AppError(403, 'Not authorized to update this discussion', 'FORBIDDEN')
    }

    const updated = await prisma.discussions.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.content !== undefined && { content: input.content }),
        ...(input.tags !== undefined && { tags: input.tags }),
        updated_at: new Date(),
      },
    })

    return { id: updated.id, title: updated.title }
  }

  /**
   * Delete a discussion (author or admin)
   */
  async deleteDiscussion(id: string, userId: string, isAdmin: boolean): Promise<void> {
    const discussion = await prisma.discussions.findUnique({ where: { id } })
    if (!discussion) {
      throw new AppError(404, 'Discussion not found', 'DISCUSSION_NOT_FOUND')
    }
    if (discussion.author_id !== userId && !isAdmin) {
      throw new AppError(403, 'Not authorized to delete this discussion', 'FORBIDDEN')
    }

    await prisma.discussions.delete({ where: { id } })
  }

  /**
   * React to a discussion (like/dislike)
   */
  async reactToDiscussion(
    discussionId: string,
    userId: string,
    type: 'LIKE' | 'DISLIKE'
  ): Promise<{ likes: number; dislikes: number; userReaction: string | null }> {
    const discussion = await prisma.discussions.findUnique({ where: { id: discussionId } })
    if (!discussion) {
      throw new AppError(404, 'Discussion not found', 'DISCUSSION_NOT_FOUND')
    }

    const existing = await prisma.reactions.findFirst({
      where: {
        target_type: 'DISCUSSION',
        target_id: discussionId,
        user_id: userId,
      },
    })

    let newLikes = discussion.likes
    let newDislikes = discussion.dislikes
    let userReaction: string | null = null

    if (existing) {
      if (existing.type === type) {
        // Remove reaction (toggle off)
        await prisma.reactions.delete({ where: { id: existing.id } })
        if (type === 'LIKE') newLikes--
        else newDislikes--
      } else {
        // Switch reaction
        await prisma.reactions.update({ where: { id: existing.id }, data: { type } })
        if (type === 'LIKE') {
          newLikes++
          newDislikes--
        } else {
          newLikes--
          newDislikes++
        }
        userReaction = type
      }
    } else {
      // New reaction
      await prisma.reactions.create({
        data: {
          id: crypto.randomUUID(),
          target_type: 'DISCUSSION',
          target_id: discussionId,
          user_id: userId,
          type,
        },
      })
      if (type === 'LIKE') newLikes++
      else newDislikes++
      userReaction = type
    }

    await prisma.discussions.update({
      where: { id: discussionId },
      data: { likes: newLikes, dislikes: newDislikes },
    })

    return { likes: newLikes, dislikes: newDislikes, userReaction }
  }

  /**
   * Pin/unpin a discussion (admin only)
   */
  async togglePin(id: string): Promise<{ isPinned: boolean }> {
    const discussion = await prisma.discussions.findUnique({ where: { id } })
    if (!discussion) {
      throw new AppError(404, 'Discussion not found', 'DISCUSSION_NOT_FOUND')
    }

    const updated = await prisma.discussions.update({
      where: { id },
      data: { is_pinned: !discussion.is_pinned },
    })

    return { isPinned: updated.is_pinned }
  }

  /**
   * Lock/unlock a discussion (admin only)
   */
  async toggleLock(id: string): Promise<{ isLocked: boolean }> {
    const discussion = await prisma.discussions.findUnique({ where: { id } })
    if (!discussion) {
      throw new AppError(404, 'Discussion not found', 'DISCUSSION_NOT_FOUND')
    }

    const updated = await prisma.discussions.update({
      where: { id },
      data: { is_locked: !discussion.is_locked },
    })

    return { isLocked: updated.is_locked }
  }

  // ==================== Replies ====================

  /**
   * Get replies for a discussion
   */
  async getReplies(
    discussionId: string,
    userId?: string,
    page = 1,
    limit = 50
  ): Promise<{
    replies: ReplyItem[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    const skip = (page - 1) * limit

    // Get top-level replies
    const topReplies = await prisma.replies.findMany({
      where: { discussion_id: discussionId, parent_id: null },
      orderBy: { created_at: 'asc' },
      skip,
      take: limit,
      include: {
        users: { select: { id: true, username: true, avatar: true } },
        other_replies: {
          orderBy: { created_at: 'asc' },
          include: {
            users: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
    })
    const total = await prisma.replies.count({ where: { discussion_id: discussionId, parent_id: null } })

    type TopReply = typeof topReplies[number]
    type ChildReply = TopReply['other_replies'][number]

    // Get user reactions for all reply IDs
    const allReplyIds: string[] = []
    for (const r of topReplies) {
      allReplyIds.push(r.id)
      for (const c of r.other_replies) {
        allReplyIds.push(c.id)
      }
    }
    let userReactions: Map<string, string> = new Map()
    if (userId && allReplyIds.length > 0) {
      const reactions = await prisma.reactions.findMany({
        where: {
          target_type: 'REPLY',
          target_id: { in: allReplyIds },
          user_id: userId,
        },
      })
      for (const r of reactions) {
        userReactions.set(r.target_id, r.type)
      }
    }

    const mapReply = (r: TopReply | ChildReply): ReplyItem => ({
      id: r.id,
      authorId: r.users.id,
      authorName: r.users.username,
      authorAvatar: r.users.avatar,
      parentId: r.parent_id,
      depth: r.depth,
      content: r.content,
      likes: r.likes,
      dislikes: r.dislikes,
      mentions: r.mentions,
      isEdited: r.is_edited,
      editedAt: r.edited_at,
      userReaction: userReactions.get(r.id) ?? null,
      createdAt: r.created_at,
    })

    const replies: ReplyItem[] = topReplies.map((r: TopReply) => ({
      ...mapReply(r),
      children: r.other_replies.map((c: ChildReply) => mapReply(c)),
    }))

    return { replies, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  /**
   * Create a reply
   */
  async createReply(input: CreateReplyInput, userId: string): Promise<ReplyItem> {
    const discussion = await prisma.discussions.findUnique({ where: { id: input.discussionId } })
    if (!discussion) {
      throw new AppError(404, 'Discussion not found', 'DISCUSSION_NOT_FOUND')
    }
    if (discussion.is_locked) {
      throw new AppError(403, 'Discussion is locked', 'DISCUSSION_LOCKED')
    }

    let depth = 0
    if (input.parentId) {
      const parent = await prisma.replies.findUnique({ where: { id: input.parentId } })
      if (!parent || parent.discussion_id !== input.discussionId) {
        throw new AppError(404, 'Parent reply not found', 'REPLY_NOT_FOUND')
      }
      depth = Math.min(parent.depth + 1, 2) // Max depth of 2
    }

    const id = crypto.randomUUID()

    const [reply] = await Promise.all([
      prisma.replies.create({
        data: {
          id,
          discussion_id: input.discussionId,
          author_id: userId,
          parent_id: input.parentId ?? null,
          depth,
          content: input.content,
          mentions: input.mentions ?? [],
        },
        include: {
          users: { select: { id: true, username: true, avatar: true } },
        },
      }),
      prisma.discussions.update({
        where: { id: input.discussionId },
        data: { reply_count: { increment: 1 }, updated_at: new Date() },
      }),
    ])

    return {
      id: reply.id,
      authorId: reply.users.id,
      authorName: reply.users.username,
      authorAvatar: reply.users.avatar,
      parentId: reply.parent_id,
      depth: reply.depth,
      content: reply.content,
      likes: reply.likes,
      dislikes: reply.dislikes,
      mentions: reply.mentions,
      isEdited: reply.is_edited,
      editedAt: reply.edited_at,
      userReaction: null,
      createdAt: reply.created_at,
    }
  }

  /**
   * Update a reply (author only)
   */
  async updateReply(replyId: string, input: UpdateReplyInput, userId: string): Promise<ReplyItem> {
    const reply = await prisma.replies.findUnique({
      where: { id: replyId },
      include: { users: { select: { id: true, username: true, avatar: true } } },
    })
    if (!reply) {
      throw new AppError(404, 'Reply not found', 'REPLY_NOT_FOUND')
    }
    if (reply.author_id !== userId) {
      throw new AppError(403, 'Not authorized to update this reply', 'FORBIDDEN')
    }

    const updated = await prisma.replies.update({
      where: { id: replyId },
      data: { content: input.content, is_edited: true, edited_at: new Date() },
      include: { users: { select: { id: true, username: true, avatar: true } } },
    })

    return {
      id: updated.id,
      authorId: updated.users.id,
      authorName: updated.users.username,
      authorAvatar: updated.users.avatar,
      parentId: updated.parent_id,
      depth: updated.depth,
      content: updated.content,
      likes: updated.likes,
      dislikes: updated.dislikes,
      mentions: updated.mentions,
      isEdited: updated.is_edited,
      editedAt: updated.edited_at,
      userReaction: null,
      createdAt: updated.created_at,
    }
  }

  /**
   * Delete a reply (author or admin)
   */
  async deleteReply(replyId: string, userId: string, isAdmin: boolean): Promise<void> {
    const reply = await prisma.replies.findUnique({
      where: { id: replyId },
      include: { discussions: true },
    })
    if (!reply) {
      throw new AppError(404, 'Reply not found', 'REPLY_NOT_FOUND')
    }
    if (reply.author_id !== userId && !isAdmin) {
      throw new AppError(403, 'Not authorized to delete this reply', 'FORBIDDEN')
    }

    // Count this reply + its children for decrementing reply_count
    const childCount = await prisma.replies.count({ where: { parent_id: replyId } })

    await Promise.all([
      prisma.replies.delete({ where: { id: replyId } }),
      prisma.discussions.update({
        where: { id: reply.discussion_id },
        data: { reply_count: { decrement: 1 + childCount } },
      }),
    ])
  }

  /**
   * React to a reply (like/dislike)
   */
  async reactToReply(
    replyId: string,
    userId: string,
    type: 'LIKE' | 'DISLIKE'
  ): Promise<{ likes: number; dislikes: number; userReaction: string | null }> {
    const reply = await prisma.replies.findUnique({ where: { id: replyId } })
    if (!reply) {
      throw new AppError(404, 'Reply not found', 'REPLY_NOT_FOUND')
    }

    const existing = await prisma.reactions.findFirst({
      where: {
        target_type: 'REPLY',
        target_id: replyId,
        user_id: userId,
      },
    })

    let newLikes = reply.likes
    let newDislikes = reply.dislikes
    let userReaction: string | null = null

    if (existing) {
      if (existing.type === type) {
        await prisma.reactions.delete({ where: { id: existing.id } })
        if (type === 'LIKE') newLikes--
        else newDislikes--
      } else {
        await prisma.reactions.update({ where: { id: existing.id }, data: { type } })
        if (type === 'LIKE') {
          newLikes++
          newDislikes--
        } else {
          newLikes--
          newDislikes++
        }
        userReaction = type
      }
    } else {
      await prisma.reactions.create({
        data: {
          id: crypto.randomUUID(),
          target_type: 'REPLY',
          target_id: replyId,
          user_id: userId,
          type,
        },
      })
      if (type === 'LIKE') newLikes++
      else newDislikes++
      userReaction = type
    }

    await prisma.replies.update({
      where: { id: replyId },
      data: { likes: newLikes, dislikes: newDislikes },
    })

    return { likes: newLikes, dislikes: newDislikes, userReaction }
  }
}

export const discussionService = new DiscussionService()
