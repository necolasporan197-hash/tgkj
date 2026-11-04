/**
 * 管理端系统：管理员 / 角色权限 / 系统配置 / 操作日志 / 登录日志 / 演示数据
 * Base: /api/admin/system
 */
import { Router } from 'express'
import { all, get, run, db, DB_FILE } from '../../db/sqlite.js'
import { now } from '../../utils/datetime.js'
import { h, ok, pageResult, paramError, notFound, CODE, BizError } from '../../utils/response.js'
import { hashPassword } from '../../utils/crypto.js'
import { adminLog } from '../../middleware/error.js'
import { clearDemoData, seedDemoUsers, demoStats } from '../../db/seed.js'
import { existsSync, statSync } from 'node:fs'

const router = Router()

const pg = (q) => {
  const page = Math.max(1, Number(q.page) || 1)
  const pageSize = Math.min(100, Number(q.pageSize) || 20)
  return { page, pageSize, offset: (page - 1) * pageSize }
}

// ---------------- 管理员 ----------------
router.get(
  '/admins',
  h((req, res) =>
    ok(
      res,
      all(
        `SELECT a.id, a.username, a.name, a.status, a.last_login_at, a.created_at, r.name AS roleName, a.role_id
         FROM admins a LEFT JOIN roles r ON r.id=a.role_id ORDER BY a.id`
      )
    )
  )
)

router.post(
  '/admins',
  h((req, res) => {
    const { username, password, name = '', roleId = null } = req.body || {}
    if (!username || !password) throw paramError('账号与密码必填')
    if (String(password).length < 6) throw paramError('密码至少 6 位')
    if (get('SELECT id FROM admins WHERE username=?', [username])) throw new BizError(CODE.CONFLICT, '该账号已存在')
    const r = run(`INSERT INTO admins (username, password_hash, name, role_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`, [
      username,
      hashPassword(password),
      name,
      roleId ? Number(roleId) : null,
      now()
    ])
    adminLog(req, 'system', 'admin-create', r.lastInsertRowid, username)
    return ok(res, { id: Number(r.lastInsertRowid) }, '已新增管理员')
  })
)

router.put(
  '/admins/:id',
  h((req, res) => {
    const id = Number(req.params.id)
    if (!get('SELECT id FROM admins WHERE id=?', [id])) throw notFound('管理员不存在')
    const sets = []
    const vals = []
    if (req.body?.name !== undefined) {
      sets.push('name=?')
      vals.push(req.body.name)
    }
    if (req.body?.roleId !== undefined) {
      sets.push('role_id=?')
      vals.push(req.body.roleId ? Number(req.body.roleId) : null)
    }
    if (req.body?.status !== undefined) {
      sets.push('status=?')
      vals.push(req.body.status)
    }
    if (req.body?.password) {
      sets.push('password_hash=?')
      vals.push(hashPassword(req.body.password))
    }
    if (!sets.length) throw paramError('没有需要更新的字段')
    run(`UPDATE admins SET ${sets.join(',')} WHERE id=?`, [...vals, id])
    adminLog(req, 'system', 'admin-update', id, JSON.stringify({ ...req.body, password: undefined }))
    return ok(res, null, '已保存')
  })
)

router.delete(
  '/admins/:id',
  h((req, res) => {
    const id = Number(req.params.id)
    if (id === req.admin.id) throw new BizError(CODE.BIZ, '不能删除当前登录账号')
    run('DELETE FROM admins WHERE id=?', [id])
    adminLog(req, 'system', 'admin-delete', id, '删除管理员')
    return ok(res, null, '已删除')
  })
)

// ---------------- 角色 ----------------
router.get('/roles', h((req, res) => ok(res, all('SELECT * FROM roles ORDER BY id'))))

router.post(
  '/roles',
  h((req, res) => {
    const { name, code, permissions = [], remark = '' } = req.body || {}
    if (!name || !code) throw paramError('角色名称与标识必填')
    if (get('SELECT id FROM roles WHERE code=?', [code])) throw new BizError(CODE.CONFLICT, '角色标识已存在')
    const r = run(`INSERT INTO roles (name, code, permissions, remark, created_at) VALUES (?,?,?,?,?)`, [
      name,
      code,
      JSON.stringify(permissions),
      remark,
      now()
    ])
    adminLog(req, 'system', 'role-create', r.lastInsertRowid, code)
    return ok(res, { id: Number(r.lastInsertRowid) }, '已新增角色')
  })
)

router.put(
  '/roles/:id',
  h((req, res) => {
    const id = Number(req.params.id)
    run(`UPDATE roles SET name=?, permissions=?, remark=? WHERE id=?`, [
      req.body?.name ?? '',
      JSON.stringify(req.body?.permissions || []),
      req.body?.remark ?? '',
      id
    ])
    adminLog(req, 'system', 'role-update', id, JSON.stringify(req.body))
    return ok(res, null, '已保存')
  })
)

router.delete(
  '/roles/:id',
  h((req, res) => {
    const id = Number(req.params.id)
    if (get('SELECT COUNT(*) c FROM admins WHERE role_id=?', [id]).c > 0) {
      throw new BizError(CODE.CONFLICT, '该角色下仍有管理员，无法删除')
    }
    run('DELETE FROM roles WHERE id=?', [id])
    adminLog(req, 'system', 'role-delete', id, '删除角色')
    return ok(res, null, '已删除')
  })
)

