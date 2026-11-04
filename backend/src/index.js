/**
 * 糖果空间 后端 API 服务（逆向重建版）
 * ------------------------------------------------------------------
 * 规范：
 *   - 所有接口 Base Path = /api
 *   - 统一响应体 { code: 0, msg: 'ok', data: {...} }
 *   - 用户端与管理端 JWT 密钥隔离
 *   - 业务域名单一真源：config/domain.json（由 scripts/set-domain.mjs 同步到 .env）
 */
import express from 'express'
import cors from 'cors'
import { existsSync, mkdirSync } from 'node:fs'
import { env } from './config/env.js'
import { initSchema, DB_FILE } from './db/sqlite.js'
import { requestLogger, errorHandler, notFoundHandler } from './middleware/error.js'
import { ok } from './utils/response.js'
import { now } from './utils/datetime.js'

// 业务模块
import authRoutes from './modules/auth/routes.js'
import userRoutes from './modules/users/routes.js'
import discoverRoutes from './modules/discover/routes.js'
import momentRoutes from './modules/moments/routes.js'
import messageRoutes from './modules/messages/routes.js'
import walletRoutes from './modules/wallet/routes.js'
import vipRoutes from './modules/vip/routes.js'
import verificationRoutes from './modules/verification/routes.js'
import inviteRoutes from './modules/invite/routes.js'
import inviteEventRoutes from './modules/invite-events/routes.js'
import teamRoutes from './modules/team/routes.js'
import submissionRoutes from './modules/break/routes.js'
import giftRoutes from './modules/gift/routes.js'
import impressionRoutes from './modules/impression/routes.js'
import reportRoutes from './modules/report/routes.js'
import configRoutes from './modules/config/routes.js'
import uploadRoutes from './modules/upload/routes.js'
import taskRoutes from './modules/task/routes.js'
import serviceRoutes from './modules/service/routes.js'
import feedbackRoutes from './modules/feedback/routes.js'
import cancellationRoutes from './modules/cancellation/routes.js'
import jurisdictionRoutes from './modules/jurisdiction/routes.js'
import notifyRoutes from './modules/notify/routes.js'
import sightRoutes from './modules/sight/routes.js'
import youngRoutes from './modules/young/routes.js'
import adminRoutes from './modules/admin/index.js'

// ---------------- 初始化 ----------------
mkdirSync(env.uploadDir, { recursive: true })
const dbFile = initSchema()
console.log(`[DB] ${dbFile} ${existsSync(dbFile) ? 'ready' : 'missing'}`)

const app = express()
app.disable('x-powered-by')

app.use(
  cors({
    origin: env.corsOrigins.includes('*') ? true : env.corsOrigins,
    credentials: true
  })
)
app.use(express.json({ limit: '25mb' }))
app.use(express.urlencoded({ extended: true, limit: '25mb' }))
app.use(requestLogger)

// 静态资源：上传文件
app.use('/uploads', express.static(env.uploadDir, { maxAge: '7d' }))

// 健康检查（不带 /api，便于探活）
app.get('/health', (req, res) => ok(res, { status: 'up', time: now(), env: env.nodeEnv }))

// ---------------- 业务路由 ----------------
const api = express.Router()
api.get('/', (req, res) => ok(res, { service: 'tangguo-api', version: '4.8.2', time: now() }))
api.get('/ping', (req, res) => ok(res, { pong: true, time: now() }))

api.use('/auth', authRoutes)
api.use('/users', userRoutes)
api.use('/discover', discoverRoutes)
api.use('/moments', momentRoutes)
api.use('/messages', messageRoutes)
api.use('/wallet', walletRoutes)
api.use('/vip', vipRoutes)
api.use('/verification', verificationRoutes)
api.use('/invite', inviteRoutes)
api.use('/invite-events', inviteEventRoutes)
api.use('/team', teamRoutes)
api.use('/submission', submissionRoutes)
api.use('/gift', giftRoutes)
api.use('/impression', impressionRoutes)
api.use('/report', reportRoutes)
api.use('/config', configRoutes)
api.use('/upload', uploadRoutes)
api.use('/task', taskRoutes)
api.use('/service', serviceRoutes)
api.use('/feedback', feedbackRoutes)
api.use('/cancellation', cancellationRoutes)
api.use('/jurisdiction', jurisdictionRoutes)
api.use('/notify', notifyRoutes)
api.use('/sight', sightRoutes)
api.use('/young', youngRoutes)
api.use('/admin', adminRoutes)

app.use('/api', api)

// 兼容：把 /api 前缀写死到前端时也可直接访问（例如 /users/me）
// 未匹配的 404 与异常
app.use(notFoundHandler)
app.use(errorHandler)

app.listen(env.port, () => {
  console.log('==================================================')
  console.log(` 糖果空间 API 已启动`)
  console.log(` 本地地址 : http://localhost:${env.port}/api`)
  console.log(` 对外地址 : ${env.publicBaseUrl}/api`)
  console.log(` 管理端   : ${env.publicBaseUrl}/api/admin/auth/login`)
  console.log(` 运行环境 : ${env.nodeEnv}`)
  console.log('==================================================')
})
