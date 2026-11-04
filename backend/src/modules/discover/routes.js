/**
 * 首页/发现模块：顶部 Tab、Banner、话题、首页推荐流
 * Base: /api/discover
 */
import { Router } from 'express'
import { all, get } from '../../db/sqlite.js'
import { h, ok, pageResult } from '../../utils/response.js'
import { authOptional } from '../../middleware/auth.js'
import { publicUser, withDistance, pageParams } from '../_shared.js'

const router = Router()

/** 首页顶部 Tab */
router.get('/tabs', h((req, res) => ok(res, all('SELECT id, name FROM discover_tabs WHERE status=1 ORDER BY sort, id'))))

/** 轮播 */
router.get(
  '/banners',
  h((req, res) => {
    const position = req.query.position || 'home'
    return ok(res, all('SELECT id, image, link FROM banners WHERE status=1 AND position=? ORDER BY sort, id', [position]))
  })
)

/** 话题列表 */
router.get('/topics', h((req, res) => ok(res, all('SELECT id, name FROM topics WHERE status=1 ORDER BY sort, id'))))

/**
 * 首页推荐流：按 tab 返回
 *  - recommend/nearby/new/beauty 均返回用户卡片（女性需已审核通过）
 *  - moments 返回动态流
 */
router.get(
  '/feed',
  authOptional,
  h((req, res) => {
    const { page, pageSize, offset } = pageParams(req.query)
    const tab = String(req.query.tab || 'recommend')
    const me = req.user
    const targetGender = me ? (me.gender === 1 ? 2 : 1) : 2
    const params = [targetGender]
    let where = `WHERE status='active' AND gender=? AND audit_status='approved'`
    if (me) {
      where += ' AND id<>?'
      params.push(me.id)
      where += ' AND id NOT IN (SELECT target_id FROM blacklist WHERE user_id=?)'
      params.push(me.id)
    }
    let order = 'online DESC, is_vip DESC, id DESC'
    if (tab === 'new') order = 'id DESC'
    if (tab === 'nearby') order = 'online DESC, id DESC'
    const rows = all(`SELECT * FROM users ${where} ORDER BY ${order} LIMIT ? OFFSET ?`, [...params, pageSize, offset])
    const total = get(`SELECT COUNT(*) c FROM users ${where}`, params).c
    const list = withDistance(rows, Number(req.query.lat), Number(req.query.lng)).map((u) => publicUser(u, me?.id))
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

export default router
