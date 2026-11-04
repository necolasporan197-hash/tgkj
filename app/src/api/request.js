/**
 * 统一请求层
 * - Base Path 固定 /api（硬约束）
 * - 响应体统一 { code, msg, data }，code === 0 时 resolve(data)，否则 reject(Error)
 * - code === 1002（未登录/令牌失效）自动调用 /auth/refresh 续期并重放一次
 */
const RAW_BASE = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
export const API_BASE = `${RAW_BASE}/api`
/** 上传资源（/uploads/xxx）所在站点，用于把相对地址拼成绝对地址 */
export const FILE_BASE = RAW_BASE

const TOKEN_KEY = 'tggy_token'

export const getToken = () => uni.getStorageSync(TOKEN_KEY) || ''
export const setToken = (t) => uni.setStorageSync(TOKEN_KEY, t || '')
export const clearToken = () => uni.removeStorageSync(TOKEN_KEY)

let toastLockedUntil = 0
function toast(msg) {
  const t = Date.now()
  if (t < toastLockedUntil) return
  toastLockedUntil = t + 1200
  uni.showToast({ title: msg || '请求失败', icon: 'none', duration: 1800 })
}

/** 把后端返回的相对资源地址补全为可直接访问的绝对地址 */
export function mediaUrl(u) {
  if (!u) return ''
  if (/^(https?:)?\/\//.test(u) || u.startsWith('data:')) return u
  return `${FILE_BASE}${u.startsWith('/') ? '' : '/'}${u}`
}

function raw({ url, method = 'GET', data = {}, timeout = 30000 }) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: API_BASE + url,
      method,
      data,
      timeout,
      header: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
      },
      success: (res) => resolve(res),
      fail: (err) => reject(err)
    })
  })
}

/** 令牌续期（并发去重） */
let refreshTask = null
function refreshToken() {
  if (refreshTask) return refreshTask
  refreshTask = raw({ url: '/auth/refresh', method: 'POST', data: { token: getToken() } })
    .then((res) => {
      const body = res.data
      if (body && body.code === 0 && body.data?.token) {
        setToken(body.data.token)
        return body.data.token
      }
      throw new Error('refresh failed')
    })
    .finally(() => {
      refreshTask = null
    })
  return refreshTask
}

function gotoLogin() {
  clearToken()
  const pages = getCurrentPages()
  const cur = pages.length ? `/${pages[pages.length - 1].route}` : ''
  if (cur.includes('pages/login/')) return
  uni.reLaunch({ url: '/pages/login/login' })
}

/**
 * 发起请求
 * @param {object} options { url, method, data, timeout, silent, retry }
 * @returns {Promise<any>} 已解包的 data
 */
export async function request(options) {
  let res
  try {
    res = await raw(options)
  } catch (e) {
    if (!options.silent) toast('网络异常，请检查网络后重试')
    throw e
  }

  const body = res.data
  if (!body || typeof body !== 'object' || !('code' in body)) {
    return body
  }
  if (body.code === 0) return body.data
  if (body.code === 1002 && options.retry !== false) {
    try {
      await refreshToken()
      return await request({ ...options, retry: false })
    } catch (e) {
      gotoLogin()
      throw new Error(body.msg || '登录已失效')
    }
  }
  if (body.code === 1002) {
    gotoLogin()
  }
  if (!options.silent) toast(body.msg)
  const err = new Error(body.msg || '请求失败')
  err.code = body.code
  throw err
}

export const get = (url, data, opt = {}) => request({ url, method: 'GET', data, ...opt })
export const post = (url, data, opt = {}) => request({ url, method: 'POST', data, ...opt })
export const put = (url, data, opt = {}) => request({ url, method: 'PUT', data, ...opt })
export const del = (url, data, opt = {}) => request({ url, method: 'DELETE', data, ...opt })

/**
 * 上传文件：把本地图片/视频读成 base64 dataURL 后提交（与后端 /api/upload 约定一致）
 * @param {string} filePath 本地临时路径
 * @param {'image'|'video'|'audio'} type
 */
export async function uploadFile(filePath, type = 'image') {
  const dataUrl = await toDataUrl(filePath)
  return post('/upload', { data: dataUrl, type }, { timeout: 120000 })
}

function toDataUrl(filePath) {
  return new Promise((resolve, reject) => {
    // #ifdef H5
    // H5 下 filePath 可能是 blob: 或 base64，统一走 uni.getFileSystemManager 不可用分支
    // 优先用 fetch 转 base64
    fetch(filePath)
      .then((r) => r.blob())
      .then((blob) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      .catch(reject)
    return
    // #endif
    // eslint-disable-next-line no-unreachable
    uni.getFileSystemManager().readFile({
      filePath,
      encoding: 'base64',
      success: (r) => {
        const ext = (filePath.split('.').pop() || 'png').toLowerCase()
        const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'mp4' ? 'video/mp4' : `image/${ext}`
        resolve(`data:${mime};base64,${r.data}`)
      },
      fail: reject
    })
  })
}

export { toast }
export default request
