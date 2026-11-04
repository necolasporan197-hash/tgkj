/**
 * 账号注销 —— 对应官方 activity.ui.activity.CancellationActivity / CancellationReasonActivity
 * Base: /api/cancellation
 */
import { Router } from 'express'
import { get, run } from '../../db/sqlite.js'
import { now } from '../../utils/datetime.js'
import { h, ok, paramError, CODE, BizError } from '../../utils/response.js'
import { authRequired } from '../../middleware/auth.js'

const router = Router()

/** 注销原因（对应 CancellationReasonActivity 列表项） */
const REASONS = [
  '找到了合适的另一半',
  '不想继续使用了',
  '信息太多打扰',
  '担心隐私泄露',
  '使用体验不好',
  '其他原因'
]

/** 注销须知（对应 CancellationActivity 文案） */
const NOTICE = [
  '注销后账号将无法登录，所有资料、动态、金币与余额将被清除；',
  '注销申请提交后进入人工审核，审核期间可撤回；',
  '审核通过后账号不可恢复，请谨慎操作。'
]

/** 注销原因与须知 */
router.get('/reasons', (req, res) => ok(res, { reasons: REASONS, notice: NOTICE }))

/** 当前注销申请状态 */
router.get(
  '/status',
  authRequired,
  h((req, res) => {
    const record = get(`SELECT * FROM cancellations WHERE user_id=? ORDER BY id DESC LIMIT 1`, [req.user.id])
    return ok(res, { record: record || null, pending: record?.status === 'pending' })
  })
)

/** 提交注销申请 */
router.post(
  '/',
  authRequired,
  h((req, res) => {
    const { reason = '', detail = '' } = req.body || {}
    if (!reason.trim()) throw paramError('请选择注销原因')
    const exists = get(`SELECT id FROM cancellations WHERE user_id=? AND status='pending'`, [req.user.id])
    if (exists) throw new BizError(CODE.CONFLICT, '已有待处理的注销申请')
    const r = run(
      `INSERT INTO cancellations (user_id, reason, detail, status, created_at) VALUES (?,?,?, 'pending', ?)`,
      [req.user.id, reason.trim(), String(detail).trim(), now()]
    )
    return ok(res, { id: Number(r.lastInsertRowid) }, '注销申请已提交，等待审核')
  })
)

/** 撤回注销申请 */
router.post(
  '/cancel',
  authRequired,
  h((req, res) => {
    const rec = get(`SELECT * FROM cancellations WHERE user_id=? AND status='pending' ORDER BY id DESC LIMIT 1`, [
      req.user.id
    ])
    if (!rec) throw new BizError(CODE.BIZ, '没有可撤回的注销申请')
    run(`UPDATE cancellations SET status='rejected', remark='用户主动撤回', handled_at=? WHERE id=?`, [now(), rec.id])
    return ok(res, null, '已撤回注销申请')
  })
)

export default router
