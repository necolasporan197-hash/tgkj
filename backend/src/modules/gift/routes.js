/**
 * 礼物模块：礼物列表 / 赠送 / 赠送记录（含红包）
 * Base: /api/gift
 */
import { Router } from 'express'
import { all, get, run, tx } from '../../db/sqlite.js'
import { now } from '../../utils/datetime.js'
import { h, ok, paramError, notFound, pageResult, CODE, BizError } from '../../utils/response.js'
import { authRequired } from '../../middleware/auth.js'
import { consumeCoins, notify, pageParams } from '../_shared.js'

const router = Router()

/** 礼物列表 */
router.get('/', h((req, res) => ok(res, all('SELECT * FROM gifts WHERE status=1 ORDER BY sort, id'))))

/** 赠送礼物（支持动态场景，红包=指定金币直送） */
router.post(
  '/send',
  authRequired,
  h((req, res) => {
    const { toId, giftId, count = 1, momentId = null, coins } = req.body || {}
    const tid = Number(toId)
    if (!tid || tid === req.user.id) throw paramError('接收人不正确')
    const target = get('SELECT * FROM users WHERE id=?', [tid])
    if (!target) throw notFound('接收人不存在')

    let giftName = '红包'
    let unit = Math.floor(Number(coins) || 0)
    if (giftId) {
      const g = get('SELECT * FROM gifts WHERE id=? AND status=1', [Number(giftId)])
      if (!g) throw notFound('礼物不存在')
      giftName = g.name
      unit = g.coins
    }
    const times = Math.max(1, Math.min(99, Math.floor(Number(count) || 1)))
    const total = unit * times
    if (total <= 0) throw new BizError(CODE.PARAM, '礼物金额不合法')

    consumeCoins(req.user.id, total, { title: `赠送${giftName}`, type: 'coin_out', remark: `赠送给 ${target.nickname}` })
    tx(() => {
      run(
        `INSERT INTO gift_records (from_id, to_id, gift_id, gift_name, count, coins, moment_id, created_at) VALUES (?,?,?,?,?,?,?,?)`,
        [req.user.id, tid, giftId || 0, giftName, times, total, momentId, now()]
      )
      // 礼物收益按 70% 折算为金币给接收方
      const income = Math.floor(total * 0.7)
      run('UPDATE users SET coins = coins + ? WHERE id=?', [income, tid])
      run(
        `INSERT INTO wallet_transactions (user_id, type, title, coins, balance_after, coins_after, status, remark, created_at)
         VALUES (?, 'coin_in', ?, ?, ?, (SELECT coins FROM users WHERE id=?), 'success', ?, ?)`,
        [tid, `收到${giftName}`, income, target.balance, tid, `来自 ${req.user.nickname || '用户'}`, now()]
      )
    })
    notify(tid, '收到新的礼物', `${req.user.nickname || '有用户'} 送了你 ${times} 个${giftName}`, 'order')
    return ok(res, { coinsAfter: get('SELECT coins FROM users WHERE id=?', [req.user.id]).coins }, '赠送成功')
  })
)

/** 我送出的礼物 */
router.get(
  '/sent',
  authRequired,
  h((req, res) => {
    const { page, pageSize, offset } = pageParams(req.query)
    const list = all(
      `SELECT r.*, u.nickname, u.avatar FROM gift_records r JOIN users u ON u.id=r.to_id WHERE r.from_id=? ORDER BY r.id DESC LIMIT ? OFFSET ?`,
      [req.user.id, pageSize, offset]
    )
    const total = get('SELECT COUNT(*) c FROM gift_records WHERE from_id=?', [req.user.id]).c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

/** 我收到的礼物 */
router.get(
  '/received',
  authRequired,
  h((req, res) => {
    const { page, pageSize, offset } = pageParams(req.query)
    const list = all(
      `SELECT r.*, u.nickname, u.avatar FROM gift_records r JOIN users u ON u.id=r.from_id WHERE r.to_id=? ORDER BY r.id DESC LIMIT ? OFFSET ?`,
      [req.user.id, pageSize, offset]
    )
    const total = get('SELECT COUNT(*) c FROM gift_records WHERE to_id=?', [req.user.id]).c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

export default router
