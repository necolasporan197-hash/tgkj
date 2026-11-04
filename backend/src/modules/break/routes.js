/**
 * 投稿模块（原 App「投稿/任务中心」）：提交 / 我的投稿 / 审核结果
 * Base: /api/submission
 */
import { Router } from 'express'
import { all, get, run } from '../../db/sqlite.js'
import { now } from '../../utils/datetime.js'
import { h, ok, paramError, pageResult, CODE, BizError } from '../../utils/response.js'
import { authRequired } from '../../middleware/auth.js'
import { containsSensitive, pageParams } from '../_shared.js'

const router = Router()

/** 提交投稿 */
router.post(
  '/',
  authRequired,
  h((req, res) => {
    const { title = '', content = '', images = [] } = req.body || {}
    if (!content.trim() && !images.length) throw paramError('请填写投稿内容')
    const hits = containsSensitive(`${title} ${content}`)
    if (hits.length) throw new BizError(CODE.BIZ, `内容包含敏感词：${hits.join('、')}`)
    const r = run(
      `INSERT INTO submissions (user_id, title, content, images, status, created_at) VALUES (?,?,?,?, 'pending', ?)`,
      [req.user.id, String(title).slice(0, 60), String(content), JSON.stringify(images || []), now()]
    )
    return ok(res, { id: Number(r.lastInsertRowid) }, '投稿成功，等待审核')
  })
)

/** 我的投稿 */
router.get(
  '/mine',
  authRequired,
  h((req, res) => {
    const { page, pageSize, offset } = pageParams(req.query)
    const list = all(`SELECT * FROM submissions WHERE user_id=? ORDER BY id DESC LIMIT ? OFFSET ?`, [req.user.id, pageSize, offset])
    const total = get('SELECT COUNT(*) c FROM submissions WHERE user_id=?', [req.user.id]).c
    return ok(res, pageResult(list.map(jsonImages), total, page, pageSize))
  })
)

const jsonImages = (s) => ({ ...s, images: safeJson(s.images) })
const safeJson = (str) => {
  try {
    return JSON.parse(str || '[]')
  } catch {
    return []
  }
}

export default router
