/**
 * 用户模块：个人资料 / 推荐 / 附近 / 详情 / 关注 / 访客 / 黑名单 / 相册 / 解锁
 * Base: /api/users
 */
import { Router } from 'express'
import { all, get, run, tx } from '../../db/sqlite.js'
import { now, addDays } from '../../utils/datetime.js'
import { h, ok, pageResult, CODE, BizError, paramError, notFound } from '../../utils/response.js'
import { authRequired, authOptional } from '../../middleware/auth.js'
import { publicUser, withDistance, consumeCoins, configValue, notify, pageParams, isActiveVip } from '../_shared.js'
import { bumpTask } from '../task/routes.js'

const router = Router()

/** 我的资料 */
router.get(
  '/me',
  authRequired,
  h((req, res) => {
    const u = req.user
    return ok(res, {
      ...publicUser(u, u.id),
      phone: u.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
      coins: u.coins,
      balance: Number(u.balance.toFixed(2)),
      inviteCode: u.invite_code,
      auditStatus: u.audit_status,
      auditRemark: u.audit_remark,
      vipExpireAt: u.vip_expire_at,
      isVip: isActiveVip(u),
      stats: {
        follows: get('SELECT COUNT(*) c FROM follows WHERE user_id=?', [u.id]).c,
        visitors: get('SELECT COUNT(*) c FROM visits WHERE target_id=?', [u.id]).c,
        moments: get(`SELECT COUNT(*) c FROM moments WHERE user_id=? AND status='normal'`, [u.id]).c,
        likes: get(`SELECT COUNT(*) c FROM moment_likes WHERE user_id=?`, [u.id]).c
      }
    })
  })
)

/** 更新我的资料 */
router.put(
  '/me',
  authRequired,
  h((req, res) => {
    const allow = ['nickname', 'avatar', 'gender', 'birthday', 'city', 'occupation', 'wechat', 'feeling', 'bio', 'height', 'weight', 'lat', 'lng']
    const sets = []
    const vals = []
    allow.forEach((k) => {
      if (req.body?.[k] !== undefined) {
        sets.push(`${k} = ?`)
        vals.push(req.body[k])
      }
    })
    if (!sets.length) throw paramError('没有需要更新的字段')
    // 修改核心资料后女性用户重新进入审核
    const coreChanged = ['avatar', 'gender', 'birthday'].some((k) => req.body?.[k] !== undefined)
    if (coreChanged && req.user.gender === 2 && configValue('female_audit_required', '1') === '1') {
      sets.push(`audit_status = 'pending'`)
    }
    if (req.body?.tags) {
      run('DELETE FROM user_tags WHERE user_id = ?', [req.user.id])
      ;(req.body.tags || []).slice(0, 8).forEach((tag) => run('INSERT INTO user_tags (user_id, tag) VALUES (?,?)', [req.user.id, tag]))
    }
    sets.push('updated_at = ?')
    vals.push(now(), req.user.id)
    run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, vals)
    // 任务中心：资料补全（头像+昵称+简介）后推进「完善资料」任务
    const fresh = get('SELECT avatar, nickname, bio FROM users WHERE id=?', [req.user.id])
    if (fresh?.avatar && fresh?.nickname && fresh?.bio) bumpTask(req.user.id, 'complete_profile', 1)
    return ok(res, { ...publicUser(get('SELECT * FROM users WHERE id=?', [req.user.id]), req.user.id), auditStatus: get('SELECT audit_status FROM users WHERE id=?', [req.user.id]).audit_status }, '资料已更新')
  })
)

/** 推荐列表（只推荐审核通过的女性；男性登录时也推荐已通过审核的异性） */
router.get(
  '/recommend',
  authOptional,
  h((req, res) => {
    const { page, pageSize, offset } = pageParams(req.query)
    const me = req.user
    const isNewTab = req.query.sort === 'new'
    const targetGender = me ? (me.gender === 1 ? 2 : 1) : 2
    const city = req.query.city || ''
    const params = [targetGender]
    let where = `WHERE status='active' AND gender = ? AND audit_status='approved'`
    // 「新人」栏不限城市（官方新人列表可见异地用户）
    if (city && !isNewTab) {
      where += ' AND city = ?'
      params.push(city)
    }
    if (me) {
      where += ' AND id <> ?'
      params.push(me.id)
      where += ' AND id NOT IN (SELECT target_id FROM blacklist WHERE user_id = ?)'
      params.push(me.id)
    }
    if (isNewTab) where += ' AND new_user = 1'
    const orderBy = isNewTab ? 'created_at DESC, id DESC' : 'online DESC, is_vip DESC, id DESC'
    const list = withDistance(
      all(`SELECT * FROM users ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`, [
        ...params,
        pageSize,
        offset
      ]),
      Number(req.query.lat),
      Number(req.query.lng)
    )
    const total = get(`SELECT COUNT(*) c FROM users ${where}`, params).c
    return ok(res, pageResult(list.map((u) => publicUser(u, me?.id)), total, page, pageSize))
  })
)

