import { prisma } from '../config/database.js'
import { AppError } from '../types/index.js'
import crypto from 'crypto'

export interface CreateContestInput {
  title: string
  description: string
  startTime: string
  endTime: string
  maxParticipants?: number
  problemIds: string[]
}

export interface ContestListQuery {
  page?: number
  limit?: number
  status?: 'UPCOMING' | 'RUNNING' | 'ENDED'
}

class ContestService {
  async getContests(query: ContestListQuery) {
    const page = query.page || 1
    const limit = Math.min(query.limit || 20, 100)
    const skip = (page - 1) * limit

    const where = query.status ? { status: query.status } : {}

    const [contests, total] = await Promise.all([
      prisma.contests.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          start_time: true,
          end_time: true,
          max_participants: true,
          status: true,
          created_at: true,
          users: { select: { username: true } },
          _count: { select: { contest_entries: true, contest_problems: true } },
        },
        orderBy: { start_time: 'desc' },
        skip,
        take: limit,
      }),
      prisma.contests.count({ where }),
    ])

    return {
      contests: contests.map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        startTime: c.start_time.toISOString(),
        endTime: c.end_time.toISOString(),
        maxParticipants: c.max_participants,
        status: c.status.toLowerCase(),
        createdBy: c.users.username,
        participantCount: c._count.contest_entries,
        problemCount: c._count.contest_problems,
        createdAt: c.created_at.toISOString(),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getContestById(contestId: string, userId?: string) {
    const contest = await prisma.contests.findUnique({
      where: { id: contestId },
      include: {
        users: { select: { username: true } },
        contest_problems: {
          include: {
            problems: {
              select: { id: true, title: true, difficulty: true },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: { select: { contest_entries: true } },
      },
    })

    if (!contest) {
      throw new AppError(404, 'Contest not found', 'CONTEST_NOT_FOUND')
    }

    let isRegistered = false
    if (userId) {
      const entry = await prisma.contest_entries.findFirst({
        where: { contest_id: contestId, user_id: userId },
      })
      isRegistered = !!entry
    }

    return {
      id: contest.id,
      title: contest.title,
      description: contest.description,
      startTime: contest.start_time.toISOString(),
      endTime: contest.end_time.toISOString(),
      maxParticipants: contest.max_participants,
      status: contest.status.toLowerCase(),
      createdBy: contest.users.username,
      participantCount: contest._count.contest_entries,
      isRegistered,
      problems: contest.contest_problems.map((cp: any) => ({
        id: cp.problems.id,
        title: cp.problems.title,
        difficulty: cp.problems.difficulty.toLowerCase(),
        score: cp.score,
        order: cp.order,
      })),
      createdAt: contest.created_at.toISOString(),
    }
  }

  async createContest(userId: string, input: CreateContestInput) {
    const startTime = new Date(input.startTime)
    const endTime = new Date(input.endTime)

    if (endTime <= startTime) {
      throw new AppError(400, 'End time must be after start time', 'INVALID_TIME_RANGE')
    }

    const now = new Date()
    const status = startTime > now ? 'UPCOMING' : startTime <= now && endTime > now ? 'RUNNING' : 'ENDED'

    const contest = await prisma.contests.create({
      data: {
        id: crypto.randomUUID(),
        title: input.title,
        description: input.description,
        start_time: startTime,
        end_time: endTime,
        max_participants: input.maxParticipants || null,
        status,
        created_by_id: userId,
        updated_at: now,
        contest_problems: {
          create: input.problemIds.map((pid, i) => ({
            id: crypto.randomUUID(),
            problem_id: pid,
            order: i + 1,
            score: 100,
          })),
        },
      },
    })

    return { id: contest.id }
  }

  async registerForContest(contestId: string, userId: string) {
    const contest = await prisma.contests.findUnique({
      where: { id: contestId },
      include: { _count: { select: { contest_entries: true } } },
    })

    if (!contest) {
      throw new AppError(404, 'Contest not found', 'CONTEST_NOT_FOUND')
    }

    if (contest.status === 'ENDED') {
      throw new AppError(400, 'Contest has ended', 'CONTEST_ENDED')
    }

    if (contest.status !== 'UPCOMING' && contest.status !== 'RUNNING') {
      throw new AppError(400, 'Contest is not open for registration', 'CONTEST_NOT_OPEN')
    }

    if (contest.max_participants && contest._count.contest_entries >= contest.max_participants) {
      throw new AppError(400, 'Contest is full', 'CONTEST_FULL')
    }

    const existing = await prisma.contest_entries.findFirst({
      where: { contest_id: contestId, user_id: userId },
    })

    if (existing) {
      throw new AppError(400, 'Already registered', 'ALREADY_REGISTERED')
    }

    await prisma.contest_entries.create({
      data: {
        id: crypto.randomUUID(),
        contest_id: contestId,
        user_id: userId,
      },
    })
  }

  async getContestLeaderboard(contestId: string) {
    const entries = await prisma.contest_entries.findMany({
      where: { contest_id: contestId },
      select: {
        user_id: true,
        total_score: true,
        rank: true,
        users: { select: { username: true, avatar: true } },
      },
      orderBy: [{ total_score: 'desc' }, { joined_at: 'asc' }],
    })

    return entries.map((e: any, i: number) => ({
      rank: i + 1,
      userId: e.user_id,
      username: e.users.username,
      avatar: e.users.avatar,
      totalScore: e.total_score,
    }))
  }
}

export const contestService = new ContestService()