/** 可分配权限清单（前端渲染勾选框） */
router.get(
  '/permissions',
  h((req, res) =>
    ok(res, [
      { code: 'user:read', name: '用户查看' },
      { code: 'user:write', name: '用户编辑' },
      { code: 'user:audit', name: '用户审核' },
      { code: 'moment:read', name: '动态查看' },
      { code: 'moment:audit', name: '动态审核' },
      { code: 'verification:audit', name: '认证审核' },
      { code: 'withdraw:read', name: '提现查看' },
      { code: 'withdraw:audit', name: '提现审核' },
      { code: 'finance:read', name: '财务查看' },
      { code: 'finance:write', name: '财务操作' },
      { code: 'operation:write', name: '运营配置' },
      { code: 'system:write', name: '系统管理' },
      { code: 'message:send', name: '发送消息' }
    ])
  )
)

// ---------------- 系统配置 ----------------
router.get(
  '/configs',
  h((req, res) => ok(res, all('SELECT * FROM configs ORDER BY key')))
)

router.put(
  '/configs',
  h((req, res) => {
    const items = req.body?.items || []
    if (!items.length) throw paramError('没有需要保存的配置')
    items.forEach((it) => {
      if (!it.key) return
      const exists = get('SELECT key FROM configs WHERE key=?', [it.key])
      if (exists) run('UPDATE configs SET value=?, updated_at=? WHERE key=?', [String(it.value ?? ''), now(), it.key])
      else run(`INSERT INTO configs (key, value, remark, updated_at) VALUES (?,?,?,?)`, [it.key, String(it.value ?? ''), it.remark || '', now()])
    })
    adminLog(req, 'system', 'config-update', items.length, JSON.stringify(items).slice(0, 200))
    return ok(res, null, '配置已保存')
  })
)

router.post(
  '/configs',
  h((req, res) => {
    const { key, value = '', remark = '' } = req.body || {}
    if (!key) throw paramError('配置键必填')
    run(`INSERT INTO configs (key, value, remark, updated_at) VALUES (?,?,?,?)
         ON CONFLICT(key) DO UPDATE SET value=excluded.value, remark=excluded.remark, updated_at=excluded.updated_at`, [
      key,
      String(value),
      remark,
      now()
    ])
    adminLog(req, 'system', 'config-create', key, String(value))
    return ok(res, null, '已保存')
  })
)

router.delete(
  '/configs/:key',
  h((req, res) => {
    run('DELETE FROM configs WHERE key=?', [req.params.key])
    adminLog(req, 'system', 'config-delete', req.params.key, '删除配置')
    return ok(res, null, '已删除')
  })
)

// ---------------- 日志 ----------------
router.get(
  '/logs/admin',
  h((req, res) => {
    const { page, pageSize, offset } = pg(req.query)
    const params = []
    const cond = []
    if (req.query.module) {
      cond.push('module=?')
      params.push(req.query.module)
    }
    if (req.query.keyword) {
      cond.push('(action LIKE ? OR target LIKE ? OR admin_name LIKE ?)')
      params.push(`%${req.query.keyword}%`, `%${req.query.keyword}%`, `%${req.query.keyword}%`)
    }
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : ''
    const list = all(`SELECT * FROM admin_logs ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, pageSize, offset])
    const total = get(`SELECT COUNT(*) c FROM admin_logs ${where}`, params).c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

router.get(
  '/logs/login',
  h((req, res) => {
    const { page, pageSize, offset } = pg(req.query)
    const params = []
    let where = ''
    if (req.query.keyword) {
      where = 'WHERE phone LIKE ?'
      params.push(`%${req.query.keyword}%`)
    }
    const list = all(`SELECT * FROM login_logs ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, pageSize, offset])
    const total = get(`SELECT COUNT(*) c FROM login_logs ${where}`, params).c
    return ok(res, pageResult(list, total, page, pageSize))
  })
)

// ---------------- 演示数据 ----------------
router.get('/demo/stats', h((req, res) => ok(res, demoStats())))

/** 一键生成仿真种子数据（支持指定乘务员/用户数量） */
router.post(
  '/demo/seed',
  h((req, res) => {
    const count = Math.min(50, Math.max(1, Number(req.body?.count) || 10))
    const r = seedDemoUsers(count)
    adminLog(req, 'system', 'demo-seed', count, JSON.stringify(r))
    return ok(res, { ...r, stats: demoStats() }, `已生成 ${count} 女 + ${count} 男 演示数据`)
  })
)

/** 一键清空仿真数据 */
router.post(
  '/demo/clear',
  h((req, res) => {
    clearDemoData()
    adminLog(req, 'system', 'demo-clear', '', '清空演示数据')
    return ok(res, demoStats(), '演示数据已清空')
  })
)

// ---------------- 数据库信息 ----------------
router.get(
  '/db/info',
  h((req, res) => {
    const size = existsSync(DB_FILE) ? statSync(DB_FILE).size : 0
    const tables = all(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`)
    return ok(res, {
      file: DB_FILE,
      sizeKb: Math.round(size / 1024),
      tables: tables.map((t) => ({ name: t.name, rows: get(`SELECT COUNT(*) c FROM ${t.name}`).c }))
    })
  })
)

/** 手动 VACUUM 压缩 */
router.post(
  '/db/vacuum',
  h((req, res) => {
    db.exec('VACUUM')
    adminLog(req, 'system', 'db-vacuum', '', 'VACUUM')
    return ok(res, null, '数据库已压缩')
  })
)

export default router
