/**
 * 邀约活动模块：发布邀约 / 邀约列表 / 详情 / 报名 / 举报 / 活动规则
 * Base: /api/invite-events
 * 对齐官方：invite_post_fragment.xml（发布）/ item_invite.xml（列表项）
 *          invite_detail_fragment2.xml（详情+报名）/ layout_invite_rules.xml（规则）
 *          layout_invite_report.xml（举报）
 */
import { Router } from 'express'
import { all, get, run, tx } from '../../db/sqlite.js'
import { now } from '../../utils/datetime.js'
import { h, ok, paramError, notFound, CODE, BizError, pageResult } from '../../utils/response.js'
import { authRequired } from '../../middleware/auth.js'
import { publicUser, pageParams, notify, containsSensitive } from '../_shared.js'

const router = Router()

/** 活动主题（官方「请选择活动主题」下拉项） */
export const THEMES = ['运动健身', '美食探店', '观影', '旅行出游', '桌游剧本', '音乐现场', '看展', '其他']
/** 活动规则（layout_invite_rules.xml「活动★规则」弹窗） */
export const RULES = [
  '报名后请按时赴约，爽约将影响你的信用分',
  '邀约内容需真实有效，禁止发布低俗、色情交易或曝光他人隐私的内容',
  '请勿在邀约中泄露手机号、微信号等个人联系方式',
  '费用 AA 或由发起人说明，平台不参与任何线下交易',
  '线下见面请注意人身与财产安全，建议选择公共场所',
  '如遇虚假邀约可点击右上角「举报」，平台将核实处理'
]

const safeJson = (s, def) => {
  try {
    return s ? JSON.parse(s) : def
  } catch (e) {
    return def
  }
}

/** 报名头像堆叠（PileLayout，item_home_invite.xml） */
function joinPile(eventId) {
  return all(
    `SELECT u.id, u.avatar, u.gender, u.nickname FROM invite_event_joins j JOIN users u ON u.id=j.user_id
     WHERE j.event_id=? ORDER BY j.id LIMIT 4`,
    [eventId]
  ).map((u) => ({ id: u.id, avatar: u.avatar, gender: u.gender, nickname: u.nickname }))
}

/** 组装邀约输出结构 */
function mapEvent(e, viewerId) {
  const author = get('SELECT * FROM users WHERE id=?', [e.user_id])
  return {
    id: e.id,
    theme: e.theme,
    tags: safeJson(e.tags, []),
    city: e.city,
    eventDate: e.event_date,
    content: e.content,
    images: safeJson(e.images, []),
    enrollRequired: e.enroll_required === 1,
    hot: e.hot || 0,
    joinCount: e.join_count || 0,
    pile: joinPile(e.id),
    status: e.status,
    createdAt: e.created_at,
    author: publicUser(author, viewerId),
    joined: viewerId ? !!get('SELECT id FROM invite_event_joins WHERE event_id=? AND user_id=?', [e.id, viewerId]) : false
  }
}

/** 活动规则（弹窗） */
router.get('/rules', h((req, res) => ok(res, { themes: THEMES, rules: RULES })))

