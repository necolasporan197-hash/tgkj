/**
 * 统一响应体：{ code: 0, msg: 'ok', data: {...} }
 * 硬约束：所有接口必须走这里，禁止直接 res.json({...})。
 */
export const CODE = {
  OK: 0,
  PARAM: 1001, // 参数错误
  UNAUTHORIZED: 1002, // 未登录 / token 失效
  FORBIDDEN: 1003, // 无权限
  NOT_FOUND: 1004, // 资源不存在
  CONFLICT: 1005, // 状态冲突
  BIZ: 1006, // 业务规则不满足
  LOGIN_FAILED: 1007, // 账号或密码错误
  BANNED: 1008, // 账号被禁用
  AUDIT_PENDING: 1009, // 资料审核中
  SERVER: 5000 // 服务器内部错误
}

export function ok(res, data = null, msg = 'ok') {
  return res.json({ code: CODE.OK, msg, data })
}

export function fail(res, code = CODE.BIZ, msg = '操作失败', data = null, httpStatus = 200) {
  return res.status(httpStatus).json({ code, msg, data })
}

/** 业务异常，交由 errorHandler 统一转成响应体 */
export class BizError extends Error {
  constructor(code, msg, httpStatus = 200) {
    super(msg)
    this.code = code
    this.httpStatus = httpStatus
  }
}

export const paramError = (msg = '参数错误') => new BizError(CODE.PARAM, msg)
export const notFound = (msg = '资源不存在') => new BizError(CODE.NOT_FOUND, msg)
export const bizError = (msg = '操作失败') => new BizError(CODE.BIZ, msg)
export const forbidden = (msg = '无权限操作') => new BizError(CODE.FORBIDDEN, msg)

/**
 * 包装 async 路由处理器，异常自动 next(err)。
 */
export const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

/** 分页结果标准结构 */
export const pageResult = (list, total, page, pageSize) => ({
  list,
  total,
  page,
  pageSize,
  totalPages: Math.ceil(total / (pageSize || 1))
})