/** 附近的人 */
router.get(
  '/nearby',
  authRequired,
  h((req, res) => {
    const { page, pageSize } = pageParams(req.query)
    const lat = Number(req.query.lat ?? req.user.lat)
    const lng = Number(req.query.lng ?? req.user.lng)
    const targetGender = req.user.gender === 1 ? 2 : 1
    const rows = all(
      `SELECT * FROM users WHERE status='active' AND gender=? AND audit_status='approved' AND id<>?
        AND id NOT IN (SELECT target_id FROM blacklist WHERE user_id=?)
        AND lat IS NOT NULL AND lng IS NOT NULL`,
      [targetGender, req.user.id, req.user.id]
    )
    const sorted = withDistance(rows, lat, lng)
      .filter((u) => u.distance != null)
      .sort((a, b) => a.distance - b.distance)
    const start = (page - 1) * pageSize
    return ok(res, pageResult(sorted.slice(start, start + pageSize).map((u) => publicUser(u, req.user.id)), sorted.length, page, pageSize))
  })
)

/** 我的关注 / 关注我 */
router.get(
  '/follows',
  authRequired,
  h((req, res) => {
    const list = all(
      `SELECT u.* FROM follows f JOIN users u ON u.id = f.target_id WHERE f.user_id=? ORDER BY f.id DESC`,
      [req.user.id]
    ).map((u) => publicUser(u, req.user.id))
    return ok(res, list)
  })
)

/** 谁看过我 */
router.get(
  '/visitors',
  authRequired,
  h((req, res) => {
    const list = all(
      `SELECT u.*, MAX(v.created_at) AS visit_at FROM visits v JOIN users u ON u.id = v.user_id
       WHERE v.target_id=? GROUP BY u.id ORDER BY visit_at DESC LIMIT 100`,
      [req.user.id]
    ).map((u) => ({ ...publicUser(u, req.user.id), visitAt: u.visit_at }))
    return ok(res, list)
  })
)

/** 谁喜欢我 / 我喜欢谁（基于动态点赞聚合） */
router.get(
  '/likers',
  authRequired,
  h((req, res) => {
    const list = all(
      `SELECT u.*, MAX(l.created_at) AS like_at FROM moment_likes l
       JOIN moments m ON m.id = l.moment_id
       JOIN users u ON u.id = l.user_id
       WHERE m.user_id=? AND l.user_id<>? GROUP BY u.id ORDER BY like_at DESC LIMIT 100`,
      [req.user.id, req.user.id]
    ).map((u) => ({ ...publicUser(u, req.user.id), likeAt: u.like_at }))
    return ok(res, list)
  })
)

/** 我的黑名单 */
router.get(
  '/blacklist',
  authRequired,
  h((req, res) => {
    const list = all(`SELECT u.*, b.created_at AS black_at FROM blacklist b JOIN users u ON u.id=b.target_id WHERE b.user_id=? ORDER BY b.id DESC`, [
      req.user.id
    ]).map((u) => ({ ...publicUser(u, req.user.id), blackAt: u.black_at }))
    return ok(res, list)
  })
)

router.post(
  '/blacklist/:id',
  authRequired,
  h((req, res) => {
    const tid = Number(req.params.id)
    if (tid === req.user.id) throw paramError('不能拉黑自己')
    if (!get('SELECT id FROM users WHERE id=?', [tid])) throw notFound('用户不存在')
    run(`INSERT OR IGNORE INTO blacklist (user_id, target_id, created_at) VALUES (?,?,?)`, [req.user.id, tid, now()])
    return ok(res, null, '已加入黑名单')
  })
)

router.delete(
  '/blacklist/:id',
  authRequired,
  h((req, res) => {
    run('DELETE FROM blacklist WHERE user_id=? AND target_id=?', [req.user.id, Number(req.params.id)])
    return ok(res, null, '已移出黑名单')
  })
)

router.post(
  '/follow/:id',
  authRequired,
  h((req, res) => {
    const tid = Number(req.params.id)
    if (tid === req.user.id) throw paramError('不能关注自己')
    run(`INSERT OR IGNORE INTO follows (user_id, target_id, created_at) VALUES (?,?,?)`, [req.user.id, tid, now()])
    return ok(res, { followed: true }, '关注成功')
  })
)

router.delete(
  '/follow/:id',
  authRequired,
  h((req, res) => {
    run('DELETE FROM follows WHERE user_id=? AND target_id=?', [req.user.id, Number(req.params.id)])
    return ok(res, { followed: false }, '已取消关注')
  })
)

