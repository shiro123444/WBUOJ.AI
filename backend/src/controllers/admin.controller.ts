import type { Response, NextFunction } from 'express'
import { adminService } from '../services/admin.service.js'
import { AppError, type AuthenticatedRequest } from '../types/index.js'

class AdminController {
  // ========== 用户管理 ==========

  async listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized')
      const { page, limit, search, role, sort } = req.query as any
      const result = await adminService.listUsers({ page: Number(page), limit: Number(limit), search, role, sort })
      res.json({ success: true, ...result })
    } catch (error) {
      next(error)
    }
  }

  async updateUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized')
      const { userId } = req.params
      const { role } = req.body
      if (!role) throw new AppError(400, '缺少 role 参数')
      await adminService.updateUserRole(req.user.userId, userId, role)
      res.json({ success: true, data: { message: '角色更新成功' } })
    } catch (error) {
      next(error)
    }
  }

  async disableUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized')
      const { userId } = req.params
      const { reason } = req.body
      await adminService.disableUser(req.user.userId, userId, reason || '管理员操作')
      res.json({ success: true, data: { message: '用户已禁用' } })
    } catch (error) {
      next(error)
    }
  }

  async enableUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized')
      const { userId } = req.params
      await adminService.enableUser(req.user.userId, userId)
      res.json({ success: true, data: { message: '用户已启用' } })
    } catch (error) {
      next(error)
    }
  }

  // ========== 系统配置 ==========

  async getSystemConfigs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized')
      const configs = await adminService.getSystemConfigs()
      res.json({ success: true, data: configs })
    } catch (error) {
      next(error)
    }
  }

  async setSystemConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized')
      const { key, value } = req.body
      if (!key || value === undefined) throw new AppError(400, '缺少 key 或 value')
      await adminService.setSystemConfig(req.user.userId, key, value)
      res.json({ success: true, data: { message: '配置已更新' } })
    } catch (error) {
      next(error)
    }
  }

  async deleteSystemConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized')
      const { key } = req.params
      await adminService.deleteSystemConfig(req.user.userId, key)
      res.json({ success: true, data: { message: '配置已删除' } })
    } catch (error) {
      next(error)
    }
  }

  // ========== 统计 + 日志 ==========

  async getDashboardStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized')
      const stats = await adminService.getDashboardStats()
      res.json({ success: true, data: stats })
    } catch (error) {
      next(error)
    }
  }

  async getAdminLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized')
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 20
      const result = await adminService.getAdminLogs(page, limit)
      res.json({ success: true, ...result })
    } catch (error) {
      next(error)
    }
  }
}

export const adminController = new AdminController()
