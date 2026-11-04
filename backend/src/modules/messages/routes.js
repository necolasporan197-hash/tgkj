/**
 * 消息模块：会话列表 / 聊天记录 / 发送 / 已读 / 系统通知 / 未读数
 * Base: /api/messages
 */
import { Router } from 'express'
import { all, get, run, tx } from '../../db/sqlite.js'
import { now } from '../../utils/datetime.js'
import { h, ok, pageResult, paramError, notFound, CODE, BizError } from '../../utils/response.js'
import { authRequired } from '../../middleware/auth.js'
import { sendMessage, pageParams, isActiveVip, publicUser } from '../_shared.js'

const router = Router()

/** 会话列表 */
router.get(
  '/conversations',
  authRequired,
  h((req, res) => {
    const uid = req.user.id
    const rows = all(
      `SELECT * FROM conversations WHERE user_a=? OR user_b=? ORDER BY last_time DESC LIMIT 200`,
      [uid, uid]
    )
    const list = rows
      .map((c) => {
        const otherId = c.user_a === uid ? c.user_b : c.user_a
        const other = get('SELECT * FROM users WHERE id=?', [otherId])
        return {
          id: c.id,
          peerId: otherId,
          peer: publicUser(other, uid),
          lastContent: c.last_content,
          lastTime: c.last_time,
          unread: c.user_a === uid ? c.unread_a : c.unread_b
        }
      })
      // 系统消息（fromId=0）会留下 user_a=0 的会话，对端用户不存在，直接过滤，避免前端取 peer.nickname 崩溃
      .filter((x) => x.peer)
    return ok(res, list)
  })
)

/** 未读总数（含系统通知） */
router.get(
  '/unread',
  authRequired,
  h((req, res) => {
    const uid = req.user.id
    const chat = get('SELECT IFNULL(SUM(CASE WHEN user_a=? THEN unread_a ELSE unread_b END),0) c FROM conversations WHERE user_a=? OR user_b=?', [uid, uid, uid]).c
    const system = get('SELECT COUNT(*) c FROM notifications WHERE user_id=? AND is_read=0', [uid]).c
    return ok(res, { chat, system, total: chat + system })
  })
)

/** 系统通知列表 */
router.get(
  '/notifications',
  authRequired,
  h((req, res) => {
    const { page, pageSize, offset } = pageParams(req.query)
    const list = all(`SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT ? OFFSET ?`, [req.user.id, pageSize, offset])
    const total = get('SELECT COUNT(*) c FROM notifications WHERE user_id=?', [req.user.id]).c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

router.post(
  '/notifications/read',
  authRequired,
  h((req, res) => {
    const { id } = req.body || {}
    if (id) run('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?', [Number(id), req.user.id])
    else run('UPDATE notifications SET is_read=1 WHERE user_id=?', [req.user.id])
    return ok(res, null, '已标记为已读')
  })
)

/** 与某人的聊天记录（进入时自动清零未读） */
router.get(
  '/chat/:peerId',
  authRequired,
  h((req, res) => {
    const uid = req.user.id
    const peerId = Number(req.params.peerId)
    const peer = get('SELECT * FROM users WHERE id=?', [peerId])
    if (!peer) throw notFound('用户不存在')
    const { page, pageSize, offset } = pageParams(req.query)
    const conv = get('SELECT * FROM conversations WHERE (user_a=? AND user_b=?) OR (user_a=? AND user_b=?)', [uid, peerId, peerId, uid])
    const unreadCol = conv ? (conv.user_a === uid ? 'unread_a' : 'unread_b') : null
    if (conv) run(`UPDATE conversations SET ${unreadCol} = 0 WHERE id=?`, [conv.id])
    if (!conv) return ok(res, { peer: publicUser(peer, uid), list: [], total: 0, page, pageSize, totalPages: 0, canSend: true })
    const list = all(`SELECT * FROM messages WHERE conv_id=? ORDER BY id DESC LIMIT ? OFFSET ?`, [conv.id, pageSize, offset]).reverse()
    const total = get('SELECT COUNT(*) c FROM messages WHERE conv_id=?', [conv.id]).c
    return ok(res, {
      ...pageResult(list.map((m) => shaped(m, uid)), total, page, pageSize),
      convId: conv.id,
      peer: publicUser(peer, uid),
      canSend: isActiveVip(req.user) || hasFreeQuota(uid)
    })
  })
)

/** 发送消息（非 VIP 每天 3 条免费私信） */
router.post(
  '/send',
  authRequired,
  h((req, res) => {
    const { toId, content, msgType = 'text', extra = null } = req.body || {}
    const tid = Number(toId)
    if (!tid || !content) throw paramError('缺少接收人或内容')
    const target = get('SELECT * FROM users WHERE id=?', [tid])
    if (!target) throw notFound('接收人不存在')
    if (get('SELECT id FROM blacklist WHERE user_id=? AND target_id=?', [tid, req.user.id])) {
      throw new BizError(CODE.BIZ, '消息发送失败')
    }
    if (!isActiveVip(req.user) && !hasFreeQuota(req.user.id)) {
      throw new BizError(CODE.BIZ, '今日免费私信已用完，开通 VIP 可无限畅聊')
    }
    const r = sendMessage({ fromId: req.user.id, toId: tid, content, msgType, extra })
    return ok(res, r, '发送成功')
  })
)

/** 删除会话 */
router.delete(
  '/conversations/:id',
  authRequired,
  h((req, res) => {
    const c = get('SELECT * FROM conversations WHERE id=?', [Number(req.params.id)])
    if (!c) throw notFound('会话不存在')
    if (c.user_a !== req.user.id && c.user_b !== req.user.id) throw notFound('会话不存在')
    tx(() => {
      run('DELETE FROM messages WHERE conv_id=?', [c.id])
      run('DELETE FROM conversations WHERE id=?', [c.id])
    })
    return ok(res, null, '已删除会话')
  })
)

const shaped = (m, uid) => ({
  id: m.id,
  fromId: m.from_id,
  toId: m.to_id,
  content: m.content,
  msgType: m.msg_type,
  extra: m.extra ? JSON.parse(m.extra) : null,
  isRead: m.is_read === 1,
  createdAt: m.created_at,
  mine: Number(uid) === m.from_id
})

/** 免费私信额度：每日 3 条（非 VIP） */
function hasFreeQuota(uid) {
  const today = now().slice(0, 10)
  const used = get(`SELECT COUNT(*) c FROM messages WHERE from_id=? AND msg_type<>'system' AND substr(created_at,1,10)=?`, [uid, today]).c
  return used < 3
}

export default router
