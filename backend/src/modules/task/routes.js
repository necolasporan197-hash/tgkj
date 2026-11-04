/**
 * 任务中心 —— 对应官方 business.main.mine.TaskCenterActivity
 * Base: /api/task
 */
import { Router } from 'express'
import { all, get, run, tx } from '../../db/sqlite.js'
import { now, today } from '../../utils/datetime.js'
import { h, ok, paramError, notFound, CODE, BizError } from '../../utils/response.js'
import { authRequired } from '../../middleware/auth.js'
import { grantCoins, notify } from '../_shared.js'

const router = Router()

/** 一次性任务占位「日」，避免 UNIQUE(user_id, task_code, day) 因 NULL 失效 */
const ONCE_DAY = 'once'
const dayOf = (type) => (type === 'daily' ? today() : ONCE_DAY)

/** 读取某用户某任务当日/一次性记录 */
const readRecord = (userId, code, type) =>
  get('SELECT * FROM user_tasks WHERE user_id=? AND task_code=? AND day=?', [userId, code, dayOf(type)])

/**
 * 推进任务进度（供其它模块调用，如发布动态 / 浏览推荐 / 邀请好友）。
 * 完成时置 done（可领取），但不自动发奖，需用户到任务中心手动领取。
 */
export function bumpTask(userId, code, delta = 1) {
  const task = get(`SELECT * FROM tasks WHERE code=? AND status=1`, [code])
  if (!task || !userId) return null
  const day = dayOf(task.type)
  return tx(() => {
    let rec = get('SELECT * FROM user_tasks WHERE user_id=? AND task_code=? AND day=?', [userId, code, day])
    if (!rec) {
      const r = run(
        `INSERT INTO user_tasks (user_id, task_code, progress, status, day, updated_at) VALUES (?,?,?,'ongoing',?,?)`,
        [userId, code, Math.max(0, delta), day, now()]
      )
      rec = { id: Number(r.lastInsertRowid), progress: Math.max(0, delta), status: 'ongoing' }
    } else {
      // 已完成（待领取）或已领取的任务不再重复累加进度
      if (rec.status === 'claimed' || rec.status === 'done') return rec
      const progress = Math.max(0, rec.progress + delta)
      run('UPDATE user_tasks SET progress=?, updated_at=? WHERE id=?', [progress, now(), rec.id])
      rec = { ...rec, progress }
    }
    if (rec.progress >= task.target && rec.status === 'ongoing') {
      run(`UPDATE user_tasks SET status='done', updated_at=? WHERE id=?`, [now(), rec.id])
      rec.status = 'done'
    }
    return rec
  })
}

/** 任务列表（含当前用户进度） */
router.get(
  '/',
  authRequired,
  h((req, res) => {
    const uid = req.user.id
    const tasks = all('SELECT * FROM tasks WHERE status=1 ORDER BY sort, id')
    const list = tasks.map((t) => {
      const rec = readRecord(uid, t.code, t.type)
      const progress = Math.min(rec?.progress ?? 0, t.target)
      const status = rec?.status === 'claimed' ? 'claimed' : progress >= t.target ? 'done' : 'ongoing'
      return {
        code: t.code,
        title: t.title,
        subtitle: t.subtitle,
        icon: t.icon,
        rewardCoins: t.reward_coins,
        target: t.target,
        type: t.type,
        action: t.action,
        progress,
        status,
        claimedAt: rec?.claimed_at || null
      }
    })
    return ok(res, {
      list,
      checkedInToday: list.some((t) => t.code === 'daily_checkin' && t.status !== 'ongoing'),
      totalClaimable: list.filter((t) => t.status === 'done').length
    })
  })
)

/** 每日签到（等价于推进 daily_checkin 一次并直接领取） */
router.post(
  '/checkin',
  authRequired,
  h((req, res) => {
    const rec = bumpTask(req.user.id, 'daily_checkin', 1)
    if (!rec) throw notFound('签到任务未开启')
    if (rec.status === 'claimed') throw new BizError(CODE.CONFLICT, '今日已签到')
    const coins = claim(req.user.id, 'daily_checkin')
    return ok(res, { coins }, '签到成功')
  })
)

/** 领取任务奖励 */
router.post(
  '/:code/claim',
  authRequired,
  h((req, res) => {
    const coins = claim(req.user.id, String(req.params.code))
    return ok(res, { coins }, '领取成功')
  })
)

/** 领取逻辑：仅当任务已完成且未领取时发奖 */
function claim(userId, code) {
  const task = get('SELECT * FROM tasks WHERE code=? AND status=1', [code])
  if (!task) throw notFound('任务不存在')
  return tx(() => {
    const day = dayOf(task.type)
    const rec = get('SELECT * FROM user_tasks WHERE user_id=? AND task_code=? AND day=?', [userId, code, day])
    if (!rec) throw new BizError(CODE.BIZ, '任务尚未完成')
    if (rec.status === 'claimed') throw new BizError(CODE.CONFLICT, '奖励已领取')
    if (rec.progress < task.target) throw new BizError(CODE.BIZ, '任务尚未完成')
    run(`UPDATE user_tasks SET status='claimed', claimed_at=?, updated_at=? WHERE id=?`, [now(), now(), rec.id])
    const coins = Number(task.reward_coins) || 0
    if (coins > 0) {
      grantCoins(userId, coins, { title: `任务奖励：${task.title}`, type: 'reward', remark: code })
      notify(userId, '任务奖励已到账', `完成「${task.title}」，获得 ${coins} 金币`, 'system')
    }
    return coins
  })
}

export default router
