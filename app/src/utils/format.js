/** 通用格式化工具（时间统一 yyyy-MM-dd HH:mm:ss，北京时间为服务器时区） */

export function pad(n) {
  return n < 10 ? `0${n}` : `${n}`
}

/** 解析后端返回的 'YYYY-MM-DD HH:mm:ss'（部分浏览器对 '-' 解析有差异，统一替换） */
export function parseTime(str) {
  if (!str) return null
  if (str instanceof Date) return str
  const t = new Date(String(str).replace(/-/g, '/'))
  return isNaN(t.getTime()) ? null : t
}

export function formatTime(str, withSecond = false) {
  const t = parseTime(str)
  if (!t) return ''
  const s = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}`
  return withSecond ? `${s}:${pad(t.getSeconds())}` : s
}

/** 相对时间：刚刚 / n分钟前 / n小时前 / n天前 / 日期 */
export function timeAgo(str) {
  const t = parseTime(str)
  if (!t) return ''
  const diff = Math.floor((Date.now() - t.getTime()) / 1000)
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}天前`
  if (t.getFullYear() === new Date().getFullYear()) {
    return `${pad(t.getMonth() + 1)}-${pad(t.getDate())}`
  }
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`
}

/** 距离：<1km 显示米，否则 km（后端已返回 km 数值） */
export function formatDistance(km) {
  if (km === null || km === undefined || km === '') return ''
  const v = Number(km)
  if (!v && v !== 0) return ''
  if (v < 0.1) return '附近'
  if (v < 1) return `${Math.round(v * 1000)}m`
  return `${v.toFixed(1)}km`
}

/** 金额（两位小数） */
export function money(n) {
  const v = Number(n || 0)
  return v.toFixed(2)
}

/** 千分位金币 */
export function thousands(n) {
  const v = Math.floor(Number(n) || 0)
  return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** 年龄兜底：后端已算好 age（仅接受 1~120 的合理值），无值/异常时用生日推算 */
export function ageOf(u) {
  if (!u) return ''
  const a = Number(u.age)
  if (a > 0 && a < 120) return a
  const t = parseTime(u.birthday)
  if (!t) return ''
  const now = new Date()
  let age = now.getFullYear() - t.getFullYear()
  const m = now.getMonth() - t.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < t.getDate())) age--
  return age > 0 && age < 120 ? age : ''
}

/** 性别：1 男 2 女 */
export const isMale = (g) => Number(g) === 1
export const isFemale = (g) => Number(g) === 2
export const genderText = (g) => (Number(g) === 2 ? '女' : Number(g) === 1 ? '男' : '保密')

/** 手机号脱敏 */
export const maskPhone = (p) => String(p || '').replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')

/** 简易深拷贝 */
export const clone = (o) => JSON.parse(JSON.stringify(o))