/** 邀约列表（仅审核通过；可按城市/主题筛选） */
router.get(
  '/',
  authRequired,
  h((req, res) => {
    const { page, pageSize, offset } = pageParams(req.query)
    const cond = [`status='approved'`]
    const params = []
    if (req.query.city) {
      cond.push('city=?')
      params.push(req.query.city)
    }
    if (req.query.theme) {
      cond.push('theme=?')
      params.push(req.query.theme)
    }
    const where = `WHERE ${cond.join(' AND ')}`
    const rows = all(`SELECT * FROM invite_events ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, pageSize, offset])
    const total = get(`SELECT COUNT(*) c FROM invite_events ${where}`, params).c
    return ok(res, pageResult(rows.map((e) => mapEvent(e, req.user.id)), total, page, pageSize))
  })
)

/** 我发布的邀约 */
router.get(
  '/mine',
  authRequired,
  h((req, res) => {
    const { page, pageSize, offset } = pageParams(req.query)
    const rows = all(`SELECT * FROM invite_events WHERE user_id=? ORDER BY id DESC LIMIT ? OFFSET ?`, [
      req.user.id,
      pageSize,
      offset
    ])
    const total = get('SELECT COUNT(*) c FROM invite_events WHERE user_id=?', [req.user.id]).c
    return ok(res, pageResult(rows.map((e) => mapEvent(e, req.user.id)), total, page, pageSize))
  })
)

/** 邀约详情（含报名用户） */
router.get(
  '/:id',
  authRequired,
  h((req, res) => {
    const e = get('SELECT * FROM invite_events WHERE id=?', [Number(req.params.id)])
    if (!e) throw notFound('邀约不存在')
    run('UPDATE invite_events SET hot = hot + 1 WHERE id=?', [e.id])
    const data = mapEvent(e, req.user.id)
    data.hot += 1
    data.joins = all(
      `SELECT j.created_at, u.* FROM invite_event_joins j JOIN users u ON u.id=j.user_id WHERE j.event_id=? ORDER BY j.id`,
      [e.id]
    ).map((u) => ({ ...publicUser(u, req.user.id), joinedAt: u.created_at }))
    return ok(res, data)
  })
)

/** 发布邀约 */
router.post(
  '/',
  authRequired,
  h((req, res) => {
    const { theme, tags = [], city = '', eventDate = '', content = '', images = [], enrollRequired = true } = req.body || {}
    if (!theme) throw paramError('请选择活动主题')
    if (!String(content).trim()) throw paramError('请填写活动介绍')
    if (containsSensitive(content)) throw new BizError(CODE.PARAM, '内容包含敏感词，请修改后重试')
    if (Array.isArray(tags) && tags.length > 3) throw paramError('最多选择 3 个标签')
    const r = run(
      `INSERT INTO invite_events (user_id, theme, tags, city, event_date, content, images, enroll_required, hot, join_count, status, created_at)
       VALUES (?,?,?,?,?,?,?,?,0,0,'pending',?)`,
      [
        req.user.id,
        String(theme).slice(0, 20),
        JSON.stringify(Array.isArray(tags) ? tags.slice(0, 3) : []),
        String(city).slice(0, 20),
        String(eventDate).slice(0, 20),
        String(content).slice(0, 100),
        JSON.stringify(Array.isArray(images) ? images.slice(0, 9) : []),
        enrollRequired ? 1 : 0,
        now()
      ]
    )
    return ok(res, { id: Number(r.lastInsertRowid), status: 'pending' }, '发布成功，待审核通过后展示')
  })
)

/** 报名 */
router.post(
  '/:id/join',
  authRequired,
  h((req, res) => {
    const id = Number(req.params.id)
    const e = get(`SELECT * FROM invite_events WHERE id=?`, [id])
    if (!e) throw notFound('邀约不存在')
    if (e.user_id === req.user.id) throw new BizError(CODE.CONFLICT, '不能报名自己发起的邀约')
    if (get('SELECT id FROM invite_event_joins WHERE event_id=? AND user_id=?', [id, req.user.id])) {
      throw new BizError(CODE.CONFLICT, '你已报名该邀约')
    }
    tx(() => {
      run('INSERT INTO invite_event_joins (event_id, user_id, created_at) VALUES (?,?,?)', [id, req.user.id, now()])
      run('UPDATE invite_events SET join_count = join_count + 1 WHERE id=?', [id])
      notify(e.user_id, '报名通知', `${req.user.nickname} 报名了你的邀约「${e.theme}」`, 'enroll')
    })
    return ok(res, null, '报名成功')
  })
)

/** 举报邀约（layout_invite_report.xml） */
router.post(
  '/:id/report',
  authRequired,
  h((req, res) => {
    const id = Number(req.params.id)
    const e = get('SELECT * FROM invite_events WHERE id=?', [id])
    if (!e) throw notFound('邀约不存在')
    const reason = String((req.body || {}).reason || '')
    if (!reason) throw paramError('请选择举报原因')
    run(
      `INSERT INTO reports (reporter_id, target_id, target_type, target_ref, reason, images, status, created_at)
       VALUES (?,?, 'invite_event', ?, ?, '[]', 'pending', ?)`,
      [req.user.id, id, String(id), reason, now()]
    )
    return ok(res, null, '举报已提交，我们会尽快处理')
  })
)

export default router