/** 我的相册 */
router.get(
  '/photos',
  authRequired,
  h((req, res) => ok(res, all('SELECT * FROM user_photos WHERE user_id=? ORDER BY sort, id', [req.user.id])))
)

router.post(
  '/photos',
  authRequired,
  h((req, res) => {
    const { url, mediaType = 'image', cover = '', isPrivate = 0 } = req.body || {}
    if (!url) throw paramError('缺少文件地址')
    const r = run(
      `INSERT INTO user_photos (user_id, url, media_type, cover, sort, is_private, audit_status, created_at)
       VALUES (?,?,?,?,(SELECT IFNULL(MAX(sort),0)+1 FROM user_photos WHERE user_id=?),?, 'pending', ?)`,
      [req.user.id, url, mediaType, cover, req.user.id, isPrivate ? 1 : 0, now()]
    )
    return ok(res, { id: Number(r.lastInsertRowid) }, '上传成功，等待审核')
  })
)

router.delete(
  '/photos/:id',
  authRequired,
  h((req, res) => {
    run('DELETE FROM user_photos WHERE id=? AND user_id=?', [Number(req.params.id), req.user.id])
    return ok(res, null, '已删除')
  })
)

/** 解锁微信号 / 私密相册 */
router.post(
  '/unlock',
  authRequired,
  h((req, res) => {
    const { targetId, unlockType = 'wechat' } = req.body || {}
    const tid = Number(targetId)
    if (!tid || tid === req.user.id) throw paramError('目标用户不正确')
    const target = get('SELECT * FROM users WHERE id=?', [tid])
    if (!target) throw notFound('用户不存在')
    if (isActiveVip(req.user)) {
      return ok(res, { unlocked: true, wechat: target.wechat }, 'VIP 特权免金币解锁')
    }
    if (get('SELECT id FROM unlock_records WHERE user_id=? AND target_id=? AND unlock_type=?', [req.user.id, tid, unlockType])) {
      return ok(res, { unlocked: true, wechat: target.wechat }, '已解锁')
    }
    const cost = Number(
      configValue(unlockType === 'album' ? 'album_unlock_coins' : 'wechat_unlock_coins', unlockType === 'album' ? '500' : '200')
    )
    consumeCoins(req.user.id, cost, { title: unlockType === 'album' ? '解锁私密相册' : '查看微信号', type: 'unlock', remark: `目标用户 ${tid}` })
    run(`INSERT INTO unlock_records (user_id, target_id, unlock_type, coins, created_at) VALUES (?,?,?,?,?)`, [
      req.user.id,
      tid,
      unlockType,
      cost,
      now()
    ])
    notify(tid, '有人查看了你的联系方式', `${req.user.nickname || '有用户'} 解锁了你的${unlockType === 'album' ? '私密相册' : '微信号'}`, 'system')
    return ok(res, { unlocked: true, wechat: target.wechat, cost }, '解锁成功')
  })
)

/** 我的解锁记录 */
router.get(
  '/unlock-records',
  authRequired,
  h((req, res) =>
    ok(
      res,
      all(
        `SELECT r.*, u.nickname, u.avatar FROM unlock_records r JOIN users u ON u.id=r.target_id WHERE r.user_id=? ORDER BY r.id DESC LIMIT 100`,
        [req.user.id]
      )
    )
  )
)

/** 用户详情（最后注册，避免 /me /recommend 被 :id 吃掉） */
router.get(
  '/:id',
  authOptional,
  h((req, res) => {
    const u = get('SELECT * FROM users WHERE id = ?', [Number(req.params.id)])
    if (!u || u.status !== 'active') throw notFound('用户不存在')
    const viewerId = req.user?.id
    if (viewerId && viewerId !== u.id) {
      run(`INSERT INTO visits (user_id, target_id, created_at) VALUES (?,?,?)`, [viewerId, u.id, now()])
      run('UPDATE users SET last_active_at=? WHERE id=?', [now(), u.id])
    }
    const follows = viewerId ? !!get('SELECT id FROM follows WHERE user_id=? AND target_id=?', [viewerId, u.id]) : false
    const impressions = all(`SELECT tag, COUNT(*) c FROM impressions WHERE target_id=? GROUP BY tag ORDER BY c DESC LIMIT 12`, [u.id])
    return ok(res, {
      ...publicUser(u, viewerId),
      followed: follows,
      likedCount: get('SELECT COUNT(*) c FROM moments WHERE user_id=?', [u.id]).c,
      impressions
    })
  })
)

/** 我的印象标签（收到的） */
router.get(
  '/me/impressions',
  authRequired,
  h((req, res) =>
    ok(res, all(`SELECT tag, COUNT(*) c FROM impressions WHERE target_id=? GROUP BY tag ORDER BY c DESC`, [req.user.id]))
  )
)

export default router
