/**
 * 钱包模块：余额 / 金币 / 流水 / 充值 / 提现申请
 * Base: /api/wallet
 */
import { Router } from 'express'
import { all, get, run, tx } from '../../db/sqlite.js'
import { now } from '../../utils/datetime.js'
import { h, ok, pageResult, paramError, CODE, BizError } from '../../utils/response.js'
import { authRequired } from '../../middleware/auth.js'
import { configValue, notify, pageParams } from '../_shared.js'
import { env } from '../../config/env.js'

const router = Router()

/** 钱包总览 */
router.get(
  '/',
  authRequired,
  h((req, res) => {
    const u = req.user
    const minAmount = Number(configValue('withdraw_min_amount', String(env.withdrawMinAmount)))
    const feeRate = Number(configValue('withdraw_fee_rate', String(env.withdrawFeeRate)))
    return ok(res, {
      balance: Number(u.balance.toFixed(2)),
      coins: u.coins,
      coinRate: 100, // 100 金币 = 1 元
      withdrawMinAmount: minAmount,
      withdrawFeeRate: feeRate,
      pendingWithdraw: get(`SELECT IFNULL(SUM(amount),0) s FROM withdrawals WHERE user_id=? AND status='pending'`, [u.id]).s,
      totalRecharge: get(`SELECT IFNULL(SUM(amount),0) s FROM wallet_transactions WHERE user_id=? AND type='recharge'`, [u.id]).s,
      totalWithdraw: get(`SELECT IFNULL(SUM(amount),0) s FROM withdrawals WHERE user_id=? AND status='paid'`, [u.id]).s
    })
  })
)

