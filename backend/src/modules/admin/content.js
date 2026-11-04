/**
 * 管理端内容管理：动态 / 评论 / 投稿 / 举报 / 印象
 * Base: /api/admin/content
 */
import { Router } from 'express'
import { all, get, run } from '../../db/sqlite.js'
import { now } from '../../utils/datetime.js'
import { h, ok, pageResult, paramError, notFound } from '../../utils/response.js'
import { adminLog } from '../../middleware/error.js'
import { notify, sendMessage } from '../_shared.js'

const router = Router()

const pg = (q) => {
  const page = Math.max(1, Number(q.page) || 1)
  const pageSize = Math.min(100, Number(q.pageSize) || 20)
  return { page, pageSize, offset: (page - 1) * pageSize }
}
const parseImages = (s) => {
  try {
    return JSON.parse(s || '[]')
  } catch {
    return []
  }
}

/** 动态列表 */
router.get(
  '/moments',
  h((req, res) => {
    const { page, pageSize, offset } = pg(req.query)
    const params = []
    const cond = [`m.status <> 'deleted' OR m.status IS NULL`]
    if (req.query.auditStatus) {
      cond.push('m.audit_status = ?')
      params.push(req.query.auditStatus)
    }
    if (req.query.keyword) {
      cond.push('m.content LIKE ?')
      params.push(`%${req.query.keyword}%`)
    }
    const where = `WHERE ${cond.join(' AND ')}`
    const list = all(
      `SELECT m.*, u.nickname, u.avatar, u.phone FROM moments m JOIN users u ON u.id=m.user_id ${where} ORDER BY m.id DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    ).map((m) => ({ ...m, images: parseImages(m.images) }))
    const total = get(`SELECT COUNT(*) c FROM moments m ${where}`, params).c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

/** 动态审核 */
router.post(
  '/moments/:id/audit',
  h((req, res) => {
    const id = Number(req.params.id)
    const { action } = req.body || {}
    if (!['approve', 'reject'].includes(action)) throw paramError('审核动作不正确')
    const m = get('SELECT * FROM moments WHERE id=?', [id])
    if (!m) throw notFound('动态不存在')
    run('UPDATE moments SET audit_status=? WHERE id=?', [action === 'approve' ? 'approved' : 'rejected', id])
    if (action === 'reject') {
      sendMessage({ fromId: 0, toId: m.user_id, content: '你发布的动态未通过审核，请遵守社区规范', msgType: 'system' })
    }
    adminLog(req, 'content', 'moment-audit', id, action)
    return ok(res, null, action === 'approve' ? '已通过' : '已驳回')
  })
)

/** 删除动态 */
router.delete(
  '/moments/:id',
  h((req, res) => {
    run(`UPDATE moments SET status='deleted' WHERE id=?`, [Number(req.params.id)])
    adminLog(req, 'content', 'moment-delete', req.params.id, '删除动态')
    return ok(res, null, '已删除')
  })
)

/** 评论列表 / 删除 */
router.get(
  '/comments',
  h((req, res) => {
    const { page, pageSize, offset } = pg(req.query)
    const list = all(
      `SELECT c.*, u.nickname, u.avatar, m.content AS momentContent FROM moment_comments c
       JOIN users u ON u.id=c.user_id LEFT JOIN moments m ON m.id=c.moment_id
       WHERE c.status='normal' ORDER BY c.id DESC LIMIT ? OFFSET ?`,
      [pageSize, offset]
    )
    const total = get(`SELECT COUNT(*) c FROM moment_comments WHERE status='normal'`).c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

router.delete(
  '/comments/:id',
  h((req, res) => {
    const c = get('SELECT * FROM moment_comments WHERE id=?', [Number(req.params.id)])
    if (!c) throw notFound('评论不存在')
    run(`UPDATE moment_comments SET status='deleted' WHERE id=?`, [c.id])
    run('UPDATE moments SET comment_count = MAX(0, comment_count - 1) WHERE id=?', [c.moment_id])
    adminLog(req, 'content', 'comment-delete', c.id, '删除评论')
    return ok(res, null, '已删除')
  })
)

/** 投稿审核 */
router.get(
  '/submissions',
  h((req, res) => {
    const { page, pageSize, offset } = pg(req.query)
    const params = []
    let where = ''
    if (req.query.status) {
      where = 'WHERE s.status=?'
      params.push(req.query.status)
    }
    const list = all(
      `SELECT s.*, u.nickname, u.avatar, u.phone FROM submissions s JOIN users u ON u.id=s.user_id ${where} ORDER BY s.id DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    ).map((s) => ({ ...s, images: parseImages(s.images) }))
    const total = get(`SELECT COUNT(*) c FROM submissions s ${where}`, params).c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

router.post(
  '/submissions/:id/audit',
  h((req, res) => {
    const id = Number(req.params.id)
    const { action, remark = '' } = req.body || {}
    if (!['approve', 'reject'].includes(action)) throw paramError('审核动作不正确')
    const s = get('SELECT * FROM submissions WHERE id=?', [id])
    if (!s) throw notFound('投稿不存在')
    run('UPDATE submissions SET status=?, remark=?, reviewed_at=? WHERE id=?', [
      action === 'approve' ? 'approved' : 'rejected',
      remark,
      now(),
      id
    ])
    notify(s.user_id, '投稿审核结果', action === 'approve' ? '你的投稿已通过审核' : `投稿未通过${remark ? `：${remark}` : ''}`, 'audit')
    adminLog(req, 'content', 'submission-audit', id, action)
    return ok(res, null, action === 'approve' ? '已通过' : '已驳回')
  })
)

/** 举报处理 */
router.get(
  '/reports',
  h((req, res) => {
    const { page, pageSize, offset } = pg(req.query)
    const params = []
    let where = ''
    if (req.query.status) {
      where = 'WHERE r.status=?'
      params.push(req.query.status)
    }
    const list = all(
      `SELECT r.*, u.nickname AS reporterName, u.phone AS reporterPhone, t.nickname AS targetName, t.phone AS targetPhone
       FROM reports r JOIN users u ON u.id=r.reporter_id LEFT JOIN users t ON t.id=r.target_id
       ${where} ORDER BY r.id DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    ).map((r) => ({ ...r, images: parseImages(r.images) }))
    const total = get(`SELECT COUNT(*) c FROM reports r ${where}`, params).c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

router.post(
  '/reports/:id/handle',
  h((req, res) => {
    const id = Number(req.params.id)
    const { action, remark = '', banTarget = false } = req.body || {}
    if (!['handled', 'rejected'].includes(action)) throw paramError('处理动作不正确')
    const r = get('SELECT * FROM reports WHERE id=?', [id])
    if (!r) throw notFound('举报不存在')
    run('UPDATE reports SET status=?, remark=?, handled_at=? WHERE id=?', [action, remark, now(), id])
    if (banTarget && r.target_type === 'user') {
      run(`UPDATE users SET status='disabled', updated_at=? WHERE id=?`, [now(), r.target_id])
    }
    if (r.target_type === 'moment' && r.target_ref) {
      run(`UPDATE moments SET status='deleted' WHERE id=?`, [r.target_ref])
    }
    adminLog(req, 'content', 'report-handle', id, `${action} ${remark}`)
    return ok(res, null, '处理完成')
  })
)

/** 印象标签统计与管理 */
router.get(
  '/impressions',
  h((req, res) => {
    const list = all(
      `SELECT i.tag, COUNT(*) c FROM impressions i GROUP BY i.tag ORDER BY c DESC LIMIT 100`
    )
    const recent = all(
      `SELECT i.*, u.nickname AS fromName, t.nickname AS toName FROM impressions i
       JOIN users u ON u.id=i.user_id JOIN users t ON t.id=i.target_id ORDER BY i.id DESC LIMIT 100`
    )
    return ok(res, { stats: list, recent })
  })
)

router.delete(
  '/impressions/:id',
  h((req, res) => {
    run('DELETE FROM impressions WHERE id=?', [Number(req.params.id)])
    adminLog(req, 'content', 'impression-delete', req.params.id, '删除印象')
    return ok(res, null, '已删除')
  })
)

export default router
