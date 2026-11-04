/**
 * 认证模块：资料认证 / 实名（身份证）/ 人脸 / 视频 / 车辆
 * Base: /api/verification
 */
import { Router } from 'express'
import { all, get, run } from '../../db/sqlite.js'
import { now } from '../../utils/datetime.js'
import { h, ok, paramError, CODE, BizError } from '../../utils/response.js'
import { authRequired } from '../../middleware/auth.js'
import { notify } from '../_shared.js'

const router = Router()

export const VTYPES = [
  { type: 'profile', name: '资料认证', desc: '上传真实头像与照片，提升信任度', needImages: 3, needName: false, needId: false },
  { type: 'idcard', name: '实名认证', desc: '上传身份证正反面，认证后可获得邀请码', needImages: 2, needName: true, needId: true },
  { type: 'face', name: '人脸认证', desc: '活体检测比对，确保本人操作', needImages: 1, needName: false, needId: false },
  { type: 'video', name: '视频认证', desc: '录制短视频，展示真实状态', needImages: 0, needName: false, needId: false },
  { type: 'vehicle', name: '车辆认证', desc: '上传行驶证，展示座驾信息', needImages: 1, needName: false, needId: false }
]

/** 认证类型列表 */
router.get('/types', h((req, res) => ok(res, VTYPES)))

/** 我的认证状态总览 */
router.get(
  '/status',
  authRequired,
  h((req, res) => {
    const rows = all(`SELECT * FROM verifications WHERE user_id=? ORDER BY id DESC`, [req.user.id])
    const latest = {}
    rows.forEach((r) => {
      if (!latest[r.vtype]) latest[r.vtype] = r
    })
    return ok(res, {
      userAuditStatus: req.user.audit_status,
      auditRemark: req.user.audit_remark,
      items: VTYPES.map((t) => ({
        ...t,
        status: latest[t.type]?.status || 'none',
        rejectReason: latest[t.type]?.reject_reason || '',
        submittedAt: latest[t.type]?.created_at || null
      }))
    })
  })
)

/** 提交认证 */
router.post(
  '/submit',
  authRequired,
  h((req, res) => {
    const { vtype, realName = '', idNumber = '', images = [], videoUrl = '' } = req.body || {}
    const meta = VTYPES.find((t) => t.type === vtype)
    if (!meta) throw paramError('认证类型不正确')
    if (meta.needImages && (images || []).length < meta.needImages) throw paramError(`请至少上传 ${meta.needImages} 张照片`)
    if (meta.needName && !realName.trim()) throw paramError('请填写真实姓名')
    if (meta.needId && !/^\d{15}(\d{2}[0-9Xx])?$/.test(String(idNumber))) throw paramError('身份证号格式不正确')

    const pending = get(`SELECT id FROM verifications WHERE user_id=? AND vtype=? AND status='pending'`, [req.user.id, vtype])
    if (pending) throw new BizError(CODE.CONFLICT, '该认证正在审核中，请耐心等待')

    const r = run(
      `INSERT INTO verifications (user_id, vtype, real_name, id_number, images, video_url, status, created_at) VALUES (?,?,?,?,?,?, 'pending', ?)`,
      [req.user.id, vtype, realName, idNumber, JSON.stringify(images || []), videoUrl, now()]
    )
    if (vtype === 'profile' && req.user.gender === 2) {
      run(`UPDATE users SET audit_status='pending', updated_at=? WHERE id=?`, [now(), req.user.id])
    }
    return ok(res, { id: Number(r.lastInsertRowid) }, '提交成功，等待审核')
  })
)

/** 我的认证记录 */
router.get(
  '/records',
  authRequired,
  h((req, res) => ok(res, all(`SELECT * FROM verifications WHERE user_id=? ORDER BY id DESC`, [req.user.id])))
)

export default router
