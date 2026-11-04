/**
 * 在线客服 —— 对应官方 activity.ui.activity.CustomServiceActivity
 * Base: /api/service
 */
import { Router } from 'express'
import { get } from '../../db/sqlite.js'
import { h, ok, notFound } from '../../utils/response.js'
import { authRequired } from '../../middleware/auth.js'
import { publicUser } from '../_shared.js'

const router = Router()

/**
 * 客服会话对端（唯一数据源：客服展示信息见 /api/config/service，此处不重复返回）
 */
router.get(
  '/',
  h((req, res) => {
    const account = get('SELECT * FROM users WHERE role=9 AND status=? ORDER BY id LIMIT 1', ['active'])
    return ok(res, { peerId: account?.id || null })
  })
)

/** 建立 / 获取与客服的会话（不存在则由 messages 模块逻辑创建） */
router.post(
  '/session',
  authRequired,
  h((req, res) => {
    const account = get('SELECT * FROM users WHERE role=9 AND status=? ORDER BY id LIMIT 1', ['active'])
    if (!account) throw notFound('客服暂未上线')
    const conv = get(
      `SELECT * FROM conversations WHERE (user_a=? AND user_b=?) OR (user_a=? AND user_b=?)`,
      [req.user.id, account.id, account.id, req.user.id]
    )
    return ok(res, {
      peerId: account.id,
      peer: publicUser(account, req.user.id),
      conversationId: conv?.id || null
    })
  })
)

export default router
