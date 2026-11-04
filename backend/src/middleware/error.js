/**
 * 全局异常处理 + 404 + 请求日志。
 */
import { CODE, BizError } from '../utils/response.js'
import { env } from '../config/env.js'
import { run } from '../db/sqlite.js'
import { now } from '../utils/datetime.js'

export function notFoundHandler(req, res) {
  res.status(404).json({ code: CODE.NOT_FOUND, msg: `接口不存在: ${req.method} ${req.originalUrl}`, data: null })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof BizError) {
    return res.status(err.httpStatus || 200).json({ code: err.code, msg: err.message, data: null })
  }
  if (env.debug) console.error('[ERROR]', req.method, req.originalUrl, err)
  const msg = env.nodeEnv === 'production' ? '服务器繁忙，请稍后再试' : err.message || '服务器内部错误'
  return res.status(500).json({ code: CODE.SERVER, msg, data: null })
}

/** 管理端操作日志 */
export function adminLog(req, module, action, target = '', detail = '') {
  try {
    run(
      `INSERT INTO admin_logs (admin_id, admin_name, module, action, target, detail, ip, created_at) VALUES (?,?,?,?,?,?,?,?)`,
      [req.admin?.id ?? null, req.admin?.username ?? 'anonymous', module, action, String(target), detail, clientIp(req), now()]
    )
  } catch {
    /* 日志失败不影响主流程 */
  }
}

export const clientIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || ''

/** 简易请求日志 */
export function requestLogger(req, res, next) {
  const start = Date.now()
  res.on('finish', () => {
    if (env.debug) {
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`)
    }
  })
  next()
}
