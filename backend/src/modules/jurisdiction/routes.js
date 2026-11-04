/**
 * 隐私与权限设置 —— 对应官方 activity.ui.activity.JurisdictionSettingActivity / JurisdictionMoreActivity
 * Base: /api/jurisdiction
 */
import { Router } from 'express'
import { h, ok } from '../../utils/response.js'
import { authRequired } from '../../middleware/auth.js'
import { getUserSettings, updateUserSettings } from '../_shared.js'

const router = Router()

const toCamel = (s) => ({
  allowNearby: s.allow_nearby === 1,
  allowStranger: s.allow_stranger === 1,
  showOnline: s.show_online === 1,
  showDistance: s.show_distance === 1,
  hideVisitors: s.hide_visitors === 1,
  // fragment_private_setting.xml（隐私设置）3 项
  photoPay: s.photo_pay === 1,
  hideHome: s.hide_home === 1,
  hideDistance: s.hide_distance === 1
})

/** 获取隐私设置 */
router.get(
  '/',
  authRequired,
  h((req, res) => ok(res, toCamel(getUserSettings(req.user.id))))
)

/** 更新隐私设置 */
router.put(
  '/',
  authRequired,
  h((req, res) => {
    const b = req.body || {}
    const patch = {
      allow_nearby: b.allowNearby,
      allow_stranger: b.allowStranger,
      show_online: b.showOnline,
      show_distance: b.showDistance,
      hide_visitors: b.hideVisitors,
      photo_pay: b.photoPay,
      hide_home: b.hideHome,
      hide_distance: b.hideDistance
    }
    return ok(res, toCamel(updateUserSettings(req.user.id, patch)), '设置已保存')
  })
)

export default router
