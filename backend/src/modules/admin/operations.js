/**
 * 管理端运营：Banner / 首页 Tab / 话题 / 通知推送 / 团队 / 邀请 / 认证审核 / 用户消息
 * Base: /api/admin/operations
 */
import { Router } from 'express'
import { all, get, run, tx } from '../../db/sqlite.js'
import { now } from '../../utils/datetime.js'
import { h, ok, pageResult, paramError, notFound, CODE, BizError } from '../../utils/response.js'
import { adminLog } from '../../middleware/error.js'
import { notify, sendMessage } from '../_shared.js'

const router = Router()

const pg = (q) => {
  const page = Math.max(1, Number(q.page) || 1)
  const pageSize = Math.min(100, Number(q.pageSize) || 20)
  return { page, pageSize, offset: (page - 1) * pageSize }
}

const jparse = (s, d) => {
  try {
    return s ? JSON.parse(s) : d
  } catch (e) {
    return d
  }
}

// ---------------- Banner ----------------
router.get('/banners', h((req, res) => ok(res, all('SELECT * FROM banners ORDER BY sort, id'))))

router.post(
  '/banners',
  h((req, res) => {
    const { position = 'home', image, link = '', sort = 0, status = 1 } = req.body || {}
    if (!image) throw paramError('请上传图片')
    const r = run(`INSERT INTO banners (position, image, link, sort, status, created_at) VALUES (?,?,?,?,?,?)`, [
      position,
      image,
      link,
      Number(sort),
      Number(status),
      now()
    ])
    adminLog(req, 'operations', 'banner-create', r.lastInsertRowid, image)
    return ok(res, { id: Number(r.lastInsertRowid) }, '已新增')
  })
)

router.put(
  '/banners/:id',
  h((req, res) => {
    const id = Number(req.params.id)
    const allow = ['position', 'image', 'link', 'sort', 'status']
    const sets = []
    const vals = []
    allow.forEach((k) => {
      if (req.body?.[k] !== undefined) {
        sets.push(`${k}=?`)
        vals.push(req.body[k])
      }
    })
    if (!sets.length) throw paramError('没有需要更新的字段')
    run(`UPDATE banners SET ${sets.join(',')} WHERE id=?`, [...vals, id])
    adminLog(req, 'operations', 'banner-update', id, JSON.stringify(req.body))
    return ok(res, null, '已保存')
  })
)

router.delete(
  '/banners/:id',
  h((req, res) => {
    run('DELETE FROM banners WHERE id=?', [Number(req.params.id)])
    adminLog(req, 'operations', 'banner-delete', req.params.id, '删除 Banner')
    return ok(res, null, '已删除')
  })
)

// ---------------- 首页 Tab ----------------
router.get('/tabs', h((req, res) => ok(res, all('SELECT * FROM discover_tabs ORDER BY sort, id'))))

router.post(
  '/tabs',
  h((req, res) => {
    const { name, sort = 0, status = 1 } = req.body || {}
    if (!name) throw paramError('名称必填')
    const r = run(`INSERT INTO discover_tabs (name, sort, status) VALUES (?,?,?)`, [name, Number(sort), Number(status)])
    adminLog(req, 'operations', 'tab-create', r.lastInsertRowid, name)
    return ok(res, { id: Number(r.lastInsertRowid) }, '已新增')
  })
)

router.put(
  '/tabs/:id',
  h((req, res) => {
    const id = Number(req.params.id)
    run(`UPDATE discover_tabs SET name=?, sort=?, status=? WHERE id=?`, [
      req.body?.name ?? '',
      Number(req.body?.sort) || 0,
      Number(req.body?.status) || 0,
      id
    ])
    adminLog(req, 'operations', 'tab-update', id, JSON.stringify(req.body))
    return ok(res, null, '已保存')
  })
)

router.delete(
  '/tabs/:id',
  h((req, res) => {
    run('DELETE FROM discover_tabs WHERE id=?', [Number(req.params.id)])
    adminLog(req, 'operations', 'tab-delete', req.params.id, '删除 Tab')
    return ok(res, null, '已删除')
  })
)

// ---------------- 话题 ----------------
router.get('/topics', h((req, res) => ok(res, all('SELECT * FROM topics ORDER BY sort, id'))))

