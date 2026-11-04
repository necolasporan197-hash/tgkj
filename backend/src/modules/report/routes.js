/**
 * 举报模块：举报原因 / 提交举报
 * Base: /api/report
 */
import { Router } from 'express'
import { run } from '../../db/sqlite.js'
import { now } from '../../utils/datetime.js'
import { h, ok, paramError } from '../../utils/response.js'
import { authRequired } from '../../middleware/auth.js'

const router = Router()

export const REASONS = [
  '色情低俗', '骚扰辱骂', '虚假资料', '广告营销', '诈骗钱财',
  '诱导消费', '未成年人', '头像违规', '其他'
]

router.get('/reasons', h((req, res) => ok(res, REASONS)))

router.post(
  '/',
  authRequired,
  h((req, res) => {
    const { targetId, targetType = 'user', targetRef = null, reason = '', images = [] } = req.body || {}
    if (!targetId) throw paramError('举报对象不正确')
    if (!reason) throw paramError('请选择举报原因')
    const r = run(
      `INSERT INTO reports (reporter_id, target_id, target_type, target_ref, reason, images, status, created_at)
       VALUES (?,?,?,?,?,?, 'pending', ?)`,
      [req.user.id, Number(targetId), targetType, targetRef, reason, JSON.stringify(images || []), now()]
    )
    return ok(res, { id: Number(r.lastInsertRowid) }, '举报已提交，我们会尽快处理')
  })
)

export default router
