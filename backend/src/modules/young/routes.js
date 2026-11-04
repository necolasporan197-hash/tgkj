/**
 * 青少年模式 —— 对应官方 YoungModelActivity / YoungModelDialogFragment
 *                      / YoungModelPwdFragment / YoungModelPhoneFragment
 * Base: /api/young
 */
import { Router } from 'express'
import { get, run } from '../../db/sqlite.js'
import { h, ok, BizError, CODE } from '../../utils/response.js'
import { authRequired } from '../../middleware/auth.js'
import { hashPassword, verifyPassword, genSmsCode } from '../../utils/crypto.js'
import { now, addMinutes, isExpired } from '../../utils/datetime.js'
import { env } from '../../config/env.js'

const router = Router()

const PWD_RE = /^\d{4}$/
const maskPhone = (p) => (p ? `${String(p).slice(0, 3)}****${String(p).slice(-4)}` : '')

const toState = (u) => ({
  enabled: u.young_model === 1,
  hasPwd: !!u.young_pwd,
  phone: maskPhone(u.phone)
})

/** 青少年模式状态 */
router.get(
  '/',
  authRequired,
  h((req, res) => ok(res, toState(req.user)))
)

/** 开启：首次进入即设置 4 位密码并开启；已有密码则校验后开启 */
router.post(
  '/open',
  authRequired,
  h((req, res) => {
    const pwd = String((req.body || {}).password || '')
    if (!PWD_RE.test(pwd)) throw new BizError(CODE.PARAM, '请输入 4 位数字密码')
    const u = req.user
    if (u.young_pwd && !verifyPassword(pwd, u.young_pwd)) throw new BizError(CODE.PARAM, '密码不正确')
    run('UPDATE users SET young_model = 1, young_pwd = ?, updated_at = ? WHERE id = ?', [
      hashPassword(pwd),
      now(),
      u.id
    ])
    return ok(res, { enabled: true, hasPwd: true }, '青少年模式已开启')
  })
)

/** 关闭：校验密码后关闭 */
router.post(
  '/close',
  authRequired,
  h((req, res) => {
    const pwd = String((req.body || {}).password || '')
    const u = req.user
    if (!u.young_pwd) throw new BizError(CODE.BIZ, '尚未开启青少年模式')
    if (!verifyPassword(pwd, u.young_pwd)) throw new BizError(CODE.PARAM, '密码不正确')
    run('UPDATE users SET young_model = 0, updated_at = ? WHERE id = ?', [now(), u.id])
    return ok(res, toState(get('SELECT * FROM users WHERE id = ?', [u.id])), '青少年模式已关闭')
  })
)

/** 忘记密码：向当前绑定手机号下发验证码（scene=young） */
router.post(
  '/sms',
  authRequired,
  h((req, res) => {
    const phone = req.user.phone
    const last = get(`SELECT * FROM sms_codes WHERE phone=? ORDER BY id DESC LIMIT 1`, [phone])
    if (last && Date.parse(last.created_at.replace(' ', 'T')) > Date.now() - 60000) {
      throw new BizError(CODE.BIZ, '发送过于频繁，请 60 秒后再试')
    }
    const code = genSmsCode()
    run(`INSERT INTO sms_codes (phone, code, scene, used, expire_at, created_at) VALUES (?,?,?,0,?,?)`, [
      phone,
      code,
      'young',
      addMinutes(5),
      now()
    ])
    const devMode = env.smsProvider === 'console'
    if (devMode) console.log(`[SMS][young] ${phone} -> ${code}`)
    return ok(res, { sent: true, devCode: devMode ? code : undefined, expireIn: 300 })
  })
)

/** 忘记密码：短信验证通过后重设 4 位密码 */
router.post(
  '/reset',
  authRequired,
  h((req, res) => {
    const { smsCode, password } = req.body || {}
    if (!PWD_RE.test(String(password || ''))) throw new BizError(CODE.PARAM, '请输入 4 位数字密码')
    const row = get(
      `SELECT * FROM sms_codes WHERE phone=? AND scene='young' AND used=0 ORDER BY id DESC LIMIT 1`,
      [req.user.phone]
    )
    if (!row || isExpired(row.expire_at) || String(row.code) !== String(smsCode)) {
      throw new BizError(CODE.PARAM, '短信验证码错误或已过期')
    }
    run('UPDATE sms_codes SET used = 1 WHERE id = ?', [row.id])
    run('UPDATE users SET young_pwd = ?, updated_at = ? WHERE id = ?', [hashPassword(String(password)), now(), req.user.id])
    return ok(res, { hasPwd: true }, '密码已重设')
  })
)

export default router
