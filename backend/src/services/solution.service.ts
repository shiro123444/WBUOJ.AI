import { prisma } from '../config/database.js'
import { AppError } from '../types/index.js'
import { submissionService } from './submission.service.js'

// Input types
export interface CreateSolutionInput {
  problemId: string
  title: string
  content: string
  code?: string
  language?: string
}

export interface UpdateSolutionInput {
  title?: string
  content?: string
  code?: string
  language?: string
}

export interface SolutionListQuery {
  problemId: string
  sort?: 'hot' | 'new'
  page?: number
  limit?: number
}

export interface CreateCommentInput {
  solutionId: string
  content: string
}

// Response types
export interface SolutionListItem {
  id: string
  title: string
  authorId: string
  authorName: string
  authorAvatar: string | null
  likes: number
  views: number
  commentCount: number
  createdAt: Date
  // Content is hidden if user hasn't solved the problem
  contentPreview: string | null
  isContentHidden: boolean
}

export interface SolutionDetail {
  id: string
  problemId: string
  problemNumber: number
  problemTitle: string
  title: string
  content: string | null
  code: string | null
  language: string | null
  authorId: string
  authorName: string
  authorAvatar: string | null
  likes: number
  views: number
  isLiked: boolean
  createdAt: Date
  updatedAt: Date
  isContentHidden: boolean
  comments: CommentItem[]
}

export interface CommentItem {
  id: string
  authorId: string
  authorName: string
  authorAvatar: string | null
  content: string
  likes: number
  isLiked: boolean
  createdAt: Date
}

export class SolutionService {
  /**
   * Create a new solution (requires user to have solved the problem)
   */
  async createSolution(input: CreateSolutionInput, userId: string) {
    // Check if problem exists
    const problem = await prisma.problems.findUnique({
      where: { id: input.problemId },
      select: { id: true, number: true, title: true },
    })

    if (!problem) {
      throw new AppError(404, 'Problem not found', 'NOT_FOUND')
    }

    // Check if user has solved the problem
    const hasSolved = await submissionService.hasUserSolvedProblem(userId, input.problemId)
    if (!hasSolved) {
      throw new AppError(403, 'You must solve the problem before posting a solution', 'SOLUTION_001')
    }

    // Create solution
    const solution = await prisma.solutions.create({
      data: {
        problemId: input.problemId,
        authorId: userId,
        title: input.title,
        content: input.content,
        code: input.code,
        language: input.language,
      },
      include: {
        users: {
          select: { id: true, username: true, avatar: true },
        },
      },
    })

    return {
      id: solution.id,
      problemId: solution.problemId,
      title: solution.title,
      authorId: solution.users.id,
      authorName: solution.users.username,
      createdAt: solution.createdAt,
    }
  }

