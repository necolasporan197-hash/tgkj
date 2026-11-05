/**
 * SQLite 访问层 —— 基于 Node 内置 node:sqlite（DatabaseSync），零原生依赖。
 * 约定：所有 SQL 使用位置参数 (?)，禁止字符串拼接，天然防注入。
 */
import { DatabaseSync } from 'node:sqlite'
import { readFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from '../config/env.js'
// 注意：与 seed.js 互为循环引用，双方仅在函数体内互相调用，ESM 下安全。
import { seedAdmin, seedBaseData, seedSdkConfigs, seedModuleData } from './seed.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const DB_FILE = resolve(env.dataDir, 'app.db')

mkdirSync(env.dataDir, { recursive: true })

export const db = new DatabaseSync(DB_FILE)

/** 初始化表结构（幂等） */
export function initSchema() {
  const sql = readFileSync(resolve(HERE, 'schema.sql'), 'utf8')
  db.exec(sql)
  ensureColumns()
  seedIfEmpty()
  return DB_FILE
}

/**
 * 补齐历史库缺失的列。
 * schema.sql 使用 CREATE TABLE IF NOT EXISTS，对已存在的表不会生效，故新增列需在此补 ALTER。
 */
function ensureColumns() {
  const add = (table, col, ddl) => {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all()
    if (cols.some((c) => c.name === col)) return false
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`)
    return true
  }
  add('users', 'feeling', 'feeling TEXT') // 感情状态（女用户）
  // 语音条（官方 DetailAudio / DetailFemaleTopView：女版详情页「TA的声音」）
  add('users', 'audio_url', 'audio_url TEXT')
  add('users', 'audio_duration', 'audio_duration INTEGER DEFAULT 0')
  add('users', 'show_audio', 'show_audio INTEGER DEFAULT 0')
  // 详情页 reportText 有效期提示（官方 BaseDetailFragment：data.show_valid_time）
  add('users', 'show_valid_time', 'show_valid_time TEXT')
  // 消息提醒开关（NotifyOpenActivity 的 6 项）
  add('user_settings', 'notify_chat', 'notify_chat INTEGER DEFAULT 1')
  add('user_settings', 'notify_city', 'notify_city INTEGER DEFAULT 1')
  add('user_settings', 'notify_income', 'notify_income INTEGER DEFAULT 1')
  add('user_settings', 'notify_visitor', 'notify_visitor INTEGER DEFAULT 1')
  add('user_settings', 'notify_enroll', 'notify_enroll INTEGER DEFAULT 1')
  // 隐私设置（fragment_private_setting.xml）3 项
  add('user_settings', 'photo_pay', 'photo_pay INTEGER DEFAULT 0')
  add('user_settings', 'hide_home', 'hide_home INTEGER DEFAULT 0')
  add('user_settings', 'hide_distance', 'hide_distance INTEGER DEFAULT 0')
  // 青少年模式（YoungModelActivity）
  add('users', 'young_model', 'young_model INTEGER DEFAULT 0')
  add('users', 'young_pwd', 'young_pwd TEXT')
  // 新人标记（官方 data.new_user：首页「新人」角标 / 「新人」栏）
  // 历史库刚新增该列时默认全为 0，新人栏/角标将无数据，故按 id 回填约 1/3 用户为新人（与种子规则一致）
  if (add('users', 'new_user', 'new_user INTEGER DEFAULT 0')) {
    db.exec('UPDATE users SET new_user = CASE WHEN id % 3 = 0 THEN 1 ELSE 0 END')
  }
}

/** 查询多行 */
export const all = (sql, params = []) => db.prepare(sql).all(...params)
/** 查询单行 */
export const get = (sql, params = []) => db.prepare(sql).get(...params) ?? null
/** 写入，返回 { changes, lastInsertRowid } */
export const run = (sql, params = []) => db.prepare(sql).run(...params)

/**
 * 事务包装（可重入）。
 * SQLite 不支持嵌套 BEGIN，内部函数（如 grantCoins/consumeCoins）自带事务时，
 * 嵌套调用会报 "cannot start a transaction within a transaction"。
 * 通过深度计数：已在事务中则直接复用外层事务，异常统一由最外层 ROLLBACK。
 */
let txDepth = 0
export function tx(fn) {
  if (txDepth > 0) return fn()
  txDepth++
  db.exec('BEGIN')
  try {
    const r = fn()
    db.exec('COMMIT')
    return r
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  } finally {
    txDepth--
  }
}

/** 统计计数 */
export const count = (sql, params = []) => get(sql, params)?.c ?? 0

/** 分页查询：自动拼 LIMIT/OFFSET */
export function paginate(baseSql, countSql, params, page = 1, pageSize = 20) {
  const p = Math.max(1, Number(page) || 1)
  const ps = Math.min(200, Math.max(1, Number(pageSize) || 20))
  const list = all(`${baseSql} LIMIT ? OFFSET ?`, [...params, ps, (p - 1) * ps])
  const total = count(countSql, params)
  return { list, total, page: p, pageSize: ps, totalPages: Math.ceil(total / ps) }
}

/** 生成占位符：n 个 ? */
export const marks = (n) => new Array(n).fill('?').join(',')

// ---------- 种子数据 ----------
function seedIfEmpty() {
  if (!count('SELECT COUNT(*) AS c FROM admins')) seedAdmin()
  if (!count('SELECT COUNT(*) AS c FROM vip_packages')) seedBaseData()
  if (!count('SELECT COUNT(*) AS c FROM sdk_configs')) seedSdkConfigs()
  seedModuleData()
}

export { DB_FILE, existsSync }
