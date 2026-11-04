/**
 * 认证模块：图形验证码 / 短信验证码 / 注册 / 登录 / 刷新令牌 / 退出
 * Base: /api/auth
 */
import { Router } from 'express'
import { get, run } from '../../db/sqlite.js'
import { now, addMinutes, isExpired } from '../../utils/datetime.js'
import { h, ok, CODE, BizError } from '../../utils/response.js'
import {
  hashPassword,
  verifyPassword,
  genSmsCode,
  genCaptchaText,
  captchaSvg,
  signUserToken,
  verifyUserToken,
  genInviteCode
} from '../../utils/crypto.js'
import { authRequired } from '../../middleware/auth.js'
import { clientIp } from '../../middleware/error.js'
import { env } from '../../config/env.js'
import { sendMessage, publicUser, configValue, grantCoins } from '../_shared.js'
import { bumpTask } from '../task/routes.js'

const router = Router()

/** 图形验证码：返回 key + svg(base64)，前端登录时携带 captchaKey + captchaCode */
router.get(
  '/captcha',
  h((req, res) => {
    const text = genCaptchaText()
    const key = `cap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    captchaStore.set(key, { text, expireAt: Date.now() + 5 * 60 * 1000 })
    return ok(res, { key, image: captchaSvg(text) })
  })
)

/** 短信验证码下发 */
router.post(
  '/sms/send',
  h((req, res) => {
    const { phone, scene = 'login', captchaKey, captchaCode } = req.body || {}
    if (!/^1[3-9]\d{9}$/.test(String(phone || ''))) throw new BizError(CODE.PARAM, '手机号格式不正确')
    if (!checkCaptcha(captchaKey, captchaCode)) throw new BizError(CODE.PARAM, '图形验证码错误或已过期')

    const last = get(`SELECT * FROM sms_codes WHERE phone=? ORDER BY id DESC LIMIT 1`, [phone])
    if (last && Date.parse(last.created_at.replace(' ', 'T')) > Date.now() - 60000) {
      throw new BizError(CODE.BIZ, '发送过于频繁，请 60 秒后再试')
    }
    const code = genSmsCode()
    run(`INSERT INTO sms_codes (phone, code, scene, used, expire_at, created_at) VALUES (?,?,?,0,?,?)`, [
      phone,
      code,
      scene,
      addMinutes(5),
      now()
    ])
    // 未配置真实短信通道时，直接回传验证码便于联调（生产需接互亿无线等通道）
    const devMode = env.smsProvider === 'console'
    if (devMode) console.log(`[SMS] ${phone} -> ${code}`)
    return ok(res, { sent: true, devCode: devMode ? code : undefined, expireIn: 300 })
  })
)

/** 注册 */
router.post(
  '/register',
  h((req, res) => {
    const {
      phone,
      password,
      smsCode,
      nickname,
      avatar = '',
      gender = 1,
      city = '',
      birthday = '',
      occupation = '',
      wechat = '',
      height = null,
      feeling = '',
      tags = []
    } = req.body || {}
    if (!/^1[3-9]\d{9}$/.test(String(phone || ''))) throw new BizError(CODE.PARAM, '手机号格式不正确')
    if (!password || String(password).length < 6) throw new BizError(CODE.PARAM, '密码至少 6 位')
    if (!verifySmsCode(phone, smsCode, 'login')) throw new BizError(CODE.PARAM, '短信验证码错误或已过期')
    if (get('SELECT id FROM users WHERE phone = ?', [phone])) throw new BizError(CODE.CONFLICT, '该手机号已注册')

    const t = now()
    // 女性用户默认待审核；男性用户直接通过
    const auditStatus = Number(gender) === 2 && configValue('female_audit_required', '1') === '1' ? 'pending' : 'approved'
    const r = run(
      `INSERT INTO users (phone, password_hash, nickname, avatar, gender, height, city, birthday, occupation, wechat, feeling, invite_code, audit_status, status, coins, balance, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'active',0,0,?,?)`,
      [
        phone,
        hashPassword(password),
        nickname || `用户${String(phone).slice(-4)}`,
        avatar,
        Number(gender),
        height === '' || height === null ? null : Number(height),
        city,
        birthday,
        occupation,
        Number(gender) === 2 ? wechat : '',  // 微信为女用户专属（官方 profile_female_basic_fragment 社交账号）
        Number(gender) === 2 ? feeling : '', // 感情状态同为女用户专属（官方 profile_female_basic_fragment 更多信息）
        genInviteCode(),
        auditStatus,
        t,
        t
      ]
    )
    const uid = Number(r.lastInsertRowid)
    // 个性标签（官方 profile_male/female_basic_fragment「个性标签」）
    ;(Array.isArray(tags) ? tags : []).slice(0, 8).forEach((tag) =>
      run('INSERT INTO user_tags (user_id, tag) VALUES (?,?)', [uid, String(tag)])
    )
    // 邀请关系
    const inviteCode = req.body?.inviteCode
    if (inviteCode) {
      const inviter = get('SELECT id FROM users WHERE invite_code = ?', [String(inviteCode).toUpperCase()])
      if (inviter && inviter.id !== uid) {
        run('UPDATE users SET invited_by = ? WHERE id = ?', [inviter.id, uid])
        const reward = Number(configValue('invite_reward_coins', String(env.inviteRewardCoins)))
        grantCoins(inviter.id, reward, { title: '邀请好友奖励', remark: `邀请用户 ${phone}` })
        run(`INSERT INTO invite_records (inviter_id, invitee_id, reward_coins, created_at) VALUES (?,?,?,?)`, [
          inviter.id,
          uid,
          reward,
          now()
        ])
        sendMessage({ fromId: 0, toId: inviter.id, content: `恭喜！你邀请的好友已注册，获得 ${reward} 金币奖励`, msgType: 'system' })
        bumpTask(inviter.id, 'invite_friend', 1)
      }
    }
    return ok(res, { userId: uid, auditStatus }, auditStatus === 'pending' ? '注册成功，资料审核中' : '注册成功')
  })
)

/** 登录（账号密码） */
router.post(
  '/login',
  h((req, res) => {
    const { phone, password, captchaKey, captchaCode } = req.body || {}
    if (!phone || !password) throw new BizError(CODE.PARAM, '请输入手机号与密码')
    if (!checkCaptcha(captchaKey, captchaCode)) throw new BizError(CODE.PARAM, '图形验证码错误或已过期')
    const user = get('SELECT * FROM users WHERE phone = ?', [phone])
    const log = (success, uid) =>
      run(`INSERT INTO login_logs (user_id, phone, ip, ua, success, created_at) VALUES (?,?,?,?,?,?)`, [
        uid ?? null,
        phone,
        clientIp(req),
        String(req.headers['user-agent'] || ''),
        success ? 1 : 0,
        now()
      ])
    if (!user || !verifyPassword(password, user.password_hash)) {
      log(false, user?.id)
      throw new BizError(CODE.LOGIN_FAILED, '账号或密码错误')
    }
    if (user.status !== 'active') {
      log(false, user.id)
      throw new BizError(CODE.BANNED, '账号已被禁用，请联系客服')
    }
    log(true, user.id)
    run('UPDATE users SET last_active_at = ?, online = 1 WHERE id = ?', [now(), user.id])
    const token = signUserToken({ uid: user.id, phone: user.phone })
    return ok(res, { token, user: { ...publicUser(user, user.id), auditStatus: user.audit_status } }, '登录成功')
  })
)

/** 短信验证码登录 */
router.post(
  '/login/sms',
  h((req, res) => {
    const { phone, smsCode } = req.body || {}
    if (!verifySmsCode(phone, smsCode, 'login')) throw new BizError(CODE.PARAM, '短信验证码错误或已过期')
    const user = get('SELECT * FROM users WHERE phone = ?', [phone])
    if (!user) throw new BizError(CODE.NOT_FOUND, '该手机号未注册，请先注册')
    if (user.status !== 'active') throw new BizError(CODE.BANNED, '账号已被禁用，请联系客服')
    run('UPDATE users SET last_active_at = ?, online = 1 WHERE id = ?', [now(), user.id])
    return ok(res, { token: signUserToken({ uid: user.id, phone }), user: publicUser(user, user.id) }, '登录成功')
  })
)

/** 刷新令牌 */
router.post(
  '/refresh',
  h((req, res) => {
    const token = (req.headers.authorization || '').replace('Bearer ', '') || (req.body || {}).token
    if (!token) throw new BizError(CODE.UNAUTHORIZED, '缺少令牌')
    let payload
    try {
      payload = verifyUserToken(token)
    } catch {
      // 允许过期 7 天内的令牌续期
      try {
        payload = verifyUserToken(token, { ignoreExpiration: true })
      } catch {
        throw new BizError(CODE.UNAUTHORIZED, '令牌无效，请重新登录')
      }
    }
    const user = get('SELECT * FROM users WHERE id = ?', [payload.uid])
    if (!user || user.status !== 'active') throw new BizError(CODE.UNAUTHORIZED, '账号不可用')
    return ok(res, { token: signUserToken({ uid: user.id, phone: user.phone }) })
  })
)

/** 退出登录 */
router.post(
  '/logout',
  authRequired,
  h((req, res) => {
    run('UPDATE users SET online = 0, last_active_at = ? WHERE id = ?', [now(), req.user.id])
    return ok(res, null, '已退出登录')
  })
)

/** 修改密码 */
router.post(
  '/password',
  authRequired,
  h((req, res) => {
    const { oldPassword, newPassword } = req.body || {}
    if (!verifyPassword(oldPassword, req.user.password_hash)) throw new BizError(CODE.PARAM, '原密码不正确')
    if (!newPassword || String(newPassword).length < 6) throw new BizError(CODE.PARAM, '新密码至少 6 位')
    run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [hashPassword(newPassword), now(), req.user.id])
    return ok(res, null, '密码修改成功')
  })
)

// ---------------- 内部工具 ----------------
const captchaStore = new Map()

function checkCaptcha(key, code) {
  // 可在管理后台「系统配置」中通过 captcha_required=0 关闭（仅建议联调期使用）
  if (configValue('captcha_required', '1') === '0') return true
  if (!key || !code) return false
  const item = captchaStore.get(key)
  if (!item) return false
  captchaStore.delete(key)
  if (item.expireAt < Date.now()) return false
  return String(item.text).toLowerCase() === String(code).toLowerCase()
}

function verifySmsCode(phone, code, scene) {
  const row = get(
    `SELECT * FROM sms_codes WHERE phone=? AND scene=? AND used=0 ORDER BY id DESC LIMIT 1`,
    [phone, scene]
  )
  if (!row) return false
  if (isExpired(row.expire_at)) return false
  if (String(row.code) !== String(code)) return false
  run('UPDATE sms_codes SET used = 1 WHERE id = ?', [row.id])
  return true
}

export default router