/** 流水 */
router.get(
  '/transactions',
  authRequired,
  h((req, res) => {
    const { page, pageSize, offset } = pageParams(req.query)
    const type = req.query.type
    const params = [req.user.id]
    let where = 'WHERE user_id=?'
    if (type) {
      where += ' AND type=?'
      params.push(type)
    }
    const list = all(`SELECT * FROM wallet_transactions ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, pageSize, offset])
    const total = get(`SELECT COUNT(*) c FROM wallet_transactions ${where}`, params).c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

/** 充值（演示支付：直接到账，生产应接支付回调） */
router.post(
  '/recharge',
  authRequired,
  h((req, res) => {
    const { amount, coins = 0, payType = 'alipay' } = req.body || {}
    const amt = Number(amount)
    if (!amt || amt <= 0) throw paramError('充值金额不合法')
    const result = tx(() => {
      const u = get('SELECT * FROM users WHERE id=?', [req.user.id])
      const balance = Number((u.balance + amt).toFixed(2))
      const coinNext = u.coins + Math.floor(Number(coins) || 0)
      run('UPDATE users SET balance=?, coins=?, updated_at=? WHERE id=?', [balance, coinNext, now(), req.user.id])
      run(
        `INSERT INTO wallet_transactions (user_id, type, title, amount, coins, balance_after, coins_after, status, remark, created_at)
         VALUES (?, 'recharge', '在线充值', ?, ?, ?, ?, 'success', ?, ?)`,
        [req.user.id, amt, Math.floor(Number(coins) || 0), balance, coinNext, `支付方式：${payType}`, now()]
      )
      return { balance, coins: coinNext }
    })
    return ok(res, result, '充值成功')
  })
)

/** 提现申请 */
router.post(
  '/withdraw',
  authRequired,
  h((req, res) => {
    const { amount, accountType = 'alipay', accountNo = '', accountName = '' } = req.body || {}
    const amt = Number(amount)
    const minAmount = Number(configValue('withdraw_min_amount', String(env.withdrawMinAmount)))
    if (!amt || amt <= 0) throw paramError('提现金额不合法')
    if (amt < minAmount) throw new BizError(CODE.BIZ, `最低提现金额为 ${minAmount} 元`)
    if (!accountNo.trim()) throw paramError('请填写收款账号')
    if (req.user.balance < amt) throw new BizError(CODE.BIZ, '余额不足')
    const feeRate = Number(configValue('withdraw_fee_rate', String(env.withdrawFeeRate)))
    const fee = Number((amt * feeRate).toFixed(2))
    const actual = Number((amt - fee).toFixed(2))
    const r = tx(() => {
      const u = get('SELECT * FROM users WHERE id=?', [req.user.id])
      const balance = Number((u.balance - amt).toFixed(2))
      run('UPDATE users SET balance=?, updated_at=? WHERE id=?', [balance, now(), req.user.id])
      const ins = run(
        `INSERT INTO withdrawals (user_id, amount, fee, actual_amount, account_type, account_no, account_name, status, created_at)
         VALUES (?,?,?,?,?,?,?, 'pending', ?)`,
        [req.user.id, amt, fee, actual, accountType, accountNo, accountName, now()]
      )
      run(
        `INSERT INTO wallet_transactions (user_id, type, title, amount, balance_after, coins_after, status, remark, created_at)
         VALUES (?, 'withdraw', '提现申请', ?, ?, ?, 'pending', ?, ?)`,
        [req.user.id, -amt, balance, u.coins, `手续费 ${fee} 元`, now()]
      )
      return { id: Number(ins.lastInsertRowid), balance, fee, actual }
    })
    return ok(res, r, '提现申请已提交，等待审核')
  })
)

/** 提现记录 */
router.get(
  '/withdrawals',
  authRequired,
  h((req, res) => {
    const { page, pageSize, offset } = pageParams(req.query)
    const list = all(`SELECT * FROM withdrawals WHERE user_id=? ORDER BY id DESC LIMIT ? OFFSET ?`, [req.user.id, pageSize, offset])
    const total = get('SELECT COUNT(*) c FROM withdrawals WHERE user_id=?', [req.user.id]).c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

/** 金币兑换余额（100 金币 = 1 元） */
router.post(
  '/exchange',
  authRequired,
  h((req, res) => {
    const coins = Math.floor(Number(req.body?.coins) || 0)
    if (coins < 100) throw paramError('最少 100 金币起兑')
    if (req.user.coins < coins) throw new BizError(CODE.BIZ, '金币不足')
    const amount = Number((coins / 100).toFixed(2))
    const r = tx(() => {
      const u = get('SELECT * FROM users WHERE id=?', [req.user.id])
      const balance = Number((u.balance + amount).toFixed(2))
      const left = u.coins - coins
      run('UPDATE users SET balance=?, coins=?, updated_at=? WHERE id=?', [balance, left, now(), req.user.id])
      run(
        `INSERT INTO wallet_transactions (user_id, type, title, amount, coins, balance_after, coins_after, status, remark, created_at)
         VALUES (?, 'coin_out', '金币兑换余额', ?, ?, ?, ?, 'success', ?, ?)`,
        [req.user.id, amount, -coins, balance, left, `兑换 ${coins} 金币`, now()]
      )
      return { balance, coins: left }
    })
    return ok(res, r, '兑换成功')
  })
)

/** 金币充值套餐（兑换页展示） */
router.get(
  '/coin-packages',
  authRequired,
  h((req, res) =>
    ok(res, [
      { coins: 600, price: 6, bonus: 0 },
      { coins: 1200, price: 12, bonus: 100 },
      { coins: 3000, price: 30, bonus: 400 },
      { coins: 6000, price: 60, bonus: 1000 },
      { coins: 10000, price: 100, bonus: 2000 }
    ])
  )
)

/** 购买金币（演示：直接到账） */
router.post(
  '/coin-purchase',
  authRequired,
  h((req, res) => {
    const { coins, price } = req.body || {}
    const c = Math.floor(Number(coins) || 0)
    if (c <= 0) throw paramError('金币数量不合法')
    const r = tx(() => {
      const u = get('SELECT * FROM users WHERE id=?', [req.user.id])
      const next = u.coins + c
      run('UPDATE users SET coins=?, updated_at=? WHERE id=?', [next, now(), req.user.id])
      run(
        `INSERT INTO wallet_transactions (user_id, type, title, amount, coins, balance_after, coins_after, status, remark, created_at)
         VALUES (?, 'recharge', '购买金币', ?, ?, ?, ?, 'success', ?, ?)`,
        [req.user.id, Number(price) || 0, c, u.balance, next, `¥${price}`, now()]
      )
      return { coins: next }
    })
    notify(req.user.id, '购买成功', `成功购买 ${c} 金币`, 'order')
    return ok(res, r, '购买成功')
  })
)

export default router