router.post(
  '/topics',
  h((req, res) => {
    const { name, sort = 0, status = 1 } = req.body || {}
    if (!name) throw paramError('名称必填')
    const r = run(`INSERT INTO topics (name, sort, status, created_at) VALUES (?,?,?,?)`, [name, Number(sort), Number(status), now()])
    adminLog(req, 'operations', 'topic-create', r.lastInsertRowid, name)
    return ok(res, { id: Number(r.lastInsertRowid) }, '已新增')
  })
)

router.put(
  '/topics/:id',
  h((req, res) => {
    const id = Number(req.params.id)
    run(`UPDATE topics SET name=?, sort=?, status=? WHERE id=?`, [
      req.body?.name ?? '',
      Number(req.body?.sort) || 0,
      Number(req.body?.status) || 0,
      id
    ])
    adminLog(req, 'operations', 'topic-update', id, JSON.stringify(req.body))
    return ok(res, null, '已保存')
  })
)

router.delete(
  '/topics/:id',
  h((req, res) => {
    run('DELETE FROM topics WHERE id=?', [Number(req.params.id)])
    adminLog(req, 'operations', 'topic-delete', req.params.id, '删除话题')
    return ok(res, null, '已删除')
  })
)

// ---------------- 通知推送 ----------------
router.get(
  '/notifications',
  h((req, res) => {
    const { page, pageSize, offset } = pg(req.query)
    const list = all(
      `SELECT n.*, u.nickname FROM notifications n LEFT JOIN users u ON u.id=n.user_id WHERE n.user_id > 0 ORDER BY n.id DESC LIMIT ? OFFSET ?`,
      [pageSize, offset]
    )
    const total = get('SELECT COUNT(*) c FROM notifications WHERE user_id > 0').c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

/** 推送系统通知 / 聊天消息（支持全量或指定用户） */
router.post(
  '/notifications/push',
  h((req, res) => {
    const { userIds = [], all: toAll = false, title = '', content, asMessage = false } = req.body || {}
    if (!content) throw paramError('请填写推送内容')
    let targets = userIds.map(Number).filter(Boolean)
    if (toAll) targets = all(`SELECT id FROM users WHERE status='active'`).map((u) => u.id)
    if (!targets.length) throw paramError('请选择推送目标')
    tx(() => {
      targets.forEach((uid) => {
        notify(uid, title || '系统通知', content, 'system')
        if (asMessage) sendMessage({ fromId: 0, toId: uid, content, msgType: 'system' })
      })
    })
    adminLog(req, 'operations', 'push', targets.length, content.slice(0, 60))
    return ok(res, { count: targets.length }, `已推送给 ${targets.length} 位用户`)
  })
)

// ---------------- 团队 ----------------
router.get(
  '/teams',
  h((req, res) => {
    const { page, pageSize, offset } = pg(req.query)
    const list = all(
      `SELECT t.*, u.nickname AS leaderName, u.phone AS leaderPhone FROM teams t JOIN users u ON u.id=t.leader_id
       ORDER BY t.id DESC LIMIT ? OFFSET ?`,
      [pageSize, offset]
    )
    const total = get('SELECT COUNT(*) c FROM teams').c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

router.get(
  '/teams/:id',
  h((req, res) => {
    const t = get('SELECT * FROM teams WHERE id=?', [Number(req.params.id)])
    if (!t) throw notFound('团队不存在')
    return ok(res, {
      ...t,
      members: all(
        `SELECT u.id, u.nickname, u.avatar, u.phone, tm.role, tm.joined_at FROM team_members tm JOIN users u ON u.id=tm.user_id WHERE tm.team_id=? ORDER BY tm.id`,
        [t.id]
      )
    })
  })
)

router.delete(
  '/teams/:id',
  h((req, res) => {
    const id = Number(req.params.id)
    tx(() => {
      run('DELETE FROM team_members WHERE team_id=?', [id])
      run('DELETE FROM teams WHERE id=?', [id])
    })
    adminLog(req, 'operations', 'team-delete', id, '解散团队')
    return ok(res, null, '已解散')
  })
)

// ---------------- 邀请记录 ----------------
router.get(
  '/invites',
  h((req, res) => {
    const { page, pageSize, offset } = pg(req.query)
    const list = all(
      `SELECT r.*, a.nickname AS inviterName, a.phone AS inviterPhone, b.nickname AS inviteeName, b.phone AS inviteePhone
       FROM invite_records r JOIN users a ON a.id=r.inviter_id JOIN users b ON b.id=r.invitee_id
       ORDER BY r.id DESC LIMIT ? OFFSET ?`,
      [pageSize, offset]
    )
    const total = get('SELECT COUNT(*) c FROM invite_records').c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

/** 邀请排行榜 */
router.get(
  '/invites/ranking',
  h((req, res) =>
    ok(
      res,
      all(
        `SELECT u.id, u.nickname, u.phone, u.avatar, COUNT(r.id) AS inviteCount, IFNULL(SUM(r.reward_coins),0) AS coins
         FROM invite_records r JOIN users u ON u.id=r.inviter_id GROUP BY r.inviter_id ORDER BY inviteCount DESC LIMIT 100`
      )
    )
  )
)

// ---------------- 邀约活动（invite_events） ----------------
router.get(
  '/invite-events',
  h((req, res) => {
    const { page, pageSize, offset } = pg(req.query)
    const cond = []
    const params = []
    if (req.query.status) {
      cond.push('e.status=?')
      params.push(req.query.status)
    }
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : ''
    const list = all(
      `SELECT e.*, u.nickname, u.phone, u.avatar FROM invite_events e JOIN users u ON u.id=e.user_id
       ${where} ORDER BY CASE e.status WHEN 'pending' THEN 0 ELSE 1 END, e.id DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    ).map((e) => ({ ...e, tags: jparse(e.tags, []), images: jparse(e.images, []) }))
    const total = get(`SELECT COUNT(*) c FROM invite_events e ${where}`, params).c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

router.post(
  '/invite-events/:id/audit',
  h((req, res) => {
    const id = Number(req.params.id)
    const { action, rejectReason = '' } = req.body || {}
    if (!['approve', 'reject'].includes(action)) throw paramError('审核动作不正确')
    const e = get('SELECT * FROM invite_events WHERE id=?', [id])
    if (!e) throw notFound('邀约不存在')
    run('UPDATE invite_events SET status=?, reject_reason=? WHERE id=?', [
      action === 'approve' ? 'approved' : 'rejected',
      rejectReason,
      id
    ])
    notify(
      e.user_id,
      '邀约审核结果',
      action === 'approve'
        ? `你发布的邀约「${e.theme}」已通过审核`
        : `邀约「${e.theme}」未通过${rejectReason ? `：${rejectReason}` : ''}`,
      'audit'
    )
    adminLog(req, 'operations', 'invite-event-audit', id, action)
    return ok(res, null, action === 'approve' ? '已通过' : '已驳回')
  })
)

router.delete(
  '/invite-events/:id',
  h((req, res) => {
    const id = Number(req.params.id)
    tx(() => {
      run('DELETE FROM invite_event_joins WHERE event_id=?', [id])
      run('DELETE FROM invite_events WHERE id=?', [id])
    })
    adminLog(req, 'operations', 'invite-event-delete', id, 'delete')
    return ok(res, null, '已删除')
  })
)

// ---------------- 认证审核 ----------------
router.get(
  '/verifications',
  h((req, res) => {
    const { page, pageSize, offset } = pg(req.query)
    const params = []
    const cond = []
    if (req.query.status) {
      cond.push('v.status=?')
      params.push(req.query.status)
    }
    if (req.query.vtype) {
      cond.push('v.vtype=?')
      params.push(req.query.vtype)
    }
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : ''
    const list = all(
      `SELECT v.*, u.nickname, u.phone, u.avatar FROM verifications v JOIN users u ON u.id=v.user_id ${where}
       ORDER BY CASE v.status WHEN 'pending' THEN 0 ELSE 1 END, v.id DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    ).map((v) => ({ ...v, images: safeJson(v.images) }))
    const total = get(`SELECT COUNT(*) c FROM verifications v ${where}`, params).c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

router.post(
  '/verifications/:id/audit',
  h((req, res) => {
    const id = Number(req.params.id)
    const { action, rejectReason = '' } = req.body || {}
    if (!['approve', 'reject'].includes(action)) throw paramError('审核动作不正确')
    const v = get('SELECT * FROM verifications WHERE id=?', [id])
    if (!v) throw notFound('认证记录不存在')
    tx(() => {
      run('UPDATE verifications SET status=?, reject_reason=?, reviewed_at=?, reviewer_id=? WHERE id=?', [
        action === 'approve' ? 'approved' : 'rejected',
        rejectReason,
        now(),
        req.admin.id,
        id
      ])
      // 资料认证通过 => 女性用户转为可推荐
      if (action === 'approve' && v.vtype === 'profile') {
        run(`UPDATE users SET audit_status='approved', audit_remark='', updated_at=? WHERE id=? AND gender=2`, [now(), v.user_id])
      }
      if (action === 'reject' && v.vtype === 'profile') {
        run(`UPDATE users SET audit_status='rejected', audit_remark=?, updated_at=? WHERE id=? AND gender=2`, [rejectReason, now(), v.user_id])
      }
    })
    notify(
      v.user_id,
      '认证审核结果',
      action === 'approve' ? '你的认证已通过' : `认证未通过${rejectReason ? `：${rejectReason}` : ''}`,
      'audit'
    )
    adminLog(req, 'operations', 'verification-audit', id, action)
    return ok(res, null, action === 'approve' ? '已通过' : '已驳回')
  })
)

// ---------------- 会话（客服会话 / 用户会话 两类分开） ----------------
/**
 * type=service：客服会话（会话双方存在 role=9 客服账号）
 * type=user   ：用户会话（双方均为普通用户）
 * 不传 type   ：全部
 */
router.get(
  '/conversations',
  h((req, res) => {
    const { page, pageSize, offset } = pg(req.query)
    const type = String(req.query.type || '').toLowerCase()
    let where = ''
    if (type === 'service') where = 'WHERE ua.role=9 OR ub.role=9'
    else if (type === 'user') where = 'WHERE ua.role<>9 AND ub.role<>9'
    const list = all(
      `SELECT c.*, ua.nickname AS nameA, ua.avatar AS avatarA, ua.role AS roleA,
              ub.nickname AS nameB, ub.avatar AS avatarB, ub.role AS roleB
       FROM conversations c JOIN users ua ON ua.id=c.user_a JOIN users ub ON ub.id=c.user_b
       ${where}
       ORDER BY c.last_time DESC LIMIT ? OFFSET ?`,
      [pageSize, offset]
    ).map((c) => ({ ...c, isService: c.roleA === 9 || c.roleB === 9 }))
    const total = get(
      `SELECT COUNT(*) c FROM conversations c JOIN users ua ON ua.id=c.user_a JOIN users ub ON ub.id=c.user_b ${where}`
    ).c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

router.get(
  '/conversations/:id/messages',
  h((req, res) =>
    ok(
      res,
      all(`SELECT * FROM messages WHERE conv_id=? ORDER BY id DESC LIMIT 200`, [Number(req.params.id)]).reverse()
    )
  )
)

/**
 * 管理员发送消息
 *  - asService=true：以客服账号身份回复，消息落入「客服会话」，用户消息页可见
 *  - 默认：以系统身份下发站内通知
 */
router.post(
  '/messages/send',
  h((req, res) => {
    const { toId, content, asService = false } = req.body || {}
    if (!toId || !content) throw paramError('缺少接收人或内容')
    const tid = Number(toId)
    if (asService) {
      const agent = get(`SELECT * FROM users WHERE role=9 AND status='active' ORDER BY id LIMIT 1`)
      if (!agent) throw notFound('客服账号未配置')
      const r = sendMessage({ fromId: agent.id, toId: tid, content, msgType: 'text' })
      adminLog(req, 'operations', 'service-reply', tid, String(content).slice(0, 60))
      return ok(res, r, '已回复')
    }
    const r = sendMessage({ fromId: 0, toId: tid, content, msgType: 'system' })
    adminLog(req, 'operations', 'message-send', tid, String(content).slice(0, 60))
    return ok(res, r, '发送成功')
  })
)

/** 敏感词 */
router.get('/sensitive-words', h((req, res) => ok(res, all('SELECT * FROM sensitive_words ORDER BY id DESC'))))

router.post(
  '/sensitive-words',
  h((req, res) => {
    const { words = [] } = req.body || {}
    const list = Array.isArray(words) ? words : [words]
    let added = 0
    list.filter(Boolean).forEach((w) => {
      const r = run(`INSERT OR IGNORE INTO sensitive_words (word, created_at) VALUES (?,?)`, [String(w).trim(), now()])
      added += r.changes
    })
    adminLog(req, 'operations', 'sensitive-add', added, list.join(',').slice(0, 100))
    return ok(res, { added }, '已添加')
  })
)

router.delete(
  '/sensitive-words/:id',
  h((req, res) => {
    run('DELETE FROM sensitive_words WHERE id=?', [Number(req.params.id)])
    adminLog(req, 'operations', 'sensitive-delete', req.params.id, '删除敏感词')
    return ok(res, null, '已删除')
  })
)

// ---------------- 任务中心（TaskCenterActivity） ----------------
router.get('/tasks', h((req, res) => ok(res, all('SELECT * FROM tasks ORDER BY sort, id'))))

router.post(
  '/tasks',
  h((req, res) => {
    const { code, title, subtitle = '', icon = '', rewardCoins = 0, target = 1, type = 'daily', action = '', sort = 0, status = 1 } = req.body || {}
    if (!code || !title) throw paramError('任务标识与名称必填')
    const r = run(
      `INSERT INTO tasks (code, title, subtitle, icon, reward_coins, target, type, action, sort, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [code, title, subtitle, icon, Number(rewardCoins) || 0, Number(target) || 1, type, action, Number(sort) || 0, Number(status), now()]
    )
    adminLog(req, 'operations', 'task-create', r.lastInsertRowid, code)
    return ok(res, { id: Number(r.lastInsertRowid) }, '已新增')
  })
)

router.put(
  '/tasks/:id',
  h((req, res) => {
    const id = Number(req.params.id)
    const allow = { title: 'title', subtitle: 'subtitle', icon: 'icon', rewardCoins: 'reward_coins', target: 'target', type: 'type', action: 'action', sort: 'sort', status: 'status' }
    const sets = []
    const vals = []
    Object.entries(allow).forEach(([k, col]) => {
      if (req.body?.[k] !== undefined) {
        sets.push(`${col}=?`)
        vals.push(req.body[k])
      }
    })
    if (!sets.length) throw paramError('没有需要更新的字段')
    run(`UPDATE tasks SET ${sets.join(',')} WHERE id=?`, [...vals, id])
    adminLog(req, 'operations', 'task-update', id, JSON.stringify(req.body))
    return ok(res, null, '已保存')
  })
)

router.delete(
  '/tasks/:id',
  h((req, res) => {
    const id = Number(req.params.id)
    tx(() => {
      run('DELETE FROM user_tasks WHERE task_code=(SELECT code FROM tasks WHERE id=?)', [id])
      run('DELETE FROM tasks WHERE id=?', [id])
    })
    adminLog(req, 'operations', 'task-delete', id, '删除任务')
    return ok(res, null, '已删除')
  })
)

// ---------------- 意见反馈（FeedbackActivity） ----------------
router.get(
  '/feedbacks',
  h((req, res) => {
    const { page, pageSize, offset } = pg(req.query)
    const params = []
    const cond = []
    if (req.query.status) {
      cond.push('f.status=?')
      params.push(req.query.status)
    }
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : ''
    const list = all(
      `SELECT f.*, u.nickname, u.phone FROM feedbacks f JOIN users u ON u.id=f.user_id ${where}
       ORDER BY CASE f.status WHEN 'pending' THEN 0 ELSE 1 END, f.id DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    ).map((f) => ({ ...f, images: safeJson(f.images) }))
    const total = get(`SELECT COUNT(*) c FROM feedbacks f ${where}`, params).c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

router.post(
  '/feedbacks/:id/reply',
  h((req, res) => {
    const id = Number(req.params.id)
    const { reply = '', status = 'replied' } = req.body || {}
    const f = get('SELECT * FROM feedbacks WHERE id=?', [id])
    if (!f) throw notFound('反馈不存在')
    run('UPDATE feedbacks SET reply=?, status=?, replied_at=? WHERE id=?', [reply, status, now(), id])
    if (reply) notify(f.user_id, '反馈回复', reply, 'system')
    adminLog(req, 'operations', 'feedback-reply', id, String(reply).slice(0, 60))
    return ok(res, null, '已回复')
  })
)

const safeJson = (s) => {
  try {
    return JSON.parse(s || '[]')
  } catch {
    return []
  }
}

export default router
