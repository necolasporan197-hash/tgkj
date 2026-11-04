/**
 * 公共配置模块：App 启动配置 / 公告 / 客服 / 协议文案
 * Base: /api/config
 */
import { Router } from 'express'
import { all, get } from '../../db/sqlite.js'
import { h, ok } from '../../utils/response.js'
import { configValue } from '../_shared.js'

const router = Router()

/** App 启动配置（客户端首屏拉取） */
router.get(
  '/app',
  h((req, res) =>
    ok(res, {
      appName: configValue('app_name', '糖果空间'),
      notice: configValue('notice_text', ''),
      customerServiceWechat: configValue('customer_service_wechat', ''),
      withdrawMinAmount: Number(configValue('withdraw_min_amount', '100')),
      withdrawFeeRate: Number(configValue('withdraw_fee_rate', '0.05')),
      inviteRewardCoins: Number(configValue('invite_reward_coins', '1000')),
      femaleAuditRequired: configValue('female_audit_required', '1') === '1',
      wechatUnlockCoins: Number(configValue('wechat_unlock_coins', '200')),
      albumUnlockCoins: Number(configValue('album_unlock_coins', '500')),
      // 新人昵称模糊开关（官方 AccountHelper.isNewsVip → 服务端 homepage_new_user_vague）
      homepageNewUserVague: configValue('homepage_new_user_vague', '1') === '1',
      version: '4.8.2'
    })
  )
)

/** 全部公开配置键值 */
router.get('/all', h((req, res) => ok(res, all('SELECT key, value FROM configs'))))

/** 协议文档 */
router.get(
  '/agreement',
  h((req, res) => {
    const type = String(req.query.type || 'user')
    const map = {
      user: { title: '用户服务协议', content: configValue('agreement_user', DEFAULT_USER) },
      privacy: { title: '隐私政策', content: configValue('agreement_privacy', DEFAULT_PRIVACY) },
      about: { title: '关于我们', content: configValue('about_us', '糖果空间，真实高效的社交平台。') }
    }
    const item = map[type] || map.user
    return ok(res, item)
  })
)

/** 客服信息 */
router.get(
  '/service',
  h((req, res) =>
    ok(res, {
      wechat: configValue('customer_service_wechat', ''),
      phone: configValue('customer_service_phone', '400-000-0000'),
      workTime: configValue('customer_service_time', '09:00-21:00'),
      qrcode: configValue('customer_service_qrcode', '')
    })
  )
)

const DEFAULT_USER = `欢迎使用糖果空间。\n\n1. 请勿发布色情、赌博、诈骗等违法违规内容；\n2. 平台仅提供社交信息展示服务，不参与任何线下交易；\n3. 用户需对自身发布内容的真实性负责；\n4. 违规账号将被限制功能直至封禁。`
const DEFAULT_PRIVACY = `我们非常重视你的隐私。\n\n1. 仅收集为提供服务所必需的信息（手机号、位置、设备信息）；\n2. 位置信息仅用于展示附近的人，不会对外公开精确坐标；\n3. 未经你同意，不会向第三方提供你的个人信息；\n4. 你可随时在设置中注销账号并删除数据。`

export default router
