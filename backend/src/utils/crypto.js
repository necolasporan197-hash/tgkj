/**
 * 口令哈希与令牌签发 —— 仅依赖 node:crypto / jsonwebtoken，零原生依赖。
 */
import { randomBytes, scryptSync, timingSafeEqual, randomInt } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function hashPassword(plain) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(String(plain), salt, 64).toString('hex')
  return `scrypt$${salt}$${hash}`
}

export function verifyPassword(plain, stored) {
  if (!stored || !stored.startsWith('scrypt$')) return false
  const [, salt, hash] = stored.split('$')
  const calc = scryptSync(String(plain), salt, 64)
  const expect = Buffer.from(hash, 'hex')
  return calc.length === expect.length && timingSafeEqual(calc, expect)
}

export const signUserToken = (payload) => jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
export const signAdminToken = (payload) => jwt.sign(payload, env.adminJwtSecret, { expiresIn: '12h' })

export const verifyUserToken = (token) => jwt.verify(token, env.jwtSecret)
export const verifyAdminToken = (token) => jwt.verify(token, env.adminJwtSecret)

/** 6 位数字验证码 */
export const genSmsCode = () => String(randomInt(100000, 999999))
/** 4 位图形验证码字符（去易混淆字符） */
export const genCaptchaText = (len = 4) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < len; i += 1) s += chars[randomInt(0, chars.length)]
  return s
}
/** 邀请码 */
export const genInviteCode = () => randomBytes(4).toString('hex').toUpperCase()

/** 简单图型验证码 SVG（零依赖，便于本地与生产直接渲染） */
export function captchaSvg(text) {
  const w = 120
  const h = 44
  let body = ''
  for (let i = 0; i < text.length; i += 1) {
    const x = 16 + i * 26
    const y = 32 + randomInt(-4, 4)
    const rot = randomInt(-18, 18)
    const color = ['#FF5000', '#494949', '#00BAF2', '#171D24'][randomInt(0, 4)]
    body += `<text x="${x}" y="${y}" fill="${color}" font-size="26" font-family="monospace" font-weight="700" transform="rotate(${rot} ${x} ${y})">${text[i]}</text>`
  }
  let noise = ''
  for (let i = 0; i < 5; i += 1) {
    noise += `<line x1="${randomInt(0, w)}" y1="${randomInt(0, h)}" x2="${randomInt(0, w)}" y2="${randomInt(0, h)}" stroke="#DDD" stroke-width="1"/>`
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#F5F6F8"/>${noise}${body}</svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}
