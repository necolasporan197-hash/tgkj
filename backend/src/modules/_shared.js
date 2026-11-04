/**
 * 模块公共工具：用户脱敏输出、距离计算、敏感词、金币扣减、系统消息。
 */
import { all, get, run, tx } from '../db/sqlite.js'
import { now } from '../utils/datetime.js'
import { BizError, CODE } from '../utils/response.js'

/** 用户卡片输出字段（对外统一结构，防信息泄露） */
export function publicUser(u, viewerId = null) {
  if (!u) return null
  const isSelf = viewerId && Number(viewerId) === Number(u.id)
  const isVip = u.is_vip === 1 && (!u.vip_expire_at || u.vip_expire_at > now())
  const viewer = viewerId ? get('SELECT is_vip, vip_expire_at, coins FROM users WHERE id = ?', [viewerId]) : null
  const viewerVip = viewer && viewer.is_vip === 1 && (!viewer.vip_expire_at || viewer.vip_expire_at > now())
  const unlocked = isSelf || viewerVip || (viewerId
    ? !!get(`SELECT id FROM unlock_records WHERE user_id=? AND target_id=? AND unlock_type='wechat'`, [viewerId, u.id])
    : false)

  const photos = all(
    `SELECT id, url, media_type, cover, is_private FROM user_photos WHERE user_id = ? AND audit_status='approved' ORDER BY sort, id`,
    [u.id]
  )
  const albumUnlocked =
    isSelf ||
    viewerVip ||
    (viewerId
      ? !!get(`SELECT id FROM unlock_records WHERE user_id=? AND target_id=? AND unlock_type='album'`, [viewerId, u.id])
      : false)
  // 相册 = 已审通过的图片；视频单独计数（官方 data.img_data / img_num / video_num）
  const images = photos.filter((p) => p.media_type !== 'video' && p.media_type !== 'audio')
  const visibleImages = images.filter((p) => !p.is_private || albumUnlocked)
  const privateCount = images.filter((p) => p.is_private).length

  return {
    id: u.id,
    nickname: u.nickname,
    avatar: u.avatar,
    gender: u.gender,
    age: u.age,
    birthday: u.birthday,
    city: u.city,
    occupation: u.occupation,
    bio: u.bio,
    height: u.height,
    weight: u.weight,
    feeling: u.feeling || '',
    isVip,
    online: u.online === 1,
    lastActiveAt: u.last_active_at,
    distance: u.distance ?? null,
    tags: all('SELECT tag FROM user_tags WHERE user_id = ?', [u.id]).map((t) => t.tag),
    photos: visibleImages.map((p) => p.url),
    photoCount: privateCount,
    albumLocked: privateCount > 0 && !albumUnlocked,
    imgNum: images.length,
    videoNum: photos.filter((p) => p.media_type === 'video').length,
    newUser: u.new_user === 1,
    isConfirmed: u.audit_status === 'approved',
    // 微信号：VIP 或已解锁可见，否则返回掩码
    wechat: unlocked ? u.wechat || '' : u.wechat ? `${u.wechat.slice(0, 2)}****` : '',
    wechatLocked: !unlocked && !!u.wechat,
    auditStatus: isSelf ? u.audit_status : undefined,
    createdAt: u.created_at
  }
}

/** 批量附加距离（Haversine，km，保留 1 位小数） */
export function withDistance(list, lat, lng) {
  if (!lat || !lng) return list
  return list.map((u) => ({ ...u, distance: haversine(lat, lng, u.lat, u.lng) }))
}

export function haversine(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => v == null)) return null
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10
}

/** 敏感词检测 */
export function containsSensitive(text = '') {
  const words = all('SELECT word FROM sensitive_words').map((w) => w.word)
  const found = words.filter((w) => w && text.includes(w))
  return found
}

/** 读取系统配置 */
export const configValue = (key, def = '') => get('SELECT value FROM configs WHERE key = ?', [key])?.value ?? def

/** 扣减金币（不足抛业务异常），返回最新余额 */
export function consumeCoins(userId, amount, { title, type = 'coin_out', remark = '' } = {}) {
  const amt = Math.floor(Number(amount) || 0)
  if (amt <= 0) throw new BizError(CODE.PARAM, '金币数量不合法')
  return tx(() => {
    const u = get('SELECT coins, balance FROM users WHERE id = ?', [userId])
    if (!u || u.coins < amt) throw new BizError(CODE.BIZ, `金币不足，还需 ${amt - (u?.coins || 0)} 金币`)
    const left = u.coins - amt
    run('UPDATE users SET coins = ?, updated_at = ? WHERE id = ?', [left, now(), userId])
    run(
      `INSERT INTO wallet_transactions (user_id, type, title, coins, balance_after, coins_after, status, remark, created_at)
       VALUES (?,?,?,?,?,?,'success',?,?)`,
      [userId, type, title || '金币消费', -amt, u.balance, left, remark, now()]
    )
    return left
  })
}

