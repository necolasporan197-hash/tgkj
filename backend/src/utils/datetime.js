/**
 * 时间工具 —— 全局统一 'YYYY-MM-DD HH:mm:ss'（北京时间，UTC+8）。
 * 说明：服务器时区未必为 +8，因此按 UTC+8 显式偏移计算，保证线上一致。
 */
const CST_OFFSET_MS = 8 * 60 * 60 * 1000

const pad = (n) => String(n).padStart(2, '0')

export function now() {
  return fmt(new Date())
}

export function fmt(date = new Date()) {
  const d = new Date(date.getTime() + CST_OFFSET_MS)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(
    d.getUTCMinutes()
  )}:${pad(d.getUTCSeconds())}`
}

export function today() {
  return now().slice(0, 10)
}

export function addDays(dateStr, days) {
  const base = dateStr ? new Date(`${dateStr.replace(' ', 'T')}Z`) : new Date()
  const t = new Date(base.getTime() - CST_OFFSET_MS + days * 86400000)
  return fmt(t)
}

export function addMinutes(min = 0) {
  return fmt(new Date(Date.now() + min * 60000))
}

export const isExpired = (t) => !!t && t <= now()
