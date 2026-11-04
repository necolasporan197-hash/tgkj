/**
 * 认证中间件 —— 用户端与管理员端双密钥隔离。
 */
import { verifyUserToken, verifyAdminToken } from '../utils/crypto.js'
import { get } from '../db/sqlite.js'
import { CODE, BizError } from '../utils/response.js'

const pick = (req) => {
  const h = req.headers.authorization || ''
  if (h.startsWith('Bearer ')) return h.slice(7)
  return req.headers['x-token'] || req.query.token || ''
}

/** 必须登录 */
export function authRequired(req, res, next) {
  const token = pick(req)
  if (!token) return next(new BizError(CODE.UNAUTHORIZED, '请先登录'))
  try {
    const payload = verifyUserToken(token)
    const user = get('SELECT * FROM users WHERE id = ?', [payload.uid])
    if (!user) return next(new BizError(CODE.UNAUTHORIZED, '账号不存在或已注销'))
    if (user.status !== 'active') return next(new BizError(CODE.BANNED, '账号已被禁用，请联系客服'))
    req.user = user
    return next()
  } catch {
    return next(new BizError(CODE.UNAUTHORIZED, '登录状态已过期，请重新登录'))
  }
}

/** 可选登录：有 token 则挂载 req.user，无 token 放行 */
export function authOptional(req, res, next) {
  const token = pick(req)
  if (!token) return next()
  try {
    const payload = verifyUserToken(token)
    req.user = get('SELECT * FROM users WHERE id = ?', [payload.uid]) || null
  } catch {
    req.user = null
  }
  return next()
}

/** 管理员必须登录 */
export function adminRequired(req, res, next) {
  const token = pick(req)
  if (!token) return next(new BizError(CODE.UNAUTHORIZED, '请先登录管理后台'))
  try {
    const payload = verifyAdminToken(token)
    const admin = get('SELECT * FROM admins WHERE id = ?', [payload.aid])
    if (!admin) return next(new BizError(CODE.UNAUTHORIZED, '管理员不存在'))
    if (admin.status !== 'active') return next(new BizError(CODE.BANNED, '管理员已被禁用'))
    const role = admin.role_id ? get('SELECT * FROM roles WHERE id = ?', [admin.role_id]) : null
    req.admin = admin
    req.permissions = role ? JSON.parse(role.permissions || '[]') : []
    return next()
  } catch {
    return next(new BizError(CODE.UNAUTHORIZED, '管理登录已过期，请重新登录'))
  }
}

/** 权限校验（'*' 为超级权限） */
export const can = (req, perm) =>
  req.permissions?.includes('*') || req.permissions?.includes(perm)

export function requirePerm(perm) {
  return (req, res, next) => {
    if (!can(req, perm)) return next(new BizError(CODE.FORBIDDEN, '无该操作权限'))
    return next()
  }
}