/** 增加金币/余额 */
export function grantCoins(userId, amount, { title, type = 'reward', remark = '' } = {}) {
  const amt = Math.floor(Number(amount) || 0)
  return tx(() => {
    const u = get('SELECT coins, balance FROM users WHERE id = ?', [userId])
    const next = (u?.coins || 0) + amt
    run('UPDATE users SET coins = ?, updated_at = ? WHERE id = ?', [next, now(), userId])
    run(
      `INSERT INTO wallet_transactions (user_id, type, title, coins, balance_after, coins_after, status, remark, created_at)
       VALUES (?,?,?,?,?,?,'success',?,?)`,
      [userId, type, title || '金币收入', amt, u?.balance || 0, next, remark, now()]
    )
    return next
  })
}

/** 发送系统/用户消息 */
export function sendMessage({ fromId = 0, toId, content, msgType = 'text', extra = null }) {
  if (!toId) return null
  // 系统账号（fromId=0）在 users 表中不存在，不能作为会话对端；
  // 若建会话会产生 peer 为空的脏数据（前端取 peer.nickname 会整页崩溃），改投系统通知。
  if (!fromId) {
    if (msgType === 'system') notify(toId, '系统通知', content, 'system')
    return null
  }
  let conv = get('SELECT * FROM conversations WHERE (user_a=? AND user_b=?) OR (user_a=? AND user_b=?)', [
    fromId,
    toId,
    toId,
    fromId
  ])
  if (!conv) {
    const a = Math.min(fromId, toId)
    const b = Math.max(fromId, toId)
    const r = run(
      `INSERT INTO conversations (user_a, user_b, last_content, last_time, unread_a, unread_b, created_at) VALUES (?,?,?,?,0,0,?)`,
      [a, b, content, now(), now()]
    )
    conv = { id: Number(r.lastInsertRowid), user_a: a, user_b: b, unread_a: 0, unread_b: 0 }
  }
  const r = run(
    `INSERT INTO messages (conv_id, from_id, to_id, content, msg_type, extra, is_read, created_at) VALUES (?,?,?,?,?,?,0,?)`,
    [conv.id, fromId, toId, content, msgType, extra ? JSON.stringify(extra) : null, now()]
  )
  const unreadCol = conv.user_a === toId ? 'unread_a' : 'unread_b'
  run(`UPDATE conversations SET last_content=?, last_time=?, ${unreadCol} = ${unreadCol} + 1 WHERE id = ?`, [
    content,
    now(),
    conv.id
  ])
  return { id: Number(r.lastInsertRowid), convId: conv.id }
}

/** 站内通知 */
export function notify(userId, title, content, ntype = 'system') {
  run(`INSERT INTO notifications (user_id, title, content, ntype, is_read, created_at) VALUES (?,?,?,?,0,?)`, [
    userId,
    title,
    content,
    ntype,
    now()
  ])
}

/** 解析分页参数 */
export function pageParams(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize, 10) || 20))
  return { page, pageSize, offset: (page - 1) * pageSize }
}

/** 判断用户是否为有效 VIP */
export const isActiveVip = (u) => !!u && u.is_vip === 1 && (!u.vip_expire_at || u.vip_expire_at > now())

/** 用户隐私 / 提醒设置：不存在则按默认值落一行（幂等） */
export function getUserSettings(userId) {
  let row = get('SELECT * FROM user_settings WHERE user_id = ?', [userId])
  if (!row) {
    run(`INSERT INTO user_settings (user_id, updated_at) VALUES (?, ?)`, [userId, now()])
    row = get('SELECT * FROM user_settings WHERE user_id = ?', [userId])
  }
  return row
}

/** 更新用户设置（仅允许白名单字段） */
const SETTING_FIELDS = [
  'allow_nearby',
  'allow_stranger',
  'show_online',
  'show_distance',
  'hide_visitors',
  'notify_msg',
  'notify_like',
  'notify_comment',
  'notify_follow',
  'notify_system',
  'notify_chat',
  'notify_city',
  'notify_income',
  'notify_visitor',
  'notify_enroll',
  'photo_pay',
  'hide_home',
  'hide_distance'
]

export function updateUserSettings(userId, patch = {}) {
  getUserSettings(userId)
  const sets = []
  const vals = []
  SETTING_FIELDS.forEach((k) => {
    if (patch[k] !== undefined) {
      sets.push(`${k} = ?`)
      vals.push(patch[k] ? 1 : 0)
    }
  })
  if (sets.length) {
    sets.push('updated_at = ?')
    vals.push(now(), userId)
    run(`UPDATE user_settings SET ${sets.join(', ')} WHERE user_id = ?`, vals)
  }
  return getUserSettings(userId)
}
