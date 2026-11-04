/**
 * 邀请模块：邀请码 / 邀请记录 / 排行榜 / 奖励规则
 * Base: /api/invite
 */
import { Router } from 'express'
import { all, get, run } from '../../db/sqlite.js'
import { now } from '../../utils/datetime.js'
import { h, ok, CODE, BizError, pageResult } from '../../utils/response.js'
import { authRequired } from '../../middleware/auth.js'
import { configValue, pageParams } from '../_shared.js'
import { env } from '../../config/env.js'

const router = Router()

/** 我的邀请信息 */
router.get(
  '/',
  authRequired,
  h((req, res) => {
    const reward = Number(configValue('invite_reward_coins', String(env.inviteRewardCoins)))
    const total = get('SELECT COUNT(*) c FROM invite_records WHERE inviter_id=?', [req.user.id]).c
    const coins = get('SELECT IFNULL(SUM(reward_coins),0) s FROM invite_records WHERE inviter_id=?', [req.user.id]).s
    const verified = req.user.audit_status === 'approved'
    return ok(res, {
      inviteCode: verified ? req.user.invite_code : '',
      available: verified,
      tip: verified ? '' : '完成实名认证后即可获得专属邀请码',
      inviteCount: total,
      totalCoins: coins,
      rewardPerInvite: reward,
      rules: [
        `每成功邀请 1 位好友注册，奖励 ${reward} 金币`,
        '好友完成注册并绑定邀请码后奖励自动到账',
        '邀请奖励金币可直接用于解锁与提现兑换',
        '禁止刷量作弊，违规将扣除全部奖励'
      ]
    })
  })
)

/** 邀请记录 */
router.get(
  '/records',
  authRequired,
  h((req, res) => {
    const { page, pageSize, offset } = pageParams(req.query)
    const list = all(
      `SELECT r.*, u.nickname, u.avatar, u.gender, u.city FROM invite_records r JOIN users u ON u.id=r.invitee_id
       WHERE r.inviter_id=? ORDER BY r.id DESC LIMIT ? OFFSET ?`,
      [req.user.id, pageSize, offset]
    )
    const total = get('SELECT COUNT(*) c FROM invite_records WHERE inviter_id=?', [req.user.id]).c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

/** 邀请排行榜（Top 50） */
router.get(
  '/ranking',
  authRequired,
  h((req, res) =>
    ok(
      res,
      all(
        `SELECT u.id, u.nickname, u.avatar, COUNT(r.id) AS inviteCount, IFNULL(SUM(r.reward_coins),0) AS coins
         FROM invite_records r JOIN users u ON u.id=r.inviter_id
         GROUP BY r.inviter_id ORDER BY inviteCount DESC LIMIT 50`
      )
    )
  )
)

/** 校验邀请码（注册页使用） */
router.get(
  '/check',
  h((req, res) => {
    const code = String(req.query.code || '').toUpperCase()
    if (!code) throw new BizError(CODE.PARAM, '请输入邀请码')
    const u = get('SELECT id, nickname, avatar FROM users WHERE invite_code=?', [code])
    return ok(res, { valid: !!u, inviter: u || null })
  })
)

export default router
