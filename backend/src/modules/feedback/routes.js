/**
 * 意见反馈 —— 对应官方 activity.ui.activity.FeedbackActivity
 * Base: /api/feedback
 */
import { Router } from 'express'
import { all, get, run } from '../../db/sqlite.js'
import { now } from '../../utils/datetime.js'
import { h, ok, pageResult, paramError } from '../../utils/response.js'
import { authRequired } from '../../middleware/auth.js'
import { pageParams, containsSensitive } from '../_shared.js'

const router = Router()

const safeJson = (s) => {
  try {
    return JSON.parse(s || '[]')
  } catch {
    return []
  }
}

/** 提交反馈 */
router.post(
  '/',
  authRequired,
  h((req, res) => {
    const { content = '', images = [], contact = '' } = req.body || {}
    const text = String(content).trim()
    if (text.length < 5) throw paramError('请至少填写 5 个字的反馈内容')
    if (text.length > 500) throw paramError('反馈内容不能超过 500 字')
    if (containsSensitive(text).length) throw paramError('内容包含敏感词，请修改后提交')
    const list = Array.isArray(images) ? images.slice(0, 6) : []
    const r = run(
      `INSERT INTO feedbacks (user_id, content, images, contact, status, created_at) VALUES (?,?,?,?, 'pending', ?)`,
      [req.user.id, text, JSON.stringify(list), String(contact).trim(), now()]
    )
    return ok(res, { id: Number(r.lastInsertRowid) }, '反馈已提交，感谢你的建议')
  })
)

/** 我的反馈记录 */
router.get(
  '/mine',
  authRequired,
  h((req, res) => {
    const { page, pageSize, offset } = pageParams(req.query)
    const list = all(`SELECT * FROM feedbacks WHERE user_id=? ORDER BY id DESC LIMIT ? OFFSET ?`, [
      req.user.id,
      pageSize,
      offset
    ]).map((f) => ({ ...f, images: safeJson(f.images) }))
    const total = get(`SELECT COUNT(*) c FROM feedbacks WHERE user_id=?`, [req.user.id]).c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

export default router
