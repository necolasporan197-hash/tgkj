/**
 * 环境配置 —— 统一从 backend/.env 读取（由 scripts/set-domain.mjs 生成）。
 */
import 'dotenv/config'
import { resolve } from 'node:path'

const bool = (v, def = false) => (v == null ? def : ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase()))

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/+$/, ''),
  corsOrigins: (process.env.CORS_ORIGINS || '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  adminJwtSecret: process.env.ADMIN_JWT_SECRET || 'change-me-admin-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  dataDir: resolve(process.cwd(), process.env.DATA_DIR || './data'),
  uploadDir: resolve(process.cwd(), process.env.UPLOAD_DIR || './data/uploads'),
  /** 短信服务：未配置 provider 时走控制台验证码（便于本地联调） */
  smsProvider: process.env.SMS_PROVIDER || 'console',
  smsApiId: process.env.SMS_API_ID || '',
  smsApiKey: process.env.SMS_API_KEY || '',
  /** 业务规则（可在 Admin 系统配置中覆盖） */
  withdrawMinAmount: Number(process.env.WITHDRAW_MIN_AMOUNT || 100),
  withdrawFeeRate: Number(process.env.WITHDRAW_FEE_RATE || 0.05),
  inviteRewardCoins: Number(process.env.INVITE_REWARD_COINS || 1000),
  debug: bool(process.env.DEBUG, true)
}

export const isProd = env.nodeEnv === 'production'
