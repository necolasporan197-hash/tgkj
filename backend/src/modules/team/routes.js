/**
 * 团队模块：我的团队 / 成员 / 创建 / 加入 / 公告
 * Base: /api/team
 */
import { Router } from 'express'
import { all, get, run, tx } from '../../db/sqlite.js'
import { now } from '../../utils/datetime.js'
import { h, ok, paramError, notFound, CODE, BizError, forbidden } from '../../utils/response.js'
import { authRequired } from '../../middleware/auth.js'
import { publicUser } from '../_shared.js'

const router = Router()

/** 我所在的团队 */
router.get(
  '/mine',
  authRequired,
  h((req, res) => {
    const m = get(`SELECT t.*, tm.role FROM team_members tm JOIN teams t ON t.id=tm.team_id WHERE tm.user_id=? AND t.status='active'`, [
      req.user.id
    ])
    if (!m) return ok(res, null)
    return ok(res, {
      ...m,
      leader: publicUser(get('SELECT * FROM users WHERE id=?', [m.leader_id]), req.user.id),
      members: all(
        `SELECT u.*, tm.role, tm.joined_at FROM team_members tm JOIN users u ON u.id=tm.user_id WHERE tm.team_id=? ORDER BY tm.role='leader' DESC, tm.id ASC LIMIT 200`,
        [m.id]
      ).map((u) => ({ ...publicUser(u, req.user.id), teamRole: u.role, joinedAt: u.joined_at }))
    })
  })
)

/** 团队列表 */
router.get(
  '/',
  authRequired,
  h((req, res) => {
    const list = all(`SELECT t.*, u.nickname AS leaderName, u.avatar AS leaderAvatar FROM teams t JOIN users u ON u.id=t.leader_id WHERE t.status='active' ORDER BY t.member_count DESC LIMIT 100`)
    return ok(res, list)
  })
)

/** 创建团队 */
router.post(
  '/',
  authRequired,
  h((req, res) => {
    const { name, notice = '' } = req.body || {}
    if (!name || !String(name).trim()) throw paramError('请填写团队名称')
    if (get(`SELECT id FROM team_members tm JOIN teams t ON t.id=tm.team_id WHERE tm.user_id=? AND t.status='active'`, [req.user.id])) {
      throw new BizError(CODE.CONFLICT, '你已加入团队，请先退出')
    }
    const r = tx(() => {
      const ins = run(`INSERT INTO teams (name, leader_id, notice, member_count, status, created_at) VALUES (?,?,?,1,'active',?)`, [
        String(name).trim().slice(0, 30),
        req.user.id,
        notice,
        now()
      ])
      const tid = Number(ins.lastInsertRowid)
      run(`INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES (?,?, 'leader', ?)`, [tid, req.user.id, now()])
      return { id: tid }
    })
    return ok(res, r, '团队创建成功')
  })
)

/** 加入团队 */
router.post(
  '/:id/join',
  authRequired,
  h((req, res) => {
    const tid = Number(req.params.id)
    const t = get(`SELECT * FROM teams WHERE id=? AND status='active'`, [tid])
    if (!t) throw notFound('团队不存在')
    const exists = get(`SELECT id FROM team_members WHERE team_id=? AND user_id=?`, [tid, req.user.id])
    if (exists) throw new BizError(CODE.CONFLICT, '你已在该团队中')
    tx(() => {
      run(`INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES (?,?, 'member', ?)`, [tid, req.user.id, now()])
      run(`UPDATE teams SET member_count = member_count + 1 WHERE id=?`, [tid])
    })
    return ok(res, null, '加入成功')
  })
)

/** 退出团队 */
router.post(
  '/leave',
  authRequired,
  h((req, res) => {
    const m = get(`SELECT tm.*, t.leader_id FROM team_members tm JOIN teams t ON t.id=tm.team_id WHERE tm.user_id=?`, [req.user.id])
    if (!m) throw notFound('你尚未加入任何团队')
    if (m.leader_id === req.user.id) throw forbidden('队长不能退出，请先解散团队')
    tx(() => {
      run(`DELETE FROM team_members WHERE id=?`, [m.id])
      run(`UPDATE teams SET member_count = MAX(0, member_count - 1) WHERE id=?`, [m.team_id])
    })
    return ok(res, null, '已退出团队')
  })
)

/** 修改公告（队长） */
router.put(
  '/notice',
  authRequired,
  h((req, res) => {
    const t = get(`SELECT * FROM teams WHERE leader_id=? AND status='active'`, [req.user.id])
    if (!t) throw forbidden('仅队长可修改公告')
    run(`UPDATE teams SET notice=? WHERE id=?`, [String(req.body?.notice || '').slice(0, 200), t.id])
    return ok(res, null, '公告已更新')
  })
)

export default router
