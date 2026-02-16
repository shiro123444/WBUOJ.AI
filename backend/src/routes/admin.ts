import { Router } from 'express'
import { adminController } from '../controllers/admin.controller.js'
import { authenticate, requireAdmin } from '../middlewares/auth.js'

const router = Router()

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin)

// Dashboard
router.get('/stats', adminController.getDashboardStats.bind(adminController))

// User management
router.get('/users', adminController.listUsers.bind(adminController))
router.put('/users/:userId/role', adminController.updateUserRole.bind(adminController))
router.post('/users/:userId/disable', adminController.disableUser.bind(adminController))
router.post('/users/:userId/enable', adminController.enableUser.bind(adminController))

// System config
router.get('/configs', adminController.getSystemConfigs.bind(adminController))
router.put('/configs', adminController.setSystemConfig.bind(adminController))
router.delete('/configs/:key', adminController.deleteSystemConfig.bind(adminController))

// Admin logs
router.get('/logs', adminController.getAdminLogs.bind(adminController))

export default router