  /**
   * Get solution list for a problem with anti-spoiler logic
   */
  async getSolutions(query: SolutionListQuery, userId?: string) {
    const { problemId, sort = 'hot', page = 1, limit = 20 } = query
    const skip = (page - 1) * limit

    // Check if problem exists
    const problem = await prisma.problems.findUnique({
      where: { id: problemId },
      select: { id: true },
    })

    if (!problem) {
      throw new AppError(404, 'Problem not found', 'NOT_FOUND')
    }

    // Check if user has solved the problem (for anti-spoiler)
    let hasSolved = false
    if (userId) {
      hasSolved = await submissionService.hasUserSolvedProblem(userId, problemId)
    }

    // Build order by clause
    const orderBy = sort === 'hot' 
      ? { likes: 'desc' as const }
      : { createdAt: 'desc' as const }

    const [solutions, total] = await Promise.all([
      prisma.solutions.findMany({
        where: { problemId },
        skip,
        take: limit,
        orderBy,
        include: {
          users: {
            select: { id: true, username: true, avatar: true },
          },
          _count: {
            select: { comments: true },
          },
        },
      }),
      prisma.solutions.count({ where: { problemId } }),
    ])

    const solutionList: SolutionListItem[] = solutions.map((s) => ({
      id: s.id,
      title: s.title,
      authorId: s.users.id,
      authorName: s.users.username,
      authorAvatar: s.users.avatar,
      likes: s.likes,
      views: s.views,
      commentCount: s._count.comments,
      createdAt: s.createdAt,
      // Hide content preview if user hasn't solved the problem
      contentPreview: hasSolved ? s.content.substring(0, 200) : null,
      isContentHidden: !hasSolved,
    }))

    return {
      solutions: solutionList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Get solution detail with anti-spoiler logic
   */
  async getSolutionById(solutionId: string, userId?: string): Promise<SolutionDetail> {
    const solution = await prisma.solutions.findUnique({
      where: { id: solutionId },
      include: {
        problems: {
          select: { id: true, number: true, title: true },
        },
        users: {
          select: { id: true, username: true, avatar: true },
        },
        comments: {
          include: {
            users: {
              select: { id: true, username: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!solution) {
      throw new AppError(404, 'Solution not found', 'NOT_FOUND')
    }

    // Check if user has solved the problem (for anti-spoiler)
    let hasSolved = false
    if (userId) {
      hasSolved = await submissionService.hasUserSolvedProblem(userId, solution.problemId)
    }

    // Increment view count
    await prisma.solutions.update({
      where: { id: solutionId },
      data: { views: { increment: 1 } },
    })

    // Check if user has liked the solution
    let isLiked = false
    if (userId) {
      const like = await prisma.solution_likes.findUnique({
        where: {
          solutionId_userId: { solutionId, userId },
        },
      })
      isLiked = !!like
    }

    // Check which comments user has liked
    const likedCommentIds = new Set<string>()
    if (userId) {
      const commentLikes = await prisma.comment_likes.findMany({
        where: {
          commentId: { in: solution.comments.map((c) => c.id) },
          userId,
        },
        select: { commentId: true },
      })
      commentLikes.forEach((cl) => likedCommentIds.add(cl.commentId))
    }

    return {
      id: solution.id,
      problemId: solution.problems.id,
      problemNumber: solution.problems.number,
      problemTitle: solution.problems.title,
      title: solution.title,
      // Hide content if user hasn't solved the problem
      content: hasSolved ? solution.content : null,
      code: hasSolved ? solution.code : null,
      language: solution.language,
      authorId: solution.users.id,
      authorName: solution.users.username,
      authorAvatar: solution.users.avatar,
      likes: solution.likes,
      views: solution.views + 1, // Include current view
      isLiked,
      createdAt: solution.createdAt,
      updatedAt: solution.updatedAt,
      isContentHidden: !hasSolved,
      comments: solution.comments.map((c) => ({
        id: c.id,
        authorId: c.users.id,
        authorName: c.users.username,
        authorAvatar: c.users.avatar,
        content: c.content,
        likes: c.likes,
        isLiked: likedCommentIds.has(c.id),
        createdAt: c.createdAt,
      })),
    }
  }

  /**
   * Update a solution (author only)
   */
  async updateSolution(solutionId: string, input: UpdateSolutionInput, userId: string) {
    const solution = await prisma.solutions.findUnique({
      where: { id: solutionId },
      select: { authorId: true },
    })

    if (!solution) {
      throw new AppError(404, 'Solution not found', 'NOT_FOUND')
    }

    if (solution.authorId !== userId) {
      throw new AppError(403, 'You can only edit your own solutions', 'AUTH_004')
    }

    const updated = await prisma.solutions.update({
      where: { id: solutionId },
      data: {
        title: input.title,
        content: input.content,
        code: input.code,
        language: input.language,
      },
    })

    return {
      id: updated.id,
      title: updated.title,
      updatedAt: updated.updatedAt,
    }
  }

  /**
   * Delete a solution (author or admin only)
   */
  async deleteSolution(solutionId: string, userId: string, isAdmin: boolean) {
    const solution = await prisma.solutions.findUnique({
      where: { id: solutionId },
      select: { authorId: true },
    })

    if (!solution) {
      throw new AppError(404, 'Solution not found', 'NOT_FOUND')
    }

    if (solution.authorId !== userId && !isAdmin) {
      throw new AppError(403, 'You can only delete your own solutions', 'AUTH_004')
    }

    await prisma.solutions.delete({ where: { id: solutionId } })

    return { success: true }
  }

  /**
   * Like or unlike a solution
   */
  async toggleLike(solutionId: string, userId: string) {
    const solution = await prisma.solutions.findUnique({
      where: { id: solutionId },
      select: { id: true, likes: true },
    })

    if (!solution) {
      throw new AppError(404, 'Solution not found', 'NOT_FOUND')
    }

    // Check if already liked
    const existingLike = await prisma.solution_likes.findUnique({
      where: {
        solutionId_userId: { solutionId, userId },
      },
    })

    if (existingLike) {
      // Unlike
      await prisma.$transaction([
        prisma.solution_likes.delete({
          where: { id: existingLike.id },
        }),
        prisma.solutions.update({
          where: { id: solutionId },
          data: { likes: { decrement: 1 } },
        }),
      ])

      return { likes: solution.likes - 1, isLiked: false }
    } else {
      // Like
      await prisma.$transaction([
        prisma.solution_likes.create({
          data: { solutionId, userId },
        }),
        prisma.solutions.update({
          where: { id: solutionId },
          data: { likes: { increment: 1 } },
        }),
      ])

      return { likes: solution.likes + 1, isLiked: true }
    }
  }

  /**
   * Add a comment to a solution
   */
  async addComment(input: CreateCommentInput, userId: string) {
    const solution = await prisma.solutions.findUnique({
      where: { id: input.solutionId },
      select: { id: true },
    })

    if (!solution) {
      throw new AppError(404, 'Solution not found', 'NOT_FOUND')
    }

    const comment = await prisma.comments.create({
      data: {
        solutionId: input.solutionId,
        authorId: userId,
        content: input.content,
      },
      include: {
        users: {
          select: { id: true, username: true, avatar: true },
        },
      },
    })

    return {
      id: comment.id,
      authorId: comment.users.id,
      authorName: comment.users.username,
      authorAvatar: comment.users.avatar,
      content: comment.content,
      likes: comment.likes,
      isLiked: false,
      createdAt: comment.createdAt,
    }
  }

  /**
   * Delete a comment (author or admin only)
   */
  async deleteComment(commentId: string, userId: string, isAdmin: boolean) {
    const comment = await prisma.comments.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    })

    if (!comment) {
      throw new AppError(404, 'Comment not found', 'NOT_FOUND')
    }

    if (comment.authorId !== userId && !isAdmin) {
      throw new AppError(403, 'You can only delete your own comments', 'AUTH_004')
    }

    await prisma.comments.delete({ where: { id: commentId } })

    return { success: true }
  }

  /**
   * Like or unlike a comment
   */
  async toggleCommentLike(commentId: string, userId: string) {
    const comment = await prisma.comments.findUnique({
      where: { id: commentId },
      select: { id: true, likes: true },
    })

    if (!comment) {
      throw new AppError(404, 'Comment not found', 'NOT_FOUND')
    }

    // Check if already liked
    const existingLike = await prisma.comment_likes.findUnique({
      where: {
        commentId_userId: { commentId, userId },
      },
    })

    if (existingLike) {
      // Unlike
      await prisma.$transaction([
        prisma.comment_likes.delete({
          where: { id: existingLike.id },
        }),
        prisma.comments.update({
          where: { id: commentId },
          data: { likes: { decrement: 1 } },
        }),
      ])

      return { likes: comment.likes - 1, isLiked: false }
    } else {
      // Like
      await prisma.$transaction([
        prisma.comment_likes.create({
          data: { commentId, userId },
        }),
        prisma.comments.update({
          where: { id: commentId },
          data: { likes: { increment: 1 } },
        }),
      ])

      return { likes: comment.likes + 1, isLiked: true }
    }
  }
}

export const solutionService = new SolutionService()
