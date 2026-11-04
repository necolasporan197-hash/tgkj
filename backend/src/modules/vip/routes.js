/**
 * VIP 模块：套餐 / 购买 / 状态 / 特权说明
 * Base: /api/vip
 */
import { Router } from 'express'
import { all, get, run, tx } from '../../db/sqlite.js'
import { now, addDays } from '../../utils/datetime.js'
import { h, ok, paramError, notFound } from '../../utils/response.js'
import { authRequired } from '../../middleware/auth.js'
import { isActiveVip, notify } from '../_shared.js'

const router = Router()

const PRIVILEGES = [
  { icon: 'ic_vip_ckwx_n.png', title: '查看微信号', desc: '一键查看对方微信号，不再消耗金币' },
  { icon: 'ic_vip_ckzl_n.png', title: '解锁私密相册', desc: '无限查看私密相册内容' },
  { icon: 'ic_vip_wx_n.png', title: '无限私聊', desc: '不限条数畅聊，消息直达' },
  { icon: 'ic_vip_fbhd_n.png', title: '发布活动', desc: '可发布动态活动获得更多曝光' },
  { icon: 'ic_vip_gdqy_n.png', title: '更多曝光', desc: '推荐位优先展示，好友更多' }
]

/** 套餐列表 */
router.get(
  '/packages',
  h((req, res) => ok(res, all('SELECT * FROM vip_packages WHERE status=1 ORDER BY sort, id')))
)

/** 特权说明 */
router.get('/privileges', h((req, res) => ok(res, PRIVILEGES)))

/** 我的 VIP 状态 */
router.get(
  '/status',
  authRequired,
  h((req, res) =>
    ok(res, {
      isVip: isActiveVip(req.user),
      expireAt: req.user.vip_expire_at,
      privileges: PRIVILEGES
    })
  )
)

/** 开通 / 续费 VIP */
router.post(
  '/purchase',
  authRequired,
  h((req, res) => {
    const { packageId, payType = 'alipay' } = req.body || {}
    const pkg = get('SELECT * FROM vip_packages WHERE id=? AND status=1', [Number(packageId)])
    if (!pkg) throw notFound('套餐不存在或已下架')
    const base = isActiveVip(req.user) ? req.user.vip_expire_at : now()
    const expireAt = addDays(base, pkg.days)
    tx(() => {
      run(`UPDATE users SET is_vip=1, vip_expire_at=?, updated_at=? WHERE id=?`, [expireAt, now(), req.user.id])
      run(
        `INSERT INTO vip_orders (user_id, package_id, amount, days, pay_type, status, created_at, paid_at) VALUES (?,?,?,?,?, 'paid', ?, ?)`,
        [req.user.id, pkg.id, pkg.price, pkg.days, payType, now(), now()]
      )
      run(
        `INSERT INTO wallet_transactions (user_id, type, title, amount, balance_after, coins_after, status, remark, created_at)
         VALUES (?, 'vip', ?, ?, ?, ?, 'success', ?, ?)`,
        [req.user.id, `开通${pkg.name}`, -pkg.price, req.user.balance, req.user.coins, `支付方式：${payType}`, now()]
      )
    })
    notify(req.user.id, 'VIP 开通成功', `你已成功开通${pkg.name}，有效期至 ${expireAt}`, 'order')
    return ok(res, { isVip: true, expireAt, package: pkg }, '开通成功')
  })
)

/** 我的 VIP 订单 */
router.get(
  '/orders',
  authRequired,
  h((req, res) =>
    ok(
      res,
      all(
        `SELECT o.*, p.name AS packageName FROM vip_orders o LEFT JOIN vip_packages p ON p.id=o.package_id WHERE o.user_id=? ORDER BY o.id DESC`,
        [req.user.id]
      )
    )
  )
)

export default router
