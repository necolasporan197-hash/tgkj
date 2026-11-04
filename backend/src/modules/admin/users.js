/**
 * 管理端用户管理：列表 / 详情 / 审核 / 启停 / 改密 / 调账 / 相册审核
 * Base: /api/admin/users
 */
import { Router } from 'express'
import { all, get, run, tx } from '../../db/sqlite.js'
import { now, addDays } from '../../utils/datetime.js'
import { h, ok, pageResult, paramError, notFound, CODE, BizError } from '../../utils/response.js'
import { hashPassword } from '../../utils/crypto.js'
import { adminLog } from '../../middleware/error.js'
import { notify, sendMessage } from '../_shared.js'
import { publicUser } from '../_shared.js'

const router = Router()

/** 用户列表 */
router.get(
  '/',
  h((req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.min(100, Number(req.query.pageSize) || 20)
    const params = []
    const cond = []
    if (req.query.keyword) {
      cond.push('(phone LIKE ? OR nickname LIKE ? OR id = ?)')
      params.push(`%${req.query.keyword}%`, `%${req.query.keyword}%`, Number(req.query.keyword) || -1)
    }
    if (req.query.gender) {
      cond.push('gender = ?')
      params.push(Number(req.query.gender))
    }
    if (req.query.auditStatus) {
      cond.push('audit_status = ?')
      params.push(req.query.auditStatus)
    }
    if (req.query.status) {
      cond.push('status = ?')
      params.push(req.query.status)
    }
    if (req.query.city) {
      cond.push('city = ?')
      params.push(req.query.city)
    }
    if (req.query.isVip === '1') cond.push('is_vip = 1')
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : ''
    const list = all(
      `SELECT * FROM users ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize]
    ).map((u) => ({
      id: u.id,
      phone: u.phone,
      nickname: u.nickname,
      avatar: u.avatar,
      gender: u.gender,
      age: u.age,
      city: u.city,
      occupation: u.occupation,
      isVip: u.is_vip === 1,
      vipExpireAt: u.vip_expire_at,
      coins: u.coins,
      balance: u.balance,
      auditStatus: u.audit_status,
      auditRemark: u.audit_remark,
      status: u.status,
      online: u.online === 1,
      inviteCode: u.invite_code,
      createdAt: u.created_at
    }))
    const total = get(`SELECT COUNT(*) c FROM users ${where}`, params).c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

/** 女性用户待审核列表 */
router.get(
  '/pending-audit',
  h((req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.min(100, Number(req.query.pageSize) || 20)
    const list = all(
      `SELECT u.*, (SELECT COUNT(*) FROM user_photos p WHERE p.user_id=u.id) AS photoCount
       FROM users u WHERE u.gender=2 AND u.audit_status='pending' ORDER BY u.id DESC LIMIT ? OFFSET ?`,
      [pageSize, (page - 1) * pageSize]
    ).map((u) => ({ ...u, photos: all('SELECT url, audit_status FROM user_photos WHERE user_id=?', [u.id]) }))
    const total = get(`SELECT COUNT(*) c FROM users WHERE gender=2 AND audit_status='pending'`).c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

/** 相册审核（单张 / 批量） */
router.post(
  '/photos/audit',
  h((req, res) => {
    const { ids = [], idsList = [], action } = req.body || {}
    const target = idsList.length ? idsList : ids
    if (!target.length) throw paramError('请选择要审核的照片')
    if (!['approve', 'reject'].includes(action)) throw paramError('审核动作不正确')
    const status = action === 'approve' ? 'approved' : 'rejected'
    target.forEach((pid) => run('UPDATE user_photos SET audit_status=? WHERE id=?', [status, Number(pid)]))
    adminLog(req, 'users', 'photo-audit', target.join(','), action)
    return ok(res, null, action === 'approve' ? '已通过' : '已驳回')
  })
)

/** 待审核照片列表 */
router.get(
  '/photos/pending',
  h((req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.min(100, Number(req.query.pageSize) || 20)
    const list = all(
      `SELECT p.*, u.nickname, u.phone FROM user_photos p JOIN users u ON u.id=p.user_id
       WHERE p.audit_status='pending' ORDER BY p.id DESC LIMIT ? OFFSET ?`,
      [pageSize, (page - 1) * pageSize]
    )
    const total = get(`SELECT COUNT(*) c FROM user_photos WHERE audit_status='pending'`).c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

/** 注销申请列表（CancellationActivity） */
router.get(
  '/cancellations',
  h((req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.min(100, Number(req.query.pageSize) || 20)
    const params = []
    const cond = []
    if (req.query.status) {
      cond.push('c.status = ?')
      params.push(req.query.status)
    }
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : ''
    const list = all(
      `SELECT c.*, u.nickname, u.phone, u.avatar FROM cancellations c JOIN users u ON u.id=c.user_id ${where}
       ORDER BY CASE c.status WHEN 'pending' THEN 0 ELSE 1 END, c.id DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize]
    )
    const total = get(`SELECT COUNT(*) c FROM cancellations c ${where}`, params).c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

/** 注销审核：approve=注销账号（禁用并清除资料），reject=驳回 */
router.post(
  '/cancellations/:id/review',
  h((req, res) => {
    const id = Number(req.params.id)
    const { action, remark = '' } = req.body || {}
    if (!['approve', 'reject'].includes(action)) throw paramError('审核动作不正确')
    const c = get('SELECT * FROM cancellations WHERE id=?', [id])
    if (!c) throw notFound('注销申请不存在')
    tx(() => {
      run(`UPDATE cancellations SET status=?, remark=?, handled_at=? WHERE id=?`, [
        action === 'approve' ? 'approved' : 'rejected',
        remark,
        now(),
        id
      ])
      if (action === 'approve') {
        run(`UPDATE users SET status='disabled', updated_at=? WHERE id=?`, [now(), c.user_id])
      }
    })
    notify(
      c.user_id,
      '注销申请结果',
      action === 'approve' ? '你的账号已注销，感谢你的使用' : `注销申请未通过${remark ? `：${remark}` : ''}`,
      'system'
    )
    adminLog(req, 'users', 'cancellation-review', id, `${action} ${remark}`)
    return ok(res, null, action === 'approve' ? '已注销' : '已驳回')
  })
)

/** 用户详情 */
router.get(
  '/:id',
  h((req, res) => {
    const u = get('SELECT * FROM users WHERE id = ?', [Number(req.params.id)])
    if (!u) throw notFound('用户不存在')
    return ok(res, {
      ...publicUser(u, u.id),
      phone: u.phone,
      coins: u.coins,
      balance: u.balance,
      inviteCode: u.invite_code,
      invitedBy: u.invited_by,
      auditStatus: u.audit_status,
      auditRemark: u.audit_remark,
      status: u.status,
      photos: all('SELECT * FROM user_photos WHERE user_id=? ORDER BY sort, id', [u.id]),
      verifications: all('SELECT * FROM verifications WHERE user_id=? ORDER BY id DESC', [u.id]),
      inviter: u.invited_by ? get('SELECT id, nickname, phone FROM users WHERE id=?', [u.invited_by]) : null,
      inviteCount: get('SELECT COUNT(*) c FROM invite_records WHERE inviter_id=?', [u.id]).c,
      stats: {
        moments: get(`SELECT COUNT(*) c FROM moments WHERE user_id=? AND status='normal'`, [u.id]).c,
        likes: get(`SELECT COUNT(*) c FROM moments WHERE user_id=?`, [u.id]).c,
        gifts: get('SELECT COUNT(*) c FROM gift_records WHERE to_id=?', [u.id]).c,
        withdrawals: get('SELECT IFNULL(SUM(amount),0) s FROM withdrawals WHERE user_id=? AND status=?', [u.id, 'paid']).s
      }
    })
  })
)

/** 编辑用户基础资料 */
router.put(
  '/:id',
  h((req, res) => {
    const id = Number(req.params.id)
    const u = get('SELECT * FROM users WHERE id=?', [id])
    if (!u) throw notFound('用户不存在')
    const allow = ['nickname', 'avatar', 'gender', 'city', 'occupation', 'bio', 'wechat', 'birthday', 'height', 'weight', 'is_vip', 'vip_expire_at']
    const sets = []
    const vals = []
    allow.forEach((k) => {
      if (req.body?.[k] !== undefined) {
        sets.push(`${k} = ?`)
        vals.push(req.body[k])
      }
    })
    if (!sets.length) throw paramError('没有需要更新的字段')
    sets.push('updated_at = ?')
    vals.push(now(), id)
    run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, vals)
    adminLog(req, 'users', 'update', id, JSON.stringify(req.body))
    return ok(res, null, '已保存')
  })
)

/** 女性用户资料审核 */
router.post(
  '/:id/audit',
  h((req, res) => {
    const id = Number(req.params.id)
    const { action, remark = '' } = req.body || {}
    if (!['approve', 'reject'].includes(action)) throw paramError('审核动作不正确')
    const u = get('SELECT * FROM users WHERE id=?', [id])
    if (!u) throw notFound('用户不存在')
    const status = action === 'approve' ? 'approved' : 'rejected'
    run('UPDATE users SET audit_status=?, audit_remark=?, updated_at=? WHERE id=?', [status, remark, now(), id])
    sendMessage({
      fromId: 0,
      toId: id,
      content: action === 'approve' ? '恭喜！你的资料已通过审核，现在可以被推荐给更多用户啦～' : `很抱歉，你的资料未通过审核${remark ? `：${remark}` : ''}，请修改后重新提交`,
      msgType: 'system'
    })
    notify(id, '资料审核结果', action === 'approve' ? '资料审核通过' : '资料审核未通过', 'audit')
    adminLog(req, 'users', 'audit', id, `${action} ${remark}`)
    return ok(res, null, action === 'approve' ? '已通过审核' : '已驳回')
  })
)

/** 启用 / 禁用 */
router.post(
  '/:id/status',
  h((req, res) => {
    const id = Number(req.params.id)
    const { status } = req.body || {}
    if (!['active', 'disabled'].includes(status)) throw paramError('状态不正确')
    run('UPDATE users SET status=?, updated_at=? WHERE id=?', [status, now(), id])
    adminLog(req, 'users', 'status', id, status)
    return ok(res, null, status === 'active' ? '已启用' : '已禁用')
  })
)

/** 重置密码 */
router.post(
  '/:id/reset-password',
  h((req, res) => {
    const id = Number(req.params.id)
    const pwd = req.body?.password || '123456'
    run('UPDATE users SET password_hash=?, updated_at=? WHERE id=?', [hashPassword(pwd), now(), id])
    adminLog(req, 'users', 'reset-password', id, '重置密码')
    return ok(res, { password: pwd }, '密码已重置')
  })
)

/** 调整金币 / 余额（含原因，自动记账） */
router.post(
  '/:id/adjust',
  h((req, res) => {
    const id = Number(req.params.id)
    const { coins = 0, amount = 0, remark = '' } = req.body || {}
    const dc = Math.floor(Number(coins) || 0)
    const da = Number(amount) || 0
    if (!dc && !da) throw paramError('请填写调整的金币或金额')
    const r = tx(() => {
      const u = get('SELECT * FROM users WHERE id=?', [id])
      if (!u) throw notFound('用户不存在')
      const coinNext = u.coins + dc
      const balNext = Number((u.balance + da).toFixed(2))
      if (coinNext < 0 || balNext < 0) throw new BizError(CODE.BIZ, '调整后余额不能为负')
      run('UPDATE users SET coins=?, balance=?, updated_at=? WHERE id=?', [coinNext, balNext, now(), id])
      run(
        `INSERT INTO wallet_transactions (user_id, type, title, amount, coins, balance_after, coins_after, status, remark, created_at)
         VALUES (?, 'adjust', '后台调整', ?, ?, ?, ?, 'success', ?, ?)`,
        [id, da, dc, balNext, coinNext, remark || `操作人：${req.admin.username}`, now()]
      )
      return { coins: coinNext, balance: balNext }
    })
    notify(id, '账户变动通知', `管理员${dc ? ` 调整金币 ${dc > 0 ? '+' : ''}${dc}` : ''}${da ? ` 调整余额 ${da > 0 ? '+' : ''}${da} 元` : ''}`, 'system')
    adminLog(req, 'users', 'adjust', id, `coins=${dc} amount=${da} ${remark}`)
    return ok(res, r, '调整成功')
  })
)

/** 开通 / 取消 VIP */
router.post(
  '/:id/vip',
  h((req, res) => {
    const id = Number(req.params.id)
    const { days = 30, cancel = false } = req.body || {}
    if (cancel) {
      run('UPDATE users SET is_vip=0, vip_expire_at=NULL, updated_at=? WHERE id=?', [now(), id])
      adminLog(req, 'users', 'vip-cancel', id, '取消 VIP')
      return ok(res, null, '已取消 VIP')
    }
    const base = get('SELECT vip_expire_at FROM users WHERE id=?', [id])?.vip_expire_at
    const start = base && base > now() ? base : now()
    const expireAt = addDays(start, Number(days) || 30)
    run('UPDATE users SET is_vip=1, vip_expire_at=?, updated_at=? WHERE id=?', [expireAt, now(), id])
    adminLog(req, 'users', 'vip-grant', id, `+${days}天`)
    return ok(res, { expireAt }, '已开通 VIP')
  })
)

/** 删除用户（物理删除，谨慎） */
router.delete(
  '/:id',
  h((req, res) => {
    const id = Number(req.params.id)
    if (req.admin.username !== 'admin') throw new BizError(CODE.FORBIDDEN, '仅超级管理员可删除用户')
    tx(() => {
      run('DELETE FROM user_photos WHERE user_id=?', [id])
      run('DELETE FROM user_tags WHERE user_id=?', [id])
      run('DELETE FROM users WHERE id=?', [id])
    })
    adminLog(req, 'users', 'delete', id, '删除用户')
    return ok(res, null, '已删除')
  })
)

export default router
