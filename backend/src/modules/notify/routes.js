/**
 * 消息提醒开关 —— 对应官方 activity.ui.activity.NotifyOpenActivity
 * Base: /api/notify
 */
import { Router } from 'express'
import { h, ok } from '../../utils/response.js'
import { authRequired } from '../../middleware/auth.js'
import { getUserSettings, updateUserSettings } from '../_shared.js'

const router = Router()

const toCamel = (s) => ({
  msg: s.notify_msg === 1,
  like: s.notify_like === 1,
  comment: s.notify_comment === 1,
  follow: s.notify_follow === 1,
  system: s.notify_system === 1,
  // activity_notify_open.xml 的 6 项开关
  chat: s.notify_chat === 1,
  city: s.notify_city === 1,
  income: s.notify_income === 1,
  visitor: s.notify_visitor === 1,
  enroll: s.notify_enroll === 1
})

/** 获取提醒开关 */
router.get(
  '/',
  authRequired,
  h((req, res) => ok(res, toCamel(getUserSettings(req.user.id))))
)

/** 更新提醒开关 */
router.put(
  '/',
  authRequired,
  h((req, res) => {
    const b = req.body || {}
    const patch = {
      notify_msg: b.msg,
      notify_like: b.like,
      notify_comment: b.comment,
      notify_follow: b.follow,
      notify_system: b.system,
      notify_chat: b.chat,
      notify_city: b.city,
      notify_income: b.income,
      notify_visitor: b.visitor,
      notify_enroll: b.enroll
    }
    return ok(res, toCamel(updateUserSettings(req.user.id, patch)), '设置已保存')
  })
)

export default router
