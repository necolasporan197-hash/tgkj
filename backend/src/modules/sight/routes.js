/**
 * 我的小视频（Sight 记录）—— 对应官方 business.detail.myimages.record.MySightRecordActivity
 * Base: /api/sight
 * 复用 user_photos 表，media_type='video'
 */
import { Router } from 'express'
import { all, get, run } from '../../db/sqlite.js'
import { now } from '../../utils/datetime.js'
import { h, ok, pageResult, paramError, notFound } from '../../utils/response.js'
import { authRequired } from '../../middleware/auth.js'
import { pageParams } from '../_shared.js'

const router = Router()

/** 我的小视频列表（含审核状态） */
router.get(
  '/',
  authRequired,
  h((req, res) => {
    const { page, pageSize, offset } = pageParams(req.query)
    const list = all(
      `SELECT * FROM user_photos WHERE user_id=? AND media_type='video' ORDER BY sort, id DESC LIMIT ? OFFSET ?`,
      [req.user.id, pageSize, offset]
    )
    const total = get(`SELECT COUNT(*) c FROM user_photos WHERE user_id=? AND media_type='video'`, [req.user.id]).c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

/** 上传记录（文件本身走 /api/upload，这里登记元数据） */
router.post(
  '/',
  authRequired,
  h((req, res) => {
    const { url = '', cover = '', duration = 0 } = req.body || {}
    if (!url) throw paramError('视频地址不能为空')
    const r = run(
      `INSERT INTO user_photos (user_id, url, media_type, cover, sort, is_private, audit_status, created_at)
       VALUES (?,?, 'video', ?, 0, 0, 'pending', ?)`,
      [req.user.id, url, cover, now()]
    )
    return ok(res, { id: Number(r.lastInsertRowid), duration: Number(duration) || 0 }, '已提交，审核后展示')
  })
)

/** 删除我的小视频 */
router.delete(
  '/:id',
  authRequired,
  h((req, res) => {
    const row = get(`SELECT * FROM user_photos WHERE id=? AND user_id=? AND media_type='video'`, [
      Number(req.params.id),
      req.user.id
    ])
    if (!row) throw notFound('视频不存在')
    run('DELETE FROM user_photos WHERE id=?', [row.id])
    return ok(res, null, '已删除')
  })
)

export default router
