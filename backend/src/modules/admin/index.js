/**
 * 管理端入口 —— 统一挂载 /api/admin/*
 */
import { Router } from 'express'
import { adminRequired } from '../../middleware/auth.js'
import authRoutes from './auth.js'
import dashboardRoutes from './dashboard.js'
import userRoutes from './users.js'
import contentRoutes from './content.js'
import financeRoutes from './finance.js'
import operationRoutes from './operations.js'
import systemRoutes from './system.js'
import sdkRoutes from './sdk.js'

const router = Router()

// 登录接口无需鉴权
router.use('/auth', authRoutes)

// 其余全部需要管理端令牌
router.use(adminRequired)
router.use('/dashboard', dashboardRoutes)
router.use('/users', userRoutes)
router.use('/content', contentRoutes)
router.use('/finance', financeRoutes)
router.use('/operations', operationRoutes)
router.use('/system', systemRoutes)
router.use('/sdk', sdkRoutes)

export default router
