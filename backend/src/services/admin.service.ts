import { prisma } from '../config/database.js'
import { AppError } from '../types/index.js'
import crypto from 'crypto'

class AdminService {
  // ========== 用户管理 ==========

  async listUsers(query: {
    page?: number
    limit?: number
    search?: string
    role?: string
    sort?: string
  }) {
    const page = query.page || 1
    const limit = query.limit || 20
    const skip = (page - 1) * limit

    const where: any = {}
    if (query.search) {
      where.OR = [
        { username: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ]
    }
    if (query.role) {
      where.role = query.role.toUpperCase()
    }

    const orderBy: any = {}
    switch (query.sort) {
      case 'created': orderBy.created_at = 'desc'; break
      case 'score': orderBy.score = 'desc'; break
      case 'solved': orderBy.solved_count = 'desc'; break
      default: orderBy.created_at = 'desc'
    }

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          level: true,
          solved_count: true,
          submission_count: true,
          score: true,
          is_disabled: true,
          created_at: true,
          last_login_at: true,
        },
      }),
      prisma.users.count({ where }),
    ])

    return {
      users: users.map((u: any) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role.toLowerCase(),
        level: u.level,
        solvedCount: u.solved_count,
        submissionCount: u.submission_count,
        score: u.score,
        isDisabled: u.is_disabled,
        createdAt: u.created_at.toISOString(),
        lastLoginAt: u.last_login_at?.toISOString() || null,
      })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  }

  async updateUserRole(adminId: string, userId: string, role: string) {
    const user = await prisma.users.findUnique({ where: { id: userId } })
    if (!user) throw new AppError(404, '用户不存在', 'USER_NOT_FOUND')

    await prisma.users.update({
      where: { id: userId },
      data: { role: role.toUpperCase() as any },
    })

    await this.logAdminAction(adminId, 'UPDATE_ROLE', 'user', userId, userId, `角色变更为 ${role}`)
  }

  async disableUser(adminId: string, userId: string, reason: string) {
    const user = await prisma.users.findUnique({ where: { id: userId } })
    if (!user) throw new AppError(404, '用户不存在', 'USER_NOT_FOUND')
    if (user.id === adminId) throw new AppError(400, '不能禁用自己', 'CANNOT_DISABLE_SELF')

    await prisma.users.update({
      where: { id: userId },
      data: {
        is_disabled: true,
        disabled_reason: reason,
        disabled_at: new Date(),
        disabled_by: adminId,
      },
    })

    await this.logAdminAction(adminId, 'DISABLE_USER', 'user', userId, userId, reason)
  }

  async enableUser(adminId: string, userId: string) {
    await prisma.users.update({
      where: { id: userId },
      data: {
        is_disabled: false,
        disabled_reason: null,
        disabled_at: null,
        disabled_by: null,
      },
    })

    await this.logAdminAction(adminId, 'ENABLE_USER', 'user', userId, userId, null)
  }

  // ========== 系统配置 ==========

  async getSystemConfigs() {
    const configs = await prisma.system_configs.findMany({
      orderBy: { key: 'asc' },
    })
    return configs.map((c: any) => ({
      id: c.id,
      key: c.key,
      value: c.value,
      updatedAt: c.updated_at.toISOString(),
    }))
  }

  async setSystemConfig(adminId: string, key: string, value: string) {
    await prisma.system_configs.upsert({
      where: { key },
      update: { value, updated_at: new Date() },
      create: { id: crypto.randomUUID(), key, value, updated_at: new Date() },
    })

    await this.logAdminAction(adminId, 'UPDATE_CONFIG', 'system_config', null, null, `${key} = ${value}`)
  }

  async deleteSystemConfig(adminId: string, key: string) {
    await prisma.system_configs.deleteMany({ where: { key } })
    await this.logAdminAction(adminId, 'DELETE_CONFIG', 'system_config', null, null, `删除配置 ${key}`)
  }

  // ========== 统计概览 ==========

  async getDashboardStats() {
    const [
      totalUsers,
      totalProblems,
      totalSubmissions,
      totalSolutions,
      todayUsers,
      todaySubmissions,
    ] = await Promise.all([
      prisma.users.count(),
      prisma.problems.count(),
      prisma.submissions.count(),
      prisma.solutions.count(),
      prisma.users.count({
        where: { created_at: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      prisma.submissions.count({
        where: { created_at: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ])

    return {
      totalUsers,
      totalProblems,
      totalSubmissions,
      totalSolutions,
      todayUsers,
      todaySubmissions,
    }
  }

  // ========== 操作日志 ==========

  async getAdminLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit

    const [logs, total] = await Promise.all([
      prisma.admin_logs.findMany({
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: {
          users_admin_logs_admin_idTousers: {
            select: { username: true },
          },
        },
      }),
      prisma.admin_logs.count(),
    ])

    return {
      logs: logs.map((l: any) => ({
        id: l.id,
        adminUsername: l.users_admin_logs_admin_idTousers.username,
        action: l.action,
        targetType: l.target_type,
        targetId: l.target_id,
        details: l.details,
        createdAt: l.created_at.toISOString(),
      })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  }

  // ========== 内部方法 ==========

  private async logAdminAction(
    adminId: string,
    action: string,
    targetType: string,
    targetId: string | null,
    userId: string | null,
    details: string | null,
  ) {
    await prisma.admin_logs.create({
      data: {
        id: crypto.randomUUID(),
        admin_id: adminId,
        action,
        target_type: targetType,
        target_id: targetId,
        user_id: userId,
        details,
      },
    })
  }
}

export const adminService = new AdminService()
