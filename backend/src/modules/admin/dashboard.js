/**
 * 管理端仪表盘：核心指标 / 趋势 / 待办
 * Base: /api/admin/dashboard
 */
import { Router } from 'express'
import { all, get } from '../../db/sqlite.js'
import { h, ok } from '../../utils/response.js'
import { today, now } from '../../utils/datetime.js'

const router = Router()

router.get(
  '/stats',
  h((req, res) => {
    const t = today()
    return ok(res, {
      user: {
        total: get('SELECT COUNT(*) c FROM users').c,
        today: get('SELECT COUNT(*) c FROM users WHERE substr(created_at,1,10)=?', [t]).c,
        female: get('SELECT COUNT(*) c FROM users WHERE gender=2').c,
        male: get('SELECT COUNT(*) c FROM users WHERE gender=1').c,
        online: get('SELECT COUNT(*) c FROM users WHERE online=1').c,
        vip: get(`SELECT COUNT(*) c FROM users WHERE is_vip=1 AND (vip_expire_at IS NULL OR vip_expire_at > ?)`, [now()]).c
      },
      content: {
        moments: get(`SELECT COUNT(*) c FROM moments WHERE status='normal'`).c,
        momentsToday: get(`SELECT COUNT(*) c FROM moments WHERE substr(created_at,1,10)=?`, [t]).c,
        comments: get(`SELECT COUNT(*) c FROM moment_comments WHERE status='normal'`).c,
        gifts: get('SELECT COUNT(*) c FROM gift_records').c
      },
      finance: {
        totalRecharge: round(get(`SELECT IFNULL(SUM(amount),0) s FROM wallet_transactions WHERE type='recharge'`).s),
        totalWithdrawPaid: round(get(`SELECT IFNULL(SUM(amount),0) s FROM withdrawals WHERE status='paid'`).s),
        pendingWithdrawCount: get(`SELECT COUNT(*) c FROM withdrawals WHERE status='pending'`).c,
        pendingWithdrawAmount: round(get(`SELECT IFNULL(SUM(amount),0) s FROM withdrawals WHERE status='pending'`).s),
        vipRevenue: round(get(`SELECT IFNULL(SUM(amount),0) s FROM vip_orders WHERE status='paid'`).s)
      },
      todo: {
        pendingFemaleAudit: get(`SELECT COUNT(*) c FROM users WHERE gender=2 AND audit_status='pending'`).c,
        pendingVerification: get(`SELECT COUNT(*) c FROM verifications WHERE status='pending'`).c,
        pendingMoment: get(`SELECT COUNT(*) c FROM moments WHERE audit_status='pending'`).c,
        pendingSubmission: get(`SELECT COUNT(*) c FROM submissions WHERE status='pending'`).c,
        pendingReport: get(`SELECT COUNT(*) c FROM reports WHERE status='pending'`).c,
        pendingWithdraw: get(`SELECT COUNT(*) c FROM withdrawals WHERE status='pending'`).c
      }
    })
  })
)

/** 最近 7 天趋势（注册/动态/流水） */
router.get(
  '/trend',
  h((req, res) => {
    const days = Math.min(30, Math.max(7, Number(req.query.days) || 7))
    const list = []
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      list.push({
        date: d,
        register: get('SELECT COUNT(*) c FROM users WHERE substr(created_at,1,10)=?', [d]).c,
        moments: get('SELECT COUNT(*) c FROM moments WHERE substr(created_at,1,10)=?', [d]).c,
        recharge: round(get(`SELECT IFNULL(SUM(amount),0) s FROM wallet_transactions WHERE type='recharge' AND substr(created_at,1,10)=?`, [d]).s)
      })
    }
    return ok(res, list)
  })
)

/** 最新动态（运营看板） */
router.get(
  '/recent',
  h((req, res) =>
    ok(res, {
      users: all('SELECT id, nickname, avatar, gender, city, audit_status, created_at FROM users ORDER BY id DESC LIMIT 8'),
      moments: all(
        `SELECT m.id, m.content, m.images, m.audit_status, m.created_at, u.nickname, u.avatar FROM moments m
         JOIN users u ON u.id=m.user_id WHERE m.status='normal' ORDER BY m.id DESC LIMIT 8`
      ),
      withdrawals: all(
        `SELECT w.id, w.amount, w.status, w.created_at, u.nickname FROM withdrawals w JOIN users u ON u.id=w.user_id ORDER BY w.id DESC LIMIT 8`
      )
    })
  )
)

const round = (n) => Math.round(Number(n || 0) * 100) / 100

export default router
