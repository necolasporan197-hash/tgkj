/**
 * 管理端财务：提现审核 / 流水 / VIP 套餐与订单 / 礼物管理 / 收入统计
 * Base: /api/admin/finance
 */
import { Router } from 'express'
import { all, get, run, tx } from '../../db/sqlite.js'
import { now } from '../../utils/datetime.js'
import { h, ok, pageResult, paramError, notFound, CODE, BizError } from '../../utils/response.js'
import { adminLog } from '../../middleware/error.js'
import { notify } from '../_shared.js'

const router = Router()

const pg = (q) => {
  const page = Math.max(1, Number(q.page) || 1)
  const pageSize = Math.min(100, Number(q.pageSize) || 20)
  return { page, pageSize, offset: (page - 1) * pageSize }
}

/** 提现列表 */
router.get(
  '/withdrawals',
  h((req, res) => {
    const { page, pageSize, offset } = pg(req.query)
    const params = []
    let where = ''
    if (req.query.status) {
      where = 'WHERE w.status=?'
      params.push(req.query.status)
    }
    if (req.query.keyword) {
      where = where ? `${where} AND (u.nickname LIKE ? OR u.phone LIKE ?)` : 'WHERE (u.nickname LIKE ? OR u.phone LIKE ?)'
      params.push(`%${req.query.keyword}%`, `%${req.query.keyword}%`)
    }
    const list = all(
      `SELECT w.*, u.nickname, u.phone, u.avatar FROM withdrawals w JOIN users u ON u.id=w.user_id ${where}
       ORDER BY CASE w.status WHEN 'pending' THEN 0 ELSE 1 END, w.id DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    )
    const total = get(`SELECT COUNT(*) c FROM withdrawals w JOIN users u ON u.id=w.user_id ${where}`, params).c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

/** 提现审核：通过（打款） / 驳回（退回余额） */
router.post(
  '/withdrawals/:id/review',
  h((req, res) => {
    const id = Number(req.params.id)
    const { action, remark = '' } = req.body || {}
    if (!['approve', 'reject', 'paid'].includes(action)) throw paramError('审核动作不正确')
    const w = get('SELECT * FROM withdrawals WHERE id=?', [id])
    if (!w) throw notFound('提现申请不存在')
    if (w.status !== 'pending') throw new BizError(CODE.CONFLICT, '该申请已处理')

    tx(() => {
      if (action === 'reject') {
        run('UPDATE users SET balance = balance + ?, updated_at=? WHERE id=?', [w.amount, now(), w.user_id])
        run(
          `INSERT INTO wallet_transactions (user_id, type, title, amount, balance_after, coins_after, status, remark, created_at)
           VALUES (?, 'withdraw_refund', '提现驳回退回', ?, (SELECT balance FROM users WHERE id=?), (SELECT coins FROM users WHERE id=?), 'success', ?, ?)`,
          [w.user_id, w.amount, w.user_id, w.user_id, remark || '提现被驳回', now()]
        )
      }
      run('UPDATE withdrawals SET status=?, remark=?, reviewed_at=?, reviewer_id=? WHERE id=?', [
        action === 'reject' ? 'rejected' : 'paid',
        remark,
        now(),
        req.admin.id,
        id
      ])
    })
    notify(w.user_id, '提现进度通知', action === 'reject' ? `提现申请被驳回：${remark || '信息有误'}` : `提现 ¥${w.actual_amount} 已打款`, 'order')
    adminLog(req, 'finance', 'withdraw-review', id, `${action} ${remark}`)
    return ok(res, null, action === 'reject' ? '已驳回并退回余额' : '已确认打款')
  })
)

/** 全站资金流水 */
router.get(
  '/transactions',
  h((req, res) => {
    const { page, pageSize, offset } = pg(req.query)
    const params = []
    const cond = []
    if (req.query.type) {
      cond.push('t.type=?')
      params.push(req.query.type)
    }
    if (req.query.keyword) {
      cond.push('(u.nickname LIKE ? OR u.phone LIKE ?)')
      params.push(`%${req.query.keyword}%`, `%${req.query.keyword}%`)
    }
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : ''
    const list = all(
      `SELECT t.*, u.nickname, u.phone FROM wallet_transactions t JOIN users u ON u.id=t.user_id ${where} ORDER BY t.id DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    )
    const total = get(`SELECT COUNT(*) c FROM wallet_transactions t JOIN users u ON u.id=t.user_id ${where}`, params).c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

/** 收入统计 */
router.get(
  '/summary',
  h((req, res) => {
    const round = (n) => Math.round(Number(n || 0) * 100) / 100
    return ok(res, {
      recharge: round(get(`SELECT IFNULL(SUM(amount),0) s FROM wallet_transactions WHERE type='recharge'`).s),
      withdrawn: round(get(`SELECT IFNULL(SUM(amount),0) s FROM withdrawals WHERE status='paid'`).s),
      withdrawnFee: round(get(`SELECT IFNULL(SUM(fee),0) s FROM withdrawals WHERE status='paid'`).s),
      vipRevenue: round(get(`SELECT IFNULL(SUM(amount),0) s FROM vip_orders WHERE status='paid'`).s),
      giftCoins: get(`SELECT IFNULL(SUM(coins),0) s FROM gift_records`).s,
      pendingWithdraw: round(get(`SELECT IFNULL(SUM(amount),0) s FROM withdrawals WHERE status='pending'`).s),
      coinCirculation: get('SELECT IFNULL(SUM(coins),0) s FROM users').s
    })
  })
)

// ---------------- VIP 套餐 ----------------
router.get(
  '/vip/packages',
  h((req, res) => ok(res, all('SELECT * FROM vip_packages ORDER BY sort, id')))
)

router.post(
  '/vip/packages',
  h((req, res) => {
    const { name, days, price, originPrice = 0, tag = '', sort = 0, status = 1 } = req.body || {}
    if (!name || !days || !price) throw paramError('套餐名称、天数、价格必填')
    const r = run(
      `INSERT INTO vip_packages (name, days, price, origin_price, tag, sort, status) VALUES (?,?,?,?,?,?,?)`,
      [name, Number(days), Number(price), Number(originPrice), tag, Number(sort), Number(status)]
    )
    adminLog(req, 'finance', 'vip-package-create', r.lastInsertRowid, name)
    return ok(res, { id: Number(r.lastInsertRowid) }, '已新增')
  })
)

router.put(
  '/vip/packages/:id',
  h((req, res) => {
    const id = Number(req.params.id)
    if (!get('SELECT id FROM vip_packages WHERE id=?', [id])) throw notFound('套餐不存在')
    const allow = ['name', 'days', 'price', 'origin_price', 'tag', 'sort', 'status']
    const sets = []
    const vals = []
    allow.forEach((k) => {
      if (req.body?.[k] !== undefined) {
        sets.push(`${k}=?`)
        vals.push(req.body[k])
      }
    })
    if (!sets.length) throw paramError('没有需要更新的字段')
    run(`UPDATE vip_packages SET ${sets.join(',')} WHERE id=?`, [...vals, id])
    adminLog(req, 'finance', 'vip-package-update', id, JSON.stringify(req.body))
    return ok(res, null, '已保存')
  })
)

router.delete(
  '/vip/packages/:id',
  h((req, res) => {
    run('DELETE FROM vip_packages WHERE id=?', [Number(req.params.id)])
    adminLog(req, 'finance', 'vip-package-delete', req.params.id, '删除套餐')
    return ok(res, null, '已删除')
  })
)

/** VIP 订单 */
router.get(
  '/vip/orders',
  h((req, res) => {
    const { page, pageSize, offset } = pg(req.query)
    const list = all(
      `SELECT o.*, u.nickname, u.phone, p.name AS packageName FROM vip_orders o
       JOIN users u ON u.id=o.user_id LEFT JOIN vip_packages p ON p.id=o.package_id
       ORDER BY o.id DESC LIMIT ? OFFSET ?`,
      [pageSize, offset]
    )
    const total = get('SELECT COUNT(*) c FROM vip_orders').c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

// ---------------- 礼物管理 ----------------
router.get(
  '/gifts',
  h((req, res) => ok(res, all('SELECT * FROM gifts ORDER BY sort, id')))
)

router.post(
  '/gifts',
  h((req, res) => {
    const { name, icon = '', coins, sort = 0, status = 1 } = req.body || {}
    if (!name || !coins) throw paramError('礼物名称与金币价格必填')
    const r = run(`INSERT INTO gifts (name, icon, coins, sort, status) VALUES (?,?,?,?,?)`, [
      name,
      icon,
      Number(coins),
      Number(sort),
      Number(status)
    ])
    adminLog(req, 'finance', 'gift-create', r.lastInsertRowid, name)
    return ok(res, { id: Number(r.lastInsertRowid) }, '已新增')
  })
)

router.put(
  '/gifts/:id',
  h((req, res) => {
    const id = Number(req.params.id)
    const allow = ['name', 'icon', 'coins', 'sort', 'status']
    const sets = []
    const vals = []
    allow.forEach((k) => {
      if (req.body?.[k] !== undefined) {
        sets.push(`${k}=?`)
        vals.push(req.body[k])
      }
    })
    if (!sets.length) throw paramError('没有需要更新的字段')
    run(`UPDATE gifts SET ${sets.join(',')} WHERE id=?`, [...vals, id])
    adminLog(req, 'finance', 'gift-update', id, JSON.stringify(req.body))
    return ok(res, null, '已保存')
  })
)

router.delete(
  '/gifts/:id',
  h((req, res) => {
    run('DELETE FROM gifts WHERE id=?', [Number(req.params.id)])
    adminLog(req, 'finance', 'gift-delete', req.params.id, '删除礼物')
    return ok(res, null, '已删除')
  })
)

/** 礼物赠送记录 */
router.get(
  '/gift-records',
  h((req, res) => {
    const { page, pageSize, offset } = pg(req.query)
    const list = all(
      `SELECT r.*, f.nickname AS fromName, t.nickname AS toName FROM gift_records r
       JOIN users f ON f.id=r.from_id JOIN users t ON t.id=r.to_id ORDER BY r.id DESC LIMIT ? OFFSET ?`,
      [pageSize, offset]
    )
    const total = get('SELECT COUNT(*) c FROM gift_records').c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

export default router
