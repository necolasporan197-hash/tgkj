#!/usr/bin/env node
/**
 * 业务域名配置中心 —— 一键把 config/domain.json 同步到三端。
 *
 * 双配置并存：
 *   - config/domain.json 内含多个档位（profiles）：self（自建，默认）/ official（官方线上，反推值）
 *   - 生效档位由 `active` 字段决定，可用 --profile 临时覆盖
 *   - 同步时会把当前档位写入三端 .env，并额外落一份 `*.env.official` 便于对比
 *
 * 用法：
 *   node scripts/set-domain.mjs                          # 使用 active 档位（默认 self）
 *   node scripts/set-domain.mjs --profile official       # 临时切到 official 档位
 *   node scripts/set-domain.mjs --profile self           # 显式切回自建档位
 *   node scripts/set-domain.mjs https://api.xxx.com      # 直接指定 API 域名并全量同步
 *
 * 同步目标：
 *   backend/.env            -> PUBLIC_BASE_URL / CORS_ORIGINS / PORT
 *   admin/.env.production   -> VITE_API_BASE_URL
 *   admin/.env.development  -> VITE_API_BASE_URL(空=走 vite proxy)
 *   app/.env.production     -> VITE_API_BASE_URL
 *   app/.env.development    -> VITE_API_BASE_URL
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DOMAIN_FILE = resolve(ROOT, 'config/domain.json')

const file = JSON.parse(readFileSync(DOMAIN_FILE, 'utf8'))
const norm = (u) => (u || '').replace(/\/+$/, '')

// ---------------- 解析档位 ----------------
const argv = process.argv.slice(2)
let profileName = file.active || 'self'
let cliDomain = ''
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] === '--profile' || argv[i] === '-p') profileName = argv[i + 1] || profileName
  else if (!argv[i].startsWith('-')) cliDomain = argv[i]
}

const pick = (name) => {
  if (file.profiles && file.profiles[name]) return file.profiles[name]
  // 兼容旧的扁平结构（无 profiles）
  if (name === 'self') return file
  return null
}

const cfg = { ...pick(profileName) }
if (!cfg || !cfg.apiBaseUrl) {
  console.error(`\u2717 未找到档位「${profileName}」或缺少 apiBaseUrl，可选：${Object.keys(file.profiles || {}).join(' / ')}`)
  process.exit(1)
}
if (cliDomain) cfg.apiBaseUrl = norm(cliDomain)

console.log(`当前档位：${profileName}${profileName === file.active ? '（active）' : '（临时覆盖）'}`)

function writeEnv(relPath, entries) {
  const target = resolve(ROOT, relPath)
  mkdirSync(dirname(target), { recursive: true })
  const body =
    Object.entries(entries)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n') + '\n'
  writeFileSync(target, body, 'utf8')
  console.log(`\u2713 ${relPath}`)
}

const api = norm(cfg.apiBaseUrl)
const pub = norm(cfg.publicBaseUrl || api)
/** 开发态留空 => 走 vite proxy（同源，无需 CORS）；需要时可显式配置 devApiBaseUrl */
const devApi = norm(cfg.devApiBaseUrl || '')

// CORS 白名单 = 显式配置 + 业务域名自身来源 + 管理后台域名
const originSet = new Set(cfg.corsOrigins || [])
for (const u of [api, norm(cfg.adminBaseUrl)]) {
  try {
    if (/^https?:\/\//.test(u)) originSet.add(new URL(u).origin)
  } catch {
    /* ignore */
  }
}
const origins = [...originSet].join(',')

// 1) 后端
const backendEnv = resolve(ROOT, 'backend/.env')
const backendExisting = existsSync(backendEnv)
  ? Object.fromEntries(
      readFileSync(backendEnv, 'utf8')
        .split(/\r?\n/)
        .filter((l) => l.includes('=') && !l.startsWith('#'))
        .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
    )
  : {}

writeEnv('backend/.env', {
  PORT: backendExisting.PORT || '3000',
  PUBLIC_BASE_URL: pub,
  CORS_ORIGINS: origins,
  JWT_SECRET: backendExisting.JWT_SECRET || 'change-me-in-production',
  ADMIN_JWT_SECRET: backendExisting.ADMIN_JWT_SECRET || 'change-me-admin-secret',
  DATA_DIR: backendExisting.DATA_DIR || './data',
  NODE_ENV: backendExisting.NODE_ENV || 'production'
})

// 2) 管理后台
writeEnv('admin/.env.production', { VITE_API_BASE_URL: api })
writeEnv('admin/.env.development', { VITE_API_BASE_URL: devApi })

// 3) App（H5 / Android）
writeEnv('app/.env.production', { VITE_API_BASE_URL: api })
writeEnv('app/.env.development', { VITE_API_BASE_URL: devApi })

// ---------------- 另存 official 档位（便于对比，不参与构建） ----------------
const official = pick('official')
if (official && official.apiBaseUrl) {
  const oApi = norm(official.apiBaseUrl)
  writeEnv('app/.env.official', {
    VITE_API_BASE_URL: oApi,
    VITE_IMAGE_BASE_URL: norm(official.imageBaseUrl),
    VITE_WEB_BASE_URL: norm(official.webBaseUrl),
    VITE_COLLECT_BASE_URL: norm(official.collectBaseUrl)
  })
  writeEnv('admin/.env.official', { VITE_API_BASE_URL: oApi })
}

console.log(`\n业务域名已同步完成：档位=${profileName} API=${api}`)
