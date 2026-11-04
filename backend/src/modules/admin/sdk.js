/**
 * 管理端 SDK 配置：融云 / 高德 / 极光 / OpenInstall / 腾讯慧眼 / 支付 / 短信
 * Base: /api/admin/sdk
 * 敏感字段（secret=true）读取时掩码返回，提交掩码值时保留原值不变。
 */
import { Router } from 'express'
import { get, run } from '../../db/sqlite.js'
import { now } from '../../utils/datetime.js'
import { h, ok, notFound } from '../../utils/response.js'
import { adminLog } from '../../middleware/error.js'
import { SDK_PROVIDERS, findProvider, defaultConfig } from '../../config/sdk.js'

const router = Router()

const MASK = '****'
/** 掩码：保留前 2 位与后 4 位，过短则整体打码 */
function mask(v) {
  const s = String(v ?? '')
  if (!s) return ''
  return s.length <= 8 ? MASK : `${s.slice(0, 2)}${MASK}${s.slice(-4)}`
}
const isMasked = (v) => typeof v === 'string' && v.includes(MASK)

/** 读某 provider 原始配置对象（缺行时返回官方初始值） */
function readConfig(provider) {
  const row = get('SELECT config, updated_at FROM sdk_configs WHERE provider=?', [provider.key])
  if (!row?.config) return { config: defaultConfig(provider), updatedAt: '' }
  let parsed = {}
  try {
    parsed = JSON.parse(row.config) || {}
  } catch {
    parsed = {}
  }
  // 补齐新增字段，保证前端渲染不缺键
  return { config: { ...defaultConfig(provider), ...parsed }, updatedAt: row.updated_at || '' }
}

/** 概览：全部 provider 的定义 + 掩码后的当前值（前端据此动态渲染表单） */
router.get(
  '/',
  h((req, res) =>
    ok(res, {
      providers: SDK_PROVIDERS.map((p) => {
        const { config, updatedAt } = readConfig(p)
        const masked = {}
        p.fields.forEach((f) => {
          const v = config[f.key] ?? ''
          masked[f.key] = f.secret ? mask(v) : v
        })
        return {
          key: p.key,
          name: p.name,
          desc: p.desc,
          fields: p.fields,
          config: masked,
          updatedAt
        }
      })
    })
  )
)

/** 保存某个 provider 的配置 */
router.post(
  '/:provider',
  h((req, res) => {
    const provider = findProvider(req.params.provider)
    if (!provider) throw notFound('不存在的 SDK 配置项')
    const body = req.body || {}
    const { config: current } = readConfig(provider)

    const next = { ...current }
    let changed = 0
    provider.fields.forEach((f) => {
      if (!(f.key in body)) return
      const v = body[f.key]
      // 掩码字段提交掩码值 => 视为未修改
      if (f.secret && isMasked(v)) return
      const val = String(v ?? '')
      if (val !== String(current[f.key] ?? '')) changed += 1
      next[f.key] = val
    })

    run(
      `INSERT INTO sdk_configs (provider, config, updated_at) VALUES (?,?,?)
       ON CONFLICT(provider) DO UPDATE SET config=excluded.config, updated_at=excluded.updated_at`,
      [provider.key, JSON.stringify(next), now()]
    )
    adminLog(req, 'system', 'sdk-config-update', provider.key, `${provider.name} 更新 ${changed} 项`)
    return ok(res, null, '已保存')
  })
)

export default router
