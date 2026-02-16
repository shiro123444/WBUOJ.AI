import { prisma } from '../config/database.js'
import { AppError } from '../types/index.js'
import crypto from 'crypto'

// 预定义徽章条件
const BADGE_DEFINITIONS = [
  { name: '初来乍到', description: '完成首次签到', icon: '👋', condition: 'first_checkin' },
  { name: '坚持不懈', description: '连续签到7天', icon: '🔥', condition: 'streak_7' },
  { name: '月度达人', description: '连续签到30天', icon: '📅', condition: 'streak_30' },
  { name: '年度传奇', description: '连续签到365天', icon: '🏆', condition: 'streak_365' },
  { name: '初试锋芒', description: '通过第一道题', icon: '⚡', condition: 'first_ac' },
  { name: '小有成就', description: '通过10道题', icon: '🌟', condition: 'ac_10' },
  { name: '实力不凡', description: '通过50道题', icon: '💪', condition: 'ac_50' },
  { name: '百题斩', description: '通过100道题', icon: '🎯', condition: 'ac_100' },
  { name: '入门新手', description: '达到Lv.5', icon: '🌱', condition: 'level_5' },
  { name: '进阶选手', description: '达到Lv.10', icon: '🌿', condition: 'level_10' },
  { name: '高手之路', description: '达到Lv.20', icon: '🌳', condition: 'level_20' },
  { name: '题解达人', description: '发布10篇题解', icon: '📝', condition: 'solutions_10' },
  { name: '社区贡献者', description: '发布50篇题解', icon: '🏅', condition: 'solutions_50' },
  { name: '竞赛新秀', description: '参加第一场比赛', icon: '🎮', condition: 'first_contest' },
  { name: '竞赛老将', description: '参加10场比赛', icon: '🎖️', condition: 'contests_10' },
]

class BadgeService {
  /** 初始化预定义徽章到数据库（幂等） */
  async seedBadges() {
    for (const def of BADGE_DEFINITIONS) {
      await prisma.badges.upsert({
        where: { name: def.name },
        update: { description: def.description, icon: def.icon, condition: def.condition },
        create: {
          id: crypto.randomUUID(),
          name: def.name,
          description: def.description,
          icon: def.icon,
          condition: def.condition,
        },
      })
    }
  }

  /** 获取所有徽章定义 */
  async getAllBadges() {
    const badges = await prisma.badges.findMany({
      orderBy: { created_at: 'asc' },
    })
    return badges.map((b: any) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      icon: b.icon,
      condition: b.condition,
    }))
  }

  /** 获取用户已获得的徽章 */
  async getUserBadges(userId: string) {
    const userBadges = await prisma.user_badges.findMany({
      where: { user_id: userId },
      include: { badges: true },
      orderBy: { earned_at: 'desc' },
    })

    return userBadges.map((ub: any) => ({
      id: ub.badges.id,
      name: ub.badges.name,
      description: ub.badges.description,
      icon: ub.badges.icon,
      earnedAt: ub.earned_at.toISOString(),
    }))
  }

  /** 获取用户徽章概览（已获得 + 未获得） */
  async getUserBadgeOverview(userId: string) {
    const [allBadges, userBadges] = await Promise.all([
      prisma.badges.findMany({ orderBy: { created_at: 'asc' } }),
      prisma.user_badges.findMany({
        where: { user_id: userId },
        select: { badge_id: true, earned_at: true },
      }),
    ])

    const earnedMap = new Map(userBadges.map((ub: any) => [ub.badge_id, ub.earned_at]))

    return allBadges.map((b: any) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      icon: b.icon,
      condition: b.condition,
      earned: earnedMap.has(b.id),
      earnedAt: earnedMap.get(b.id)?.toISOString() || null,
    }))
  }

  /** 检查并发放徽章（在签到、提交AC、升级等事件后调用） */
  async checkAndAwardBadges(userId: string): Promise<string[]> {
    const [user, earnedBadgeIds, allBadges] = await Promise.all([
      prisma.users.findUnique({
        where: { id: userId },
        select: {
          level: true,
          solved_count: true,
          total_check_ins: true,
          current_streak: true,
          max_streak: true,
        },
      }),
      prisma.user_badges.findMany({
        where: { user_id: userId },
        select: { badge_id: true },
      }).then((list: any[]) => new Set(list.map((x) => x.badge_id))),
      prisma.badges.findMany(),
    ])

    if (!user) return []

    // 额外查询
    const [solutionCount, contestCount] = await Promise.all([
      prisma.solutions.count({ where: { author_id: userId } }),
      prisma.contest_entries.count({ where: { user_id: userId } }),
    ])

    const newBadges: string[] = []

    for (const badge of allBadges) {
      if (earnedBadgeIds.has(badge.id)) continue

      const shouldAward = this.evaluateCondition(badge.condition, {
        totalCheckIns: user.total_check_ins,
        currentStreak: user.current_streak,
        maxStreak: user.max_streak,
        solvedCount: user.solved_count,
        level: user.level,
        solutionCount,
        contestCount,
      })

      if (shouldAward) {
        await prisma.user_badges.create({
          data: {
            id: crypto.randomUUID(),
            user_id: userId,
            badge_id: badge.id,
          },
        })
        newBadges.push(badge.name)
      }
    }

    return newBadges
  }

  private evaluateCondition(
    condition: string,
    stats: {
      totalCheckIns: number
      currentStreak: number
      maxStreak: number
      solvedCount: number
      level: number
      solutionCount: number
      contestCount: number
    }
  ): boolean {
    switch (condition) {
      case 'first_checkin': return stats.totalCheckIns >= 1
      case 'streak_7': return stats.maxStreak >= 7
      case 'streak_30': return stats.maxStreak >= 30
      case 'streak_365': return stats.maxStreak >= 365
      case 'first_ac': return stats.solvedCount >= 1
      case 'ac_10': return stats.solvedCount >= 10
      case 'ac_50': return stats.solvedCount >= 50
      case 'ac_100': return stats.solvedCount >= 100
      case 'level_5': return stats.level >= 5
      case 'level_10': return stats.level >= 10
      case 'level_20': return stats.level >= 20
      case 'solutions_10': return stats.solutionCount >= 10
      case 'solutions_50': return stats.solutionCount >= 50
      case 'first_contest': return stats.contestCount >= 1
      case 'contests_10': return stats.contestCount >= 10
      default: return false
    }
  }
}

export const badgeService = new BadgeService()
