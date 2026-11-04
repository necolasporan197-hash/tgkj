/**
 * 管理端认证：登录 / 我的信息 / 修改密码
 * Base: /api/admin/auth
 */
import { Router } from 'express'
import { get, run } from '../../db/sqlite.js'
import { now } from '../../utils/datetime.js'
import { h, ok, CODE, BizError } from '../../utils/response.js'
import { signAdminToken, verifyPassword, hashPassword } from '../../utils/crypto.js'
import { adminRequired } from '../../middleware/auth.js'
import { adminLog, clientIp } from '../../middleware/error.js'

const router = Router()

router.post(
  '/login',
  h((req, res) => {
    const { username, password } = req.body || {}
    if (!username || !password) throw new BizError(CODE.PARAM, '请输入账号与密码')
    const admin = get('SELECT * FROM admins WHERE username = ?', [username])
    if (!admin || !verifyPassword(password, admin.password_hash)) {
      run(`INSERT INTO admin_logs (admin_id, admin_name, module, action, detail, ip, created_at) VALUES (?,?,?,?,?,?,?)`, [
        admin?.id ?? null,
        String(username),
        'auth',
        'login',
        '登录失败',
        clientIp(req),
        now()
      ])
      throw new BizError(CODE.LOGIN_FAILED, '账号或密码错误')
    }
    if (admin.status !== 'active') throw new BizError(CODE.BANNED, '该管理员已被禁用')
    run('UPDATE admins SET last_login_at = ? WHERE id = ?', [now(), admin.id])
    const role = admin.role_id ? get('SELECT * FROM roles WHERE id=?', [admin.role_id]) : null
    const token = signAdminToken({ aid: admin.id, username: admin.username })
    req.admin = admin
    adminLog(req, 'auth', 'login', admin.username, '登录成功')
    return ok(
      res,
      {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
          roleName: role?.name || '未分配',
          permissions: role ? JSON.parse(role.permissions || '[]') : []
        }
      },
      '登录成功'
    )
  })
)

router.get(
  '/profile',
  adminRequired,
  h((req, res) => {
    const role = req.admin.role_id ? get('SELECT * FROM roles WHERE id=?', [req.admin.role_id]) : null
    return ok(res, {
      id: req.admin.id,
      username: req.admin.username,
      name: req.admin.name,
      roleName: role?.name || '未分配',
      permissions: req.permissions,
      lastLoginAt: req.admin.last_login_at
    })
  })
)

router.post(
  '/password',
  adminRequired,
  h((req, res) => {
    const { oldPassword, newPassword } = req.body || {}
    if (!verifyPassword(oldPassword, req.admin.password_hash)) throw new BizError(CODE.PARAM, '原密码不正确')
    if (!newPassword || String(newPassword).length < 6) throw new BizError(CODE.PARAM, '新密码至少 6 位')
    run('UPDATE admins SET password_hash = ? WHERE id = ?', [hashPassword(newPassword), req.admin.id])
    adminLog(req, 'auth', 'password', req.admin.username, '修改密码')
    return ok(res, null, '密码修改成功')
  })
)

router.post(
  '/logout',
  adminRequired,
  h((req, res) => {
    adminLog(req, 'auth', 'logout', req.admin.username, '退出登录')
    return ok(res, null, '已退出登录')
  })
)

export default router
