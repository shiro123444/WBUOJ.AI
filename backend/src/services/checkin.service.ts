import { prisma } from '../config/database.js'
import { AppError } from '../types/index.js'
import { badgeService } from './badge.service.js'
import crypto from 'crypto'

// 经验值等级表：每级所需累计经验
const LEVEL_THRESHOLDS = [
  0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200,
  6600, 8200, 10000, 12000, 14500, 17500, 21000, 25000, 30000, 36000,
]

// 签到奖励配置
const CHECK_IN_BASE_XP = 10
const CHECK_IN_BASE_POINTS = 5
const STREAK_BONUS_INTERVAL = 7 // 每7天连续签到额外奖励
const STREAK_BONUS_XP = 50
const STREAK_BONUS_POINTS = 30
const MILESTONES = [7, 30, 100, 365] // 里程碑天数

function getDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0]
}

function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

function getXpForNextLevel(level: number): number {
  if (level >= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] * 2
  return LEVEL_THRESHOLDS[level]
}

class CheckInService {
  async checkIn(userId: string) {
    const today = getDateString()

    // 检查今天是否已签到
    const existing = await prisma.check_ins.findUnique({
      where: { user_id_date: { user_id: userId, date: today } },
    })

    if (existing) {
      throw new AppError(400, '今天已经签到过了', 'ALREADY_CHECKED_IN')
    }

    // 获取用户信息
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        level: true,
        xp: true,
        total_points: true,
        active_points: true,
        current_streak: true,
        max_streak: true,
        total_check_ins: true,
        last_check_in_date: true,
      },
    })

    if (!user) {
      throw new AppError(404, '用户不存在', 'USER_NOT_FOUND')
    }

    // 计算连续签到
    const yesterday = getDateString(new Date(Date.now() - 86400000))
    const isConsecutive = user.last_check_in_date === yesterday
    const newStreak = isConsecutive ? user.current_streak + 1 : 1

    // 计算奖励
    let xpGained = CHECK_IN_BASE_XP
    let pointsGained = CHECK_IN_BASE_POINTS

    // 连续签到加成：每天额外 +1 xp（上限 +10）
    xpGained += Math.min(newStreak - 1, 10)

    // 每7天连续签到额外奖励
    if (newStreak > 0 && newStreak % STREAK_BONUS_INTERVAL === 0) {
      xpGained += STREAK_BONUS_XP
      pointsGained += STREAK_BONUS_POINTS
    }

    // 里程碑检查
    let milestoneReached: number | null = null
    for (const m of MILESTONES) {
      if (newStreak === m) {
        milestoneReached = m
        xpGained += m * 2 // 里程碑额外经验
        pointsGained += m
        break
      }
    }

    // 计算等级变化
    const newXp = user.xp + xpGained
    const newLevel = calculateLevel(newXp)
    const leveledUp = newLevel > user.level
    const newMaxStreak = Math.max(user.max_streak, newStreak)

    // 事务：创建签到记录 + 更新用户 + 记录积分历史 + 可能的等级历史
    await prisma.$transaction(async (tx: any) => {
      // 创建签到记录
      await tx.check_ins.create({
        data: {
          id: crypto.randomUUID(),
          user_id: userId,
          date: today,
          streak: newStreak,
          xp_gained: xpGained,
          points_gained: pointsGained,
          milestone_reached: milestoneReached,
        },
      })

      // 更新用户
      await tx.users.update({
        where: { id: userId },
        data: {
          xp: newXp,
          level: newLevel,
          total_points: user.total_points + pointsGained,
          active_points: user.active_points + pointsGained,
          current_streak: newStreak,
          max_streak: newMaxStreak,
          total_check_ins: user.total_check_ins + 1,
          last_check_in_date: today,
        },
      })

      // 记录积分历史
      await tx.points_history.create({
        data: {
          id: crypto.randomUUID(),
          user_id: userId,
          type: 'ACTIVE',
          amount: pointsGained,
          source: 'check_in',
          description: `每日签到 (连续${newStreak}天)`,
        },
      })

      // 等级提升记录
      if (leveledUp) {
        await tx.level_history.create({
          data: {
            id: crypto.randomUUID(),
            user_id: userId,
            from_level: user.level,
            to_level: newLevel,
            xp_gained: xpGained,
            source: 'check_in',
          },
        })
      }
    })

    // 签到后检查徽章
    const newBadges = await badgeService.checkAndAwardBadges(userId)

    return {
      date: today,
      streak: newStreak,
      maxStreak: newMaxStreak,
      xpGained,
      pointsGained,
      milestoneReached,
      leveledUp,
      newLevel,
      newXp,
      xpForNextLevel: getXpForNextLevel(newLevel),
      totalCheckIns: user.total_check_ins + 1,
      newBadges,
    }
  }

  async getCheckInStatus(userId: string) {
    const today = getDateString()

    const [user, todayCheckIn, recentCheckIns] = await Promise.all([
      prisma.users.findUnique({
        where: { id: userId },
        select: {
          level: true,
          xp: true,
          total_points: true,
          current_streak: true,
          max_streak: true,
          total_check_ins: true,
          last_check_in_date: true,
        },
      }),
      prisma.check_ins.findUnique({
        where: { user_id_date: { user_id: userId, date: today } },
      }),
      prisma.check_ins.findMany({
        where: { user_id: userId },
        orderBy: { date: 'desc' },
        take: 30,
        select: { date: true, streak: true, xp_gained: true, points_gained: true, milestone_reached: true },
      }),
    ])

    if (!user) {
      throw new AppError(404, '用户不存在', 'USER_NOT_FOUND')
    }

    return {
      checkedInToday: !!todayCheckIn,
      level: user.level,
      xp: user.xp,
      xpForNextLevel: getXpForNextLevel(user.level),
      totalPoints: user.total_points,
      currentStreak: user.current_streak,
      maxStreak: user.max_streak,
      totalCheckIns: user.total_check_ins,
      recentCheckIns: recentCheckIns.map((c: any) => ({
        date: c.date,
        streak: c.streak,
        xpGained: c.xp_gained,
        pointsGained: c.points_gained,
        milestoneReached: c.milestone_reached,
      })),
    }
  }

  async getCheckInCalendar(userId: string, year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endMonth = month === 12 ? 1 : month + 1
    const endYear = month === 12 ? year + 1 : year
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

    const checkIns = await prisma.check_ins.findMany({
      where: {
        user_id: userId,
        date: { gte: startDate, lt: endDate },
      },
      select: { date: true, streak: true, xp_gained: true, milestone_reached: true },
      orderBy: { date: 'asc' },
    })

    return checkIns.map((c: any) => ({
      date: c.date,
      streak: c.streak,
      xpGained: c.xp_gained,
      milestoneReached: c.milestone_reached,
    }))
  }

  async getPointsHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit

    const [records, total] = await Promise.all([
      prisma.points_history.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          amount: true,
          source: true,
          description: true,
          created_at: true,
        },
      }),
      prisma.points_history.count({ where: { user_id: userId } }),
    ])

    return {
      records: records.map((r: any) => ({
        id: r.id,
        type: r.type.toLowerCase(),
        amount: r.amount,
        source: r.source,
        description: r.description,
        createdAt: r.created_at.toISOString(),
      })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  }
}

export const checkInService = new CheckInService()
